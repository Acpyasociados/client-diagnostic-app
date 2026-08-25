import crypto from 'crypto';
import { getLead, saveLead } from './_lib/storage.js';
import { sendAdvisorEmail } from './send-advisor-email.js';

function verifyFlowSignature(params, signature, secret) {
  const paramsWithoutSignature = { ...params };
  delete paramsWithoutSignature.s;
  const sortedParams = Object.keys(paramsWithoutSignature).sort().map(key => `${key}${paramsWithoutSignature[key]}`).join('');
  const computedSignature = crypto.createHash('sha256').update(sortedParams + secret).digest('hex');
  return computedSignature === signature;
}

function sha256Hex(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function normalizeChileanPhone(phone) {
  if (!phone) return null;
  let digits = String(phone).replace(/\D/g, '');
  if (digits.startsWith('56')) return digits;
  if (digits.startsWith('9') && digits.length === 9) return `56${digits}`;
  return digits;
}

async function sendMetaPurchaseEvent(lead, siteUrl) {
  const pixelId = process.env.META_PIXEL_ID;
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN;
  if (!pixelId || !accessToken) {
    console.warn('[flow-webhook] META_PIXEL_ID / META_CAPI_ACCESS_TOKEN no configurados — evento Purchase NO enviado');
    return { sent: false, reason: 'missing_config' };
  }
  const userData = {};
  if (lead.email) userData.em = [sha256Hex(lead.email.trim().toLowerCase())];
  const normalizedPhone = normalizeChileanPhone(lead.phone);
  if (normalizedPhone) userData.ph = [sha256Hex(normalizedPhone)];

  const body = {
    data: [{
      event_name: 'Purchase',
      event_time: Math.floor(Date.now() / 1000),
      event_id: `purchase-${lead.lead_id}`,
      action_source: 'website',
      event_source_url: `${siteUrl}/.netlify/functions/flow-success-page`,
      user_data: userData,
      custom_data: {
        currency: 'CLP',
        value: lead.final_price,
        content_name: `Diagnostico ${lead.plan} - ${lead.company}`,
        content_type: 'product'
      }
    }]
  };
  try {
    const res = await fetch(`https://graph.facebook.com/v21.0/${pixelId}/events?access_token=${accessToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) { console.error('[flow-webhook] Meta CAPI error:', JSON.stringify(data)); return { sent: false, reason: 'api_error' }; }
    console.log('[flow-webhook] Evento Purchase enviado a Meta CAPI');
    return { sent: true };
  } catch (err) {
    console.error('[flow-webhook] Error llamando a Meta CAPI:', err.message);
    return { sent: false, reason: 'exception' };
  }
}

async function sendEmailViaResend({ from, to, subject, html, attachments }) {
  const apiKey = process.env.SENDGRID_API_KEY; // clave de Resend, guardada bajo este nombre en Netlify
  if (!apiKey) { console.error('[flow-webhook] SENDGRID_API_KEY (clave Resend) no configurada'); return { ok: false }; }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to, subject, html, attachments })
  });
  if (!res.ok) { console.error('[flow-webhook] Error Resend:', res.status, await res.text()); return { ok: false }; }
  return { ok: true };
}

function reviewEmailHtml(lead, siteUrl) {
  const planLabel = lead.plan === 'premium' ? 'Premium' : 'Básico';
  return `
    <!DOCTYPE html><html><head><meta charset="UTF-8"></head>
    <body style="font-family:Arial,sans-serif;color:#2C3E50;">
      <h2 style="color:#1B3B5C;">✅ Nueva venta confirmada (Flow) – ${lead.company}</h2>
      <table style="border-collapse:collapse;width:100%;font-size:14px;margin-bottom:20px;">
        <tr><td style="padding:8px;color:#666;width:40%;">Cliente</td><td style="padding:8px;">${lead.name}</td></tr>
        <tr><td style="padding:8px;color:#666;">Email</td><td style="padding:8px;">${lead.email}</td></tr>
        <tr><td style="padding:8px;color:#666;">Teléfono</td><td style="padding:8px;">${lead.phone || 'N/A'}</td></tr>
        <tr><td style="padding:8px;color:#666;">Empresa</td><td style="padding:8px;"><strong>${lead.company}</strong></td></tr>
        <tr><td style="padding:8px;color:#666;">Plan</td><td style="padding:8px;"><strong>${planLabel}</strong></td></tr>
        <tr><td style="padding:8px;color:#666;">Monto</td><td style="padding:8px;"><strong>$${lead.final_price} CLP</strong></td></tr>
        <tr><td style="padding:8px;color:#666;font-family:monospace;font-size:11px;">Lead ID</td><td style="padding:8px;font-family:monospace;font-size:11px;">${lead.lead_id}</td></tr>
      </table>
      <a href="${siteUrl}/admin.html" style="background:#1B3B5C;color:white;padding:12px 24px;text-decoration:none;border-radius:4px;display:inline-block;">Abrir panel de administración</a>
    </body></html>
  `;
}

export default async (event, context) => {
  console.log('=== Flow Webhook Handler START ===');
  try {
    const params = event.queryStringParameters || {};
    const signature = params.s;
    if (!signature || !verifyFlowSignature(params, signature, process.env.FLOW_SECRET_KEY)) {
      console.error('[flow-webhook] Firma inválida');
      return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    const leadId = params.commerceOrder;
    if (!leadId) return new Response(JSON.stringify({ error: 'Missing commerceOrder' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

    const lead = await getLead(leadId);
    if (!lead) { console.error('[flow-webhook] Lead no encontrado:', leadId); return new Response(JSON.stringify({ error: 'Lead not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } }); }

    if (params.status !== 'PAYED') {
      lead.status = 'payment_failed';
      lead.payment_status = params.status;
      await saveLead(leadId, lead);
      return new Response(JSON.stringify({ success: false, status: params.status }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    if (lead.payment_status === 'approved') {
      console.log('[flow-webhook] Lead ya procesado, ignorando duplicado:', leadId);
      return new Response(JSON.stringify({ success: true, duplicate: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    const siteUrl = process.env.SITE_URL;
    const adminToken = process.env.ADMIN_REVIEW_TOKEN;
    const reviewerEmail = process.env.REVIEWER_EMAIL;

    lead.payment_status = 'approved';
    lead.status = 'paid';
    lead.flow_reference = params.token;
    lead.payment_date = new Date().toISOString();
    await saveLead(leadId, lead);
    console.log('[flow-webhook] Lead marcado como pagado:', leadId);

    let pdfBuffer = null, reportGenerated = false;
    try {
      const pdfResponse = await fetch(`${siteUrl}/.netlify/functions/generate-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_id: leadId, admin_token: adminToken })
      });
      if (pdfResponse.ok) {
        pdfBuffer = await pdfResponse.arrayBuffer();
        reportGenerated = true;
        console.log('[flow-webhook] PDF generado:', pdfBuffer.byteLength, 'bytes');
      } else {
        console.error('[flow-webhook] generate-report falló:', pdfResponse.status, await pdfResponse.text());
      }
    } catch (e) {
      console.error('[flow-webhook] Error llamando generate-report:', e.message);
    }

    if (reviewerEmail) {
      const emailPayload = {
        from: process.env.SENDGRID_FROM_EMAIL || 'informes@acpasociados.cl',
        to: reviewerEmail,
        subject: `🔔 REVISAR (Flow): Diagnóstico ${lead.plan === 'premium' ? 'Premium' : 'Básico'} - ${lead.company}`,
        html: reviewEmailHtml(lead, siteUrl)
      };
      if (reportGenerated && pdfBuffer) {
        emailPayload.attachments = [{
          filename: `diagnostico-${String(lead.company).replace(/\s+/g, '-').toLowerCase()}.pdf`,
          content: Buffer.from(pdfBuffer).toString('base64')
        }];
      }
      await sendEmailViaResend(emailPayload);
    } else {
      console.warn('[flow-webhook] REVIEWER_EMAIL no configurado');
    }

    try {
      await sendAdvisorEmail(lead);
    } catch (e) {
      console.error('[flow-webhook] Error email asesor:', e.message);
    }

    const metaResult = await sendMetaPurchaseEvent(lead, siteUrl);
    lead.report_generated = reportGenerated;
    lead.meta_purchase_event_sent = metaResult.sent;
    await saveLead(leadId, lead);

    return new Response(JSON.stringify({ success: true, leadId }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('[flow-webhook] Error no manejado:', error.message, error.stack);
    return new Response(JSON.stringify({ error: 'Internal error', message: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
