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
 * Costo: 1 crédito por búsqueda (básica)
 * Con 1.000/mes gratis alcanza para ~500 informes/mes (2 búsquedas c/u).
 *
 * MEJORAS v2:
 * - Sin time_range → cubre historial completo (antes solo 1 año)
 * - 10 sectores cubiertos (antes solo 3)
 * - 2 búsquedas por informe para mayor cobertura
 * - Query personalizada con datos del lead (ventas, problema principal)
 * ─────────────────────────────────────────────────────────────────────────────
 */

const TAVILY_API_URL = 'https://api.tavily.com/search';

// Queries base por sector — orientadas a resultados concretos en Chile
// Se usan 2 por informe: queries[0] (casos éxito) + queries[1] (estrategia sector)
const QUERIES_BY_SECTOR = {
  servicios_terreno: [
    'pyme Chile servicios en terreno digitalización clientes Google Maps WhatsApp Business resultado concreto',
    'empresa mantención instalación Chile reducción costos operativos eficiencia caso éxito'
  ],
  servicios_profesionales: [
    'consultora profesional Chile transformación digital automatización más clientes resultado medible',
    'pyme servicios profesionales Chile gestión cobranza flujo de caja mejora concreta'
  ],
  comercio_ecommerce: [
    'comercio local Chile tienda online ventas digitales crecimiento resultado concreto pyme',
    'negocio retail Chile reducción inventario margen ganancia estrategia exitosa'
  ],
  construccion_obras: [
    'constructora pyme Chile gestión proyectos costos control presupuesto resultado concreto',
    'empresa construcción Chile licitaciones nuevos contratos digitalización administración obra'
  ],
  gastronomia_alimentos: [
    'restaurant café Chile delivery digital ventas online crecimiento caso éxito pyme',
    'negocio gastronomía Chile reducción merma costos food cost control resultado'
  ],
  salud_belleza: [
    'clínica centro estética salud Chile agenda digital fidelización pacientes clientes resultado',
    'pyme salud belleza Chile gestión citas pagos online crecimiento ingreso concreto'
  ],
  tecnologia_software: [
    'startup empresa tecnología Chile escala clientes recurrentes MRR crecimiento caso real',
    'empresa software Chile ventas B2B reducción churn fidelización clientes resultado'
  ],
  educacion_capacitacion: [
    'academia escuela capacitación Chile digitalización estudiantes online ingresos resultado',
    'empresa educación Chile modelo híbrido presencial online escalabilidad caso concreto'
  ],
  manufactura_industria: [
    'pyme manufactura industria Chile reducción costos producción eficiencia resultado medible',
    'empresa industrial Chile proveedor cadena suministro mejora margen caso éxito'
  ],
  otro: [
    'pyme pequeña empresa Chile digitalización crecimiento ventas reducción costos caso éxito concreto',
    'negocio Chile control gestión financiero mejora margen ganancia flujo caja resultado'
  ]
};

// Dominios chilenos de alta calidad — priorizados en el ranking
const PREFERRED_DOMAINS = [
  'df.cl', 'emol.com', 'latercera.com', 'elmercurio.com',
  'sercotec.cl', 'corfo.cl', 'pulso.cl', 'america-retail.com',
  'g5noticias.cl', 'startupchile.org', 'economiaenegocios.cl',
  'biobiochile.cl', 'cnnchile.com', 'cooperativa.cl', 'bnamericas.com',
  'portalfruticola.com', 'mundocontacto.cl', 'fayerwayer.com'
];

// Dominios excluidos — redes sociales y fuentes no confiables
const EXCLUDED_DOMAINS = [
  'instagram.com', 'facebook.com', 'twitter.com', 'x.com',
  'tiktok.com', 'youtube.com', 'pinterest.com', 'reddit.com',
  'wikipedia.org', 'quora.com', 'tripadvisor.com', 'linkedin.com'
];

/**
 * Construye una query personalizada incorporando datos del lead.
 * Más contexto = mejores resultados de Tavily.
 */
function buildPersonalizedQuery(baseQuery, lead) {
  const parts = [baseQuery];

  // Añadir contexto de tamaño de empresa según ventas
  const ventas = Number(lead.monthly_sales || 0);
  if (ventas > 0 && ventas < 5000000)  parts.push('microempresa');
  else if (ventas < 50000000)           parts.push('pequeña empresa');
  else if (ventas < 200000000)          parts.push('mediana empresa');

  // Añadir problema principal si está disponible y es corto
  const problema = (lead.main_problem || '').toLowerCase();
  if (problema.includes('costo'))    parts.push('reducción costos');
  if (problema.includes('cliente'))  parts.push('nuevos clientes');
  if (problema.includes('margen'))   parts.push('margen ganancia');
  if (problema.includes('flujo'))    parts.push('flujo de caja');
  if (problema.includes('digital'))  parts.push('digitalización');

  return parts.join(' ');
}

/**
 * Ejecuta una búsqueda en Tavily y retorna resultados filtrados.
 * Sin time_range → cubre todo el historial disponible (máxima cobertura).
 */
async function runSearch(query, apiKey) {
  const body = {
    query,
    search_depth:        'basic',     // 1 crédito (no 2 como "advanced")
    topic:               'general',   // 'general' da más resultados que 'news' para casos de negocio
    country:             'chile',
    max_results:         8,           // pedimos 8 para tener margen al filtrar
    // SIN time_range → historial completo (3+ años de cobertura)
    include_answer:      false,
    include_images:      false,
    include_raw_content: false,
    include_favicon:     false,
    include_usage:       true,        // monitorear consumo de créditos
    exclude_domains:     EXCLUDED_DOMAINS
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
    console.error('[search] Tavily error:', res.status, errText.substring(0, 200));
    return [];
  }

  const data = await res.json();

  if (data.usage) {
    console.log(`[search] Tavily crédito usado. Query: "${query.substring(0, 60)}..."`);
  }

  return data?.results || [];
}

/**
 * Busca casos de éxito reales para un sector dado usando Tavily.
 * Ejecuta 2 búsquedas (2 créditos) para mayor cobertura.
 *
 * @param {string} sector - sector del lead
 * @param {object} lead   - datos del lead para personalizar la query
 * @returns {Promise<Array>} Array de hasta 3 casos: { title, description, url, source, date }
 */
export async function searchCasesForSector(sector, lead = {}) {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    console.warn('[search] TAVILY_API_KEY no configurada — sin casos externos');
    return [];
  }

  // Seleccionar queries del sector (fallback a 'otro' si el sector no existe)
  const queries = QUERIES_BY_SECTOR[sector] || QUERIES_BY_SECTOR['otro'];

  try {
    // Ejecutar 2 búsquedas en paralelo (2 créditos) para mayor cobertura
    const [results1, results2] = await Promise.all([
      runSearch(buildPersonalizedQuery(queries[0], lead), apiKey).catch(() => []),
      runSearch(buildPersonalizedQuery(queries[1], lead), apiKey).catch(() => [])
    ]);

    // Combinar resultados eliminando duplicados por URL
    const seen = new Set();
    const combined = [...results1, ...results2].filter(r => {
      if (!r.url || seen.has(r.url)) return false;
      seen.add(r.url);
      return true;
    });

    if (!combined.length) {
      console.log('[search] Sin resultados Tavily para sector:', sector);
      return [];
    }

    // Filtrar resultados de baja calidad
    const filtered = combined
      .filter(r => {
        if (!r.title || !r.content) return false;
        if (r.content.length < 80) return false;
        const titleLower = r.title.toLowerCase();
        const urlLower   = (r.url || '').toLowerCase();
        if (titleLower.startsWith('[pdf]')) return false;
        if (urlLower.endsWith('.pdf')) return false;
        const badDomains = ['unepfi.org','iadb.org','worldbank.org','imf.org','cepal.org','ilo.org','un.org'];
        const dom = extractDomain(r.url || '');
        if (badDomains.some(d => dom.includes(d))) return false;
        if (EXCLUDED_DOMAINS.some(d => dom.includes(d))) return false;
        const contentLower = r.content.toLowerCase();
        if (contentLower.includes('abreviaciones') || contentLower.includes('tabla de contenido')) return false;
        if (contentLower.includes('assets under management')) return false;
        if (titleLower.includes('instagram') || titleLower.includes('facebook')) return false;
        return true;
      })
      .map(r => ({
        title:       cleanText(r.title.replace(/^\[PDF\]\s*/i, '')),
        description: cleanText(r.content),
        url:         r.url || '',
        source:      extractDomain(r.url),
        score:       r.score || 0,
        date:        null
      }))
      // Priorizar dominios chilenos de calidad, luego por score de relevancia
      .sort((a, b) => {
        const aPref = PREFERRED_DOMAINS.some(d => a.source.includes(d)) ? 1 : 0;
        const bPref = PREFERRED_DOMAINS.some(d => b.source.includes(d)) ? 1 : 0;
        if (bPref !== aPref) return bPref - aPref;
        return b.score - a.score;
      })
      .slice(0, 3);

    // Verificar que al menos 1 resultado sea relevante para Chile
    const tieneCalidadCl = filtered.some(r =>
      PREFERRED_DOMAINS.some(d => r.source.includes(d)) ||
      r.source.endsWith('.cl')
    );

    if (!filtered.length || !tieneCalidadCl) {
      console.log('[search] Sin resultados de calidad para Chile — sector:', sector);
      return [];
    }

    console.log(`[search] ${filtered.length} caso(s) encontrados — sector: "${sector}"`);
    return filtered;

  } catch (err) {
    console.error('[search] Error Tavily (no crítico):', err.message);
    return [];
  }
}

/**
 * Formatea un caso externo para insertar en el informe.
 */
export function formatExternalCase(caso) {
  const fuente = caso.source ? ` — Fuente: ${caso.source}` : '';
  return `${caso.title}: ${caso.description}${fuente}`;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function cleanText(text) {
  if (!text) return '';
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 300);
}

function extractDomain(url) {
  if (!url) return '';
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url.substring(0, 40);
  }
}
