import { sendEmail } from './_lib/email.js';

export default async (req, context) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const data = await req.json();

    // Map form data to lead object
    const lead = {
      lead_id: `lead_${Date.now()}`,
      name: data.name || '',
      email: data.email || '',
      phone: data.phone || '',
      company_name: data.company_name || '',
      company_rut: data.company_rut || '',
      industry: data.industry || '',
      monthly_income: data.monthly_income || 0,
      profit_margin: data.profit_margin || 0,
      active_clients: data.active_clients || 0,
      tax_regime: data.tax_regime || '',
      top_costs: data.top_costs || '',
      digital_presence: data.digital_presence || '',
      advisor_name: data.advisor_name || '',
      main_challenge: data.main_challenge || '',
      goal_6m: data.goal_6m || '',
      plan: data.plan?.toLowerCase() === 'premium' ? 'premium' : 'basico',
      final_price: data.plan?.toLowerCase() === 'premium' ? 149900 : 49900,
      discount_percentage: data.discount || null,
      payment_status: 'Pendiente',
      created_at: new Date().toISOString()
    };

    // Prepare email content
    const emailContent = `
    <h2>Nueva Solicitud de Diagnóstico</h2>
    <p><strong>Cliente:</strong> ${lead.name}</p>
    <p><strong>Email:</strong> ${lead.email}</p>
    <p><strong>Teléfono:</strong> ${lead.phone}</p>
    <p><strong>Empresa:</strong> ${lead.company_name}</p>
    <p><strong>RUT:</strong> ${lead.company_rut}</p>
    <p><strong>Rubro:</strong> ${lead.industry}</p>
    <p><strong>Ventas Mensuales:</strong> $${Number(lead.monthly_income).toLocaleString('es-CL')}</p>
    <p><strong>Margen:</strong> ${lead.profit_margin}%</p>
    <p><strong>Clientes Activos:</strong> ${lead.active_clients}</p>
    <p><strong>Costos Principales:</strong> ${lead.top_costs}</p>
    <p><strong>Presencia Digital:</strong> ${lead.digital_presence}</p>
    <p><strong>Desafío Principal:</strong> ${lead.main_challenge}</p>
    <p><strong>Objetivo 6 Meses:</strong> ${lead.goal_6m}</p>
    <p><strong>Plan:</strong> ${lead.plan === 'basico' ? 'Básico ($49.900)' : 'Premium ($149.900 + $19.900/mes)'}</p>
    <p><strong>Precio Final:</strong> $${lead.final_price.toLocaleString('es-CL')}</p>
    ${lead.discount_percentage ? `<p><strong>Descuento Aplicado:</strong> ${lead.discount_percentage}%</p>` : ''}
    <p><strong>Estado de Pago:</strong> ${lead.payment_status}</p>
    <p><strong>Fecha:</strong> ${new Date(lead.created_at).toLocaleString('es-CL')}</p>
    `;

    // Send email to advisor
    try {
      const advisorEmail = process.env.ADVISOR_EMAIL || 'asesor.pac@gmail.com';
      await sendEmail({
        to: advisorEmail,
        subject: `Nueva solicitud de diagnóstico - ${lead.company_name}`,
        html: emailContent
      });
      console.log('Email enviado al asesor:', advisorEmail);
    } catch (emailError) {
      console.warn('Email no pudo ser enviado:', emailError.message);
      // Continue anyway, don't fail the entire request
    }

    // Generate Mercado Pago preference
    const preference = {
      items: [
        {
          title: lead.plan === 'premium' ? 'Diagnóstico Premium' : 'Diagnóstico Básico',
          unit_price: lead.final_price,
          quantity: 1,
          currency_id: 'CLP'
        }
      ],
      payer: {
        name: lead.name,
        email: lead.email,
        phone: {
          number: lead.phone
        }
      },
      notification_url: `${process.env.SITE_URL}/.netlify/functions/mercadopago-webhook`,
      external_reference: lead.lead_id,
      back_urls: {
        success: `${process.env.SITE_URL}/?success=true&lead=${lead.lead_id}`,
        pending: `${process.env.SITE_URL}/?pending=true`,
        failure: `${process.env.SITE_URL}/?failure=true`
      }
    };

    // Create Mercado Pago preference
    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(preference)
    });

    if (!mpResponse.ok) {
      const error = await mpResponse.json();
      console.error('Mercado Pago error:', error);
      return new Response(JSON.stringify({
        error: 'Error creando preferencia de pago',
        details: error
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const mpData = await mpResponse.json();
    const mercadoPagoUrl = mpData.init_point;

    return new Response(JSON.stringify({
      success: true,
      lead_id: lead.lead_id,
      mercadoPagoUrl: mercadoPagoUrl,
      message: 'Orden creada exitosamente'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error en create-diagnostic-order:', error);
    return new Response(JSON.stringify({
      error: 'Error procesando la solicitud',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
