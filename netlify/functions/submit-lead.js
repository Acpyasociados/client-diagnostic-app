import crypto from 'crypto';
import { saveLead } from './_lib/storage.js';
import { sectorLabels } from './_lib/questions.js';

const requiredFields = ['name', 'email', 'phone', 'company', 'sector', 'monthly_sales', 'margin', 'active_clients', 'top_costs', 'main_channel', 'main_problem', 'goal_6m', 'plan'];

export default async (event) => {
  const debugLogs = [];

  const debug = (msg) => {
    console.log(msg);
    debugLogs.push(msg);
  };

  debug('=== DEBUG START ===');
  debug('DEBUG: typeof event:' + typeof event);
  debug('DEBUG: event keys:' + JSON.stringify(Object.keys(event)));
  debug('DEBUG: event.httpMethod:' + event.httpMethod);
  debug('DEBUG: event.method:' + event.method);
  debug('DEBUG: event.requestContext?.httpMethod:' + (event.requestContext ? event.requestContext.httpMethod : 'N/A'));

  // Check method - accept POST
  const method = (event.httpMethod || event.method || '').toUpperCase();
  if (method !== 'POST') {
    debug('DEBUG: Method check failed. Method is: ' + method);
    return json(405, { error: 'Método no permitido: ' + method, debug: debugLogs });
  }

  // Extract and parse body safely
  let body = {};
  let bodyContent = event.body;

  debug('DEBUG: event.body type:' + typeof event.body);
  debug('DEBUG: event.body is null:' + (event.body === null));
  debug('DEBUG: event.body is buffer:' + Buffer.isBuffer(event.body));

  // Convertir body a string si es necesario
  if (Buffer.isBuffer(bodyContent)) {
    bodyContent = bodyContent.toString('utf-8');
    debug('DEBUG: [CONVERTED] Buffer converted to string');
  } else if (typeof bodyContent === 'object' && bodyContent !== null) {
    bodyContent = JSON.stringify(bodyContent);
    debug('DEBUG: [CONVERTED] Object converted to JSON string');
  }

  debug('DEBUG: bodyContent type after conversion:' + typeof bodyContent);
  debug('DEBUG: bodyContent length:' + (bodyContent ? bodyContent.length : 'N/A'));
  debug('DEBUG: bodyContent sample:' + (bodyContent ? String(bodyContent).substring(0, 100) : 'N/A'));
  debug('DEBUG: event.headers:' + JSON.stringify(event.headers));

  if (bodyContent) {
    try {
      debug('DEBUG: [PARSING] Parsing JSON from event.body string');
      body = JSON.parse(bodyContent);
      debug('DEBUG: [SUCCESS] Body parsed, keys:' + JSON.stringify(Object.keys(body)));
      debug('DEBUG: [SUCCESS] body.name:' + body.name);
      debug('DEBUG: [SUCCESS] body.email:' + body.email);
    } catch (parseError) {
      debug('DEBUG: [ERROR] Parse error:' + parseError.message);
      debug('DEBUG: [ERROR] Body type:' + typeof bodyContent);
      const preview = String(bodyContent).substring(0, 200);
      debug('DEBUG: [ERROR] Body content preview:' + preview);
      return json(400, { error: 'No se pudo procesar el cuerpo: ' + parseError.message, debug: debugLogs });
    }
  } else {
    debug('DEBUG: [ERROR] event.body is empty or null');
    return json(400, { error: 'No hay contenido en el cuerpo de la request', debug: debugLogs });
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
