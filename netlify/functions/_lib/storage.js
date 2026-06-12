import { getStore } from '@netlify/blobs';
import { encryptObject, decryptObject } from './encryption.js';

const STORE_NAME = 'diagnostic-leads';

export async function saveLead(leadId, data) {
  const store = getStore(STORE_NAME);
  // Encripta email, name, company antes de guardar
  const encrypted = encryptObject(data);
  await store.set(leadId, JSON.stringify(encrypted, null, 2));
  return data; // Retorna original sin encriptar
}

export async function getLead(leadId) {
  const store = getStore(STORE_NAME);
  const data = await store.get(leadId);
  if (!data) return null;
  const encrypted = JSON.parse(data);
  // Desencripta al recuperar
  return decryptObject(encrypted);
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

    // Desencripta al comparar
    lead = decryptObject(lead);

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

/**
 * Busca TODOS los leads de un email específico
 * (Derecho al olvido - Ley 21.719)
 */
export async function findAllLeadsByEmail(email) {
  if (!email) return [];

  const store = getStore(STORE_NAME);
  const { blobs } = await store.list();
  const normEmail = String(email).trim().toLowerCase();

  const leads = [];
  for (const { key } of blobs) {
    const data = await store.get(key);
    if (!data) continue;

    let lead;
    try { lead = JSON.parse(data); } catch (e) { continue; }

    // Desencripta para comparar email
    lead = decryptObject(lead);

    if ((lead.email || '').trim().toLowerCase() === normEmail) {
      leads.push({ id: key, data: lead });
    }
  }

  return leads;
}

/**
 * Borra un lead específico por ID
 * (Derecho al olvido - Ley 21.719)
 */
export async function deleteLead(leadId) {
  const store = getStore(STORE_NAME);
  await store.delete(leadId);
  return true;
}

/**
 * Borra TODOS los leads de un email
 * Registra la acción en auditoría
 * @returns {Promise<{deleted: number, timestamp: string}>}
 */
export async function deleteAllLeadsByEmail(email) {
  const leads = await findAllLeadsByEmail(email);

  for (const { id } of leads) {
    await deleteLead(id);
  }

  // Registra en auditoría
  const auditStore = getStore('audit-log');
  const auditEntry = {
    action: 'delete-by-email',
    email: email.toLowerCase().trim(),
    leadsDeleted: leads.length,
    timestamp: new Date().toISOString(),
    deletedIds: leads.map(l => l.id)
  };
  await auditStore.set(`audit-${Date.now()}-${Math.random().toString(36).slice(2)}`, JSON.stringify(auditEntry));

  return {
    deleted: leads.length,
    timestamp: new Date().toISOString()
  };
}
