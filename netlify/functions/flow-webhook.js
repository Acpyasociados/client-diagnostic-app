import crypto from 'crypto';
import { getLead, saveLead } from './_lib/storage.js';

const FLOW_SECRET_KEY = process.env.FLOW_SECRET_KEY;

function verifyFlowSignature(params, signature, secret) {
  const paramsWithoutSignature = { ...params };
  delete paramsWithoutSignature.s;
  const sortedString = Object.keys(paramsWithoutSignature)
    .sort()
    .map(key => `${key}${paramsWithoutSignature[key]}`)
    .join('');
  const computed = crypto.createHmac('sha256', secret).update(sortedString).digest('hex');
  return computed === signature;
}

async function sendEmail({ to, subject, html }) {
  const apiKey = process.env.SENDGRID_API_KEY; // Resend key: re_...
  if (!apiKey) {
    console.warn('SENDGRID_API_KEY (Resend) no configurada - email omitido para:', to);
    return false;
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from:    'ACP & Asociados <noreply@mail.acpasociados.cl>',
        to:      [to],
        subject,
        html
      })
    });
    if (res.ok) { console.log('Email enviado a:', to); return true; }
    const errText = await res.text();
    console.error('Resend error:', res.status, errText.substring(0, 300));
    return false;
  } catch (err) {
    console.error('Error Resend:', err.message);
    return false;
  }
}

async function sendQuestionnaireEmail(lead) {
  const siteUrl = process.env.SITE_URL || 'https://acp-asociados.netlify.app';
  const questionnaireUrl = `${siteUrl}/questionnaire.html?lead_id=${lead.lead_id}&token=${lead.client_token}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <div style="background: #1a3a5c; padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">ACP & Asociados</h1>
        <p style="color: #a8d4f5; margin: 8px 0 0 0; font-size: 14px;">Diagnóstico Empresarial</p>
      </div>
      <div style="background: white; padding: 32px; border: 1px solid #e0e0e0; border-radius: 0 0 8px 8px;">
        <p style="font-size: 18px; font-weight: bold; color: #1a3a5c;">¡Hola ${lead.name}!</p>
        <p>Tu pago fue confirmado con éxito. Ahora necesitamos que completes un breve cuestionario sectorial para que podamos <strong>personalizar tu diagnóstico empresarial</strong>.</p>
        <div style="background: #f0f7ff; border-left: 4px solid #1a3a5c; padding: 16px; margin: 24px 0; border-radius: 4px;">
          <p style="margin: 0; font-size: 14px; color: #555;">⏱ Tiempo estimado: <strong>5–10 minutos</strong><br>
          📋 Empresa: <strong>${lead.company}</strong><br>
          📦 Plan contratado: <strong>${lead.plan === 'basico' ? 'Básico' : 'Premium'}</strong></p>
        </div>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${questionnaireUrl}" style="background: #1a3a5c; color: white; padding: 16px 40px; border-radius: 6px; text-decoration: none; font-size: 16px; font-weight: bold; display: inline-block;">
            Completar Cuestionario →
          </a>
        </div>
        <p style="font-size: 13px; color: #888; text-align: center;">O copia este enlace: <a href="${questionnaireUrl}" style="color: #1a3a5c;">${questionnaireUrl}</a></p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
        <p style="font-size: 13px; color: #999; margin: 0;">¿Tienes preguntas? Escríbenos a <a href="mailto:patricio.silva@acpasociados.cl" style="color: #1a3a5c;">patricio.silva@acpasociados.cl</a></p>
      </div>
    </div>
  `;

  return sendEmail({
    to: lead.email,
    subject: `[ACP & Asociados] Completa tu cuestionario - ${lead.company}`,
    html
  });
}

async function sendAdvisorPaymentNotification(lead) {
  const siteUrl = process.env.SITE_URL || 'https://acp-asociados.netlify.app';
  const adminUrl = `${siteUrl}/admin.html`;
  const advisorEmail = process.env.ADVISOR_EMAIL || 'asesor.pac@gmail.com';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <div style="background: #1a3a5c; padding: 24px 30px; border-radius: 8px 8px 0 0;">
        <h2 style="color: white; margin: 0; font-size: 20px;">✅ Pago Confirmado</h2>
        <p style="color: #a8d4f5; margin: 6px 0 0 0; font-size: 13px;">Se envió el cuestionario al cliente.</p>
      </div>
      <div style="background: white; padding: 28px; border: 1px solid #e0e0e0; border-radius: 0 0 8px 8px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr><td style="padding: 8px 0; color: #666; width: 40%;">Cliente</td><td style="padding: 8px 0; font-weight: bold;">${lead.name}</td></tr>
          <tr><td style="padding: 8px 0; color: #666;">Email</td><td style="padding: 8px 0;"><a href="mailto:${lead.email}" style="color: #1a3a5c;">${lead.email}</a></td></tr>
          <tr><td style="padding: 8px 0; color: #666;">Empresa</td><td style="padding: 8px 0;">${lead.company}</td></tr>
          <tr><td style="padding: 8px 0; color: #666;">Plan</td><td style="padding: 8px 0;">${lead.plan === 'basico' ? 'Básico' : 'Premium'}</td></tr>
          <tr><td style="padding: 8px 0; color: #666;">Monto pagado</td><td style="padding: 8px 0; font-weight: bold; color: #28a745;">$${Number(lead.final_price || 0).toLocaleString('es-CL')} CLP</td></tr>
          <tr><td style="padding: 8px 0; color: #666;">Fecha pago</td><td style="padding: 8px 0;">${new Date().toLocaleString('es-CL')}</td></tr>
          <tr><td style="padding: 8px 0; color: #666;">Order ID</td><td style="padding: 8px 0; font-size: 12px; color: #888;">${lead.lead_id}</td></tr>
        </table>
        <div style="margin-top: 24px; padding: 16px; background: #f0f7ff; border-radius: 6px; font-size: 13px; color: #555;">
          📋 El cuestionario sectorial ya fue enviado al cliente. Una vez que lo complete, recibirás el borrador del informe para revisión.
        </div>
        <div style="text-align: center; margin-top: 24px;">
          <a href="${adminUrl}" style="background: #1a3a5c; color: white; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: bold; display: inline-block;">
            Ver Panel de Seguimiento →
          </a>
        </div>
      </div>
    </div>
  `;

  return sendEmail({
    to: advisorEmail,
    subject: `[ACP] Pago confirmado - ${lead.company} ($${Number(lead.final_price || 0).toLocaleString('es-CL')} CLP)`,
    html
  });
}

// ─── Handler principal (Netlify Functions v2) ─────────────────────────────────
// CORRECCIÓN: usa Request API (v2), no event.queryStringParameters (v1)
export default async (req) => {
  console.log('=== FLOW WEBHOOK START ===');

  try {
    // FIX v2: leer query params desde la URL del Request, no desde event.queryStringParameters
    const url = new URL(req.url);
    const params = Object.fromEntries(url.searchParams.entries());

    console.log('Webhook params:', {
      commerceOrder: params.commerceOrder,
      status: params.status,
      token: params.token ? params.token.substring(0, 8) + '...' : 'missing'
    });

    // 1. Verificar firma
    const signature = params.s;
    if (!signature) {
      console.error('Missing signature in webhook');
      return new Response(JSON.stringify({ error: 'Missing signature' }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!FLOW_SECRET_KEY) {
      console.error('FLOW_SECRET_KEY no configurada');
      return new Response(JSON.stringify({ error: 'Server config error' }), {
        status: 500, headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!verifyFlowSignature(params, signature, FLOW_SECRET_KEY)) {
      console.error('Invalid Flow webhook signature');
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 401, headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('Firma verificada OK');

    // 2. Obtener lead
    const leadId = params.commerceOrder;
    if (!leadId) {
      return new Response(JSON.stringify({ error: 'Missing commerceOrder' }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }

    const lead = await getLead(leadId);
    if (!lead) {
      console.error('Lead no encontrado:', leadId);
      return new Response(JSON.stringify({ error: 'Lead not found' }), {
        status: 404, headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('Lead encontrado:', leadId, '- status actual:', lead.status);

    // 3. Procesar estado del pago
    // Flow envía status como número: 1=Pendiente, 2=Pagado, 3=Rechazado, 4=Anulado
    const flowStatus = parseInt(params.status);
    console.log('Flow status recibido:', params.status, '→ int:', flowStatus);

    if (flowStatus === 2) {
      // Evitar procesar el mismo pago dos veces
      if (lead.status === 'pagado') {
        console.log('Pago ya procesado anteriormente para:', leadId);
        return new Response(JSON.stringify({ success: true, status: 'ya_procesado' }), {
          status: 200, headers: { 'Content-Type': 'application/json' }
        });
      }

      // Actualizar lead con pago aprobado
      lead.status         = 'pagado';
      lead.payment_status = 'approved';
      lead.paid_at        = new Date().toISOString();
      lead.flow_reference = params.token;

      await saveLead(leadId, lead);
      console.log('Lead actualizado: pagado, payment_status=approved');

      // Enviar cuestionario al cliente
      try {
        await sendQuestionnaireEmail(lead);
        lead.questionnaire_email_sent_at = new Date().toISOString();
        await saveLead(leadId, lead);
      } catch (e) {
        console.error('Error enviando cuestionario (no critico):', e.message);
      }

      // Notificar al asesor
      try {
        await sendAdvisorPaymentNotification(lead);
      } catch (e) {
        console.error('Error notificando asesor (no critico):', e.message);
      }

      return new Response(
        JSON.stringify({ success: true, orderId: leadId, status: 'pagado' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );

    } else {
      console.warn('Pago no aprobado. Status Flow:', params.status, '(', flowStatus, ') orden:', leadId);
      lead.payment_status    = 'failed';
      lead.flow_status       = params.status;
      lead.payment_failed_at = new Date().toISOString();
      await saveLead(leadId, lead);

      return new Response(
        JSON.stringify({ success: false, status: params.status, orderId: leadId }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

  } catch (err) {
    console.error('Flow Webhook error:', err.message, err.stack);
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
