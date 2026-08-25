/**
 * free-diagnostic.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Endpoint para el diagnóstico gratuito.
 * Recibe un formulario corto, genera un mini-reporte con MOTOR DE REGLAS
 * (sin IA, costo $0, respuesta instantánea) y lo retorna en JSON para
 * mostrar en pantalla + envía copia por email al usuario.
 *
 * POST /.netlify/functions/free-diagnostic
 * Body (JSON o form-urlencoded):
 *   name, email, company, sector, monthly_sales, main_problem
 *
 * No requiere pago. Guarda el lead en el store "free-leads" para la
 * secuencia de seguimiento automática (free-followup.js). Sin costo de API.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import crypto from 'crypto';
import { getStore } from '@netlify/blobs';

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

/* ───────────────────────── MOTOR DE REGLAS ─────────────────────────
 * Perfiles por sector:
 *  - riesgo: ponderación base 0-2 por área (flujo, rentabilidad, eficiencia)
 *  - pct: % de ventas mensuales usado para estimar el impacto de la
 *    oportunidad principal (rangos conservadores típicos de asesoría PyME)
 *  - opp: oportunidad principal del sector
 *  - otras: 4 títulos bloqueados (gancho para el informe pagado)
 */
const SECTOR_PROFILES = {
  servicios_profesionales: {
    riesgo: { flujo: 1, rentabilidad: 2, eficiencia: 1 },
    pct: 0.06,
    opp: {
      titulo: 'Repricing de servicios por valor entregado',
      desc: (v, imp) => `En servicios profesionales el error más común es cobrar por hora y no por valor. Con ventas de $${v}/mes, un ajuste de tarifas del 8-12% en tus 3 servicios principales —sin perder clientes— suele capturar ${imp} adicionales, porque la demanda en este rubro es poco sensible al precio cuando hay confianza.`
    },
    otras: [
      'Modelo de ingresos recurrentes (retainer mensual)',
      'Automatización de propuestas y cobranza',
      'Estructura tributaria óptima para tu régimen',
      'Sistema de referidos con clientes actuales'
    ]
  },
  comercio_ecommerce: {
    riesgo: { flujo: 2, rentabilidad: 2, eficiencia: 1 },
    pct: 0.05,
    opp: {
      titulo: 'Depuración de margen por producto (regla 80/20)',
      desc: (v, imp) => `En comercio, típicamente el 20% de los SKU genera el 80% de la utilidad y un grupo de productos vende con margen casi nulo. Con ventas de $${v}/mes, reordenar el mix —eliminar o repreciar los productos de bajo margen— suele recuperar ${imp} sin vender una unidad más.`
    },
    otras: [
      'Optimización de capital inmovilizado en inventario',
      'Estrategia de precios dinámicos vs. competencia',
      'Reducción de costos de última milla y despacho',
      'Recuperación de carritos abandonados'
    ]
  },
  servicios_terreno: {
    riesgo: { flujo: 2, rentabilidad: 1, eficiencia: 2 },
    pct: 0.06,
    opp: {
      titulo: 'Cobro anticipado y control de horas en terreno',
      desc: (v, imp) => `En servicios en terreno el dinero se pierde entre el trabajo hecho y el pago recibido: traslados no cobrados, horas extra sin facturar y pagos a 30-60 días. Con ventas de $${v}/mes, implementar abono inicial del 30-50% y registro de horas por visita suele capturar ${imp}.`
    },
    otras: [
      'Optimización de rutas y costo por visita',
      'Tarifario diferenciado por zona y urgencia',
      'Contratos de mantención recurrente',
      'Política de anticipos que reduce incobrables'
    ]
  },
  construccion: {
    riesgo: { flujo: 2, rentabilidad: 1, eficiencia: 2 },
    pct: 0.05,
    opp: {
      titulo: 'Estados de pago y control de avance por obra',
      desc: (v, imp) => `La construcción quiebra por caja, no por falta de obras: financias materiales y sueldos meses antes de cobrar. Con ventas de $${v}/mes, estructurar estados de pago quincenales con avance documentado y anticipo de obra del 20-30% libera ${imp} que hoy estás financiando de tu bolsillo.`
    },
    otras: [
      'Control de desviación de presupuesto por partida',
      'Negociación de plazos con proveedores de materiales',
      'Estructura de contratos que protege tu margen',
      'Gestión de boletas de garantía y retenciones'
    ]
  },
  gastronomia: {
    riesgo: { flujo: 1, rentabilidad: 2, eficiencia: 2 },
    pct: 0.04,
    opp: {
      titulo: 'Ingeniería de menú y control de merma',
      desc: (v, imp) => `En gastronomía la utilidad se decide en la cocina: merma, porciones sin estandarizar y platos populares con margen bajo. Con ventas de $${v}/mes, costear cada plato y reordenar el menú (subir precio o eliminar los de margen inferior al 60%) suele recuperar ${imp}.`
    },
    otras: [
      'Reducción de merma y control de porciones',
      'Renegociación con 3 proveedores principales',
      'Estrategia de precios en apps de delivery',
      'Optimización de turnos según curva de demanda'
    ]
  },
  salud_belleza: {
    riesgo: { flujo: 1, rentabilidad: 1, eficiencia: 2 },
    pct: 0.05,
    opp: {
      titulo: 'Reducción de horas muertas y no-shows',
      desc: (v, imp) => `En salud y belleza el costo invisible son las horas de agenda vacías y las citas no asistidas: cada bloque sin atender es ingreso perdido con costo fijo corriendo. Con ventas de $${v}/mes, confirmación automática + lista de espera + abono de reserva suele recuperar ${imp}.`
    },
    otras: [
      'Membresías y planes de tratamiento prepagados',
      'Venta cruzada de productos en cada atención',
      'Tarifas diferenciadas por horario valle y punta',
      'Reactivación de clientes inactivos (+90 días)'
    ]
  },
  tecnologia: {
    riesgo: { flujo: 1, rentabilidad: 1, eficiencia: 1 },
    pct: 0.07,
    opp: {
      titulo: 'Migración a ingresos recurrentes (MRR)',
      desc: (v, imp) => `En tecnología, vivir de proyectos uno-a-uno significa empezar cada mes de cero. Con ventas de $${v}/mes, convertir soporte, mantención y mejoras en contratos mensuales recurrentes suele asegurar ${imp} de base estable, además de subir la valorización de tu empresa ante cualquier inversionista.`
    },
    otras: [
      'Pricing por valor en vez de horas-hombre',
      'Reducción de costos cloud y licencias',
      'Estructura de equity y opciones para retener talento',
      'Postulación a fondos CORFO y beneficios I+D'
    ]
  },
  educacion: {
    riesgo: { flujo: 2, rentabilidad: 1, eficiencia: 1 },
    pct: 0.05,
    opp: {
      titulo: 'Reducción de deserción y morosidad de alumnos',
      desc: (v, imp) => `En educación el ingreso se fuga por dos lados: alumnos que desertan a mitad de programa y mensualidades impagas. Con ventas de $${v}/mes, un sistema de alerta temprana de deserción más cobro automatizado (PAC/PAT) suele retener ${imp} que hoy se pierden silenciosamente.`
    },
    otras: [
      'Productos digitales escalables (cursos grabados)',
      'Convenios con empresas y uso de franquicia SENCE',
      'Calendario de matrículas que suaviza la estacionalidad',
      'Estrategia de precios por cohorte y early-bird'
    ]
  },
  manufactura: {
    riesgo: { flujo: 1, rentabilidad: 2, eficiencia: 2 },
    pct: 0.04,
    opp: {
      titulo: 'Costeo real por producto y línea',
      desc: (v, imp) => `En manufactura es habitual vender productos que pierden plata sin saberlo, porque el costeo no incluye mermas, setup ni energía. Con ventas de $${v}/mes, un costeo real por línea y el ajuste de precios o descontinuación de las líneas deficitarias suele recuperar ${imp}.`
    },
    otras: [
      'Reducción de inventario de materia prima inmovilizado',
      'Eficiencia energética y costos de producción',
      'Renegociación de condiciones con proveedores clave',
      'Mix de productos según margen de contribución'
    ]
  },
  otro: {
    riesgo: { flujo: 1, rentabilidad: 1, eficiencia: 1 },
    pct: 0.05,
    opp: {
      titulo: 'Diagnóstico de margen y fugas de caja',
      desc: (v, imp) => `Toda PyME tiene fugas que no ve: gastos hormiga, servicios contratados sin uso, precios sin actualizar por inflación y cobros tardíos. Con ventas de $${v}/mes, una revisión sistemática de margen y ciclo de caja suele recuperar ${imp} en los primeros 90 días.`
    },
    otras: [
      'Actualización de precios según inflación acumulada',
      'Reducción de gastos fijos sin afectar operación',
      'Aceleración del ciclo de cobro a clientes',
      'Estructura tributaria óptima para tu régimen'
    ]
  }
};

/* Detección simple del área problemática según el texto libre del usuario */
function detectProblemArea(text) {
  if (!text) return null;
  const t = text.toLowerCase();
  const match = (words) => words.some(w => t.includes(w));
  if (match(['caja', 'liquidez', 'fin de mes', 'pagar', 'deuda', 'plata', 'flujo', 'cobr', 'moros', 'financ'])) return 'flujo';
  if (match(['precio', 'margen', 'rentab', 'utilidad', 'gano', 'ganancia', 'barato', 'costos', 'caro'])) return 'rentabilidad';
  if (match(['tiempo', 'orden', 'proceso', 'administr', 'organiz', 'papeleo', 'contabilidad', 'desorden', 'control'])) return 'eficiencia';
  if (match(['venta', 'cliente', 'marketing', 'vender', 'competencia', 'crecer', 'demanda'])) return 'comercial';
  return null;
}

/* Tramo de ventas (CLP/mes) */
function salesTier(v) {
  if (v < 3000000)  return 'micro';
  if (v < 10000000) return 'pequena';
  if (v < 30000000) return 'mediana';
  return 'grande';
}

const SEM_MESSAGES = {
  flujo: {
    rojo:     (s) => `Señales de presión de caja: en ${s} el desfase entre pagar y cobrar es el riesgo número uno.`,
    amarillo: (s) => `Tu ciclo de caja requiere monitoreo: en ${s} los desfases de pago pueden tensionar el mes.`,
    verde:    (s) => `Sin señales críticas de caja, aunque en ${s} conviene mantener un colchón de 2 meses de gastos.`
  },
  rentabilidad: {
    rojo:     (s) => `Tu margen muestra señales de alerta: en ${s} es frecuente vender bien y ganar poco.`,
    amarillo: (s) => `Margen probablemente bajo el potencial del rubro: en ${s} hay espacio típico de mejora de 5-10 puntos.`,
    verde:    (s) => `Rentabilidad sin alertas evidentes, aunque un costeo fino por producto o servicio suele revelar sorpresas.`
  },
  eficiencia: {
    rojo:     (s) => `La operación está consumiendo tiempo y margen: en ${s} los procesos manuales son la fuga principal.`,
    amarillo: (s) => `Procesos con espacio de mejora: en ${s} la falta de sistemas resta horas productivas cada semana.`,
    verde:    (s) => `Operación razonablemente ordenada para tu tamaño; el desafío será mantenerla al crecer.`
  }
};

function buildMiniReport(data) {
  const sectorKey   = SECTOR_PROFILES[data.sector] ? data.sector : 'otro';
  const profile     = SECTOR_PROFILES[sectorKey];
  const sectorLabel = SECTOR_LABELS[data.sector] || data.sector || 'tu rubro';
  const ventasNum   = Number(data.monthly_sales) || 0;
  const ventasFmt   = ventasNum.toLocaleString('es-CL');
  const tier        = salesTier(ventasNum);
  const detected    = detectProblemArea(data.main_problem);

  // Puntaje por área: base sector + problema declarado + tamaño
  const score = (area) => {
    let s = profile.riesgo[area] || 0;
    if (detected === area) s += 2;
    if (detected === 'comercial' && area === 'rentabilidad') s += 1; // problema de ventas presiona margen
    if (tier === 'micro' && area === 'flujo') s += 1;                // micro = caja más frágil
    return s;
  };
  const estado = (s) => s >= 3 ? 'rojo' : s >= 1 ? 'amarillo' : 'verde';

  const areas = ['flujo', 'rentabilidad', 'eficiencia'];
  const estados = {};
  areas.forEach(a => { estados[a] = estado(score(a)); });

  // Impacto estimado: % del sector sobre ventas, redondeado a $10.000
  let impactoFmt;
  if (ventasNum > 0) {
    const impacto = Math.round((ventasNum * profile.pct) / 10000) * 10000;
    impactoFmt = `+$${impacto.toLocaleString('es-CL')} CLP/mes`;
  } else {
    impactoFmt = `+${Math.round(profile.pct * 100)}% de tus ventas mensuales`;
  }

  // Diagnóstico general
  const tierTxt = {
    micro:   'En tu tramo de ventas, cada peso de caja cuenta y los errores de precio se sienten de inmediato.',
    pequena: 'Estás en el tramo donde el negocio ya vive, pero todavía depende demasiado de ti.',
    mediana: 'Tu nivel de ventas exige pasar de la intuición al control de gestión con números.',
    grande:  'A tu escala, una mejora de pocos puntos de margen representa millones al año.'
  }[tier];

  const problemTxt = {
    flujo:        'El dolor que describes —presión de caja— es el más urgente de resolver y también el más tratable con método.',
    rentabilidad: 'El dolor que describes apunta a margen y precios: es la palanca más rápida de mejorar en tu rubro.',
    eficiencia:   'El dolor que describes es operacional: ordenar procesos libera horas y margen al mismo tiempo.',
    comercial:    'El dolor que describes es comercial: antes de invertir en vender más, asegura que cada venta deje margen.',
    null:         'Los puntos del semáforo son los patrones más frecuentes que vemos en empresas como la tuya.'
  }[detected];

  const diagnostico_general = `${data.company} opera en ${sectorLabel.toLowerCase()}, un rubro donde ${
    profile.riesgo.flujo === 2 ? 'el flujo de caja es la primera causa de estrés financiero' :
    profile.riesgo.rentabilidad === 2 ? 'el margen real suele estar muy por debajo del percibido' :
    'la disciplina operacional marca la diferencia entre crecer y estancarse'
  }. ${tierTxt} ${problemTxt} La buena noticia: la oportunidad principal que identificamos es accionable en semanas, no meses.`;

  return {
    semaforo: {
      flujo_caja:     { estado: estados.flujo,        mensaje: SEM_MESSAGES.flujo[estados.flujo](sectorLabel.toLowerCase()) },
      rentabilidad:   { estado: estados.rentabilidad, mensaje: SEM_MESSAGES.rentabilidad[estados.rentabilidad](sectorLabel.toLowerCase()) },
      eficiencia_ops: { estado: estados.eficiencia,   mensaje: SEM_MESSAGES.eficiencia[estados.eficiencia](sectorLabel.toLowerCase()) }
    },
    oportunidad_principal: {
      titulo:           profile.opp.titulo,
      descripcion:      profile.opp.desc(ventasFmt, impactoFmt),
      impacto_estimado: impactoFmt
    },
    otras_oportunidades: profile.otras,
    diagnostico_general
  };
}

/* ───────────────────────── PERSISTENCIA DEL LEAD ───────────────────────── */

async function saveFreeLead(data, report) {
  const store = getStore('free-leads');
  const id = crypto.randomUUID();
  const lead = {
    id,
    name:          data.name,
    email:         String(data.email).trim().toLowerCase(),
    company:       data.company,
    sector:        data.sector,
    sector_label:  SECTOR_LABELS[data.sector] || data.sector,
    monthly_sales: Number(data.monthly_sales) || 0,
    main_problem:  data.main_problem || '',
    report,
    created_at:    new Date().toISOString(),
    followup:      { d1: null, d3: null, d7: null },
    optout:        false,
    converted:     false,
    unsub_token:   crypto.randomBytes(16).toString('hex')
  };
  await store.set(id, JSON.stringify(lead));
  console.log('[free-lead] Guardado:', lead.company, id.substring(0, 8));
}

/* ───────────────────────── HTTP / EMAIL ───────────────────────── */

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

async function sendFreeReportEmail(data, report) {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) { console.warn('[free-email] SENDGRID_API_KEY no configurada'); return false; }

  const sectorLabel = SECTOR_LABELS[data.sector] || data.sector;
  const ventasFmt   = Number(data.monthly_sales || 0).toLocaleString('es-CL');

  const semaforoIcon = (e) => e === 'verde' ? '🟢' : e === 'amarillo' ? '🟡' : '🔴';

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
    return new Response(null, {
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
    const report = buildMiniReport(body);

    // Guardar lead + enviar email ANTES de responder.
    // Netlify congela el proceso al retornar: las promesas "en background"
    // se matan y ni el lead ni el email llegan. Esperarlas cuesta <1s.
    const [saveRes, mailRes] = await Promise.allSettled([
      saveFreeLead(body, report),
      sendFreeReportEmail(body, report)
    ]);
    if (saveRes.status === 'rejected') console.error('[free-lead] save error:', saveRes.reason?.message);
    if (mailRes.status === 'rejected') console.error('[free-email] error:', mailRes.reason?.message);

    return json(200, {
      success: true,
      name:    body.name,
      company: body.company,
      sector:  SECTOR_LABELS[body.sector] || body.sector,
      report
    });
  } catch (err) {
    console.error('Error generando diagnóstico:', err.message);
    return json(500, { error: 'No se pudo generar el diagnóstico. Intenta de nuevo.' });
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
