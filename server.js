import express from 'express';
import axios from 'axios';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sgMail from '@sendgrid/mail';

// Importar configuración dinámica del formulario
import { OPERATIONAL_FIELDS_MAP, ADVISOR_TYPES, CHALLENGE_OPTIONS } from './config-form-dynamics.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Configurar SendGrid
if (process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    console.log('✅ SendGrid configurado');
} else {
    console.warn('⚠️  SENDGRID_API_KEY no configurada');
}

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.get('/', (req, res) => {
    const formularioPath = path.join(__dirname, 'formulario-diagnostico-integrado.html');
    const indexPath = path.join(__dirname, 'public', 'index.html');

    if (fs.existsSync(formularioPath)) {
        console.log('✅ Sirviendo: formulario-diagnostico-integrado.html');
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.sendFile(formularioPath);
    } else if (fs.existsSync(indexPath)) {
        console.log('✅ Sirviendo: public/index.html');
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.sendFile(indexPath);
    } else {
        console.error('❌ No se encontró formulario HTML');
        res.json({ message: 'ACP Backend operativo', status: 'running' });
    }
});

app.get('/api/', (req, res) => {
    res.json({ message: 'ACP Backend operativo', status: 'running' });
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.post('/api/submit-lead', async (req, res) => {
    const body = req.body;
    const requiredFields = ['name', 'email', 'phone', 'company', 'sector', 'monthly_sales', 'margin', 'active_clients', 'top_costs', 'main_channel', 'main_problem', 'goal_6m', 'plan', 'advisor_type', 'main_challenge'];

           for (const field of requiredFields) {
                 if (!body[field] && body[field] !== 0 && body[field] !== '0') {
                         return res.status(400).json({ error: `Falta campo: ${field}` });
                 }
           }

           // Validar sector personalizado si es "otro"
           if (body.sector === 'otro' && !body.industry_other) {
                 return res.status(400).json({ error: 'Debe especificar su rubro personalizado' });
           }

           // Validar que advisor_type sea válido
           const validAdvisors = ADVISOR_TYPES.map(a => a.value);
           if (!validAdvisors.includes(body.advisor_type)) {
                 return res.status(400).json({ error: 'Tipo de asesor inválido' });
           }

           // Validar que main_challenge sea válido
           const validChallenges = CHALLENGE_OPTIONS.map(c => c.value);
           if (!validChallenges.includes(body.main_challenge)) {
                 return res.status(400).json({ error: 'Desafío principal inválido' });
           }

           // Validar desafío personalizado si es "otro"
           if (body.main_challenge === 'otro' && !body.main_challenge_other) {
                 return res.status(400).json({ error: 'Debe especificar su desafío principal' });
           }

           // Validar campos operacionales según sector
           const operationalFields = body.operational_fields || {};
           const expectedFields = OPERATIONAL_FIELDS_MAP[body.sector] || [];
           for (const field of expectedFields) {
                 if (field.required && !operationalFields[field.key] && operationalFields[field.key] !== 0) {
                         return res.status(400).json({ error: `Falta campo operacional: ${field.label}` });
                 }
           }

           const leadId = 'lead-' + Math.random().toString(36).substr(2, 9);
    const lead = {
          lead_id: leadId,
          ...body,
          industry_other: body.industry_other || null,
          advisor_type: body.advisor_type,
          operational_fields: body.operational_fields ? JSON.stringify(body.operational_fields) : null,
          main_challenge_other: body.main_challenge_other || null,
          created_at: new Date().toISOString()
    };

           try {
                 const mpResponse = await createMercadoPagoPreference(lead);
                 lead.checkout_url = mpResponse.data.init_point;
           } catch (e) {
                 console.error('MP Error:', e.message);
           }

           // Enviar email al asesor
           try {
               await sendLeadEmail(lead);
               console.log('✅ Email enviado a asesor.pac@gmail.com');
           } catch (e) {
               console.error('❌ Error enviando email:', e.message);
           }

           return res.status(200).json({
                 success: true,
                 lead_id: leadId,
                 checkout_url: lead.checkout_url || 'https://checkout.mercadopago.com'
           });
});

async function sendLeadEmail(lead) {
    const from = process.env.SENDGRID_FROM_EMAIL || 'sistema@acp-diagnosticos.cl';
    const to = 'asesor.pac@gmail.com';

    const subject = `🔔 Nuevo Lead: ${lead.company} - ${lead.plan}`;

    // Obtener labels dinámicos
    const sectorLabel = lead.sector === 'otro' ? lead.industry_other : lead.sector;
    const advisorTypeLabel = ADVISOR_TYPES.find(a => a.value === lead.advisor_type)?.label || lead.advisor_type;
    const challengeLabel = CHALLENGE_OPTIONS.find(c => c.value === lead.main_challenge)?.label || lead.main_challenge;

    // Parsear campos operacionales
    let operationalFieldsHTML = '';
    if (lead.operational_fields) {
          try {
                const opFields = typeof lead.operational_fields === 'string' ? JSON.parse(lead.operational_fields) : lead.operational_fields;
                const expectedFields = OPERATIONAL_FIELDS_MAP[lead.sector] || [];

                operationalFieldsHTML = '<h3>Información Operacional:</h3><ul>';
                for (const field of expectedFields) {
                      const value = opFields[field.key];
                      if (value !== undefined && value !== null) {
                            operationalFieldsHTML += `<li><strong>${field.label}:</strong> ${value}</li>`;
                      }
                }
                operationalFieldsHTML += '</ul>';
          } catch (e) {
                console.error('Error parsing operational fields:', e);
          }
    }

    const html = `
        <h2>Nuevo Lead Registrado</h2>
        <p><strong>ID del Lead:</strong> ${lead.lead_id}</p>
        <p><strong>Plan:</strong> ${lead.plan.toUpperCase()} ($${lead.plan === 'basico' ? '49.990' : '149.990'})</p>
        <h3>Datos del Cliente:</h3>
        <ul>
            <li><strong>Nombre:</strong> ${lead.name}</li>
            <li><strong>Email:</strong> ${lead.email}</li>
            <li><strong>Teléfono:</strong> ${lead.phone}</li>
            <li><strong>Empresa:</strong> ${lead.company}</li>
            <li><strong>Sector:</strong> ${sectorLabel}</li>
            <li><strong>Tipo de Asesor:</strong> ${advisorTypeLabel}</li>
        </ul>
        <h3>Información Financiera:</h3>
        <ul>
            <li><strong>Ventas Mensuales:</strong> $${lead.monthly_sales}</li>
            <li><strong>Margen de Ganancia:</strong> ${lead.margin}%</li>
            <li><strong>Clientes Activos:</strong> ${lead.active_clients}</li>
        </ul>
        ${operationalFieldsHTML}
        <h3>Situación Actual:</h3>
        <ul>
            <li><strong>Mayor Desafío:</strong> ${lead.main_challenge_other || challengeLabel}</li>
            <li><strong>Costos Principales:</strong> ${lead.top_costs}</li>
            <li><strong>Canal Principal:</strong> ${lead.main_channel}</li>
            <li><strong>Objetivo 6 Meses:</strong> ${lead.goal_6m}</li>
        </ul>
        <p><strong>Fecha:</strong> ${new Date(lead.created_at).toLocaleString('es-CL')}</p>
        <hr>
        <p>Este es un mensaje automático del sistema ACP.</p>
    `;

    const msg = {
        to,
        from,
        subject,
        html
    };

    try {
        await sgMail.send(msg);
        console.log('✅ Email enviado exitosamente a', to);
    } catch (error) {
        console.error('❌ Error en SendGrid:', error.message);
        throw error;
    }
}

async function createMercadoPagoPreference(lead) {
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!accessToken) throw new Error('Falta MERCADOPAGO_ACCESS_TOKEN');

  const basePrices = { basico: 49900, premium: 149900 };
    const basePrice = basePrices[lead.plan] || 49900;

  const response = await axios.post(
        'https://api.mercadopago.com/checkout/preferences',
    {
            items: [{ title: `Diagnostico ${lead.plan}`, quantity: 1, currency_id: 'CLP', unit_price: basePrice }],
            back_urls: { success: 'https://acp.example.com/success' }
    },
    { headers: { 'Authorization': `Bearer ${accessToken}` } }
      );
    return response.data;
}

app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});