/**
 * delete-my-data-confirm.js
 * ─────────────────────────────────────────────────────────────────────
 * GET /.netlify/functions/delete-my-data-confirm?code=123456
 *
 * Confirma derecho al olvido y borra TODOS los datos del usuario
 * (Ley 21.719)
 *
 * Query params:
 *   - code: código de 6 dígitos enviado por email (requerido)
 *
 * Retorna:
 *   - 200: { success: true, deleted: N, message: "..." }
 *   - 400: { error: "Código inválido o expirado" }
 *   - 500: { error: "Error al eliminar datos" }
 * ─────────────────────────────────────────────────────────────────────
 */

import { deleteAllLeadsByEmail } from './_lib/storage.js';
import { validateCode, deleteCode } from './_lib/delete-codes.js';
import { sendEmail } from './_lib/email.js';

export default async (req, context) => {
  // Solo GET
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Método no permitido' }), { status: 405 });
  }

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');

    // Validar código
    if (!code || !code.trim()) {
      return new Response(
        JSON.stringify({ error: 'Código requerido' }),
        { status: 400 }
      );
    }

    // Verificar y recuperar email asociado
    const codeData = await validateCode(code.trim());

    if (!codeData) {
      return new Response(
        JSON.stringify({ error: 'Código inválido o expirado' }),
        { status: 400 }
      );
    }

    const email = codeData.email;

    // Borrar TODOS los leads del usuario
    const result = await deleteAllLeadsByEmail(email);

    // Eliminar el código después de usarlo
    await deleteCode(code.trim());

    // Enviar email de confirmación
    try {
      await sendEmail({
        to: email,
        subject: 'Tu solicitud de derecho al olvido ha sido procesada — ACP & Asociados',
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #1a2d3e;">✅ Solicitud Completada</h2>

            <p>Hola,</p>

            <p style="background: #f0fdf4; padding: 12px; border-radius: 6px; border-left: 3px solid #27ae60;">
              <strong style="color: #27ae60;">Tu solicitud de derecho al olvido ha sido procesada exitosamente.</strong>
            </p>

            <p>Hemos eliminado <strong>${result.deleted} registro(s)</strong> de nuestro sistema conforme a la <strong>Ley 21.719</strong>.</p>

            <p style="color: #666;">
              <strong>Qué significa esto:</strong><br>
              • Tus datos personales han sido eliminados permanentemente<br>
              • No recibirás más comunicaciones nuestras<br>
              • Si en el futuro quieres trabajar con nosotros, deberás enviar tus datos nuevamente
            </p>

            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">

            <p style="color: #999; font-size: 12px;">
              Si tienes preguntas sobre este proceso, contacta a <a href="mailto:info@acpasociados.cl" style="color: #16A085;">info@acpasociados.cl</a>
            </p>

            <p style="color: #999; font-size: 11px; margin-top: 20px;">
              ACP & Asociados | Asesorías Financieras<br>
              Padre Mariano 391, Oficina 704, Providencia, Santiago
            </p>
          </div>
        `
      });
    } catch (emailErr) {
      console.warn('Email de confirmación no se pudo enviar:', emailErr);
      // No es error crítico, continuamos
    }

    return new Response(
      JSON.stringify({
        success: true,
        deleted: result.deleted,
        message: `${result.deleted} registro(s) han sido eliminados permanentemente. Verifica tu email para más detalles.`
      }),
      { status: 200 }
    );

  } catch (err) {
    console.error('Error en delete-my-data-confirm:', err);

    return new Response(
      JSON.stringify({
        error: 'Error al procesar la eliminación. Contacta a info@acpasociados.cl'
      }),
      { status: 500 }
    );
  }
};
