/**
 * regenerate-report.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Re-ejecuta el pipeline completo de generación de informe para un lead
 * cuyo borrador fue rechazado con notas (estado cambios_solicitados).
 *
 * Las review_notes del asesor se inyectan en el prompt de IA para que
 * las oportunidades las reflejen directamente.
 *
 * POST /.netlify/functions/regenerate-report
 * Body: { lead_id, token }
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { getLead, saveLead }              from './_lib/storage.js';
import { buildReportPayload, renderReportHtml } from './_lib/report.js';
import { sendEmail }                      from './_lib/email.js';
import { searchCasesForSector }           from './_lib/search.js';
import { generateAiEnrichment }           from './_lib/ai.js';

export default async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'Solo POST' });

  const raw = typeof req.text === 'function' ? await req.text() : (req.body || '{}');
  const { lead_id: leadId, token } = JSON.parse(raw);

  if (!leadId || !token) return json(400, { error: 'Faltan parámetros' });
  if (token !== process.env.ADMIN_REVIEW_TOKEN) return json(403, { error: 'Token inválido' });

  const lead = await getLead(leadId);
  if (!lead) return json(404, { error: 'Lead no encontrado' });

  const answers     = lead.questionnaire_answers || {};
  const reviewNotes = lead.review_notes || null;

  console.log(`[regenerate] Iniciando para: ${lead.company} (${leadId})`);
  if (reviewNotes) {
    console.log(`[regenerate] Notas del asesor: ${reviewNotes.substring(0, 120)}`);
  }

  // 1. Buscar casos reales (Tavily/Brave) — no bloquea si falla
  let externalCases = [];
  try {
    externalCases = await searchCasesForSector(lead.sector || 'servicios_terreno', lead);
    if (externalCases.length) {
      console.log(`[regenerate] ${externalCases.length} casos externos encontrados`);
    }
  } catch (e) {
    console.warn('[regenerate] searchCasesForSector falló (no crítico):', e.message);
  }

  // 2. Generar diagnóstico: reglas + IA en paralelo
  //    Las review_notes se pasan a la IA para que las incorpore obligatoriamente
  const [reportPayload, aiEnrichment] = await Promise.all([
    Promise.resolve(buildReportPayload(lead, externalCases)),
    generateAiEnrichment(lead, answers, reviewNotes).catch(e => {
      console.warn('[regenerate] generateAiEnrichment falló (no crítico):', e.message);
      return null;
    })
  ]);

  // 3. Mezclar: IA tiene prioridad sobre reglas
  if (aiEnrichment) {
    reportPayload.summary = aiEnrichment.summary;

    if (aiEnrichment.opportunities.length > 0) {
      reportPayload.opportunities = aiEnrichment.opportunities;

      if (externalCases.length > 0) {
        reportPayload.opportunities.forEach((opp, i) => {
          const caso = externalCases[i];
          if (caso) {
            opp.cases = [{
              name: caso.source ? `${caso.title} (${caso.source})` : caso.title,
              text: caso.description + (caso.date ? ` — ${caso.date}` : ''),
              url:  caso.url || null,
              real: true
            }];
          }
        });
      }
    }

    reportPayload.improvements = aiEnrichment.opportunities;
    reportPayload.plan_30  = aiEnrichment.opportunities.filter(o => o.term === '30 días').map(o => o.title);
    reportPayload.plan_90  = aiEnrichment.opportunities.filter(o => o.term === '90 días').map(o => o.title);
    reportPayload.plan_180 = aiEnrichment.opportunities.filter(o => o.term === '180 días').map(o => o.title);

    lead.ai_generated = true;
    console.log(`[regenerate] Informe enriquecido con IA para: ${lead.company}`);
  } else {
    lead.ai_generated = false;
    console.log(`[regenerate] Informe generado con reglas (sin IA) para: ${lead.company}`);
  }

  // 4. Guardar el nuevo borrador
  lead.report_payload      = reportPayload;
  lead.report_html         = renderReportHtml(reportPayload);
  lead.draft_generated     = true;
  lead.status              = 'borrador_listo';
  lead.review_notes        = null;          // notas ya incorporadas — limpiar
  lead.changes_requested_at = null;
  lead.regenerated_at      = new Date().toISOString();
  lead.regeneration_count  = (lead.regeneration_count || 0) + 1;

  await saveLead(leadId, lead);

  // 5. Notificar al asesor que el borrador regenerado está listo
  const siteUrl       = process.env.SITE_URL;
  const reviewerToken = process.env.ADMIN_REVIEW_TOKEN;
  const reviewerEmail = process.env.REVIEWER_EMAIL;

  try {
    const advisorEmail = reviewerEmail || 'asesor.pac@gmail.com';
    const aiBadge = lead.ai_generated
      ? '<span style="background:#d4edda;color:#155724;padding:3px 10px;border-radius:12px;font-size:12px;font-weight:bold;">✦ Regenerado con IA</span>'
      : '<span style="background:#fff3cd;color:#856404;padding:3px 10px;border-radius:12px;font-size:12px;font-weight:bold;">⚙ Regenerado con reglas</span>';

    const notasBadge = reviewNotes
      ? `<div style="background:#fff8e1;border-left:4px solid #f59e0b;padding:12px;margin:16px 0;border-radius:4px;">
           <strong>Notas que se incorporaron:</strong><br>
           <em style="color:#555;">"${reviewNotes.substring(0, 300)}${reviewNotes.length > 300 ? '…' : ''}"</em>
         </div>`
      : '';

    await sendEmail({
      to: advisorEmail,
      subject: `[ACP] Borrador regenerado listo: ${lead.company}`,
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#1a3a5c;padding:24px;border-radius:8px 8px 0 0;">
          <h2 style="color:white;margin:0;">Borrador regenerado</h2>
        </div>
        <div style="background:white;padding:28px;border:1px solid #e0e0e0;border-radius:0 0 8px 8px;">
          <p>El informe de <strong>${lead.company}</strong> fue regenerado (iteración #${lead.regeneration_count}).</p>
          <p>Origen: ${aiBadge}</p>
          ${notasBadge}
          <div style="text-align:center;margin:24px 0;">
            <a href="${siteUrl}/review.html?lead_id=${leadId}&token=${reviewerToken}"
               style="background:#1a3a5c;color:white;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:bold;display:inline-block;">
              Revisar borrador regenerado
            </a>
          </div>
        </div>
      </div>`
    });
    console.log(`[regenerate] Email enviado al asesor para: ${lead.company}`);
  } catch (e) {
    console.error('[regenerate] Error enviando email (no crítico):', e.message);
  }

  return json(200, { ok: true, regeneration_count: lead.regeneration_count });
};

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}
