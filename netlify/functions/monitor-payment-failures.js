/**
 * monitor-payment-failures.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Función programada (cron) que se ejecuta cada 5 minutos para:
 * 1. Escanear leads con payment_status = 'failed'
 * 2. Verificar que el alert no se haya enviado ya (alert_sent_at)
 * 3. Enviar email inmediato al asesor con detalles
 * 4. Actualizar lead marcando alert_sent_at = now()
 *
 * Configuración en netlify.toml:
 * [functions.monitor-payment-failures]
 *   schedule = "*/5 * * * *"    # cada 5 minutos
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { getStore } from '@netlify/blobs';
import { sendEmail } from './_lib/email.js';

export default async (req, context) => {
  const startTime = Date.now();

  try {
    const advisorEmail = process.env.ADVISOR_EMAIL || 'asesor.pac@gmail.com';
    const store = getStore('diagnostic-leads');
    const { blobs } = await store.list();

    const failedLeads = [];
    const alertsSent = [];
    const errors = [];

    console.log('[MONITOR-FAILURES] Iniciando escaneo de pagos fallidos...');

    // Escanear todos los leads
    for (const { key } of blobs) {
      try {
        const data = await store.get(key);
        if (!data) continue;

        let lead;
        try {
          lead = JSON.parse(data);
        } catch (e) {
          continue;
        }

        // Buscar leads con pago fallido que no hayan generado alert aún
        if (lead.payment_status === 'failed' && !lead.alert_sent_at) {
          failedLeads.push({
            lead_id: key,
            lead: lead
          });
        }
      } catch (err) {
        console.error(`[MONITOR-FAILURES] Error procesando ${key}:`, err.message);
        errors.push({ key, error: err.message });
      }
    }

    console.log(`[MONITOR-FAILURES] Encontrados ${failedLeads.length} pagos fallidos sin alert`);

    // Enviar alerts y actualizar leads
    for (const { lead_id, lead } of failedLeads) {
      try {
        const subject = `⚠️ PAGO FALLIDO - ${lead.company || 'N/A'}`;

        const html = `
          <div style="font-family: sans-serif; padding: 20px; max-width: 600px;">
            <h2 style="color: #dc3545;">⚠️ Pago Rechazado</h2>

            <p><strong>Lead ID:</strong> ${lead_id}</p>
            <p><strong>Cliente:</strong> ${lead.name || 'N/A'}</p>
            <p><strong>Email:</strong> ${lead.email || 'N/A'}</p>
            <p><strong>Empresa:</strong> ${lead.company || 'N/A'}</p>
            <p><strong>Teléfono:</strong> ${lead.phone || 'N/A'}</p>

            <hr>

            <h3>Detalles del Pago</h3>
            <p><strong>Plan:</strong> ${lead.plan || 'N/A'}</p>
            <p><strong>Monto:</strong> $${lead.final_price?.toLocaleString('es-CL') || '0'} CLP</p>
            <p><strong>Código de Error:</strong> ${lead.payment_error_code || 'desconocido'}</p>
            <p><strong>Mensaje de Flow:</strong> ${lead.payment_error_message || 'sin detalles'}</p>

            <hr>

            <h3>Timeline</h3>
            <p><strong>Creado:</strong> ${lead.created_at || 'N/A'}</p>
            <p><strong>Intento fallido:</strong> ${lead.payment_failed_at || 'N/A'}</p>

            <hr>

            <p style="color: #666; font-size: 13px;">
              <strong>Acción recomendada:</strong><br>
              Contactar al cliente para verificar datos de pago o intentar con otro método.
            </p>
          </div>
        `;

        await sendEmail({
          to: advisorEmail,
          subject: subject,
          html: html
        });

        console.log(`[MONITOR-FAILURES] Alert enviado para ${lead_id}`);
        alertsSent.push(lead_id);

        // Actualizar lead con timestamp de alert
        lead.alert_sent_at = new Date().toISOString();
        await store.set(lead_id, JSON.stringify(lead));

      } catch (err) {
        console.error(`[MONITOR-FAILURES] Error enviando alert para ${lead_id}:`, err.message);
        errors.push({ lead_id, error: err.message });
      }
    }

    console.log(`[MONITOR-FAILURES] Total alerts enviados: ${alertsSent.length}`);

    // Respuesta
    return new Response(
      JSON.stringify({
        success: true,
        message: `Monitoreo completado: ${alertsSent.length} alerts enviados`,
        results: {
          failedLeadsFound: failedLeads.length,
          alertsSent: alertsSent.length,
          errors: errors.length,
          executionTimeMs: Date.now() - startTime
        }
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (err) {
    console.error('[MONITOR-FAILURES] Error crítico:', err);

    return new Response(
      JSON.stringify({
        success: false,
        error: err.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};
