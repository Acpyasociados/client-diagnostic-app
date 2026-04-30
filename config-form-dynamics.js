/**
 * CONFIGURACIÓN DINÁMICA DEL FORMULARIO DE DIAGNÓSTICO ACP
 * Mapea rubros a campos operacionales específicos
 */

const OPERATIONAL_FIELDS_MAP = {
  servicios_profesionales: [
    {
      key: 'billable_rate',
      label: 'Tarifa horaria facturada (CLP)',
      type: 'number',
      required: true,
      placeholder: 'Ej: 75000'
    },
    {
      key: 'team_size',
      label: 'Tamaño del equipo (personas)',
      type: 'number',
      required: true,
      placeholder: 'Ej: 5'
    }
  ],
  comercio_ecommerce: [
    {
      key: 'inventory_value',
      label: 'Valor total de inventario (CLP)',
      type: 'number',
      required: true,
      placeholder: 'Ej: 5000000'
    },
    {
      key: 'inventory_turnover_days',
      label: 'Rotación de inventario (días)',
      type: 'number',
      required: true,
      placeholder: 'Ej: 30'
    }
  ],
  servicios_terreno: [
    {
      key: 'fuel_consumption',
      label: 'Consumo mensual de combustible (litros)',
      type: 'number',
      required: true,
      placeholder: 'Ej: 500'
    },
    {
      key: 'fleet_size',
      label: 'Tamaño de flota (vehículos)',
      type: 'number',
      required: true,
      placeholder: 'Ej: 3'
    }
  ],
  construccion: [
    {
      key: 'active_projects',
      label: 'Proyectos activos simultáneos',
      type: 'number',
      required: true,
      placeholder: 'Ej: 2'
    },
    {
      key: 'avg_project_cost',
      label: 'Costo promedio por proyecto (CLP)',
      type: 'number',
      required: true,
      placeholder: 'Ej: 10000000'
    }
  ],
  gastronomia: [
    {
      key: 'covers_daily',
      label: 'Covers diarios promedio',
      type: 'number',
      required: true,
      placeholder: 'Ej: 50'
    },
    {
      key: 'avg_check',
      label: 'Ticket promedio (CLP)',
      type: 'number',
      required: true,
      placeholder: 'Ej: 25000'
    }
  ],
  salud_belleza: [
    {
      key: 'appointments_daily',
      label: 'Citas diarias promedio',
      type: 'number',
      required: true,
      placeholder: 'Ej: 15'
    },
    {
      key: 'services_offered',
      label: 'Cantidad de servicios distintos',
      type: 'number',
      required: true,
      placeholder: 'Ej: 8'
    }
  ],
  tecnologia: [
    {
      key: 'dev_team_size',
      label: 'Tamaño del equipo de desarrollo',
      type: 'number',
      required: true,
      placeholder: 'Ej: 5'
    },
    {
      key: 'saas_mrr',
      label: 'MRR - Ingresos recurrentes mensuales (CLP)',
      type: 'number',
      required: false,
      placeholder: 'Ej: 500000 (opcional)'
    }
  ],
  educacion: [
    {
      key: 'students_count',
      label: 'Cantidad de estudiantes',
      type: 'number',
      required: true,
      placeholder: 'Ej: 100'
    },
    {
      key: 'instructors_count',
      label: 'Cantidad de instructores',
      type: 'number',
      required: true,
      placeholder: 'Ej: 5'
    }
  ],
  manufactura: [
    {
      key: 'production_capacity',
      label: 'Capacidad de producción mensual (unidades)',
      type: 'number',
      required: true,
      placeholder: 'Ej: 1000'
    },
    {
      key: 'raw_material_cost_percent',
      label: 'Costo de materia prima (% de COGS)',
      type: 'number',
      required: true,
      placeholder: 'Ej: 35'
    }
  ]
};

const ADVISOR_TYPES = [
  { value: 'contador_independiente', label: 'Contador Independiente' },
  { value: 'asesor_tributario', label: 'Asesor Tributario - Planificación Financiera' },
  { value: 'empresa_contable', label: 'Empresa Contable' }
];

const CHALLENGE_OPTIONS = [
  { value: 'costos_altos', label: 'Costos operativos muy altos' },
  { value: 'margen_bajo', label: 'Margen de ganancia bajo' },
  { value: 'falta_clientes', label: 'Falta de nuevos clientes' },
  { value: 'control_gestion', label: 'Falta de control de gestión' },
  { value: 'impuestos_altos', label: 'Impuestos elevados' },
  { value: 'flujo_caja', label: 'Problemas de flujo de caja' },
  { value: 'crecimiento', label: 'Dificultad para crecer' },
  { value: 'otro', label: 'Otro (especificar)' }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    OPERATIONAL_FIELDS_MAP,
    ADVISOR_TYPES,
    CHALLENGE_OPTIONS
  };
}
