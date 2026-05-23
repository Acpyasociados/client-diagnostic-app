import crypto from 'crypto';
import { getStore } from '@netlify/blobs';

const FLOW_API_URL = 'https://api.flow.cl/api';
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

function generateFlowSignature(params, secret) {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}${params[key]}`)
    .join('');
  return crypto.createHash('sha256').update(sortedParams + secret).digest('hex');
}

export default async (event, context) => {
  console.log('=== Flow Create Payment Handler START ===');
  try {
    if (!FLOW_API_KEY || !FLOW_SECRET_KEY) {
      console.error('Missing Flow API credentials');
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

    const flowParams = {
      apiKey: FLOW_API_KEY,
      commerceOrder: orderId,
      subject: `Diagnóstico ACP - ${formData.company}`,
      amount: amount,
      email: formData.email,
      currency: 'CLP',
      urlReturn: `${SITE_URL}/flow-success.html?orderId=${orderId}`,
      urlConfirm: `${SITE_URL}/.netlify/functions/flow-webhook`
    };

    flowParams.s = generateFlowSignature(flowParams, FLOW_SECRET_KEY);

    console.log('Calling Flow API endpoint: /payment/create');
    const flowResponse = await fetch(`${FLOW_API_URL}/payment/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
      body: new URLSearchParams(flowParams).toString()
    });

    const flowData = await flowResponse.json();
    console.log('Flow API Response Status:', flowResponse.status);

    if (!flowResponse.ok || flowData.status !== 'SUCCESS') {
      console.error('Flow API Error:', flowData);
      return new Response(
        JSON.stringify({ error: 'Failed to create payment in Flow', details: flowData.message || 'Unknown error' }),
        { status: flowResponse.status || 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    caseData.flow_token = flowData.token;
    caseData.payment_created = new Date().toISOString();
    await store.setJSON(orderId, caseData);

    return new Response(
      JSON.stringify({ success: true, orderId: orderId, paymentUrl: flowData.url, token: flowData.token }),
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
