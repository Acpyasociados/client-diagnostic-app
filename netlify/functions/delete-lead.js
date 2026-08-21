/**
 * delete-lead.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Borra UN lead puntual desde el panel de administración (admin.html).
 * Pensado para leads atascados que el asesor decide no seguir gestionando
 * (ej: pagó pero nunca completó el cuestionario y no responde a los recordatorios).
 *
 * No reemplaza a cleanup-test-leads.js (borrado masivo de pruebas) ni a
 * cleanup-old-leads.js (borrado automático > 1 año, Ley 21.719). Este es el
 * único punto de borrado individual controlado por el asesor.
 *
 * POST /.netlify/functions/delete-lead
 * Body: { lead_id, token, confirm: true }
 *
 * Antes de borrar, guarda una copia de los datos del lead en el store
 * 'audit-log' (igual que deleteAllLeadsByEmail en _lib/storage.js), para que
 * el borrado quede trazado aunque sea una acción manual.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { getStore } from '@netlify/blobs';
import { getLead, deleteLead } from './_lib/storage.js';

export default async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'Solo POST' });

  const raw = typeof req.text === 'function' ? await req.text() : (req.body || '{}');
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    return json(400, { error: 'Body inválido' });
  }

  const { lead_id: leadId, token, confirm } = parsed;

  if (!leadId || !token) return json(400, { error: 'Faltan parámetros' });
  if (token !== process.env.ADMIN_REVIEW_TOKEN) return json(403, { error: 'Token inválido' });
  if (confirm !== true) return json(400, { error: 'Falta confirmación explícita (confirm: true)' });

  try {
    const lead = await getLead(leadId);
    if (!lead) return json(404, { error: 'Lead no encontrado' });

    // Auditoría ANTES de borrar: si el borrado falla a mitad de camino,
    // igual queda registro de qué se intentó borrar y por quién se disparó.
    const auditStore = getStore('audit-log');
    const auditEntry = {
      action: 'delete-lead-manual',
      lead_id: leadId,
      name: lead.name || null,
      email: lead.email || null,
      company: lead.company || null,
      payment_status: lead.payment_status || null,
      status: lead.status || null,
      final_price: lead.final_price || null,
      created_at: lead.created_at || null,
      deleted_at: new Date().toISOString()
    };
    await auditStore.set(
      `audit-delete-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      JSON.stringify(auditEntry, null, 2)
    );

    await deleteLead(leadId);

    console.log(`[delete-lead] Borrado manual: ${leadId} (${lead.company || '—'} / ${lead.email || '—'})`);

    return json(200, {
      ok: true,
      deleted: { lead_id: leadId, name: lead.name, email: lead.email, company: lead.company }
    });
  } catch (err) {
    console.error('[delete-lead] Error:', err);
    return json(500, { error: err.message });
  }
};

function json(status, body) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}
