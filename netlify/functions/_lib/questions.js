// IMPORTANTE: estas claves deben coincidir 1:1 con las <option value="..."> del
// selector "industry" en index.html. Si falta una clave acá, el cuestionario
// muestra el rubro como su slug crudo (ej. "manufactura" en vez de
// "Manufactura e Industria") — bug detectado en prueba real el 2026-06-06.
export const sectorLabels = {
  servicios_profesionales: 'Servicios profesionales',
  comercio_ecommerce:      'Comercio / e-commerce',
  servicios_terreno:       'Servicios en terreno',
  construccion:            'Construcción y obras',
  gastronomia:             'Gastronomía y alimentos',
  salud_belleza:           'Salud y belleza',
  tecnologia:              'Tecnología y software',
  educacion:               'Educación y capacitación',
  manufactura:             'Manufactura e industria',
  otro:                    'Otro rubro'
};

// ── Preguntas base: aplican a TODOS los sectores ─────────────────────────────
// Lenguaje cotidiano, sin jerga financiera.
// Exportada para servir de fallback cuando un sector no tiene banco propio
// (ver get-questionnaire.js) — así nunca se entrega un cuestionario vacío.
export const baseQuestions = [
  {
    key:         'q_monthly_sales',
    label:       '¿Cuánto vende tu empresa al mes aproximadamente? (en pesos)',
    required:    true,
    type:        'number',
    placeholder: 'Ej: 5000000'
  },
  {
    key:         'q_margin',
    label:       'Por cada $100 que vendes, ¿cuánto queda como ganancia después de pagar todos los costos? (número aproximado)',
    required:    true,
    type:        'number',
    placeholder: 'Ej: 25 (significa que te quedan $25 de cada $100)'
  },
  {
    key:         'q_active_clients',
    label:       '¿Cuántos clientes activos tiene tu empresa hoy?',
    required:    true,
    type:        'number',
    placeholder: 'Ej: 20'
  },
  {
    key:         'q_main_problem',
    label:       '¿Cuál es el principal problema o desafío de tu negocio hoy?',
    required:    true,
    type:        'text',
    placeholder: 'Ej: Me cuesta conseguir clientes nuevos y los costos han subido mucho'
  },
  {
    key:         'q_business_description',
    label:       'Describe brevemente qué hace tu empresa y cómo gana dinero',
    required:    true,
    type:        'text',
    placeholder: 'Ej: Somos una consultora de RRHH, cobramos por proyectos de selección y capacitación a empresas medianas'
  }
];

// ── Servicios profesionales ───────────────────────────────────────────────────
// Aplica a: consultoras, abogados, contadores, ingenieros, diseñadores, etc.
const serviciosProfesionalesQuestions = [
  {
    key:         'monthly_inquiries',
    label:       '¿Cuántas personas o empresas te contactan al mes preguntando por tus servicios?',
    required:    true,
    type:        'number',
    placeholder: 'Ej: 10'
  },
  {
    key:         'close_rate',
    label:       'De cada 10 personas que te consultan, ¿cuántas terminan contratándote?',
    required:    true,
    type:        'number',
    placeholder: 'Ej: 3 (es decir, cierras el 30%)'
  },
  {
    key:         'avg_ticket',
    label:       '¿Cuánto cobras en promedio por cada proyecto o servicio? (en pesos)',
    required:    true,
    type:        'number',
    placeholder: 'Ej: 500000'
  },
  {
    key:         'client_concentration',
    label:       '¿Tus 2 o 3 principales clientes representan más de la mitad de tus ingresos?',
    required:    true,
    type:        'select',
    options: [
      'Sí, casi todo depende de 1 o 2 clientes',
      'Sí, entre 2 y 3 clientes representan más del 50%',
      'Más o menos, tengo cierta diversificación',
      'No, tengo ingresos bien distribuidos entre varios clientes'
    ]
  },
  {
    key:         'collection_days',
    label:       '¿Cuántos días demoran tus clientes en pagarte después de emitir la boleta o factura?',
    required:    true,
    type:        'select',
    options: [
      'Me pagan el mismo día o antes de entregar',
      'Entre 1 y 15 días',
      'Entre 15 y 30 días',
      'Entre 30 y 60 días',
      'Más de 60 días (o a veces no pagan)'
    ]
  },
  {
    key:         'non_billable_hours',
    label:       '¿Cuántas horas a la semana dedicas a cosas que no te generan ingreso directo? (cotizaciones, reuniones de venta, administración)',
    required:    true,
    type:        'select',
    options: [
      'Menos de 5 horas (casi todo es trabajo facturable)',
      'Entre 5 y 10 horas',
      'Entre 10 y 20 horas',
      'Más de 20 horas (gran parte del tiempo es no productivo)'
    ]
  }
];

// ── Comercio / e-commerce ─────────────────────────────────────────────────────
// Aplica a: tiendas físicas, tiendas online, importadoras, distribuidoras, etc.
const comercioQuestions = [
  {
    key:         'avg_ticket',
    label:       '¿Cuánto gasta en promedio cada cliente en una compra? (en pesos)',
    required:    true,
    type:        'number',
    placeholder: 'Ej: 30000'
  },
  {
    key:         'repeat_rate',
    label:       'De cada 10 clientes que te compran, ¿cuántos vuelven a comprarte en los próximos 3 meses?',
    required:    true,
    type:        'select',
    options: [
      'Menos de 2 de cada 10 (la mayoría son clientes únicos)',
      'Entre 2 y 4 de cada 10',
      'Entre 4 y 6 de cada 10',
      'Más de 6 de cada 10 (tengo buena fidelización)'
    ]
  },
  {
    key:         'slow_stock',
    label:       '¿Tienes productos que llevan más de 3 meses sin venderse en tu bodega o tienda?',
    required:    true,
    type:        'select',
    options: [
      'No, todo lo que compro lo vendo rápido',
      'Sí, menos del 20% de mi inventario está parado',
      'Sí, entre el 20% y el 40% está parado',
      'Sí, más del 40% de mi inventario está parado'
    ]
  },
  {
    key:         'promo_sales_share',
    label:       '¿Qué porcentaje de tus ventas las haces con descuento o en oferta?',
    required:    true,
    type:        'select',
    options: [
      'Menos del 10% (casi nunca descuento)',
      'Entre 10% y 30%',
      'Entre 30% y 50%',
      'Más del 50% (la mayoría de mis ventas son con descuento)'
    ]
  },
  {
    key:         'main_sales_channel',
    label:       '¿Por dónde vendes más?',
    required:    true,
    type:        'select',
    options: [
      'Tienda física',
      'Tienda online propia (sitio web)',
      'Marketplace (MercadoLibre, Falabella.com, etc.)',
      'Redes sociales (Instagram, Facebook, WhatsApp)',
      'Vendedores o distribuidores'
    ]
  },
  {
    key:         'best_margin_product',
    label:       '¿Sabes cuál es el producto o línea que te deja más ganancia?',
    required:    true,
    type:        'select',
    options: [
      'Sí, lo tengo claro y lo priorizo',
      'Sí, lo sé pero no lo priorizo en mis ventas',
      'Tengo una idea aproximada pero no lo tengo calculado',
      'No lo sé con certeza'
    ]
  }
];

// ── Servicios en terreno ──────────────────────────────────────────────────────
// Aplica a: electricistas, gasfiteres, pintores, mantención, instaladores,
//           paisajistas, fumigadores, transporte menor, etc.
const serviciosTerrenoQuestions = [
  {
    key:         'avg_ticket',
    label:       '¿Cuánto cobras en promedio por cada trabajo o visita? (en pesos)',
    required:    true,
    type:        'number',
    placeholder: 'Ej: 80000'
  },
  {
    key:         'jobs_per_week',
    label:       '¿Cuántos trabajos realizas en una semana normal?',
    required:    true,
    type:        'number',
    placeholder: 'Ej: 8'
  },
  {
    key:         'client_acquisition_method',
    label:       '¿Cómo consigues la mayoría de tus clientes?',
    required:    true,
    type:        'select',
    options: [
      'Por recomendaciones de clientes anteriores (boca a boca)',
      'Por redes sociales o publicaciones propias',
      'Por avisos pagados (Google, Instagram, etc.)',
      'Tengo contratos fijos con empresas o clientes recurrentes',
      'Por plataformas de servicios (GetNinjas, Cronoshare, etc.)'
    ]
  },
  {
    key:         'repeat_rate',
    label:       'De cada 10 clientes, ¿cuántos te vuelven a contratar o te recomiendan?',
    required:    true,
    type:        'select',
    options: [
      'Menos de 2 de cada 10',
      'Entre 2 y 4 de cada 10',
      'Entre 4 y 7 de cada 10',
      'Más de 7 de cada 10 (tengo muchos clientes fieles)'
    ]
  },
  {
    key:         'response_time',
    label:       'Cuando alguien te pide cotización o servicio, ¿en cuánto tiempo respondes normalmente?',
    required:    true,
    type:        'select',
    options: [
      'En menos de 1 hora',
      'En el mismo día',
      'Al día siguiente',
      'Demoro 2 o más días en responder'
    ]
  },
  {
    key:         'management_control_system',
    label:       '¿Cómo llevas el registro de tus trabajos, cobros y gastos?',
    required:    true,
    type:        'select',
    options: [
      'No llevo registro formal',
      'En un cuaderno o notas del celular',
      'En Excel o Google Sheets',
      'Con un software o aplicación específica'
    ]
  },
  {
    key:         'main_cost',
    label:       '¿Cuál es tu mayor gasto operativo mensual?',
    required:    true,
    type:        'select',
    options: [
      'Personal / mano de obra',
      'Materiales o insumos',
      'Combustible y transporte',
      'Arriendo o bodega',
      'No tengo un gasto dominante claro'
    ]
  }
];

// ── Manufactura e industria ───────────────────────────────────────────────────
// Aplica a: metalmecánica, plásticos, alimentos procesados, textil, maderas,
//           imprentas, talleres de producción en serie, etc.
const manufacturaQuestions = [
  {
    key:         'capacity_utilization',
    label:       '¿Qué porcentaje de tu capacidad productiva (máquinas, planta, turnos) usas en un mes normal?',
    required:    true,
    type:        'select',
    options: [
      'Menos del 50% (tengo capacidad ociosa importante)',
      'Entre 50% y 75%',
      'Entre 75% y 90%',
      'Más del 90% (estoy al límite de mi capacidad)'
    ]
  },
  {
    key:         'main_client_type',
    label:       '¿A quién le vendes principalmente?',
    required:    true,
    type:        'select',
    options: [
      'A otras empresas (B2B) por pedido o contrato',
      'A distribuidores o retail',
      'Directo al público final',
      'A clientes en el extranjero (exportación)'
    ]
  },
  {
    key:         'rejection_rate',
    label:       '¿Qué porcentaje de tu producción se pierde por fallas, mermas o rechazos de calidad?',
    required:    true,
    type:        'select',
    options: [
      'Menos del 2% (tengo buen control de calidad)',
      'Entre 2% y 5%',
      'Entre 5% y 10%',
      'Más del 10% (es un problema relevante)'
    ]
  },
  {
    key:         'machinery_age',
    label:       '¿Qué tan antigua o al día está tu maquinaria/equipos principales?',
    required:    true,
    type:        'select',
    options: [
      'Nueva o renovada en los últimos 2-3 años',
      'Funcional pero con varios años de uso',
      'Antigua, requiere mantención frecuente',
      'Antigua y limita mi producción o calidad'
    ]
  },
  {
    key:         'key_person_dependency',
    label:       '¿Qué tan dependiente es tu producción de 1 o 2 personas clave (que si faltan, todo se atrasa)?',
    required:    true,
    type:        'select',
    options: [
      'Nada dependiente, cualquiera puede cubrir',
      'Algo dependiente, pero hay respaldo',
      'Bastante dependiente de 1 o 2 personas',
      'Muy dependiente — si faltan, se detiene la producción'
    ]
  },
  {
    key:         'order_lead_time',
    label:       '¿Cuánto tiempo pasa desde que recibes un pedido hasta que lo entregas?',
    required:    true,
    type:        'select',
    options: [
      'Menos de 1 semana',
      'Entre 1 y 4 semanas',
      'Entre 1 y 3 meses',
      'Más de 3 meses'
    ]
  }
];

// ── Bancos cortos para sectores que antes corrían solo con preguntas base ────
// Agregadas 2026-06-06: con apenas 2 leads reales en el sistema no se justifica
// escribir bancos de 6-7 preguntas como los de arriba — eso es trabajo a ciegas.
// En cambio, 2-3 preguntas por rubro, ancladas en datos reales del sector
// (ver fuentes en el commit), y TODAS opcionales (required:false): le pedimos
// al cliente una señal más sin forzarlo a inventar un número que no maneja.
// Si el dato no llega, el informe sigue funcionando con las 5 preguntas base.

// ── Construcción y obras ──────────────────────────────────────────────────────
// Fundamento: 28% de la concentración de morosidad nacional está en este rubro
// (pagos atrasados de mandantes), más alza de costos de materiales y escasez
// de mano de obra calificada — los 3 frenos más citados en 2025-2026.
const construccionQuestions = [
  {
    key:      'cost_overrun_frequency',
    label:    '¿Qué tan seguido un proyecto termina costando más de lo presupuestado al inicio?',
    required: false,
    type:     'select',
    options: [
      'Casi nunca — cumplimos el presupuesto',
      'A veces, por imprevistos puntuales',
      'Frecuentemente',
      'Casi siempre — es difícil cerrar dentro de lo presupuestado'
    ]
  },
  {
    key:      'client_payment_delay',
    label:    '¿Cuánto demoran tus clientes o mandantes en pagarte después de un estado de pago o entrega?',
    required: false,
    type:     'select',
    options: [
      'Me pagan dentro de 30 días',
      'Entre 30 y 60 días',
      'Entre 60 y 90 días',
      'Más de 90 días — es un problema recurrente para mi caja'
    ]
  },
  {
    key:      'skilled_labor_availability',
    label:    'Cuando necesitas contratar mano de obra calificada, ¿qué tan fácil es encontrarla?',
    required: false,
    type:     'select',
    options: [
      'Fácil, tengo una red de confianza',
      'Demoro pero la encuentro',
      'Me cuesta bastante encontrar gente calificada',
      'Muy difícil — esto frena directamente mis proyectos'
    ]
  }
];

// ── Gastronomía y alimentos ───────────────────────────────────────────────────
// Fundamento: presión de costos de insumos al alza y alta rotación de personal
// son los dos frenos más citados para restaurantes pyme en 2025.
const gastronomiaQuestions = [
  {
    key:      'input_cost_volatility',
    label:    '¿Qué tan seguido suben los precios de tus insumos principales (proveedores de alimentos o bebidas)?',
    required: false,
    type:     'select',
    options: [
      'Rara vez — tengo precios bastante estables',
      'Cada algunos meses',
      'Casi todos los meses',
      'Constantemente — me cuesta sostener mis márgenes'
    ]
  },
  {
    key:      'staff_turnover',
    label:    '¿Cuánto tiempo dura en promedio un trabajador en tu local antes de irse?',
    required: false,
    type:     'select',
    options: [
      'Más de 2 años',
      'Entre 1 y 2 años',
      'Entre 6 meses y 1 año',
      'Menos de 6 meses — la rotación es alta y me cuesta'
    ]
  },
  {
    key:      'best_margin_dish_known',
    label:    '¿Tienes claro qué plato o producto te deja más ganancia por unidad vendida?',
    required: false,
    type:     'select',
    options: [
      'Sí, lo tengo calculado y lo promuevo activamente',
      'Tengo una idea aproximada, pero no lo prioritizo',
      'No lo he calculado realmente'
    ]
  }
];

// ── Salud y belleza ───────────────────────────────────────────────────────────
// Fundamento: el sector está creciendo (+32% en reservas), el freno no es
// demanda sino gestión — desconocimiento de costos reales, falta de
// planificación comercial y dificultad para fidelizar (hallazgo 2026).
const saludBellezaQuestions = [
  {
    key:      'agenda_occupancy',
    label:    'En una semana normal, ¿qué tan llena está tu agenda de horas o citas?',
    required: false,
    type:     'select',
    options: [
      'Casi siempre llena, incluso tengo lista de espera',
      'Mayormente llena, con algunos espacios libres',
      'Como la mitad ocupada',
      'Tengo bastantes horas libres sin reservar'
    ]
  },
  {
    key:      'client_loyalty_system',
    label:    '¿Tienes alguna forma de hacer que tus clientes vuelvan o te recomienden (seguimiento, promociones, programa de fidelización)?',
    required: false,
    type:     'select',
    options: [
      'Sí, tengo un sistema que funciona bien',
      'Hago algo, pero de forma informal',
      'No tengo nada definido para esto'
    ]
  },
  {
    key:      'service_cost_awareness',
    label:    '¿Sabes cuánto te cuesta realmente cada servicio o tratamiento que ofreces (insumos + tiempo + otros gastos)?',
    required: false,
    type:     'select',
    options: [
      'Sí, lo tengo calculado servicio por servicio',
      'Tengo una idea aproximada',
      'No lo he calculado realmente'
    ]
  }
];

// ── Tecnología y software ─────────────────────────────────────────────────────
// Fundamento: déficit estimado de ~6.000 profesionales TI al año en Chile —
// la retención de talento técnico y la dependencia de pocas personas clave
// son el cuello de botella más citado para 2025-2026.
const tecnologiaQuestions = [
  {
    key:      'key_person_dependency',
    label:    '¿Qué tan dependiente es tu empresa de 1 o 2 personas técnicas clave (que si se van, sería un problema serio)?',
    required: false,
    type:     'select',
    options: [
      'Nada dependiente, cualquiera puede cubrir',
      'Algo dependiente, pero hay respaldo',
      'Bastante dependiente de 1 o 2 personas',
      'Muy dependiente — si se van, frenamos proyectos'
    ]
  },
  {
    key:      'revenue_recurrence',
    label:    '¿Tus ingresos vienen principalmente de proyectos puntuales o de contratos recurrentes (mensualidades, soporte, licencias)?',
    required: false,
    type:     'select',
    options: [
      'Casi todo es recurrente — ingreso predecible',
      'Una mezcla de ambos',
      'Casi todo son proyectos puntuales — ingreso variable mes a mes'
    ]
  },
  {
    key:      'tech_talent_availability',
    label:    'Cuando necesitas contratar o reemplazar personal técnico calificado, ¿qué tan fácil te resulta?',
    required: false,
    type:     'select',
    options: [
      'Fácil, tengo buena red o flujo de candidatos',
      'Demoro pero encuentro a quien necesito',
      'Me cuesta bastante encontrar a la persona indicada',
      'Muy difícil — esto frena directamente mi crecimiento'
    ]
  }
];

// ── Educación y capacitación ──────────────────────────────────────────────────
// Fundamento: deserción de ~23-24% en educación superior y cerca de 30% de
// ausentismo severo reportado en 2025 — retención/finalización es el dato
// que más impacta a un instituto o academia pyme.
const educacionQuestions = [
  {
    key:      'completion_rate',
    label:    'De los alumnos que se inscriben en tus cursos o programas, ¿cuántos terminan completándolos?',
    required: false,
    type:     'select',
    options: [
      'Casi todos (más del 80%)',
      'La mayoría (entre 60% y 80%)',
      'Como la mitad',
      'Menos de la mitad — la deserción es un problema para mí'
    ]
  },
  {
    key:      'acquisition_channel',
    label:    '¿Cómo consigues la mayoría de tus nuevos alumnos o clientes?',
    required: false,
    type:     'select',
    options: [
      'Recomendaciones de alumnos anteriores (boca a boca)',
      'Redes sociales o publicidad propia',
      'Convenios con empresas o instituciones',
      'Plataformas o portales externos'
    ]
  },
  {
    key:      'repeat_enrollment',
    label:    'De tus alumnos, ¿cuántos vuelven a inscribirse en otro curso o te recomiendan a otros?',
    required: false,
    type:     'select',
    options: [
      'Menos de 2 de cada 10',
      'Entre 2 y 4 de cada 10',
      'Entre 4 y 7 de cada 10',
      'Más de 7 de cada 10 — tengo buena fidelización'
    ]
  }
];

// ── Otro rubro ────────────────────────────────────────────────────────────────
// No hay un sector específico que investigar — son 2 preguntas universales
// de diagnóstico de riesgo operativo, no relleno genérico. Ambas opcionales.
const otroQuestions = [
  {
    key:      'income_predictability',
    label:    '¿Qué tan predecibles son tus ingresos de un mes a otro?',
    required: false,
    type:     'select',
    options: [
      'Muy predecibles, varían poco',
      'Algo variables, pero dentro de un rango que conozco',
      'Bastante variables — me cuesta proyectar',
      'Muy impredecibles — cada mes es distinto'
    ]
  },
  {
    key:      'key_person_dependency_general',
    label:    '¿Qué tan dependiente es tu negocio de ti o de 1-2 personas clave para funcionar día a día?',
    required: false,
    type:     'select',
    options: [
      'Poco dependiente, el equipo funciona sin mí',
      'Algo dependiente, pero hay respaldo',
      'Bastante dependiente — si falto, se nota',
      'Muy dependiente — si falto, se detiene casi todo'
    ]
  }
];

// ── Exportar cuestionarios por sector ────────────────────────────────────────
export const questionnaires = {
  servicios_profesionales: [...baseQuestions, ...serviciosProfesionalesQuestions],
  comercio_ecommerce:      [...baseQuestions, ...comercioQuestions],
  servicios_terreno:       [...baseQuestions, ...serviciosTerrenoQuestions],
  manufactura:             [...baseQuestions, ...manufacturaQuestions],
  construccion:            [...baseQuestions, ...construccionQuestions],
  gastronomia:             [...baseQuestions, ...gastronomiaQuestions],
  salud_belleza:           [...baseQuestions, ...saludBellezaQuestions],
  tecnologia:              [...baseQuestions, ...tecnologiaQuestions],
  educacion:               [...baseQuestions, ...educacionQuestions],
  otro:                    [...baseQuestions, ...otroQuestions]
};
