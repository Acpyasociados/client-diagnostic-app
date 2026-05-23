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

function json(statusCode, body) {
  return new Response(JSON.stringify(body), {
    status: statusCode,
    headers: { 'Content-Type': 'application/json' }
  });
}

export default async (req) => {
  console.log('=== Get Advisor Cases Handler START ===');

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token');
    const adminToken = process.env.ADMIN_REVIEW_TOKEN;

    if (!token || token !== adminToken) {
      console.error('Invalid or missing token');
      return json(401, { error: 'Token inválido o faltante' });
    }

    // Get all cases from Flow store
    const casesStore = getStore('cases');

    const allCases = [];

    try {
      for await (const { key } of casesStore.list()) {
        const caseDataJson = await casesStore.get(key);
        const caseData = JSON.parse(caseDataJson);

        // Only include paid cases
        if (caseData.status === 'pagado') {
          allCases.push({ orderId: key, ...caseData });
        }
      }
    } catch (e) {
      console.error('Error reading cases store:', e.message);
      return json(500, { error: 'Error leyendo casos' });
    }

    // Apply filters from query params
    let filteredCases = [...allCases];

    // Filter by sector
    const sector = url.searchParams.get('sector');
    if (sector && sector !== 'all') {
      filteredCases = filteredCases.filter(c => c.sector === sector);
    }

    // Filter by plan
    const plan = url.searchParams.get('plan');
    if (plan && plan !== 'all') {
      filteredCases = filteredCases.filter(c => c.plan === plan);
    }

    // Filter by date range
    const dateFrom = url.searchParams.get('date_from');
    if (dateFrom) {
      const from = new Date(dateFrom);
      filteredCases = filteredCases.filter(c => new Date(c.paid_at) >= from);
    }
    const dateTo = url.searchParams.get('date_to');
    if (dateTo) {
      const to = new Date(dateTo);
      filteredCases = filteredCases.filter(c => new Date(c.paid_at) <= to);
    }

    // Search by name, email, company
    const search = url.searchParams.get('search');
    if (search && search.trim()) {
      const searchTerm = search.toLowerCase();
      filteredCases = filteredCases.filter(c =>
        (c.name && c.name.toLowerCase().includes(searchTerm)) ||
        (c.email && c.email.toLowerCase().includes(searchTerm)) ||
        (c.company && c.company.toLowerCase().includes(searchTerm))
      );
    }

    // Sort by paid_at descending (newest first)
    filteredCases.sort((a, b) => new Date(b.paid_at) - new Date(a.paid_at));

    // Pagination
    const pageStr = url.searchParams.get('page') || '1';
    const limitStr = url.searchParams.get('limit') || '50';
    const page = parseInt(pageStr, 10);
    const limit = parseInt(limitStr, 10);
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

    return json(200, {
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
        sector: sector || 'all',
        plan: plan || 'all',
        date_from: dateFrom || null,
        date_to: dateTo || null,
        search: search || null
      },
      cases
    });

  } catch (error) {
    console.error('Get Advisor Cases Error:', {
      message: error.message,
      stack: error.stack
    });

    return json(500, {
      error: 'Error interno al obtener casos',
      message: error.message
    });
  }
};
