import { getStore } from '@netlify/blobs';

const SECTOR_LABELS = {
  servicios_profesionales: 'Servicios Profesionales',
  comercio_ecommerce: 'Comercio / E-commerce',
  servicios_terreno: 'Servicios de Terreno',
  construccion: 'Construcción',
  gastronomia: 'Gastronomía',
  salud_belleza: 'Salud & Belleza',
  tecnologia: 'Tecnología',
  educacion: 'Educación',
  manufactura: 'Manufactura',
  otro: 'Otro'
};

export default async (event, context) => {
  console.log('=== Get Case Details Handler START ===');

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
    const leadsStore = getStore('diagnostic-leads');

    // Get case from Flow store
    const caseDataJson = await casesStore.get(orderId);
    if (!caseDataJson) {
      console.error('Case not found:', orderId);
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Caso no encontrado' })
      };
    }

    const caseData = JSON.parse(caseDataJson);

    // Check if paid
    if (caseData.status !== 'pagado') {
      console.warn('Case not paid:', orderId, caseData.status);
      return {
        statusCode: 403,
        body: JSON.stringify({ error: 'Este caso no ha sido pagado' })
      };
    }

    // Get lead data if available (for questionnaire responses)
    let leadData = null;
    try {
      const leadDataJson = await leadsStore.get(orderId);
      if (leadDataJson) {
        leadData = JSON.parse(leadDataJson);
      }
    } catch (e) {
      console.warn('Lead data not found for order:', orderId);
    }

    // Format response
    const response = {
      success: true,
      case: {
        order_id: caseData.orderId || orderId,
        client: {
          name: caseData.name,
          email: caseData.email,
          phone: caseData.phone
        },
        company: caseData.company,
        sector: caseData.sector,
        sector_label: SECTOR_LABELS[caseData.sector] || caseData.sector,
        plan: caseData.plan,
        amount: caseData.amount,
        payment_info: {
          paid_at: caseData.paid_at,
          flow_reference: caseData.flow_reference,
          status: caseData.status
        },
        diagnostics: {
          monthly_sales: caseData.monthly_sales,
          profit_margin: caseData.profit_margin,
          active_clients: caseData.active_clients,
          tax_regime: caseData.tax_regime,
          main_challenge: caseData.main_challenge,
          objectives_6m: caseData.objectives_6m
        },
        report: {
          generated_at: caseData.report_generated_at || null,
          url: caseData.report_url || null,
          has_report: !!caseData.report_generated_at
        },
        questionnaire: {
          sent_at: caseData.questionnaire_sent_at || null,
          responses_received: leadData && leadData.questionnaire_responses ? true : false
        },
        notes: caseData.advisor_notes || [],
        created_at: caseData.created_at || new Date().toISOString(),
        updated_at: caseData.updated_at || new Date().toISOString()
      }
    };

    console.log('Successfully fetched case details:', orderId);

    return {
      statusCode: 200,
      body: JSON.stringify(response)
    };

  } catch (error) {
    console.error('Get Case Details Error:', {
      message: error.message,
      stack: error.stack
    });

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Error interno al obtener detalles del caso',
        message: error.message
      })
    };
  }
};
