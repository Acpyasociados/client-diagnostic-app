export async function sendEmail({ to, subject, html }) {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) throw new Error('Falta SENDGRID_API_KEY');
  const fromEmail = 'patricio.silva@acpasociados.cl';
  const payload = {
    personalizations: [{ to: [{ email: to }], subject }],
    from: { email: fromEmail, name: 'ACP & Asociados' },
    content: [{ type: 'text/html', value: html }]
  };
  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`SendGrid error ${res.status}: ${errText.substring(0, 200)}`);
  }
  return true;
}
