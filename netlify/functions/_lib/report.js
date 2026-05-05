import { sectorLabels } from './questions.js';

function toNumber(value) {
  const n = Number(value || 0);
  return Number.isFinite(n) ? n : 0;
}

function currency(value) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(toNumber(value));
}

function score(improvement) {
  return improvement.impact + improvement.ease + improvement.speed - improvement.complexity;
}

function improvement(base) {
  return { ...base, priority_score: score(base) };
}

function pickTop(improvements) {
  return improvements.sort((a, b) => b.priority_score - a.priority_score).slice(0, 3);
}

function diagnoseProfessional(lead, a) {
  const improvements = [];
  if (toNumber(a.non_billable_hours) > 20) improvements.push(improvement({
    axis: 'caja',
    title: 'Reducir horas no facturadas',
    finding: 'Existe desgaste operativo relevante fuera de servicios cobrables.',
    action: 'Estandarizar cotización, seguimiento y entrega con plantillas y bloques fijos semanales.',
    impact: 'Mayor margen y más horas facturables.',
    kpi: 'Horas no facturadas / mes',
    term: '30 días',
    intervention: 'Media',
    impact: 5, ease: 4, speed: 5, complexity: 2
  }));
  if (toNumber(a.top3_revenue_share) > 50) improvements.push(improvement({
    axis: 'estructura',
    title: 'Reducir dependencia de pocos clientes',
    finding: 'Alta concentración de ingresos en pocos clientes.',
    action: 'Crear una oferta paquetizada de entrada y una secuencia comercial semanal para prospectos nuevos.',
    impact: 'Menor riesgo de caja y mayor estabilidad comercial.',
    kpi: '% ingresos top 3 clientes',
    term: '90 días',
    intervention: 'Alta',
    impact: 5, ease: 3, speed: 3, complexity: 3
  }));
  if (toNumber(a.close_rate) < 25 || String(lead.main_problem).toLowerCase().includes('cierre')) improvements.push(improvement({
    axis: 'comercial',
    title: 'Aumentar tasa de cierre',
    finding: 'El embudo comercial está perdiendo leads por seguimiento o propuesta.',
    action: 'Implementar contacto en 24 h, propuesta estándar y secuencia de seguimiento en 3 toques.',
    impact: 'Mejora directa de ventas sin aumentar gasto fijo.',
    kpi: 'Tasa de cierre',
    term: '30 días',
    intervention: 'Media',
    impact: 5, ease: 5, speed: 5, complexity: 1
  }));
  if (toNumber(a.collection_days) > 30) improvements.push(improvement({
    axis: 'caja',
    title: 'Acelerar cobranza',
    finding: 'Plazo de cobro alto para el tamaño del negocio.',
    action: 'Definir anticipo, hito de pago y recordatorios automáticos de cobranza.',
    impact: 'Mejora de flujo y menor presión de capital de trabajo.',
    kpi: 'Días promedio de cobro',
    term: '30 días',
    intervention: 'Baja',
    impact: 4, ease: 5, speed: 5, complexity: 1
  }));
  return pickTop(improvements);
}

function diagnoseCommerce(lead, a) {
  const improvements = [];
  if (toNumber(a.repeat_rate) < 20) improvements.push(improvement({
    axis: 'comercial',
    title: 'Subir recompra',
    finding: 'La tasa de recompra es baja y obliga a depender de captación constante.',
    action: 'Crear campaña post compra y oferta de segunda compra con ventana de 15 a 30 días.',
    impact: 'Más ventas con menor costo de adquisición.',
    kpi: 'Tasa de recompra',
    term: '30 días',
    intervention: 'Media',
    impact: 5, ease: 4, speed: 4, complexity: 2
  }));
  if (toNumber(a.promo_sales_share) > 40) improvements.push(improvement({
    axis: 'caja',
    title: 'Reducir dependencia de promociones',
    finding: 'Una fracción alta de ventas ocurre con descuento.',
    action: 'Separar líneas gancho y líneas rentables, con piso de margen por categoría.',
    impact: 'Recuperación de margen sin frenar ventas totales.',
    kpi: '% ventas con promoción',
    term: '90 días',
    intervention: 'Alta',
    impact: 5, ease: 3, speed: 3, complexity: 3
  }));
  if (toNumber(a.slow_stock_share) > 25) improvements.push(improvement({
    axis: 'estructura',
    title: 'Liberar capital atrapado en stock lento',
    finding: 'El inventario lento consume caja y espacio operativo.',
    action: 'Liquidar SKUs lentos, detener recompra y ordenar stock por rotación y margen.',
    impact: 'Mejora de caja y foco en líneas rentables.',
    kpi: '% stock lento',
    term: '30 días',
    intervention: 'Media',
    impact: 5, ease: 4, speed: 5, complexity: 2
  }));
  if (toNumber(a.delivery_days) > 3) improvements.push(improvement({
    axis: 'comercial',
    title: 'Reducir tiempo de entrega',
    finding: 'La promesa de despacho puede estar afectando conversión y recompra.',
    action: 'Reordenar stock de alta rotación y definir ventanas de despacho por zona.',
    impact: 'Mejora de conversión y satisfacción del cliente.',
    kpi: 'Días de entrega',
    term: '30 días',
    intervention: 'Media',
    impact: 4, ease: 4, speed: 4, complexity: 2
  }));
  return pickTop(improvements);
}

function diagnoseFieldServices(lead, a) {
  const improvements = [];
  if (toNumber(a.idle_time_hours) > 1) improvements.push(improvement({
    axis: 'caja',
    title: 'Reducir tiempos muertos en ruta',
    finding: 'Hay pérdida operativa diaria por mala secuencia de trabajos.',
    action: 'Agrupar visitas por zona y confirmar agenda el día previo.',
    impact: 'Más trabajos por día con el mismo equipo.',
    kpi: 'Horas muertas por día',
    term: '30 días',
    intervention: 'Baja',
    impact: 5, ease: 5, speed: 5, complexity: 1
  }));
  if (toNumber(a.quote_acceptance_rate) < 40) improvements.push(improvement({
    axis: 'comercial',
    title: 'Subir aceptación de presupuestos',
    finding: 'El cierre comercial es bajo para servicios cotizados.',
    action: 'Estandarizar presupuesto con alcance, prueba social y vigencia limitada.',
    impact: 'Más ingresos sin subir tráfico comercial.',
    kpi: 'Tasa de aceptación de presupuestos',
    term: '30 días',
    intervention: 'Media',
    impact: 5, ease: 4, speed: 5, complexity: 2
  }));
  if (toNumber(a.repeat_rate) < 25) improvements.push(improvement({
    axis: 'estructura',
    title: 'Aumentar recurrencia de clientes',
    finding: 'El negocio depende demasiado de ventas una sola vez.',
    action: 'Convertir servicios unitarios en plan mensual o semestral con checklist fijo.',
    impact: 'Más estabilidad de ingresos y mejor planificación.',
    kpi: 'Tasa de repetición',
    term: '90 días',
    intervention: 'Alta',
    impact: 5, ease: 3, speed: 3, complexity: 3
  }));
  if (toNumber(a.response_time_hours) > 4) improvements.push(improvement({
    axis: 'comercial',
    title: 'Reducir tiempo de respuesta comercial',
    finding: 'El lead enfría por demora de contacto o cotización.',
    action: 'Responder por WhatsApp o correo con propuesta base en menos de 1 hora hábil.',
    impact: 'Más cierres en clientes de urgencia.',
    kpi: 'Horas de respuesta',
    term: '30 días',
    intervention: 'Baja',
    impact: 4, ease: 5, speed: 5, complexity: 1
  }));
  return pickTop(improvements);
}

export function buildReportPayload(lead) {
  const base = {
    monthly_sales: toNumber(lead.monthly_sales),
    margin: toNumber(lead.margin),
    active_clients: toNumber(lead.active_clients)
  };
  const answers = lead.questionnaire_answers || {};
  let improvements = [];
  if (lead.sector === 'servicios_profesionales') improvements = diagnoseProfessional(lead, answers);
  if (lead.sector === 'comercio_ecommerce') improvements = diagnoseCommerce(lead, answers);
  if (lead.sector === 'servicios_terreno') improvements = diagnoseFieldServices(lead, answers);

  const executiveSummary = `La empresa ${lead.company} reporta ventas mensuales por ${currency(base.monthly_sales)}, un margen estimado de ${base.margin}% y ${base.active_clients} clientes activos. El foco de mejora declarado es ${lead.main_problem}. El sistema prioriza acciones de impacto rápido antes de escalar estructura.`;

  return {
    lead,
    sector_label: sectorLabels[lead.sector],
    summary: executiveSummary,
    improvements,
    plan_30: improvements.filter(i => i.term === '30 días').map(i => i.title),
    plan_90: improvements.filter(i => i.term === '90 días').map(i => i.title),
    plan_180: improvements.filter(i => i.term === '180 días').map(i => i.title),
    metrics: {
      monthly_sales: currency(base.monthly_sales),
      margin: `${base.margin}%`,
      active_clients: base.active_clients
    }
  };
}

export function renderReportHtml(payload) {
  const rows = payload.improvements.map((item, index) => `
    <tr>
      <td>${index + 1}</td>
      <td><strong>${item.title}</strong><br/><span>${item.finding}</span></td>
      <td>${item.action}</td>
      <td>${item.kpi}</td>
      <td>${item.term}</td>
      <td>${item.intervention}</td>
    </tr>
  `).join('');

  return `
    <h1>Informe de diagnóstico accionable</h1>
    <p><strong>Empresa:</strong> ${payload.lead.company}</p>
    <p><strong>Rubro:</strong> ${payload.sector_label}</p>
    <p>${payload.summary}</p>

    <h2>Resumen ejecutivo</h2>
    <table class="table">
      <tr><th>Ventas mensuales</th><th>Margen estimado</th><th>Clientes activos</th></tr>
      <tr><td>${payload.metrics.monthly_sales}</td><td>${payload.metrics.margin}</td><td>${payload.metrics.active_clients}</td></tr>
    </table>

    <h2>3 mejoras priorizadas</h2>
    <table class="table">
      <tr><th>#</th><th>Hallazgo</th><th>Acción</th><th>KPI</th><th>Plazo</th><th>Intervención</th></tr>
      ${rows}
    </table>

    <h2>Plan sugerido</h2>
    <p><strong>30 días:</strong> ${payload.plan_30.join(', ') || 'Sin acciones de 30 días definidas.'}</p>
    <p><strong>90 días:</strong> ${payload.plan_90.join(', ') || 'Sin acciones de 90 días definidas.'}</p>
    <p><strong>180 días:</strong> ${payload.plan_180.join(', ') || 'Escalar solo después de ejecutar lo prioritario.'}</p>

    <h2>Siguiente paso recomendado</h2>
    <p>Validar estas mejoras y decidir si corresponde implementación puntual o acompañamiento mensual.</p>
  `;
}
