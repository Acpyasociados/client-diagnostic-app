import { readFile } from 'fs/promises';
import path from 'path';
import { getStore } from '@netlify/blobs';
import { buildReportPayload } from './_lib/report.js';

// process.cwd() apunta a la raíz del proyecto en Netlify Functions — funciona en ESM y CJS
const TEMPLATE_PATH = path.join(process.cwd(), 'templates', 'diagnostic-report-template.html');

// ─── helpers ──────────────────────────────────────────────────────────────────

const AXIS_LABELS = { caja: 'Caja', comercial: 'Comercial', estructura: 'Estructura' };

function impactLabel(n) {
  if (n >= 5) return 'Muy alto';
  if (n >= 4) return 'Alto';
  if (n >= 3) return 'Medio';
  return 'Bajo';
}

function formatList(items) {
  if (!items?.length) return 'Sin acciones definidas para este período.';
  return items.map(t => `• ${t}`).join('<br>');
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' });
}

function currency(value) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency', currency: 'CLP', maximumFractionDigits: 0
  }).format(Number(value || 0));
}

function fillTemplate(html, data) {
  let out = html;
  for (const [k, v] of Object.entries(data)) {
    out = out.replaceAll(`{{${k}}}`, v ?? '—');
  }
  return out;
}

/**
 * Genera el bloque CTA al final del PDF, diferenciado por plan.
 * Básico  → oferta de sesión de implementación (upsell)
 * Premium → confirma sesión de seguimiento incluida
 */
function buildCtaBlock(lead) {
  const phone   = process.env.ADVISOR_PHONE || '+56 9 4401 8594';
  const waLink  = `https://wa.me/${phone.replace(/[^0-9]/g, '')}`;
  const email   = process.env.ADVISOR_EMAIL || 'contacto@acpasociados.cl';
  const isPremium = (lead.plan || '').toLowerCase() === 'premium';

  if (isPremium) {
    // Plan Premium: sesión de implementación ya incluida
    return `
    <div style="background:linear-gradient(135deg,#1B3B5C 0%,#16A085 100%); border-radius:4px; padding:6mm 8mm; display:flex; align-items:stretch; gap:6mm;">
      <div style="width:4px; background:rgba(255,255,255,0.4); flex-shrink:0; border-radius:2px;"></div>
      <div style="flex:1;">
        <div style="font-family:'DM Sans',Arial,sans-serif; font-size:7.5px; font-weight:700; color:rgba(255,255,255,0.65); letter-spacing:2.5px; text-transform:uppercase; margin-bottom:2mm;">TU PLAN PREMIUM INCLUYE</div>
        <div style="font-family:'Cormorant Garamond',Georgia,serif; font-size:17px; font-weight:700; color:#FFFFFF; line-height:1.3; margin-bottom:3mm;">Sesión de implementación de 30 min con tu asesor ACP</div>
        <div style="font-family:'DM Sans',Arial,sans-serif; font-size:8.5px; color:rgba(255,255,255,0.82); line-height:1.6; margin-bottom:3.5mm;">En esta sesión priorizamos en conjunto las 3 oportunidades del informe, definimos quién hace qué y en qué plazo, y resolvemos cualquier duda sobre la implementación.</div>
        <div style="display:flex; gap:5mm; align-items:center;">
          <a href="${waLink}?text=Hola%2C%20tengo%20mi%20informe%20Premium%20listo%20y%20quiero%20agendar%20mi%20sesi%C3%B3n%20de%20implementaci%C3%B3n."
             style="background:#25D366; color:#FFFFFF; font-family:'DM Sans',Arial,sans-serif; font-size:8.5px; font-weight:700; padding:2.5mm 5mm; border-radius:20px; text-decoration:none; display:inline-block;">
            📱 Agendar por WhatsApp
          </a>
          <div style="font-family:'DM Sans',Arial,sans-serif; font-size:8px; color:rgba(255,255,255,0.55);">o escríbenos a <span style="color:#FFFFFF;">${email}</span></div>
        </div>
      </div>
    </div>`;
  }

  // Plan Básico: upsell a sesión de implementación
  return `
    <div style="background:#1B3B5C; border-radius:4px; padding:5mm 7mm;">
      <div style="display:flex; align-items:flex-start; gap:5mm;">
        <div style="width:4px; min-height:50px; background:#16A085; flex-shrink:0; border-radius:2px; margin-top:1mm;"></div>
        <div style="flex:1;">
          <div style="font-family:'DM Sans',Arial,sans-serif; font-size:7.5px; font-weight:700; color:#3498DB; letter-spacing:2.5px; text-transform:uppercase; margin-bottom:2mm;">¿QUIERES IMPLEMENTARLO CON RESPALDO EXPERTO?</div>
          <div style="font-family:'Cormorant Garamond',Georgia,serif; font-size:16px; font-weight:700; color:#FFFFFF; line-height:1.3; margin-bottom:2mm;">Sesión de Implementación — 30 min con tu asesor ACP</div>
          <div style="display:flex; gap:4mm; margin-bottom:3mm;">
            <div style="font-family:'DM Sans',Arial,sans-serif; font-size:8px; color:rgba(255,255,255,0.75); line-height:1.6;">
              ✓ Priorizamos las 3 oportunidades en vivo<br>
              ✓ Definimos quién hace qué y en qué plazo<br>
              ✓ Resolvemos dudas de implementación
            </div>
            <div style="border-left:1px solid rgba(255,255,255,0.15); padding-left:4mm; flex-shrink:0; text-align:center;">
              <div style="font-family:'DM Sans',Arial,sans-serif; font-size:7px; color:rgba(255,255,255,0.5); text-transform:uppercase; letter-spacing:1px; margin-bottom:1mm;">Valor</div>
              <div style="font-family:'Cormorant Garamond',Georgia,serif; font-size:20px; font-weight:700; color:#16A085; line-height:1;">$149.900</div>
              <div style="font-family:'DM Sans',Arial,sans-serif; font-size:7px; color:rgba(255,255,255,0.45);">CLP · 1 sesión</div>
            </div>
          </div>
          <div style="display:flex; gap:4mm; align-items:center;">
            <a href="${waLink}?text=Hola%2C%20acabo%20de%20recibir%20mi%20informe%20de%20diagn%C3%B3stico%20y%20me%20interesa%20la%20sesi%C3%B3n%20de%20implementaci%C3%B3n."
               style="background:#25D366; color:#FFFFFF; font-family:'DM Sans',Arial,sans-serif; font-size:8.5px; font-weight:700; padding:2.5mm 5mm; border-radius:20px; text-decoration:none; display:inline-block;">
              📱 Quiero la sesión — WhatsApp
            </a>
            <div style="font-family:'DM Sans',Arial,sans-serif; font-size:7.5px; color:rgba(255,255,255,0.45);">${email}</div>
          </div>
        </div>
      </div>
    </div>`;
}

function oppData(opp, n) {
  if (!opp) {
    return {
      [`opp${n}_title`]: '—', [`opp${n}_axis`]: '—', [`opp${n}_finding`]: '—',
      [`opp${n}_action`]: '—', [`opp${n}_impact`]: '—',
      [`opp${n}_kpi`]: '—', [`opp${n}_term`]: '—', [`opp${n}_intervention`]: '—'
    };
  }
  return {
    [`opp${n}_title`]:        opp.title,
    [`opp${n}_axis`]:         AXIS_LABELS[opp.axis] || opp.axis,
    [`opp${n}_finding`]:      opp.finding,
    [`opp${n}_action`]:       opp.action,
    [`opp${n}_impact`]:       impactLabel(opp.impact),
    [`opp${n}_kpi`]:          opp.kpi,
    [`opp${n}_term`]:         opp.term,
    [`opp${n}_intervention`]: opp.intervention
  };
}

// ─── fallback improvements (sin respuestas de cuestionario aún) ────────────────

const FALLBACK = {
  servicios_profesionales: [
    {
      axis: 'caja', title: 'Reducir horas no facturables',
      finding: 'La mayoría de empresas de servicios profesionales opera con un 20-40% de horas no cobradas por cotizaciones, reuniones y retrabajos no tarifados.',
      action: 'Auditar la distribución de tiempo semanal. Estandarizar cotización con plantilla y definir bloques de trabajo protegidos de interrupciones.',
      impact: 5, kpi: 'Horas facturadas / total trabajadas', term: '30 días', intervention: 'Baja'
    },
    {
      axis: 'comercial', title: 'Aumentar tasa de cierre de propuestas',
      finding: 'Sin seguimiento estructurado, entre el 50 y 70% de propuestas enviadas no recibe respuesta en los primeros 5 días hábiles.',
      action: 'Implementar respuesta en 24 h, propuesta estándar con alcance y vigencia claros, y secuencia de máximo 3 toques de seguimiento.',
      impact: 5, kpi: 'Tasa de cierre (%)', term: '30 días', intervention: 'Media'
    },
    {
      axis: 'estructura', title: 'Reducir concentración de ingresos',
      finding: 'Alta dependencia de 1 o 2 clientes genera riesgo operativo crítico: la pérdida de uno puede poner en riesgo la operación completa.',
      action: 'Definir oferta de entrada paquetizada y activar prospección sistemática de 3 nuevos contactos semanales por canal elegido.',
      impact: 4, kpi: '% ingresos del cliente principal', term: '90 días', intervention: 'Alta'
    }
  ],
  comercio_ecommerce: [
    {
      axis: 'comercial', title: 'Aumentar tasa de recompra',
      finding: 'Sin campaña activa de retención, la tasa de recompra en comercio local suele caer por debajo del 20%, obligando a depender de captación constante.',
      action: 'Crear campaña post-compra automática con oferta de segunda compra en ventana de 15 a 30 días tras la primera transacción.',
      impact: 5, kpi: 'Tasa de recompra (%)', term: '30 días', intervention: 'Media'
    },
    {
      axis: 'caja', title: 'Reducir dependencia de promociones',
      finding: 'Cuando más del 40% de las ventas ocurre con descuento, el margen real puede estar muy por debajo del margen declarado.',
      action: 'Separar líneas gancho (generadoras de tráfico) y líneas rentables, estableciendo un piso de margen mínimo por categoría.',
      impact: 4, kpi: '% ventas con promoción', term: '90 días', intervention: 'Alta'
    },
    {
      axis: 'estructura', title: 'Liberar capital atrapado en stock lento',
      finding: 'El inventario de baja rotación consume caja, ocupa espacio y encubre el rendimiento real del negocio.',
      action: 'Identificar los 20 SKUs de menor rotación, liquidarlos activamente y detener su recompra. Redirigir capital a líneas de alta rotación y margen.',
      impact: 5, kpi: '% stock lento / inventario total', term: '30 días', intervention: 'Media'
    }
  ],
  servicios_terreno: [
    {
      axis: 'caja', title: 'Reducir tiempos muertos en ruta',
      finding: 'Sin agrupación geográfica, los traslados entre trabajos pueden consumir entre 1 y 3 horas diarias de capacidad productiva sin generar ingreso.',
      action: 'Agrupar visitas por zona y confirmar agenda con 24 h de anticipación para minimizar cancelaciones de último momento.',
      impact: 5, kpi: 'Horas muertas por día', term: '30 días', intervention: 'Baja'
    },
    {
      axis: 'comercial', title: 'Reducir tiempo de respuesta a solicitudes',
      finding: 'En servicios urgentes, el 60% de los contratos se cierra con quien responde primero. Demoras de más de 2 horas hábiles pierden al cliente.',
      action: 'Establecer protocolo de respuesta en menos de 1 hora hábil con propuesta base lista por tipo de servicio.',
      impact: 5, kpi: 'Tiempo de respuesta promedio (h)', term: '30 días', intervention: 'Baja'
    },
    {
      axis: 'estructura', title: 'Convertir servicios unitarios en contratos recurrentes',
      finding: 'Sin ingresos recurrentes, el negocio depende de captación constante. Un 20% de clientes en plan mensual estabiliza el flujo de caja.',
      action: 'Diseñar plan de mantención mensual o semestral y ofrecerlo proactivamente a los clientes más frecuentes del último año.',
      impact: 4, kpi: 'Clientes en plan recurrente', term: '90 días', intervention: 'Media'
    }
  ]
};

function getFallback(lead) {
  return FALLBACK[lead.sector] || FALLBACK.servicios_profesionales;
}

// ─── handler principal ────────────────────────────────────────────────────────

export default async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  // 1. Parsear body
  let lead_id;
  try {
    const body = JSON.parse(await req.text());
    lead_id = body.lead_id;
  } catch {
    return json(400, { error: 'Body JSON inválido' });
  }

  if (!lead_id) return json(400, { error: 'lead_id requerido' });

  // 2. Obtener lead de Blobs
  let lead;
  try {
    const store = getStore('diagnostic-leads');
    const raw = await store.get(lead_id);
    if (!raw) return json(404, { error: 'Lead no encontrado' });
    lead = JSON.parse(raw);
  } catch (err) {
    return json(500, { error: 'Error leyendo lead', detail: err.message });
  }

  // 3. Leer template HTML
  let templateHtml;
  try {
    templateHtml = await readFile(TEMPLATE_PATH, 'utf8');
  } catch (err) {
    return json(500, { error: 'Template no encontrado', detail: err.message });
  }

  // 4. Generar contenido del diagnóstico
  const payload = buildReportPayload(lead);
  // Si el cuestionario no fue completado aún, improvements vendrá vacío → usar fallback
  const improvements = payload.improvements.length > 0
    ? payload.improvements
    : getFallback(lead);

  const plan30  = payload.plan_30.length  > 0 ? payload.plan_30  : improvements.filter(i => i.term === '30 días').map(i => i.title);
  const plan60  = payload.plan_90.length  > 0 ? payload.plan_90  : improvements.filter(i => i.term === '90 días').map(i => i.title);
  const plan90  = payload.plan_180.length > 0 ? payload.plan_180 : [];

  // 5. Construir mapa de reemplazos
  const replacements = {
    // Identidad
    company:     lead.company     || '—',
    name:        lead.name        || '—',
    email:       lead.email       || '—',
    phone:       lead.phone       || '—',
    sector_label: payload.sector_label || lead.sector || '—',
    plan_label:  lead.plan === 'premium' ? 'PREMIUM' : 'BÁSICO',
    date:        formatDate(lead.created_at),
    lead_id:     lead.lead_id,

    // Métricas
    monthly_sales:  currency(lead.monthly_sales),
    margin:         lead.margin        != null ? String(lead.margin) : '—',
    active_clients: lead.active_clients != null ? String(lead.active_clients) : '—',

    // Resumen
    summary:      payload.summary,
    main_problem: lead.main_problem || 'No especificado',
    goal_6m:      lead.goal_6m     || 'No especificado',

    // Oportunidades
    ...oppData(improvements[0], 1),
    ...oppData(improvements[1], 2),
    ...oppData(improvements[2], 3),

    // Plan de acción (template usa 30/60/90; engine produce 30/90/180)
    plan_30: formatList(plan30),
    plan_60: formatList(plan60),
    plan_90: formatList(plan90),

    // CTA diferenciado por plan (básico → upsell sesión; premium → confirma sesión incluida)
    cta_block: buildCtaBlock(lead)
  };

  // 6. Rellenar template
  const filledHtml = fillTemplate(templateHtml, replacements);

  // 7. Generar PDF con Puppeteer + Sparticuz Chromium
  let browser;
  try {
    const [chromium, puppeteer] = await Promise.all([
      import('@sparticuz/chromium').then(m => m.default),
      import('puppeteer-core').then(m => m.default)
    ]);

    browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true
    });

    const page = await browser.newPage();
    // networkidle0 espera a que las Google Fonts carguen
    await page.setContent(filledHtml, { waitUntil: 'networkidle0', timeout: 20000 });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 }
    });

    const filename = `diagnostico-${(lead.company || 'informe').replace(/\s+/g, '-').toLowerCase()}.pdf`;

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(pdfBuffer.byteLength)
      }
    });

  } catch (err) {
    return json(500, { error: 'Error generando PDF', detail: err.message });
  } finally {
    await browser?.close().catch(() => {});
  }
};

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}
