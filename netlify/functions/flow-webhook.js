import crypto from 'crypto';
import { getStore } from '@netlify/blobs';

const FLOW_SECRET_KEY = process.env.FLOW_SECRET_KEY;

function verifyFlowSignature(params, signature, secret) {
  const paramsWithoutSignature = { ...params };
  delete paramsWithoutSignature.s;
  const sortedParams = Object.keys(paramsWithoutSignature).sort().map(key => `${key}${paramsWithoutSignature[key]}`).join('');
  const computedSignature = crypto.createHash('sha256').update(sortedParams + secret).digest('hex');
  return computedSignature === signature;
}

export default async (event, context) => {
  console.log('=== Flow Webhook Handler START ===');
  try {
    const params = event.queryStringParameters || {};
    console.log('Webhook params received:', { token: params.token?.substring(0, 8) + '...', commerceOrder: params.commerceOrder, status: params.status });

    const signature = params.s;
    if (!signature || !verifyFlowSignature(params, signature, FLOW_SECRET_KEY)) {
      console.error('Invalid Flow webhook signature');
      return { statusCode: 401, body: JSON.stringify({ error: 'Invalid signature' }) };
    }

    console.log('Signature verified successfully');

    const orderId = params.commerceOrder;
    if (!orderId) {
      console.error('Missing commerceOrder in webhook');
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing commerceOrder' }) };
    }

    const store = getStore('cases');
    const caseData = await store.getJSON(orderId);

    if (!caseData) {
      console.error('Case not found:', orderId);
      return { statusCode: 404, body: JSON.stringify({ error: 'Case not found' }) };
    }

    console.log('Case found:', orderId);

    if (params.status === 'PAYED') {
      caseData.status = 'pagado';
      caseData.paid_at = new Date().toISOString();
      caseData.flow_reference = params.token;
      await store.setJSON(orderId, caseData);
      console.log('Payment confirmed for case:', orderId);

      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, message: 'Payment processed successfully', orderId: orderId })
      };
    } else {
      console.warn(`Payment status: ${params.status} for order: ${orderId}`);
      caseData.status = 'payment_failed';
      caseData.payment_status = params.status;
      caseData.failed_at = new Date().toISOString();
      await store.setJSON(orderId, caseData);

      return {
        statusCode: 200,
        body: JSON.stringify({ success: false, message: 'Payment not completed', status: params.status, orderId: orderId })
      };
    }

  } catch (error) {
    console.error('Flow Webhook Error:', { message: error.message, stack: error.stack });
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error processing webhook', message: error.message })
    };
  }
};
