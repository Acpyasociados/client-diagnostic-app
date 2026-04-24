export default async (event, context) => {
  const leadId = event.queryStringParameters?.lead_id;

  if (!leadId) {
    // Mostrar lista de todos los leads
    return await listAllLeads();
  }

  // Mostrar detalles de un lead específico
  return await viewLead(leadId);
};

async function viewLead(leadId) {
  try {
    const { getStore } = await import('@netlify/blobs');
    const store = getStore('diagnostic-leads');

    const leadData = await store.get(leadId);
    if (!leadData) {
      return htmlResponse(404, '<h1>Lead no encontrado</h1>');
    }

    const lead = JSON.parse(leadData);

    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Detalles del Diagnóstico - ${lead.company}</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 900px; margin: 0 auto; padding: 20px; background: #f5f5f5; }
          .container { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          h1 { color: #1a2d3e; border-bottom: 2px solid #d4a574; padding-bottom: 10px; }
          .section { margin: 20px 0; padding: 15px; background: #f9f9f9; border-left: 4px solid #d4a574; }
          .section h3 { margin-top: 0; color: #1a2d3e; }
          .field { margin: 10px 0; }
          .label { font-weight: bold; color: #555; }
          .value { color: #333; }
          .status { padding: 8px 12px; border-radius: 4px; font-weight: bold; }
          .status.pending { background: #fff3cd; color: #856404; }
          .status.paid { background: #d4edda; color: #155724; }
          .price { font-size: 1.2em; color: #d4a574; font-weight: bold; }
          .link-button { display: inline-block; margin-top: 20px; padding: 12px 20px; background: #d4a574; color: white; text-decoration: none; border-radius: 4px; font-weight: bold; }
          .link-button:hover { background: #c29461; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Diagnóstico de ${lead.company}</h1>

          <div class="section">
            <h3>Información del Cliente</h3>
            <div class="field"><span class="label">Nombre:</span> <span class="value">${lead.name}</span></div>
            <div class="field"><span class="label">Email:</span> <span class="value">${lead.email}</span></div>
            <div class="field"><span class="label">Teléfono:</span> <span class="value">${lead.phone}</span></div>
            <div class="field"><span class="label">Empresa:</span> <span class="value">${lead.company}</span></div>
            <div class="field"><span class="label">Rubro:</span> <span class="value">${lead.sector_label}</span></div>
          </div>

          <div class="section">
            <h3>Información del Negocio</h3>
            <div class="field"><span class="label">Ventas Mensuales:</span> <span class="value">$${Number(lead.monthly_sales).toLocaleString('es-CL')}</span></div>
            <div class="field"><span class="label">Margen Estimado:</span> <span class="value">${lead.margin}%</span></div>
            <div class="field"><span class="label">Clientes Activos:</span> <span class="value">${lead.active_clients}</span></div>
            <div class="field"><span class="label">Costos Principales:</span> <span class="value">${lead.top_costs}</span></div>
            <div class="field"><span class="label">Canal Principal:</span> <span class="value">${lead.main_channel}</span></div>
            <div class="field"><span class="label">Problema Principal:</span> <span class="value">${lead.main_problem}</span></div>
            <div class="field"><span class="label">Objetivo 6 Meses:</span> <span class="value">${lead.goal_6m}</span></div>
          </div>

          <div class="section">
            <h3>Información de Pago</h3>
            <div class="field"><span class="label">Plan:</span> <span class="value">${lead.plan === 'basico' ? 'Básico' : 'Premium'}</span></div>
            <div class="field"><span class="label">Precio Base:</span> <span class="value">$${lead.plan === 'basico' ? '49.900' : '149.900'}</span></div>
            ${lead.discount_percentage ? `<div class="field"><span class="label">Descuento:</span> <span class="value">${lead.discount_percentage}%</span></div>` : ''}
            <div class="field"><span class="label">Precio Final:</span> <span class="price">$${lead.final_price.toLocaleString('es-CL')}</span></div>
            <div class="field"><span class="label">Estado:</span> <span class="status ${lead.payment_status === 'paid' ? 'paid' : 'pending'}">${lead.payment_status === 'paid' ? 'Pagado' : 'Pendiente de Pago'}</span></div>
            <div class="field"><span class="label">Fecha:</span> <span class="value">${new Date(lead.created_at).toLocaleString('es-CL')}</span></div>
          </div>

          ${lead.payment_status === 'pending' && lead.checkout_url ? `
            <a href="${lead.checkout_url}" class="link-button">Ir a Pagar</a>
          ` : ''}
        </div>
      </body>
      </html>
    `;

    return htmlResponse(200, html);
  } catch (err) {
    console.error('Error viewing lead:', err);
    return htmlResponse(500, '<h1>Error cargando datos</h1>');
  }
}

async function listAllLeads() {
  try {
    const { getStore } = await import('@netlify/blobs');
    const store = getStore('diagnostic-leads');

    const { blobs } = await store.list();
    const leads = [];

    for (const blob of blobs) {
      try {
        const data = await store.get(blob.key);
        leads.push(JSON.parse(data));
      } catch (e) {
        console.error('Error reading lead:', blob.key, e);
      }
    }

    // Ordenar por fecha (más reciente primero)
    leads.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Leads - Diagnósticos</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; background: #f5f5f5; }
          .container { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          h1 { color: #1a2d3e; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background: #1a2d3e; color: white; padding: 12px; text-align: left; }
          td { padding: 12px; border-bottom: 1px solid #ddd; }
          tr:hover { background: #f9f9f9; }
          a { color: #d4a574; text-decoration: none; font-weight: bold; }
          a:hover { text-decoration: underline; }
          .status { padding: 4px 8px; border-radius: 3px; font-size: 0.9em; }
          .status.pending { background: #fff3cd; color: #856404; }
          .status.paid { background: #d4edda; color: #155724; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Leads de Diagnóstico</h1>
          <p>Total: ${leads.length} solicitudes</p>

          ${leads.length === 0 ? '<p>No hay leads registrados aún</p>' : `
            <table>
              <thead>
                <tr>
                  <th>Empresa</th>
                  <th>Cliente</th>
                  <th>Email</th>
                  <th>Plan</th>
                  <th>Precio</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                ${leads.map(lead => `
                  <tr>
                    <td>${lead.company}</td>
                    <td>${lead.name}</td>
                    <td>${lead.email}</td>
                    <td>${lead.plan === 'basico' ? 'Básico' : 'Premium'}</td>
                    <td>$${lead.final_price.toLocaleString('es-CL')}</td>
                    <td><span class="status ${lead.payment_status === 'paid' ? 'paid' : 'pending'}">${lead.payment_status === 'paid' ? 'Pagado' : 'Pendiente'}</span></td>
                    <td>${new Date(lead.created_at).toLocaleDateString('es-CL')}</td>
                    <td><a href="/api/view-leads?lead_id=${lead.lead_id}">Ver</a></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `}
        </div>
      </body>
      </html>
    `;

    return htmlResponse(200, html);
  } catch (err) {
    console.error('Error listing leads:', err);
    return htmlResponse(500, '<h1>Error cargando leads</h1>');
  }
}

function htmlResponse(status, html) {
  return new Response(html, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}
