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
