import { getLead } from './_lib/storage.js';

export default async (req) => {
  const url = new URL(req.url);
  const leadId = url.searchParams.get('lead_id');
  const token = url.searchParams.get('token');
  if (!leadId || !token) return json(400, { error: 'Faltan parámetros' });
  if (token !== process.env.ADMIN_REVIEW_TOKEN) return json(403, { error: 'Token inválido' });
  const lead = await getLead(leadId);
  if (!lead) return json(404, { error: 'Caso no encontrado' });
  return json(200, { lead, report_html: lead.report_html || '<p>No hay borrador.</p>' });
};

function json(statusCode, body) {
  return new Response(JSON.stringify(body), { status: statusCode, headers: { 'Content-Type': 'application/json' } });
}
