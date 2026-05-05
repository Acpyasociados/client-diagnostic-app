import { getLead } from './_lib/storage.js';
import { questionnaires } from './_lib/questions.js';

export default async (req) => {
  const url = new URL(req.url);
  const leadId = url.searchParams.get('lead_id');
  const token = url.searchParams.get('token');
  if (!leadId || !token) return json(400, { error: 'Faltan parámetros' });
  const lead = await getLead(leadId);
  if (!lead) return json(404, { error: 'Caso no encontrado' });
  if (lead.client_token !== token) return json(403, { error: 'Token inválido' });
  if (lead.payment_status !== 'approved') return json(400, { error: 'El pago aún no está aprobado' });
  return json(200, { lead, questions: questionnaires[lead.sector] || [] });
};

function json(statusCode, body) {
  return new Response(JSON.stringify(body), { status: statusCode, headers: { 'Content-Type': 'application/json' } });
}
