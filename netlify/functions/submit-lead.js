import crypto from 'crypto';
import { saveLead } from './_lib/storage.js';
import { sectorLabels } from './_lib/questions.js';

const requiredFields = ['name', 'email', 'phone', 'company', 'sector', 'monthly_sales', 'margin', 'active_clients', 'top_costs', 'main_channel', 'main_problem', 'goal_6m', 'plan'];

// Parse request body - handle both string and pre-parsed JSON
async function parseBody(event) {
  if (typeof event.body === 'string') {
    return JSON.parse(event.body);
  } else if (typeof event.body === 'object' && Object.keys(event.body).length > 0) {
    return event.body;
  }
  return null;
}

export default async (event, context) => {
  const debugLogs = [];

  const debug = (msg) => {
    console.log(msg);
    debugLogs.push(msg);
  };

  debug('=== DEBUG START ===');
  debug('event.body type: ' + typeof event.body);
  debug('event.body is string: ' + (typeof event.body === 'string'));
  debug('event.method: ' + event.method);
  debug('event.httpMethod: ' + event.httpMethod);

  // Check method
  const method = (event.httpMethod || event.method || '').toUpperCase();
  if (method !== 'POST') {
    debug('Method rejected: ' + method);
    return json(405, { error: 'Método no permitido' });
  }

  // Parse body
  let body = null;
  try {
    body = await parseBody(event);
    debug('Body parsed successfully');
    debug('Body keys: ' + JSON.stringify(Object.keys(body || {})));
  } catch (err) {
    debug('Parse error: ' + err.message);
    return json(400, { error: 'No se pudo parsear el body: ' + err.message });
  }

  if (!body) {
    debug('Body is null/empty');
    return json(400, { error: 'No hay contenido en la request' });
  }

  debug('=== DEBUG END ===');

  for (const field of requiredFields) {
    if (!body[field]) {
      return json(400, { error: `Falta ${field}`, debug: debugLogs });
    }
  }

  const leadId = crypto.randomUUID();
  const clientToken = crypto.randomBytes(18).toString('hex');
  const createdAt = new Date().toISOString();
  const prices = {
    basico: Number(process.env.PRICE_BASIC_CLP || 99000),
    premium: Number(process.env.PRICE_PREMIUM_CLP || 199000)
  };
  const unitPrice = prices[body.plan] || prices.basico;
  const siteUrl = process.env.SITE_URL;
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!siteUrl || !accessToken) return json(500, { error: 'Faltan variables SITE_URL o MERCADOPAGO_ACCESS_TOKEN' });

  const lead = {
    ...body,
    lead_id: leadId,
    client_token: clientToken,
    status: 'lead_creado',
    payment_status: 'pending',
    questionnaire_sent: false,
    questionnaire_completed: false,
    draft_generated: false,
    reviewed_by_human: false,
    delivered_at: null,
    created_at: createdAt,
    sector_label: sectorLabels[body.sector]
  };
  await saveLead(leadId, lead);

  const preferencePayload = {
    items: [{
      title: `Diagnóstico ${body.plan} - ${body.company}`,
      quantity: 1,
      currency_id: 'CLP',
      unit_price: unitPrice
    }],
    metadata: { lead_id: leadId, client_email: body.email, plan: body.plan },
    back_urls: {
      success: `${siteUrl}/success.html?lead_id=${leadId}`,
      failure: `${siteUrl}/cancel.html?lead_id=${leadId}`,
      pending: `${siteUrl}/success.html?lead_id=${leadId}`
    },
    auto_return: 'approved',
    notification_url: `${siteUrl}/api/mercadopago-webhook`
  };

  const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(preferencePayload)
  });

  const mpData = await mpResponse.json();
  if (!mpResponse.ok) return json(500, { error: mpData.message || 'No se pudo crear checkout' });

  lead.checkout_id = mpData.id;
  lead.checkout_url = mpData.init_point;
  await saveLead(leadId, lead);

  return json(200, { checkout_url: mpData.init_point, lead_id: leadId });
};

function json(statusCode, body) {
  return new Response(JSON.stringify(body), { status: statusCode, headers: { 'Content-Type': 'application/json' } });
}
