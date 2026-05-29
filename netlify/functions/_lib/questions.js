export const sectorLabels = {
  servicios_profesionales: 'Servicios profesionales',
  comercio_ecommerce: 'Comercio / e-commerce',
  servicios_terreno: 'Servicios en terreno'
};

// Preguntas de contexto financiero comunes a todos los sectores (van primero)
const financialContext = [
  {
    key: 'q_monthly_sales',
    label: 'Ventas mensuales promedio (CLP)',
    required: true,
    type: 'number',
    placeholder: 'Ej: 5000000'
  },
  {
    key: 'q_margin',
    label: 'Margen estimado de ganancia (%)',
    required: true,
    type: 'number',
    placeholder: 'Ej: 25'
  },
  {
    key: 'q_active_clients',
    label: 'Numero de clientes activos',
    required: true,
    type: 'number',
    placeholder: 'Ej: 20'
  },
  {
    key: 'q_main_problem',
    label: 'Principal desafio o problema del negocio hoy',
    required: true,
    type: 'text',
    placeholder: 'Ej: Me cuesta conseguir clientes nuevos y los costos han subido mucho'
  }
];

export const questionnaires = {
  servicios_profesionales: [
    ...financialContext,
    { key: 'monthly_leads', label: 'Leads mensuales', required: true },
    { key: 'close_rate', label: 'Tasa de cierre estimada (%)', required: true },
    { key: 'avg_ticket', label: 'Ticket promedio (CLP)', required: true },
    { key: 'top3_revenue_share', label: 'Participacion de ingresos top 3 clientes (%)', required: true },
    { key: 'non_billable_hours', label: 'Horas no facturables al mes', required: true },
    { key: 'collection_days', label: 'Dias promedio de cobro', required: true }
  ],
  comercio_ecommerce: [
    ...financialContext,
    { key: 'avg_ticket', label: 'Ticket promedio (CLP)', required: true },
    { key: 'repeat_rate', label: 'Tasa de recompra estimada (%)', required: true },
    { key: 'best_margin_product_share', label: 'Participacion del producto mas rentable (%)', required: true },
    { key: 'slow_stock_share', label: 'Stock lento sobre inventario total (%)', required: true },
    { key: 'delivery_days', label: 'Días promedio de entrega', required: true },
    { key: 'promo_sales_share', label: 'Ventas con promoción (%)', required: true }
  ],
  servicios_terreno: [
    ...financialContext,
    // OPERACIONALES
    { key: 'jobs_per_day', label: 'Trabajos por día', required: true },
    { key: 'idle_time_hours', label: 'Horas muertas por día', required: true },
    { key: 'fuel_cost_monthly', label: 'Gasto mensual de combustible (CLP)', required: true },
    { key: 'repeat_rate', label: 'Tasa de repetición de clientes (%)', required: true },
    { key: 'response_time_hours', label: 'Tiempo de respuesta promedio (horas)', required: true },
    { key: 'quote_acceptance_rate', label: 'Presupuestos aceptados (%)', required: true },
    
    // FASE 1 - CRÍTICAS (2 preguntas) 🚨
    { 
      key: 'client_acquisition_method', 
      label: '¿Cómo llegan la mayoría de tus clientes?', 
      required: true,
      type: 'select',
      options: [
        'Principalmente por referidos/recomendaciones',
        'Marketing activo (anuncios, redes sociales)',
        'Mix balanceado (50/50)',
        'Base de clientes antiguos/recurrentes',
        'Licitaciones/contratos'
      ]
    },
    { 
      key: 'fuel_purchase_structure', 
      label: '¿Cómo compras el combustible?', 
      required: true,
      type: 'select',
      options: [
        'En bomba/estación de servicio (precio público)',
        'Contrato con distribuidor (precio preferencial)',
        'Mix (algunos vehículos con contrato, otros en bomba)',
        'Tarjetas corporativas con descuento'
      ]
    },
    
    // FASE 2 - IMPORTANTES (2 preguntas) 🟡
    { 
      key: 'return_trip_utilization', 
      label: '¿Los viajes de vuelta van cargados o vacíos?', 
      required: true,
      type: 'select',
      options: [
        'Siempre vacíos (100% de los retornos)',
        'Generalmente vacíos (más del 70%)',
        'Mix (50% cargados, 50% vacíos)',
        'Generalmente cargados (más del 70%)',
        'Casi siempre cargados (más del 90%)'
      ]
    },
    { 
      key: 'management_control_system', 
      label: '¿Cómo llevas el control de tus operaciones?', 
      required: true,
      type: 'select',
      options: [
        'No llevo control formal',
        'Excel/Google Sheets',
        'Software especializado de transporte',
        'Software de gestión general (ERP)',
        'Sistema propio/desarrollado internamente'
      ]
    },
    
    // FASE 3 - ÚTILES (3 preguntas) 🟢
    { 
      key: 'avg_cost_per_trip', 
      label: 'Costo promedio por viaje (CLP) - estimado', 
      required: false,
      type: 'number',
      placeholder: 'Ej: 150000'
    },
    { 
      key: 'client_mix', 
      label: '¿Qué porcentaje de tus ingresos viene de contratos fijos vs. servicios puntuales?', 
      required: false,
      type: 'select',
      options: [
        'Más del 80% contratos fijos',
        'Más del 60% contratos fijos',
        'Mix balanceado (50/50)',
        'Más del 60% servicios puntuales',
        'Más del 80% servicios puntuales'
      ]
    },
    { 
      key: 'tax_advisor_name', 
      label: 'Nombre del Contador o Asesor Tributario (Opcional)', 
      required: false,
      type: 'text',
      placeholder: 'Ej: Juan García, Gestoría XYZ'
    }
  ]
};
