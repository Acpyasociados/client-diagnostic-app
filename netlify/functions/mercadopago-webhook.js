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

    // EMAIL AL CLIENTE
    await sendEmail({
      to: lead.email,
      subject: 'Tu cuestionario sectorial ya está disponible',
      html: `<p>Hola ${lead.name},</p><p>Tu pago fue aprobado. Completa el cuestionario sectorial para activar tu informe final:</p><p><a href="${questionnaireUrl}">${questionnaireUrl}</a></p>`
    });

    // EMAIL AL REVISOR
    await sendEmail({
      to: reviewerEmail,
      subject: `Nuevo caso pagado: ${lead.company}`,
      html: `<p>Se aprobó el pago del lead ${lead.company}.</p><p>Estado: ${lead.status}</p><p>Link de revisión futura: <a href="${siteUrl}/review.html?lead_id=${leadId}&token=${reviewerToken}">abrir revisión</a></p>`
    });

    // EMAIL AL ASESOR
    const advisorEmail = process.env.ADVISOR_EMAIL;
    if (advisorEmail) {
      const planPrice = lead.plan === 'basico' ? '49.900' : '149.900';
      const planLabel = lead.plan === 'basico' ? 'BÁSICO' : 'PREMIUM';

      await sendEmail({
        to: advisorEmail,
        subject: `✅ Nuevo cliente pagado: ${lead.company} (${planLabel})`,
        html: `
          <h2>Nuevo cliente pagado</h2>
          <p><strong>Cliente:</strong> ${lead.name}</p>
          <p><strong>Email:</strong> ${lead.email}</p>
          <p><strong>Teléfono:</strong> ${lead.phone}</p>
          <p><strong>Empresa:</strong> ${lead.company}</p>
          <p><strong>Rubro:</strong> ${lead.sector_label || lead.sector}</p>
          <p><strong>Plan:</strong> ${planLabel}</p>
          <p><strong>Monto:</strong> $${planPrice} CLP</p>
          <p><strong>Ventas mensuales:</strong> $${lead.monthly_sales?.toLocaleString('es-CL') || 'N/A'}</p>
          <p><strong>Margen:</strong> ${lead.margin}%</p>
          <p><strong>Problema principal:</strong> ${lead.main_problem}</p>
          <hr/>
          <p>El cliente completará el cuestionario en los próximos minutos.</p>
          <p><a href="${siteUrl}/review.html?lead_id=${leadId}&token=${reviewerToken}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Ver caso en revisión</a></p>
        `
      });
    }

    return new Response('ok', { status: 200 });
  } catch (error) {
    return new Response(error.message, { status: 500 });
  }
};
