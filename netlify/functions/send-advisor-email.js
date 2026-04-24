export async function sendAdvisorEmail(lead) {
  const apiKey = process.env.SENDGRID_API_KEY;
  const advisorEmail = 'asesor.pac@gmail.com';

  if (!apiKey) {
    console.warn('SENDGRID_API_KEY no configurada');
    return false;
  }

  const emailContent = `
    <h2>Nueva Solicitud de Diagnóstico</h2>
    <p><strong>Cliente:</strong> ${lead.name}</p>
    <p><strong>Email:</strong> ${lead.email}</p>
    <p><strong>Teléfono:</strong> ${lead.phone}</p>
    <p><strong>Empresa:</strong> ${lead.company}</p>
    <p><strong>Rubro:</strong> ${lead.sector_label}</p>
    <p><strong>Ventas Mensuales:</strong> $${Number(lead.monthly_sales).toLocaleString('es-CL')}</p>
    <p><strong>Margen:</strong> ${lead.margin}%</p>
    <p><strong>Plan:</strong> ${lead.plan === 'basico' ? 'Básico ($49.900)' : 'Premium ($149.900 + $19.900/mes)'}</p>
    <p><strong>Precio Final:</strong> $${lead.final_price.toLocaleString('es-CL')}</p>
    ${lead.discount_percentage ? `<p><strong>Descuento Aplicado:</strong> ${lead.discount_percentage}%</p>` : ''}
    <p><strong>Estado de Pago:</strong> ${lead.payment_status}</p>
    <p><strong>Fecha:</strong> ${new Date(lead.created_at).toLocaleString('es-CL')}</p>

    <hr>
    <h3>Información del Negocio</h3>
    <p><strong>Clientes Activos:</strong> ${lead.active_clients}</p>
    <p><strong>Costos Principales:</strong> ${lead.top_costs}</p>
    <p><strong>Canal Principal:</strong> ${lead.main_channel}</p>
    <p><strong>Problema Principal:</strong> ${lead.main_problem}</p>
    <p><strong>Objetivo 6 Meses:</strong> ${lead.goal_6m}</p>

    <hr>
    <p><a href="${process.env.SITE_URL}/leads/${lead.lead_id}">Ver detalles del lead</a></p>
  `;

  const payload = {
    personalizations: [{
      to: [{ email: advisorEmail }],
      subject: `Nueva solicitud de diagnóstico - ${lead.company}`
    }],
    from: {
      email: 'noreply@acpyasociados.com',
      name: 'Sistema de Diagnóstico'
    },
    content: [{
      type: 'text/html',
      value: emailContent
    }]
  };

  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      console.log('Email enviado al asesor:', advisorEmail);
      return true;
    } else {
      console.error('Error enviando email:', response.status, response.statusText);
      return false;
    }
  } catch (err) {
    console.error('Error en SendGrid:', err.message);
    return false;
  }
}
