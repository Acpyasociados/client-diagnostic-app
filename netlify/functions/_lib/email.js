/**
 * email.js — envía emails via Resend API
 * La variable de entorno se llama SENDGRID_API_KEY pero contiene una clave Resend (re_...)
 * Endpoint correcto: https://api.resend.com/emails
 */
export async function sendEmail({ to, subject, html }) {
  const apiKey = process.env.SENDGRID_API_KEY; // Resend key: re_...
  if (!apiKey) throw new Error('Falta SENDGRID_API_KEY (Resend key re_...)');

  const payload = {
    from:    'ACP & Asociados <patricio.silva@acpasociados.cl>',
    to:      [to],
    subject,
    html
  };

  const res = await fetch('https://api.resend.com/emails', {
    method:  'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type':  'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Resend error ${res.status}: ${errText.substring(0, 300)}`);
  }
  return true;
}
