# Lecciones Aprendidas - ACP Diagnostic System

## Errores Encontrados y Soluciones

### Error 1: Form Security Issue (GET vs POST)
**Problema:** El formulario originalmente usaba método GET (por defecto), exponiendo datos sensibles en la URL.
**Síntoma:** URLs como `?name=Carlos&email=...&phone=...` visibles en navegador y logs.
**Solución:** Agregar `method="post"` al formulario HTML (línea 409).
**Impacto:** Protege datos confidenciales del cliente (teléfono, email, info de negocio).
**Lección:** SIEMPRE especificar `method="post"` explícitamente para formularios con datos sensibles.

### Error 2: Missing Phone Validation Pattern
**Problema:** Campo WhatsApp aceptaba cualquier formato, sin validar números chilenos.
**Síntoma:** Aceptaba "+123" o "abcdef" sin error.
**Solución:** Agregar patrón regex `^\+56\s?9\s?\d{4}\s?\d{4}$` al input (línea 429).
**Impacto:** Asegura que solo números chilenos válidos sean aceptados.
**Lección:** Validación en cliente + servidor es crítica para datos específicos de región.

### Error 3: Missing Environment Variables (PRICE_BASIC_CLP, PRICE_PREMIUM_CLP)
**Problema:** La función serverless `create-diagnostic-order.js` requería estas variables para crear preferencia en Mercado Pago, pero no estaban configuradas en Netlify.
**Síntoma:** Error "Failed to fetch" al enviar formulario, sin crear preferencia de pago.
**Causa Raíz:** Variables de entorno no documentadas en README.md, deployer olvidó configurarlas.
**Solución:** 
1. Identificar función que necesitaba las variables
2. Agregar variables a Netlify UI: Settings > Environment variables
3. Forzar redepliegue (git push)
**Impacto:** Sin esto, clientes no podían proceder al pago.
**Lección:** 
- DOCUMENTAR todas las env vars requeridas en README.md
- Listar en `netlify.toml` como fallback o validación
- Agregar verificación en función para error más claro: "Missing PRICE_BASIC_CLP..."

### Error 4: Dropdown Selections Not Persisting Visually
**Problema:** Seleccionar opciones en dropdowns no mostraba el valor seleccionado en pantalla.
**Síntoma:** Después de seleccionar "Tecnología y Software", dropdown mostraba "Selecciona..."
**Causa Raíz:** Manejo inconsistente del estado del formulario con JavaScript.
**Workaround:** Usar herramienta `form_input` en lugar de clics manuales para establecer valores.
**Lección:** Cuando el click no persiste, la herramienta programática (form_input, setValue) es más confiable.

## Mejores Prácticas Descubiertas

### 1. Variables de Entorno Críticas
```
SIEMPRE crear un .env.example con TODAS las variables requeridas
SIEMPRE agregar validación en funciones serverless:
  if (!process.env.PRICE_BASIC_CLP) {
    throw new Error('Missing PRICE_BASIC_CLP in environment');
  }
SIEMPRE documentar en README.md qué hace cada variable
```

### 2. Form Security
- POST para datos sensibles
- Validación de entrada con regex
- No usar GET nunca para formularios de pago/auth
- Test end-to-end antes de producción

### 3. Netlify Functions Debugging
```bash
# Ver logs de función en tiempo real:
netlify logs --function=create-diagnostic-order

# Test local:
netlify functions:invoke create-diagnostic-order --payload '{...}'

# Siempre enviar error detallado al cliente (no ocultar):
return { statusCode: 400, body: JSON.stringify({ error: 'Especific reason here' }) }
```

### 4. Deployment Checklist
- [ ] Todas las env vars están en Netlify UI
- [ ] README.md documenta CADA variable
- [ ] Función valida que existan: `if (!process.env.VAR) throw new Error(...)`
- [ ] Test del formulario end-to-end completo
- [ ] Webhook probado con datos reales
- [ ] Email notifications verificadas
- [ ] Logs limpios (no errores ocultos)

### 5. Testing Approach
Para formularios complejos con múltiples pasos:
1. Llenar todos los campos manualmente
2. Verificar cada sección completa
3. Enviar y verificar redirección
4. Revisar que datos llegaron correctamente al backend
5. Verificar notificaciones de email
6. Validar que webhook procesa correctamente

## Auto-Reparación: Cómo Este Proyecto Se Arregló a Sí Mismo

### Ciclo Automatizado Implementado
1. **Identificar:** Error "Failed to fetch" → Investigar función → Encontrar variable faltante
2. **Localizar:** Ver qué función necesita PRICE_BASIC_CLP → Leer código
3. **Documentar:** Actualizar CLAUDE.md con la causa y solución
4. **Reparar:** 
   - Agregar variable a Netlify environment
   - Hacer push (trigger redepliegue automático)
5. **Validar:** Test end-to-end del formulario → Verificar redirect a Mercado Pago
6. **Prevenir:** Agregar a CLAUDE.md para próximas instancias

### Recursos Para Futuros Proyectos Similares
- Revisar CLAUDE.md primera cuando encuentres error
- Buscar sección "Known Issues & Solutions" 
- Buscar logs: `netlify logs --function=<name>`
- Verificar env vars: `netlify env:list`
- Test: Usar formulario de prueba completo antes de debugging

## Recomendaciones Para Proyectos Futuros

### 1. Template de Checklist para Netlify + Mercado Pago
```markdown
## Pre-Deployment Validation
- [ ] PRICE_BASIC_CLP set in Netlify
- [ ] PRICE_PREMIUM_CLP set in Netlify
- [ ] MERCADO_PAGO_ACCESS_TOKEN is PRODUCTION (not test)
- [ ] Phone regex matches target country
- [ ] Form method="post"
- [ ] All required fields in requiredFields array
- [ ] Error messages are specific (not generic "Failed to fetch")
```

### 2. Environment Variable Validation Pattern
```javascript
// Add to functions that depend on env vars:
const requiredEnvVars = ['PRICE_BASIC_CLP', 'PRICE_PREMIUM_CLP', 'MERCADO_PAGO_ACCESS_TOKEN'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`ERROR: Missing ${envVar}`);
    return { statusCode: 500, body: JSON.stringify({ error: `Server misconfiguration: ${envVar} not set` }) };
  }
}
```

### 3. Form Validation Best Practices
- Define `requiredFields` array in function
- Validate each field individually
- Return specific error for which field is missing
- Log validation errors with context

### 4. Webhook Testing Procedure
```bash
# Create test webhook payload:
netlify functions:invoke mercadopago-webhook --payload '{
  "data": {"id": 12345},
  "type": "payment",
  "action": "payment.approved"
}'

# Verify response indicates success
# Check Blobs storage to confirm case was updated
```

---

**Documento Creado:** 2026-05-23  
**Próxima Revisión:** Después de próxima iteración del proyecto
**Mantenedor:** Claude Code AI Assistant

---

## Session 2026-05-23: Price Update & End-to-End Testing

### Issue 1: ❌ Multiple Hardcoded Price Values (CRITICAL)
**Severity**: 🔴 CRITICAL

**Problem**: Prices hardcoded in FIVE separate locations instead of using single source of truth:
- Line 546: HTML label for basic plan `$1` 
- Line 552: HTML label for premium plan `$11`
- Line 570: Button text initial value `Continuar al Pago ($1)`
- Line 666: Form submission price value `price: 1 : 11` ⚠️ **MOST CRITICAL**
- Line 719: Error handler fallback prices

**Symptom**: Updated button display to $1.000 but Mercado Pago still showed $1 due to form submission using old hardcoded values.

**Root Cause**: No centralized price constant. Each developer location used its own value.

**Solution**:
1. Located ALL price occurrences with grep
2. Updated each location: 1→1000, 11→11000
3. Verified changes in git diff before committing
4. Tested end-to-end to confirm backend received correct value

**Commits**:
- `afbfaf4`: Updated HTML labels and button text
- `00d6534`: Fixed button initial text
- `6b3fdc8`: **CRITICAL FIX** - Corrected form submission prices (1000/11000)

**Lesson**: 
> **ALWAYS search for ALL occurrences of a value using grep before updating. One missed location can break the entire flow.**

---

### Issue 2: ⚠️ Form Validation: Digital Presence Radio Button
**Severity**: 🟠 MEDIUM

**Problem**: Form `checkValidity()` returned false because `digital_presence` radio button wasn't registering.

**Symptom**: Form wouldn't submit even though field was clicked.

**Root Cause**: Simple `.click()` doesn't trigger validation events on radio buttons.

**Solution**:
```javascript
// Before (didn't work):
radioButton.click()

// After (works):
radioButton.checked = true;
radioButton.dispatchEvent(new Event('change', { bubbles: true }));
```

**Lesson**:
> **When setting radio/checkbox values programmatically, dispatch change events explicitly for validation to register.**

---

### Issue 3: ⚠️ Browser Cache Blocking JavaScript Updates
**Severity**: 🟡 LOW

**Problem**: Updated JavaScript prices to 1000/11000 but browser still served old cached version (1/11).

**Solution**: Hard refresh with Ctrl+Shift+R (not just F5).

**Lesson**:
> **After code updates, always use Ctrl+Shift+R hard refresh. Regular F5 may serve cached JavaScript.**

---

### Issue 4: ⚠️ Environment Variables Not Taking Effect Immediately  
**Severity**: 🟡 LOW

**Problem**: Set PRICE_BASIC_CLP=1000 via `netlify env:set` but function still used old value.

**Root Cause**: Environment variable changes require a redeploy to take effect.

**Solution**:
```bash
netlify env:set PRICE_BASIC_CLP 1000
netlify env:set PRICE_PREMIUM_CLP 11000
netlify deploy --prod --trigger  # Force redeploy
```

**Lesson**:
> **Environment variable changes don't take effect without a redeploy. Use --trigger to force immediate rebuild.**

---

## End-to-End Test Results

| Component | Status | Notes |
|-----------|--------|-------|
| Form Section 1 (Company Info) | ✅ Pass | All 5 fields filled and validated |
| Form Section 2 (Business Profile) | ✅ Pass | Dropdowns and numbers working |
| Form Section 3 (Operations) | ✅ Pass | Text area and radio buttons validated |
| Form Section 4 (Current Situation) | ✅ Pass | Challenge dropdown and objective textarea |
| Form Section 5 (Plan Selection) | ✅ Pass | Plan choice, button price display |
| Form Submission | ✅ Pass | All validation passed, sent to backend |
| Mercado Pago Redirect | ✅ Pass | Payment gateway loaded successfully |
| Price Verification | ✅ Pass | $1.000 CLP sent to backend (1000 in code) |

---

## Code Quality Improvements Made

✅ Consolidated price values from 5 locations to consistent 1000/11000
✅ Verified prices propagated through entire payment flow
✅ Fixed form validation to properly handle radio buttons
✅ Documented environment variable requirements
✅ Tested browser cache handling

---

## Prevention for Future Sessions

### Checklist Before Updating Values
- [ ] Search entire codebase for all occurrences: `grep -r "old_value" .`
- [ ] Update ALL locations, not just the obvious ones
- [ ] Test each location to confirm change took effect
- [ ] Verify in multiple places (UI, network request, backend logs)

### Browser Testing Checklist
- [ ] Hard refresh with Ctrl+Shift+R after code changes
- [ ] Open DevTools Network tab to verify fresh files loaded
- [ ] Check response headers for cache info (should not be cached)
- [ ] Test in Incognito/Private mode if regular caching persists

### Environment Variable Checklist
- [ ] Define in both netlify.toml AND Netlify UI (backup)
- [ ] Add validation in serverless function to catch missing vars
- [ ] Force redeploy after changing vars: `--trigger` flag
- [ ] Verify in function logs that correct values loaded

---

**Session Status**: ✅ COMPLETE
**All Prices Updated**: 1 → 1.000 CLP, 11 → 11.000 CLP
**Next Review**: Monitor production payments for pricing accuracy
