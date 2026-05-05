import { Resend } from 'resend';

function getClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('Falta RESEND_API_KEY');
  return new Resend(apiKey);
}

export async function sendEmail({ to, subject, html }) {
  const resend = getClient();
  const from = process.env.FROM_EMAIL;
  if (!from) throw new Error('Falta FROM_EMAIL');
  return resend.emails.send({ from, to, subject, html });
}
