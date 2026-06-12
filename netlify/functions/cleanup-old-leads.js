/**
 * cleanup-old-leads.js
 * ─────────────────────────────────────────────────────────────────────
 * Cron job que se ejecuta ANUALMENTE (cada 1 enero) para:
 * 1. Buscar todos los leads con created_at > 1 año
 * 2. Borrar esos leads de diagnostic-leads Blobs
 * 3. Registrar auditoría (qué se borró, cuándo, cuántos)
 * 4. Enviar reporte al administrador
 *
 * Configuración en Netlify:
 * - Trigger: Scheduled (cron job)
 * - Cadencia: 0 0 1 1 * (cada 1 de enero a las 00:00 UTC)
 * - Timeout: 30 segundos máximo
 *
 * Ley 21.719: Política de retención = 1 año post-asesoría
 * ─────────────────────────────────────────────────────────────────────
 */

import { getStore } from '@netlify/blobs';
import { decryptObject } from './_lib/encryption.js';
import { sendEmail } from './_lib/email.js';

const STORE_NAME = 'diagnostic-leads';
const AUDIT_STORE = 'audit-log';
const RETENTION_DAYS = 365;

export default async (req, context) => {
  const startTime = Date.now();

  try {
    // Validar que sea cron job o request autorizado
    const authHeader = req.headers?.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      );
    }

    const store = getStore(STORE_NAME);
    const { blobs } = await store.list();

    const cutoffDate = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;
    const toDelete = [];
    const errors = [];

    console.log(`[CLEANUP] Iniciando limpieza de leads > ${RETENTION_DAYS} días`);
    console.log(`[CLEANUP] Cutoff date: ${new Date(cutoffDate).toISOString()}`);

    // Buscar leads antiguos
    for (const { key } of blobs) {
      try {
        const data = await store.get(key);
        if (!data) continue;

        let lead;
        try {
          lead = JSON.parse(data);
        } catch (e) {
          errors.push({ key, error: 'Parse error' });
          continue;
        }

        // Desencriptar para verificar created_at
        lead = decryptObject(lead);

        const createdTime = lead.created_at ? new Date(lead.created_at).getTime() : 0;

        if (createdTime < cutoffDate) {
          toDelete.push({
            id: key,
            created_at: lead.created_at,
            email: lead.email,
            company: lead.company
          });
        }
      } catch (err) {
        console.error(`Error procesando ${key}:`, err);
        errors.push({ key, error: err.message });
      }
    }

    console.log(`[CLEANUP] Encontrados ${toDelete.length} leads para borrar`);

    // Borrar leads antiguos
    let deletedCount = 0;
    for (const item of toDelete) {
      try {
        await store.delete(item.id);
        deletedCount++;
      } catch (err) {
        console.error(`Error borrando ${item.id}:`, err);
        errors.push({ key: item.id, error: `Delete failed: ${err.message}` });
      }
    }

    // Registrar auditoría
    const auditStore = getStore(AUDIT_STORE);
    const auditEntry = {
      action: 'cleanup-old-leads',
      timestamp: new Date().toISOString(),
      retentionDays: RETENTION_DAYS,
      cutoffDate: new Date(cutoffDate).toISOString(),
      totalScanned: blobs.length,
      totalDeleted: deletedCount,
      deletedLeads: toDelete.map(item => ({
        id: item.id,
        created_at: item.created_at,
        email: item.email,
        company: item.company
      })),
      errors: errors,
      executionTimeMs: Date.now() - startTime
    };

    const auditKey = `audit-cleanup-${Date.now()}`;
    await auditStore.set(auditKey, JSON.stringify(auditEntry, null, 2));

    console.log(`[CLEANUP] Auditoría registrada en ${auditKey}`);
    console.log(`[CLEANUP] Tiempo total: ${auditEntry.executionTimeMs}ms`);

    // Enviar reporte a admin
    const adminEmail = process.env.ADMIN_EMAIL || 'info@acpasociados.cl';

    try {
      await sendEmail({
        to: adminEmail,
        subject: `[CLEANUP] Reporte de limpieza de leads - ${new Date().toLocaleDateString('es-CL')}`,
        html: `
          <div style="font-family: monospace; padding: 20px;">
            <h2>Reporte de Limpieza de Datos - Ley 21.719</h2>

            <p><strong>Fecha:</strong> ${new Date().toISOString()}</p>
            <p><strong>Política de Retención:</strong> ${RETENTION_DAYS} días</p>
            <p><strong>Cutoff:</strong> ${new Date(cutoffDate).toISOString()}</p>

            <hr>

            <h3>Resultados</h3>
            <p><strong>Total Scaneado:</strong> ${blobs.length} leads</p>
            <p><strong>Total Borrado:</strong> ${deletedCount} leads ✅</p>
            <p><strong>Errores:</strong> ${errors.length} ⚠️</p>
            <p><strong>Tiempo:</strong> ${auditEntry.executionTimeMs}ms</p>

            <hr>

            <h3>Leads Borrados</h3>
            <pre>${JSON.stringify(toDelete, null, 2)}</pre>

            ${errors.length > 0 ? `
            <h3>Errores Encontrados</h3>
            <pre>${JSON.stringify(errors, null, 2)}</pre>
            ` : ''}

            <hr>

            <p style="color: #666; font-size: 12px;">
              Auditoría completa: ${auditKey}<br>
              Ejecutado por: cleanup-old-leads.js<br>
              Cumplimiento: Ley 21.719 Artículo 5 (Retención)
            </p>
          </div>
        `
      });

      console.log(`[CLEANUP] Reporte enviado a ${adminEmail}`);
    } catch (emailErr) {
      console.warn('[CLEANUP] Email no pudo ser enviado:', emailErr);
      // No es error crítico, continuamos
    }

    // Respuesta exitosa
    return new Response(
      JSON.stringify({
        success: true,
        message: `Limpieza completada: ${deletedCount} leads borrados`,
        results: {
          totalScanned: blobs.length,
          totalDeleted: deletedCount,
          errors: errors.length,
          executionTimeMs: auditEntry.executionTimeMs,
          auditKey
        }
      }),
      { status: 200 }
    );

  } catch (err) {
    console.error('[CLEANUP] Error crítico:', err);

    return new Response(
      JSON.stringify({
        success: false,
        error: err.message,
        timestamp: new Date().toISOString()
      }),
      { status: 500 }
    );
  }
};
