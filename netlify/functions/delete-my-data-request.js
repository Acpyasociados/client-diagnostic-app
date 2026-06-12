/**
 * delete-my-data-request.js
 * ─────────────────────────────────────────────────────────────────────
 * POST /.netlify/functions/delete-my-data-request
 *
 * Solicita derecho al olvido (Ley 21.719)
 *
 * Body: { email: "user@example.com" }
 *
 * Retorna:
 *   - 200: { success: true, message: "Código enviado a email" }
 *   - 400: { error: "Email no encontrado en nuestros registros" }
 *   - 500: { error: "Error al enviar email" }
 * ─────────────────────────────────────────────────────────────────────
 */

import { findAllLeadsByEmail } from './_lib/storage.js';
import { generateCode, saveCode } from './_lib/delete-codes.js';
import { sendEmail } from './_lib/email.js';

export default async (req, context) => {
  // Solo POST
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Método no permitido' }), { status: 405 });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { email } = body;

    // Validar email
    if (!email || !email.trim()) {
      return new Response(
        JSON.stringify({ error: 'Email es requerido' }),
        { status: 400 }
      );
    }

    const emailNorm = email.toLowerCase().trim();

    // Verificar que el email exista en nuestros registros
    const leads = await findAllLeadsByEmail(emailNorm);

    if (leads.length === 0) {
      // No decimos "email no encontrado" por privacidad (previene enumeración)
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Si el email está registrado, recibirás un código en tu bandeja'
        }),
        { status: 200 }
      );
    }

    // Generar código de 6 dígitos
    const code = generateCode();

    // Guardar código con expiración (15 min)
    await saveCode(emailNorm, code);

    // Construir link de confirmación
    const deleteLink = `${process.env.SITE_URL || 'https://acp-asociados.netlify.app'}/delete-account.html?code=${code}`;

    // Enviar email con código
    await sendEmail({
      to: emailNorm,
      subject: 'Confirma tu solicitud de derecho al olvido — ACP & Asociados',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1a2d3e;">Solicitud de Derecho al Olvido</h2>

          <p>Hola,</p>

          <p>Recibimos una solicitud para eliminar todos tus datos de nuestros registros conforme a la <strong>Ley 21.719 (Derecho al Olvido)</strong>.</p>

          <p style="background: #f0faf8; padding: 12px; border-radius: 6px; border-left: 3px solid #16A085;">
            <strong>Tu código de verificación:</strong><br>
            <span style="font-size: 24px; font-weight: bold; color: #16A085; letter-spacing: 2px;">${code}</span>
          </p>

          <p style="margin-bottom: 10px;">O haz click en este link:</p>
          <p><a href="${deleteLink}" style="display: inline-block; background: #16A085; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">Confirmar Eliminación de Datos</a></p>

          <p style="color: #999; font-size: 12px;">Este código expira en 15 minutos.</p>

          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">

          <p style="color: #666; font-size: 12px;">
            <strong>¿No solicitaste esto?</strong><br>
            Si no pediste eliminar tu cuenta, ignora este email. Tus datos seguirán protegidos.
          </p>

          <p style="color: #999; font-size: 11px; margin-top: 20px;">
            ACP & Asociados | Asesorías Financieras<br>
            Padre Mariano 391, Oficina 704, Providencia, Santiago<br>
            <a href="mailto:info@acpasociados.cl" style="color: #16A085;">info@acpasociados.cl</a>
          </p>
        </div>
      `
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Código enviado a tu email. Válido por 15 minutos.'
      }),
      { status: 200 }
    );

  } catch (err) {
    console.error('Error en delete-my-data-request:', err);

    return new Response(
      JSON.stringify({
        error: 'Error al procesar tu solicitud. Intenta de nuevo o contacta a info@acpasociados.cl'
      }),
      { status: 500 }
    );
  }
};
