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

import { QUESTION_LABELS } from './questions_labels.js';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-haiku-4-5-20251001';
const MAX_TOKENS = 2000;
const TIMEOUT_MS = 20000;

const SECTOR_LABELS = {
  servicios_profesionales: 'Servicios profesionales',
  comercio_ecommerce:      'Comercio / e-commerce',
  servicios_terreno:       'Servicios en terreno',
  construccion:            'Construcción y obras',
  gastronomia:             'Gastronomía y alimentos',
  salud_belleza:           'Salud y belleza',
  tecnologia:              'Tecnología y software',
  educacion:               'Educación y capacitación',
  manufactura:             'Manufactura e industria',
  otro:                    'Otro'
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

  // Métricas derivadas para enriquecer el contexto del prompt
  const ventasMensuales  = Number(lead.monthly_sales || 0);
  const margen           = Number(lead.margin || 0);
  const clientes         = Number(lead.active_clients || 0);
  const utilidadMensual  = ventasMensuales > 0 && margen > 0 ? ventasMensuales * (margen / 100) : 0;
  const ticketPromedio   = clientes > 0 && ventasMensuales > 0 ? Math.round(ventasMensuales / clientes) : 0;

  return `Eres un CFO con 20 años de experiencia en pymes chilenas. Dominas: SII, IVA (19%), PPM mensual, F29, gratificaciones (4,75% o 25%), régimen ProPyme, Ley de Pago Oportuno (30 días), AFP + salud, y márgenes típicos por sector en Chile.

DATOS DE LA EMPRESA:
- Nombre: ${lead.company || 'no especificado'}
- Sector: ${sectorLabel}
- Ventas mensuales brutas: ${formatCLP(ventasMensuales)}
- Margen declarado: ${margen > 0 ? margen + '%' : 'no especificado'}${utilidadMensual > 0 ? ` → Utilidad mensual estimada: ${formatCLP(utilidadMensual)}` : ''}
- Clientes activos: ${clientes > 0 ? clientes : 'no especificado'}${ticketPromedio > 0 ? ` → Ticket promedio: ${formatCLP(ticketPromedio)}/cliente` : ''}
- Plan: ${lead.plan === 'premium' ? 'Premium' : 'Básico'}
- Problema principal: ${mainProblem}
- Régimen tributario: ${lead.tax_regime || 'no especificado'}
- Top costos: ${lead.top_costs || 'no especificado'}
- Objetivo 6 meses: ${lead.goal_6m || 'no especificado'}

RESPUESTAS DEL CUESTIONARIO:
${formattedAnswers || '(sin respuestas adicionales)'}

BENCHMARKS CHILE (compara con estos):
- Servicios terreno: margen bruto 35-55%
- Servicios profesionales: margen bruto 50-70%
- Comercio/retail: margen bruto 25-40%
- Gastronomía: food cost ≤30%, margen neto 8-15%
- Construcción: margen bruto 20-35%
- Costo laboral pymes Chile: 35-45% ventas
- Morosidad cuentas por cobrar: 45-90 días promedio

INSTRUCCIONES:
Diagnóstico específico para ESTA empresa. Compara sus números con benchmarks. Cuantifica en CLP cuando sea posible. Directo, como si acabaras de revisar sus estados financieros.

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
