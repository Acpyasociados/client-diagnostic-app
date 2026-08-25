/**
 * Función para generar PDFs de muestra para todos los 10 sectores
 * Uso local: node generate-sample-reports.js
 * O via Netlify: POST /.netlify/functions/generate-sample-reports
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const SECTOR_DATA = {
  servicios_profesionales: {
    company: 'Silva & Asociados - Asesoría Legal',
    name: 'Jorge Silva Morales',
    email: 'jorge@silvaasociados.cl',
    phone: '+56 9 3245 6789',
    sector_label: 'Servicios Profesionales',
    plan_label: 'PREMIUM',
    monthly_sales: '$8.500.000',
    margin: 42,
    active_clients: 28,
    benchmark_margin: 35,
    benchmark_revenue: '$10.000.000',
    benchmark_clients: 20,
    benchmark_churn: '10%',
  },
  comercio_ecommerce: {
    company: 'TiendaMax - E-commerce',
    name: 'María García López',
    email: 'maria@tiendamax.cl',
    phone: '+56 9 2134 5678',
    sector_label: 'Comercio / E-commerce',
    plan_label: 'PREMIUM',
    monthly_sales: '$12.000.000',
    margin: 24,
    active_clients: 1250,
    benchmark_margin: 25,
    benchmark_revenue: '$8.000.000',
    benchmark_clients: 150,
    benchmark_churn: '20%',
  },
  servicios_terreno: {
    company: 'TecnoServicios Field',
    name: 'Roberto Pérez Delgado',
    email: 'roberto@tecnoservicios.cl',
    phone: '+56 9 4567 8901',
    sector_label: 'Servicios de Terreno',
    plan_label: 'BÁSICO',
    monthly_sales: '$5.200.000',
    margin: 28,
    active_clients: 45,
    benchmark_margin: 26,
    benchmark_revenue: '$6.500.000',
    benchmark_clients: 38,
    benchmark_churn: '18%',
  },
  construccion: {
    company: 'Constructora Regional',
    name: 'Felipe Ramírez Contreras',
    email: 'felipe@constructoraregional.cl',
    phone: '+56 9 5678 9012',
    sector_label: 'Construcción',
    plan_label: 'PREMIUM',
    monthly_sales: '$18.500.000',
    margin: 22,
    active_clients: 12,
    benchmark_margin: 20,
    benchmark_revenue: '$15.000.000',
    benchmark_clients: 8,
    benchmark_churn: '8%',
  },
  gastronomia: {
    company: 'Grupo Gastronómico Valle Central',
    name: 'Alejandra Mendez Soto',
    email: 'alejandra@gastronomiavalle.cl',
    phone: '+56 9 6789 0123',
    sector_label: 'Gastronomía',
    plan_label: 'BÁSICO',
    monthly_sales: '$6.800.000',
    margin: 29,
    active_clients: 180,
    benchmark_margin: 30,
    benchmark_revenue: '$6.000.000',
    benchmark_clients: 200,
    benchmark_churn: '25%',
  },
  salud_belleza: {
    company: 'Centros Wellness Pro',
    name: 'Catalina Valencia Moreno',
    email: 'catalina@wellnesspro.cl',
    phone: '+56 9 7890 1234',
    sector_label: 'Salud & Belleza',
    plan_label: 'PREMIUM',
    monthly_sales: '$4.500.000',
    margin: 35,
    active_clients: 420,
    benchmark_margin: 32,
    benchmark_revenue: '$5.500.000',
    benchmark_clients: 350,
    benchmark_churn: '22%',
  },
  tecnologia: {
    company: 'TechSolutions Inc.',
    name: 'Juan Pérez Díaz',
    email: 'juan@techsolutions.cl',
    phone: '+56 9 8901 2345',
    sector_label: 'Tecnología',
    plan_label: 'PREMIUM',
    monthly_sales: '$15.000.000',
    margin: 38,
    active_clients: 12,
    benchmark_margin: 32,
    benchmark_revenue: '$12.000.000',
    benchmark_clients: 8,
    benchmark_churn: '15%',
  },
  educacion: {
    company: 'Academia Integral Learning',
    name: 'Patricio Morales Gómez',
    email: 'patricio@academiaintegral.cl',
    phone: '+56 9 9012 3456',
    sector_label: 'Educación',
    plan_label: 'BÁSICO',
    monthly_sales: '$7.200.000',
    margin: 31,
    active_clients: 520,
    benchmark_margin: 28,
    benchmark_revenue: '$8.000.000',
    benchmark_clients: 480,
    benchmark_churn: '12%',
  },
  manufactura: {
    company: 'Industrias Metal Precisión',
    name: 'Carlos Rodríguez Hernández',
    email: 'carlos@metaleprecision.cl',
    phone: '+56 9 1234 5678',
    sector_label: 'Manufactura',
    plan_label: 'PREMIUM',
    monthly_sales: '$22.000.000',
    margin: 18,
    active_clients: 8,
    benchmark_margin: 17,
    benchmark_revenue: '$20.000.000',
    benchmark_clients: 6,
    benchmark_churn: '5%',
  },
  otro: {
    company: 'Negocios Diversos SPA',
    name: 'Patricia Díaz López',
    email: 'patricia@negociosdiversos.cl',
    phone: '+56 9 2345 6789',
    sector_label: 'Otros Sectores',
    plan_label: 'BÁSICO',
    monthly_sales: '$8.000.000',
    margin: 28,
    active_clients: 35,
    benchmark_margin: 27,
    benchmark_revenue: '$7.500.000',
    benchmark_clients: 30,
    benchmark_churn: '14%',
  }
};

function generateSvgChart(current, benchmark, maxWidth = 200) {
  const percentage = Math.min((current / benchmark) * 100, 100);
  const width = Math.round((percentage / 100) * maxWidth);
  const color = current >= benchmark ? '#16A085' : '#E67E22';

  return `<svg width="${maxWidth}" height="24" style="margin-bottom: 2mm;">
    <rect x="0" y="4" width="${maxWidth}" height="16" fill="#f0f0f0" rx="2"/>
    <rect x="0" y="4" width="${width}" height="16" fill="${color}" rx="2"/>
  </svg>`;
}

function fillTemplate(template, sectorKey, data) {
  const { company, name, email, phone, sector_label, plan_label, monthly_sales, margin, active_clients, benchmark_margin, benchmark_revenue, benchmark_clients, benchmark_churn } = data;

  const today = new Date();
  const dateStr = `${today.getDate()} de ${'JunFebMarAbrMayJunJulAgoSepOctNovDic'.match(/.{3}/g)[today.getMonth()].toLowerCase()} de ${today.getFullYear()}`;
  const leadId = Math.random().toString(36).substring(2, 9).toUpperCase();

  // Calcular benchmarks
  const marginVsBenchmark = margin >= benchmark_margin
    ? `+${margin - benchmark_margin}pp ✓`
    : `${margin - benchmark_margin}pp`;

  const revenuePosition = monthly_sales.includes('$15') || monthly_sales.includes('$18') || monthly_sales.includes('$22')
    ? 'Por encima del promedio'
    : 'Cerca del promedio';

  const clientsConcentration = active_clients < 15
    ? 'Alta (alto riesgo)'
    : active_clients < 100
    ? 'Moderada'
    : 'Baja (dispersa)';

  const performanceAnalysis = `
    <ul style="margin-left: 1.5em;">
      <li>Margen ${margin >= benchmark_margin ? 'superior' : 'similar'} al sector: ${margin}% vs ${benchmark_margin}%</li>
      <li>Ingresos ${monthly_sales.includes('15') || monthly_sales.includes('18') || monthly_sales.includes('22') ? 'por encima' : 'cerca'} del promedio</li>
      <li>Cartera de ${active_clients} clientes con ${clientsConcentration.toLowerCase()}</li>
      <li>Potencial de mejora en ${margin < benchmark_margin ? 'márgenes' : 'diversificación'}</li>
    </ul>
  `;

  const marginChart = generateSvgChart(margin, benchmark_margin, 180);

  const planContent = `
    • Análisis inicial del posicionamiento
    • Identificación de oportunidades rápidas
    • Definición de roadmap de 90 días
  `;

  let result = template
    .replace(/{{company}}/g, company)
    .replace(/{{name}}/g, name)
    .replace(/{{email}}/g, email)
    .replace(/{{phone}}/g, phone)
    .replace(/{{sector_label}}/g, sector_label)
    .replace(/{{plan_label}}/g, plan_label)
    .replace(/{{date}}/g, dateStr)
    .replace(/{{lead_id}}/g, leadId)
    .replace(/{{monthly_sales}}/g, monthly_sales)
    .replace(/{{margin}}/g, margin)
    .replace(/{{active_clients}}/g, active_clients)
    .replace(/{{benchmark_margin}}/g, benchmark_margin)
    .replace(/{{benchmark_revenue}}/g, benchmark_revenue)
    .replace(/{{benchmark_clients}}/g, benchmark_clients)
    .replace(/{{benchmark_churn}}/g, benchmark_churn)
    .replace(/{{margin_vs_benchmark}}/g, marginVsBenchmark)
    .replace(/{{revenue_position}}/g, revenuePosition)
    .replace(/{{clients_concentration}}/g, clientsConcentration)
    .replace(/{{revenue_bar_width}}/g, '150')
    .replace(/{{clients_bar_width}}/g, '140')
    .replace(/{{performance_analysis}}/g, performanceAnalysis)
    .replace(/{{{margin_chart}}}/g, marginChart)
    .replace(/{{summary}}/g, `${company} es una empresa del sector ${sector_label} con ingresos mensuales de ${monthly_sales} y margen estimado de ${margin}%. El análisis comparativo identifica oportunidades clave de mejora en rentabilidad y crecimiento.`)
    .replace(/{{main_problem}}/g, margin < benchmark_margin ? 'Rentabilidad' : 'Crecimiento')
    .replace(/{{goal_6m}}/g, margin < 25 ? 'Mejorar márgenes en 5pp' : 'Duplicar ingresos')
    .replace(/{{opp1_title}}/g, 'Optimización de Estructura')
    .replace(/{{opp1_finding}}/g, 'Se identifican oportunidades en reducción de costos operativos.')
    .replace(/{{opp1_action}}/g, 'Auditoría de gastos y procesos; automatización de tareas repetitivas.')
    .replace(/{{opp1_impact}}/g, 'Alto')
    .replace(/{{opp1_kpi}}/g, 'Margen +3-5pp')
    .replace(/{{opp1_intervention}}/g, 'Media')
    .replace(/{{opp1_axis}}/g, 'ESTRUCTURA')
    .replace(/{{opp1_term}}/g, 'CORTO PLAZO')
    .replace(/{{opp2_title}}/g, 'Expansión Comercial')
    .replace(/{{opp2_finding}}/g, 'Potencial para aumentar cuota de mercado y penetración.')
    .replace(/{{opp2_action}}/g, 'Definir estrategia comercial; expandir canales de venta.')
    .replace(/{{opp2_impact}}/g, 'Alto')
    .replace(/{{opp2_kpi}}/g, 'Ingresos +15-25%')
    .replace(/{{opp2_intervention}}/g, 'Media')
    .replace(/{{opp2_axis}}/g, 'COMERCIAL')
    .replace(/{{opp2_term}}/g, 'MEDIANO PLAZO')
    .replace(/{{opp3_title}}/g, 'Diversificación de Cartera')
    .replace(/{{opp3_finding}}/g, 'Necesidad de reducir dependencia de pocos clientes.')
    .replace(/{{opp3_action}}/g, 'Desarrollar niches; crear productos/servicios complementarios.')
    .replace(/{{opp3_impact}}/g, 'Medio')
    .replace(/{{opp3_kpi}}/g, 'Clientes +30-50%')
    .replace(/{{opp3_intervention}}/g, 'Alta')
    .replace(/{{opp3_axis}}/g, 'CAJA')
    .replace(/{{opp3_term}}/g, 'LARGO PLAZO')
    .replace(/{{plan_30}}/g, '• Auditoría de costos<br/>• Análisis de margen<br/>• Sesión estratégica')
    .replace(/{{plan_60}}/g, '• Implementar mejoras<br/>• Validar estrategia<br/>• Primeros resultados')
    .replace(/{{plan_90}}/g, '• Consolidar cambios<br/>• Evaluar ROI<br/>• Planificar próxima fase');

  return result;
}

export default async (event, context) => {
  try {
    const template = fs.readFileSync('./templates/diagnostic-report-enhanced.html', 'utf-8');
    const browser = await puppeteer.launch();

    const pdfs = {};

    for (const [sectorKey, sectorData] of Object.entries(SECTOR_DATA)) {
      console.log(`Generando PDF para sector: ${sectorKey}`);

      const filledHtml = fillTemplate(template, sectorKey, sectorData);
      const page = await browser.newPage();

      await page.setContent(filledHtml, { waitUntil: 'networkidle0' });
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: 0, right: 0, bottom: 0, left: 0 }
      });

      await page.close();

      // Guardar en memoria para retornar
      pdfs[sectorKey] = {
        filename: `Reporte_${sectorData.company.replace(/\s+/g, '_')}.pdf`,
        buffer: pdfBuffer.toString('base64'),
        size: pdfBuffer.length
      };
    }

    await browser.close();

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: `${Object.keys(pdfs).length} reportes generados exitosamente`,
        pdfs: Object.keys(pdfs).reduce((acc, key) => {
          acc[key] = {
            filename: pdfs[key].filename,
            size: pdfs[key].size,
            url: `/downloads/${key}.pdf`
          };
          return acc;
        }, {})
      })
    };
  } catch (error) {
    console.error('Error generating sample reports:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
