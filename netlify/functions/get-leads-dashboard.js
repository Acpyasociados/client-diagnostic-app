/**
 * get-leads-dashboard.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Endpoint HTTP GET que retorna estadísticas en tiempo real de leads pagados.
 *
 * Query params:
 * - ?period=today (default: últimas 24h desde ahora)
 * - ?period=thisMonth (desde hace 30 días)
 * - ?limit=50 (default 100)
 *
 * Retorna:
 * {
 *   success: true,
 *   period: "today",
 *   timestamp: "2026-08-25T14:30:00Z",
 *   stats: {
 *     total_leads_paid: 12,
 *     total_revenue_clp: 599800,
 *     questionnaire_completed: 8,
 *     questionnaire_completion_rate: 0.67,
 *     report_generated: 5
 *   },
 *   leads: [
 *     { lead_id, name, email, company, amount, created_at, payment_status, questionnaire_completed, report_generated }
 *   ]
 * }
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { getStore } from '@netlify/blobs';

function json(statusCode, body) {
  return new Response(JSON.stringify(body), {
    status: statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Cache-Control': 'no-cache, max-age=5'
    }
  });
}

export default async (req, context) => {
  // Permitir CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
      }
    });
  }

  if (req.method !== 'GET') {
    return json(405, { error: 'Method not allowed' });
  }

  try {
    const url = new URL(req.url);
    const period = url.searchParams.get('period') || 'today';
    const limit = parseInt(url.searchParams.get('limit') || '100', 10);

    const store = getStore('diagnostic-leads');
    const { blobs } = await store.list();

    // Calcular cutoff según el period
    const now = Date.now();
    let cutoff;
    if (period === 'today') {
      // Últimas 24 horas desde ahora
      cutoff = now - 24 * 60 * 60 * 1000;
    } else if (period === 'thisMonth') {
      // Últimos 30 días
      cutoff = now - 30 * 24 * 60 * 60 * 1000;
    } else {
      return json(400, { error: 'Invalid period. Use: today, thisMonth' });
    }

    const paidLeads = [];
    let totalRevenue = 0;
    let completedQuestionnaires = 0;
    let generatedReports = 0;

    // Escanear todos los leads
    for (const { key } of blobs) {
      try {
        const data = await store.get(key);
        if (!data) continue;

        let lead;
        try {
          lead = JSON.parse(data);
        } catch (e) {
          continue;
        }

        // Filtrar: pagos aprobados dentro del período
        if (lead.payment_status !== 'approved') continue;

        const createdTime = lead.created_at ? new Date(lead.created_at).getTime() : 0;
        if (createdTime < cutoff) continue;

        // Agregar a resultados
        paidLeads.push({
          lead_id: key,
          name: lead.name || 'N/A',
          email: lead.email || 'N/A',
          company: lead.company || 'N/A',
          phone: lead.phone || '',
          plan: lead.plan || 'basico',
          amount: lead.final_price || 0,
          created_at: lead.created_at,
          payment_status: lead.payment_status,
          questionnaire_completed: lead.questionnaire_completed === true,
          questionnaire_sent_at: lead.questionnaire_sent_at,
          report_generated: lead.draft_generated === true,
          generated_at: lead.draft_generated_at,
          reviewed_by_human: lead.reviewed_by_human === true,
          delivered_at: lead.delivered_at
        });

        totalRevenue += lead.final_price || 0;
        if (lead.questionnaire_completed === true) completedQuestionnaires++;
        if (lead.draft_generated === true) generatedReports++;

      } catch (err) {
        console.error('[DASHBOARD] Error procesando lead:', err.message);
      }
    }

    // Ordenar por fecha descendente (más recientes primero)
    paidLeads.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // Aplicar límite
    const limitedLeads = paidLeads.slice(0, limit);

    return json(200, {
      success: true,
      period: period,
      timestamp: new Date().toISOString(),
      stats: {
        total_leads_paid: paidLeads.length,
        total_revenue_clp: totalRevenue,
        questionnaire_completed: completedQuestionnaires,
        questionnaire_completion_rate: paidLeads.length > 0
          ? Math.round((completedQuestionnaires / paidLeads.length) * 100) / 100
          : 0,
        report_generated: generatedReports,
        report_generation_rate: paidLeads.length > 0
          ? Math.round((generatedReports / paidLeads.length) * 100) / 100
          : 0
      },
      leads: limitedLeads,
      note: paidLeads.length > limit ? `Mostrando ${limit} de ${paidLeads.length} leads` : undefined
    });

  } catch (err) {
    console.error('[DASHBOARD] Error:', err);
    return json(500, {
      success: false,
      error: err.message,
      timestamp: new Date().toISOString()
    });
  }
};
