/**
 * dev-simulate-payment.js
 * ─────────────────────────────────────────────────────────
 * Función de prueba: crea un lead de test con pago aprobado
 * y dispara todo el flujo post-pago (emails + cuestionario).
 *
 * PROTEGIDA por ADMIN_REVIEW_TOKEN — nunca exponer públicamente.
 *
 * POST /.netlify/functions/dev-simulate-payment
 * Body JSON: { token, email?, name?, company?, sector? }
 */

import crypto from 'crypto';
import { saveLead } from './_lib/storage.js';

async function sendEmail({ to, subject, html }) {
  // La clave en Netlify (SENDGRID_API_KEY) es en realidad una clave Resend (re_...)
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    console.warn('SENDGRID_API_KEY no configurada - email omitido para:', to);
    return false;
  }
  const fromEmail = 'patricio.silva@acpasociados.cl';
  const payload = {
    personalizations: [{ to: [{ email: to }], subject }],
    from: { email: fromEmail, name: 'ACP & Asociados' },
    content: [{ type: 'text/html', value: html }]
  };
  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (res.ok) { console.log('Email enviado a:', to); return true; }
  const errText = await res.text();
  console.error('SendGrid error:', res.status, errText.substring(0, 300));
  return false;
}

export default async (event) => {
  const method = (event.method || event.httpMethod || '').toUpperCase();
  if (method !== 'POST') return json(405, { error: 'Solo POST' });

  // Parse body
  let body = {};
  try {
    const raw = typeof event.text === 'function' ? await event.text()
              : typeof event.body === 'string' ? event.body
              : JSON.stringify(event.body || {});
    body = JSON.parse(raw || '{}');
  } catch (e) {
    return json(400, { error: 'Body JSON inválido' });
  }

  // Verificar token admin
  const adminToken = process.env.ADMIN_REVIEW_TOKEN;
  if (!adminToken || body.token !== adminToken) {
    return json(403, { error: 'Token inválido' });
  }

  const siteUrl = process.env.SITE_URL || 'https://acp-asociados.netlify.app';

  // ── Crear lead de prueba ──────────────────────────────────
  const leadId      = crypto.randomUUID();
  const clientToken = crypto.randomBytes(18).toString('hex');

  const sector    = body.sector   || 'servicios_terreno';
  const plan      = body.plan     || 'basico';
  const email     = body.email    || 'test@acpasociados.cl';
  const name      = body.name     || 'Cliente Test';
  const company   = body.company  || 'Empresa de Prueba SpA';
  const finalPrice = plan === 'premium' ? 149900 : 49900;

  const sectorLabels = {
    servicios_profesionales: 'Servicios profesionales',
    comercio_ecommerce:      'Comercio / e-commerce',
    servicios_terreno:       'Servicios en terreno'
  };

  const lead = {
    lead_id:                 leadId,
    client_token:            clientToken,
    created_at:              new Date().toISOString(),

    // Estado: pago ya aprobado
    status:                  'pagado',
    payment_status:          'approved',
    payment_provider:        'flow',
    paid_at:                 new Date().toISOString(),
    flow_reference:          'TEST-SIMULADO-' + leadId.slice(0, 8),

    // Datos del cliente
    name,
    email,
    phone:                   '+56 9 1234 5678',
    company,
    sector,
    sector_label:            sectorLabels[sector] || sector,
    monthly_sales:           12000000,
    margin:                  28,
    active_clients:          45,
    tax_regime:              'primera_categoria',
    top_costs:               'Personal, combustible y mantención',
    digital_presence:        'redes_sociales',
    tax_advisor:             'contador_externo',
    main_problem:            'Dificultad para conseguir nuevos clientes y fidelizar los existentes',
    goal_6m:                 'Aumentar ventas un 20% y reducir costos operativos',

    // Plan y precio
    plan,
    discount_percentage:     0,
    final_price:             finalPrice,

    // Flags de pipeline
    questionnaire_sent:      false,
    questionnaire_completed: false,
    draft_generated:         false,
    reviewed_by_human:       false,
    delivered_at:            null,

    _is_test:                true
  };

  await saveLead(leadId, lead);
  console.log('[TEST] Lead creado:', leadId);

  // ── URLs ──────────────────────────────────────────────────
  const questionnaireUrl = `${siteUrl}/questionnaire.html?lead_id=${leadId}&token=${clientToken}`;
  const reviewUrl        = `${siteUrl}/review.html?lead_id=${leadId}&token=${adminToken}`;
  const adminUrl         = `${siteUrl}/admin.html`;

  // ── Email 1: Cuestionario al cliente ─────────────────────
  const questionnaireHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <div style="background: #1a3a5c; padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">ACP & Asociados</h1>
        <p style="color: #a8d4f5; margin: 8px 0 0 0; font-size: 14px;">Diagnóstico Empresarial</p>
      </div>
      <div style="background: white; padding: 32px; border: 1px solid #e0e0e0; border-radius: 0 0 8px 8px;">
        <p style="font-size: 18px; font-weight: bold; color: #1a3a5c;">¡Hola ${name}!</p>
        <p>Tu pago fue confirmado con éxito. Ahora necesitamos que completes un breve cuestionario sectorial para que podamos <strong>personalizar tu diagnóstico empresarial</strong>.</p>
        <div style="background: #f0f7ff; border-left: 4px solid #1a3a5c; padding: 16px; margin: 24px 0; border-radius: 4px;">
          <p style="margin: 0; font-size: 14px; color: #555;">
            ⏱ Tiempo estimado: <strong>5–10 minutos</strong><br>
            📋 Empresa: <strong>${company}</strong><br>
            📦 Plan contratado: <strong>${plan === 'basico' ? 'Básico' : 'Premium'}</strong>
          </p>
        </div>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${questionnaireUrl}" style="background: #1a3a5c; color: white; padding: 16px 40px; border-radius: 6px; text-decoration: none; font-size: 16px; font-weight: bold; display: inline-block;">
            Completar Cuestionario →
          </a>
        </div>
        <p style="font-size: 13px; color: #888; text-align: center;">
          O copia este enlace:<br>
          <a href="${questionnaireUrl}" style="color: #1a3a5c; font-size: 12px; word-break: break-all;">${questionnaireUrl}</a>
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
        <p style="font-size: 13px; color: #999; margin: 0;">
          ¿Tienes preguntas? Escríbenos a <a href="mailto:patricio.silva@acpasociados.cl" style="color: #1a3a5c;">patricio.silva@acpasociados.cl</a>
        </p>
      </div>
    </div>`;

  let emailClientOk = false;
  try {
    emailClientOk = await sendEmail({
      to: email,
      subject: `[ACP & Asociados] Completa tu cuestionario - ${company}`,
      html: questionnaireHtml
    });
    if (emailClientOk) {
      lead.questionnaire_email_sent_at = new Date().toISOString();
      await saveLead(leadId, lead);
    }
  } catch (e) {
    console.error('Error enviando email cliente:', e.message);
  }

  // ── Email 2: Notificación al asesor ───────────────────────
  const advisorHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <div style="background: #1a3a5c; padding: 24px 30px; border-radius: 8px 8px 0 0;">
        <h2 style="color: white; margin: 0; font-size: 20px;">🧪 [TEST] Pago Simulado</h2>
        <p style="color: #a8d4f5; margin: 6px 0 0 0; font-size: 13px;">Esta es una prueba E2E del sistema.</p>
      </div>
      <div style="background: white; padding: 28px; border: 1px solid #e0e0e0; border-radius: 0 0 8px 8px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr><td style="padding: 8px 0; color: #666; width: 40%;">Cliente</td><td style="padding: 8px 0; font-weight: bold;">${name}</td></tr>
          <tr><td style="padding: 8px 0; color: #666;">Email</td><td style="padding: 8px 0;">${email}</td></tr>
          <tr><td style="padding: 8px 0; color: #666;">Empresa</td><td style="padding: 8px 0;">${company}</td></tr>
          <tr><td style="padding: 8px 0; color: #666;">Rubro</td><td style="padding: 8px 0;">${sectorLabels[sector] || sector}</td></tr>
          <tr><td style="padding: 8px 0; color: #666;">Plan</td><td style="padding: 8px 0;">${plan === 'basico' ? 'Básico' : 'Premium'}</td></tr>
          <tr><td style="padding: 8px 0; color: #666;">Monto</td><td style="padding: 8px 0; font-weight: bold; color: #28a745;">$${finalPrice.toLocaleString('es-CL')} CLP (TEST)</td></tr>
        </table>
        <div style="margin-top: 24px; padding: 16px; background: #fff8e1; border-left: 4px solid #f0ad00; border-radius: 4px; font-size: 13px; color: #555;">
          📋 El cuestionario fue enviado al cliente. Cuando lo complete, recibirás el borrador para revisión.
        </div>
        <div style="text-align: center; margin-top: 24px;">
          <a href="${adminUrl}" style="background: #1a3a5c; color: white; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: bold; display: inline-block;">
            Ver Panel de Seguimiento →
          </a>
        </div>
      </div>
    </div>`;

  let emailAdvisorOk = false;
  try {
    emailAdvisorOk = await sendEmail({
      to: 'asesor.pac@gmail.com',
      subject: `[ACP TEST] Pago simulado - ${company}`,
      html: advisorHtml
    });
  } catch (e) {
    console.error('Error enviando email asesor:', e.message);
  }

  // ── Respuesta ─────────────────────────────────────────────
  return json(200, {
    ok: true,
    message: '✅ Lead de prueba creado con pago aprobado',
    lead_id: leadId,
    emails: {
      cliente:  { to: email,                  enviado: emailClientOk },
      asesor:   { to: 'asesor.pac@gmail.com',  enviado: emailAdvisorOk }
    },
    urls: {
      cuestionario: questionnaireUrl,
      revision:     reviewUrl,
      admin:        adminUrl
    },
    instrucciones: [
      '1. Abre la URL "cuestionario" para completar el formulario del cliente',
      '2. Al enviar, recibirás en el email del asesor el link para revisar el borrador',
      '3. En "revision" puedes ver y aprobar el informe antes de enviarlo',
      '4. En "admin" puedes seguir el estado del lead en tiempo real'
    ]
  });
};

function json(status, body) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}
