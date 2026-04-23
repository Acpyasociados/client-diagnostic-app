import { getLead, saveLead } from './_lib/storage.js';
import { sendEmail } from './_lib/email.js';

export default async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  try {
    const payload = JSON.parse(req.body || '{}');
    const paymentId = payload?.data?.id;
    const topic = payload?.type || payload?.topic;
    if (!paymentId || (topic !== 'payment' && topic !== 'merchant_order')) {
      return new Response('ok', { status: 200 });
    }

    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    const siteUrl = process.env.SITE_URL;
    const reviewerToken = process.env.ADMIN_REVIEW_TOKEN;
    const reviewerEmail = process.env.REVIEWER_EMAIL;
    if (!accessToken || !siteUrl || !reviewerToken || !reviewerEmail) {
      return new Response('missing config', { status: 500 });
    }

    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const payment = await response.json();
    if (!response.ok) return new Response('payment fetch failed', { status: 500 });
    if (payment.status !== 'approved') return new Response('ok', { status: 200 });

    const leadId = payment.metadata?.lead_id;
    if (!leadId) return new Response('ok', { status: 200 });
    const lead = await getLead(leadId);
    if (!lead) return new Response('lead not found', { status: 404 });
    if (lead.payment_status === 'approved') return new Response('ok', { status: 200 });

    lead.payment_status = 'approved';
    lead.status = 'pagado';
    await saveLead(leadId, lead);

    const questionnaireUrl = `${siteUrl}/questionnaire.html?lead_id=${leadId}&token=${lead.client_token}`;
    await sendEmail({
      to: lead.email,
      subject: 'Tu cuestionario sectorial ya está disponible',
      html: `<p>Hola ${lead.name},</p><p>Tu pago fue aprobado. Completa el cuestionario sectorial para activar tu informe final:</p><p><a href="${questionnaireUrl}">${questionnaireUrl}</a></p>`
    });

    await sendEmail({
      to: reviewerEmail,
      subject: `Nuevo caso pagado: ${lead.company}`,
      html: `<p>Se aprobó el pago del lead ${lead.company}.</p><p>Estado: ${lead.status}</p><p>Link de revisión futura: <a href="${siteUrl}/review.html?lead_id=${leadId}&token=${reviewerToken}">abrir revisión</a></p>`
    });

    return new Response('ok', { status: 200 });
  } catch (error) {
    return new Response(error.message, { status: 500 });
  }
};
