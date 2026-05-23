import { readFile } from 'fs/promises';
import path from 'path';
import { getStore } from '@netlify/blobs';

const TEMPLATE_PATH = path.join(process.cwd(), 'templates', 'diagnostic-report-enhanced.html');

const AXIS_LABELS = { caja: 'Caja', comercial: 'Comercial', estructura: 'Estructura' };

const SECTOR_BENCHMARKS = {
  tecnologia: {
    avg_margin: 32,
    avg_revenue: 12000000,
    avg_clients: 8,
    churn_rate: 15
  },
  comercio_ecommerce: {
    avg_margin: 25,
    avg_revenue: 8000000,
    avg_clients: 150,
    churn_rate: 20
  },
  gastronomia: {
    avg_margin: 30,
    avg_revenue: 6000000,
    avg_clients: 200,
    churn_rate: 25
  },
  servicios_profesionales: {
    avg_margin: 35,
    avg_revenue: 10000000,
    avg_clients: 20,
    churn_rate: 10
  },
  default: {
    avg_margin: 28,
    avg_revenue: 8000000,
    avg_clients: 50,
    churn_rate: 18
  }
};

function getSectorBenchmark(sector) {
  return SECTOR_BENCHMARKS[sector] || SECTOR_BENCHMARKS.default;
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' });
}

function currency(value) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency', currency: 'CLP', maximumFractionDigits: 0
  }).format(Number(value || 0));
}

function percentage(value) {
  return (Number(value) || 0).toFixed(1) + '%';
}

function createBarChart(label, current, benchmark, maxWidth = 300) {
  const ratio = Math.min(current / benchmark, 1.5);
  const width = Math.round(ratio * maxWidth);
  const color = current >= benchmark ? '#27AE60' : '#E67E22';

  return `
    <div style="margin-bottom: 15px;">
      <div style="font-size: 12px; font-weight: 600; color: #2C3E50; margin-bottom: 5px;">
        ${label}: <strong>${percentage(current)}</strong> (Sector: ${percentage(benchmark)})
      </div>
      <div style="background: #f0f0f0; border-radius: 3px; height: 20px; overflow: hidden;">
        <div style="background: ${color}; height: 100%; width: ${width}px; transition: width 0.3s;"></div>
      </div>
    </div>
  `;
}

function analyzePerformance(caseData, benchmark) {
  const margin = Number(caseData.profit_margin) || 0;
  const sales = Number(caseData.monthly_sales) || 0;
  const clients = Number(caseData.active_clients) || 0;

  let analysis = [];

  if (margin < benchmark.avg_margin) {
    const diff = benchmark.avg_margin - margin;
    analysis.push(`Margen ${diff}pp bajo vs. sector: oportunidad de optimización de costos`);
  }

  if (sales < benchmark.avg_revenue * 0.7) {
    analysis.push(`Ingresos mensuales ${(benchmark.avg_revenue / sales).toFixed(1)}x por debajo de la media: potencial de crecimiento`);
  }

  if (clients < benchmark.avg_clients) {
    analysis.push(`Cartera de clientes más concentrada: riesgo de dependencia`);
  }

  return analysis;
}

function fillTemplate(html, data) {
  let out = html;
  for (const [k, v] of Object.entries(data)) {
    out = out.replaceAll(`{{${k}}}`, v ?? '—');
  }
  return out;
}

function calculateBenchmarkMetrics(caseData, benchmark) {
  const margin = Number(caseData.profit_margin) || 0;
  const revenue = Number(caseData.monthly_sales) || 0;
  const clients = Number(caseData.active_clients) || 0;

  // Margin comparison
  const marginDiff = margin - benchmark.avg_margin;
  const marginVsBenchmark = marginDiff > 0
    ? `+${marginDiff.toFixed(1)}pp`
    : `${marginDiff.toFixed(1)}pp`;

  // Revenue position
  const revenueRatio = revenue / benchmark.avg_revenue;
  let revenuePosition = 'Por debajo del promedio';
  if (revenueRatio >= 1) {
    revenuePosition = 'Por encima del promedio';
  } else if (revenueRatio >= 0.7) {
    revenuePosition = 'Cercano al promedio';
  }
  const revenueBarWidth = Math.round(Math.min(revenueRatio, 1.5) * 300);

  // Client concentration analysis
  const clientsRatio = clients / benchmark.avg_clients;
  let concentration = 'Cartera diversificada';
  if (clientsRatio < 0.5) {
    concentration = 'Altamente concentrada';
  } else if (clientsRatio < 0.8) {
    concentration = 'Moderadamente concentrada';
  }
  const clientsBarWidth = Math.round(Math.min(clientsRatio, 1.5) * 300);

  return {
    marginVsBenchmark,
    revenuePosition,
    revenueBarWidth,
    concentration,
    clientsBarWidth
  };
}

export default async (event, context) => {
  console.log('=== Enhanced Report Generator START ===');

  try {
    let caseData;
    const { orderId } = event.body ? JSON.parse(event.body) : event;

    if (!orderId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing orderId' })
      };
    }

    const store = getStore('cases');
    caseData = await store.getJSON(orderId);

    if (!caseData) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Case not found' })
      };
    }

    console.log('Case data retrieved:', orderId);

    const template = await readFile(TEMPLATE_PATH, 'utf-8');
    const benchmark = getSectorBenchmark(caseData.sector);
    const performance = analyzePerformance(caseData, benchmark);
    const metrics = calculateBenchmarkMetrics(caseData, benchmark);

    const reportData = {
      company: caseData.company,
      name: caseData.name,
      email: caseData.email,
      sector_label: caseData.sector,
      plan_label: caseData.plan === 'premium' ? 'PREMIUM' : 'BÁSICO',
      date: formatDate(new Date()),
      lead_id: orderId,

      monthly_sales: currency(caseData.monthly_sales),
      margin: caseData.profit_margin || '—',
      active_clients: caseData.active_clients || '—',
      phone: caseData.phone || '—',

      // Benchmark data
      benchmark_margin: benchmark.avg_margin,
      benchmark_revenue: currency(benchmark.avg_revenue),
      benchmark_clients: benchmark.avg_clients,
      benchmark_churn: benchmark.churn_rate,

      // Benchmark metrics for comparison page
      margin_vs_benchmark: metrics.marginVsBenchmark,
      revenue_position: metrics.revenuePosition,
      revenue_bar_width: metrics.revenueBarWidth,
      clients_concentration: metrics.concentration,
      clients_bar_width: metrics.clientsBarWidth,

      // Performance analysis
      performance_analysis: performance.join('<br>• '),

      // Charts (SVG inline)
      margin_chart: createBarChart('Margen de Ganancia', caseData.profit_margin || 0, benchmark.avg_margin),

      // Placeholder fields for opportunity sections (will be filled by advisor)
      opp1_title: 'Optimización de Costos Operativos',
      opp1_axis: 'Estructura',
      opp1_term: 'Corto plazo',
      opp1_finding: 'Se identifican oportunidades de mejora en la estructura de costos identificadas en el análisis comparativo sector.',
      opp1_action: 'Revisar gastos operativos y procesos; identificar redundancias.',
      opp1_impact: 'Alto',
      opp1_kpi: 'Margen +3-5pp',
      opp1_intervention: 'Media',

      opp2_title: 'Expansión Comercial Enfocada',
      opp2_axis: 'Comercial',
      opp2_term: 'Mediano plazo',
      opp2_finding: 'Los ingresos están por debajo del promedio sector; existe potencial de crecimiento mediante estrategia comercial.',
      opp2_action: 'Desarrollar estrategia de captación; definir segmentos objetivo.',
      opp2_impact: 'Alto',
      opp2_kpi: 'Ingresos +15-25%',
      opp2_intervention: 'Media',

      opp3_title: 'Diversificación de Cartera',
      opp3_axis: 'Caja',
      opp3_term: 'Largo plazo',
      opp3_finding: 'La concentración de clientes presenta riesgo; diversificación mejoraría estabilidad.',
      opp3_action: 'Crear plan de captación de nuevos clientes; reducir dependencia.',
      opp3_impact: 'Medio',
      opp3_kpi: 'Clientes +30-50%',
      opp3_intervention: 'Media-Alta',

      // Plan fields (placeholders)
      plan_30: 'Audit de costos, identificar oportunidades rápidas. Iniciar estrategia comercial. Definir KPIs.',
      plan_60: 'Implementar mejoras de costo. Ejecutar primeras acciones comerciales. Validar resultados.',
      plan_90: 'Consolidar cambios. Evaluar ROI de iniciativas. Ajustar estrategia según resultados.',

      // Additional fields
      main_problem: caseData.main_problem || '—',
      goal_6m: caseData.goal_6m || '—',
      summary: `${caseData.company} es una empresa de sector ${caseData.sector} con ingresos mensuales de ${currency(caseData.monthly_sales)} y margen estimado de ${caseData.profit_margin}%. El análisis comparativo con el sector identifica oportunidades clave de mejora en eficiencia operativa y crecimiento rentable.`
    };

    const html = fillTemplate(template, reportData);

    // En Netlify, devolver HTML que Puppeteer convertirá a PDF
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
      body: html
    };

  } catch (error) {
    console.error('Report Generation Error:', {
      message: error.message,
      stack: error.stack
    });

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error while generating report',
        message: error.message
      })
    };
  }
};
