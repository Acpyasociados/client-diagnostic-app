import express from 'express';
import axios from 'axios';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import crypto from 'crypto';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Base de datos en memoria (sin sqlite3)
const leadsStore = {};

// Inicializar tabla de leads
function initializeDB() {
  db.run(`
    CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id TEXT UNIQUE NOT NULL,
      client_token TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'lead_creado',
      payment_status TEXT DEFAULT 'pending',
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      company TEXT NOT NULL,
      sector TEXT NOT NULL,
      monthly_sales INTEGER,
      margin REAL,
      active_clients INTEGER,
      top_costs TEXT,
      main_channel TEXT,
      main_problem TEXT,
      goal_6m TEXT,
      plan TEXT,
      discount_percentage REAL DEFAULT 0,
      final_price INTEGER,
      checkout_id TEXT,
      checkout_url TEXT,
      questionnaire_sent INTEGER DEFAULT 0,
      questionnaire_completed INTEGER DEFAULT 0,
      draft_generated INTEGER DEFAULT 0,
      reviewed_by_human INTEGER DEFAULT 0,
      delivered_at DATETIME
    )
  `, (err) => {
    if (err) console.error('Error creating table:', err.message);
    else console.log('✅ Leads table ready');
  });
}

// Rutas
app.get('/', (req, res) => {
  res.json({ message: 'ACP Backend operativo', status: 'running' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Endpoint principal: submit-lead
app.post('/api/submit-lead', async (req, res) => {
  console.log('=== SUBMIT-LEAD HANDLER START ===');
  console.log('Headers:', req.headers['content-type']);
  console.log('Body keys:', Object.keys(req.body).length);

  try {
    const body = req.body;
    const requiredFields = [
      'name', 'email', 'phone', 'company', 'sector',
      'monthly_sales', 'margin', 'active_clients', 'top_costs',
      'main_channel', 'main_problem', 'goal_6m', 'plan'
    ];

    // Validar campos requeridos
    for (const field of requiredFields) {
      if (!body[field] && body[field] !== 0 && body[field] !== '0') {
        console.error(`Missing field: ${field}`);
        return res.status(400).json({ error: `Falta campo requerido: ${field}` });
      }
    }

    // Generar IDs únicos
    const leadId = generateUUID();
    const clientToken = generateToken();
    const createdAt = new Date().toISOString();

    // Precios base
    const basePrices = {
      basico: Number(process.env.PRICE_BASIC_CLP || 49900),
      premium: Number(process.env.PRICE_PREMIUM_CLP || 149900)
    };

    const plan = body.plan || 'basico';
    const discount = Number(body.discountPercentage || 0);
    const basePrice = basePrices[plan] || basePrices.basico;
    const finalPrice = Number(body.finalPrice) || Math.round(basePrice * (100 - discount) / 100);

    // Datos del lead
    const lead = {
      lead_id: leadId,
      client_token: clientToken,
      created_at: createdAt,
      status: 'lead_creado',
      payment_status: 'pending',
      name: body.name,
      email: body.email,
      phone: body.phone,
      company: body.company,
      sector: body.sector,
      monthly_sales: body.monthly_sales,
      margin: body.margin,
      active_clients: body.active_clients,
      top_costs: body.top_costs,
      main_channel: body.main_channel,
      main_problem: body.main_problem,
      goal_6m: body.goal_6m,
      plan: plan,
      discount_percentage: discount,
      final_price: finalPrice,
      questionnaire_sent: 0,
      questionnaire_completed: 0,
      draft_generated: 0,
      reviewed_by_human: 0,
      delivered_at: null
    };

    // Guardar en BD
    await saveLead(lead);
    console.log('✅ Lead saved to database:', leadId);

    // Crear preferencia en Mercado Pago
    const mpResponse = await createMercadoPagoPreference(lead);
    if (!mpResponse.ok) {
      throw new Error(`Mercado Pago error: ${mpResponse.error}`);
    }

    lead.checkout_id = mpResponse.data.id;
    lead.checkout_url = mpResponse.data.init_point;

    // Actualizar con datos de MP
    await updateLead(leadId, { checkout_id: lead.checkout_id, checkout_url: lead.checkout_url });
    console.log('✅ Lead updated with MP data');

    // Enviar email al asesor
    try {
      await sendAdvisorEmail(lead);
      console.log('✅ Email sent to advisor');
    } catch (emailErr) {
      console.error('⚠️ Email error (non-fatal):', emailErr.message);
    }

    console.log('✅ Lead submission successful:', leadId);
    return res.status(200).json({
      success: true,
      lead_id: leadId,
      client_token: clientToken,
      checkout_url: mpResponse.data.init_point,
      final_price: lead.final_price
    });

  } catch (error) {
    console.error('❌ Error in lead processing:', error.message);
    return res.status(500).json({
      error: 'Error processing lead: ' + error.message
    });
  }
});

// Endpoint para validar cupón
app.post('/api/validate-coupon', (req, res) => {
  const { coupon, plan } = req.body;

  if (!coupon || !plan) {
    return res.status(400).json({ error: 'Falta cupón o plan' });
  }

  // Base de cupones disponibles
  const coupons = {
    'TEST100': { valid: true, discount: 100, plans: ['basico', 'premium'] },
    'DEMO100': { valid: true, discount: 100, plans: ['basico', 'premium'] },
    'PRUEBA100': { valid: true, discount: 100, plans: ['basico', 'premium'] },
    'TESTBASICO': { valid: true, discount: 100, plans: ['basico'] },
    'TESTPREMIUM': { valid: true, discount: 100, plans: ['premium'] },
    'DESC50': { valid: true, discount: 50, plans: ['basico', 'premium'] },
    'STARTUP30': { valid: true, discount: 30, plans: ['premium'] },
  };

  const couponKey = coupon.toUpperCase().trim();
  const couponData = coupons[couponKey];

  if (!couponData) {
    return res.status(400).json({
      valid: false,
      error: 'Cupón inválido o expirado'
    });
  }

  if (!couponData.plans.includes(plan)) {
    return res.status(400).json({
      valid: false,
      error: `Este cupón no aplica al plan ${plan.toUpperCase()}`
    });
  }

  // Calcular precio final
  const basePrices = {
    'basico': 49900,
    'premium': 149900
  };

  const basePrice = basePrices[plan];
  const discount = (basePrice * couponData.discount) / 100;
  const finalPrice = Math.max(0, basePrice - discount);

  return res.json({
    valid: true,
    discount_percentage: couponData.discount,
    base_price: basePrice,
    discount_amount: discount,
    final_price: finalPrice,
    message: `Cupón válido - ${couponData.discount}% descuento`,
    coupon_code: couponKey
  });
});

// Endpoint para ver leads
app.get('/api/leads', (req, res) => {
  db.all('SELECT * FROM leads ORDER BY created_at DESC', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ leads: rows || [] });
  });
});

// Funciones auxiliares
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function generateToken() {
  return require('crypto').randomBytes(18).toString('hex');
}

function saveLead(lead) {
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO leads (
        lead_id, client_token, created_at, status, payment_status,
        name, email, phone, company, sector, monthly_sales, margin,
        active_clients, top_costs, main_channel, main_problem, goal_6m,
        plan, discount_percentage, final_price
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
      lead.lead_id, lead.client_token, lead.created_at, lead.status, lead.payment_status,
      lead.name, lead.email, lead.phone, lead.company, lead.sector,
      lead.monthly_sales, lead.margin, lead.active_clients, lead.top_costs,
      lead.main_channel, lead.main_problem, lead.goal_6m, lead.plan,
      lead.discount_percentage, lead.final_price
    ];
    db.run(sql, values, function(err) {
      if (err) reject(err);
      else resolve(this.lastID);
    });
  });
}

function updateLead(leadId, data) {
  return new Promise((resolve, reject) => {
    const fields = Object.keys(data).map(k => `${k} = ?`).join(', ');
    const values = [...Object.values(data), leadId];
    db.run(`UPDATE leads SET ${fields} WHERE lead_id = ?`, values, function(err) {
      if (err) reject(err);
      else resolve();
    });
  });
}

async function createMercadoPagoPreference(lead) {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  const siteUrl = process.env.SITE_URL || 'https://acp.example.com';

  if (!accessToken) {
    throw new Error('Missing MERCADOPAGO_ACCESS_TOKEN');
  }

  const preferencePayload = {
    items: [{
      title: `Diagnóstico ${lead.plan} - ${lead.company}`,
      quantity: 1,
      currency_id: 'CLP',
      unit_price: lead.final_price
    }],
    metadata: {
      lead_id: lead.lead_id,
      client_email: lead.email,
      plan: lead.plan,
      discount: lead.discount_percentage
    },
    back_urls: {
      success: `${siteUrl}/success.html?lead_id=${lead.lead_id}`,
      failure: `${siteUrl}/cancel.html?lead_id=${lead.lead_id}`,
      pending: `${siteUrl}/success.html?lead_id=${lead.lead_id}`
    },
    auto_return: 'approved',
    notification_url: `${siteUrl}/api/mercadopago-webhook`
  };

  try {
    const response = await axios.post(
      'https://api.mercadopago.com/checkout/preferences',
      preferencePayload,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return { ok: true, data: response.data };
  } catch (error) {
    console.error('Mercado Pago error:', error.response?.data || error.message);
    return { ok: false, error: error.response?.data?.message || error.message };
  }
}

async function sendAdvisorEmail(lead) {
  const sendgridKey = process.env.SENDGRID_API_KEY;
  const advisorEmail = process.env.ADVISOR_EMAIL || 'asesor.pac@gmail.com';

  if (!sendgridKey) {
    throw new Error('Missing SENDGRID_API_KEY');
  }

  const emailContent = `
    <h2>Nuevo Lead - ${lead.company}</h2>
    <p><strong>Nombre:</strong> ${lead.name}</p>
    <p><strong>Email:</strong> ${lead.email}</p>
    <p><strong>Teléfono:</strong> ${lead.phone}</p>
    <p><strong>Rubro:</strong> ${lead.sector}</p>
    <p><strong>Ventas Mensuales:</strong> $${Number(lead.monthly_sales).toLocaleString('es-CL')}</p>
    <p><strong>Plan:</strong> ${lead.plan.toUpperCase()}</p>
    <p><strong>Precio Final:</strong> $${lead.final_price.toLocaleString('es-CL')}</p>
    <p><strong>Link Checkout:</strong> <a href="${lead.checkout_url}">Ver pago</a></p>
    <p><strong>ID Lead:</strong> ${lead.lead_id}</p>
  `;

  try {
    await axios.post(
      'https://api.sendgrid.com/v3/mail/send',
      {
        personalizations: [{
          to: [{ email: advisorEmail }],
          subject: `Nuevo Lead: ${lead.company}`
        }],
        from: { email: 'noreply@acp.cl', name: 'ACP Diagnóstico' },
        content: [{ type: 'text/html', value: emailContent }]
      },
      {
        headers: {
          'Authorization': `Bearer ${sendgridKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('SendGrid error:', error.response?.data || error.message);
    throw error;
  }
}

// Error handling
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 ACP Backend running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
