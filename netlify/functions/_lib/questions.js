export const sectorLabels = {
  servicios_profesionales: 'Servicios profesionales',
  comercio_ecommerce: 'Comercio / e-commerce',
  servicios_terreno: 'Servicios en terreno'
};

export const questionnaires = {
  servicios_profesionales: [
    { key: 'monthly_leads', label: 'Leads mensuales', required: true },
    { key: 'close_rate', label: 'Tasa de cierre estimada (%)', required: true },
    { key: 'avg_ticket', label: 'Ticket promedio (CLP)', required: true },
    { key: 'top3_revenue_share', label: 'Participación de ingresos top 3 clientes (%)', required: true },
    { key: 'non_billable_hours', label: 'Horas no facturadas al mes', required: true },
    { key: 'collection_days', label: 'Días promedio de cobro', required: true }
  ],
  comercio_ecommerce: [
    { key: 'avg_ticket', label: 'Ticket promedio (CLP)', required: true },
    { key: 'repeat_rate', label: 'Tasa de recompra estimada (%)', required: true },
    { key: 'best_margin_product_share', label: 'Participación del producto más rentable (%)', required: true },
    { key: 'slow_stock_share', label: 'Stock lento sobre inventario total (%)', required: true },
    { key: 'delivery_days', label: 'Días promedio de entrega', required: true },
    { key: 'promo_sales_share', label: 'Ventas con promoción (%)', required: true }
  ],
  servicios_terreno: [
    { key: 'jobs_per_day', label: 'Trabajos por día', required: true },
    { key: 'idle_time_hours', label: 'Horas muertas por día', required: true },
    { key: 'fuel_cost_monthly', label: 'Costo mensual de combustible (CLP)', required: true },
    { key: 'repeat_rate', label: 'Tasa de repetición de clientes (%)', required: true },
    { key: 'response_time_hours', label: 'Tiempo de respuesta promedio (horas)', required: true },
    { key: 'quote_acceptance_rate', label: 'Presupuestos aceptados (%)', required: true }
  ]
};
