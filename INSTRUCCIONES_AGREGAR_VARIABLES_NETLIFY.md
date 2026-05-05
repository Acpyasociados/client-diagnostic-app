# 🔧 INSTRUCCIONES - Agregar Variables de Entorno en Netlify

**Fecha:** 5 Mayo 2026  
**Objetivo:** Agregar 3 variables de entorno faltantes para que el formulario funcione correctamente

---

## 📋 VARIABLES A AGREGAR

### 1️⃣ **SITE_URL** (CRÍTICA)
```
Key: SITE_URL
Value: https://acp-asociados.netlify.app
```

**¿Por qué?** La función `create-diagnostic-order.js` necesita esta URL para construir el webhook de Mercado Pago correctamente.

---

### 2️⃣ **ADVISOR_EMAIL**
```
Key: ADVISOR_EMAIL
Value: asesor.pac@gmail.com
```

**¿Por qué?** Indica dónde enviar el email cuando alguien completa el formulario.

---

### 3️⃣ **RESEND_API_KEY** (si aún no está)
```
Key: RESEND_API_KEY
Value: [Tu API key de Resend - ver más abajo]
```

**¿Por qué?** La función `send-advisor-email.js` usa Resend para enviar emails.

---

## ✅ INSTRUCCIONES PASO A PASO

### **OPCIÓN A: UI de Netlify (Recomendado)**

1. **Abre esta URL:**
   ```
   https://app.netlify.com/sites/acp-asociados/settings/environment
   ```

2. **Click en "Add a variable" (botón turquoise)**

3. **PRIMERA VARIABLE: SITE_URL**
   - **Key:** `SITE_URL`
   - **Value:** `https://acp-asociados.netlify.app`
   - **Scopes:** Leave default (Builds, Functions, Runtime)
   - **Click:** Save

4. **SEGUNDA VARIABLE: ADVISOR_EMAIL**
   - **Key:** `ADVISOR_EMAIL`
   - **Value:** `asesor.pac@gmail.com`
   - **Scopes:** Leave default
   - **Click:** Save

5. **TERCERA VARIABLE: RESEND_API_KEY (si falta)**
   - **Key:** `RESEND_API_KEY`
   - **Value:** [Tu API key]
   - **Mark as secret:** ✓ (opcional pero recomendado)
   - **Click:** Save

6. **REDEPLOY:**
   - Espera a que Netlify detecte cambios (automático)
   - O: Deploy manually desde https://app.netlify.com/sites/acp-asociados/overview
   - Espera a que el deployment termine (30-60 segundos)

---

### **OPCIÓN B: API Netlify (Avanzado)**

Si prefieres automatizarlo, puedes usar cURL:

```bash
# Necesitarás tu Netlify API token
# https://app.netlify.com/user/applications#personal-access-tokens

NETLIFY_TOKEN="your_token_here"
SITE_ID="tu_site_id"

# Agregar SITE_URL
curl -X POST https://api.netlify.com/api/v1/sites/$SITE_ID/env \
  -H "Authorization: Bearer $NETLIFY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "SITE_URL",
    "value": "https://acp-asociados.netlify.app",
    "scopes": ["functions", "runtime", "builds"]
  }'

# Agregar ADVISOR_EMAIL
curl -X POST https://api.netlify.com/api/v1/sites/$SITE_ID/env \
  -H "Authorization: Bearer $NETLIFY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "ADVISOR_EMAIL",
    "value": "asesor.pac@gmail.com",
    "scopes": ["functions", "runtime", "builds"]
  }'
```

---

## 🔍 VERIFICAR DESPUÉS DE AGREGAR

### Paso 1: Confirmar variables guardadas
```
https://app.netlify.com/sites/acp-asociados/settings/environment
```

Deberías ver:
- ✅ MERCADO_PAGO_ACCESS_TOKEN
- ✅ SENDGRID_API_KEY
- ✅ SENDGRID_FROM_EMAIL
- ✅ SITE_URL (NUEVO)
- ✅ ADVISOR_EMAIL (NUEVO)
- ✅ RESEND_API_KEY (si agregaste)

### Paso 2: Verificar deployment
```
https://app.netlify.com/sites/acp-asociados/overview
```

- Busca el deploy más reciente
- Status debe ser: "Published ✓"
- Si dice "Deploying...", espera a que termine

### Paso 3: Reintentar el test
1. Abre: https://acp-asociados.netlify.app
2. Llena el formulario nuevamente
3. Haz click en "Continuar al Pago"
4. Debería redirigir a Mercado Pago (o mostrar error, pero ahora visible)

---

## ⚠️ NOTAS IMPORTANTES

### Ubicación de valores secretos

**Para RESEND_API_KEY:**
- Ir a: https://resend.com/api-tokens
- Copiar token (empieza con `re_`)
- Pegar en Netlify

**Para MERCADO_PAGO_ACCESS_TOKEN:**
- Ya está configurado ✅
- Se encuentra en: https://www.mercadopago.com.ar/developers/panel

### Después de cambios en variables

⚠️ **Netlify NO redeploy automáticamente cuando cambias variables de entorno**

**Lo que debes hacer:**
1. Opción A: Hacer un git push pequeño (vacío funciona)
2. Opción B: Manual redeploy en https://app.netlify.com/sites/acp-asociados/overview
3. Opción C: Ir a "Deploys" → botón "Trigger deploy"

---

## 🎯 CHECKLIST FINAL

- [ ] Navegaste a https://app.netlify.com/sites/acp-asociados/settings/environment
- [ ] Agregaste SITE_URL = https://acp-asociados.netlify.app
- [ ] Agregaste ADVISOR_EMAIL = asesor.pac@gmail.com
- [ ] Verificaste RESEND_API_KEY (si falta, agrégalo)
- [ ] Guardaste todos los cambios
- [ ] Esperaste a que Netlify redeploy
- [ ] Verificaste que el deployment dice "Published ✓"
- [ ] Reintentaste el test en https://acp-asociados.netlify.app

---

## 📞 SI HAY PROBLEMAS

### El formulario sigue sin responder
1. Abre DevTools (F12)
2. Pestaña **Console**
3. Busca errores en rojo
4. Copia el error exacto

### Variables no aparecen después de guardar
1. Recarga la página (Ctrl+F5)
2. Si sigue, intenta en otra pestaña privada/incógnito
3. Contacta a Netlify support si persiste

### Email no llega a asesor.pac@gmail.com
1. Verifica que RESEND_API_KEY sea correcto
2. Abre Resend dashboard y busca logs de email
3. Si dice "rejected", revisa por qué

---

**Documento creado:** 5 Mayo 2026 - 12:35 PM  
**Estado:** Requiere acciones del usuario en Netlify
