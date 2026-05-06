import crypto from 'crypto';
import { sectorLabels } from './_lib/questions.js';
import { sendAdvisorEmail } from './send-advisor-email.js';

const requiredFields = ['name', 'email', 'phone', 'company', 'sector', 'monthly_sales', 'margin', 'active_clients', 'top_costs', 'main_channel', 'main_problem', 'goal_6m', 'plan'];

// Parse body - sin depender de headers
async function parseBody(event) {
  if (!event.body) return null;

  // Caso 1: String (JSON o form-urlencoded)
  if (typeof event.body === 'string') {
    // Intentar JSON primero
    try {
      return JSON.parse(event.body);
    } catch (e) {
      // Intentar form-urlencoded
      try {
        const params = new URLSearchParams(event.body);
        const obj = {};
        for (const [key, value] of params) {
          obj[key] = value;
        }
        return Object.keys(obj).length > 0 ? obj : null;
      } catch (e2) {
        return null;
      }
    }
  }

  // Caso 2: Objeto (ya parseado por Netlify)
  if (typeof event.body === 'object') {
    return Object.keys(event.body).length > 0 ? event.body : null;
  }

  return null;
}

export default async (event, context) => {
  console.log('=== CREATE-DIAGNOSTIC-ORDER START ===');
  console.log('Method:', event.httpMethod || event.method);
  console.log('Body type:', typeof event.body);

  // Verificar método
  const method = (event.httpMethod || event.method || '').toUpperCase();
  if (method !== 'POST') {
    return json(405, { error: 'Método no permitido' });
  }

  // Parse body
  let body;
  try {
    body = await parseBody(event);
    console.log('Body parsed, keys:', body ? Object.keys(body).length : 0);
  } catch (err) {
    console.error('Parse error:', err.message);
    return json(400, { error: 'Error parseando body: ' + err.message });
  }

  if (!body) {
    console.error('Body is empty or null');
    return json(400, { error: 'No hay contenido en la solicitud' });
  }

  // Validar campos requeridos
  for (const field of requiredFields) {
    if (!body[field]) {
      console.error('Missing field:', field);
      return json(400, { error: `Falta campo requerido: ${field}` });
    }
  }

  // Crear lead
  const leadId = crypto.randomUUID();
  const clientToken = crypto.randomBytes(18).toString('hex');
  const createdAt = new Date().toISOString();

  // Precios
  const prices = {
    basico: Number(process.env.PRICE_BASIC_CLP || 49900),
    premium: Number(process.env.PRICE_PREMIUM_CLP || 149900)
  };

  const plan = body.plan || 'basico';
  const discount = Number(body.discountPercentage || 0);
  const basePrice = prices[plan] || prices.basico;
  const finalPrice = Number(body.finalPrice) || (basePrice * (100 - discount) / 100);

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
    sector_label: sectorLabels[body.sector] || body.sector,
    monthly_sales: body.monthly_sales,
    margin: body.margin,
    active_clients: body.active_clients,
    top_costs: body.top_costs,
    main_channel: body.main_channel,
    main_problem: body.main_problem,
    goal_6m: body.goal_6m,
    plan: plan,
    discount_percentage: discount,
    final_price: Math.round(finalPrice),
    questionnaire_sent: false,
    questionnaire_completed: false,
    draft_generated: false,
    reviewed_by_human: false,
    delivered_at: null
  };

  try {
    // Guardar en Netlify Blobs
    const { getStore } = await import('@netlify/blobs');
    const store = getStore('diagnostic-leads');
    await store.set(leadId, JSON.stringify(lead), { metadata: { email: lead.email } });
    console.log('Lead saved to Blobs:', leadId);

    // Crear preferencia de pago en Mercado Pago
    const mpResponse = await createMercadoPagoPreference(lead);
    if (!mpResponse.ok) {
      throw new Error('Error creating Mercado Pago preference');
    }

    const mpData = mpResponse.mpData;
    lead.checkout_id = mpData.id;
    lead.checkout_url = mpData.init_point;

    // Actualizar lead con datos de pago
    await store.set(leadId, JSON.stringify(lead), { metadata: { email: lead.email } });

    // Enviar email al asesor
    await sendAdvisorEmail(lead);

    console.log('Lead submission successful:', leadId);

    // Retornar en formato esperado por frontend (mercadoPagoUrl)
    return json(200, {
      success: true,
      lead_id: leadId,
      client_token: clientToken,
      mercadoPagoUrl: mpData.init_point,
      checkout_url: mpData.init_point,
      final_price: lead.final_price
    });
  } catch (err) {
    console.error('Error in lead processing:', err.message);
    return json(500, { error: 'Error procesando lead: ' + err.message });
  }
};

async function createMercadoPagoPreference(lead) {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  const siteUrl = process.env.SITE_URL;

  console.log('Creating Mercado Pago preference:');
  console.log('- accessToken exists:', !!accessToken);
  console.log('- siteUrl:', siteUrl);

  if (!accessToken || !siteUrl) {
    throw new Error(`Missing Mercado Pago configuration: accessToken=${!!accessToken}, siteUrl=${!!siteUrl}`);
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

  const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(preferencePayload)
  });

  const data = await response.json();

  console.log('Mercado Pago response status:', response.status);
  console.log('Mercado Pago response has init_point:', !!data.init_point);

  return {
    ok: response.ok,
    mpData: data
  };
}

function json(statusCode, body) {
  return new Response(JSON.stringify(body), {
    status: statusCode,
    headers: { 'Content-Type': 'application/json' }
  });
}
