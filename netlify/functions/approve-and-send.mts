import type { Context, Config } from "@netlify/functions";
import { getStore } from "@netlify/blobs";
import { Resend } from "resend";

export default async (req: Request, context: Context) => {
  try {
    const url = new URL(req.url);
    const leadId = url.searchParams.get("leadId");

    if (!leadId) {
      return new Response(
        `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Error - ACP Diagnóstico</title>
          <style>
            body { font-family: system-ui; max-width: 600px; margin: 100px auto; padding: 20px; text-align: center; }
            .error { background: #fee; border: 2px solid #e74c3c; padding: 30px; border-radius: 12px; }
          </style>
        </head>
        <body>
          <div class="error">
            <h1>❌ Error</h1>
            <p>No se proporcionó ID de pedido</p>
          </div>
        </body>
        </html>
        `,
        { status: 400, headers: { "Content-Type": "text/html" } }
      );
    }

    const leadsStore = getStore("leads");
    const lead = await leadsStore.get(leadId, { type: "json" });

    if (!lead) {
      return new Response(
        `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Error - ACP Diagnóstico</title>
          <style>
            body { font-family: system-ui; max-width: 600px; margin: 100px auto; padding: 20px; text-align: center; }
            .error { background: #fee; border: 2px solid #e74c3c; padding: 30px; border-radius: 12px; }
          </style>
        </head>
        <body>
          <div class="error">
            <h1>❌ Error</h1>
            <p>No se encontró el pedido: ${leadId}</p>
          </div>
        </body>
        </html>
        `,
        { status: 404, headers: { "Content-Type": "text/html" } }
      );
    }

    if (lead.emailSent) {
      return new Response(
        `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Ya Enviado - ACP Diagnóstico</title>
          <style>
            body { font-family: system-ui; max-width: 600px; margin: 100px auto; padding: 20px; text-align: center; }
            .warning { background: #fff3cd; border: 2px solid #f39c12; padding: 30px; border-radius: 12px; }
          </style>
        </head>
        <body>
          <div class="warning">
            <h1>⚠️ Ya Enviado</h1>
            <p>Este diagnóstico ya fue enviado al cliente:</p>
            <p><strong>${lead.contact_email}</strong></p>
            <p>Fecha de envío: ${new Date(lead.emailSentAt).toLocaleString('es-CL')}</p>
          </div>
        </body>
        </html>
        `,
        { status: 200, headers: { "Content-Type": "text/html" } }
      );
    }

    const pdfsStore = getStore("pdfs");
    const pdfBuffer = await pdfsStore.get(`pdf-${leadId}`, { type: "arrayBuffer" });

    if (!pdfBuffer) {
      return new Response(
        `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Error - ACP Diagnóstico</title>
          <style>
            body { font-family: system-ui; max-width: 600px; margin: 100px auto; padding: 20px; text-align: center; }
            .error { background: #fee; border: 2px solid #e74c3c; padding: 30px; border-radius: 12px; }
          </style>
        </head>
        <body>
          <div class="error">
            <h1>❌ Error</h1>
            <p>No se encontró el PDF para este pedido</p>
            <p>Lead ID: ${leadId}</p>
          </div>
        </body>
        </html>
        `,
        { status: 404, headers: { "Content-Type": "text/html" } }
      );
    }

    const pdfBase64 = Buffer.from(pdfBuffer).toString("base64");
    const resend = new Resend(Netlify.env.get("RESEND_API_KEY"));

    const planNames = {
      basico: "Básico",
      premium: "Premium"
    };

    const planName = planNames[lead.plan] || lead.plan;

    await resend.emails.send({
      from: "ACP y Asociados <diagnostico@acpasociados.cl>",
      to: lead.contact_email,
      subject: `✅ Tu Diagnóstico Empresarial ${planName} - ${lead.company_name}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #2C3E50; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #1B3B5C 0%, #2C3E50 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0; }
            .content { background: white; padding: 30px; border: 2px solid #ECF0F3; border-top: none; border-radius: 0 0 12px 12px; }
            .highlight { background: #E8F5E9; padding: 20px; border-left: 4px solid #16A085; margin: 20px 0; border-radius: 6px; }
            .footer { text-align: center; padding: 20px; color: #95A5A6; font-size: 0.9em; }
            .btn { display: inline-block; background: linear-gradient(135deg, #16A085 0%, #3498DB 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 10px 0; }
            ul { padding-left: 20px; }
            li { margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎯 Tu Diagnóstico Está Listo</h1>
              <p>Plan ${planName} - ${lead.company_name}</p>
            </div>
            
            <div class="content">
              <p>Estimado/a <strong>${lead.contact_name}</strong>,</p>
              
              <p>Nos complace entregarte tu <strong>Diagnóstico Empresarial ${planName}</strong> completamente personalizado para <strong>${lead.company_name}</strong>.</p>
              
              <div class="highlight">
                <h3>📄 Tu diagnóstico incluye:</h3>
                <ul>
                  <li>✅ Análisis de tu situación financiera actual</li>
                  <li>✅ 3 oportunidades de mejora identificadas con impacto proyectado</li>
                  <li>✅ Plan de acción 30/90/180 días</li>
                  <li>✅ Estrategias tributarias aplicables</li>
                  <li>✅ Análisis de fortalezas y áreas de mejora</li>
                </ul>
              </div>
              
              <p>El documento está adjunto a este correo en formato PDF.</p>
              
              <h3>🚀 Próximos Pasos</h3>
              <p>Si quieres implementar las mejoras identificadas o profundizar en algún área específica, agenda una sesión de consultoría sin costo:</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://wa.me/56944018594?text=Hola%2C%20recib%C3%AD%20mi%20diagn%C3%B3stico%20y%20quiero%20agendar%20una%20consultor%C3%ADa" class="btn">
                  📞 Agendar Consultoría Gratuita
                </a>
              </div>
              
              <p>También puedes responder directamente a este correo con cualquier pregunta.</p>
              
              <p>Saludos cordiales,</p>
              <p><strong>Patricio Silva</strong><br>
              ACP y Asociados<br>
              Asesorías Financieras y de Negocios<br>
              📧 patricio.silva@acpasociados.cl<br>
              📱 +56 9 4401 8594</p>
            </div>
            
            <div class="footer">
              <p>ACP y Asociados - Providencia, Santiago</p>
              <p>Padre Mariano 391, Oficina 704</p>
            </div>
          </div>
        </body>
        </html>
      `,
      attachments: [
        {
          filename: `Diagnostico-${lead.company_name.replace(/\s+/g, '-')}.pdf`,
          content: pdfBase64,
        },
      ],
    });

    lead.emailSent = true;
    lead.emailSentAt = new Date().toISOString();
    lead.emailSentBy = "manual_approval";
    await leadsStore.set(leadId, JSON.stringify(lead));

    return new Response(
      `
      <!DOCTYPE html>
      <html>
      <head>
        <title>✅ Enviado - ACP Diagnóstico</title>
        <meta charset="UTF-8">
        <style>
          body { 
            font-family: system-ui, -apple-system, sans-serif; 
            max-width: 600px; 
            margin: 100px auto; 
            padding: 20px; 
            text-align: center; 
            background: linear-gradient(135deg, #ECF0F3 0%, #FFFFFF 100%);
          }
          .success { 
            background: white;
            border: 3px solid #16A085; 
            padding: 40px; 
            border-radius: 12px; 
            box-shadow: 0 10px 40px rgba(22, 160, 133, 0.2);
          }
          h1 { color: #16A085; font-size: 2.5em; margin: 0 0 20px 0; }
          .info { 
            background: #E8F5E9; 
            padding: 20px; 
            border-radius: 8px; 
            margin: 20px 0;
            text-align: left;
          }
          .info p { margin: 10px 0; color: #2C3E50; }
          .info strong { color: #1B3B5C; }
          .btn {
            display: inline-block;
            background: linear-gradient(135deg, #16A085 0%, #3498DB 100%);
            color: white;
            padding: 15px 40px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="success">
          <h1>✅ ¡Enviado!</h1>
          <p style="font-size: 1.2em; color: #2C3E50;">El diagnóstico ha sido enviado exitosamente al cliente.</p>
          
          <div class="info">
            <p><strong>Cliente:</strong> ${lead.contact_name}</p>
            <p><strong>Empresa:</strong> ${lead.company_name}</p>
            <p><strong>Email:</strong> ${lead.contact_email}</p>
            <p><strong>Plan:</strong> ${planName}</p>
            <p><strong>Fecha de envío:</strong> ${new Date().toLocaleString('es-CL')}</p>
          </div>
          
          <p style="color: #95A5A6; font-size: 0.9em; margin-top: 30px;">
            El cliente recibirá el diagnóstico en su bandeja de entrada en los próximos minutos.
          </p>
          
          <a href="mailto:${lead.contact_email}" class="btn">
            📧 Escribir al Cliente
          </a>
        </div>
      </body>
      </html>
      `,
      { 
        status: 200, 
        headers: { "Content-Type": "text/html; charset=utf-8" } 
      }
    );

  } catch (error) {
    console.error("Error en approve-and-send:", error);
    
    return new Response(
      `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Error - ACP Diagnóstico</title>
        <style>
          body { font-family: system-ui; max-width: 600px; margin: 100px auto; padding: 20px; text-align: center; }
          .error { background: #fee; border: 2px solid #e74c3c; padding: 30px; border-radius: 12px; }
          pre { text-align: left; background: #f5f5f5; padding: 15px; border-radius: 6px; overflow-x: auto; }
        </style>
      </head>
      <body>
        <div class="error">
          <h1>❌ Error al Enviar</h1>
          <p>Ocurrió un error al intentar enviar el diagnóstico.</p>
          <pre>${error.message}</pre>
          <p style="margin-top: 20px;">Contacta al administrador del sistema.</p>
        </div>
      </body>
      </html>
      `,
      { status: 500, headers: { "Content-Type": "text/html" } }
    );
  }
};

export const config: Config = {
  path: "/admin/approve-and-send",
};