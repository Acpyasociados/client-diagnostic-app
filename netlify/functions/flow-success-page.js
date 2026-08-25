/**
 * flow-success-page.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Reemplaza el archivo estático flow-success.html con una función Netlify.
 * Las funciones son siempre accesibles — no tienen ventana de propagación CDN.
 *
 * urlReturn en create-diagnostic-order.js apunta a:
 *   /.netlify/functions/flow-success-page?orderId=XXX
 * ─────────────────────────────────────────────────────────────────────────────
 */
export default async (req) => {
  const url     = new URL(req.url);
  const orderId = url.searchParams.get('orderId') || '';

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Pago exitoso - ACP & Asociados</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: linear-gradient(135deg,#ECF0F3 0%,#F5F8FB 100%);
      min-height:100vh; display:flex; align-items:center; justify-content:center;
      padding:1.5rem;
    }
    .card {
      background:white; border-radius:16px; padding:2.5rem 2rem;
      max-width:520px; width:100%; text-align:center;
      box-shadow:0 8px 32px rgba(0,0,0,0.10);
    }
    .badge {
      display:inline-block; background:#d4edda; color:#155724;
      padding:6px 16px; border-radius:20px; font-size:14px; font-weight:600;
      margin-bottom:1.5rem;
    }
    h1 { color:#1a2d3e; font-size:1.75rem; margin-bottom:1rem; line-height:1.3; }
    p  { color:#555; font-size:1rem; line-height:1.6; margin-bottom:0.75rem; }
    .order-info { font-size:12px; color:#999; margin-top:1rem; }
    .btn {
      display:inline-block; margin-top:2rem;
      background:#1a2d3e; color:white; padding:14px 32px;
      border-radius:8px; text-decoration:none; font-weight:600; font-size:15px;
    }
    .icon { font-size:3rem; margin-bottom:1rem; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">✅</div>
    <span class="badge">✓ Pago aprobado</span>
    <h1>¡Tu diagnóstico está en proceso!</h1>
    <p>Tu pago fue procesado correctamente.</p>
    <p>En los próximos minutos recibirás un correo con el cuestionario para personalizar tu diagnóstico.</p>
    <p style="font-size:13px;margin-top:1rem;">Si no recibes el correo en 10 minutos, revisa spam o escríbenos a <a href="mailto:info@acpasociados.cl" style="color:#1a2d3e;">info@acpasociados.cl</a></p>
    ${orderId ? `<p class="order-info">Orden: ${orderId}</p>` : ''}
    <a href="/" class="btn">Volver al inicio</a>
  </div>
</body>
</html>`;

  return new Response(html, {
    status:  200,
    headers: { 'Content-Type': 'text/html; charset=UTF-8' }
  });
};
