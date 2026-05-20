import crypto from 'crypto';
import { Resend } from 'resend';
import { getStore } from '@netlify/blobs';
import { getLead, saveLead } from './_lib/storage.js';

// ─── Validación de firma MP ──────────────────────────────────────────────────

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

// ─── Templates de email ──────────────────────────────────────────────────────

function advisorEmailHtml(lead, siteUrl, reviewerToken, reportGenerated) {
  const planLabel = lead.plan === 'premium' ? 'PREMIUM' : 'BÁSICO';
  const planPrice = lead.plan === 'premium' ? '149.900' : '49.900';
  return `
    <h2 style="color:#1B3B5C;">✅ Nueva venta confirmada – ${lead.company}</h2>
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
      <tr><td style="padding:9px 12px;border-bottom:1px solid #eee;color:#666;">PDF generado</td><td style="padding:9px 12px;border-bottom:1px solid #eee;">${reportGenerated ? '✅ Enviado al cliente' : '⚠️ Error – revisar logs'}</td></tr>
      <tr><td style="padding:9px 12px;color:#666;font-family:monospace;font-size:11px;">Lead ID</td><td style="padding:9px 12px;font-family:monospace;font-size:11px;">${lead.lead_id}</td></tr>
    </table>
    <a href="${siteUrl}/review.html?lead_id=${lead.lead_id}&token=${reviewerToken}" style="background:#1B3B5C;color:white;padding:12px 24px;text-decoration:none;border-radius:3px;display:inline-block;font-family:Arial,sans-serif;font-size:14px;">Ver caso en revisión</a>
  `;
}

// ─── Handler principal ───────────────────────────────────────────────────────

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

    // ── Paso 1: Marcar lead como pagado ─────────────────────────────────────────
    const paymentDate = new Date().toISOString();
    lead.payment_status = 'approved';
    lead.status = 'paid';
    lead.payment_id = paymentId;
    lead.payment_date = paymentDate;
    lead.report_generated = false;
    await saveLead(leadId, lead);
    console.log('[webhook] Lead marcado como pagado:', leadId);

    // ── Paso 2: Generar PDF ─────────────────────────────────────────────────────
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

    // ── Paso 3: Guardar PDF en Blobs ────────────────────────────────────────────
    if (reportGenerated && pdfBuffer) {
      try {
        const reportStore = getStore('diagnostic-reports');
        await reportStore.set(`report-${leadId}.pdf`, pdfBuffer);
        console.log('[webhook] PDF guardado en Blobs: report-' + leadId + '.pdf');
      } catch (blobErr) {
        console.error('[webhook] Error guardando PDF en Blobs:', blobErr.message);
      }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // CAMBIO: EMAIL A PATRICIO PARA REVISIÓN (NO AL CLIENTE)
    // ══════════════════════════════════════════════════════════════════════════

    const resend = new Resend(process.env.RESEND_API_KEY);
    const planLabel = lead.plan === 'premium' ? 'Premium' : 'Básico';
    
    // URL de aprobación
    const approvalUrl = `https://acp-asociados.netlify.app/admin/approve-and-send?leadId=${leadId}`;

    const reviewEmailPayload = {
      from: 'informes@acpasociados.cl',
      to: 'patricio.silva@acpasociados.cl',
      subject: `🔔 REVISAR: Diagnóstico ${planLabel} - ${lead.company}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: 'Segoe UI', sans-serif; line-height: 1.6; color: #2C3E50; background: #f5f5f5; padding: 20px; }
            .container { max-width: 700px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #E67E22 0%, #F39C12 100%); color: white; padding: 30px 20px; text-align: center; }
            .content { padding: 30px; }
            .info-box { background: #F8F9FA; border-left: 4px solid #16A085; padding: 20px; margin: 20px 0; border-radius: 6px; }
            .info-box table { width: 100%; }
            .info-box td { padding: 8px 0; }
            .info-box td:first-child { font-weight: 600; color: #1B3B5C; width: 150px; }
            .btn-approve { display: block; background: linear-gradient(135deg, #16A085 0%, #3498DB 100%); color: white !important; padding: 20px 40px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 1.2em; text-align: center; margin: 30px auto; max-width: 400px; }
            .warning { background: #FFF3E0; border-left: 4px solid #E67E22; padding: 15px; margin: 20px 0; border-radius: 6px; }
            .instructions { background: #E8F5E9; padding: 20px; border-radius: 8px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔔 NUEVO DIAGNÓSTICO PARA REVISAR</h1>
              <p>Pago aprobado - Requiere tu aprobación</p>
            </div>
            <div class="content">
              <p><strong>Patricio:</strong></p>
              <p>Se generó un nuevo diagnóstico. Revisa el PDF adjunto y aprueba el envío.</p>
              
              <div class="info-box">
                <h3>📋 Información del Pedido</h3>
                <table>
                  <tr><td>Cliente:</td><td><strong>${lead.name}</strong></td></tr>
                  <tr><td>Empresa:</td><td><strong>${lead.company}</strong></td></tr>
                  <tr><td>Email:</td><td>${lead.email}</td></tr>
                  <tr><td>Plan:</td><td><strong>${planLabel}</strong></td></tr>
                  <tr><td>Estado:</td><td><span style="color: #16A085; font-weight: 600;">✅ APROBADO</span></td></tr>
                </table>
              </div>
              
              <div class="instructions">
                <h3>📝 Instrucciones</h3>
                <ol>
                  <li><strong>Abre el PDF adjunto</strong> y revisa el contenido</li>
                  <li><strong>Verifica</strong> que las mejoras sean correctas</li>
                  <li><strong>Si OK:</strong> Click en el botón verde</li>
                  <li><strong>Si hay errores:</strong> No hagas click</li>
                </ol>
              </div>
              
              <a href="${approvalUrl}" class="btn-approve">
                ✅ APROBAR Y ENVIAR AL CLIENTE
              </a>
              
              <div class="warning">
                ⚠️ Al hacer click, el diagnóstico se enviará a ${lead.email}
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    };

    if (reportGenerated && pdfBuffer) {
      reviewEmailPayload.attachments = [{
        filename: `REVISAR-diagnostico-${lead.company.replace(/\s+/g, '-').toLowerCase()}.pdf`,
        content: Buffer.from(pdfBuffer)
      }];
    }

    try {
      await resend.emails.send(reviewEmailPayload);
      console.log('[webhook] Email de revisión enviado a Patricio:', advisorEmail);
    } catch (emailErr) {
      console.error('[webhook] Error enviando email de revisión:', emailErr.message);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // FIN DEL CAMBIO
    // ══════════════════════════════════════════════════════════════════════════

    // ── Paso 5: Email al asesor (notificación adicional) ────────────────────────
    try {
      await resend.emails.send({
        from: 'informes@acpasociados.cl',
        to: advisorEmail,
        subject: `✅ Nueva venta: ${lead.company} (${planLabel}) – ${reportGenerated ? 'PDF generado' : 'PDF pendiente'}`,
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