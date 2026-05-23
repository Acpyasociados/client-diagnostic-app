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

function getEmailHtml(caseData, sector) {
  const sectorLabel = SECTOR_LABELS[sector] || sector;
  const questionnaire = getQuestionnaireHtml(caseData, sector);

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #2C3E50;
          background: #f5f5f5;
          margin: 0;
          padding: 20px;
        }
        .container {
          max-width: 700px;
          margin: 0 auto;
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 10px 40px rgba(0,0,0,0.1);
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 40px 20px;
          text-align: center;
        }
        .header h1 {
          margin: 0 0 10px 0;
          font-size: 28px;
        }
        .header p {
          margin: 0;
          font-size: 16px;
          opacity: 0.95;
        }
        .content {
          padding: 40px;
        }
        .greeting {
          font-size: 16px;
          margin-bottom: 20px;
        }
        .greeting strong {
          color: #667eea;
        }
        .info-box {
          background: #F8F9FA;
          border-left: 4px solid #667eea;
          padding: 20px;
          margin: 30px 0;
          border-radius: 6px;
        }
        .info-box table {
          width: 100%;
          border-collapse: collapse;
        }
        .info-box td {
          padding: 10px 0;
          border-bottom: 1px solid #E0E0E0;
        }
        .info-box td:first-child {
          font-weight: 600;
          color: #667eea;
          width: 140px;
        }
        .info-box tr:last-child td {
          border-bottom: none;
        }
        .questionnaire {
          background: #FFFFFF;
          border: 2px solid #E0E0E0;
          padding: 25px;
          margin: 30px 0;
          border-radius: 8px;
        }
        .questionnaire h3 {
          color: #667eea;
          margin-top: 0;
          border-bottom: 2px solid #667eea;
          padding-bottom: 10px;
        }
        .questionnaire ol {
          padding-left: 20px;
        }
        .questionnaire li {
          margin-bottom: 20px;
          line-height: 1.8;
        }
        .questionnaire strong {
          color: #2C3E50;
        }
        .instructions {
          background: #E3F2FD;
          border-left: 4px solid #2196F3;
          padding: 20px;
          margin: 30px 0;
          border-radius: 6px;
        }
        .instructions h3 {
          margin-top: 0;
          color: #1565C0;
        }
        .btn {
          display: block;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white !important;
          padding: 16px 32px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 16px;
          text-align: center;
          margin: 30px auto;
          max-width: 300px;
        }
        .btn:hover {
          opacity: 0.9;
          transform: translateY(-2px);
        }
        .footer {
          border-top: 1px solid #E0E0E0;
          padding-top: 20px;
          margin-top: 30px;
          font-size: 12px;
          color: #999;
          text-align: center;
        }
        .divider {
          border: 0;
          border-top: 2px solid #E0E0E0;
          margin: 30px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📋 Tu Cuestionario Diagnóstico</h1>
          <p>Paso 2 de tu diagnóstico ACP Asociados</p>
        </div>

        <div class="content">
          <div class="greeting">
            ¡Hola <strong>${caseData.name}</strong>!
          </div>

          <p>
            Tu pago ha sido confirmado exitosamente. A continuación, encontrarás el cuestionario específico para tu sector: <strong>${sectorLabel}</strong>.
          </p>

          <div class="info-box">
            <h3 style="margin-top: 0; margin-bottom: 15px;">📌 Datos de tu Solicitud</h3>
            <table>
              <tr>
                <td>Empresa:</td>
                <td><strong>${caseData.company}</strong></td>
              </tr>
              <tr>
                <td>Sector:</td>
                <td>${sectorLabel}</td>
              </tr>
              <tr>
                <td>Plan:</td>
                <td><strong>${caseData.plan === 'premium' ? 'Premium' : 'Básico'}</strong></td>
              </tr>
              <tr>
                <td>Orden:</td>
                <td><code>${caseData.id}</code></td>
              </tr>
            </table>
          </div>

          <hr class="divider">

          <div class="questionnaire">
            ${questionnaire}
          </div>

          <div class="instructions">
            <h3>📝 Instrucciones</h3>
            <ol>
              <li><strong>Responde con detalle</strong> - Tus respuestas son la base del diagnóstico personalizado</li>
              <li><strong>Sé específico</strong> - Incluye números, porcentajes y ejemplos concretos cuando sea posible</li>
              <li><strong>No hay respuestas incorrectas</strong> - Queremos entender tu situación actual tal como es</li>
              <li><strong>Tiempo estimado</strong> - Tarda aproximadamente 15-20 minutos en completarse</li>
            </ol>
          </div>

          <p style="text-align: center; margin: 30px 0;">
            <strong>¿Listo para continuar?</strong>
          </p>

          <a href="${process.env.SITE_URL || 'https://acp-asociados.netlify.app'}/responder-cuestionario?orderId=${caseData.id}" class="btn">
            ➜ Completar Cuestionario
          </a>

          <div class="footer">
            <p>
              Si tienes preguntas, contacta a nuestro equipo:<br>
              <strong>${process.env.ADVISOR_EMAIL || 'asesor.pac@gmail.com'}</strong>
            </p>
            <p style="margin-top: 15px; color: #ccc;">
              ACP Asociados - Diagnóstico Integral de Negocios
            </p>
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
