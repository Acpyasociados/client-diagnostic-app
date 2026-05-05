import { sendAdvisorEmail } from './_lib/email.js';

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
      name: data.name,
      email: data.email,
      phone: data.phone,
      company: data.company_name,
      rut: data.company_rut,
      sector: data.industry,
      sector_label: data.industry || 'No especificado',
      monthly_sales: data.monthly_income || 0,
      margin: data.profit_margin || 0,
      active_clients: data.active_clients || 0,
      tax_regime: data.tax_regime || '',
      top_costs: data.top_costs || '',
      main_channel: data.digital_presence === 'si' ? 'Digital' : 'Sin presencia digital',
      advisor_name: data.advisor_name || '',
      main_problem: data.main_challenge || '',
      goal_6m: data.goal_6m || '',
      plan: data.plan?.toLowerCase() === 'premium' ? 'premium' : 'basico',
      final_price: data.plan?.toLowerCase() === 'premium' ? 149900 : 49900,
      discount_percentage: data.discount || null,
      payment_status: 'Pendiente',
      created_at: new Date().toISOString()
    };

    // Send email to advisor
    const emailSent = await sendAdvisorEmail(lead);

    if (!emailSent) {
      console.warn('Email no pudo ser enviado, continuando con el orden');
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
