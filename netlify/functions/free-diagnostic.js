/**
 * free-diagnostic.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Endpoint para el diagnóstico gratuito.
 * Recibe un formulario corto, genera un mini-reporte con IA y lo retorna
 * en JSON para mostrar en pantalla + envía copia por email al usuario.
 *
 * POST /.netlify/functions/free-diagnostic
 * Body (JSON o form-urlencoded):
 *   name, email, company, sector, monthly_sales, main_problem
 *
 * No requiere pago. No guarda leads en Blobs (solo log).
 * ─────────────────────────────────────────────────────────────────────────────
 */

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-haiku-4-5-20251001';

const SECTOR_LABELS = {
  servicios_profesionales: 'Servicios profesionales',
  comercio_ecommerce:      'Comercio / e-commerce',
  servicios_terreno:       'Servicios en terreno',
  construccion:            'Construcción y obras',
  gastronomia:             'Gastronomía y alimentos',
  salud_belleza:           'Salud y belleza',
  tecnologia:              'Tecnología y software',
  educacion:               'Educación y capacitación',
  manufactura:             'Manufactura e industria',
  otro:                    'Otro'
};

async function parseBody(event) {
  let bodyText = null;
  if (typeof event.text === 'function') {
    try { bodyText = await event.text(); } catch (e) { return null; }
  } else if (typeof event.body === 'string') {
    bodyText = event.body;
  } else if (event.body && typeof event.body === 'object') {
    return event.body;
  }
  if (!bodyText) return null;
  try { return JSON.parse(bodyText); } catch (e) {
    try {
      const p = new URLSearchParams(bodyText);
      const o = Object.fromEntries(p);
      return Object.keys(o).length > 0 ? o : null;
    } catch (e2) { return null; }
  }
}

async function generateMiniReport(data) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY no configurada');

  const sectorLabel = SECTOR_LABELS[data.sector] || data.sector || 'General';
  const ventasNum   = Number(data.monthly_sales) || 0;
  const ventasFmt   = ventasNum.toLocaleString('es-CL');

  const prompt = `Eres un asesor financiero experto en PyMEs chilenas. Analiza esta empresa y genera un mini-diagnóstico honesto y específico.

DATOS DE LA EMPRESA:
- Nombre: ${data.company}
- Rubro: ${sectorLabel}
- Ventas mensuales: $${ventasFmt} CLP
- Principal problema declarado: ${data.main_problem || 'No especificado'}

INSTRUCCIONES:
Genera un mini-diagnóstico en JSON con este formato EXACTO (sin markdown, solo JSON válido):
{
  "semaforo": {
    "flujo_caja": { "estado": "rojo|amarillo|verde", "mensaje": "Una frase específica de 15-20 palabras para esta empresa" },
    "rentabilidad": { "estado": "rojo|amarillo|verde", "mensaje": "Una frase específica de 15-20 palabras para esta empresa" },
    "eficiencia_ops": { "estado": "rojo|amarillo|verde", "mensaje": "Una frase específica de 15-20 palabras para esta empresa" }
  },
  "oportunidad_principal": {
    "titulo": "Título corto de la oportunidad (5-8 palabras)",
    "descripcion": "Descripción concreta de 40-60 palabras con dato numérico estimado de impacto. Usa $ o % reales típicos del sector.",
    "impacto_estimado": "Ejemplo: +$180.000 CLP/mes"
  },
  "otras_oportunidades": [
    "Título oportunidad 2 (sin detalles)",
    "Título oportunidad 3 (sin detalles)",
    "Título oportunidad 4 (sin detalles)",
    "Título oportunidad 5 (sin detalles)"
  ],
  "diagnostico_general": "Párrafo de 60-80 palabras. Sé directo, usa el nombre de la empresa y el rubro. Menciona el principal problema con empatía y autoridad técnica."
}

IMPORTANTE:
- Sé específico para este rubro y nivel de ventas
- Los semáforos deben reflejar los riesgos reales del sector
- La oportunidad principal debe tener impacto numérico realista (no genérico)
- Las 4 oportunidades adicionales son solo títulos, intrigantes pero no desarrollados
- Responde SOLO con el JSON, sin texto adicional`;

  const resp = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type':      'application/json',
      'x-api-key':         apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model:      MODEL,
      max_tokens: 1200,
      messages:   [{ role: 'user', content: prompt }]
    })
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Anthropic API error ${resp.status}: ${err.substring(0, 200)}`);
  }

  const result = await resp.json();
  const raw = result.content?.[0]?.text || '';

  // Parsear JSON — limpiar posibles ```json ... ``` si el modelo los agrega
  const cleaned = raw.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
  return JSON.parse(cleaned);
}

async function sendFreeReportEmail(data, report) {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) { console.warn('[free-email] SENDGRID_API_KEY no configurada'); return false; }

  const sectorLabel = SECTOR_LABELS[data.sector] || data.sector;
  const ventasFmt   = Number(data.monthly_sales || 0).toLocaleString('es-CL');

  const semaforoIcon = (e) => e === 'verde' ? '🟢' : e === 'amarillo' ? '🟡' : '🔴';
  const semaforoColor = (e) => e === 'verde' ? '#27ae60' : e === 'amarillo' ? '#f39c12' : '#e74c3c';

  const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:24px 16px;">

  <!-- Header -->
  <div style="background:linear-gradient(135deg,#1a2d3e,#2C3E50);border-radius:12px 12px 0 0;padding:32px 28px;text-align:center;">
    <div style="font-size:12px;color:rgba(255,255,255,0.7);letter-spacing:1px;margin-bottom:8px;">ACP & ASOCIADOS</div>
    <h1 style="color:white;font-size:22px;margin:0 0 8px;">Tu Mini-Diagnóstico Gratuito</h1>
    <div style="color:rgba(255,255,255,0.85);font-size:14px;">${data.company} · ${sectorLabel}</div>
  </div>

  <!-- Intro -->
  <div style="background:white;padding:24px 28px;border-left:1px solid #e0e0e0;border-right:1px solid #e0e0e0;">
    <p style="color:#333;font-size:15px;line-height:1.7;margin:0;">Hola <strong>${data.name}</strong>,</p>
    <p style="color:#555;font-size:14px;line-height:1.7;margin:12px 0 0;">Aquí está tu diagnóstico express basado en los datos de <strong>${data.company}</strong>. Ventas mensuales de <strong>$${ventasFmt}</strong> en el rubro ${sectorLabel}.</p>
  </div>

  <!-- Diagnóstico general -->
  <div style="background:#f8f9fa;padding:20px 28px;border-left:1px solid #e0e0e0;border-right:1px solid #e0e0e0;border-top:2px solid #3498db;">
    <p style="color:#444;font-size:14px;line-height:1.75;margin:0;font-style:italic;">"${report.diagnostico_general}"</p>
  </div>

  <!-- Semáforo -->
  <div style="background:white;padding:24px 28px;border-left:1px solid #e0e0e0;border-right:1px solid #e0e0e0;">
    <h2 style="color:#1a2d3e;font-size:16px;margin:0 0 16px;">📊 Semáforo de Salud Empresarial</h2>
    ${['flujo_caja','rentabilidad','eficiencia_ops'].map(k => {
      const item = report.semaforo?.[k] || {};
      const labels = { flujo_caja: 'Flujo de Caja', rentabilidad: 'Rentabilidad', eficiencia_ops: 'Eficiencia Operacional' };
      return `<div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:14px;padding:12px 14px;border-radius:8px;background:#f8f9fa;">
        <div style="font-size:22px;line-height:1;">${semaforoIcon(item.estado)}</div>
        <div>
          <div style="font-weight:600;color:#1a2d3e;font-size:14px;margin-bottom:3px;">${labels[k]}</div>
          <div style="color:#555;font-size:13px;line-height:1.5;">${item.mensaje || ''}</div>
        </div>
      </div>`;
    }).join('')}
  </div>

  <!-- Oportunidad principal -->
  <div style="background:white;padding:24px 28px;border-left:1px solid #e0e0e0;border-right:1px solid #e0e0e0;border-top:1px solid #e0e0e0;">
    <h2 style="color:#1a2d3e;font-size:16px;margin:0 0 16px;">💡 Oportunidad Identificada</h2>
    <div style="border:2px solid #16a085;border-radius:10px;padding:18px 20px;background:#f0faf8;">
      <div style="font-weight:700;color:#16a085;font-size:15px;margin-bottom:8px;">${report.oportunidad_principal?.titulo || ''}</div>
      <p style="color:#333;font-size:14px;line-height:1.65;margin:0 0 12px;">${report.oportunidad_principal?.descripcion || ''}</p>
      <div style="background:#16a085;color:white;display:inline-block;padding:4px 12px;border-radius:20px;font-size:13px;font-weight:600;">Impacto estimado: ${report.oportunidad_principal?.impacto_estimado || ''}</div>
    </div>
  </div>

  <!-- Oportunidades bloqueadas -->
  <div style="background:#1a2d3e;padding:24px 28px;">
    <h2 style="color:white;font-size:15px;margin:0 0 14px;">🔒 4 Oportunidades Adicionales Identificadas</h2>
    <p style="color:rgba(255,255,255,0.7);font-size:13px;margin:0 0 14px;">Solo disponibles en el Informe Completo:</p>
    ${(report.otras_oportunidades || []).map(o => `
    <div style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:rgba(255,255,255,0.08);border-radius:6px;margin-bottom:8px;">
      <span style="color:#e74c3c;font-size:16px;">🔒</span>
      <span style="color:rgba(255,255,255,0.85);font-size:13px;">${o}</span>
    </div>`).join('')}
  </div>

  <!-- CTA -->
  <div style="background:linear-gradient(135deg,#e67e22,#d4a574);padding:28px;text-align:center;border-radius:0 0 12px 12px;">
    <div style="color:white;font-size:17px;font-weight:700;margin-bottom:8px;">¿Listo para ver el panorama completo?</div>
    <p style="color:rgba(255,255,255,0.9);font-size:13px;margin:0 0 20px;line-height:1.5;">El Informe Básico incluye análisis profundo en 7 áreas,<br>plan de acción en 90 días y revisión por asesor senior.</p>
    <a href="https://acp-asociados.netlify.app/?plan=basico&utm_source=free_report&utm_medium=email"
       style="background:white;color:#e67e22;font-weight:700;font-size:15px;padding:14px 32px;border-radius:8px;text-decoration:none;display:inline-block;">
      Ver Informe Completo — $49.900
    </a>
    <p style="color:rgba(255,255,255,0.75);font-size:12px;margin:16px 0 0;">También disponible Plan Premium con reunión de asesoría — $149.900</p>
  </div>

  <!-- Footer -->
  <div style="text-align:center;padding:20px;color:#999;font-size:12px;">
    <p style="margin:0;">ACP & Asociados · Asesoría Financiera para PyMEs</p>
    <p style="margin:4px 0 0;">Este diagnóstico es orientativo y no constituye asesoría financiera formal.</p>
  </div>

</div>
</body>
</html>`;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from:    'ACP & Asociados <noreply@mail.acpasociados.cl>',
        to:      [data.email],
        subject: `Tu diagnóstico gratuito — ${data.company}`,
        html
      })
    });
    if (res.ok) { console.log('[free-email] Enviado a:', data.email); return true; }
    const errText = await res.text();
    console.error('[free-email] Error:', res.status, errText.substring(0, 200));
    return false;
  } catch (err) {
    console.error('[free-email] Exception:', err.message);
    return false;
  }
}

export default async (event) => {
  const method = (event.method || event.httpMethod || '').toUpperCase();

  if (method === 'OPTIONS') {
    return new Response('', {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin':  '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  }

  if (method !== 'POST') return json(405, { error: 'Método no permitido' });

  const body = await parseBody(event);
  if (!body) return json(400, { error: 'Body vacío o inválido' });

  // Validar campos mínimos
  const required = ['name', 'email', 'company', 'sector', 'monthly_sales'];
  for (const f of required) {
    if (!body[f]) return json(400, { error: `Falta campo: ${f}` });
  }

  // Validar email básico
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(body.email.trim())) {
    return json(400, { error: 'Email inválido' });
  }

  console.log('=== FREE-DIAGNOSTIC ===', body.company, body.sector);

  try {
    const report = await generateMiniReport(body);

    // Enviar email en background (no bloquea respuesta)
    sendFreeReportEmail(body, report).catch(e => console.error('[free-email] bg error:', e.message));

    return json(200, {
      success: true,
      name:    body.name,
      company: body.company,
      sector:  SECTOR_LABELS[body.sector] || body.sector,
      report
    });
  } catch (err) {
    console.error('Error generando diagnóstico:', err.message);
    return json(500, { error: 'No se pudo generar el diagnóstico. Intenta de nuevo.', _debug: err.message });
  }
};

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type':                'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
