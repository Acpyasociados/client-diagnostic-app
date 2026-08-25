/**
 * daily-backup.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Scheduled function que corre cada noche a las 03:00 AM (Chile, UTC-3 = 06:00 UTC).
 * Lee todos los leads de Netlify Blobs y hace un commit al repo de GitHub
 * con un archivo JSON snapshot en backup/leads-YYYY-MM-DD.json.
 *
 * Variables de entorno requeridas:
 *   GITHUB_BACKUP_TOKEN  — Personal Access Token con permiso "repo"
 *   GITHUB_REPO_OWNER    — "Acpyasociados"
 *   GITHUB_REPO_NAME     — "client-diagnostic-app"
 *   GITHUB_BACKUP_BRANCH — "main" (o la rama que uses)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { getStore } from '@netlify/blobs';

const GITHUB_API = 'https://api.github.com';

// ── Helpers GitHub API ────────────────────────────────────────────────────────

function githubHeaders(token) {
  return {
    'Authorization': `Bearer ${token}`,
    'Accept':        'application/vnd.github+json',
    'Content-Type':  'application/json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

/**
 * Obtiene el SHA del archivo si ya existe (para poder actualizarlo).
 * Retorna null si el archivo no existe todavía.
 */
async function getFileSha(token, owner, repo, branch, path) {
  const url = `${GITHUB_API}/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;
  const res = await fetch(url, { headers: githubHeaders(token) });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub getFileSha ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.sha;
}

/**
 * Crea o actualiza un archivo en GitHub via API.
 */
async function upsertFile(token, owner, repo, branch, path, content, message, sha) {
  const url  = `${GITHUB_API}/repos/${owner}/${repo}/contents/${path}`;
  const body = {
    message,
    content: Buffer.from(content, 'utf8').toString('base64'),
    branch,
    ...(sha ? { sha } : {}),
  };

  const res = await fetch(url, {
    method:  'PUT',
    headers: githubHeaders(token),
    body:    JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`GitHub upsertFile ${res.status}: ${errText.substring(0, 300)}`);
  }

  return await res.json();
}

// ── Handler principal ─────────────────────────────────────────────────────────

export default async (req) => {
  console.log('[daily-backup] Iniciando backup diario de leads…');

  // ── 1. Validar configuración ─────────────────────────────────────────────
  const token  = process.env.GITHUB_BACKUP_TOKEN;
  const owner  = process.env.GITHUB_REPO_OWNER  || 'Acpyasociados';
  const repo   = process.env.GITHUB_REPO_NAME   || 'client-diagnostic-app';
  const branch = process.env.GITHUB_BACKUP_BRANCH || 'main';

  if (!token) {
    console.error('[daily-backup] GITHUB_BACKUP_TOKEN no configurada — backup omitido');
    return new Response(JSON.stringify({ error: 'GITHUB_BACKUP_TOKEN missing' }), { status: 500 });
  }

  // ── 2. Leer todos los leads de Netlify Blobs ─────────────────────────────
  let leads = [];
  try {
    const store = getStore('diagnostic-leads');
    const { blobs } = await store.list();
    for (const blob of blobs) {
      try {
        const raw = await store.get(blob.key);
        if (raw) leads.push(JSON.parse(raw));
      } catch (e) {
        console.warn('[daily-backup] Error leyendo lead:', blob.key, e.message);
      }
    }
  } catch (e) {
    console.error('[daily-backup] Error accediendo a Blobs:', e.message);
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }

  console.log(`[daily-backup] ${leads.length} leads leídos`);

  // ── 3. Preparar el snapshot ──────────────────────────────────────────────
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  // Ordenar por fecha de creación (más reciente primero)
  leads.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  // Resumen ejecutivo para lectura rápida (sin datos del informe HTML)
  const summary = leads.map(l => ({
    lead_id:        l.lead_id,
    created_at:     l.created_at,
    company:        l.company,
    name:           l.name,
    email:          l.email,
    phone:          l.phone,
    sector:         l.sector,
    plan:           l.plan,
    final_price:    l.final_price,
    status:         l.status,
    payment_status: l.payment_status,
    paid_at:        l.paid_at || null,
    delivered_at:   l.delivered_at || null,
  }));

  const snapshot = {
    backup_date:    today,
    generated_at:   new Date().toISOString(),
    total_leads:    leads.length,
    leads_pagados:  leads.filter(l => l.payment_status === 'approved').length,
    leads_enviados: leads.filter(l => l.status === 'enviado').length,
    summary,
    // Full data — incluye todo (cuestionarios, informes, etc.)
    // Útil para restaurar en caso de pérdida total
    full_data: leads.map(l => {
      // Excluir el HTML del informe para no inflar el archivo (puede ser >100KB por lead)
      const { report_html, ...rest } = l;
      return rest;
    }),
  };

  const content = JSON.stringify(snapshot, null, 2);

  // ── 4. Subir a GitHub ────────────────────────────────────────────────────
  const filePath = `backup/leads-${today}.json`;
  const commitMsg = `backup: ${leads.length} leads snapshot ${today}`;

  try {
    // Verificar si el archivo ya existe (para actualizar en vez de crear)
    const existingSha = await getFileSha(token, owner, repo, branch, filePath);
    await upsertFile(token, owner, repo, branch, filePath, content, commitMsg, existingSha);
    console.log(`[daily-backup] ✅ Backup subido: ${filePath} (${leads.length} leads)`);
  } catch (e) {
    console.error('[daily-backup] Error subiendo a GitHub:', e.message);
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }

  // ── 5. Actualizar índice de backups ──────────────────────────────────────
  // Mantiene un archivo README en backup/ con el historial de snapshots
  try {
    const indexPath = 'backup/README.md';
    const indexSha  = await getFileSha(token, owner, repo, branch, indexPath);

    const indexContent = [
      '# Backup de Leads — ACP & Asociados',
      '',
      `Último backup: **${today}** (${leads.length} leads totales, ${leads.filter(l => l.payment_status === 'approved').length} pagados)`,
      '',
      '## Cómo restaurar',
      '',
      '1. Abre el archivo `leads-YYYY-MM-DD.json` del día que necesitas.',
      '2. Copia el contenido de `full_data` al script de restauración.',
      '3. El script itera sobre los objetos y los sube de vuelta a Netlify Blobs con `store.set(lead.lead_id, JSON.stringify(lead))`.',
      '',
      '## Archivos disponibles',
      '',
      `- [leads-${today}.json](leads-${today}.json) — ${leads.length} leads`,
      '',
      `_Generado automáticamente el ${new Date().toLocaleString('es-CL')}_`,
    ].join('\n');

    await upsertFile(token, owner, repo, branch, indexPath, indexContent,
      `backup: update index ${today}`, indexSha);
  } catch (e) {
    // No crítico — el backup principal ya fue subido
    console.warn('[daily-backup] Error actualizando índice (no crítico):', e.message);
  }

  return new Response(JSON.stringify({
    ok:          true,
    date:        today,
    file:        filePath,
    total_leads: leads.length,
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
