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

function getAdvisorEmailHtml(caseData, orderId, flowToken) {
  const sectorLabel = SECTOR_LABELS[caseData.sector] || caseData.sector;
  const planLabel = caseData.plan === 'premium' ? 'Premium ($11.000 CLP)' : 'Básico ($1.000 CLP)';
  const paymentDate = new Date(caseData.paid_at).toLocaleString('es-CL');

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
          background: linear-gradient(135deg, #27AE60 0%, #2ECC71 100%);
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
        .info-box {
          background: #F0F8F5;
          border-left: 4px solid #27AE60;
          padding: 25px;
          margin: 25px 0;
          border-radius: 6px;
        }
        .info-box h3 {
          margin-top: 0;
          color: #27AE60;
          border-bottom: 2px solid #27AE60;
          padding-bottom: 10px;
        }
        .info-box table {
          width: 100%;
          border-collapse: collapse;
        }
        .info-box td {
          padding: 12px 0;
          border-bottom: 1px solid #D5E8D4;
        }
        .info-box td:first-child {
          font-weight: 600;
          color: #27AE60;
          width: 140px;
        }
        .info-box tr:last-child td {
          border-bottom: none;
        }
        .payment-summary {
          background: linear-gradient(135deg, #E8F8F5 0%, #F0F8F5 100%);
          border: 2px solid #27AE60;
          border-radius: 8px;
          padding: 25px;
          margin: 30px 0;
          text-align: center;
        }
        .payment-summary .amount {
          font-size: 32px;
          font-weight: 700;
          color: #27AE60;
          margin: 15px 0;
        }
        .payment-summary .currency {
          font-size: 14px;
          color: #666;
        }
        .next-steps {
          background: #E3F2FD;
          border-left: 4px solid #2196F3;
          padding: 20px;
          margin: 25px 0;
          border-radius: 6px;
        }
        .next-steps h3 {
          margin-top: 0;
          color: #1565C0;
        }
        .next-steps ol {
          padding-left: 20px;
          margin: 0;
        }
        .next-steps li {
          margin-bottom: 10px;
        }
        .btn-group {
          display: flex;
          gap: 12px;
          margin: 30px 0;
          flex-wrap: wrap;
        }
        .btn {
          flex: 1;
          min-width: 160px;
          padding: 14px 24px;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
          font-size: 14px;
          text-align: center;
          transition: all 0.3s;
        }
        .btn-primary {
          background: linear-gradient(135deg, #27AE60 0%, #2ECC71 100%);
          color: white;
        }
        .btn-primary:hover {
          opacity: 0.9;
          box-shadow: 0 4px 12px rgba(39, 174, 96, 0.3);
        }
        .btn-secondary {
          background: #F0F0F0;
          color: #2C3E50;
          border: 1px solid #DDD;
        }
        .btn-secondary:hover {
          background: #E8E8E8;
        }
        .divider {
          border: 0;
          border-top: 2px solid #E0E0E0;
          margin: 30px 0;
        }
        .footer {
          border-top: 1px solid #E0E0E0;
          padding-top: 20px;
          margin-top: 30px;
          font-size: 12px;
          color: #999;
          text-align: center;
        }
        .status-badge {
          display: inline-block;
          background: #27AE60;
          color: white;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          margin: 10px 0;
        }
        code {
          background: #F5F5F5;
          padding: 4px 8px;
          border-radius: 3px;
          font-family: 'Courier New', monospace;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>💰 Pago Confirmado</h1>
          <p>Nueva venta de diagnóstico ACP</p>
        </div>

        <div class="content">
          <p><strong>Hola,</strong></p>
          <p>Se ha confirmado un nuevo pago en el sistema. Los detalles se encuentran a continuación:</p>

          <div class="info-box">
            <h3>👤 Información del Cliente</h3>
            <table>
              <tr>
                <td>Nombre:</td>
                <td><strong>${caseData.name}</strong></td>
              </tr>
              <tr>
                <td>Empresa:</td>
                <td><strong>${caseData.company}</strong></td>
              </tr>
              <tr>
                <td>Email:</td>
                <td><a href="mailto:${caseData.email}">${caseData.email}</a></td>
              </tr>
              <tr>
                <td>Teléfono:</td>
                <td>${caseData.phone || 'N/A'}</td>
              </tr>
              <tr>
                <td>Sector:</td>
                <td>${sectorLabel}</td>
              </tr>
            </table>
          </div>

          <div class="info-box">
            <h3>💳 Detalles del Pago</h3>
            <table>
              <tr>
                <td>Plan:</td>
                <td><strong>${planLabel}</strong></td>
              </tr>
              <tr>
                <td>Monto:</td>
                <td><strong style="font-size: 18px;">$${caseData.amount.toLocaleString('es-CL')} CLP</strong></td>
              </tr>
              <tr>
                <td>Estado:</td>
                <td><span class="status-badge">✓ PAGADO</span></td>
              </tr>
              <tr>
                <td>Fecha de pago:</td>
                <td>${paymentDate}</td>
              </tr>
              <tr>
                <td>Orden ID:</td>
                <td><code>${orderId}</code></td>
              </tr>
              <tr>
                <td>Token Flow:</td>
                <td><code>${flowToken.substring(0, 16)}...</code></td>
              </tr>
            </table>
          </div>

          <div class="payment-summary">
            <div class="currency">Monto pagado</div>
            <div class="amount">$${caseData.amount.toLocaleString('es-CL')}</div>
            <div style="color: #666; font-size: 14px;">Pesos Chilenos (CLP)</div>
          </div>

          <hr class="divider">

          <div class="next-steps">
            <h3>📋 Próximos Pasos Automáticos</h3>
            <ol>
              <li><strong>Cuestionario enviado</strong> - El cliente recibirá el cuestionario específico para su sector</li>
              <li><strong>Reporte generado</strong> - Se estará generando el diagnóstico preliminar</li>
              <li><strong>Tu acción</strong> - Revisa los detalles y el reporte cuando esté disponible</li>
              <li><strong>Respuestas del cliente</strong> - Espera las respuestas del cuestionario para refinar el diagnóstico</li>
            </ol>
          </div>

          <p><strong>Información adicional del cliente:</strong></p>
          <div class="info-box" style="border-left-color: #3498DB; background: #E3F2FD;">
            <table style="font-size: 13px;">
              <tr>
                <td>Ventas mensuales:</td>
                <td>${caseData.monthly_sales || 'N/A'}</td>
              </tr>
              <tr>
                <td>Margen de ganancia:</td>
                <td>${caseData.profit_margin || 'N/A'}</td>
              </tr>
              <tr>
                <td>Clientes activos:</td>
                <td>${caseData.active_clients || 'N/A'}</td>
              </tr>
              <tr>
                <td>Régimen tributario:</td>
                <td>${caseData.tax_regime || 'N/A'}</td>
              </tr>
              <tr>
                <td>Problema principal:</td>
                <td>${caseData.main_challenge || 'N/A'}</td>
              </tr>
              <tr>
                <td>Objetivos 6 meses:</td>
                <td>${caseData.objectives_6m || 'N/A'}</td>
              </tr>
            </table>
          </div>

          <p style="text-align: center; margin: 30px 0;">
            <strong>¿Necesitas más información sobre este caso?</strong>
          </p>

          <div class="btn-group">
            <a href="${process.env.SITE_URL || 'https://acp-asociados.netlify.app'}/admin/cases/${orderId}" class="btn btn-primary">
              Ver caso completo
            </a>
            <a href="mailto:${caseData.email}?subject=Re%3A%20Tu%20Diagn%C3%B3stico%20ACP" class="btn btn-secondary">
              Contactar cliente
            </a>
          </div>

          <div class="footer">
            <p>
              Sistema Automático de Diagnóstico ACP<br>
              Pago confirmado a través de Flow Payment Gateway
            </p>
            <p style="margin-top: 15px; color: #ccc;">
              Este es un email automático. No responder a esta dirección.
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

export default async (event, context) => {
  console.log('=== Send Advisor Payment Notification Handler START ===');

  try {
    const resendApiKey = process.env.RESEND_API_KEY;
    const advisorEmail = process.env.ADVISOR_EMAIL;

    if (!resendApiKey || !advisorEmail) {
      console.error('Missing RESEND_API_KEY or ADVISOR_EMAIL');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Missing required environment variables' })
      };
    }

    // Parse body
    let data;
    if (typeof event.body === 'string') {
      data = JSON.parse(event.body);
    } else if (event.body && typeof event.body === 'object') {
      data = event.body;
    } else {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid request body' })
      };
    }

    const { orderId, caseData, flowToken } = data;

    if (!caseData || !orderId || !flowToken) {
      console.error('Missing required fields:', { caseData: !!caseData, orderId: !!orderId, flowToken: !!flowToken });
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields: orderId, caseData, flowToken' })
      };
    }

    if (!caseData.company || !caseData.name || !caseData.email) {
      console.error('Missing required case data:', { company: caseData.company, name: caseData.name, email: caseData.email });
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required case data: company, name, email' })
      };
    }

    console.log('Sending payment notification to advisor:', advisorEmail, 'for order:', orderId);

    const resend = new Resend(resendApiKey);
    const planLabel = caseData.plan === 'premium' ? 'Premium' : 'Básico';
    const sectorLabel = SECTOR_LABELS[caseData.sector] || caseData.sector;

    const emailHtml = getAdvisorEmailHtml(caseData, orderId, flowToken);

    const result = await resend.emails.send({
      from: 'informes@acpasociados.cl',
      to: advisorEmail,
      subject: `💰 Pago confirmado: ${caseData.company} (${planLabel}) - $${caseData.amount} CLP`,
      html: emailHtml
    });

    console.log('Advisor payment notification sent successfully:', result);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Advisor payment notification sent successfully',
        orderId: orderId,
        email: advisorEmail
      })
    };

  } catch (error) {
    console.error('Send Advisor Payment Notification Error:', {
      message: error.message,
      stack: error.stack
    });

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error while sending advisor notification',
        message: error.message
      })
    };
  }
};
