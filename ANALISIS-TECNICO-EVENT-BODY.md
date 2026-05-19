# 🔬 ANÁLISIS TÉCNICO PROFUNDO: El Problema de event.body

**Título:** ¿Por qué event.body es null/undefined en Netlify Functions?  
**Criticidad:** 🔴 CRÍTICA - Bloquea 100% de conversiones  
**Última Actualización:** 18 de Mayo de 2026

---

## 📍 UBICACIÓN DEL PROBLEMA

**Archivo:** `/netlify/functions/create-diagnostic-order.js`  
**Línea:** 99 (donde se llama parseBody)  
**Función:** `parseBody(event)` (líneas 9-81)  
**Error Exacto:** `body` siempre retorna `null` y nunca alcanza JSON parsing  

---

## 🔍 INVESTIGACIÓN: ¿QUÉ ESTÁ PASANDO?

### Escenario 1: La función no se ejecuta (PROBABLE - 70%)

**Indicadores:**
- Los logs están COMPLETAMENTE VACÍOS
- Ni un sólo `console.log` aparece en Netlify
- El error 400 se retorna sin logging

**Causa Probable:**
```
Error de compilación/bundling:
- esbuild no puede procesar los imports
- Syntax error en el archivo
- Module resolution failure
```

**Test para confirmar:**
```javascript
// Ver si console.logs aparecen
console.log('=== FUNCTION STARTED ===');
```

Si esto no aparece en logs → función no se ejecuta.

---

### Escenario 2: event.body es realmente undefined (POSIBLE - 20%)

**Indicadores:**
- Logs aparecen hasta la línea 11
- Logs muestran `event.body type: undefined`
- Pero no hay error de validación

**Causa Probable:**
```
Netlify no está pasando body:
- Request no tiene Content-Length
- Headers incorrectos
- Middleware Netlify no parsea
```

**Test para confirmar:**
```javascript
console.log('Headers:', event.headers);
console.log('Method:', event.httpMethod);
console.log('All event keys:', Object.keys(event));
```

---

### Escenario 3: ReadableStream detection falla (MENOS PROBABLE - 10%)

**Indicadores:**
- event.body existe
- type es 'object'
- Pero `.text()` no existe o falla

**Causa Probable:**
```
Versión de Netlify Functions cambió:
- Cambio en la implementación del runtime
- event.body es un tipo diferente
- Necesita nuevo parser
```

---

## 🧪 PROCEDIMIENTO DE DIAGNÓSTICO (PASO A PASO)

### PASO 1: Verificar Que Logs Se Capturan
**Tiempo:** 5 minutos

```bash
# 1. Editar create-diagnostic-order.js línea 83:
# CAMBIAR:
console.log('=== CREATE-DIAGNOSTIC-ORDER START ===');

# A ESTO (más visible):
console.error('🔴 CREATE-DIAGNOSTIC-ORDER START - TIME: ' + new Date().toISOString());
```

**Por qué `console.error`?** Algunos sistemas filtran logs pero no errores.

**Siguiente:** Hacer commit, deploy, probar, ver si aparece en Netlify logs.

---

### PASO 2: Si No Hay Logs - Revisar Build Logs
**Tiempo:** 5 minutos

```
1. Netlify Dashboard → Tu Site
2. Haz clic en "Deploys"
3. Haz clic en el último deploy (debe ser reciente)
4. Haz clic en "Deploy log"
5. Busca palabra "error", "fail", "ERROR"
6. Nota cualquier línea que contenga "create-diagnostic-order"
```

**Qué buscar:**
```
✓ "Functions bundled successfully" → OK
✗ "ERR_MODULE_NOT_FOUND" → Problema de imports
✗ "SyntaxError" → Error en el código
✗ "esbuild failed" → Problema de bundler
```

---

### PASO 3: Si Hay Logs - Identificar Dónde Falla
**Tiempo:** 10 minutos

Los logs dirán cuál de estos es verdad:
```
a) "event.body type: undefined" → Escenario 2 (body no llega)
b) "event.body type: object" + logs vacíos después → Escenario 3 (parser falla)
c) "event.body has .text method: false" → Escenario 3 (ReadableStream detection falla)
d) "Body converted to text, length: X" → ¡El parser funciona! Bug está en validación
```

---

### PASO 4: Test aislado - Función Minimal
**Tiempo:** 15 minutos

**Crear archivo:** `/netlify/functions/test-body-minimal.js`

```javascript
export default async (event) => {
  const timestamp = new Date().toISOString();
  
  // Logging máximo
  console.error(`[${timestamp}] 1. Function started`);
  console.error(`[${timestamp}] 2. event.body type: ${typeof event.body}`);
  console.error(`[${timestamp}] 3. event.body is null: ${event.body === null}`);
  console.error(`[${timestamp}] 4. event.body is undefined: ${event.body === undefined}`);
  
  // Intentar acceder a .text()
  if (event.body && typeof event.body.text === 'function') {
    console.error(`[${timestamp}] 5. Has .text() method`);
    try {
      const text = await event.body.text();
      console.error(`[${timestamp}] 6. Text extracted, length: ${text.length}`);
      console.error(`[${timestamp}] 7. Text content: ${text.substring(0, 100)}`);
      return new Response(JSON.stringify({ success: true, length: text.length }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (e) {
      console.error(`[${timestamp}] 6. ERROR calling .text(): ${e.message}`);
      return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
  } else {
    console.error(`[${timestamp}] 5. No .text() method, body is:`, event.body);
    return new Response(JSON.stringify({ error: 'No body or .text method' }), { status: 400 });
  }
};
```

**Luego:** Push, deploy, hacer fetch a esta función, revisar logs.

---

## 💡 SOLUCIONES PROBADAS Y ALTERNATIVAS

### Solución A: ReadableStream .text() (ACTUAL - INEFECTIVA)

**Código Actual (línea 23-33):**
```javascript
if (typeof event.body?.text === 'function') {
  bodyText = await event.body.text();
}
```

**Problema:** Detecta mal o .text() no existe  
**Alternativa:** Usar `instanceof ReadableStream`

```javascript
if (event.body instanceof ReadableStream) {
  const reader = event.body.getReader();
  const chunks = [];
  let result = await reader.read();
  while (!result.done) {
    chunks.push(new TextDecoder().decode(result.value));
    result = await reader.read();
  }
  bodyText = chunks.join('');
}
```

---

### Solución B: Convertir Response
**Alternativa si ReadableStream no coopera:**

```javascript
if (event.body) {
  try {
    const response = new Response(event.body);
    bodyText = await response.text();
  } catch (e) {
    // Fallback a string
    bodyText = String(event.body);
  }
}
```

---

### Solución C: Acceso Directo (SI ES STRING)
**Si event.body ya es string:**

```javascript
let bodyText = null;

if (typeof event.body === 'string') {
  bodyText = event.body;
} else if (typeof event.body === 'object' && event.body !== null) {
  // Ya es objeto parseado
  return event.body;
} else if (event.body && typeof event.body.text === 'function') {
  // ReadableStream
  bodyText = await event.body.text();
}
```

---

### Solución D: Usar Middleware Netlify
**Si Netlify tiene middleware de parsing:**

```javascript
// Algunos runtimes de Netlify parsean automáticamente:
if (event.body && typeof event.body === 'object') {
  // Ya parseado, retornar directo
  return event.body;
}
// Si no, seguir intentos anteriores
```

---

## 🚀 PLAN DE ACCIÓN RECOMENDADO

### Fase 1: DIAGNÓSTICO (30 minutos)
```
1. Editar create-diagnostic-order.js línea 83
2. Cambiar console.log a console.error con timestamp
3. Deploy y probar formulario
4. Revisar Netlify logs
→ Resultado: Sabremos dónde exactamente falla
```

### Fase 2A: SI NO HAY LOGS (Revisión Build)
```
1. Revisar Netlify build logs por syntax errors
2. Revisar imports y módulos
3. Intentar build local con esbuild
4. Solucionar syntax o dependency issues
```

### Fase 2B: SI HAY LOGS PERO event.body = undefined
```
1. Analizar headers recibidos
2. Verificar que Content-Type: application/json se envía
3. Intentar Solución C (acceso directo)
4. Si funciona: cambiar permanentemente
```

### Fase 2C: SI event.body EXISTE pero .text() falla
```
1. Intentar Solución B (Response wrapper)
2. Si funciona: reemplazar Solución A
3. Si no funciona: Intentar Solución A con instanceof
```

### Fase 3: VALIDACIÓN (15 minutos)
```
1. Llenar formulario completo
2. Verificar que POST se envía
3. Revisar que logs muestren parsing exitoso
4. Confirmar que mercadoPagoUrl se retorna
5. Verificar que email se envía a asesor
```

---

## 🔧 CÓDIGO FIX RECOMENDADO (MEJOR PRÁCTICA)

**Nueva versión robusta de parseBody():**

```javascript
async function parseBody(event) {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] parseBody START`);
  
  if (!event.body) {
    console.error(`[${timestamp}] Body is null/undefined`);
    return null;
  }

  let bodyText = null;

  try {
    // Opción 1: Es ReadableStream con .text()
    if (typeof event.body?.text === 'function') {
      console.error(`[${timestamp}] Parsing ReadableStream with .text()`);
      bodyText = await event.body.text();
    }
    // Opción 2: Es string
    else if (typeof event.body === 'string') {
      console.error(`[${timestamp}] Body is string`);
      bodyText = event.body;
    }
    // Opción 3: Es objeto ya parseado
    else if (typeof event.body === 'object') {
      console.error(`[${timestamp}] Body is object, returning direct`);
      return event.body;
    }
    // Opción 4: Intentar Response wrapper
    else {
      console.error(`[${timestamp}] Attempting Response wrapper`);
      bodyText = await new Response(event.body).text();
    }
  } catch (e) {
    console.error(`[${timestamp}] ERROR during body extraction: ${e.message}`);
    return null;
  }

  if (!bodyText) {
    console.error(`[${timestamp}] No bodyText extracted`);
    return null;
  }

  // Intentar parse
  try {
    console.error(`[${timestamp}] Attempting JSON.parse on text length: ${bodyText.length}`);
    const parsed = JSON.parse(bodyText);
    console.error(`[${timestamp}] JSON parse SUCCESS, keys: ${Object.keys(parsed).length}`);
    return parsed;
  } catch (e) {
    console.error(`[${timestamp}] JSON parse FAILED: ${e.message}`);
    
    // Fallback a form-urlencoded
    try {
      console.error(`[${timestamp}] Attempting URLSearchParams parse`);
      const params = new URLSearchParams(bodyText);
      const obj = {};
      for (const [key, value] of params) {
        obj[key] = value;
      }
      console.error(`[${timestamp}] URLSearchParams SUCCESS, keys: ${Object.keys(obj).length}`);
      return Object.keys(obj).length > 0 ? obj : null;
    } catch (e2) {
      console.error(`[${timestamp}] URLSearchParams FAILED: ${e2.message}`);
      return null;
    }
  }
}
```

---

## 📊 TABLA DE SÍNTOMAS vs CAUSA

| Síntoma | Logs Vacíos | event.body exists | .text() works | Causa Probable | Fix |
|---------|-----------|-------------------|---------------|----------------|-----|
| 🔴 | SÍ | N/A | N/A | Función no ejecuta | Revisar build logs |
| 🔴 | NO | undefined | N/A | Body no llega | Verificar headers/request |
| 🔴 | NO | object | Sí | Parser de JSON falla | Debug JSON content |
| 🔴 | NO | object | NO | ReadableStream detection falla | Usar Response wrapper |

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

- [ ] Agregar timestamps a console.error
- [ ] Deploy a Netlify
- [ ] Probar formulario
- [ ] Revisar logs en Netlify
- [ ] Identificar escenario (1, 2 o 3)
- [ ] Implementar fix correspondiente
- [ ] Re-deploy
- [ ] Verificar en logs que parseBody completó
- [ ] Verificar que mercadoPagoUrl se retorna
- [ ] Verificar que email se envía
- [ ] Test end-to-end con formulario real

---

**Estado:** Esperando ejecución del diagnóstico  
**Próximo Paso:** Implementar PASO 1 del Plan de Acción
