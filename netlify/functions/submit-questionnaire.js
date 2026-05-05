import { getLead, saveLead } from './_lib/storage.js';
import { buildReportPayload, renderReportHtml } from './_lib/report.js';
import { sendEmail } from './_lib/email.js';

export default async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'Método no permitido' });
  const { lead_id: leadId, token, answers } = JSON.parse(req.body || '{}');
  if (!leadId || !token || !answers) return json(400, { error: 'Payload incompleto' });

  const lead = await getLead(leadId);
  if (!lead) return json(404, { error: 'Caso no encontrado' });
  if (lead.client_token !== token) return json(403, { error: 'Token inválido' });

  lead.questionnaire_answers = answers;
  lead.questionnaire_completed = true;
  lead.status = 'cuestionario_completado';

  const reportPayload = buildReportPayload(lead);
  if (!reportPayload.improvements.length) return json(400, { error: 'Información insuficiente para diagnosticar' });
  lead.report_payload = reportPayload;
  lead.report_html = renderReportHtml(reportPayload);
  lead.draft_generated = true;
  lead.status = 'borrador_listo';
  await saveLead(leadId, lead);

  const siteUrl = process.env.SITE_URL;
  const reviewerToken = process.env.ADMIN_REVIEW_TOKEN;
  const reviewerEmail = process.env.REVIEWER_EMAIL;

  await sendEmail({
    to: reviewerEmail,
    subject: `Borrador listo: ${lead.company}`,
    html: `<p>El caso ${lead.company} ya tiene borrador.</p><p><a href="${siteUrl}/review.html?lead_id=${leadId}&token=${reviewerToken}">Abrir revisión</a></p>`
  });

  return json(200, { ok: true });
};

function json(statusCode, body) {
  return new Response(JSON.stringify(body), { status: statusCode, headers: { 'Content-Type': 'application/json' } });
}
