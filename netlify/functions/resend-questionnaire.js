/**
 * resend-questionnaire.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Función de recuperación: reenvía el email de cuestionario a un lead que
 * pagó pero no recibió el email (por ejemplo por falla del webhook).
 *
 * USO (solo desde admin.html o llamada directa con token):
 *   POST /.netlify/functions/resend-questionnaire
 *   Body: { "lead_id": "...", "admin_token": "..." }
 *
 * Requiere: ADMIN_REVIEW_TOKEN en env vars de Netlify
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { getLead, saveLead } from './_lib/storage.js';

async function sendEmail({ to, subject, html }) {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) return false;
  const payload = {
    personalizations: [{ to: [{ email: to }], subject }],
    from: { email: 'patricio.silva@acpasociados.cl', name: 'ACP & Asociados' },
    content: [{ type: 'text/html', value: html }]
  };
  try {
    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.ok;
  } catch { return false; }
}

export default async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });

  let body;
  try { body = JSON.parse(await req.text()); } catch { return json(400, { error: 'JSON inválido' }); }

  const { lead_id, admin_token } = body;
  if (!lead_id || !admin_token) return json(400, { error: 'lead_id y admin_token requeridos' });

  // Verificar token de admin
  const validToken = process.env.ADMIN_REVIEW_TOKEN;
  if (!validToken || admin_token !== validToken) return json(403, { error: 'Token inválido' });

  const lead = await getLead(lead_id);
  if (!lead) return json(404, { error: 'Lead no encontrado: ' + lead_id });

  const siteUrl = process.env.SITE_URL || 'https://acp-asociados.netlify.app';
  const questionnaireUrl = `${siteUrl}/questionnaire.html?lead_id=${lead.lead_id}&token=${lead.client_token}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <div style="background: #1a3a5c; padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">ACP & Asociados</h1>
      </div>
      <div style="background: white; padding: 32px; border: 1px solid #e0e0e0; border-radius: 0 0 8px 8px;">
        <p style="font-size: 18px; font-weight: bold; color: #1a3a5c;">¡Hola ${lead.name}!</p>
        <p>Tu pago fue confirmado. Por favor completa el cuestionario para personalizar tu diagnóstico.</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${questionnaireUrl}" style="background: #1a3a5c; color: white; padding: 16px 40px; border-radius: 6px; text-decoration: none; font-size: 16px; font-weight: bold; display: inline-block;">
            Completar Cuestionario →
          </a>
        </div>
        <p style="font-size: 13px; color: #888; text-align: center;">Enlace directo: <a href="${questionnaireUrl}" style="color: #1a3a5c;">${questionnaireUrl}</a></p>
      </div>
    </div>
  `;

  const sent = await sendEmail({
    to: lead.email,
    subject: `[ACP & Asociados] Tu cuestionario - ${lead.company}`,
    html
  });

  if (sent) {
    lead.questionnaire_email_sent_at = new Date().toISOString();
    lead.questionnaire_email_resent = true;
    if (lead.payment_status === 'approved' || lead.status === 'pagado') {
      // ya pagado, solo reenviar
    } else {
      // marcar como pagado si no estaba marcado (pago existió pero webhook falló)
      lead.status = 'pagado';
      lead.payment_status = 'approved';
      lead.paid_at = lead.paid_at || new Date().toISOString();
    }
    await saveLead(lead_id, lead);
    console.log('[resend] Cuestionario reenviado a:', lead.email, 'para lead:', lead_id);
    return json(200, { ok: true, sent_to: lead.email, lead_id, company: lead.company });
  } else {
    return json(500, { error: 'Fallo el envío de email', lead_id, email: lead.email });
  }
};

function json(status, body) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}
