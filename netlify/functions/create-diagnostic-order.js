import crypto from 'crypto';
import { sectorLabels } from './_lib/questions.js';
import { sendAdvisorEmail } from './send-advisor-email.js';

// Campos que REALMENTE envía el formulario HTML (después del mapeo)
const requiredFields = ['name', 'email', 'phone', 'company', 'sector', 'monthly_sales', 'margin', 'active_clients', 'top_costs', 'main_problem', 'goal_6m', 'plan'];

// Parse body - Netlify Functions envía el body como ReadableStream
async function parseBody(event) {
  console.log('=== parseBody START ===');
  console.log('event.body exists:', 'body' in event);
  console.log('event.body type:', typeof event.body);
  console.log('event.body constructor:', event.body?.constructor?.name);

  if (!event.body) {
    console.log('Body is null/undefined');
    return null;
  }

  let bodyText = null;

  // Caso 1: ReadableStream (Netlify Functions moderno)
  if (event.body instanceof ReadableStream || event.body?.text) {
    console.log('Body is ReadableStream, calling .text()');
    try {
      bodyText = await event.body.text();
      console.log('ReadableStream converted to text, length:', bodyText.length);
    } catch (e) {
      console.error('ReadableStream.text() error:', e.message);
      return null;
    }
  }

  // Caso 2: String (forma antigua o alternativa)
  else if (typeof event.body === 'string') {
    console.log('Body is already string, length:', event.body.length);
    bodyText = event.body;
  }

  // Caso 3: Objeto (ya parseado)
  else if (typeof event.body === 'object') {
    console.log('Body is object, keys:', Object.keys(event.body).length);
    return Object.keys(event.body).length > 0 ? event.body : null;
  }

  if (!bodyText) {
    console.log('No body text after conversion');
    return null;
  }

  // Intentar parsear como JSON
  try {
    const parsed = JSON.parse(bodyText);
    console.log('Successfully parsed as JSON, keys:', Object.keys(parsed).length);
    return parsed;
  } catch (e) {
    console.log('JSON parse failed:', e.message);

    // Intentar form-urlencoded
    try {
      const params = new URLSearchParams(bodyText);
      const obj = {};
      for (const [key, value] of params) {
        obj[key] = value;
      }
      const result = Object.keys(obj).length > 0 ? obj : null;
      console.log('Parsed as form-urlencoded, keys:', Object.keys(obj).length);
      return result;
    } catch (e2) {
      console.error('form-urlencoded parse failed:', e2.message);
      return null;
    }
  }
}

export default async (event, context) => {
  console.log('=== CREATE-DIAGNOSTIC-ORDER START ===');
  console.log('Method:', event.httpMethod || event.method);
  console.log('ContentType header:', event.headers['content-type'] || event.headers['Content-Type'] || 'MISSING');
  console.log('All headers keys:', Object.keys(event.headers || {}).sort());
  console.log('Event keys:', Object.keys(event).sort());

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

  // Mapear nombres de campos del formulario HTML a nombres esperados por backend
  const fieldMapping = {
    'contact_name': 'name',
    'contact_email': 'email',
    'contact_phone': 'phone',
    'company_name': 'company',
    'industry': 'sector',
    'annual_income': 'monthly_sales',
    'main_costs': 'top_costs',
    'main_challenge': 'main_problem',
    'objective_6m': 'goal_6m'
  };

  // Aplicar mapeo de nombres
  for (const [htmlName, backendName] of Object.entries(fieldMapping)) {
    if (body[htmlName] && !body[backendName]) {
      body[backendName] = body[htmlName];
      console.log(`Mapped ${htmlName} → ${backendName}`);
    }
  }

  console.log('Body fields after mapping:', Object.keys(body).sort());

  // Validar campos requeridos
  for (const field of requiredFields) {
    if (!body[field]) {
      console.error('Missing required field:', field);
      console.error('Available fields:', Object.keys(body).sort());
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
    main_channel: body.main_channel || 'no especificado',
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
    console.log('About to call createMercadoPagoPreference');
    const mpResponse = await createMercadoPagoPreference(lead);
    console.log('createMercadoPagoPreference returned, ok:', mpResponse.ok);

    if (!mpResponse.ok) {
      console.error('Mercado Pago preference creation failed');
      throw new Error('Error creating Mercado Pago preference: ' + JSON.stringify(mpResponse.mpData));
    }

    const mpData = mpResponse.mpData;
    console.log('mpData keys:', Object.keys(mpData));

    if (!mpData.id || !mpData.init_point) {
      console.error('Missing required fields in MP response - id:', !!mpData.id, 'init_point:', !!mpData.init_point);
      throw new Error('Mercado Pago response missing id or init_point');
    }

    lead.checkout_id = mpData.id;
    lead.checkout_url = mpData.init_point;

    // Actualizar lead con datos de pago
    await store.set(leadId, JSON.stringify(lead), { metadata: { email: lead.email } });
    console.log('Lead updated with Mercado Pago data');

    // Enviar email al asesor
    await sendAdvisorEmail(lead);
    console.log('Advisor email sent');

    console.log('Lead submission successful:', leadId, 'with MP init_point:', mpData.init_point.substring(0, 50));

    // Retornar en formato esperado por frontend (mercadoPagoUrl)
    const responseData = {
      success: true,
      lead_id: leadId,
      client_token: clientToken,
      mercadoPagoUrl: mpData.init_point,
      checkout_url: mpData.init_point,
      final_price: lead.final_price
    };

    console.log('Sending response with mercadoPagoUrl');
    return json(200, responseData);
  } catch (err) {
    console.error('Error in lead processing:', err.message);
    console.error('Error stack:', err.stack);
    return json(500, { error: 'Error procesando lead: ' + err.message });
  }
};

async function createMercadoPagoPreference(lead) {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  const siteUrl = process.env.SITE_URL;

  console.log('Creating Mercado Pago preference:');
  console.log('- accessToken exists:', !!accessToken);
  console.log('- accessToken first 10 chars:', accessToken ? accessToken.substring(0, 10) : 'MISSING');
  console.log('- siteUrl:', siteUrl);

  if (!accessToken || !siteUrl) {
    const errorMsg = `Missing Mercado Pago configuration: accessToken=${!!accessToken}, siteUrl=${!!siteUrl}`;
    console.error(errorMsg);
    throw new Error(errorMsg);
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

  console.log('Mercado Pago preference payload prepared');

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
  console.log('Mercado Pago response keys:', Object.keys(data));

  if (!response.ok) {
    console.error('Mercado Pago error response:', JSON.stringify(data));
  }

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
