/**
 * free-unsubscribe.js
 * Da de baja a un lead gratuito de la secuencia de seguimiento.
 * GET /.netlify/functions/free-unsubscribe?id=<leadId>&t=<unsub_token>
 */

import { getStore } from '@netlify/blobs';

function page(title, msg) {
  return new Response(`<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f4f6f9;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;">
<div style="background:white;border-radius:12px;padding:40px;max-width:420px;text-align:center;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
  <h2 style="color:#1a2d3e;margin:0 0 12px;">${title}</h2>
  <p style="color:#555;font-size:14px;line-height:1.6;margin:0;">${msg}</p>
</div></body></html>`, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

export default async (req) => {
  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  const t  = url.searchParams.get('t');

  if (!id || !t) return page('Enlace inválido', 'El enlace de baja no es válido o está incompleto.');

  try {
    const store = getStore('free-leads');
    const raw = await store.get(id);
    if (!raw) return page('No encontrado', 'Este registro ya no existe — no recibirás más correos.');

    const lead = JSON.parse(raw);
    if (lead.unsub_token !== t) return page('Enlace inválido', 'El enlace de baja no es válido.');

    lead.optout = true;
    await store.set(id, JSON.stringify(lead));
    console.log('[unsub] Baja registrada:', lead.email);

    return page('Listo ✓', 'No recibirás más correos de seguimiento. Si algún día quieres retomar tu diagnóstico, estaremos en acp-asociados.netlify.app.');
  } catch (err) {
    console.error('[unsub] Error:', err.message);
    return page('Error', 'No pudimos procesar la baja. Intenta de nuevo más tarde.');
  }
};
