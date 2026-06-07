/**
 * health-check.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Scheduled function que corre cada hora y detecta leads atascados.
 * Envía un email de alerta al asesor si hay casos bloqueados.
 *
 * Umbrales de alerta:
 *   pagado              → sin cuestionario enviado tras 4 h  (webhook de pago falló)
 *   cuestionario_completado → sin borrador tras 2 h          (IA/report falló)
 *   borrador_listo      → sin revisión tras 48 h             (asesor no ha revisado)
 *   cambios_solicitados → sin regeneración tras 48 h         (regeneración olvidada)
 *
 * Netlify scheduled functions: https://docs.netlify.com/functions/scheduled-functions/
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { getStore }    from '@netlify/blobs';
import { sendEmail }   from './_lib/email.js';

// Umbrales en milisegundos
const THRESHOLDS = {
  pagado:                  4  * 60 * 60 * 1000,   // 4 horas
  cuestionario_completado: 2  * 60 * 60 * 1000,   // 2 horas
  borrador_listo:          48 * 60 * 60 * 1000,   // 48 horas
  cambios_solicitados:     48 * 60 * 60 * 1000,   // 48 horas
};

const STATUS_LABELS = {
  pagado:                  'Pagado (sin cuestionario)',
  cuestionario_completado: 'Cuestionario completado (sin borrador)',
  borrador_listo:          'Borrador listo (sin revisión del asesor)',
  cambios_solicitados:     'Cambios solicitados (sin regenerar)',
};

export default async (req) => {
  console.log('[health-check] Iniciando revisión de leads atascados…');

  // ── 1. Cargar todos los leads ──────────────────────────────────────────────
  let leads = [];
  try {
    const store = getStore('diagnostic-leads');
    const { blobs } = await store.list();
    for (const blob of blobs) {
      try {
        const raw = await store.get(blob.key);
        if (raw) leads.push(JSON.parse(raw));
      } catch (e) {
        console.warn('[health-check] Error leyendo lead:', blob.key, e.message);
      }
    }
  } catch (e) {
    console.error('[health-check] Error accediendo a Blobs:', e.message);
    return new Response('Error', { status: 500 });
  }

  console.log(`[health-check] ${leads.length} leads cargados`);

  // ── 2. Detectar leads atascados ────────────────────────────────────────────
  const now     = Date.now();
  const stuck   = [];

  for (const lead of leads) {
    const threshold = THRESHOLDS[lead.status];
    if (!threshold) continue;                        // estado no monitoreable

    // Tiempo de referencia: última transición conocida
    const refTime = new Date(
      lead.paid_at ||
      lead.questionnaire_completed_at ||
      lead.draft_generated_at ||
      lead.changes_requested_at ||
      lead.created_at
    ).getTime();

    const hoursStuck = Math.floor((now - refTime) / (1000 * 60 * 60));

    if (now - refTime > threshold) {
      stuck.push({
        lead_id:    lead.lead_id,
        company:    lead.company  || '—',
        name:       lead.name     || '—',
        email:      lead.email    || '—',
        plan:       (lead.plan    || 'basico').toUpperCase(),
        status:     lead.status,
        label:      STATUS_LABELS[lead.status] || lead.status,
        hoursStuck,
      });
    }
  }

  console.log(`[health-check] ${stuck.length} leads atascados encontrados`);

  // ── 3. Enviar alerta si hay leads atascados ────────────────────────────────
  if (stuck.length === 0) {
    console.log('[health-check] Todo en orden — sin alertas');
    return new Response('OK', { status: 200 });
  }

  const advisorEmail = process.env.REVIEWER_EMAIL || 'asesor.pac@gmail.com';
  const siteUrl      = process.env.SITE_URL || 'https://acp-asociados.netlify.app';
  // SEGURIDAD: no incluir el token de admin en emails. El asesor accede al
  // panel ingresando el token manualmente en admin.html.

  // Ordenar: primero los más urgentes (mayor tiempo atascado)
  stuck.sort((a, b) => b.hoursStuck - a.hoursStuck);

  const rows = stuck.map(s => `
    <tr style="border-bottom:1px solid #e2e8f0;">
      <td style="padding:10px 12px;font-weight:600;">${escHtml(s.company)}</td>
      <td style="padding:10px 12px;color:#475569;">${escHtml(s.name)}</td>
      <td style="padding:10px 12px;">
        <span style="background:${s.plan === 'PREMIUM' ? '#dbeafe' : '#f1f5f9'};color:${s.plan === 'PREMIUM' ? '#1e40af' : '#475569'};padding:2px 8px;border-radius:10px;font-size:12px;font-weight:600;">
          ${s.plan}
        </span>
      </td>
      <td style="padding:10px 12px;color:#dc2626;font-size:13px;">${escHtml(s.label)}</td>
      <td style="padding:10px 12px;font-weight:700;color:#dc2626;">${s.hoursStuck}h</td>
      <td style="padding:10px 12px;">
        <a href="${siteUrl}/admin.html" style="color:#2563eb;font-size:12px;">Ver admin →</a>
      </td>
    </tr>`).join('');

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto;">
      <div style="background:#dc2626;padding:20px 24px;border-radius:8px 8px 0 0;display:flex;align-items:center;gap:12px;">
        <span style="font-size:24px;">⚠️</span>
        <div>
          <h2 style="color:white;margin:0;font-size:18px;">Leads atascados — acción requerida</h2>
          <div style="color:rgba(255,255,255,0.8);font-size:13px;margin-top:2px;">${stuck.length} caso${stuck.length > 1 ? 's' : ''} sin avanzar más allá del umbral</div>
        </div>
      </div>
      <div style="background:white;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px;overflow:hidden;">
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          <thead>
            <tr style="background:#f8fafc;">
              <th style="padding:10px 12px;text-align:left;color:#64748b;font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">Empresa</th>
              <th style="padding:10px 12px;text-align:left;color:#64748b;font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">Contacto</th>
              <th style="padding:10px 12px;text-align:left;color:#64748b;font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">Plan</th>
              <th style="padding:10px 12px;text-align:left;color:#64748b;font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">Estado</th>
              <th style="padding:10px 12px;text-align:left;color:#64748b;font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">Tiempo</th>
              <th style="padding:10px 12px;"></th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <div style="padding:16px 20px;background:#fef2f2;border-top:1px solid #fecaca;">
          <p style="margin:0;color:#991b1b;font-size:13px;">
            <strong>Acción recomendada:</strong> revisar cada caso en el panel de administración y verificar los logs de Netlify para identificar el fallo.
          </p>
        </div>
        <div style="padding:16px 20px;text-align:center;">
          <a href="${siteUrl}/admin.html"
             style="background:#1a3a5c;color:white;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:bold;display:inline-block;">
            Ir al panel de administración
          </a>
        </div>
      </div>
      <p style="text-align:center;color:#94a3b8;font-size:11px;margin-top:12px;">
        Este email fue generado automáticamente por el monitor de ACP · ${new Date().toLocaleString('es-CL')}
      </p>
    </div>`;

  try {
    await sendEmail({
      to:      advisorEmail,
      subject: `⚠️ [ACP Monitor] ${stuck.length} lead${stuck.length > 1 ? 's' : ''} atascado${stuck.length > 1 ? 's' : ''} — revisión requerida`,
      html
    });
    console.log(`[health-check] Alerta enviada a ${advisorEmail} con ${stuck.length} casos`);
  } catch (e) {
    console.error('[health-check] Error enviando email de alerta:', e.message);
  }

  return new Response(JSON.stringify({ stuck: stuck.length }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};

function escHtml(str) {
  return String(str || '').replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[c]
  );
}
