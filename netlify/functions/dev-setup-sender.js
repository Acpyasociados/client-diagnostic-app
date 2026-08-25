/**
 * dev-setup-sender.js
 * ─────────────────────────────────────────────────────────
 * Utilidad de configuración: verifica y crea un Single Sender
 * en SendGrid para que los emails funcionen.
 *
 * PROTEGIDA por ADMIN_REVIEW_TOKEN.
 *
 * GET  /.netlify/functions/dev-setup-sender?token=XXX        → lista senders
 * POST /.netlify/functions/dev-setup-sender                  → crea sender
 * Body JSON: { token, email, name?, reply_to? }
 */

export default async (event) => {
  const method = (event.method || event.httpMethod || '').toUpperCase();

  const adminToken = process.env.ADMIN_REVIEW_TOKEN;
  const apiKey     = process.env.SENDGRID_API_KEY;

  if (!apiKey) return json(500, { error: 'SENDGRID_API_KEY no configurada' });

  // ── GET: listar senders existentes ──────────────────────
  if (method === 'GET') {
    // Soporte para Netlify Functions v2 (URL) y v1 (queryStringParameters)
    let tokenParam = null;
    try {
      const url = new URL(event.url || event.rawUrl || `https://x?${event.rawQuery || ''}`);
      tokenParam = url.searchParams.get('token');
    } catch (e) {
      const params = event.queryStringParameters || {};
      tokenParam = params.token;
    }
    if (!adminToken || tokenParam !== adminToken) return json(403, { error: 'Token inválido' });

    const res = await fetch('https://api.sendgrid.com/v3/verified_senders', {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    const data = await res.json();
    return json(res.status, data);
  }

  // ── POST: crear nuevo sender ─────────────────────────────
  if (method === 'POST') {
    let body = {};
    try {
      const raw = typeof event.text === 'function' ? await event.text()
                : typeof event.body === 'string'   ? event.body
                : JSON.stringify(event.body || {});
      body = JSON.parse(raw || '{}');
    } catch (e) {
      return json(400, { error: 'Body JSON inválido' });
    }

    if (!adminToken || body.token !== adminToken) return json(403, { error: 'Token inválido' });

    const fromEmail = body.email || process.env.SENDGRID_FROM_EMAIL || 'noreply@acpyasociados.com';
    const fromName  = body.name  || 'ACP & Asociados';

    const payload = {
      nickname:   fromName,
      from:       { email: fromEmail, name: fromName },
      reply_to:   { email: body.reply_to || fromEmail, name: fromName },
      address:    'Providencia, Santiago',
      city:       'Santiago',
      country:    'Chile'
    };

    const res = await fetch('https://api.sendgrid.com/v3/verified_senders', {
      method:  'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload)
    });

    const data = await res.json();

    if (res.ok) {
      return json(200, {
        ok: true,
        message: `✅ Sender creado. Revisa el email en "${fromEmail}" y haz clic en "Verify Single Sender".`,
        sender: data
      });
    } else {
      return json(res.status, { ok: false, error: data });
    }
  }

  return json(405, { error: 'Solo GET o POST' });
};

function json(status, body) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}
