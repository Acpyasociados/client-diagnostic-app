/**
 * free-followup.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Secuencia de seguimiento automática para leads del diagnóstico gratuito.
 * Se ejecuta una vez al día (schedule en netlify.toml).
 *
 * Día 1: las 4 oportunidades bloqueadas
 * Día 3: la oportunidad principal desarrollada + qué incluye el informe
 * Día 7: cierre directo con WhatsApp (último email)
 *
 * Salta leads: dados de baja (optout), ya convertidos a informe pagado,
 * o que ya completaron la secuencia. Máximo 1 email por lead por día.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { getStore } from '@netlify/blobs';

const SITE_URL = 'https://acp-asociados.netlify.app';
const WA_LINK  = 'https://wa.me/56944018594';

function unsubUrl(lead) {
  return `${SITE_URL}/.netlify/functions/free-unsubscribe?id=${lead.id}&t=${lead.unsub_token}`;
}

function ctaUrl(campaign) {
  return `${SITE_URL}/?plan=basico&utm_source=followup&utm_medium=email&utm_campaign=${campaign}`;
}

function emailShell(lead, innerHtml, campaign) {
  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:24px 16px;">
  <div style="background:linear-gradient(135deg,#1a2d3e,#2C3E50);border-radius:12px 12px 0 0;padding:24px 28px;text-align:center;">
    <div style="font-size:12px;color:rgba(255,255,255,0.7);letter-spacing:1px;">ACP & ASOCIADOS</div>
  </div>
  <div style="background:white;padding:28px;border:1px solid #e0e0e0;border-top:none;">
    ${innerHtml}
    <div style="text-align:center;margin:26px 0 6px;">
      <a href="${ctaUrl(campaign)}" style="background:#e67e22;color:white;font-weight:700;font-size:15px;padding:14px 32px;border-radius:8px;text-decoration:none;display:inline-block;">Ver Informe Completo — $49.900</a>
    </div>
  </div>
  <div style="text-align:center;padding:18px;color:#999;font-size:11px;">
    <p style="margin:0;">ACP & Asociados · Asesoría Financiera para PyMEs · Providencia, Santiago</p>
    <p style="margin:6px 0 0;"><a href="${unsubUrl(lead)}" style="color:#999;">No quiero recibir más correos</a></p>
  </div>
</div></body></html>`;
}

/* ── Email Día 1: las oportunidades bloqueadas ── */
function emailD1(lead) {
  const otras = (lead.report?.otras_oportunidades || []).map(o =>
    `<div style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:#f8f9fa;border-radius:6px;margin-bottom:8px;">
      <span style="font-size:15px;">🔒</span><span style="color:#444;font-size:14px;">${o}</span>
    </div>`).join('');
  const inner = `
    <p style="color:#333;font-size:15px;line-height:1.7;margin:0 0 14px;">Hola <strong>${lead.name}</strong>,</p>
    <p style="color:#555;font-size:14px;line-height:1.7;margin:0 0 18px;">Ayer revisaste el diagnóstico gratuito de <strong>${lead.company}</strong>. Te mostramos 1 oportunidad — pero el análisis identificó <strong>4 más que quedaron bloqueadas</strong>:</p>
    ${otras}
    <p style="color:#555;font-size:14px;line-height:1.7;margin:18px 0 0;">El Informe Completo las desarrolla con plan de acción semana a semana, proyección en pesos para tu nivel de ventas, y revisión de un asesor senior antes de llegar a tu correo.</p>`;
  return {
    subject: `${lead.name}, quedaron 4 oportunidades sin abrir — ${lead.company}`,
    html: emailShell(lead, inner, 'seguimiento_d1')
  };
}

/* ── Email Día 3: la oportunidad principal + qué incluye ── */
function emailD3(lead) {
  const opp = lead.report?.oportunidad_principal || {};
  const inner = `
    <p style="color:#333;font-size:15px;line-height:1.7;margin:0 0 14px;">Hola <strong>${lead.name}</strong>,</p>
    <p style="color:#555;font-size:14px;line-height:1.7;margin:0 0 18px;">Te recuerdo lo que tu propio diagnóstico detectó para <strong>${lead.company}</strong>:</p>
    <div style="border:2px solid #16a085;border-radius:10px;padding:18px 20px;background:#f0faf8;margin-bottom:18px;">
      <div style="font-weight:700;color:#16a085;font-size:15px;margin-bottom:8px;">${opp.titulo || 'Tu oportunidad principal'}</div>
      <p style="color:#333;font-size:14px;line-height:1.65;margin:0 0 10px;">${opp.descripcion || ''}</p>
      <div style="background:#16a085;color:white;display:inline-block;padding:4px 12px;border-radius:20px;font-size:13px;font-weight:600;">Impacto estimado: ${opp.impacto_estimado || ''}</div>
    </div>
    <p style="color:#555;font-size:14px;line-height:1.7;margin:0;">Esta es <strong>1 de las 5</strong> que identificamos. La pregunta no es si tu negocio tiene oportunidades — ya sabes que sí. La pregunta es cuánto te cuesta cada mes no ejecutarlas. El informe completo incluye el plan de 90 días para las 5, comparado con datos reales de ${(lead.sector_label || 'tu rubro').toLowerCase()} en Chile.</p>`;
  return {
    subject: `${opp.impacto_estimado ? opp.impacto_estimado + ' que ' + lead.company + ' deja sobre la mesa' : 'Lo que ' + lead.company + ' deja sobre la mesa cada mes'}`,
    html: emailShell(lead, inner, 'seguimiento_d3')
  };
}

/* ── Email Día 7: cierre directo (último de la secuencia) ── */
function emailD7(lead) {
  const inner = `
    <p style="color:#333;font-size:15px;line-height:1.7;margin:0 0 14px;">Hola <strong>${lead.name}</strong>,</p>
    <p style="color:#555;font-size:14px;line-height:1.7;margin:0 0 14px;">Este es el último correo que te envío sobre el diagnóstico de <strong>${lead.company}</strong> — no me gusta insistir más de lo necesario.</p>
    <p style="color:#555;font-size:14px;line-height:1.7;margin:0 0 14px;">Solo dos caminos quedan abiertos:</p>
    <p style="color:#555;font-size:14px;line-height:1.7;margin:0 0 8px;"><strong>1.</strong> El Informe Completo ($49.900): las 5 oportunidades desarrolladas, plan de 90 días y revisión de asesor senior. Llega a tu correo en menos de un día hábil.</p>
    <p style="color:#555;font-size:14px;line-height:1.7;margin:0 0 18px;"><strong>2.</strong> Si prefieres conversar antes, escríbenos por WhatsApp y un asesor te responde directo — sin compromiso.</p>
    <div style="text-align:center;margin:8px 0 0;">
      <a href="${WA_LINK}?text=Hola%2C%20hice%20el%20diagn%C3%B3stico%20gratuito%20de%20${encodeURIComponent(lead.company)}%20y%20quiero%20conversar%20sobre%20el%20informe." style="background:#25D366;color:white;font-weight:700;font-size:14px;padding:12px 28px;border-radius:8px;text-decoration:none;display:inline-block;">💬 Hablar con un asesor</a>
    </div>`;
  return {
    subject: `Último correo, ${lead.name} — ¿qué hacemos con ${lead.company}?`,
    html: emailShell(lead, inner, 'seguimiento_d7')
  };
}

/* ── Envío vía Resend ── */
async function sendEmail(to, subject, html) {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) { console.warn('[followup] SENDGRID_API_KEY no configurada'); return false; }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: 'ACP & Asociados <noreply@mail.acpasociados.cl>', to: [to], subject, html })
  });
  if (!res.ok) {
    const err = await res.text();
    console.error('[followup] Resend error:', res.status, err.substring(0, 200));
    return false;
  }
  return true;
}

/* ── ¿Este email ya compró el informe pagado? ── */
async function getConvertedEmails() {
  const converted = new Set();
  try {
    const store = getStore('diagnostic-leads');
    const { blobs } = await store.list();
    for (const { key } of blobs) {
      try {
        const raw = await store.get(key);
        if (!raw) continue;
        const lead = JSON.parse(raw);
        if (lead.payment_status === 'approved' && lead.email) {
          converted.add(String(lead.email).trim().toLowerCase());
        }
      } catch (e) { /* lead corrupto: ignorar */ }
    }
  } catch (e) {
    console.warn('[followup] No se pudo leer diagnostic-leads:', e.message);
  }
  return converted;
}

export default async () => {
  const store = getStore('free-leads');
  const { blobs } = await store.list();
  if (!blobs.length) { console.log('[followup] Sin leads gratuitos.'); return new Response('ok'); }

  const convertedEmails = await getConvertedEmails();
  const now = Date.now();
  let sent = 0, skipped = 0;

  for (const { key } of blobs) {
    let lead;
    try {
      const raw = await store.get(key);
      if (!raw) continue;
      lead = JSON.parse(raw);
    } catch (e) { continue; }

    if (lead.optout || lead.converted) { skipped++; continue; }
    if (lead.followup?.d7) { skipped++; continue; } // secuencia completa

    // Si ya compró el informe pagado, marcar y no molestar más
    if (convertedEmails.has(lead.email)) {
      lead.converted = true;
      await store.set(key, JSON.stringify(lead));
      console.log('[followup] Convertido (no se contacta más):', lead.company);
      skipped++;
      continue;
    }

    const days = Math.floor((now - new Date(lead.created_at).getTime()) / 86400000);
    let step = null, payload = null;

    if (days >= 7 && !lead.followup.d7)      { step = 'd7'; payload = emailD7(lead); }
    else if (days >= 3 && !lead.followup.d3) { step = 'd3'; payload = emailD3(lead); }
    else if (days >= 1 && !lead.followup.d1) { step = 'd1'; payload = emailD1(lead); }

    if (!step) { skipped++; continue; }

    const ok = await sendEmail(lead.email, payload.subject, payload.html);
    if (ok) {
      lead.followup[step] = new Date().toISOString();
      await store.set(key, JSON.stringify(lead));
      console.log(`[followup] ${step} enviado a ${lead.email} (${lead.company})`);
      sent++;
    }
  }

  console.log(`[followup] Resumen: ${sent} enviados, ${skipped} saltados, ${blobs.length} leads totales.`);
  return new Response(JSON.stringify({ ok: true, sent, skipped }), {
    headers: { 'Content-Type': 'application/json' }
  });
};
