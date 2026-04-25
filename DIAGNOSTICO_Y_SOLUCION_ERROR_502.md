# 🔍 Diagnóstico y Solución: Error 502 en Mercado Pago

## Problema Identificado

El error **502 Bad Gateway** que ocurre al hacer submit del formulario es causado por un problema en la comunicación con **Mercado Pago API**.

### ✅ Lo que funciona correctamente:
- ✓ Formulario se envía sin errores de validación
- ✓ netlify.toml está configurado correctamente  
- ✓ storage.js usa almacenamiento en memoria (Map)
- ✓ submit-lead.js tiene lógica correcta
- ✓ Deploys en Netlify son exitosos

### ❌ Donde falla:
La función `submit-lead.js` llega hasta la llamada a Mercado Pago API pero recibe un error. Las causas posibles son:

1. **Token MERCADOPAGO_ACCESS_TOKEN es inválido**
2. **El token está mal formateado** (espacios, caracteres extras)
3. **Se está usando token de TEST cuando debería ser de PRODUCCIÓN**
4. **El token está expirado**

---

## 🔧 Pasos para Resolver

### Paso 1: Revisar el Token en Mercado Pago

1. **Ir a Mercado Pago Seller (Panel de Control)**
   - URL: https://www.mercadopago.cl/home
   - Inicia sesión con tu cuenta

2. **Navegar a Configuración → Credenciales de API**
   - O acceso directo: https://www.mercadopago.cl/developers/es/guides/faqs/credentials

3. **Copiar el Access Token de PRODUCCIÓN** (NOT de TEST)
   - Deberá ser un string largo que comienza con `APP_USR-` 
   - Ejemplo: `APP_USR-12345678-abcdef...` (mucho más largo)

4. **Verificar que NO tenga:**
   - ❌ Espacios en blanco al principio o final
   - ❌ Saltos de línea
   - ❌ Comillas adicionales

### Paso 2: Actualizar la Variable en Netlify

1. **Ir a Netlify → client-diagnostic-app → Settings**

2. **Ir a: Build & deploy → Environment variables**

3. **Buscar la variable `MERCADOPAGO_ACCESS_TOKEN`**
   - Si existe, hacer click en el ícono de edición (lápiz)
   - Si no existe, hacer click en "New variable"

4. **Actualizar el valor:**
   - **Variable name:** `MERCADOPAGO_ACCESS_TOKEN`
   - **Variable value:** `[El token que copiaste de Mercado Pago]`

5. **Hacer click en "Save"**

### Paso 3: Triggear un Nuevo Deploy en Netlify

1. **Ir a Deploys en Netlify**

2. **Hacer click en "Trigger deploy" → "Deploy site"**

3. **Esperar a que termine el deploy** (generalmente 7-30 segundos)

### Paso 4: Probar la Conexión con Mercado Pago

1. **Abrir en navegador:**
   ```
   https://client-diagnostic-app.netlify.app/api/test-mercadopago
   ```

2. **Interpretar la respuesta:**

   **Si ves esto = ✅ ÉXITO:**
   ```json
   {
     "status": "SUCCESS",
     "message": "Mercado Pago API está funcionando correctamente",
     "preference_id": "...",
     "init_point": "..."
   }
   ```

   **Si ves error = ❌ PROBLEMAS:**
   ```json
   {
     "status": "API_ERROR",
     "error": "[Descripción del error]",
     "mercadopago_response": {...}
   }
   ```

   Posibles errores y soluciones:
   - **"invalid_request"** → Token mal formateado o inválido
   - **"unauthorized"** → Token es de TEST, necesita ser de PRODUCCIÓN
   - **"not_found"** → Token no existe o está expirado

### Paso 5: Probar el Flujo Completo

Una vez que el endpoint de diagnóstico retorna SUCCESS:

1. **Ir a:** https://client-diagnostic-app.netlify.app/

2. **Llenar el formulario con datos de prueba:**
   - Nombre: Tu nombre
   - Email: Tu email de prueba
   - Teléfono: Tu teléfono
   - Empresa: Tu empresa
   - (Completar los demás campos)

3. **Hacer click en "Continuar a pago"**

4. **Verificar que:**
   - ✓ No hay error 502
   - ✓ Se redirige a Mercado Pago Checkout
   - ✓ Puedes ver el resumen del pago

---

## 📝 Resumen del Problema y Solución

| Aspecto | Estado |
|---------|--------|
| Código | ✅ Correcto |
| Configuración Netlify | ⚠️ Token probablemente inválido |
| Solución | Actualizar MERCADOPAGO_ACCESS_TOKEN |
| Tiempo estimado | 5-10 minutos |

---

## 🆘 Si Algo Sale Mal

### El endpoint /api/test-mercadopago no funciona

1. Verifica que Netlify completó el deploy (status "Published")
2. Espera 30 segundos después del deploy
3. Recarga la página (Ctrl+F5 en Windows o Cmd+Shift+R en Mac)

### Mercado Pago sigue retornando errores

1. Verifica que copiaste el token EXACTAMENTE sin espacios
2. Comprueba que es un token de PRODUCCIÓN (no de TEST)
3. Si el token es muy antiguo, considera regenerar uno nuevo en Mercado Pago

### No sabes si tu token es de PRODUCCIÓN o TEST

En Mercado Pago:
- **Tokens de PRODUCCIÓN** comienzan con `APP_USR-` y son muy largos
- **Tokens de TEST** comienzan con `APP_USR-` pero están marcados como "(Test Mode)"

Selecciona siempre el que dice **"Producción"**, no "Test Mode".

---

## 📞 Próximos Pasos Después de Esto

Una vez que el token esté funcionando:

1. ✅ El formulario debería redirigir correctamente a Mercado Pago
2. ✅ Se puede completar el pago de prueba
3. ✅ Se debería recibir el cuestionario por email
4. ✅ Se puede completar el cuestionario
5. ✅ Se genera el reporte de diagnóstico
6. ✅ Se puede revisar y aprobar el reporte

El flujo completo debería funcionar de principio a fin.
