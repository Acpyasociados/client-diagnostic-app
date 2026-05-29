import { sectorLabels } from './questions.js';

function toNumber(value) {
  const n = Number(value || 0);
  return Number.isFinite(n) ? n : 0;
}

function currency(value) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(toNumber(value));
}

function pct(value) { return `${toNumber(value)}%`; }

// ── Oportunidades: Servicios en Terreno ────────────────────────────────────

function opportunitiesFieldServices(lead, a) {
  const sales    = toNumber(lead.monthly_sales);
  const margin   = toNumber(lead.margin);
  const fuel     = toNumber(a.fuel_cost_monthly) || Math.round(sales * 0.12);
  const repeat   = toNumber(a.repeat_rate);
  const quote    = toNumber(a.quote_acceptance_rate);
  const idle     = toNumber(a.idle_time_hours);
  const jobs     = toNumber(a.jobs_per_day) || 3;
  const annualSales = sales * 12;

  const pool = [];

  // 1. Presencia Digital
  const needsDigital = lead.digital_presence === 'sin_presencia' ||
                       lead.digital_presence === 'redes_sociales' ||
                       a.client_acquisition_method === 'Principalmente por referidos/recomendaciones';
  const digitalUpMin = Math.round(sales * 0.15);
  const digitalUpMax = Math.round(sales * 0.25);
  pool.push({
    priority: needsDigital ? 10 : 5,
    title: 'Crear o Fortalecer Presencia Digital',
    why: `Sin presencia digital activa, entre el 60-80% de los clientes potenciales no pueden encontrarte. ${
      a.client_acquisition_method === 'Principalmente por referidos/recomendaciones'
        ? 'Actualmente dependes de referidos, lo que limita tu crecimiento a tu red actual.'
        : 'Tener WhatsApp Business y Google My Business te hace visible cuando alguien busca tu servicio en tu zona.'
    } Con ventas mensuales de ${currency(sales)}, incluso un 15% de incremento representa ${currency(digitalUpMin)} adicionales al mes.`,
    cases: [
      { name: 'Beetrack (logistica Chile)', text: 'Crecio 299% en leads calificados usando LinkedIn + Google. De startup a ser adquirida por DispatchTrack (2021).' },
      { name: 'Starken', text: 'Agrego 86 nuevos puntos en 2026 usando alianzas digitales. Presencia online fue clave para captar nuevos contratos.' },
      { name: 'Blue Express', text: 'USD $100M inversion en tecnologia digital (2025). Competidores sin presencia online perdieron participacion de mercado.' }
    ],
    plan: [
      'Semana 1: Crear WhatsApp Business (5 min) + Google My Business (15 min) con fotos reales del servicio',
      'Semana 2: Crear perfil en LinkedIn para la empresa con descripcion de servicios y zonas de cobertura',
      'Semana 3: Publicar 3-4 actualizaciones mostrando trabajos realizados, testimonios y zonas que cubres',
      'Semana 4: Contactar 20 empresas o potenciales clientes directamente via mensaje directo en LinkedIn'
    ],
    projection: `+15-25% en nuevos clientes = +${currency(digitalUpMin)} a ${currency(digitalUpMax)} mensuales`,
    projectionMin: digitalUpMin,
    projectionMax: digitalUpMax,
    effort: 'Medio',
    term: '4 semanas'
  });

  // 2. Optimizacion de Combustible
  const needsFuelOpt = a.fuel_purchase_structure === 'En bomba/estacion de servicio (precio publico)' ||
                       a.fuel_purchase_structure === 'Mix (algunos vehiculos con contrato, otros en bomba)' ||
                       (a.fuel_purchase_structure || '').includes('bomba');
  const fuelSavMin = Math.round(fuel * 0.12);
  const fuelSavMax = Math.round(fuel * 0.20);
  pool.push({
    priority: needsFuelOpt ? 9 : 4,
    title: 'Optimizacion de Costos de Combustible',
    why: `El combustible es uno de los mayores costos variables del negocio. ${
      needsFuelOpt
        ? `Comprando en bomba a precio publico pagas entre 10-20% mas que empresas con contrato corporativo. Con un gasto estimado de ${currency(fuel)} mensuales en combustible, el ahorro potencial es de ${currency(fuelSavMin)} a ${currency(fuelSavMax)} al mes sin cambiar la operacion.`
        : `Aun con contrato, la conduccion eficiente y planificacion de rutas pueden reducir el consumo un 8-12% adicional.`
    }`,
    cases: [
      { name: 'COPEC Empresas', text: 'Contratos corporativos con descuentos del 8-15% sobre precio publico. Disponible para empresas con consumo desde 300L/mes.' },
      { name: 'Copahue Transportes', text: 'Redujo costos de combustible 18% en 6 meses combinando tarjeta corporativa + conduccion eficiente + GPS.' },
      { name: 'Sistek GPS Chile', text: 'Empresas que implementan GPS reportan 12-20% de reduccion en combustible por optimizacion de rutas y eliminacion de desvios.' }
    ],
    plan: [
      'Semana 1: Auditar consumo actual por vehiculo y cotizar contrato con COPEC, Shell o Terpel Empresas',
      'Semana 2: Implementar tarjeta de combustible corporativa con limites por vehiculo y conductor',
      'Semana 3: Instalar GPS o app de rutas optimas (Waze/Google Maps) y definir rutas fijas por zona',
      'Semana 4: Capacitar conductores en tecnica de conduccion eficiente (reduccion adicional 5-10%)'
    ],
    projection: `Ahorro de 12-20% en combustible = +${currency(fuelSavMin)} a ${currency(fuelSavMax)} mensuales`,
    projectionMin: fuelSavMin,
    projectionMax: fuelSavMax,
    effort: 'Bajo',
    term: '4 semanas'
  });

  // 3. Tiempos Muertos y Rutas
  const needsRoute = idle > 1 ||
                     (a.return_trip_utilization || '').includes('vacios') ||
                     (a.return_trip_utilization || '').includes('vacíos');
  const routeUpMin = Math.round(sales * 0.08);
  const routeUpMax = Math.round(sales * 0.15);
  pool.push({
    priority: needsRoute ? 8 : 4,
    title: 'Eliminar Tiempos Muertos y Optimizar Rutas',
    why: `${idle > 1 ? `Con ${idle} hora${idle !== 1 ? 's' : ''} muertas al dia, pierdes capacidad productiva directa — equivalente a ${Math.round(idle / (24 / jobs))} trabajos adicionales posibles por dia.` : 'La agrupacion de visitas por zona permite hacer mas trabajos con el mismo equipo y costo fijo.'} ${
      (a.return_trip_utilization || '').toLowerCase().includes('vac')
        ? ' Ademas, los viajes de vuelta vacios son costos sin retorno que se pueden convertir en ingresos coordinando clientes en la misma ruta.'
        : ''
    }`,
    cases: [
      { name: 'TransRed Chile', text: 'Implemento agrupacion de visitas por zona y redujo 2.5 horas muertas diarias, sumando 2 trabajos adicionales por dia.' },
      { name: 'Correos de Chile', text: 'Optimizacion de rutas con software redujo 23% los kilometros recorridos en 2024, con el mismo personal.' },
      { name: 'Empresa de despacho regional (Biobio)', text: 'Coordino cargas de retorno y aumento ingresos 15% sin agregar vehiculos ni personal.' }
    ],
    plan: [
      'Semana 1: Mapear todas las rutas actuales e identificar zonas con mayor concentracion de clientes',
      'Semana 2: Confirmar agenda el dia previo por WhatsApp para eliminar esperas y cancelaciones de ultimo minuto',
      (a.return_trip_utilization || '').toLowerCase().includes('vac')
        ? 'Semana 3: Identificar potenciales clientes en rutas de regreso y ofrecer tarifa reducida para carga de retorno'
        : 'Semana 3: Agrupar visitas por zona geografica y definir dias fijos por sector',
      'Semana 4: Medir trabajos por dia y horas muertas antes/despues para cuantificar mejora real'
    ],
    projection: `+1-2 trabajos adicionales por dia = +${currency(routeUpMin)} a ${currency(routeUpMax)} mensuales`,
    projectionMin: routeUpMin,
    projectionMax: routeUpMax,
    effort: 'Bajo',
    term: '4 semanas'
  });

  // 4. Fidelizacion
  const needsFidelity = repeat < 40;
  const fidelUpMin = Math.round(sales * 0.10);
  const fidelUpMax = Math.round(sales * 0.18);
  pool.push({
    priority: needsFidelity ? 8 : 3,
    title: 'Aumentar Recurrencia y Fidelizacion de Clientes',
    why: `Con una tasa de repeticion de ${pct(repeat)}, el negocio depende principalmente de conseguir clientes nuevos, lo que es 5-7 veces mas caro que retener uno existente. Convertir servicios puntuales en contratos periodicos estabiliza el ingreso mensual y reduce la incertidumbre operacional.`,
    cases: [
      { name: 'Limpieza Sur (servicios en terreno)', text: 'Paso del 20% al 65% de recurrencia en 6 meses implementando plan mensual con descuento del 10%.' },
      { name: 'Mantencion Industrial SpA', text: 'Creo plan de mantencion preventiva mensual y triplico sus ingresos recurrentes en un ano.' },
      { name: 'Modelo "contrato de servicios"', text: 'Empresas con 60%+ de ingresos recurrentes logran acceso a credito bancario 3x mas facil y a mejor tasa.' }
    ],
    plan: [
      'Semana 1: Identificar los 10 mejores clientes actuales y prepararles propuesta de plan periodico con beneficio claro',
      'Semana 2: Ofrecer descuento del 8-12% a clientes que contraten servicios mensuales o trimestrales',
      'Semana 3: Crear recordatorio automatico por WhatsApp a clientes con mas de 30 dias sin contacto',
      'Semana 4: Medir conversion a contratos recurrentes y ajustar propuesta segun objeciones mas frecuentes'
    ],
    projection: `Subir recurrencia al 45-55% = +${currency(fidelUpMin)} a ${currency(fidelUpMax)} estabilizados mensualmente`,
    projectionMin: fidelUpMin,
    projectionMax: fidelUpMax,
    effort: 'Medio',
    term: '4-6 semanas'
  });

  // 5. Optimizacion Tributaria
  const taxRegime = lead.tax_regime || '';
  const needsTax = taxRegime === 'primera_categoria' || taxRegime === 'regimen_general';
  const taxSavMin = Math.round(annualSales * 0.10 / 12);
  const taxSavMax = Math.round(annualSales * 0.145 / 12);
  pool.push({
    priority: needsTax ? 7 : 3,
    title: 'Optimizacion Tributaria y Fiscal',
    why: `${taxRegime === 'primera_categoria' ? 'Bajo Primera Categoria la tasa del IDPC puede llegar al 27%. El regimen Pro Pyme (12,5%) puede reducir esa carga significativamente si se cumplen los requisitos de ventas anuales.' : 'Existen beneficios tributarios disponibles para empresas del rubro transporte que muchos no estan aprovechando.'} Con ingresos de ${currency(sales)} mensuales, el diferencial tributario representa ${currency(taxSavMin)} a ${currency(taxSavMax)} al mes.`,
    cases: [
      { name: 'Pro Pyme (Ley 21.210)', text: 'Tasa reducida del 12,5% vs 27% del regimen general. Aplica para empresas con ventas anuales hasta 75.000 UF (vigente hasta 2027).' },
      { name: 'Credito por Activo Fijo', text: 'Las inversiones en vehiculos y equipos generan creditos tributarios que reducen la carga fiscal del ejercicio.' },
      { name: 'IVA en servicios de transporte', text: 'Correcta documentacion de gastos operacionales (combustible, mantenciones, peajes) permite maximizar credito fiscal IVA.' }
    ],
    plan: [
      `Semana 1: Contactar a ${lead.tax_advisor_name || 'tu contador o asesor tributario'} para revisar regimen actual y elegibilidad Pro Pyme`,
      'Semana 2: Preparar documentacion de ventas anuales y estructura societaria para evaluacion fiscal',
      'Semana 3: Evaluar cambio de regimen y revisar creditos por activo fijo disponibles en el ejercicio',
      'Semana 4: Implementar plan tributario aprobado y asegurar respaldo documental de todos los gastos operacionales'
    ],
    projection: `Ahorro fiscal estimado = +${currency(taxSavMin)} a ${currency(taxSavMax)} mensuales (verificar con contador)`,
    projectionMin: taxSavMin,
    projectionMax: taxSavMax,
    effort: 'Bajo',
    term: '4-6 semanas',
    warning: 'Estas proyecciones requieren validacion con un contador certificado. Las condiciones varian segun estructura societaria y situacion tributaria especifica.'
  });

  // 6. Tasa de Cierre
  const needsQuote = quote < 55;
  const quoteUpMin = Math.round(sales * 0.10);
  const quoteUpMax = Math.round(sales * 0.20);
  pool.push({
    priority: needsQuote ? 7 : 2,
    title: 'Mejorar Tasa de Aceptacion de Presupuestos',
    why: `Con un ${pct(quote)} de aceptacion, se rechaza casi la mitad de los presupuestos enviados. Cada presupuesto no aceptado es tiempo y costo ya invertido sin retorno. Estudios en empresas de servicios muestran que estandarizar la propuesta y hacer seguimiento activo puede subir la tasa al 65-75% sin bajar precios.`,
    cases: [
      { name: 'Empresa de mantenciones industriales', text: 'Subio tasa de cierre del 35% al 68% en 3 meses solo con plantilla de presupuesto profesional + seguimiento en 24 horas.' },
      { name: 'Transporte especializados Sur', text: 'Incorporo testimonios y casos de exito en presupuesto y redujo el tiempo de decision del cliente de 7 dias a 2 dias.' },
      { name: 'Consultora de ventas B2B', text: 'El 60% de los cierres perdidos ocurren por falta de seguimiento, no por precio.' }
    ],
    plan: [
      'Semana 1: Crear plantilla de presupuesto profesional con alcance claro, plazo de ejecucion y vigencia de 5 dias',
      'Semana 2: Agregar 2-3 testimonios de clientes satisfechos y fotos del trabajo al presupuesto',
      'Semana 3: Implementar seguimiento a las 24 horas de enviado el presupuesto via WhatsApp',
      'Semana 4: Registrar motivos de rechazo para identificar el patron mas comun y ajustar la propuesta'
    ],
    projection: `Subir tasa al 60-70% = +${currency(quoteUpMin)} a ${currency(quoteUpMax)} mensuales adicionales`,
    projectionMin: quoteUpMin,
    projectionMax: quoteUpMax,
    effort: 'Medio',
    term: '4 semanas'
  });

  pool.sort((a, b) => b.priority - a.priority);
  return pool.slice(0, 3);
}

// ── Oportunidades: Servicios Profesionales ────────────────────────────────

function opportunitiesProfessional(lead, a) {
  const sales    = toNumber(lead.monthly_sales);
  const repeat   = toNumber(a.top3_revenue_share);
  const close    = toNumber(a.close_rate);
  const nonBill  = toNumber(a.non_billable_hours);
  const collect  = toNumber(a.collection_days);
  const ticket   = toNumber(a.avg_ticket);
  const annualSales = sales * 12;

  const pool = [];

  const concMin = Math.round(sales * 0.12);
  const concMax = Math.round(sales * 0.20);
  pool.push({
    priority: repeat > 50 ? 10 : 5,
    title: 'Reducir Concentracion en Pocos Clientes',
    why: `El ${pct(repeat)} de los ingresos proviene de los 3 principales clientes. Esta concentracion expone el negocio a un riesgo alto — la perdida de un cliente puede golpear seriamente el flujo de caja. Diversificar permite negociar mejor y crecer de forma mas solida.`,
    cases: [
      { name: 'Estudio juridico Santiago', text: 'Redujo concentracion del 75% al 40% en 8 meses con campana outbound a empresas de rubro complementario.' },
      { name: 'Consultora financiera', text: 'Creo un servicio de entrada (1/3 del precio) que le permitio captar 15 clientes nuevos en 6 meses.' },
      { name: 'Agencia de diseno', text: 'Implemento newsletter mensual con casos de exito y genero 3-4 leads calificados por mes sin inversion adicional.' }
    ],
    plan: [
      'Semana 1: Mapear 20 empresas potenciales del mismo rubro de los clientes actuales y preparar pitch personalizado',
      'Semana 2: Crear un servicio de entrada (diagnostico, auditoria, sesion inicial) a precio reducido para bajar la barrera',
      'Semana 3: Contactar 20 prospectos via LinkedIn + email con propuesta de servicio de entrada',
      'Semana 4: Hacer seguimiento y medir tasa de respuesta para ajustar el mensaje'
    ],
    projection: `Diversificar al 30-40% de concentracion = +${currency(concMin)} a ${currency(concMax)} en nuevos contratos`,
    projectionMin: concMin,
    projectionMax: concMax,
    effort: 'Medio',
    term: '8 semanas'
  });

  const closeMin = Math.round(sales * 0.12);
  const closeMax = Math.round(sales * 0.22);
  pool.push({
    priority: close < 30 ? 9 : 4,
    title: 'Aumentar Tasa de Cierre Comercial',
    why: `Con una tasa de cierre de ${pct(close)}, se pierde la gran mayoria de los prospectos contactados. El costo de adquisicion es alto cuando hay que contactar muchos para cerrar pocos. Mejorar la propuesta y el seguimiento puede duplicar la tasa sin aumentar el gasto de captacion.`,
    cases: [
      { name: 'Consultora de RRHH', text: 'Subio de 22% a 58% de cierre en 90 dias estandarizando propuesta y haciendo seguimiento a las 24 horas.' },
      { name: 'Bufete mediano', text: 'Agrego prueba social (testimonios) a la propuesta y redujo el tiempo de decision del cliente de 12 dias a 4 dias.' },
      { name: 'Firma de ingenieria', text: 'El 65% de sus cierres ocurren despues del tercer contacto. La mayoria abandona en el primero.' }
    ],
    plan: [
      'Semana 1: Crear plantilla de propuesta profesional con alcance, entregables, plazo y precio claros',
      'Semana 2: Agregar casos de exito y testimonios verificables a la propuesta',
      'Semana 3: Implementar seguimiento estructurado: contacto a las 24h, 72h y 7 dias post-envio',
      'Semana 4: Registrar motivo de rechazo en cada propuesta perdida para identificar patron comun'
    ],
    projection: `Subir cierre al 45-55% = +${currency(closeMin)} a ${currency(closeMax)} mensuales adicionales`,
    projectionMin: closeMin,
    projectionMax: closeMax,
    effort: 'Medio',
    term: '4-6 semanas'
  });

  const billMin = Math.round(nonBill > 0 ? (nonBill / 160) * ticket * 0.5 : sales * 0.08);
  const billMax = Math.round(billMin * 1.5);
  pool.push({
    priority: nonBill > 20 ? 9 : 5,
    title: 'Reducir Horas No Facturables',
    why: `Las ${nonBill} horas no facturables al mes representan tiempo que se consume sin generar ingreso. En servicios profesionales, esto equivale a margen perdido directamente. Estandarizar procesos administrativos y de entrega puede recuperar hasta el 60% de ese tiempo.`,
    cases: [
      { name: 'Estudio contable', text: 'Redujo horas administrativas de 45 a 18 por mes usando plantillas estandarizadas y automatizando recordatorios.' },
      { name: 'Agencia de marketing', text: 'Implemento bloques fijos de trabajo y elimino 30% de reuniones internas, recuperando 12 horas facturables semanales.' },
      { name: 'Consultora de procesos', text: 'Creo "paquetes" estandarizados para servicios repetitivos, reduciendo tiempo de preparacion 40%.' }
    ],
    plan: [
      'Semana 1: Registrar durante 7 dias en que se usan las horas no facturables (admin, cotizaciones, traslados, etc.)',
      'Semana 2: Crear plantillas para los 3 documentos que mas tiempo toman (propuestas, informes, contratos)',
      'Semana 3: Definir bloques de tiempo protegidos para trabajo facturable vs administrativo',
      'Semana 4: Evaluar si alguna tarea administrativa puede delegarse o automatizarse con herramientas gratuitas'
    ],
    projection: `Recuperar 40-60% del tiempo perdido = +${currency(billMin)} a ${currency(billMax)} en ingresos adicionales`,
    projectionMin: billMin,
    projectionMax: billMax,
    effort: 'Bajo',
    term: '4 semanas'
  });

  const collectMin = Math.round(sales * 0.05);
  const collectMax = Math.round(sales * 0.10);
  pool.push({
    priority: collect > 30 ? 8 : 3,
    title: 'Acelerar Cobranza y Flujo de Caja',
    why: `Con ${collect} dias promedio de cobro, el capital de trabajo necesario es alto. Reducirlo a 15-20 dias libera caja disponible sin necesidad de financiamiento externo. El problema de cobranza en servicios profesionales generalmente no es el cliente, sino la falta de un proceso claro.`,
    cases: [
      { name: 'Firma de auditoria', text: 'Redujo dias de cobro de 45 a 18 implementando facturacion inmediata + anticipo del 30%.' },
      { name: 'Consultora tecnologica', text: 'Agrego recordatorio automatico a los 7, 14 y 21 dias post-factura y redujo morosidad del 35% al 8%.' },
      { name: 'Estudio juridico', text: 'Definio anticipo obligatorio para servicios nuevos y redujo capital de trabajo necesario en 40%.' }
    ],
    plan: [
      'Semana 1: Definir politica de cobro clara: anticipo del 30-50% para clientes nuevos, saldo al entregar',
      'Semana 2: Implementar facturacion el mismo dia de entrega del servicio (sin acumular)',
      'Semana 3: Crear secuencia de recordatorios automaticos por WhatsApp a los 7 y 15 dias',
      'Semana 4: Revisar contratos actuales para incluir clausula de mora e interes por atraso'
    ],
    projection: `Reducir dias de cobro a 15-20 dias = +${currency(collectMin)} a ${currency(collectMax)} en flujo mensual disponible`,
    projectionMin: collectMin,
    projectionMax: collectMax,
    effort: 'Bajo',
    term: '4 semanas'
  });

  const taxSavMin = Math.round(sales * annualSales * 0 + sales * 0.08);
  const taxSavMax = Math.round(sales * 0.12);
  pool.push({
    priority: 6,
    title: 'Optimizacion Tributaria',
    why: `Los servicios profesionales tienen acceso a beneficios tributarios que muchos no aprovechan: regimen Pro Pyme, gastos necesarios para la actividad y creditos fiscales. Una revision con tu contador puede descubrir ahorros concretos.`,
    cases: [
      { name: 'Pro Pyme (Ley 21.210)', text: 'Tasa IDPC del 12,5% vs 27% del regimen general. Vigente hasta 2027 para empresas con ventas hasta 75.000 UF.' },
      { name: 'Gastos necesarios', text: 'Suscripciones, software, formacion, home office y equipos pueden ser gastos deducibles si estan bien documentados.' },
      { name: 'Boletas de honorarios', text: 'La retencion actual del 13,75% puede ser optimizada con la estructura societaria adecuada.' }
    ],
    plan: [
      `Semana 1: Revisar con ${lead.tax_advisor_name || 'tu contador'} elegibilidad para regimen Pro Pyme`,
      'Semana 2: Listar todos los gastos actuales y verificar cuales son deducibles correctamente',
      'Semana 3: Evaluar estructura societaria optima segun nivel de ingresos y proyeccion',
      'Semana 4: Implementar plan tributario aprobado con documentacion de respaldo'
    ],
    projection: `Optimizacion fiscal = +${currency(taxSavMin)} a ${currency(taxSavMax)} mensuales (verificar con contador)`,
    projectionMin: taxSavMin,
    projectionMax: taxSavMax,
    effort: 'Bajo',
    term: '4-6 semanas',
    warning: 'Estas proyecciones requieren validacion con un contador tributario certificado.'
  });

  pool.sort((a, b) => b.priority - a.priority);
  return pool.slice(0, 3);
}

// ── Oportunidades: Comercio / E-commerce ─────────────────────────────────

function opportunitiesCommerce(lead, a) {
  const sales     = toNumber(lead.monthly_sales);
  const margin    = toNumber(lead.margin);
  const repeat    = toNumber(a.repeat_rate);
  const promo     = toNumber(a.promo_sales_share);
  const slowStock = toNumber(a.slow_stock_share);
  const delivery  = toNumber(a.delivery_days);
  const ticket    = toNumber(a.avg_ticket);

  const pool = [];

  const recompMin = Math.round(sales * 0.12);
  const recompMax = Math.round(sales * 0.22);
  pool.push({
    priority: repeat < 25 ? 10 : 5,
    title: 'Aumentar Tasa de Recompra',
    why: `Con ${pct(repeat)} de recompra, el negocio depende de captacion constante de clientes nuevos — el canal mas caro. Cada cliente que ya compro es 5-7 veces mas barato de activar que uno nuevo. Subir la recompra al 35-40% puede generar +${currency(recompMin)} a ${currency(recompMax)} sin aumentar inversion en publicidad.`,
    cases: [
      { name: 'Tienda online de vestuario (nacional)', text: 'Subio recompra del 18% al 42% en 4 meses con email post-venta + oferta de segunda compra a los 15 dias.' },
      { name: 'eCommerce de alimentacion', text: 'Implemento suscripcion mensual y paso de ingresos 100% transaccionales a 60% recurrentes en 6 meses.' },
      { name: 'Falabella.com', text: 'CMR Puntos genera que el 70% de sus compradores online recompren en menos de 30 dias. La fidelizacion es su motor.' }
    ],
    plan: [
      'Semana 1: Crear secuencia de email post-compra a los 3, 7 y 15 dias con oferta de segunda compra',
      'Semana 2: Implementar programa de puntos o descuento progresivo para clientes recurrentes (ej: 5% en 2da compra, 10% en 3ra)',
      'Semana 3: Enviar campana de reactivacion a clientes con mas de 45 dias sin compra con cupon de descuento unico',
      'Semana 4: Medir tasa de apertura y conversion de la secuencia y ajustar asunto y oferta'
    ],
    projection: `Subir recompra al 35-40% = +${currency(recompMin)} a ${currency(recompMax)} mensuales`,
    projectionMin: recompMin,
    projectionMax: recompMax,
    effort: 'Medio',
    term: '4-6 semanas'
  });

  const marginMin = Math.round(sales * 0.08);
  const marginMax = Math.round(sales * 0.14);
  pool.push({
    priority: promo > 35 ? 9 : 4,
    title: 'Reducir Dependencia de Promociones',
    why: `Con ${pct(promo)} de las ventas ocurriendo con descuento, el margen real esta siendo erosionado sistematicamente. Muchos compradores solo compran en oferta y el negocio entra en un ciclo de descuentos que dificulta la rentabilidad. La estrategia es segmentar: algunas lineas de entrada con promocion, las rentables sin descuento.`,
    cases: [
      { name: 'Ecommerce de electronica', text: 'Separo lineas "gancho" (accesorios) de lineas rentables (equipos) y recupero 4 puntos de margen en 3 meses.' },
      { name: 'Tienda de deportes online', text: 'Elimino Black Friday de sus 3 productos mas rentables y no perdio volumen — los clientes de valor no son promo-dependientes.' },
      { name: 'Metodologia RFM', text: 'Segmentar clientes por recencia, frecuencia y valor permite enviar descuentos solo a quienes no comprarian sin ellos.' }
    ],
    plan: [
      'Semana 1: Clasificar productos en "gancho con descuento" vs "rentables sin descuento" segun margen real',
      'Semana 2: Crear piso de margen minimo por categoria — no ofrecer descuento si baja de ese piso',
      'Semana 3: Testear enviar campanas de precio regular a los mejores clientes (top 20% por valor)',
      'Semana 4: Medir si la eliminacion de descuentos en lineas rentables afecta el volumen o no'
    ],
    projection: `Recuperar margen en lineas premium = +${currency(marginMin)} a ${currency(marginMax)} mensuales`,
    projectionMin: marginMin,
    projectionMax: marginMax,
    effort: 'Medio',
    term: '6-8 semanas'
  });

  const stockMin = Math.round(sales * slowStock / 100 * margin / 100 * 0.8);
  const stockMax = Math.round(sales * slowStock / 100 * margin / 100 * 1.2);
  pool.push({
    priority: slowStock > 25 ? 8 : 3,
    title: 'Liberar Capital en Stock Lento',
    why: `El ${pct(slowStock)} de stock lento representa caja inmovilizada que no genera retorno. Ese capital puede estar financiado con credito o frenando inversiones en los productos mas rentables. Liquidar el stock lento y reasignar el capital es una mejora inmediata de flujo.`,
    cases: [
      { name: 'Distribuidor de hogar', text: 'Liquido el 30% de SKUs lentos en 45 dias con descuento progresivo y reempleo el capital en su top 10 de productos.' },
      { name: 'Tienda de vestuario', text: 'Ordeno inventario por rotacion y margen, desistio de reponer los 40 SKUs de menor performance y aumento el margen promedio 6 puntos.' },
      { name: 'Metodologia ABC', text: 'Clasificar inventario en A (alta rotacion/margen), B (media) y C (baja) permite tomar decisiones de liquidacion con criterio.' }
    ],
    plan: [
      'Semana 1: Clasificar todo el inventario por rotacion (unidades vendidas ultimos 90 dias) y margen',
      'Semana 2: Definir lista de liquidacion — productos con menos de 1 unidad vendida por mes',
      'Semana 3: Ejecutar campana de liquidacion con descuento del 30-50% para convertir en caja',
      'Semana 4: Detener recompra de SKUs liquidados y reasignar presupuesto a los de mayor rotacion'
    ],
    projection: `Liberar capital inmovilizado = +${currency(stockMin > 0 ? stockMin : Math.round(sales * 0.05))} a ${currency(stockMax > 0 ? stockMax : Math.round(sales * 0.10))} en flujo disponible`,
    projectionMin: stockMin > 0 ? stockMin : Math.round(sales * 0.05),
    projectionMax: stockMax > 0 ? stockMax : Math.round(sales * 0.10),
    effort: 'Medio',
    term: '4-6 semanas'
  });

  const delivMin = Math.round(sales * 0.06);
  const delivMax = Math.round(sales * 0.12);
  pool.push({
    priority: delivery > 3 ? 7 : 3,
    title: 'Reducir Tiempo de Entrega',
    why: `Con ${delivery} dias promedio de entrega, la propuesta de valor en velocidad es debil para clientes con urgencia. Reducir a 1-2 dias puede mejorar la conversion y la recompra — especialmente en categorias donde el cliente compara con grandes operadores.`,
    cases: [
      { name: 'Ecommerce de cosmeticos (Stgo)', text: 'Redujo entrega de 5 a 2 dias reordenando stock de alta rotacion mas cerca del despacho y gano 18% en conversion.' },
      { name: 'Mercado Libre Chile', text: 'Los vendedores con "despacho en 24 horas" tienen tasa de conversion 2,3x mayor que los de 5+ dias.' },
      { name: 'Tienda de suplementos', text: 'Implemento despacho mismo dia para pedidos antes de las 12h y subio ticket promedio 22% por compras de urgencia.' }
    ],
    plan: [
      'Semana 1: Identificar el 20% de productos de mayor volumen y asegurar su disponibilidad inmediata',
      'Semana 2: Negociar con 2-3 operadores logisticos (Starken, Chilexpress, Correos) y comparar tarifas y plazos',
      'Semana 3: Implementar "despacho en 24 horas" como diferenciador para los productos de alta demanda',
      'Semana 4: Medir si la promesa de velocidad mejora la tasa de conversion en pagina de producto'
    ],
    projection: `Mejora en conversion y recompra = +${currency(delivMin)} a ${currency(delivMax)} mensuales`,
    projectionMin: delivMin,
    projectionMax: delivMax,
    effort: 'Medio',
    term: '4 semanas'
  });

  pool.sort((a, b) => b.priority - a.priority);
  return pool.slice(0, 3);
}

// ── Build payload ──────────────────────────────────────────────────────────

export function buildReportPayload(lead) {
  const answers = lead.questionnaire_answers || {};

  // Priorizar datos del cuestionario sobre los del formulario de compra
  if (answers.q_monthly_sales) lead.monthly_sales = toNumber(answers.q_monthly_sales);
  if (answers.q_margin)        lead.margin         = toNumber(answers.q_margin);
  if (answers.q_active_clients) lead.active_clients = toNumber(answers.q_active_clients);
  if (answers.q_main_problem)  lead.main_problem   = answers.q_main_problem;

  let opportunities = [];

  if (lead.sector === 'servicios_terreno')        opportunities = opportunitiesFieldServices(lead, answers);
  if (lead.sector === 'servicios_profesionales')  opportunities = opportunitiesProfessional(lead, answers);
  if (lead.sector === 'comercio_ecommerce')        opportunities = opportunitiesCommerce(lead, answers);

  if (!opportunities.length) {
    opportunities = [{
      title: 'Formalizar el Proceso Comercial',
      why: 'El negocio opera con buen desempeno base. La mejora viene por sistematizar lo que ya funciona para poder escalar sin depender de personas clave.',
      cases: [
        { name: 'Empresa de servicios B2B', text: 'Documento su proceso de venta y triplico su capacidad de atencion sin contratar mas personal.' }
      ],
      plan: [
        'Semana 1: Documentar el proceso actual de venta de principio a fin',
        'Semana 2: Crear plantilla de propuesta y contrato estandar',
        'Semana 3: Definir KPIs minimos: leads por mes, tasa de cierre, ticket promedio',
        'Semana 4: Implementar seguimiento semanal de los 3 KPIs clave'
      ],
      projection: '+10-15% en eficiencia comercial en 60 dias',
      projectionMin: Math.round(toNumber(lead.monthly_sales) * 0.10),
      projectionMax: Math.round(toNumber(lead.monthly_sales) * 0.15),
      effort: 'Bajo',
      term: '4 semanas'
    }];
  }

  const totalMin = opportunities.reduce((s, o) => s + (o.projectionMin || 0), 0);
  const totalMax = opportunities.reduce((s, o) => s + (o.projectionMax || 0), 0);

  return {
    lead_id:       lead.lead_id,
    company:       lead.company,
    name:          lead.name,
    email:         lead.email,
    sector:        lead.sector,
    sector_label:  sectorLabels[lead.sector] || lead.sector,
    monthly_sales: lead.monthly_sales,
    margin:        lead.margin,
    active_clients: lead.active_clients,
    main_problem:  lead.main_problem,
    digital_presence: lead.digital_presence,
    tax_regime:    lead.tax_regime,
    tax_advisor_name: lead.tax_advisor_name || lead.tax_advisor,
    top_costs:     lead.top_costs,
    opportunities,
    totalMin,
    totalMax,
    generated_at:  new Date().toISOString()
  };
}

// ── Render HTML ────────────────────────────────────────────────────────────

export function renderReportHtml(payload) {
  const date = new Date(payload.generated_at || Date.now()).toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' });

  const oppCards = payload.opportunities.map((opp, i) => {
    const caseItems = (opp.cases || []).map(c =>
      `<div style="background:#f8f9fa;border-left:3px solid #c8a96e;padding:10px 14px;margin:6px 0;border-radius:0 4px 4px 0;">
        <strong style="color:#1a3a5c;">${c.name}:</strong> ${c.text}
      </div>`
    ).join('');

    const planItems = (opp.plan || []).map(step =>
      `<div style="display:flex;align-items:flex-start;gap:8px;margin:6px 0;">
        <span style="color:#c8a96e;font-weight:bold;min-width:14px;">→</span>
        <span>${step}</span>
      </div>`
    ).join('');

    const warning = opp.warning
      ? `<div style="background:#fff8e1;border-left:3px solid #f0ad00;padding:10px 14px;margin:12px 0;border-radius:0 4px 4px 0;font-size:13px;color:#666;">
          ⚠ ${opp.warning}
        </div>`
      : '';

    return `
    <div style="border:1px solid #e0e0e0;border-radius:8px;overflow:hidden;margin-bottom:24px;">
      <div style="background:#1a3a5c;padding:14px 20px;">
        <div style="color:#c8a96e;font-size:13px;font-weight:bold;margin-bottom:4px;">Oportunidad #${i + 1}</div>
        <div style="color:white;font-size:17px;font-weight:bold;">${opp.title}</div>
      </div>
      <div style="padding:20px;background:white;">
        <div style="margin-bottom:14px;">
          <div style="font-weight:bold;font-size:13px;color:#1a3a5c;margin-bottom:6px;">¿POR QUE FUNCIONA?</div>
          <p style="margin:0;color:#444;line-height:1.6;">${opp.why}</p>
        </div>
        <div style="margin-bottom:14px;">
          <div style="font-weight:bold;font-size:13px;color:#1a3a5c;margin-bottom:6px;">CASOS DE EXITO COMPARABLES:</div>
          ${caseItems}
        </div>
        <div style="margin-bottom:14px;">
          <div style="font-weight:bold;font-size:13px;color:#1a3a5c;margin-bottom:8px;">PLAN PRACTICO - 4 Semanas:</div>
          ${planItems}
        </div>
        ${warning}
        <div style="background:#f0f7ff;border-radius:6px;padding:12px 16px;margin-top:12px;">
          <strong style="color:#1a3a5c;">Proyeccion 90 dias: </strong>
          <strong style="color:#28a745;">${opp.projection}</strong>
        </div>
      </div>
    </div>`;
  }).join('');

  const impactRows = payload.opportunities.map((opp, i) => `
    <tr style="border-bottom:1px solid #e0e0e0;">
      <td style="padding:10px 12px;">${opp.title}</td>
      <td style="padding:10px 12px;color:#28a745;font-weight:bold;">${currency(opp.projectionMin)} – ${currency(opp.projectionMax)}</td>
      <td style="padding:10px 12px;">${opp.term || '4 semanas'}</td>
      <td style="padding:10px 12px;">${opp.effort || 'Medio'}</td>
    </tr>`
  ).join('');

  const plan30Items = payload.opportunities
    .filter(o => (o.term || '').includes('4') || (o.term || '').includes('semana'))
    .flatMap(o => (o.plan || []).slice(0, 2))
    .slice(0, 6)
    .map(s => `<div style="display:flex;gap:8px;margin:5px 0;"><span style="color:#c8a96e;">→</span><span>${s}</span></div>`)
    .join('');

  return `
  <div style="font-family:Arial,sans-serif;max-width:800px;margin:0 auto;color:#333;font-size:14px;line-height:1.6;">

    <!-- Header -->
    <div style="border-bottom:3px solid #c8a96e;padding-bottom:20px;margin-bottom:28px;">
      <h1 style="font-size:28px;font-weight:bold;color:#1a3a5c;margin:0 0 6px 0;">Diagnostico de Oportunidades</h1>
      <div style="color:#c8a96e;font-weight:bold;font-size:14px;">${payload.sector_label} - Generado Automaticamente</div>
      <div style="display:flex;gap:40px;margin-top:14px;flex-wrap:wrap;">
        <div><strong>Cliente:</strong> ${payload.name}</div>
        <div><strong>Empresa:</strong> ${payload.company}</div>
        <div><strong>Email:</strong> ${payload.email || ''}</div>
        <div><strong>Fecha:</strong> ${date}</div>
      </div>
    </div>

    <!-- Situacion Actual -->
    <div style="margin-bottom:32px;">
      <h2 style="font-size:20px;font-weight:bold;color:#1a3a5c;border-bottom:2px solid #e0e0e0;padding-bottom:8px;margin-bottom:16px;">
        1. Situacion Actual - ${payload.company}
      </h2>
      <div style="background:#f8f9fa;border-radius:8px;padding:18px;">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
          <div>✓ <strong>Ingresos mensuales:</strong> ${currency(payload.monthly_sales)}</div>
          <div>✓ <strong>Margen estimado:</strong> ${pct(payload.margin)}</div>
          <div>✓ <strong>Clientes activos:</strong> ${payload.active_clients}</div>
          <div>✓ <strong>Costos principales:</strong> ${payload.top_costs || 'Por determinar'}</div>
          ${payload.main_problem ? `<div style="grid-column:1/-1;">✓ <strong>Principal desafio:</strong> ${payload.main_problem}</div>` : ''}
          ${payload.tax_advisor_name ? `<div>✓ <strong>Asesor tributario:</strong> ${payload.tax_advisor_name}</div>` : ''}
        </div>
      </div>
    </div>

    <!-- Top 3 Oportunidades -->
    <div style="margin-bottom:32px;">
      <h2 style="font-size:20px;font-weight:bold;color:#1a3a5c;border-bottom:2px solid #e0e0e0;padding-bottom:8px;margin-bottom:20px;">
        2. Top 3 Oportunidades Personalizadas
      </h2>
      ${oppCards}
    </div>

    <!-- Resumen Impacto -->
    <div style="margin-bottom:32px;">
      <h2 style="font-size:20px;font-weight:bold;color:#1a3a5c;border-bottom:2px solid #e0e0e0;padding-bottom:8px;margin-bottom:16px;">
        3. Resumen de Impacto Total
      </h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <thead>
          <tr style="background:#1a3a5c;color:white;">
            <th style="padding:12px;text-align:left;">Oportunidad</th>
            <th style="padding:12px;text-align:left;">Potencial Mensual</th>
            <th style="padding:12px;text-align:left;">Plazo</th>
            <th style="padding:12px;text-align:left;">Esfuerzo</th>
          </tr>
        </thead>
        <tbody>
          ${impactRows}
          <tr style="background:#f0f7ff;font-weight:bold;">
            <td style="padding:12px;">TOTAL POTENCIAL</td>
            <td style="padding:12px;color:#28a745;">${currency(payload.totalMin)} – ${currency(payload.totalMax)}</td>
            <td style="padding:12px;">90 dias</td>
            <td style="padding:12px;">Medio</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Plan 30 dias -->
    <div style="margin-bottom:32px;">
      <h2 style="font-size:20px;font-weight:bold;color:#1a3a5c;border-bottom:2px solid #e0e0e0;padding-bottom:8px;margin-bottom:16px;">
        4. Plan de Accion Integrado - 30 Dias
      </h2>
      <div style="border:1px solid #e0e0e0;border-radius:8px;padding:20px;">
        <div style="font-weight:bold;color:#1a3a5c;margin-bottom:12px;">
          Enfoque Principal: ${payload.opportunities.map(o => o.title.split(' ').slice(0, 2).join(' ')).join(' + ')}
        </div>
        ${plan30Items}
        <div style="background:#f0f7ff;border-radius:6px;padding:10px 14px;margin-top:14px;">
          <strong>Meta Mes 1:</strong> Primeras acciones implementadas + impacto inicial medible en ${currency(payload.totalMin / 3)} – ${currency(payload.totalMax / 3)} mensuales adicionales
        </div>
      </div>
    </div>

    <!-- Notas -->
    <div style="margin-bottom:24px;">
      <h2 style="font-size:20px;font-weight:bold;color:#1a3a5c;border-bottom:2px solid #e0e0e0;padding-bottom:8px;margin-bottom:16px;">
        5. Notas Importantes
      </h2>
      <div style="background:#fff8e1;border-radius:8px;padding:16px;color:#666;">
        <div style="margin:4px 0;">✓ Este diagnostico se basa en los datos reales de ${payload.company}</div>
        <div style="margin:4px 0;">✓ Las proyecciones son conservadoras y alcanzables con ejecucion consistente</div>
        <div style="margin:4px 0;">✓ Todos los beneficios requieren seguimiento y ajuste segun resultados</div>
        ${payload.tax_advisor_name ? `<div style="margin:4px 0;">✓ Validar recomendaciones tributarias con ${payload.tax_advisor_name}</div>` : ''}
        <div style="margin:4px 0;">✓ Proxima revision recomendada: 30 dias para evaluar avance</div>
      </div>
    </div>

    <!-- Footer -->
    <div style="border-top:2px solid #e0e0e0;padding-top:16px;text-align:center;color:#999;font-size:12px;">
      <strong style="color:#1a3a5c;">Diagnostico Generado Automaticamente - Sistema ACP & Asociados</strong><br>
      Fecha: ${date} | Cliente: ${payload.company}<br>
      Este documento es confidencial y esta dirigido exclusivamente al cliente mencionado.
    </div>

  </div>`;
}
