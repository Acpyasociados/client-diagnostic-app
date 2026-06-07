import crypto from 'crypto';
import { getLead, saveLead } from './_lib/storage.js';

const FLOW_API_KEY    = process.env.FLOW_API_KEY;
const FLOW_SECRET_KEY = process.env.FLOW_SECRET_KEY;
const FLOW_API_URL    = process.env.FLOW_API_URL || 'https://www.flow.cl/api';

// ─────────────────────────────────────────────────────────────────────────────
// IMPORTANTE — Contrato real de Flow para urlConfirmation:
// Flow NO manda commerceOrder/status/firma en la URL ni en query params.
// Manda un POST con body application/x-www-form-urlencoded que contiene
// SOLO el campo "token". El merchant debe llamar a payment/getStatus con
// ese token (firmado con su propio secretKey) para obtener el estado real
// del pago (commerceOrder, status, amount, etc.).
//
// El bug anterior asumía que Flow mandaba todo directo (incluida una firma
// "s") en la query string — por eso TODO llegaba undefined y la verificación
// de firma fallaba de inmediato (ver logs: "Missing signature in webhook").
// Resultado: ningún pago real disparó jamás el flujo automático.
// ─────────────────────────────────────────────────────────────────────────────

function generateFlowSignature(params, secret) {
  const sortedString = Object.keys(params)
    .sort()
    .map(key => `${key}${params[key]}`)
    .join('');
  return crypto.createHmac('sha256', secret).update(sortedString).digest('hex');
}

/**
 * Extrae el "token" del POST que envía Flow al confirmar un pago.
 * Soporta application/x-www-form-urlencoded (formato real de Flow),
 * JSON (por si acaso) y query string (fallback / pruebas manuales).
 */
async function extractToken(req) {
  const url = new URL(req.url);

  // 1. Intentar leer el body
  let rawBody = '';
  try {
    rawBody = typeof req.text === 'function' ? await req.text() : '';
  } catch (e) {
    console.warn('No se pudo leer el body del request:', e.message);
  }

  if (rawBody) {
    const contentType = req.headers?.get?.('content-type') || '';

    if (contentType.includes('application/json')) {
      try {
        const parsed = JSON.parse(rawBody);
        if (parsed.token) return parsed.token;
      } catch (e) { /* no era JSON valido, seguimos */ }
    }

    // form-urlencoded (formato real que usa Flow)
    try {
      const params = new URLSearchParams(rawBody);
      if (params.get('token')) return params.get('token');
    } catch (e) { /* ignorar */ }
  }

  // 2. Fallback: query string (pruebas manuales / integraciones alternativas)
  return url.searchParams.get('token');
}

/**
 * Llama a Flow payment/getStatus con el token recibido para obtener
 * el estado REAL y autoritativo del pago (firmado con nuestro secretKey).
 */
async function getFlowPaymentStatus(token) {
  const params = { apiKey: FLOW_API_KEY, token };
  params.s = generateFlowSignature(params, FLOW_SECRET_KEY);

  const qs  = new URLSearchParams(params).toString();
  const res = await fetch(`${FLOW_API_URL}/payment/getStatus?${qs}`, {
    method: 'GET',
    headers: { 'Accept': 'application/json' }
  });

  const data = await res.json();
  if (!res.ok || data.code !== undefined) {
    throw new Error(`Flow getStatus error ${data.code ?? res.status}: ${data.message || 'respuesta inesperada'}`);
  }
  return data; // { flowOrder, commerceOrder, status, amount, payer, ... }
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
  const siteUrl          = process.env.SITE_URL || 'https://acp-asociados.netlify.app';
  const questionnaireUrl = `${siteUrl}/questionnaire.html?lead_id=${lead.lead_id}&token=${lead.client_token}`;
  const statusUrl        = `${siteUrl}/status.html?lead_id=${lead.lead_id}&token=${lead.client_token}`;

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
          📦 Plan contratado: <strong>${lead.plan === 'basico' ? 'Básico' : 'Premium ⭐'}</strong></p>
        </div>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${questionnaireUrl}" style="background: #1a3a5c; color: white; padding: 16px 40px; border-radius: 6px; text-decoration: none; font-size: 16px; font-weight: bold; display: inline-block;">
            Completar Cuestionario →
          </a>
        </div>
        <p style="font-size: 13px; color: #888; text-align: center;">O copia este enlace: <a href="${questionnaireUrl}" style="color: #1a3a5c;">${questionnaireUrl}</a></p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
        <div style="background: #f8fafc; border-radius: 6px; padding: 14px 16px; margin-bottom: 16px;">
          <p style="margin: 0; font-size: 13px; color: #475569;">
            🔍 <strong>Sigue el estado de tu informe en tiempo real:</strong><br>
            <a href="${statusUrl}" style="color: #2563eb; font-size: 13px;">${statusUrl}</a>
          </p>
        </div>
        <p style="font-size: 13px; color: #999; margin: 0;">¿Tienes preguntas? Escríbenos a <a href="mailto:contacto@acpasociados.cl" style="color: #1a3a5c;">contacto@acpasociados.cl</a></p>
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
  const advisorEmail = process.env.ADVISOR_EMAIL;
  if (!advisorEmail) { console.error('[flow-webhook] ADVISOR_EMAIL no configurada'); }

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
export default async (req) => {
  console.log('=== FLOW WEBHOOK START ===');

  try {
    if (!FLOW_API_KEY || !FLOW_SECRET_KEY) {
      console.error('FLOW_API_KEY / FLOW_SECRET_KEY no configuradas');
      return new Response(JSON.stringify({ error: 'Server config error' }), {
        status: 500, headers: { 'Content-Type': 'application/json' }
      });
    }

    // 1. Extraer el token que Flow manda en el POST (form-urlencoded)
    const token = await extractToken(req);
    if (!token) {
      console.error('Webhook sin token — no se puede confirmar el pago');
      return new Response(JSON.stringify({ error: 'Missing token' }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }
    console.log('Token recibido de Flow:', token.substring(0, 12) + '...');

    // 2. Consultar el estado REAL y autoritativo del pago en Flow
    let statusData;
    try {
      statusData = await getFlowPaymentStatus(token);
    } catch (e) {
      console.error('Error consultando payment/getStatus:', e.message);
      return new Response(JSON.stringify({ error: 'getStatus failed', message: e.message }), {
        status: 502, headers: { 'Content-Type': 'application/json' }
      });
    }

    const leadId     = statusData.commerceOrder;
    const flowStatus = parseInt(statusData.status);
    console.log('Flow getStatus →', { leadId, status: statusData.status, flowOrder: statusData.flowOrder });

    if (!leadId) {
      console.error('getStatus no devolvió commerceOrder:', JSON.stringify(statusData));
      return new Response(JSON.stringify({ error: 'Missing commerceOrder in getStatus response' }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }

    // 3. Obtener lead
    const lead = await getLead(leadId);
    if (!lead) {
      console.error('Lead no encontrado:', leadId);
      return new Response(JSON.stringify({ error: 'Lead not found' }), {
        status: 404, headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('Lead encontrado:', leadId, '- status actual:', lead.status);

    // 4. Procesar estado del pago
    // Flow status: 1=Pendiente, 2=Pagado, 3=Rechazado, 4=Anulado
    if (flowStatus === 2) {
      // I-8: Idempotencia robusta — comparar payment_status, no status del pipeline.
      // Si el lead ya avanzó a cuestionario_completado/borrador_listo/etc.
      // y Flow reintenta el webhook, no se resetea el flujo.
      if (lead.payment_status === 'approved') {
        console.log('Pago ya procesado anteriormente para:', leadId);
        return new Response(JSON.stringify({ success: true, status: 'ya_procesado' }), {
          status: 200, headers: { 'Content-Type': 'application/json' }
        });
      }

      // I-1: Validar que el monto cobrado coincida con el precio del lead.
      // Segunda línea de defensa ante manipulación de precio.
      const expectedPrice  = Number(lead.final_price);
      const receivedAmount = Number(statusData.amount);
      if (expectedPrice > 0 && receivedAmount < expectedPrice) {
        console.error(`MONTO INCORRECTO — recibido $${receivedAmount} < esperado $${expectedPrice} (lead: ${leadId})`);
        lead.payment_status   = 'amount_mismatch';
        lead.fraud_detected   = true;
        lead.fraud_at         = new Date().toISOString();
        lead.flow_amount_recv = receivedAmount;
        await saveLead(leadId, lead);
        // Responder 200 para que Flow no reintente (ya registramos el fraude)
        return new Response(JSON.stringify({ error: 'Amount mismatch', received: receivedAmount, expected: expectedPrice }), {
          status: 200, headers: { 'Content-Type': 'application/json' }
        });
      }

      // Actualizar lead con pago aprobado
      lead.status         = 'pagado';
      lead.payment_status = 'approved';
      lead.paid_at        = new Date().toISOString();
      lead.flow_reference = token;
      lead.flow_order     = statusData.flowOrder || lead.flow_order;

      await saveLead(leadId, lead);
      console.log('Lead actualizado: pagado, payment_status=approved');

      // Enviar cuestionario al cliente
      try {
        await sendQuestionnaireEmail(lead);
        lead.questionnaire_email_sent_at = new Date().toISOString();
        lead.questionnaire_sent = true;
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
      console.warn('Pago no aprobado. Status Flow:', statusData.status, '(', flowStatus, ') orden:', leadId);
      lead.payment_status    = 'failed';
      lead.flow_status       = statusData.status;
      lead.payment_failed_at = new Date().toISOString();
      await saveLead(leadId, lead);

      return new Response(
        JSON.stringify({ success: false, status: statusData.status, orderId: leadId }),
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
