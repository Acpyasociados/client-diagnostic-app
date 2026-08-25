# LECCIÓN: Netlify Functions v1 vs v2 — Bug silencioso que rompe webhooks y pagos

**Válido para:** Cualquier proyecto que use Netlify Functions con pagos, webhooks o lectura de query params.

---

## El error

```javascript
// ❌ ESTO PARECE CORRECTO PERO ESTÁ MAL en proyectos ESM
export default async (event, context) => {
  const params = event.queryStringParameters; // → undefined
  const body   = event.body;                  // → undefined
```

Cuando una función usa `export default` (ESM), Netlify la ejecuta como **Functions v2**. En v2, el primer argumento es un objeto `Request` estándar web, no el objeto `event` de v1. Resultado: `queryStringParameters`, `body`, `headers` son `undefined` y la función falla silenciosamente o retorna errores de autenticación.

**El peligro:** la función no arroja un error de sintaxis ni de runtime obvio. Solo los datos llegan vacíos, lo que hace difícil diagnosticar el problema.

---

## La regla

| Sintaxis de export | API que Netlify usa | Cómo leer query params | Cómo leer body |
|---|---|---|---|
| `exports.handler = async (event) =>` | v1 (CommonJS) | `event.queryStringParameters` | `event.body` |
| `export default async (req) =>` | v2 (ESM) | `new URL(req.url).searchParams` | `await req.text()` |

**Regla simple: si el archivo usa `import`/`export`, usa siempre la API v2.**

---

## Plantilla correcta para webhooks con query params (v2)

```javascript
// ✅ Webhook que lee query params — Netlify Functions v2
export default async (req) => {
  // Leer query params desde la URL
  const url    = new URL(req.url);
  const params = Object.fromEntries(url.searchParams.entries());

  // Leer body (si es POST con JSON)
  let body = {};
  if (req.method === 'POST') {
    try { body = JSON.parse(await req.text()); } catch {}
  }

  // Leer headers
  const authHeader = req.headers.get('authorization');

  // Retornar respuesta
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
```

---

## Plantilla correcta para funciones que reciben POST con JSON (v2)

```javascript
// ✅ Función POST con JSON body — Netlify Functions v2
export default async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  let body;
  try {
    body = JSON.parse(await req.text());
  } catch {
    return new Response(JSON.stringify({ error: 'JSON inválido' }), { status: 400 });
  }

  const { campo1, campo2 } = body;
  // ... lógica

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
```

---

## Cómo detectar este bug en un proyecto existente

Busca funciones que tengan AMBAS condiciones:

```bash
# Condición 1: usan export default (ESM)
grep -rl "export default async" netlify/functions/

# Condición 2: leen datos con API v1
grep -rl "queryStringParameters\|event\.body\b" netlify/functions/
```

Si el mismo archivo aparece en ambas listas → bug confirmado.

**Comando combinado para detectar todos los archivos afectados:**
```bash
grep -rl "export default async" netlify/functions/ | xargs grep -l "queryStringParameters\|event\.body\b"
```

---

## Checklist antes de poner en producción cualquier función Netlify

- [ ] ¿La función usa `import`/`export`? → Debe usar API v2 (`req`, `new URL(req.url)`, `req.text()`)
- [ ] ¿La función usa `require`/`module.exports`? → Puede usar API v1 (`event.queryStringParameters`, `event.body`)
- [ ] Probar el webhook/función con un request real antes de salir a producción
- [ ] Si hay pagos involucrados: hacer una compra de prueba de $1 o $100 y verificar que el lead queda en estado `pagado` en la base de datos

---

## Función de recuperación disponible en este proyecto

`netlify/functions/resend-questionnaire.js` — reenvía el cuestionario a cualquier lead pagado. Útil si un webhook falla silenciosamente o si hay un problema de timing durante un deploy.

```powershell
Invoke-RestMethod `
  -Uri "https://acp-asociados.netlify.app/.netlify/functions/resend-questionnaire" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"lead_id":"LEAD_ID","admin_token":"ADMIN_REVIEW_TOKEN"}'
```

---

**Fecha de creación:** 4 de junio 2026  
**Origen:** Incidente real en producción — pago procesado, webhook falló, cuestionario no enviado  
**Archivos corregidos:** `netlify/functions/flow-webhook.js`
