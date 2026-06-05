import crypto from 'crypto';
import { getStore } from '@netlify/blobs';

const FLOW_API_URL = process.env.FLOW_API_URL || 'https://sandbox.flow.cl/api';
const FLOW_API_KEY = process.env.FLOW_API_KEY;
const FLOW_SECRET_KEY = process.env.FLOW_SECRET_KEY;
const SITE_URL = process.env.SITE_URL || 'https://acp-asociados.netlify.app';

async function parseBody(event) {
  console.log('=== Flow Payment parseBody START ===');
  let bodyText = null;
  if (typeof event.text === 'function') {
    try {
      bodyText = await event.text();
    } catch (e) {
      console.error('event.text() error:', e.message);
      return null;
    }
  } else if (typeof event.body?.text === 'function') {
    try {
      bodyText = await event.body.text();
    } catch (e) {
      console.error('Body.text() error:', e.message);
      return null;
    }
  } else if (typeof event.body === 'string') {
    bodyText = event.body;
  } else if (event.body && typeof event.body === 'object') {
    return event.body;
  }
  if (!bodyText) return null;
  return JSON.parse(bodyText);
}

// FIX: Usar HMAC-SHA256 (no SHA256 simple) con secretKey como clave
function generateFlowSignature(params, secret) {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}${params[key]}`)
    .join('');
  return crypto.createHmac('sha256', secret).update(sortedParams).digest('hex');
}

export default async (event, context) => {
  console.log('=== Flow Create Payment Handler START ===');
  console.log('Checking env vars - FLOW_API_KEY defined:', !!FLOW_API_KEY, 'FLOW_SECRET_KEY defined:', !!FLOW_SECRET_KEY);
  console.log('FLOW_API_URL:', FLOW_API_URL);
  console.log('SITE_URL:', SITE_URL);

  try {
    if (!FLOW_API_KEY || !FLOW_SECRET_KEY) {
      console.error('Missing Flow API credentials - FLOW_API_KEY:', !!FLOW_API_KEY, 'FLOW_SECRET_KEY:', !!FLOW_SECRET_KEY);
      return new Response(
        JSON.stringify({ error: 'Missing Flow API configuration' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const formData = await parseBody(event);
    console.log('Form data received:', { name: formData?.name, email: formData?.email, plan: formData?.plan });
    console.log('Full form data:', formData);
    console.log('Event body type:', typeof event.body);
    console.log('Event body keys:', Object.keys(formData || {}));

    const requiredFields = ['name', 'email', 'phone', 'company', 'sector', 'plan'];
    const missingFields = requiredFields.filter(field => !formData[field]);

    if (missingFields.length > 0) {
      console.error('Missing required fields:', missingFields);
      return new Response(
        JSON.stringify({ error: 'Missing required fields', missing: missingFields }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const priceBasic = parseInt(process.env.PRICE_BASIC_CLP) || 1000;
    const pricePremium = parseInt(process.env.PRICE_PREMIUM_CLP) || 11000;
    const amount = formData.plan === 'premium' ? pricePremium : priceBasic;

    console.log(`Creating payment for plan: ${formData.plan}, amount: ${amount} CLP`);

    const orderId = `ACP-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const store = getStore('cases');
    const caseData = {
      id: orderId, name: formData.name, email: formData.email, phone: formData.phone, company: formData.company, sector: formData.sector,
      monthly_sales: formData.monthly_sales, profit_margin: formData.profit_margin, active_clients: formData.active_clients,
      tax_regime: formData.tax_regime, top_costs: formData.top_costs, digital_presence: formData.digital_presence,
      tax_advisor: formData.tax_advisor, main_challenge: formData.main_challenge, objectives_6m: formData.objectives_6m,
      plan: formData.plan, amount: amount, status: 'pending', created_at: new Date().toISOString()
    };

    await store.setJSON(orderId, caseData);
    console.log('Case data stored:', orderId);

    // FIX: Usar 'urlConfirmation' (nombre correcto del parámetro en la API de Flow)
    const flowParams = {
      apiKey: FLOW_API_KEY,
      commerceOrder: orderId,
      subject: `Diagnóstico ACP - ${formData.company}`,
      amount: amount,
      email: formData.email,
      currency: 'CLP',
      urlReturn: `${SITE_URL}/.netlify/functions/flow-success-page?orderId=${orderId}`,
      urlConfirmation: `${SITE_URL}/.netlify/functions/flow-webhook`
    };

    flowParams.s = generateFlowSignature(flowParams, FLOW_SECRET_KEY);

    console.log('Flow Parameters:', JSON.stringify(flowParams, null, 2));
    const urlEncodedBody = new URLSearchParams(flowParams).toString();
    console.log('URL Encoded Body:', urlEncodedBody);
    console.log('Calling Flow API endpoint:', FLOW_API_URL + '/payment/create');

    const flowResponse = await fetch(`${FLOW_API_URL}/payment/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
      body: urlEncodedBody
    });

    const flowData = await flowResponse.json();
    console.log('Flow API Response Status:', flowResponse.status);
    console.log('Flow API Response:', JSON.stringify(flowData, null, 2));

    if (!flowResponse.ok || flowData.code !== 0) {
      console.error('Flow API Error:', flowData);
      return new Response(
        JSON.stringify({ error: 'Failed to create payment in Flow', details: flowData.message || 'Unknown error', code: flowData.code }),
        { status: flowResponse.status || 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    caseData.flow_token = flowData.token;
    caseData.payment_created = new Date().toISOString();
    await store.setJSON(orderId, caseData);

    return new Response(
      JSON.stringify({ success: true, orderId: orderId, paymentUrl: `${flowData.url}?token=${flowData.token}`, token: flowData.token }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Flow Create Payment Error:', { message: error.message, stack: error.stack });
    return new Response(
      JSON.stringify({ error: 'Internal server error while creating Flow payment', message: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
