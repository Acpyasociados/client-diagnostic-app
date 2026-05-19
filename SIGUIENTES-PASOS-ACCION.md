# ⚡ PLAN DE ACCIÓN INMEDIATO - Próximas 24 Horas

**Objetivo:** Restaurar la funcionalidad de la plataforma ACP y lograr 100% conversión de formularios a pagos  
**Tiempo Estimado:** 2-4 horas  
**Complejidad:** Media (diagnóstico + 1-2 fixes)

---

## 🎯 PRIORIDAD ABSOLUTA: RESOLVER event.body null

Este problema bloquea completamente la conversión de leads. Es la #1.

---

## ACCIÓN 1: Verificar que función se ejecuta (15 min)

### Paso 1.1: Editar create-diagnostic-order.js

**Ubicación:** `/netlify/functions/create-diagnostic-order.js`  
**Línea:** 84 (la línea del primer console.log)

**Cambiar ESTO:**
```javascript
console.log('=== CREATE-DIAGNOSTIC-ORDER START ===');
```

**A ESTO:**
```javascript
// Usar console.error para garantizar que se capture
const now = new Date().toISOString();
console.error(`🔴 [${now}] CREATE-DIAGNOSTIC-ORDER STARTED - WAITING FOR BODY`);
```

**Por qué?** console.error se captura mejor en Netlify logs que console.log

### Paso 1.2: Agregar más logging visible

**Líneas 11-13 - REEMPLAZAR:**
```javascript
console.log('event.body exists:', 'body' in event);
console.log('event.body type:', typeof event.body);
console.log('event.body has .text method:', typeof event.body?.text === 'function');
```

**CON ESTO:**
```javascript
const hasBody = 'body' in event;
const bodyType = typeof event.body;
const hasText = typeof event.body?.text === 'function';

console.error(`[${now}] BODY CHECK: exists=${hasBody}, type=${bodyType}, hasText=${hasText}`);
console.error(`[${now}] event.body value: ${String(event.body).substring(0, 50)}`);
```

### Paso 1.3: Commit y Deploy
```powershell
# En PowerShell, desde la carpeta del proyecto:
cd "C:\Users\Admin\Documents\Claude\Projects\Acp y Asociados"

git add netlify/functions/create-diagnostic-order.js
git commit -m "Debug: Agregar logging exhaustivo para diagnosticar event.body"
git push origin main

# Esperar a que Netlify compile (2-3 minutos)
```

### Paso 1.4: Probar y revisar logs
```
1. Ir a https://acp-asociados.netlify.app
2. Llenar formulario completamente
3. Hacer clic en "Continuar al Pago"
4. Ir a https://app.netlify.com → Tu Site → Functions → create-diagnostic-order
5. Buscar la invocación más reciente
6. Hacer clic para ver logs completos
7. CAPTURAR SCREENSHOT de los logs
```

**Resultado esperado:** Deberías ver líneas como:
```
🔴 [2026-05-18T15:30:45.123Z] CREATE-DIAGNOSTIC-ORDER STARTED - WAITING FOR BODY
[2026-05-18T15:30:45.125Z] BODY CHECK: exists=true, type=object, hasText=true
```

**Si ves esto:** ¡Buena noticia! La función se ejecuta, y podemos seguir con Acción 2.

**Si NO ves logs:** Hay error de compilación → Ir a Acción 3.

---

## ACCIÓN 2: Si hay logs, Fix el parseBody (30 min)

**Prerequisito:** Acción 1 mostró que logs aparecen

### Paso 2.1: Analizar logs de parseBody

En los logs de Netlify, busca la línea que dice:
```
[timestamp] BODY CHECK: exists=X, type=Y, hasText=Z
```

Anota los valores de X, Y, Z:
- `exists=true` → body se recibió ✓
- `type=object` → body es un objeto ✓
- `hasText=true` → tiene método .text() ✓

**Si los 3 son correctos:** El problema está en `event.body.text()` - ir a 2.2

**Si alguno es false:** El problema es que body no llegó como esperado - ir a 2.3

### Paso 2.2: Si .text() existe pero falla

Reemplazar la función parseBody completa por esta:

```javascript
// Parse body - Netlify Functions envía el body como ReadableStream
async function parseBody(event) {
  const now = new Date().toISOString();
  console.error(`[${now}] parseBody START`);
  
  if (!event.body) {
    console.error(`[${now}] Body is null/undefined, returning null`);
    return null;
  }

  let bodyText = null;

  // Estrategia 1: ReadableStream con .text()
  if (typeof event.body?.text === 'function') {
    console.error(`[${now}] Intentando strategy 1: ReadableStream.text()`);
    try {
      bodyText = await event.body.text();
      console.error(`[${now}] ✓ Strategy 1 SUCCESS, length=${bodyText.length}`);
    } catch (e) {
      console.error(`[${now}] ✗ Strategy 1 FAILED: ${e.message}`);
      console.error(`[${now}] Intentando strategy 2...`);
      
      // Estrategia 2: Response wrapper
      try {
        bodyText = await new Response(event.body).text();
        console.error(`[${now}] ✓ Strategy 2 SUCCESS, length=${bodyText.length}`);
      } catch (e2) {
        console.error(`[${now}] ✗ Strategy 2 FAILED: ${e2.message}`);
        return null;
      }
    }
  }
  // Estrategia 3: Ya es string
  else if (typeof event.body === 'string') {
    console.error(`[${now}] Strategy 3: Body es string`);
    bodyText = event.body;
  }
  // Estrategia 4: Ya es objeto
  else if (typeof event.body === 'object') {
    console.error(`[${now}] Strategy 4: Body es object, retornando directo`);
    return event.body;
  }
  else {
    console.error(`[${now}] Body type unknown: ${typeof event.body}`);
    return null;
  }

  if (!bodyText) {
    console.error(`[${now}] No bodyText disponible`);
    return null;
  }

  // JSON parse
  try {
    console.error(`[${now}] Intentando JSON.parse (length=${bodyText.length})`);
    const parsed = JSON.parse(bodyText);
    console.error(`[${now}] ✓ JSON.parse SUCCESS, ${Object.keys(parsed).length} keys`);
    return parsed;
  } catch (e) {
    console.error(`[${now}] ✗ JSON.parse FAILED: ${e.message}, intentando URLSearchParams`);

    // Fallback a form-urlencoded
    try {
      const params = new URLSearchParams(bodyText);
      const obj = {};
      for (const [key, value] of params) {
        obj[key] = value;
      }
      const result = Object.keys(obj).length > 0 ? obj : null;
      console.error(`[${now}] ✓ URLSearchParams SUCCESS, ${Object.keys(obj).length} keys`);
      return result;
    } catch (e2) {
      console.error(`[${now}] ✗ URLSearchParams FAILED: ${e2.message}`);
      return null;
    }
  }
}
```

### Paso 2.3: Si body no llegó (.exists=false o .type=undefined)

Esto significa que Netlify no está enviando el body correctamente.

**Fix alternativo - Acceso directo a event:**
```javascript
async function parseBody(event) {
  const now = new Date().toISOString();
  console.error(`[${now}] parseBody START - Alternative approach`);
  
  // Si Netlify ya parseó el body como objeto
  if (event.body && typeof event.body === 'object' && !event.body.arrayBuffer) {
    console.error(`[${now}] Body es ya objeto parseado, retornando`);
    return event.body;
  }
  
  // Si es ReadableStream
  if (event.body && typeof event.body.text === 'function') {
    console.error(`[${now}] Body es ReadableStream`);
    try {
      const text = await event.body.text();
      console.error(`[${now}] Converted to text, parsing JSON`);
      return JSON.parse(text);
    } catch (e) {
      console.error(`[${now}] ERROR: ${e.message}`);
      return null;
    }
  }
  
  // Si es string
  if (typeof event.body === 'string') {
    console.error(`[${now}] Body es string`);
    return JSON.parse(event.body);
  }
  
  console.error(`[${now}] Body inusual: type=${typeof event.body}`);
  return null;
}
```

### Paso 2.4: Commit y re-deploy
```powershell
git add netlify/functions/create-diagnostic-order.js
git commit -m "Fix: Mejorar estrategias de parsing de ReadableStream con fallbacks"
git push origin main

# Esperar 2-3 minutos a que compile
```

### Paso 2.5: Probar nuevamente
- Llenar formulario
- Submit
- Revisar logs en Netlify
- **Debería ver:** `✓ Strategy X SUCCESS`
- **Debería ver:** `✓ JSON.parse SUCCESS` o `✓ URLSearchParams SUCCESS`
- **Debería ver:** Campos parseados correctamente
- **Debería ver:** Mercado Pago preference creation

Si todo dice ✓, entonces el problema está RESUELTO.

---

## ACCIÓN 3: Si NO hay logs (Revisar Build) (20 min)

**Prerequisito:** Acción 1 NO mostró logs en Netlify

### Paso 3.1: Revisar Build Log
```
1. https://app.netlify.com → Tu Site → Deploys
2. Haz clic en el último deploy (el que acabas de hacer)
3. Haz clic en "Deploy log"
4. Busca la palabra "error" (Ctrl+F)
5. Anota CUALQUIER línea roja o con ERROR
```

### Paso 3.2: Problemas comunes y fixes

**Si ves:**
```
ERROR: Could not find module '@netlify/blobs'
```
**Fix:** Agregar a netlify.toml:
```toml
external_node_modules = ["@netlify/blobs", "@sendgrid/mail"]
```

**Si ves:**
```
SyntaxError in create-diagnostic-order.js
```
**Fix:** Validar archivo con:
```powershell
# En PowerShell
Get-Content "netlify/functions/create-diagnostic-order.js" | Out-Null
```

**Si ves:**
```
esbuild compilation failed
```
**Fix:** Revisar imports en el archivo, quizás faltan quote en strings

### Paso 3.3: Solución Nuclear (si todo falla)

Reemplazar create-diagnostic-order.js por versión minimal que funciona:

**Crear archivo:** `/netlify/functions/create-diagnostic-order-v2.js`

```javascript
export default async (event) => {
  console.error('FUNCTION START');
  
  if (event.httpMethod !== 'POST') {
    return new Response(JSON.stringify({ error: 'POST only' }), { status: 405 });
  }

  try {
    // Parse body
    let body;
    
    if (event.body && typeof event.body.text === 'function') {
      const text = await event.body.text();
      body = JSON.parse(text);
    } else if (typeof event.body === 'object') {
      body = event.body;
    } else {
      throw new Error('No valid body');
    }

    console.error('BODY PARSED: ', Object.keys(body).join(','));

    // Para prueba: retornar dummy response
    return new Response(JSON.stringify({
      success: true,
      lead_id: 'test-123',
      mercadoPagoUrl: 'https://www.mercadopago.com.ar/checkout/test'
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (e) {
    console.error('ERROR: ', e.message);
    return new Response(JSON.stringify({ error: e.message }), { status: 400 });
  }
};
```

Luego en el frontend, cambiar endpoint a esta nueva función (línea 899):
```javascript
const response = await fetch('/.netlify/functions/create-diagnostic-order-v2', {
```

Deploy y probar.

---

## 📋 ORDEN DE EJECUCIÓN

**Hoy (18 Mayo):**

1. **Acción 1** (15 min) → Saber si función se ejecuta
   
2. **Si Acción 1 muestra logs:**
   - **Acción 2** (30 min) → Fix parseBody
   - **Validación** (15 min) → Test completo
   
3. **Si Acción 1 NO muestra logs:**
   - **Acción 3** (20 min) → Debug build
   - **Si aún falla:** Usar Solución Nuclear (15 min)
   - **Validación** (15 min) → Test completo

**Total:** 2-3 horas máximo

---

## ✅ VALIDACIÓN FINAL

Una vez completes una Acción, validar así:

```
1. Ir a https://acp-asociados.netlify.app
2. Llenar COMPLETAMENTE el formulario:
   - Nombre: "Test User"
   - Email: "patriciosilvavalenzuela@gmail.com"
   - Teléfono: "+56 9 4401 8594"
   - Empresa: "Test Corp"
   - Sector: (cualquier opción)
   - Ventas Mensuales: "500000"
   - Margen: "25"
   - Clientes Activos: "50"
   - Costos Principales: "Arriendo"
   - Desafío Principal: "Rentabilidad"
   - Objetivo 6M: "Mejorar márgenes"
   - Plan: Seleccionar Básico o Premium
   
3. Click "Continuar al Pago"
4. DEBE aparecer:
   - ✅ Overlay con "Redirigiendo a Mercado Pago..."
   - ✅ Redirección automática a página de pago
   - ✅ O link para pagar manualmente
```

**Si aparece overlay:** ¡ÉXITO! Problema resuelto.

**Si NO aparece:** Revisar Netlify logs nuevamente para siguiente error.

---

## 🚨 CHECKLIST ANTES DE PUSH

- [ ] Editar create-diagnostic-order.js con console.error
- [ ] Guardar archivo
- [ ] Revisar que no haya syntax errors (colores en editor)
- [ ] `git add` el archivo
- [ ] `git commit` con mensaje descriptivo
- [ ] `git push origin main` desde PowerShell
- [ ] Esperar email de Netlify confirmando deploy
- [ ] Revisar https://app.netlify.com que deploy dice "Published"

---

## 📞 SI NECESITAS AYUDA

1. Captura screenshot de los logs
2. Copia el error exacto
3. Envía a: **asesor.pac@gmail.com** con asunto "Netlify Function Debug - event.body"

---

**Documento creado:** 18 Mayo 2026  
**Prioridad:** URGENTE  
**Próxima revisión:** Después de Acción 1
