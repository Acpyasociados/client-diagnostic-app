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

  const isPremium = (lead.plan || '').toLowerCase() === 'premium';
  const advisorPhoneClean = (process.env.ADVISOR_PHONE || '').replace(/[^0-9]/g, '') || '56944018594';
  if (!process.env.ADVISOR_PHONE) console.warn('[approve-report] ADVISOR_PHONE no configurada, usando fallback');
  const waSessionLink = `https://wa.me/${advisorPhoneClean}?text=Hola%2C%20acabo%20de%20recibir%20mi%20informe%20Premium%20de%20ACP%20y%20quiero%20agendar%20mi%20sesi%C3%B3n%20de%20implementaci%C3%B3n.`;

  const emailFooter = isPremium
    ? `<hr style="margin:32px 0;border:none;border-top:1px solid #eee;">
       <div style="font-family:Arial,sans-serif;background:#eff6ff;border:2px solid #3b82f6;border-radius:8px;padding:20px 24px;margin-bottom:24px;">
         <div style="font-weight:700;color:#1e40af;font-size:15px;margin-bottom:8px;">⭐ Tu sesión de implementación está incluida</div>
         <p style="color:#374151;font-size:13px;margin:0 0 10px 0;">Tu Plan Premium incluye una <strong>sesión de 30 minutos</strong> con tu asesor ACP para priorizar la implementación de las oportunidades de este informe.</p>
         <p style="color:#374151;font-size:13px;margin:0 0 16px 0;">Nos contactaremos contigo en los próximos 1-2 días hábiles para coordinar el horario. También puedes escribirnos directamente:</p>
         <a href="${waSessionLink}" style="display:inline-block;background:#25D366;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:13px;">📱 Agendar por WhatsApp</a>
       </div>`
    : `<hr style="margin:32px 0;border:none;border-top:1px solid #eee;">
       <p style="font-family:Arial,sans-serif;color:#666;font-size:13px;">¿Quieres implementar estas oportunidades con acompañamiento experto? Escríbenos a <a href="mailto:contacto@acpasociados.cl">contacto@acpasociados.cl</a> o por <a href="https://wa.me/${advisorPhoneClean}">WhatsApp</a>.</p>`;

  // I-6: Enviar el email PRIMERO — solo marcar como 'enviado' si el email llega.
  let emailSent = false;
  try {
    await sendEmail({
      to: lead.email,
      subject: (isPremium ? '⭐ Tu informe Premium está listo — ' : 'Tu informe de diagnóstico está disponible — ') + lead.company,
      html: `${lead.report_html}${emailFooter}`
    });
    emailSent = true;
  } catch (e) {
    console.error('Error enviando informe al cliente:', e.message);
    return json(500, { ok: false, error: 'No se pudo enviar el email al cliente. El informe NO fue marcado como enviado. Intenta nuevamente.' });
  }

  // Solo actualizamos el estado si el email fue exitoso
  lead.reviewed_by_human = true;
  lead.status            = 'enviado';
  lead.delivered_at      = new Date().toISOString();
  await saveLead(leadId, lead);

  return json(200, { ok: true, emailSent });
};

function json(statusCode, body) {
  return new Response(JSON.stringify(body), { status: statusCode, headers: { 'Content-Type': 'application/json' } });
}
