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
  console.log('=== Get Advisor Cases Handler START ===');

  try {
    const token = event.queryStringParameters?.token;
    const adminToken = process.env.ADMIN_REVIEW_TOKEN;

    if (!token || token !== adminToken) {
      console.error('Invalid or missing token');
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Token inválido o faltante' })
      };
    }

    // Get all cases from Flow store
    const casesStore = getStore('cases');
    const leadsStore = getStore('diagnostic-leads');

    const allCases = [];
    let pageSize = 0;

    try {
      for await (const { key } of casesStore.list()) {
        const caseDataJson = await casesStore.get(key);
        const caseData = JSON.parse(caseDataJson);

        // Only include paid cases
        if (caseData.status === 'pagado') {
          allCases.push({ orderId: key, ...caseData });
        }
        pageSize++;
      }
    } catch (e) {
      console.error('Error reading cases store:', e.message);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Error leyendo casos' })
      };
    }

    // Apply filters from query params
    const query = event.queryStringParameters || {};
    let filteredCases = [...allCases];

    // Filter by sector
    if (query.sector && query.sector !== 'all') {
      filteredCases = filteredCases.filter(c => c.sector === query.sector);
    }

    // Filter by plan
    if (query.plan && query.plan !== 'all') {
      filteredCases = filteredCases.filter(c => c.plan === query.plan);
    }

    // Filter by date range
    if (query.date_from) {
      const dateFrom = new Date(query.date_from);
      filteredCases = filteredCases.filter(c => new Date(c.paid_at) >= dateFrom);
    }
    if (query.date_to) {
      const dateTo = new Date(query.date_to);
      filteredCases = filteredCases.filter(c => new Date(c.paid_at) <= dateTo);
    }

    // Search by name, email, company
    if (query.search && query.search.trim()) {
      const searchTerm = query.search.toLowerCase();
      filteredCases = filteredCases.filter(c =>
        (c.name && c.name.toLowerCase().includes(searchTerm)) ||
        (c.email && c.email.toLowerCase().includes(searchTerm)) ||
        (c.company && c.company.toLowerCase().includes(searchTerm))
      );
    }

    // Sort by paid_at descending (newest first)
    filteredCases.sort((a, b) => new Date(b.paid_at) - new Date(a.paid_at));

    // Pagination
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '50', 10);
    const offset = (page - 1) * limit;
    const paginatedCases = filteredCases.slice(offset, offset + limit);

    // Calculate KPIs
    const totalRevenue = filteredCases.reduce((sum, c) => sum + (c.amount || 0), 0);
    const totalCases = filteredCases.length;

    // Format response
    const cases = paginatedCases.map(c => ({
      order_id: c.orderId,
      name: c.name,
      company: c.company,
      email: c.email,
      sector: c.sector,
      sector_label: SECTOR_LABELS[c.sector] || c.sector,
      plan: c.plan,
      amount: c.amount,
      paid_at: c.paid_at,
      status: c.status,
      has_report: !!c.report_generated_at,
      has_questionnaire: !!c.questionnaire_sent_at,
      has_notes: !!(c.advisor_notes && c.advisor_notes.length > 0),
      notes_count: c.advisor_notes ? c.advisor_notes.length : 0
    }));

    console.log('Successfully fetched advisor cases:', cases.length);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        pagination: {
          page,
          limit,
          total: totalCases,
          total_pages: Math.ceil(totalCases / limit)
        },
        kpis: {
          total_cases: totalCases,
          total_revenue: totalRevenue,
          average_transaction: totalCases > 0 ? Math.round(totalRevenue / totalCases) : 0
        },
        filters: {
          sector: query.sector || 'all',
          plan: query.plan || 'all',
          date_from: query.date_from || null,
          date_to: query.date_to || null,
          search: query.search || null
        },
        cases
      })
    };

  } catch (error) {
    console.error('Get Advisor Cases Error:', {
      message: error.message,
      stack: error.stack
    });

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Error interno al obtener casos',
        message: error.message
      })
    };
  }
};
