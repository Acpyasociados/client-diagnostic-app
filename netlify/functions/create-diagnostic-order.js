import crypto from 'crypto';
import { sectorLabels } from './_lib/questions.js';
import { sendAdvisorEmail } from './send-advisor-email.js';

// Campos requeridos del formulario HTML
const requiredFields = ['name', 'email', 'phone', 'company', 'sector', 'monthly_sales', 'plan'];

// Parse body - Netlify Functions v2
async function parseBody(event) {
  let bodyText = null;

  if (typeof event.text === 'function') {
    try { bodyText = await event.text(); } catch (e) { return null; }
  } else if (typeof event.body?.text === 'function') {
    try { bodyText = await event.body.text(); } catch (e) { return null; }
  } else if (typeof event.body === 'string') {
    bodyText = event.body;
  } else if (event.body && typeof event.body === 'object') {
    return Object.keys(event.body).length > 0 ? event.body : null;
  }

  if (!bodyText) return null;

  try { return JSON.parse(bodyText); } catch (e) {
    try {
      const params = new URLSearchParams(bodyText);
      const obj = Object.fromEntries(params);
      return Object.keys(obj).length > 0 ? obj : null;
    } catch (e2) { return null; }
  }
}

// Genera firma HMAC-SHA256 para Flow (orden alfabetico de parametros)
function generateFlowSignature(params, secret) {
  const sortedString = Object.keys(params)
    .sort()
    .map(key => `${key}${params[key]}`)
    .join('');
  return crypto.createHmac('sha256', secret).update(sortedString).digest('hex');
}

// Crea orden de pago en Flow y retorna la URL de checkout
async function createFlowPayment(lead) {
  const apiKey    = process.env.FLOW_API_KEY;
  const secretKey = process.env.FLOW_SECRET_KEY;
  const siteUrl   = process.env.SITE_URL || 'https://acp-asociados.netlify.app';
  const apiUrl    = process.env.FLOW_API_URL || 'https://www.flow.cl/api';

  if (!apiKey || !secretKey) {
    throw new Error('Missing Flow API configuration (FLOW_API_KEY or FLOW_SECRET_KEY)');
  }

  const flowParams = {
    apiKey,
    commerceOrder:   lead.lead_id,
    subject:         `Diagnostico ACP - ${lead.company}`,
    amount:          lead.final_price,
    email:           lead.email,
    currency:        'CLP',
    urlReturn:       `${siteUrl}/.netlify/functions/flow-success-page?orderId=${lead.lead_id}`,
    urlConfirmation: `${siteUrl}/.netlify/functions/flow-webhook`
  };

  flowParams.s = generateFlowSignature(flowParams, secretKey);

  console.log('Llamando Flow API:', apiUrl + '/payment/create');

  const response = await fetch(`${apiUrl}/payment/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
    },
    body: new URLSearchParams(flowParams).toString()
  });

  const data = await response.json();
  console.log('Flow API status:', response.status, '- token:', data.token ? 'present' : 'absent', '- code:', data.code, '- message:', data.message);

  // Respuesta exitosa de Flow: {flowOrder, url, token} (sin campo "code")
  // Respuesta de error de Flow: {code: <numero>, message: "..."}
  if (!response.ok || data.code !== undefined) {
    throw new Error(`Flow API error ${data.code}: ${data.message}`);
  }

  if (!data.url || !data.token) {
    throw new Error(`Flow API respuesta inesperada: ${JSON.stringify(data)}`);
  }

  return {
    ok:          true,
    checkoutUrl: `${data.url}?token=${data.token}`,
    flowToken:   data.token,
    flowOrder:   data.flowOrder
  };
}

export default async (event, context) => {
  const method = (event.method || event.httpMethod || '').toUpperCase();
  console.log('=== CREATE-DIAGNOSTIC-ORDER (Flow) START ===');
  console.log('Method:', method);

  if (method !== 'POST') {
    return json(405, { error: 'Metodo no permitido' });
  }

  let body;
  try {
    body = await parseBody(event);
  } catch (err) {
    return json(400, { error: 'Error parseando body: ' + err.message });
  }

  if (!body) {
    return json(400, { error: 'No hay contenido en la solicitud' });
  }

  // Mapeo de nombres del formulario HTML al backend
  const fieldMapping = {
    contact_name:   'name',
    contact_email:  'email',
    contact_phone:  'phone',
    company_name:   'company',
    industry:       'sector',
    annual_income:  'monthly_sales',
    main_costs:     'top_costs',
    main_challenge: 'main_problem',
    objective_6m:   'goal_6m'
  };
  for (const [htmlName, backendName] of Object.entries(fieldMapping)) {
    if (body[htmlName] && !body[backendName]) body[backendName] = body[htmlName];
  }

  // Validar campos requeridos
  for (const field of requiredFields) {
    if (!body[field]) {
      console.error('Missing field:', field, '- available:', Object.keys(body).sort());
      return json(400, { error: `Falta campo requerido: ${field}` });
    }
  }

  // Precios
  const prices = {
    basico:  Number(process.env.PRICE_BASIC_CLP   || 1000),
    basic:   Number(process.env.PRICE_BASIC_CLP   || 1000),
    premium: Number(process.env.PRICE_PREMIUM_CLP || 11000)
  };

  const plan       = (body.plan || 'basico').toLowerCase();
  const discount   = Number(body.discount_percentage || 0);
  const basePrice  = prices[plan] || prices.basico;
  const finalPrice = body.price !== undefined
    ? Number(body.price)
    : Math.round(basePrice * (100 - discount) / 100);

  const leadId      = crypto.randomUUID();
  const clientToken = crypto.randomBytes(18).toString('hex');

  const lead = {
    lead_id:                 leadId,
    client_token:            clientToken,
    created_at:              new Date().toISOString(),
    status:                  'lead_creado',
    payment_status:          'pending',
    payment_provider:        'flow',
    name:                    body.name,
    email:                   body.email,
    phone:                   body.phone,
    company:                 body.company,
    sector:                  body.sector,
    sector_label:            sectorLabels?.[body.sector] || body.sector,
    monthly_sales:           body.monthly_sales,
    margin:                  body.margin,
    active_clients:          body.active_clients,
    tax_regime:              body.tax_regime,
    top_costs:               body.top_costs,
    digital_presence:        body.digital_presence,
    tax_advisor:             body.tax_advisor,
    main_problem:            body.main_problem || body.main_challenge,
    goal_6m:                 body.goal_6m || body.objectives_6m,
    plan,
    discount_percentage:     discount,
    final_price:             finalPrice,
    questionnaire_sent:      false,
    questionnaire_completed: false,
    draft_generated:         false,
    reviewed_by_human:       false,
    delivered_at:            null
  };

  try {
    const { getStore } = await import('@netlify/blobs');
    const store = getStore('diagnostic-leads');
    await store.set(leadId, JSON.stringify(lead), { metadata: { email: lead.email } });
    console.log('Lead guardado en Blobs:', leadId);

    // Crear pago en Flow
    const flowResult = await createFlowPayment(lead);
    console.log('Flow checkout URL:', flowResult.checkoutUrl.substring(0, 60) + '...');

    // Actualizar lead con datos de Flow
    lead.flow_token         = flowResult.flowToken;
    lead.flow_order         = flowResult.flowOrder;
    lead.checkout_url       = flowResult.checkoutUrl;
    lead.payment_created_at = new Date().toISOString();
    await store.set(leadId, JSON.stringify(lead), { metadata: { email: lead.email } });

    // Notificar al asesor (no critico)
    try {
      await sendAdvisorEmail(lead);
    } catch (emailErr) {
      console.warn('Advisor email fallo (no critico):', emailErr.message);
    }

    console.log('Order creada exitosamente:', leadId);
    return json(200, {
      success:      true,
      lead_id:      leadId,
      client_token: clientToken,
      checkout_url: flowResult.checkoutUrl,
      final_price:  finalPrice
    });

  } catch (err) {
    console.error('Error procesando order:', err.message);
    console.error('Stack:', err.stack);
    return json(500, { error: 'Error procesando lead: ' + err.message });
  }
};

function json(statusCode, body) {
  return new Response(JSON.stringify(body), {
    status: statusCode,
    headers: { 'Content-Type': 'application/json' }
  });
}
