import crypto from 'crypto';
import { Resend } from 'resend';
import { getStore } from '@netlify/blobs';
import { getLead, saveLead } from './_lib/storage.js';

// ─── Validación de firma MP ────────────────────────────────────────────────────

function verifyMpSignature(req, paymentId) {
  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
  if (!secret) return true; // sin secreto configurado, pasar (modo dev)

  const xSignature = req.headers.get('x-signature');
  const xRequestId = req.headers.get('x-request-id');
  if (!xSignature || !xRequestId) return false;

  // formato: "ts=<timestamp>,v1=<hash>"
  const parts = Object.fromEntries(xSignature.split(',').map(p => p.split('=')));
  const ts = parts.ts;
  const v1 = parts.v1;
  if (!ts || !v1) return false;

  const template = `id:${paymentId};request-id:${xRequestId};ts:${ts};`;
  const expected = crypto.createHmac('sha256', secret).update(template).digest('hex');

  if (v1.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(v1), Buffer.from(expected));
}

// ─── Templates de email ────────────────────────────────────────────────────────

function clientEmailHtml(lead) {
  const planLabel = lead.plan === 'premium' ? 'PREMIUM' : 'BÁSICO';
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:20px;background:#ECF0F3;font-family:'Segoe UI',Arial,sans-serif;color:#2C3E50;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:4px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    <div style="background:#1B3B5C;padding:32px;text-align:center;">
      <div style="font-size:28px;font-weight:700;color:#fff;letter-spacing:4px;">ACP</div>
      <div style="font-size:11px;color:#3498DB;letter-spacing:3px;text-transform:uppercase;margin-top:4px;">&amp; Asociados</div>
    </div>
    <div style="padding:40px 32px;">
      <h2 style="color:#1B3B5C;margin:0 0 16px;font-size:20px;">Hola ${lead.name},</h2>
      <p style="line-height:1.75;margin:0 0 20px;">Tu pago fue confirmado y tu <strong>Diagnóstico Empresarial Accionable</strong> para <strong>${lead.company}</strong> está listo. Lo encontrarás adjunto a este correo en formato PDF.</p>
      <div style="background:#ECF0F3;border-radius:3px;padding:20px;margin:0 0 24px;">
        <p style="margin:0;font-size:13px;"><strong>Plan:</strong> ${planLabel}</p>
        <p style="margin:8px 0 0;font-size:13px;"><strong>Empresa:</strong> ${lead.company}</p>
        <p style="margin:8px 0 0;font-size:13px;"><strong>Sector:</strong> ${lead.sector_label || lead.sector}</p>
      </div>
      <p style="line-height:1.75;margin:0;">El informe contiene las 3 oportunidades de mejora prioritarias para tu negocio y un plan de acción concreto para los próximos 90 días. Si tienes preguntas, responde directamente a este correo.</p>
    </div>
    <div style="background:#2C3E50;padding:20px;text-align:center;">
      <p style="color:rgba(255,255,255,0.4);margin:0;font-size:11px;">ACP &amp; Asociados · contacto@acpasociados.cl</p>
    </div>
  </div>
</body>
</html>`;
}

function advisorEmailHtml(lead, siteUrl, reviewerToken, reportGenerated) {
  const planLabel = lead.plan === 'premium' ? 'PREMIUM' : 'BÁSICO';
  const planPrice = lead.plan === 'premium' ? '149.900' : '49.900';
  return `
    <h2 style="color:#1B3B5C;">✅ Nueva venta confirmada — ${lead.company}</h2>
    <table style="border-collapse:collapse;width:100%;font-family:Arial,sans-serif;font-size:14px;margin-bottom:20px;">
      <tr><td style="padding:9px 12px;border-bottom:1px solid #eee;color:#666;width:40%;">Cliente</td><td style="padding:9px 12px;border-bottom:1px solid #eee;">${lead.name}</td></tr>
      <tr><td style="padding:9px 12px;border-bottom:1px solid #eee;color:#666;">Email</td><td style="padding:9px 12px;border-bottom:1px solid #eee;">${lead.email}</td></tr>
      <tr><td style="padding:9px 12px;border-bottom:1px solid #eee;color:#666;">Teléfono</td><td style="padding:9px 12px;border-bottom:1px solid #eee;">${lead.phone}</td></tr>
      <tr><td style="padding:9px 12px;border-bottom:1px solid #eee;color:#666;">Empresa</td><td style="padding:9px 12px;border-bottom:1px solid #eee;"><strong>${lead.company}</strong></td></tr>
      <tr><td style="padding:9px 12px;border-bottom:1px solid #eee;color:#666;">Sector</td><td style="padding:9px 12px;border-bottom:1px solid #eee;">${lead.sector_label || lead.sector}</td></tr>
      <tr><td style="padding:9px 12px;border-bottom:1px solid #eee;color:#666;">Plan</td><td style="padding:9px 12px;border-bottom:1px solid #eee;"><strong>${planLabel}</strong></td></tr>
      <tr><td style="padding:9px 12px;border-bottom:1px solid #eee;color:#666;">Monto</td><td style="padding:9px 12px;border-bottom:1px solid #eee;"><strong>$${planPrice} CLP</strong></td></tr>
      <tr><td style="padding:9px 12px;border-bottom:1px solid #eee;color:#666;">Ventas mensuales</td><td style="padding:9px 12px;border-bottom:1px solid #eee;">${lead.monthly_sales || 'N/A'}</td></tr>
      <tr><td style="padding:9px 12px;border-bottom:1px solid #eee;color:#666;">Margen</td><td style="padding:9px 12px;border-bottom:1px solid #eee;">${lead.margin != null ? lead.margin + '%' : 'N/A'}</td></tr>
      <tr><td style="padding:9px 12px;border-bottom:1px solid #eee;color:#666;">Problema declarado</td><td style="padding:9px 12px;border-bottom:1px solid #eee;">${lead.main_problem || 'N/A'}</td></tr>
      <tr><td style="padding:9px 12px;border-bottom:1px solid #eee;color:#666;">PDF generado</td><td style="padding:9px 12px;border-bottom:1px solid #eee;">${reportGenerated ? '✅ Enviado al cliente' : '⚠️ Error — revisar logs'}</td></tr>
      <tr><td style="padding:9px 12px;color:#666;font-family:monospace;font-size:11px;">Lead ID</td><td style="padding:9px 12px;font-family:monospace;font-size:11px;">${lead.lead_id}</td></tr>
    </table>
    <a href="${siteUrl}/review.html?lead_id=${lead.lead_id}&token=${reviewerToken}" style="background:#1B3B5C;color:white;padding:12px 24px;text-decoration:none;border-radius:3px;display:inline-block;font-family:Arial,sans-serif;font-size:14px;">Ver caso en revisión</a>
  `;
}

// ─── Handler principal ─────────────────────────────────────────────────────────

export default async (req) => {
  if (req.method === 'GET') return new Response('ok', { status: 200 });
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  try {
    const rawBody = await req.text();
    const payload = JSON.parse(rawBody || '{}');
    const paymentId = payload?.data?.id;
    const topic = payload?.type || payload?.topic;

    console.log('[webhook] Evento recibido:', { topic, paymentId });

    if (!paymentId || topic !== 'payment') {
      console.log('[webhook] Ignorando evento no-payment');
      return new Response('ok', { status: 200 });
    }

    if (!verifyMpSignature(req, paymentId)) {
      console.error('[webhook] Firma MP inválida');
      return new Response('invalid signature', { status: 401 });
    }

    const accessToken   = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    const siteUrl       = process.env.SITE_URL;
    const reviewerToken = process.env.ADMIN_REVIEW_TOKEN;
    const reviewerEmail = process.env.REVIEWER_EMAIL;
    const advisorEmail  = process.env.ADVISOR_EMAIL || 'patricio.silva@acpasociados.cl';

    if (!accessToken || !siteUrl || !reviewerToken || !reviewerEmail) {
      console.error('[webhook] Faltan variables de entorno');
      return new Response('missing config', { status: 500 });
    }

    // Obtener datos del pago desde MP
    console.log('[webhook] Consultando pago en MP:', paymentId);
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const payment = await mpRes.json();

    console.log('[webhook] Payment status:', payment.status, '| external_reference:', payment.external_reference);

    if (!mpRes.ok) {
      console.error('[webhook] Error consultando MP:', JSON.stringify(payment));
      return new Response('payment fetch failed', { status: 500 });
    }
    if (payment.status !== 'approved') {
      console.log('[webhook] Pago no aprobado, ignorando');
      return new Response('ok', { status: 200 });
    }

    const leadId = payment.external_reference;
    if (!leadId) {
      console.error('[webhook] Sin external_reference en el pago');
      return new Response('ok', { status: 200 });
    }

    const lead = await getLead(leadId);
    if (!lead) {
      console.error('[webhook] Lead no encontrado:', leadId);
      return new Response('lead not found', { status: 404 });
    }
    if (lead.payment_status === 'approved') {
      console.log('[webhook] Lead ya procesado, ignorando duplicado:', leadId);
      return new Response('ok', { status: 200 });
    }

    // ── Paso 1: Marcar lead como pagado ────────────────────────────────────────
    const paymentDate = new Date().toISOString();
    lead.payment_status = 'approved';
    lead.status = 'paid';
    lead.payment_id = paymentId;
    lead.payment_date = paymentDate;
    lead.report_generated = false;
    await saveLead(leadId, lead);
    console.log('[webhook] Lead marcado como pagado:', leadId);

    // ── Paso 2: Generar PDF ────────────────────────────────────────────────────
    console.log('[webhook] Llamando generate-report para lead:', leadId);
    let pdfBuffer = null;
    let reportGenerated = false;

    try {
      const pdfResponse = await fetch(`${siteUrl}/.netlify/functions/generate-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_id: leadId })
      });

      console.log('[webhook] generate-report respondió con status:', pdfResponse.status);

      if (pdfResponse.ok) {
        pdfBuffer = await pdfResponse.arrayBuffer();
        console.log('[webhook] PDF generado correctamente, tamaño:', pdfBuffer.byteLength, 'bytes');
        reportGenerated = true;
      } else {
        const errText = await pdfResponse.text();
        console.error('[webhook] generate-report falló:', pdfResponse.status, errText);
      }
    } catch (pdfErr) {
      console.error('[webhook] Error llamando generate-report:', pdfErr.message);
    }

    // ── Paso 3: Guardar PDF en Blobs ───────────────────────────────────────────
    if (reportGenerated && pdfBuffer) {
      try {
        const reportStore = getStore('diagnostic-reports');
        await reportStore.set(`report-${leadId}.pdf`, pdfBuffer);
        console.log('[webhook] PDF guardado en Blobs: report-' + leadId + '.pdf');
      } catch (blobErr) {
        console.error('[webhook] Error guardando PDF en Blobs:', blobErr.message);
      }
    }

    // ── Paso 4: Email al cliente con PDF adjunto ───────────────────────────────
    const resend = new Resend(process.env.RESEND_API_KEY);

    const clientEmailPayload = {
      from: 'informes@acpasociados.cl',
      to: lead.email,
      subject: `Tu Diagnóstico Empresarial - ${lead.company}`,
      html: clientEmailHtml(lead)
    };
    if (reportGenerated && pdfBuffer) {
      clientEmailPayload.attachments = [{
        filename: `diagnostico-${lead.company.replace(/\s+/g, '-').toLowerCase()}.pdf`,
        content: Buffer.from(pdfBuffer)
      }];
    }

    try {
      await resend.emails.send(clientEmailPayload);
      console.log('[webhook] Email enviado al cliente:', lead.email, '| adjunto PDF:', reportGenerated);
    } catch (emailErr) {
      console.error('[webhook] Error enviando email al cliente:', emailErr.message);
    }

    // ── Paso 5: Email al asesor ────────────────────────────────────────────────
    const planLabel = lead.plan === 'premium' ? 'PREMIUM' : 'BÁSICO';
    try {
      await resend.emails.send({
        from: 'informes@acpasociados.cl',
        to: advisorEmail,
        subject: `✅ Nueva venta: ${lead.company} (${planLabel}) — ${reportGenerated ? 'PDF generado' : 'PDF pendiente'}`,
        html: advisorEmailHtml(lead, siteUrl, reviewerToken, reportGenerated)
      });
      console.log('[webhook] Email enviado al asesor:', advisorEmail);
    } catch (advisorErr) {
      console.error('[webhook] Error enviando email al asesor:', advisorErr.message);
    }

    // ── Paso 6: Actualizar lead con estado final ────────────────────────────────
    lead.report_generated = reportGenerated;
    lead.report_generated_at = reportGenerated ? new Date().toISOString() : null;
    await saveLead(leadId, lead);
    console.log('[webhook] Lead actualizado. report_generated:', reportGenerated, '| lead_id:', leadId);

    return new Response('ok', { status: 200 });

  } catch (error) {
    console.error('[webhook] Error no manejado:', error.message, error.stack);
    return new Response(error.message, { status: 500 });
  }
};
