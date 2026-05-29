import { getLead, saveLead } from './_lib/storage.js';
import { buildReportPayload, renderReportHtml } from './_lib/report.js';
import { sendEmail } from './_lib/email.js';
import { searchCasesForSector } from './_lib/search.js';

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

  // Buscar casos reales en internet (Brave Search) — no bloquea si falla
  let externalCases = [];
  try {
    externalCases = await searchCasesForSector(lead.sector || 'servicios_terreno', lead);
    if (externalCases.length) {
      console.log(`[submit] ${externalCases.length} casos externos encontrados para sector: ${lead.sector}`);
    }
  } catch (e) {
    console.warn('[submit] searchCasesForSector falló (no crítico):', e.message);
  }

  const reportPayload = buildReportPayload(lead, externalCases);
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
    await sendEmail({
      to: advisorEmail,
      subject: `[ACP] Borrador listo para revisar: ${lead.company}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:#1a3a5c;padding:24px;border-radius:8px 8px 0 0;">
            <h2 style="color:white;margin:0;">Borrador listo para revision</h2>
          </div>
          <div style="background:white;padding:28px;border:1px solid #e0e0e0;border-radius:0 0 8px 8px;">
            <p>El cliente <strong>${lead.name}</strong> de <strong>${lead.company}</strong> completo el cuestionario.</p>
            <p>El informe esta listo para tu revision y aprobacion.</p>
            <div style="text-align:center;margin:24px 0;">
              <a href="${siteUrl}/review.html?lead_id=${leadId}&token=${reviewerToken}"
                 style="background:#1a3a5c;color:white;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:bold;display:inline-block;">
                Revisar y aprobar informe
              </a>
            </div>
          </div>
        </div>`
    });
  } catch (e) {
    console.error('Error enviando email al asesor (no critico):', e.message);
  }

  return json(200, { ok: true });
};

function json(statusCode, body) {
  return new Response(JSON.stringify(body), { status: statusCode, headers: { 'Content-Type': 'application/json' } });
}
