import { Resend } from 'resend';

const SECTOR_LABELS = {
  servicios_profesionales: 'Servicios Profesionales',
  comercio_ecommerce: 'Comercio / E-commerce',
  servicios_terreno: 'Servicios de Terreno',
  construccion: 'Construcción',
  gastronomia: 'Gastronomía',
  salud_belleza: 'Salud & Belleza',
  tecnologia: 'Tecnología',
  educacion: 'Educación',
  manufactura: 'Manufactura',
  otro: 'Otro'
};

// Plantilla de cuestionario específica por sector
function getQuestionnaireHtml(caseData, sector) {
  const sectorLabel = SECTOR_LABELS[sector] || sector;

  const questionnairesBySetor = {
    servicios_profesionales: `
      <h3>Cuestionario para Servicios Profesionales</h3>
      <ol>
        <li><strong>Estructura de precios</strong><br/>
          ¿Cómo establecen actualmente sus honorarios? ¿Por hora, por proyecto, o por retainer?
        </li>
        <li><strong>Gestión de clientes</strong><br/>
          ¿Utilizan algún sistema para administrar los casos y clientes? ¿Cuáles son los principales desafíos?
        </li>
        <li><strong>Propuesta de valor</strong><br/>
          ¿Qué diferencia su firma de la competencia? ¿Cuál es su ventaja competitiva?
        </li>
        <li><strong>Tecnología y automatización</strong><br/>
          ¿Qué herramientas utilizan actualmente? ¿Qué tareas les gustaría automatizar?
        </li>
        <li><strong>Expansión y crecimiento</strong><br/>
          ¿Cuáles son sus planes de crecimiento en los próximos 6-12 meses?
        </li>
      </ol>
    `,
    comercio_ecommerce: `
      <h3>Cuestionario para Comercio / E-commerce</h3>
      <ol>
        <li><strong>Canales de venta</strong><br/>
          ¿Cuáles son sus principales canales de venta? (tienda propia, marketplaces, redes sociales)
        </li>
        <li><strong>Logística y fulfillment</strong><br/>
          ¿Cómo manejan actualmente el envío y la entrega? ¿Cuáles son los principales costos?
        </li>
        <li><strong>Gestión de inventario</strong><br/>
          ¿Tienen sistema de control de stock? ¿Cuáles son los problemas más frecuentes?
        </li>
        <li><strong>Marketing y adquisición de clientes</strong><br/>
          ¿Cuál es su principal estrategia de marketing? ¿Cuál es el costo de adquisición actual?
        </li>
        <li><strong>Retención de clientes</strong><br/>
          ¿Tienen programas de lealtad? ¿Cuál es el lifetime value promedio de un cliente?
        </li>
      </ol>
    `,
    servicios_terreno: `
      <h3>Cuestionario para Servicios de Terreno</h3>
      <ol>
        <li><strong>Coordinación operativa</strong><br/>
          ¿Cómo coordinan actualmente a los equipos en terreno?
        </li>
        <li><strong>Seguimiento de proyectos</strong><br/>
          ¿Qué herramientas usan para el seguimiento? ¿Qué información es más difícil de capturar?
        </li>
        <li><strong>Gestión de recursos</strong><br/>
          ¿Cómo asignan equipos y recursos a los proyectos? ¿Hay sobreasignación o subutilización?
        </li>
        <li><strong>Calidad y cumplimiento</strong><br/>
          ¿Cómo verifican la calidad del trabajo? ¿Cuáles son sus mayores desafíos?
        </li>
        <li><strong>Comunicación con clientes</strong><br/>
          ¿Cómo actualizan a los clientes sobre el progreso? ¿Cuál es el nivel de satisfacción?
        </li>
      </ol>
    `,
    construccion: `
      <h3>Cuestionario para Construcción</h3>
      <ol>
        <li><strong>Gestión de proyectos</strong><br/>
          ¿Cuál es su metodología actual de gestión de proyectos? ¿Cuáles son los principales desafíos?
        </li>
        <li><strong>Control de costos</strong><br/>
          ¿Cómo controlan los costos durante el proyecto? ¿Cuál es el porcentaje de sobrecostos promedio?
        </li>
        <li><strong>Gestión de proveedores</strong><br/>
          ¿Cuántos proveedores principales tienen? ¿Cómo se gestionan las órdenes y entregas?
        </li>
        <li><strong>Seguridad en obra</strong><br/>
          ¿Cómo se gestionan los protocolos de seguridad? ¿Cuál es el registro de incidentes?
        </li>
        <li><strong>Documentación y compliance</strong><br/>
          ¿Qué documentación requieren? ¿Cuáles son los principales riesgos regulatorios?
        </li>
      </ol>
    `,
    gastronomia: `
      <h3>Cuestionario para Gastronomía</h3>
      <ol>
        <li><strong>Gestión de menú y recetas</strong><br/>
          ¿Cómo gestionan actualmente las recetas y estándares de calidad?
        </li>
        <li><strong>Gestión de inventario</strong><br/>
          ¿Cómo controlan el inventario de alimentos? ¿Cuál es el porcentaje de pérdida por desperdicio?
        </li>
        <li><strong>Proveedores y compras</strong><br/>
          ¿Cuántos proveedores tienen? ¿Cómo negocian precios y calidad?
        </li>
        <li><strong>Personal y cocina</strong><br/>
          ¿Cuál es su principal desafío en la gestión del equipo de cocina?
        </li>
        <li><strong>Experiencia del cliente</strong><br/>
          ¿Cómo recopilan feedback? ¿Cuál es su nivel de satisfacción actual?
        </li>
      </ol>
    `,
    salud_belleza: `
      <h3>Cuestionario para Salud & Belleza</h3>
      <ol>
        <li><strong>Gestión de citas</strong><br/>
          ¿Cómo manejan actualmente la reserva de citas? ¿Hay problemas de no-shows?
        </li>
        <li><strong>Gestión de inventario</strong><br/>
          ¿Cómo controlan los productos y suministros? ¿Cuál es el ciclo de reorden?
        </li>
        <li><strong>Cumplimiento normativo</strong><br/>
          ¿Cómo aseguran el cumplimiento de regulaciones sanitarias y de privacidad?
        </li>
        <li><strong>Gestión del equipo</strong><br/>
          ¿Cómo asignan profesionales a los servicios? ¿Cuál es la utilización promedio?
        </li>
        <li><strong>Retención de clientes</strong><br/>
          ¿Tienen programa de fidelización? ¿Cuál es el cliente lifetime value?
        </li>
      </ol>
    `,
    tecnologia: `
      <h3>Cuestionario para Tecnología</h3>
      <ol>
        <li><strong>Desarrollo y sprints</strong><br/>
          ¿Cuál es su metodología de desarrollo? ¿Cuál es la duración típica de un sprint?
        </li>
        <li><strong>Gestión de clientes / Proyectos</strong><br/>
          ¿Cómo trackean el progreso de proyectos? ¿Cuál es el nivel de scope creep?
        </li>
        <li><strong>Infraestructura y DevOps</strong><br/>
          ¿Cómo manejan la infraestructura? ¿Cuál es el tiempo promedio de downtime?
        </li>
        <li><strong>Reclutamiento y retención de talento</strong><br/>
          ¿Cuál es su principal desafío en la búsqueda de talento técnico?
        </li>
        <li><strong>Innovación y roadmap</strong><br/>
          ¿Cómo definen su roadmap de producto? ¿Cómo priorizan features?
        </li>
      </ol>
    `,
    educacion: `
      <h3>Cuestionario para Educación</h3>
      <ol>
        <li><strong>Gestión de estudiantes</strong><br/>
          ¿Cómo gestionan la información de estudiantes? ¿Qué datos son críticos?
        </li>
        <li><strong>Planificación curricular</strong><br/>
          ¿Cómo se define y comunica el currículo? ¿Cuál es la frecuencia de actualización?
        </li>
        <li><strong>Evaluaciones y calificaciones</strong><br/>
          ¿Cómo se manejan actualmente las evaluaciones? ¿Hay un sistema integrado?
        </li>
        <li><strong>Comunicación con padres/apoderados</strong><br/>
          ¿Cómo comunican el progreso académico? ¿Cuál es la frecuencia?
        </li>
        <li><strong>Gestión administrativa</strong><br/>
          ¿Cuál es el mayor desafío administrativo actualmente?
        </li>
      </ol>
    `,
    manufactura: `
      <h3>Cuestionario para Manufactura</h3>
      <ol>
        <li><strong>Control de producción</strong><br/>
          ¿Cómo planifican la producción? ¿Cuál es el lead time promedio?
        </li>
        <li><strong>Control de calidad</strong><br/>
          ¿Cuál es su proceso de QC? ¿Cuál es la tasa de defectos actual?
        </li>
        <li><strong>Gestión de materias primas</strong><br/>
          ¿Cómo manejan el inventario de materias primas? ¿Cuál es el costo de almacenamiento?
        </li>
        <li><strong>Mantenimiento de equipos</strong><br/>
          ¿Cómo se realiza el mantenimiento preventivo? ¿Cuál es el downtime?
        </li>
        <li><strong>Eficiencia operacional</strong><br/>
          ¿Cuál es su OEE actual? ¿Dónde ven mayor potencial de mejora?
        </li>
      </ol>
    `,
    otro: `
      <h3>Cuestionario General</h3>
      <ol>
        <li><strong>Modelo de negocio</strong><br/>
          Describa brevemente cómo genera ingresos su empresa.
        </li>
        <li><strong>Principales desafíos operativos</strong><br/>
          ¿Cuáles son los 3 principales desafíos que enfrenta actualmente?
        </li>
        <li><strong>Procesos críticos</strong><br/>
          ¿Cuáles son los procesos más críticos en su operación?
        </li>
        <li><strong>Gestión actual</strong><br/>
          ¿Qué herramientas utiliza actualmente para gestión? ¿Cuáles son las brechas?
        </li>
        <li><strong>Objetivos de mejora</strong><br/>
          ¿Cuál es su objetivo principal de mejora en los próximos 6 meses?
        </li>
      </ol>
    `
  };

  return questionnairesBySetor[sector] || questionnairesBySetor.otro;
}

function getSectorPersonalization(sector) {
  const personalizations = {
    servicios_profesionales: {
      icon: '⚖️',
      message: 'Nos enfocaremos en tu estructura de costos, gestión de clientes y oportunidades de escalabilidad'
    },
    comercio_ecommerce: {
      icon: '🛒',
      message: 'Analizaremos tus canales de venta, logística y estrategia de retención de clientes'
    },
    servicios_terreno: {
      icon: '🔧',
      message: 'Revisaremos tu coordinación operativa, seguimiento de proyectos y gestión de recursos'
    },
    construccion: {
      icon: '🏗️',
      message: 'Evaluaremos gestión de proyectos, control de costos y seguridad en obra'
    },
    gastronomia: {
      icon: '🍽️',
      message: 'Analizaremos gestión de inventario, recetas y experiencia del cliente'
    },
    salud_belleza: {
      icon: '💅',
      message: 'Revisaremos gestión de citas, inventario y retención de clientes'
    },
    tecnologia: {
      icon: '💻',
      message: 'Evaluaremos tu metodología de desarrollo, gestión de clientes y escalabilidad'
    },
    educacion: {
      icon: '📚',
      message: 'Analizaremos gestión de estudiantes, programas y recursos educativos'
    },
    manufactura: {
      icon: '⚙️',
      message: 'Revisaremos procesos de producción, control de calidad e inventario'
    },
    otro: {
      icon: '📊',
      message: 'Realizaremos un diagnóstico integral adaptado a tu modelo de negocio'
    }
  };
  return personalizations[sector] || personalizations.otro;
}

function getEmailHtml(caseData, sector) {
  const sectorLabel = SECTOR_LABELS[sector] || sector;
  const questionnaire = getQuestionnaireHtml(caseData, sector);
  const personalization = getSectorPersonalization(sector);
  const siteUrl = process.env.SITE_URL || 'https://acp-asociados.netlify.app';

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { margin: 0; padding: 0; }
        body {
          font-family: 'DM Sans', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #2C3E50;
          background: #f5f5f5;
        }
        .container {
          max-width: 700px;
          margin: 0 auto;
          background: white;
          border-radius: 0;
          overflow: hidden;
          box-shadow: 0 10px 40px rgba(0,0,0,0.1);
        }
        .header {
          background: linear-gradient(135deg, #1B3B5C 0%, #16A085 100%);
          color: white;
          padding: 50px 30px;
          text-align: center;
        }
        .header .logo {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 32px;
          font-weight: 700;
          letter-spacing: 3px;
          margin-bottom: 15px;
        }
        .header .logo-sub {
          font-size: 11px;
          letter-spacing: 2px;
          color: #3498DB;
          font-weight: 300;
        }
        .header h1 {
          margin: 20px 0 10px 0;
          font-size: 28px;
          font-weight: 600;
        }
        .header p {
          margin: 0;
          font-size: 16px;
          opacity: 0.9;
        }
        .content {
          padding: 40px;
        }
        .greeting {
          font-size: 18px;
          margin-bottom: 15px;
          line-height: 1.6;
        }
        .greeting strong {
          color: #1B3B5C;
        }
        .progress-bar {
          background: #ECF0F3;
          border-radius: 20px;
          padding: 2px;
          margin: 25px 0;
          height: 8px;
        }
        .progress-fill {
          background: linear-gradient(90deg, #16A085 0%, #3498DB 100%);
          height: 100%;
          border-radius: 20px;
          width: 40%;
        }
        .progress-text {
          font-size: 12px;
          color: #666;
          margin-top: 8px;
          text-align: center;
          font-weight: 600;
        }
        .summary-box {
          background: linear-gradient(135deg, #f0f6ff 0%, #f0fff0 100%);
          border-left: 4px solid #16A085;
          padding: 25px;
          margin: 25px 0;
          border-radius: 6px;
        }
        .summary-box h3 {
          color: #1B3B5C;
          margin-top: 0;
          margin-bottom: 12px;
          font-size: 16px;
        }
        .summary-box p {
          margin: 0;
          font-size: 15px;
          line-height: 1.7;
          color: #2C3E50;
        }
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin: 25px 0;
        }
        .info-card {
          background: #ECF0F3;
          padding: 15px;
          border-radius: 6px;
          border-top: 3px solid #16A085;
        }
        .info-card .label {
          font-size: 12px;
          font-weight: 600;
          color: #16A085;
          letter-spacing: 1px;
          text-transform: uppercase;
          margin-bottom: 5px;
        }
        .info-card .value {
          font-size: 16px;
          font-weight: 600;
          color: #1B3B5C;
        }
        .questionnaire {
          background: #FFFFFF;
          border: 2px solid #E0E0E0;
          padding: 25px;
          margin: 30px 0;
          border-radius: 8px;
        }
        .questionnaire h3 {
          color: #1B3B5C;
          margin-top: 0;
          border-bottom: 3px solid #16A085;
          padding-bottom: 12px;
          font-size: 18px;
        }
        .questionnaire ol {
          padding-left: 20px;
        }
        .questionnaire li {
          margin-bottom: 20px;
          line-height: 1.8;
          color: #2C3E50;
        }
        .questionnaire strong {
          color: #1B3B5C;
        }
        .instructions {
          background: linear-gradient(135deg, #fff3e0 0%, #fff9c4 100%);
          border-left: 4px solid #E67E22;
          padding: 25px;
          margin: 30px 0;
          border-radius: 6px;
        }
        .instructions h3 {
          margin-top: 0;
          color: #D97706;
          font-size: 16px;
        }
        .instructions ol {
          margin: 15px 0;
          padding-left: 20px;
        }
        .instructions li {
          margin-bottom: 10px;
          line-height: 1.6;
        }
        .button-group {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin: 30px 0;
        }
        .btn {
          display: block;
          color: white !important;
          padding: 16px 32px;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
          font-size: 15px;
          text-align: center;
          transition: all 0.3s ease;
        }
        .btn-primary {
          background: linear-gradient(135deg, #16A085 0%, #1B3B5C 100%);
        }
        .btn-primary:hover {
          opacity: 0.9;
          box-shadow: 0 4px 12px rgba(22, 160, 133, 0.3);
        }
        .btn-secondary {
          background: #3498DB;
          padding: 14px 28px;
          font-size: 14px;
        }
        .btn-secondary:hover {
          opacity: 0.9;
        }
        .timeline {
          margin: 25px 0;
          padding: 20px;
          background: #f9f9f9;
          border-radius: 6px;
          border-left: 4px solid #3498DB;
        }
        .timeline h4 {
          margin: 0 0 12px 0;
          color: #1B3B5C;
          font-size: 14px;
        }
        .timeline-step {
          display: flex;
          gap: 12px;
          margin-bottom: 12px;
          font-size: 14px;
        }
        .timeline-step:last-child {
          margin-bottom: 0;
        }
        .timeline-number {
          background: #16A085;
          color: white;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          flex-shrink: 0;
        }
        .footer {
          border-top: 1px solid #E0E0E0;
          padding: 25px;
          margin-top: 30px;
          background: #f9f9f9;
          text-align: center;
          font-size: 13px;
        }
        .footer p {
          margin: 8px 0;
          color: #666;
        }
        .footer .brand {
          color: #1B3B5C;
          font-weight: 600;
          margin-top: 12px;
        }
        .divider {
          border: 0;
          border-top: 1px solid #E0E0E0;
          margin: 25px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">
            ACP
            <div class="logo-sub">& ASOCIADOS</div>
          </div>
          <h1>Tu Cuestionario Diagnóstico</h1>
          <p>Paso 2 de 3: Recopilación de información</p>
        </div>

        <div class="content">
          <div class="greeting">
            ¡Hola <strong>${caseData.name}</strong>!
          </div>

          <p>
            Tu pago ha sido confirmado y tu diagnóstico está en marcha. El siguiente paso es completar el cuestionario específico para tu sector para que podamos personalizar nuestro análisis.
          </p>

          <div class="progress-bar">
            <div class="progress-fill"></div>
          </div>
          <div class="progress-text">Progreso: 40% completado</div>

          <div class="summary-box">
            <h3>📌 Lo que haremos con tus respuestas</h3>
            <p><strong>${personalization.icon} ${sectorLabel}</strong><br/>
            ${personalization.message}</p>
          </div>

          <div class="info-grid">
            <div class="info-card">
              <div class="label">Empresa</div>
              <div class="value">${caseData.company}</div>
            </div>
            <div class="info-card">
              <div class="label">Sector</div>
              <div class="value">${sectorLabel}</div>
            </div>
            <div class="info-card">
              <div class="label">Plan</div>
              <div class="value">${caseData.plan === 'premium' ? '✓ Premium' : '✓ Básico'}</div>
            </div>
            <div class="info-card">
              <div class="label">Orden</div>
              <div class="value" style="font-family: monospace; font-size: 12px;">${caseData.id}</div>
            </div>
          </div>

          <hr class="divider">

          <div class="questionnaire">
            ${questionnaire}
          </div>

          <div class="instructions">
            <h3>📝 Consejos para mejores resultados</h3>
            <ol>
              <li><strong>Responde con detalle</strong> - La precisión es clave para un diagnóstico personalizado</li>
              <li><strong>Datos concretos</strong> - Incluye números, porcentajes y ejemplos reales</li>
              <li><strong>Sé honesto</strong> - Nos interesa tu situación actual, no la ideal</li>
              <li><strong>Tiempo estimado</strong> - 15-20 minutos para completar todas las preguntas</li>
            </ol>
          </div>

          <div class="timeline">
            <h4>⏱️ Cronograma del diagnóstico</h4>
            <div class="timeline-step">
              <div class="timeline-number">1</div>
              <div><strong>Hoy:</strong> Completa este cuestionario</div>
            </div>
            <div class="timeline-step">
              <div class="timeline-number">2</div>
              <div><strong>En 2-3 días:</strong> Recibirás tu reporte diagnóstico</div>
            </div>
            <div class="timeline-step">
              <div class="timeline-number">3</div>
              <div><strong>Próxima semana:</strong> Sesión de revisión con nuestro asesor</div>
            </div>
          </div>

          <div class="button-group">
            <a href="${siteUrl}/responder-cuestionario?orderId=${caseData.id}" class="btn btn-primary">
              ➜ Completar Cuestionario Ahora
            </a>
          </div>

          <p style="font-size: 13px; color: #666; text-align: center; margin: 20px 0;">
            O copia este enlace en tu navegador:<br>
            <code style="background: #f0f0f0; padding: 4px 8px; border-radius: 4px; font-size: 12px;">${siteUrl}/responder-cuestionario?orderId=${caseData.id}</code>
          </p>

          <div class="footer">
            <p><strong>¿Tienes preguntas?</strong></p>
            <p>Contacta a nuestro equipo en: <strong>${process.env.ADVISOR_EMAIL || 'asesor.pac@gmail.com'}</strong></p>
            <p style="font-size: 12px; margin-top: 15px; color: #999;">
              Este es un email automático. Por favor no respondas a esta dirección.
            </p>
            <p class="brand">ACP Asociados - Diagnóstico Integral de Negocios</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

export default async (event, context) => {
  console.log('=== Send Questionnaire Email Handler START ===');

  try {
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      console.error('Missing RESEND_API_KEY');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Missing RESEND_API_KEY configuration' })
      };
    }

    // Parse body
    let caseData;
    if (typeof event.body === 'string') {
      caseData = JSON.parse(event.body);
    } else if (event.body && typeof event.body === 'object') {
      caseData = event.body;
    } else {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid request body' })
      };
    }

    const { orderId } = caseData;

    if (!caseData.email || !caseData.name || !caseData.company || !caseData.sector) {
      console.error('Missing required fields:', { email: caseData.email, name: caseData.name, company: caseData.company, sector: caseData.sector });
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields: email, name, company, sector' })
      };
    }

    console.log('Sending questionnaire to:', caseData.email, 'for sector:', caseData.sector);

    const resend = new Resend(resendApiKey);
    const emailHtml = getEmailHtml(caseData, caseData.sector);

    const result = await resend.emails.send({
      from: 'informes@acpasociados.cl',
      to: caseData.email,
      subject: `📋 Tu cuestionario diagnóstico - ${SECTOR_LABELS[caseData.sector] || caseData.sector}`,
      html: emailHtml
    });

    console.log('Questionnaire email sent successfully:', result);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Questionnaire email sent successfully',
        orderId: orderId,
        email: caseData.email
      })
    };

  } catch (error) {
    console.error('Send Questionnaire Email Error:', {
      message: error.message,
      stack: error.stack
    });

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error while sending questionnaire email',
        message: error.message
      })
    };
  }
};
