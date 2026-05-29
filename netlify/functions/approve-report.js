import { getLead, saveLead } from './_lib/storage.js';
import { sendEmail } from './_lib/email.js';

export default async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'Método no permitido' });
  const raw = typeof req.text === 'function' ? await req.text() : (req.body || '{}');
  const { lead_id: leadId, token } = JSON.parse(raw);
  if (!leadId || !token) return json(400, { error: 'Payload incompleto' });
  if (token !== process.env.ADMIN_REVIEW_TOKEN) return json(403, { error: 'Token inválido' });
  const lead = await getLead(leadId);
  if (!lead) return json(404, { error: 'Caso no encontrado' });
  if (!lead.report_html) return json(400, { error: 'No existe borrador' });

  lead.reviewed_by_human = true;
  lead.status = 'enviado';
  lead.delivered_at = new Date().toISOString();
  await saveLead(leadId, lead);

  let emailSent = false;
  try {
    await sendEmail({
      to: lead.email,
      subject: `Tu informe de diagnostico esta disponible - ${lead.company}`,
      html: `${lead.report_html}<hr style="margin:32px 0;border:none;border-top:1px solid #eee;"><p style="font-family:Arial,sans-serif;color:#666;font-size:13px;">Si quieres avanzar con implementacion o acompanamiento mensual, responde este correo o escribe a <a href="mailto:info@acpasociados.cl">info@acpasociados.cl</a></p>`
    });
    emailSent = true;
  } catch (e) {
    console.error('Error enviando informe al cliente (no critico):', e.message);
  }

  return json(200, { ok: true, emailSent });
};

function json(statusCode, body) {
  return new Response(JSON.stringify(body), { status: statusCode, headers: { 'Content-Type': 'application/json' } });
}
