/**
 * search.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Módulo de búsqueda web usando Tavily API.
 * Busca casos de éxito reales por sector para enriquecer el informe.
 *
 * Requiere variable de entorno: TAVILY_API_KEY
 * Obtener en: https://app.tavily.com (gratis, sin tarjeta, 1.000 búsquedas/mes)
 *
 * API usada: POST https://api.tavily.com/search
 * Costo: 1 crédito por búsqueda (básica) — con 1.000/mes gratis alcanza
 * para ~1.000 informes/mes sin pagar nada.
 *
 * Uso:
 *   import { searchCasesForSector } from './_lib/search.js';
 *   const cases = await searchCasesForSector('servicios_terreno', lead);
 *   // Retorna array de { title, description, url, source, date } o [] si falla
 * ─────────────────────────────────────────────────────────────────────────────
 */

const TAVILY_API_URL = 'https://api.tavily.com/search';

// Queries por sector — buscamos casos de éxito reales en Chile, en español
const QUERIES_BY_SECTOR = {
  servicios_terreno: [
    'empresa servicios terreno Chile pyme caso éxito crecimiento ventas 2024 2025',
    'gasfitería electricidad mantención empresa Chile aumentó clientes resultados reales',
    'empresa servicios en terreno Chile fidelización optimización caso exitoso'
  ],
  servicios_profesionales: [
    'consultora servicios profesionales Chile pyme caso éxito crecimiento clientes 2024 2025',
    'estudio contable asesoría jurídica Chile transformación digital resultados reales',
    'empresa servicios profesionales Chile más clientes caso exitoso estrategia'
  ],
  comercio_ecommerce: [
    'tienda comercio pyme Chile ventas online ecommerce caso éxito crecimiento 2024 2025',
    'negocio local Chile ventas digitales resultados reales transformación digital',
    'comercio minorista Chile estrategia digital caso exitoso aumento ventas'
  ]
};

// Dominios de alta calidad para resultados de negocios en Chile
const PREFERRED_DOMAINS = [
  'df.cl',
  'emol.com',
  'latercera.com',
  'elmercurio.com',
  'sercotec.cl',
  'corfo.cl',
  'pulso.cl',
  'america-retail.com',
  'g5noticias.cl',
  'startupchile.org'
];

/**
 * Busca casos de éxito reales para un sector dado usando Tavily.
 * @param {string} sector - 'servicios_terreno' | 'servicios_profesionales' | 'comercio_ecommerce'
 * @param {object} lead   - datos del lead (para personalizar la query)
 * @returns {Promise<Array>} Array de hasta 3 casos: { title, description, url, source, date }
 */
export async function searchCasesForSector(sector, lead = {}) {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    console.warn('[search] TAVILY_API_KEY no configurada — se usaran casos hardcoded');
    return [];
  }

  const queries = QUERIES_BY_SECTOR[sector] || QUERIES_BY_SECTOR['servicios_terreno'];
  const query = queries[0]; // 1 búsqueda por informe = 1 crédito

  try {
    const body = {
      query,
      search_depth:     'basic',   // 1 crédito (no 2 como "advanced")
      topic:            'general',
      country:          'chile',
      max_results:      5,
      time_range:       'year',    // resultados del último año
      include_answer:   false,
      include_images:   false,
      include_raw_content: false,
      include_favicon:  false,
      include_usage:    true       // para monitorear consumo de créditos en logs
    };

    const res = await fetch(TAVILY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('[search] Tavily error:', res.status, errText.substring(0, 300));
      // Errores 429/432 = sin créditos — no bloquear el informe
      return [];
    }

    const data = await res.json();

    // Loguear consumo de créditos para monitoreo
    if (data.usage) {
      console.log(`[search] Tavily uso: ${data.usage.credits} credito(s). Query: "${query}"`);
    }

    const results = data?.results || [];

    if (!results.length) {
      console.log('[search] Sin resultados Tavily para:', query);
      return [];
    }

    // Filtrar y mapear resultados útiles
    const filtered = results
      .filter(r => r.title && r.content && r.content.length > 60)
      .map(r => ({
        title:       cleanText(r.title),
        description: cleanText(r.content),
        url:         r.url || '',
        source:      extractDomain(r.url),
        score:       r.score || 0,
        date:        null  // Tavily no siempre devuelve fecha en búsqueda básica
      }))
      // Priorizar resultados de dominios chilenos de calidad
      .sort((a, b) => {
        const aPref = PREFERRED_DOMAINS.some(d => a.source.includes(d)) ? 1 : 0;
        const bPref = PREFERRED_DOMAINS.some(d => b.source.includes(d)) ? 1 : 0;
        if (bPref !== aPref) return bPref - aPref;
        return b.score - a.score; // fallback: por relevancia
      })
      .slice(0, 3);

    console.log(`[search] ${filtered.length} caso(s) encontrados para sector "${sector}"`);
    return filtered;

  } catch (err) {
    // Nunca bloquear la generación del informe por un error de búsqueda
    console.error('[search] Error llamando a Tavily (no critico):', err.message);
    return [];
  }
}

/**
 * Formatea un caso externo (de Tavily) para insertar en el informe.
 * @param {object} caso - { title, description, url, source }
 * @returns {string} Texto formateado
 */
export function formatExternalCase(caso) {
  const fuente = caso.source ? ` — Fuente: ${caso.source}` : '';
  return `${caso.title}: ${caso.description}${fuente}`;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function cleanText(text) {
  if (!text) return '';
  return text
    .replace(/<[^>]*>/g, '')    // quitar etiquetas HTML
    .replace(/\s+/g, ' ')       // normalizar espacios
    .trim()
    .substring(0, 300);         // limitar largo para el informe
}

function extractDomain(url) {
  if (!url) return '';
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url.substring(0, 40);
  }
}
