import { getStore } from '@netlify/blobs';

const STORE_NAME = 'diagnostic-leads';

export async function saveLead(leadId, data) {
  const store = getStore(STORE_NAME);
  await store.set(leadId, JSON.stringify(data, null, 2));
  return data;
}

export async function getLead(leadId) {
  const store = getStore(STORE_NAME);
  const data = await store.get(leadId);
  return data ? JSON.parse(data) : null;
}

/**
 * Busca un lead reciente y aún no pagado del mismo cliente (email + empresa)
 * para evitar crear registros duplicados cuando alguien reintenta el envío
 * del formulario (doble clic, botón "atrás", recarga, error de Flow, etc.).
 *
 * Solo reutiliza leads creados dentro de la ventana de tiempo indicada
 * (por defecto 24h) y cuyo pago todavía esté pendiente — un lead ya pagado
 * o con cuestionario en curso NUNCA se reutiliza ni se sobrescribe.
 *
 * @returns {Promise<object|null>} el lead existente reutilizable, o null
 */
export async function findRecentPendingLead(email, company, maxAgeHours = 24) {
  if (!email || !company) return null;

  const store = getStore(STORE_NAME);
  const { blobs } = await store.list();
  const cutoff = Date.now() - maxAgeHours * 60 * 60 * 1000;

  const normEmail   = String(email).trim().toLowerCase();
  const normCompany = String(company).trim().toLowerCase();

  let candidate = null;
  for (const { key } of blobs) {
    const data = await store.get(key);
    if (!data) continue;

    let lead;
    try { lead = JSON.parse(data); } catch (e) { continue; }

    if ((lead.email || '').trim().toLowerCase() !== normEmail) continue;
    if ((lead.company || '').trim().toLowerCase() !== normCompany) continue;
    if (lead.payment_status !== 'pending') continue; // ya pagó o falló: no tocar
    if (!lead.created_at || new Date(lead.created_at).getTime() < cutoff) continue;

    // Si hay varios candidatos, nos quedamos con el más reciente
    if (!candidate || new Date(lead.created_at) > new Date(candidate.created_at)) {
      candidate = lead;
    }
  }

  return candidate;
}
