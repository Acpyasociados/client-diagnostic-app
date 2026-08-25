/**
 * cleanup-test-leads.js
 * Elimina todos los leads de prueba — conserva solo leads reales.
 * USAR UNA SOLA VEZ antes del lanzamiento, luego eliminar este archivo.
 *
 * GET /.netlify/functions/cleanup-test-leads?token=ADMIN_REVIEW_TOKEN&confirm=yes
 */

import { getStore } from '@netlify/blobs';

// Emails de clientes REALES que deben conservarse
const REAL_EMAILS = [
  'psoto@emiliana.cl',
  'ignaciiovalenzuela@gmail.com'
];

export default async (req) => {
  const url = new URL(req.url);
  const token = url.searchParams.get('token');
  const confirm = url.searchParams.get('confirm');

  // Validar token
  if (!token || token !== process.env.ADMIN_REVIEW_TOKEN) {
    return json(403, { error: 'Token inválido' });
  }

  const store = getStore('diagnostic-leads');
  const { blobs } = await store.list();

  const toKeep = [];
  const toDelete = [];
  const errors = [];

  // Clasificar cada lead
  for (const { key } of blobs) {
    try {
      const data = await store.get(key);
      if (!data) { toDelete.push({ key, reason: 'vacío' }); continue; }

      const lead = JSON.parse(data);
      const isRealClient = REAL_EMAILS.includes(lead.email);

      if (isRealClient && lead.payment_status === 'approved') {
        toKeep.push({ key, name: lead.name, email: lead.email, status: lead.status });
      } else {
        toDelete.push({ key, name: lead.name || '?', email: lead.email || '?', reason: isRealClient ? 'duplicado/pendiente' : 'prueba' });
      }
    } catch (e) {
      errors.push({ key, error: e.message });
    }
  }

  // Si no viene confirm=yes, solo mostrar preview
  if (confirm !== 'yes') {
    return json(200, {
      preview: true,
      mensaje: 'Agrega &confirm=yes a la URL para ejecutar la limpieza',
      conservar: toKeep,
      eliminar: toDelete.length,
      detalle_eliminar: toDelete,
      errores: errors
    });
  }

  // Ejecutar limpieza
  let deleted = 0;
  for (const { key } of toDelete) {
    try {
      await store.delete(key);
      deleted++;
    } catch (e) {
      errors.push({ key, error: e.message });
    }
  }

  return json(200, {
    ok: true,
    conservados: toKeep.length,
    eliminados: deleted,
    detalle_conservados: toKeep,
    errores: errors
  });
};

function json(status, body) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}
