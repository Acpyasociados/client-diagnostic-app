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
  main_cost:               'Principal gasto operativo mensual',

  // Manufactura e industria (faltaban — agregadas 2026-06-06 junto al fix
  // del cuestionario vacío; sin esto la IA recibía claves crudas sin traducir)
  capacity_utilization:    'Uso de capacidad productiva',
  main_client_type:        'A quién le vende principalmente',
  rejection_rate:          'Porcentaje de producción perdida por fallas/mermas',
  machinery_age:           'Antigüedad y estado de la maquinaria',
  key_person_dependency:   'Dependencia de personas clave en producción',
  order_lead_time:         'Tiempo entre pedido y entrega',

  // Construcción y obras
  cost_overrun_frequency:  'Frecuencia de sobrecostos vs. presupuesto',
  client_payment_delay:    'Demora de mandantes en pagar',
  skilled_labor_availability: 'Disponibilidad de mano de obra calificada',

  // Gastronomía y alimentos
  input_cost_volatility:   'Variabilidad de precios de insumos',
  staff_turnover:          'Permanencia promedio del personal',
  best_margin_dish_known:  'Claridad sobre plato/producto más rentable',

  // Salud y belleza
  agenda_occupancy:        'Ocupación de agenda semanal',
  client_loyalty_system:   'Sistema de fidelización de clientes',
  service_cost_awareness:  'Conocimiento del costo real por servicio',

  // Tecnología y software
  revenue_recurrence:      'Ingresos recurrentes vs. proyectos puntuales',
  tech_talent_availability: 'Facilidad para contratar personal técnico',

  // Educación y capacitación
  completion_rate:         'Tasa de finalización de cursos/programas',
  acquisition_channel:     'Cómo consigue nuevos alumnos',
  repeat_enrollment:       'Alumnos que repiten o recomiendan',

  // Otro rubro
  income_predictability:   'Predictibilidad de ingresos mes a mes',
  key_person_dependency_general: 'Dependencia del negocio de 1-2 personas clave'
};
