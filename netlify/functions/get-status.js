/**
 * get-status.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Endpoint público (para el cliente) que devuelve el estado actual de su
 * solicitud de informe, validando el client_token.
 *
 * NO expone datos del informe ni información sensible del lead.
 * Solo devuelve: estado del pipeline, timestamps y mensajes amigables.
 *
 * GET /.netlify/functions/get-status?lead_id=XXX&token=YYY
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { getLead } from './_lib/storage.js';

const STATUS_INFO = {
  lead_creado: {
    label:    'Solicitud recibida',
    message:  'Hemos recibido tu solicitud. Estamos esperando la confirmación del pago.',
    step:     1,
    icon:     '📝',
    done:     false,
  },
  pagado: {
    label:    'Pago confirmado',
    message:  'Tu pago fue procesado. Recibirás un email con el cuestionario en breves momentos.',
    step:     2,
    icon:     '✅',
    done:     false,
  },
  cuestionario_completado: {
    label:    'Cuestionario completado',
    message:  'Recibimos tus respuestas. Estamos generando tu informe personalizado.',
    step:     3,
    icon:     '📋',
    done:     false,
  },
  borrador_listo: {
    label:    'Informe en revisión',
    message:  'Tu informe fue generado y está siendo revisado por tu asesor ACP. Te notificaremos cuando esté listo.',
    step:     4,
    icon:     '🔍',
    done:     false,
  },
  cambios_solicitados: {
    label:    'Informe en revisión',
    message:  'Tu asesor está incorporando mejoras a tu informe. Te notificaremos cuando esté listo.',
    step:     4,
    icon:     '🔄',
    done:     false,
  },
  enviado: {
    label:    'Informe entregado',
    message:  'Tu informe fue enviado a tu email. ¡Revisa tu bandeja de entrada!',
    step:     5,
    icon:     '🎉',
    done:     true,
  },
  payment_failed: {
    label:    'Pago no completado',
    message:  'Tu pago no pudo ser procesado. Puedes intentarlo nuevamente.',
    step:     0,
    icon:     '❌',
    done:     false,
  },
};

export default async (req) => {
  const url      = new URL(req.url);
  const leadId   = url.searchParams.get('lead_id');
  const token    = url.searchParams.get('token');

  if (!leadId || !token) return json(400, { error: 'Parámetros incompletos' });

  const lead = await getLead(leadId).catch(() => null);
  if (!lead)                        return json(404, { error: 'Solicitud no encontrada' });
  if (lead.client_token !== token)  return json(403, { error: 'Token inválido' });

  const info = STATUS_INFO[lead.status] || {
    label:   lead.status,
    message: 'Procesando tu solicitud…',
    step:    1,
    icon:    '⏳',
    done:    false,
  };

  // Timeline de pasos completados
  const timeline = [
    {
      step:    1,
      label:   'Solicitud recibida',
      done:    true,
      ts:      lead.created_at || null,
    },
    {
      step:    2,
      label:   'Pago confirmado',
      done:    ['pagado','cuestionario_completado','borrador_listo','cambios_solicitados','enviado'].includes(lead.status),
      ts:      lead.paid_at || null,
    },
    {
      step:    3,
      label:   'Cuestionario completado',
      done:    ['cuestionario_completado','borrador_listo','cambios_solicitados','enviado'].includes(lead.status),
      ts:      lead.questionnaire_completed_at || null,
    },
    {
      step:    4,
      label:   'Informe en revisión',
      done:    ['borrador_listo','cambios_solicitados','enviado'].includes(lead.status),
      ts:      lead.draft_generated_at || null,
    },
    {
      step:    5,
      label:   'Informe entregado',
      done:    lead.status === 'enviado',
      ts:      lead.delivered_at || null,
    },
  ];

  return json(200, {
    company:   lead.company,
    name:      lead.name,
    plan:      lead.plan || 'basico',
    status:    lead.status,
    info,
    timeline,
    isPremium: (lead.plan || '').toLowerCase() === 'premium',
  });
};

function json(status, body) {
  const origin = process.env.SITE_URL || 'https://acp-asociados.netlify.app';
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type':                'application/json',
      'Access-Control-Allow-Origin': origin,
    }
  });
}
