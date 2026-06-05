/**
 * Traduce las claves técnicas del cuestionario a etiquetas legibles para el prompt de Claude.
 * Actualizar cada vez que se modifique questions.js.
 */
export const QUESTION_LABELS = {
  // Base (todos los sectores)
  q_monthly_sales:         'Ventas mensuales (CLP)',
  q_margin:                'Ganancia por cada $100 vendidos (%)',
  q_active_clients:        'Clientes activos',
  q_main_problem:          'Principal problema del negocio',
  q_business_description:  'Descripción del negocio',

  // Servicios profesionales
  monthly_inquiries:       'Consultas o contactos al mes',
  close_rate:              'De cada 10 consultas, cuántas cierran',
  avg_ticket:              'Cobro promedio por trabajo/proyecto (CLP)',
  client_concentration:    'Concentración en pocos clientes',
  collection_days:         'Días para cobrar',
  non_billable_hours:      'Horas semanales no productivas',

  // Comercio
  repeat_rate:             'Clientes que vuelven a comprar',
  slow_stock:              'Inventario parado o sin rotación',
  promo_sales_share:       'Ventas con descuento o promoción',
  main_sales_channel:      'Canal de ventas principal',
  best_margin_product:     'Claridad sobre producto más rentable',

  // Servicios en terreno
  jobs_per_week:           'Trabajos realizados por semana',
  client_acquisition_method: 'Cómo consigue clientes',
  response_time:           'Tiempo de respuesta a solicitudes',
  management_control_system: 'Sistema de registro y control',
  main_cost:               'Principal gasto operativo mensual'
};
