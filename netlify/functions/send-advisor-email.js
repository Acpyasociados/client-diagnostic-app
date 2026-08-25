export async function sendAdvisorEmail(lead) {
  const apiKey      = process.env.SENDGRID_API_KEY; // Resend key: re_...
  const advisorEmail = process.env.ADVISOR_EMAIL;
  if (!advisorEmail) {
    console.error('[send-advisor-email] ADVISOR_EMAIL no configurada — email omitido');
    return false;
  }

  if (!apiKey) {
    console.warn('[email] SENDGRID_API_KEY (Resend) no configurada');
    return false;
  }

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#333;">
      <div style="background:#1a3a5c;padding:24px;border-radius:8px 8px 0 0;">
        <h2 style="color:white;margin:0;">Nueva solicitud de diagnóstico</h2>
      </div>
      <div style="background:white;padding:28px;border:1px solid #e0e0e0;border-radius:0 0 8px 8px;">
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr><td style="padding:6px 0;color:#666;width:40%;">Cliente</td><td style="padding:6px 0;font-weight:bold;">${lead.name}</td></tr>
          <tr><td style="padding:6px 0;color:#666;">Email</td><td style="padding:6px 0;">${lead.email}</td></tr>
          <tr><td style="padding:6px 0;color:#666;">Teléfono</td><td style="padding:6px 0;">${lead.phone}</td></tr>
          <tr><td style="padding:6px 0;color:#666;">Empresa</td><td style="padding:6px 0;">${lead.company}</td></tr>
          <tr><td style="padding:6px 0;color:#666;">Rubro</td><td style="padding:6px 0;">${lead.sector_label || lead.sector}</td></tr>
          <tr><td style="padding:6px 0;color:#666;">Ventas mensuales</td><td style="padding:6px 0;">$${Number(lead.monthly_sales||0).toLocaleString('es-CL')}</td></tr>
          <tr><td style="padding:6px 0;color:#666;">Plan</td><td style="padding:6px 0;">${lead.plan === 'basico' ? 'Básico' : 'Premium'}</td></tr>
          <tr><td style="padding:6px 0;color:#666;">Precio final</td><td style="padding:6px 0;font-weight:bold;color:#28a745;">$${Number(lead.final_price||0).toLocaleString('es-CL')} CLP</td></tr>
        </table>
      </div>
    </div>`;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method:  'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from:    'ACP & Asociados <noreply@mail.acpasociados.cl>',
        to:      [advisorEmail],
        subject: `Nueva solicitud de diagnóstico - ${lead.company}`,
        html
      })
    });
    if (res.ok) { console.log('[email] Enviado al asesor:', advisorEmail); return true; }
    const errText = await res.text();
    console.error('[email] Resend error:', res.status, errText.substring(0, 300));
    return false;
  } catch (err) {
    console.error('[email] Error:', err.message);
    return false;
  }
}
