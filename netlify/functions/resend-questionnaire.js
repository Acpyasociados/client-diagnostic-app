import { getLead, saveLead } from './_lib/storage.js';

async function sendEmail({ to, subject, html }) {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) return { ok: false, error: 'SENDGRID_API_KEY no configurada' };
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: 'ACP & Asociados <noreply@mail.acpasociados.cl>', to: [to], subject, html })
    });
    if (res.ok) return { ok: true };
    const errText = await res.text();
    return { ok: false, error: `Resend ${res.status}: ${errText.substring(0, 200)}` };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

export default async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });

  let body;
  try { body = JSON.parse(await req.text()); } catch { return json(400, { error: 'JSON inválido' }); }

  const { lead_id, admin_token } = body;
  if (!lead_id || !admin_token) return json(400, { error: 'lead_id y admin_token requeridos' });

  const validToken = process.env.ADMIN_REVIEW_TOKEN;
  if (!validToken || admin_token !== validToken) return json(403, { error: 'Token inválido' });

  let lead;
  try {
    lead = await getLead(lead_id);
  } catch (err) {
    return json(500, { error: 'Error leyendo storage: ' + err.message, lead_id });
  }

  if (!lead) return json(404, { error: 'Lead no encontrado en diagnostic-leads store', lead_id });

  const siteUrl = process.env.SITE_URL || 'https://acp-asociados.netlify.app';
  const questionnaireUrl = `${siteUrl}/questionnaire.html?lead_id=${lead.lead_id}&token=${lead.client_token}`;

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:#1a3a5c;padding:30px;border-radius:8px 8px 0 0;text-align:center;">
        <h1 style="color:white;margin:0;">ACP & Asociados</h1>
      </div>
      <div style="background:white;padding:32px;border:1px solid #e0e0e0;border-radius:0 0 8px 8px;">
        <p style="font-size:18px;font-weight:bold;color:#1a3a5c;">¡Hola ${lead.name}!</p>
        <p>Tu pago fue confirmado. Completa el cuestionario para personalizar tu diagnóstico.</p>
        <div style="text-align:center;margin:32px 0;">
          <a href="${questionnaireUrl}" style="background:#1a3a5c;color:white;padding:16px 40px;border-radius:6px;text-decoration:none;font-size:16px;font-weight:bold;display:inline-block;">
            Completar Cuestionario →
          </a>
        </div>
        <p style="font-size:12px;color:#888;text-align:center;word-break:break-all;">${questionnaireUrl}</p>
      </div>
    </div>`;

  const emailResult = await sendEmail({
    to: lead.email,
    subject: `[ACP & Asociados] Tu cuestionario - ${lead.company}`,
    html
  });

  // Actualizar estado aunque falle el email
  try {
    lead.questionnaire_email_resent = true;
    lead.questionnaire_email_resent_at = new Date().toISOString();
    if (!lead.status || lead.status === 'pending') {
      lead.status = 'pagado';
      lead.payment_status = 'approved';
      lead.paid_at = lead.paid_at || new Date().toISOString();
    }
    await saveLead(lead_id, lead);
  } catch (err) {
    console.error('[resend] Error guardando lead (no crítico):', err.message);
  }

  return json(200, {
    ok:         emailResult.ok,
    sent_to:    lead.email,
    lead_id,
    company:    lead.company,
    name:       lead.name,
    status:     lead.status,
    email_error: emailResult.error || null,
    questionnaire_url: questionnaireUrl
  });
};

function json(status, body) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}
