import { getLead, saveLead } from './_lib/storage.js';
import { sendEmail } from './_lib/email.js';

export default async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'Método no permitido' });
  const { lead_id: leadId, token } = JSON.parse(req.body || '{}');
  if (!leadId || !token) return json(400, { error: 'Payload incompleto' });
  if (token !== process.env.ADMIN_REVIEW_TOKEN) return json(403, { error: 'Token inválido' });
  const lead = await getLead(leadId);
  if (!lead) return json(404, { error: 'Caso no encontrado' });
  if (!lead.report_html) return json(400, { error: 'No existe borrador' });

  lead.reviewed_by_human = true;
  lead.status = 'enviado';
  lead.delivered_at = new Date().toISOString();
  await saveLead(leadId, lead);

  await sendEmail({
    to: lead.email,
    subject: `Tu informe ya está disponible - ${lead.company}`,
    html: `${lead.report_html}<hr/><p>Si quieres avanzar con implementación o plan mensual, responde este correo.</p>`
  });

  return json(200, { ok: true });
};

function json(statusCode, body) {
  return new Response(JSON.stringify(body), { status: statusCode, headers: { 'Content-Type': 'application/json' } });
}
