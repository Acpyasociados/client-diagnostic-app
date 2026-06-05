/**
 * ai.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Módulo de integración con Claude API (Anthropic).
 * Genera resumen ejecutivo y oportunidades personalizadas a partir de los
 * datos del lead y las respuestas del cuestionario.
 *
 * Requiere variable de entorno: ANTHROPIC_API_KEY
 * Obtener en: https://console.anthropic.com
 *
 * Modelo: claude-haiku-4-5-20251001 (rápido, bajo costo, suficiente para esto)
 * Tiempo estimado: 3-8 segundos por informe
 * Costo estimado: ~$0.001-0.003 USD por informe generado
 *
 * Diseñado para ser no-bloqueante: si falla, el sistema usa lógica de reglas.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-haiku-4-5-20251001';
const MAX_TOKENS = 2000;
const TIMEOUT_MS = 20000;

const SECTOR_LABELS = {
  servicios_profesionales: 'Servicios profesionales',
  comercio_ecommerce: 'Comercio / e-commerce',
  servicios_terreno: 'Servicios en terreno'
};

const QUESTION_LABELS = {
  q_monthly_sales:         'Ventas mensuales (CLP)',
  q_margin:                'Margen de ganancia (%)',
  q_active_clients:        'Clientes activos',
  q_main_problem:          'Principal desafío del negocio',
  monthly_leads:           'Leads mensuales',
  close_rate:              'Tasa de cierre (%)',
  avg_ticket:              'Ticket promedio (CLP)',
  top3_revenue_share:      'Concentración top 3 clientes (%)',
  non_billable_hours:      'Horas no facturables al mes',
  collection_days:         'Días promedio de cobro',
  repeat_rate:             'Tasa de recompra / repetición (%)',
  best_margin_product_share: 'Participación producto más rentable (%)',
  slow_stock_share:        'Stock lento sobre inventario total (%)',
  delivery_days:           'Días promedio de entrega',
  promo_sales_share:       'Ventas con promoción (%)',
  jobs_per_day:            'Trabajos por día',
  idle_time_hours:         'Horas muertas por día',
  fuel_cost_monthly:       'Gasto mensual combustible (CLP)',
  response_time_hours:     'Tiempo de respuesta promedio (horas)',
  quote_acceptance_rate:   'Presupuestos aceptados (%)',
  client_acquisition_method: 'Cómo llegan los clientes',
  fuel_purchase_structure: 'Estructura de compra de combustible',
  return_trip_utilization: 'Utilización de viajes de vuelta',
  digital_presence:        'Presencia digital'
};

/**
 * Formatea las respuestas del cuestionario en texto legible para el prompt.
 */
function formatAnswers(answers) {
  return Object.entries(answers)
    .filter(([, v]) => v !== null && v !== undefined && v !== '')
    .map(([k, v]) => {
      const label = QUESTION_LABELS[k] || k;
      return `- ${label}: ${v}`;
    })
    .join('\n');
}

/**
 * Formatea ventas en CLP para el prompt.
 */
function formatCLP(value) {
  const n = Number(value || 0);
  if (!n) return 'no especificado';
  return new Intl.NumberFormat('es-CL', {
    style: 'currency', currency: 'CLP', maximumFractionDigits: 0
  }).format(n);
}

/**
 * Construye el prompt para Claude.
 */
function buildPrompt(lead, answers) {
  const sectorLabel = SECTOR_LABELS[lead.sector] || lead.sector || 'no especificado';
  const mainProblem = answers.q_main_problem || lead.main_problem || 'no especificado';
  const formattedAnswers = formatAnswers(answers);

  return `Eres un experto en finanzas y control de gestión para pymes chilenas con 20 años de experiencia como CFO. Analiza estos datos y genera un diagnóstico financiero profesional.

DATOS DE LA EMPRESA:
- Nombre: ${lead.company || 'no especificado'}
- Sector: ${sectorLabel}
- Ventas mensuales: ${formatCLP(lead.monthly_sales)}
- Margen estimado: ${lead.margin != null ? lead.margin + '%' : 'no especificado'}
- Clientes activos: ${lead.active_clients || 'no especificado'}
- Plan contratado: ${lead.plan === 'premium' ? 'Premium' : 'Básico'}
- Principal problema declarado: ${mainProblem}

RESPUESTAS DEL CUESTIONARIO:
${formattedAnswers || '(sin respuestas adicionales)'}

INSTRUCCIONES:
Genera un diagnóstico financiero específico para ESTA empresa (no genérico). Usa sus números reales. Sé directo y concreto como lo haría un CFO experimentado.

Responde SOLO con un objeto JSON válido (sin markdown, sin texto adicional):

{
  "summary": "Párrafo de 3-4 oraciones que describe la situación financiera actual de la empresa, los 2 riesgos más críticos y la oportunidad de mayor impacto. Usa sus números reales.",
  "opportunities": [
    {
      "axis": "caja",
      "title": "Título corto y directo (5-8 palabras)",
      "finding": "Diagnóstico específico basado en SUS datos. 2-3 oraciones. Cuantifica el problema en CLP si es posible.",
      "action": "3 acciones concretas y ordenadas para resolver el problema.",
      "impact": 5,
      "kpi": "KPI específico para medir el avance",
      "term": "30 días",
      "intervention": "Baja",
      "plan": [
        "Semana 1: Acción específica con detalle operativo",
        "Semana 2: Acción específica con detalle operativo",
        "Semana 3: Acción específica con detalle operativo",
        "Semana 4: Acción específica con detalle operativo"
      ]
    }
  ]
}

REGLAS:
- "axis" debe ser exactamente uno de: "caja", "comercial", "estructura"
- "impact" debe ser un número entero del 1 al 5
- "term" debe ser exactamente uno de: "30 días", "90 días", "180 días"
- "intervention" debe ser exactamente uno de: "Baja", "Media", "Alta"
- Genera exactamente 3 oportunidades, ordenadas de mayor a menor impacto
- El primer eje debe ser el más crítico según los datos
- Todos los textos en español chileno, tono profesional pero directo
- Si los datos son insuficientes para una oportunidad específica, usa benchmarks del sector en Chile`;
}

/**
 * Llama a Claude API y retorna { summary, opportunities } o null si falla.
 *
 * @param {object} lead    - Datos del lead (company, sector, monthly_sales, margin, etc.)
 * @param {object} answers - Respuestas del cuestionario
 * @returns {Promise<{summary: string, opportunities: Array}|null>}
 */
export async function generateAiEnrichment(lead, answers = {}) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn('[ai] ANTHROPIC_API_KEY no configurada — se usará lógica de reglas');
    return null;
  }

  const prompt = buildPrompt(lead, answers);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type':       'application/json',
        'x-api-key':          apiKey,
        'anthropic-version':  '2023-06-01'
      },
      body: JSON.stringify({
        model:      MODEL,
        max_tokens: MAX_TOKENS,
        messages: [{ role: 'user', content: prompt }]
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text();
      console.error('[ai] Anthropic API error:', response.status, errText.substring(0, 300));
      return null;
    }

    const data = await response.json();
    const rawText = data?.content?.[0]?.text;

    if (!rawText) {
      console.error('[ai] Respuesta vacía de Claude');
      return null;
    }

    // Extraer JSON — Claude puede incluir backticks en algunos casos
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('[ai] No se encontró JSON en la respuesta:', rawText.substring(0, 200));
      return null;
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Validación básica de estructura
    if (!parsed.summary || !Array.isArray(parsed.opportunities) || parsed.opportunities.length === 0) {
      console.error('[ai] Estructura JSON inválida:', Object.keys(parsed));
      return null;
    }

    // Normalizar y sanitizar cada oportunidad
    const validAxes        = new Set(['caja', 'comercial', 'estructura']);
    const validTerms       = new Set(['30 días', '90 días', '180 días']);
    const validInterventions = new Set(['Baja', 'Media', 'Alta']);

    const opportunities = parsed.opportunities.slice(0, 3).map(opp => ({
      axis:         validAxes.has(opp.axis)              ? opp.axis         : 'estructura',
      title:        String(opp.title        || '').substring(0, 80),
      finding:      String(opp.finding      || '').substring(0, 500),
      action:       String(opp.action       || '').substring(0, 400),
      impact:       Math.min(5, Math.max(1, parseInt(opp.impact) || 3)),
      kpi:          String(opp.kpi          || '').substring(0, 100),
      term:         validTerms.has(opp.term)             ? opp.term         : '30 días',
      intervention: validInterventions.has(opp.intervention) ? opp.intervention : 'Media',
      plan:         Array.isArray(opp.plan) ? opp.plan.slice(0, 4).map(s => String(s).substring(0, 200)) : [],
      cases:        [],      // sin casos externos — Tavily se encarga de eso
      ai_generated: true     // flag para identificar origen en admin
    }));

    const tokensUsed = data?.usage?.input_tokens + data?.usage?.output_tokens || 0;
    console.log(`[ai] Diagnóstico generado OK. Tokens: ${tokensUsed}. Empresa: ${lead.company}`);

    return {
      summary:       String(parsed.summary || '').substring(0, 800),
      opportunities
    };

  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      console.warn('[ai] Timeout al llamar a Claude API (no crítico) — usando reglas');
    } else {
      console.error('[ai] Error inesperado (no crítico):', err.message);
    }
    return null;
  }
}
