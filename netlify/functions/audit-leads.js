import { getStore } from '@netlify/blobs';

/**
 * Función de auditoría: Obtiene todos los leads guardados en Netlify Blobs
 *
 * Uso:
 *   GET /api/audit-leads?token=ADMIN_REVIEW_TOKEN
 *   GET /api/audit-leads?token=ADMIN_REVIEW_TOKEN&format=json
 *   GET /api/audit-leads?token=ADMIN_REVIEW_TOKEN&format=csv
 *
 * Respuestas:
 *   - JSON: Array de todos los leads
 *   - CSV: Archivo descargable con datos tabulares
 */

export default async (req) => {
  try {
    // Validar token de admin
    const url = new URL(req.url);
    const token = url.searchParams.get('token');
    const format = url.searchParams.get('format') || 'json';
    const adminToken = process.env.ADMIN_REVIEW_TOKEN;

    if (!token || token !== adminToken) {
      return json(403, { error: 'Token inválido o faltante' });
    }

    // Obtener store de leads
    const store = getStore('diagnostic-leads');
    const leads = [];

    // Iterar sobre todas las claves (lead_ids)
    for await (const { key } of store.list()) {
      const data = await store.get(key);
      if (data) {
        try {
          leads.push(JSON.parse(data));
        } catch (e) {
          console.error(`Error parsing lead ${key}:`, e);
        }
      }
    }

    // Retornar en formato solicitado
    if (format === 'csv') {
      const csv = convertToCSV(leads);
      return new Response(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="leads.csv"'
        }
      });
    }

    // JSON por defecto
    return json(200, {
      total: leads.length,
      timestamp: new Date().toISOString(),
      leads: leads.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    });
  } catch (error) {
    console.error('Audit leads error:', error);
    return json(500, { error: error.message });
  }
};

/**
 * Convierte array de leads a formato CSV
 */
function convertToCSV(leads) {
  if (!leads || leads.length === 0) {
    return 'No hay leads disponibles\n';
  }

  // Headers
  const headers = [
    'Lead ID',
    'Nombre',
    'Email',
    'Teléfono',
    'Empresa',
    'Rubro',
    'Ventas Mensuales (CLP)',
    'Margen (%)',
    'Clientes Activos',
    'Plan',
    'Monto Pagado (CLP)',
    'Status Pago',
    'Status General',
    'Cuestionario Completado',
    'Informe Generado',
    'Revisado por Humano',
    'Problema Principal',
    'Objetivo 6 Meses',
    'Fecha Creación',
    'Fecha Pago',
    'Fecha Entrega'
  ];

  // Rows
  const rows = leads.map(lead => {
    const planPrice = lead.plan === 'basico' ? 99000 : 199000;

    return [
      escapeCSV(lead.lead_id || ''),
      escapeCSV(lead.name || ''),
      escapeCSV(lead.email || ''),
      escapeCSV(lead.phone || ''),
      escapeCSV(lead.company || ''),
      escapeCSV(lead.sector_label || lead.sector || ''),
      lead.monthly_sales || '',
      lead.margin || '',
      lead.active_clients || '',
      escapeCSV((lead.plan || '').toUpperCase()),
      planPrice,
      escapeCSV(lead.payment_status || 'pending'),
      escapeCSV(lead.status || 'lead_creado'),
      lead.questionnaire_completed ? 'Sí' : 'No',
      lead.draft_generated ? 'Sí' : 'No',
      lead.reviewed_by_human ? 'Sí' : 'No',
      escapeCSV(lead.main_problem || ''),
      escapeCSV(lead.goal_6m || ''),
      formatDate(lead.created_at),
      formatDate(lead.payment_date),
      formatDate(lead.delivered_at)
    ];
  });

  // Construir CSV
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  return csvContent;
}

/**
 * Escapa caracteres especiales en CSV
 */
function escapeCSV(str) {
  if (!str) return '';
  return String(str).replace(/"/g, '""');
}

/**
 * Formatea fecha ISO a formato legible
 */
function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-CL') + ' ' + date.toLocaleTimeString('es-CL');
}

/**
 * Helper para retornar JSON
 */
function json(statusCode, body) {
  return new Response(JSON.stringify(body, null, 2), {
    status: statusCode,
    headers: { 'Content-Type': 'application/json' }
  });
}
