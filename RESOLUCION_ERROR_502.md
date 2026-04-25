# 🔍 Diagnóstico Detallado del Error 502 en Mercado Pago

## Problema Encontrado

El error **502 Bad Gateway** es causado por un **SyntaxError** cuando la función `submit-lead` intenta parsear la respuesta de Mercado Pago como JSON:

```
SyntaxError: Unexpected token 'o', "[object Real"... is not valid JSON
```

### ¿Por qué sucede esto?

1. **La solicitud a Mercado Pago API está fallando** (probablemente con status 401, 403, o 400)
2. **La respuesta NO es JSON válido** (es HTML de error o texto plano)
3. **El código intenta parsear con `.json()` sin verificar el status HTTP primero**
4. Cuando falla el parsing JSON, la función lanzan una excepción no manejada
5. Netlify convierte esta excepción en error **502 Bad Gateway**

---

## 🎯 Posibles Causas del Error de Mercado Pago

### 1. **Token de TEST vs PRODUCCIÓN**
- ❌ **Problema**: Estás usando un token de **TEST** cuando deberías usar **PRODUCCIÓN**
- ✅ **Solución**: En Mercado Pago, asegúrate de:
  - Ir a: https://www.mercadopago.cl/developers/panel
  - Copiar el Access Token de **"Producción"** (NOT "Test Mode")
  - Los tokens de PRODUCCIÓN son más largos y comienzan con `APP_USR-`

### 2. **Token Inválido o Expirado**
- El token `APP_USR-7431677780921638-042314-2b5c8e25f529b6ed6f29cd358e6727ed-3354993713` podría ser:
  - De TEST (no de PRODUCCIÓN)
  - Expirado
  - Con formato incorrecto

### 3. **Espacios o Caracteres Extra**
- El token en Netlify podría tener espacios en blanco, saltos de línea, o comillas adicionales

---

## ✅ Pasos para Resolver

### Paso 1: Reemplazar el Archivo `submit-lead.js`

He creado un archivo mejorado llamado **`submit-lead-MEJORADO.js`** que:
- ✓ Verifica el status HTTP ANTES de parsear JSON
- ✓ Proporciona mensajes de error claros y detallados
- ✓ Guarda logs de diagnóstico que verás en la consola de Netlify
- ✓ Maneja excepciones de network correctamente

**Cómo hacer esto:**

1. **Opción A - Editar en GitHub:**
   - Abre: https://github.com/Acpyasociados/client-diagnostic-app
   - Ve a: `client-diagnostic-app/netlify/functions/submit-lead.js`
   - Haz clic en el ícono de edición (lápiz)
   - Reemplaza TODO el contenido con el del archivo `submit-lead-MEJORADO.js`
   - Commit con mensaje: "Mejorar error handling en submit-lead"

2. **Opción B - Via Terminal (si tienes acceso):**
   ```bash
   cp submit-lead-MEJORADO.js client-diagnostic-app/netlify/functions/submit-lead.js
   git add client-diagnostic-app/netlify/functions/submit-lead.js
   git commit -m "Mejorar error handling en submit-lead para diagnosticar Mercado Pago"
   git push origin main
   ```

### Paso 2: Verificar el Token de Mercado Pago

**CRÍTICO**: El token que proporcionaste parece ser de TEST. Necesitas:

1. **Ir a Mercado Pago** → https://www.mercadopago.cl/developers/panel/credentials
2. **Seleccionar "Producción"** (no "Test Mode")
3. **Copiar exactamente el Access Token** sin espacios extras
4. **En Netlify**, actualizar la variable:
   - Ir a: https://app.netlify.com/sites/client-diagnostic-app/settings/deploys
   - Sección: "Build & deploy → Environment variables"
   - Busca: `MERCADOPAGO_ACCESS_TOKEN`
   - **Reemplaza completamente** con el token de PRODUCCIÓN
   - Guarda los cambios

### Paso 3: Triggear un Nuevo Deploy

Una vez actualizado el token:

1. Ir a: https://app.netlify.com/sites/client-diagnostic-app/deploys
2. Hacer clic en **"Trigger deploy" → "Deploy site"**
3. **Esperar** a que el deploy complete (estado "Published")

### Paso 4: Probar Nuevamente

1. Ir a: https://client-diagnostic-app.netlify.app/
2. Llenar el formulario con datos de prueba
3. Hacer clic en "Continuar a pago"

**Qué debería pasar:**
- ✅ Si funciona: Se redirige a Mercado Pago Checkout
- ❌ Si falla: Verás un mensaje de error claro que explique qué está mal

### Paso 5: Diagnosticar si Sigue Fallando

Si sigue fallando, verifica los logs de Netlify:

1. Ir a: https://app.netlify.com/sites/client-diagnostic-app/functions
2. Hacer clic en **"submit-lead"**
3. Busca el error en los logs más recientes
4. El error debería mostrar:
   - **Token length** (cuántos caracteres tiene)
   - **Token prefix** (primeros 20 caracteres)
   - **MP status** (código de error de Mercado Pago)
   - **MP message** (mensaje de error específico)

---

## 📝 Checklist de Verificación

- [ ] ¿El token es de PRODUCCIÓN (no TEST)?
- [ ] ¿El token comienza con `APP_USR-`?
- [ ] ¿El token NO tiene espacios al principio o final?
- [ ] ¿Se reemplazó el archivo `submit-lead.js` con la versión mejorada?
- [ ] ¿Se hizo deploy en Netlify después de los cambios?
- [ ] ¿Los logs de Netlify muestran "Mercado Pago response status: 201"?

---

## 🔗 Enlaces Útiles

- **Netlify Functions Logs**: https://app.netlify.com/sites/client-diagnostic-app/functions
- **Mercado Pago Credentials**: https://www.mercadopago.cl/developers/panel/credentials
- **Netlify Deploy Page**: https://app.netlify.com/sites/client-diagnostic-app/deploys
- **Netlify Environment Variables**: https://app.netlify.com/sites/client-diagnostic-app/settings/builds

---

## ❓ Preguntas Frecuentes

### "¿El error 502 significa que Mercado Pago está caído?"
No, significa que tu función serverless está lanzando una excepción. Mercado Pago probablemente está respondiendo con un error (401, 403, etc.), pero tu código no lo maneja correctamente.

### "¿Puedo usar un token de TEST?"
No recomendado para producción. En Netlify debe ser de PRODUCCIÓN. Si quieres testear primero localmente con TEST, ese está bien, pero para Netlify debe ser PRODUCCIÓN.

### "¿Cuánto tarda el deploy?"
Normalmente 7-30 segundos. Espera a que diga "Published" en verde.

### "¿Qué pasa después de que funcione?"
Una vez que Mercado Pago responda correctamente (status 201), el flujo continuará:
1. Crear lead en almacenamiento
2. Redirigir a checkout de Mercado Pago
3. Cliente completa el pago
4. Webhook de Mercado Pago confirma el pago
5. Enviar cuestionario al email
6. Cliente completa cuestionario
7. Generar reporte diagnóstico
8. Usuario aprueba y publica

---

## 📞 Siguiente Paso

1. **Reemplaza submit-lead.js** con la versión mejorada
2. **Verifica y actualiza el token** en Netlify
3. **Haz deploy** nuevamente
4. **Prueba el formulario** y observa los logs
5. **Comparte los mensajes de error** específicos si sigue fallando

¡El archivo mejorado debería ayudarte a identificar exactamente dónde está el problema!
