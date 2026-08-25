import { getLead } from './_lib/storage.js';
import { questionnaires, baseQuestions } from './_lib/questions.js';

export default async (req) => {
  const url = new URL(req.url);
  const leadId = url.searchParams.get('lead_id');
  const token = url.searchParams.get('token');
  if (!leadId || !token) return json(400, { error: 'Faltan parámetros' });
  const lead = await getLead(leadId);
  if (!lead) return json(404, { error: 'Caso no encontrado' });
  if (lead.client_token !== token) return json(403, { error: 'Token inválido' });
  if (lead.payment_status !== 'approved') return json(400, { error: 'El pago aún no está aprobado' });
  // Fallback de 2 niveles: cuestionario del sector -> preguntas base genéricas.
  // Antes esto caía en [] para 7 de los 10 rubros del formulario y el cliente
  // recibía un cuestionario vacío que igual se podía enviar sin responder nada
  // (bug detectado en prueba real el 2026-06-06, sector "manufactura").
  const questions = questionnaires[lead.sector] || baseQuestions;
  return json(200, { lead, questions });
};

function json(statusCode, body) {
  return new Response(JSON.stringify(body), { status: statusCode, headers: { 'Content-Type': 'application/json' } });
}
