# 🔑 RESUMEN DE TOKENS CREADOS

Aquí están los tokens/claves que necesitas para el despliegue en Netlify.

---

## ✅ RESEND

| Campo | Valor | Estado |
|-------|-------|--------|
| **RESEND_API_KEY** | `re_xxxx...` (en tu portapapeles) | ✅ Copiado |
| **FROM_EMAIL** | onboarding@acpasociados.cl | ℹ️ Para después |

---

## ⏳ MERCADO PAGO (PRÓXIMO PASO)

Necesitamos crear la APP en Mercado Pago y obtener:
- **MERCADOPAGO_ACCESS_TOKEN** = APP_USR-xxxxx

---

## ⏳ NETLIFY (DESPUÉS DE MP)

Una vez tengas los tokens, irás a Netlify y cargarás en **Settings → Environment variables:**

```
SITE_URL = https://tu-sitio.netlify.app
MERCADOPAGO_ACCESS_TOKEN = APP_USR-xxxx (DE MP)
RESEND_API_KEY = re_xxxx (YA TIENES)
FROM_EMAIL = onboarding@acpasociados.cl
REVIEWER_EMAIL = tu-email@empresa.com
ADMIN_REVIEW_TOKEN = (generamos en Netlify)
PRICE_BASIC_CLP = 99000
PRICE_PREMIUM_CLP = 199000
```

---

## 🎯 ORDEN DE PASOS

1. ✅ Crear Resend + API Key
2. ⏳ Crear MP App + Access Token
3. ⏳ Crear repo en GitHub
4. ⏳ Conectar a Netlify
5. ⏳ Cargar variables
6. ⏳ Hacer compra de prueba

---

**SIGUIENTE:** Ve a Mercado Pago y crea la app.
