import { getStore } from '@netlify/blobs';

function json(statusCode, body) {
  return new Response(JSON.stringify(body), {
    status: statusCode,
    headers: { 'Content-Type': 'application/json' }
  });
}

export default async (req) => {
  console.log('=== Get Case PDF Handler START ===');

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token');
    const orderId = url.searchParams.get('order_id');
    const adminToken = process.env.ADMIN_REVIEW_TOKEN;

    // Validate token
    if (!token || token !== adminToken) {
      console.error('Invalid or missing token');
      return json(401, { error: 'Token inválido o faltante' });
    }

    // Validate order_id
    if (!orderId) {
      console.error('Missing order_id');
      return json(400, { error: 'Falta order_id' });
    }

    const casesStore = getStore('cases');

    // Get case from store
    const caseDataJson = await casesStore.get(orderId);
    if (!caseDataJson) {
      console.error('Case not found:', orderId);
      return json(404, { error: 'Caso no encontrado' });
    }

    const caseData = JSON.parse(caseDataJson);

    // Check if case has been paid
    if (caseData.status !== 'pagado') {
      console.warn('Case not paid:', orderId);
      return json(403, { error: 'Este caso no ha sido pagado' });
    }

    // Check if report exists
    if (!caseData.report_generated_at) {
      console.warn('Report not generated yet:', orderId);
      return json(404, {
        error: 'El reporte aún no ha sido generado',
        message: 'El reporte se genera automáticamente después de que el cliente responde el cuestionario.'
      });
    }

    // If report_url exists, return it
    if (caseData.report_url) {
      console.log('Report URL found:', orderId);
      return json(200, {
        success: true,
        report_url: caseData.report_url,
        company: caseData.company,
        generated_at: caseData.report_generated_at
      });
    }

    // If report_html exists, could generate PDF on-demand (would need Puppeteer)
    // For now, return instructions
    if (caseData.report_html) {
      console.log('Report HTML found, would need Puppeteer to generate PDF');
      return json(200, {
        success: true,
        message: 'Reporte disponible (HTML). Se puede generar PDF bajo demanda.',
        has_html: true,
        generated_at: caseData.report_generated_at
      });
    }

    // No report found
    return json(404, {
      error: 'No se encontró reporte para este caso',
      details: {
        report_generated_at: caseData.report_generated_at || null,
        report_url: caseData.report_url || null,
        report_html: !!caseData.report_html
      }
    });

  } catch (error) {
    console.error('Get Case PDF Error:', {
      message: error.message,
      stack: error.stack
    });

    return json(500, {
      error: 'Error interno al obtener el reporte',
      message: error.message
    });
  }
};
