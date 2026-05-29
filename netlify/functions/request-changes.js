import { getLead, saveLead } from './_lib/storage.js';

export default async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'Solo POST' });

  const raw = typeof req.text === 'function' ? await req.text() : (req.body || '{}');
  const { lead_id: leadId, token, notes } = JSON.parse(raw);

  if (!leadId || !token || !notes) return json(400, { error: 'Faltan parametros' });
  if (token !== process.env.ADMIN_REVIEW_TOKEN) return json(403, { error: 'Token invalido' });

  const lead = await getLead(leadId);
  if (!lead) return json(404, { error: 'Lead no encontrado' });

  lead.review_notes    = notes;
  lead.status          = 'cambios_solicitados';
  lead.changes_requested_at = new Date().toISOString();

  await saveLead(leadId, lead);
  console.log('[request-changes] Cambios guardados para lead:', leadId);

  return json(200, { ok: true });
};

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}
