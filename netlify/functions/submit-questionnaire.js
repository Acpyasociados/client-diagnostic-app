import { getLead, saveLead } from './_lib/storage.js';
import { buildReportPayload, renderReportHtml } from './_lib/report.js';
import { sendEmail } from './_lib/email.js';
import { searchCasesForSector } from './_lib/search.js';
import { generateAiEnrichment } from './_lib/ai.js';

export default async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'Método no permitido' });
  const raw = typeof req.text === 'function' ? await req.text() : (req.body || '{}');
  const { lead_id: leadId, token, answers } = JSON.parse(raw);
  if (!leadId || !token || !answers) return json(400, { error: 'Payload incompleto' });

  const lead = await getLead(leadId);
  if (!lead) return json(404, { error: 'Caso no encontrado' });
  if (lead.client_token !== token) return json(403, { error: 'Token inválido' });

  lead.questionnaire_answers = answers;
  lead.questionnaire_completed = true;
  lead.status = 'cuestionario_completado';

  // 1. Buscar casos reales en internet (Tavily) — no bloquea si falla
  let externalCases = [];
  try {
    externalCases = await searchCasesForSector(lead.sector || 'servicios_terreno', lead);
    if (externalCases.length) {
      console.log('[submit] ' + externalCases.length + ' casos externos encontrados para sector: ' + lead.sector);
    }
  } catch (e) {
    console.warn('[submit] searchCasesForSector fallo (no critico):', e.message);
  }

  // 2. Generar diagnostico con IA (Claude) en paralelo con logica de reglas.
  //    Si Claude falla o no esta configurado, cae silenciosamente a reglas.
  const [reportPayload, aiEnrichment] = await Promise.all([
    Promise.resolve(buildReportPayload(lead, externalCases)),
    generateAiEnrichment(lead, answers).catch(e => {
      console.warn('[submit] generateAiEnrichment fallo (no critico):', e.message);
      return null;
    })
  ]);

  // 3. Mezclar: si la IA genero contenido valido, lo usa como fuente principal
  if (aiEnrichment) {
    reportPayload.summary = aiEnrichment.summary;

    if (aiEnrichment.opportunities.length > 0) {
      reportPayload.opportunities = aiEnrichment.opportunities;

      // Distribuir casos externos de Tavily en las 3 oportunidades (1 por cada una)
      if (externalCases.length > 0) {
        reportPayload.opportunities.forEach((opp, i) => {
          const caso = externalCases[i];
          if (caso) {
            opp.cases = [{
              name: caso.source ? caso.title + ' (' + caso.source + ')' : caso.title,
              text: caso.description + (caso.date ? ' — ' + caso.date : ''),
              url:  caso.url || null,
              real: true
            }];
          }
        });
      }
    }

    // Sincronizar con los arrays que usa generate-report.js para el PDF
    reportPayload.improvements = aiEnrichment.opportunities;
    reportPayload.plan_30  = aiEnrichment.opportunities.filter(o => o.term === '30 días').map(o => o.title);
    reportPayload.plan_90  = aiEnrichment.opportunities.filter(o => o.term === '90 días').map(o => o.title);
    reportPayload.plan_180 = aiEnrichment.opportunities.filter(o => o.term === '180 días').map(o => o.title);

    lead.ai_generated = true;
    console.log('[submit] Informe enriquecido con IA para: ' + lead.company);
  } else {
    lead.ai_generated = false;
    console.log('[submit] Informe generado con reglas (sin IA) para: ' + lead.company);
  }

  lead.report_payload = reportPayload;
  lead.report_html = renderReportHtml(reportPayload);
  lead.draft_generated = true;
  lead.status = 'borrador_listo';
  await saveLead(leadId, lead);

  const siteUrl = process.env.SITE_URL;
  const reviewerToken = process.env.ADMIN_REVIEW_TOKEN;
  const reviewerEmail = process.env.REVIEWER_EMAIL;

  try {
    const advisorEmail = reviewerEmail || 'asesor.pac@gmail.com';
    const aiBadge = lead.ai_generated
      ? '<span style="background:#d4edda;color:#155724;padding:3px 10px;border-radius:12px;font-size:12px;font-weight:bold;">✦ Generado con IA</span>'
      : '<span style="background:#fff3cd;color:#856404;padding:3px 10px;border-radius:12px;font-size:12px;font-weight:bold;">⚙ Generado con reglas</span>';

    const isPremium = (lead.plan || '').toLowerCase() === 'premium';
    const premiumAlert = isPremium
      ? '<div style="background:#eff6ff;border:2px solid #3b82f6;border-radius:6px;padding:14px 18px;margin:0 0 16px 0;">' +
          '<div style="font-weight:700;color:#1e40af;font-size:14px;margin-bottom:4px;">⭐ PLAN PREMIUM — $149.900 CLP</div>' +
          '<div style="color:#475569;font-size:13px;">Este cliente tiene una <strong>sesi&oacute;n de implementaci&oacute;n de 30 min incluida</strong>. ' +
          'Coordinar por WhatsApp con <strong>' + (lead.phone || 'sin tel&eacute;fono') + '</strong> una vez aprobado y enviado el informe.</div>' +
        '</div>'
      : '';

    await sendEmail({
      to: advisorEmail,
      subject: (isPremium ? '⭐ [PREMIUM] ' : '[ACP] ') + 'Borrador listo para revisar: ' + lead.company,
      html: '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">' +
        '<div style="background:#1a3a5c;padding:24px;border-radius:8px 8px 0 0;">' +
          '<h2 style="color:white;margin:0;">' + (isPremium ? '⭐ Borrador Premium listo' : 'Borrador listo para revision') + '</h2>' +
        '</div>' +
        '<div style="background:white;padding:28px;border:1px solid #e0e0e0;border-radius:0 0 8px 8px;">' +
          premiumAlert +
          '<p>El cliente <strong>' + lead.name + '</strong> de <strong>' + lead.company + '</strong> completo el cuestionario.</p>' +
          '<p>Origen del diagnostico: ' + aiBadge + '</p>' +
          '<p>El informe esta listo para tu revision y aprobacion.</p>' +
          '<div style="text-align:center;margin:24px 0;">' +
            '<a href="' + siteUrl + '/review.html?lead_id=' + leadId + '&token=' + reviewerToken + '" ' +
               'style="background:#1a3a5c;color:white;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:bold;display:inline-block;">' +
              'Revisar y aprobar informe' +
            '</a>' +
          '</div>' +
        '</div>' +
      '</div>'
    });
  } catch (e) {
    console.error('Error enviando email al asesor (no critico):', e.message);
  }

  return json(200, { ok: true });
};

function json(statusCode, body) {
  return new Response(JSON.stringify(body), { status: statusCode, headers: { 'Content-Type': 'application/json' } });
}
