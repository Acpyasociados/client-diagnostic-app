import { getStore } from '@netlify/blobs';

export default async (event, context) => {
  console.log('=== Get Case PDF Handler START ===');

  try {
    const token = event.queryStringParameters?.token;
    const orderId = event.queryStringParameters?.order_id;
    const adminToken = process.env.ADMIN_REVIEW_TOKEN;

    // Validate token
    if (!token || token !== adminToken) {
      console.error('Invalid or missing token');
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Token inválido o faltante' })
      };
    }

    // Validate order_id
    if (!orderId) {
      console.error('Missing order_id');
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Falta order_id' })
      };
    }

    const casesStore = getStore('cases');

    // Get case from store
    const caseDataJson = await casesStore.get(orderId);
    if (!caseDataJson) {
      console.error('Case not found:', orderId);
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Caso no encontrado' })
      };
    }

    const caseData = JSON.parse(caseDataJson);

    // Check if case has been paid
    if (caseData.status !== 'pagado') {
      console.warn('Case not paid:', orderId);
      return {
        statusCode: 403,
        body: JSON.stringify({ error: 'Este caso no ha sido pagado' })
      };
    }

    // Check if report exists
    if (!caseData.report_generated_at) {
      console.warn('Report not generated yet:', orderId);
      return {
        statusCode: 404,
        body: JSON.stringify({
          error: 'El reporte aún no ha sido generado',
          message: 'El reporte se genera automáticamente después de que el cliente responde el cuestionario.'
        })
      };
    }

    // If report_url exists, redirect to it or return it
    if (caseData.report_url) {
      console.log('Report URL found:', orderId);
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: true,
          report_url: caseData.report_url,
          company: caseData.company,
          generated_at: caseData.report_generated_at
        })
      };
    }

    // If report_html exists, could generate PDF on-demand (would need Puppeteer)
    // For now, return instructions
    if (caseData.report_html) {
      console.log('Report HTML found, would need Puppeteer to generate PDF');
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          message: 'Reporte disponible (HTML). Se puede generar PDF bajo demanda.',
          has_html: true,
          generated_at: caseData.report_generated_at
        })
      };
    }

    // No report found
    return {
      statusCode: 404,
      body: JSON.stringify({
        error: 'No se encontró reporte para este caso',
        details: {
          report_generated_at: caseData.report_generated_at || null,
          report_url: caseData.report_url || null,
          report_html: !!caseData.report_html
        }
      })
    };

  } catch (error) {
    console.error('Get Case PDF Error:', {
      message: error.message,
      stack: error.stack
    });

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Error interno al obtener el reporte',
        message: error.message
      })
    };
  }
};
