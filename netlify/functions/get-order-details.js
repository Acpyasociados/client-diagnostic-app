import { getStore } from '@netlify/blobs';

export default async (event, context) => {
  console.log('=== Get Order Details Handler START ===');
  try {
    const orderId = event.queryStringParameters?.orderId;

    if (!orderId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing orderId parameter' })
      };
    }

    console.log('Fetching order details:', orderId);
    const store = getStore('cases');
    const caseData = await store.getJSON(orderId);

    if (!caseData) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Order not found' })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        data: {
          orderId: caseData.id,
          name: caseData.name,
          email: caseData.email,
          company: caseData.company,
          plan: caseData.plan,
          amount: caseData.amount,
          status: caseData.status,
          created_at: caseData.created_at,
          paid_at: caseData.paid_at
        }
      })
    };

  } catch (error) {
    console.error('Get Order Details Error:', { message: error.message, stack: error.stack });
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error', message: error.message })
    };
  }
};
