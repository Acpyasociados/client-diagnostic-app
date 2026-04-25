# Guía de Despliegue Final - Todas las Mejoras

## 🎯 OBJETIVO

Desplegar la aplicación con todas las mejoras implementadas:
- ✅ Precios nuevos ($49.900 y $149.900)
- ✅ Email al asesor (asesor.pac@gmail.com)
- ✅ Cupones 100% descuento
- ✅ Panel de revisión de informes
- ✅ Todas las rutas funcionales

---

## 📋 CHECKLIST PRE-DESPLIEGUE

Antes de desplegar, verifica que:

- [ ] Tienes acceso a Netlify (app.netlify.com)
- [ ] El proyecto está conectado a GitHub
- [ ] Todos los cambios están en `main` branch
- [ ] Tienes los valores de:
  - [ ] MERCADOPAGO_ACCESS_TOKEN (API key de producción)
  - [ ] RESEND_API_KEY (API key de emails)
  - [ ] ADMIN_REVIEW_TOKEN (token para revisor)

---

## 🚀 PASO 1: HACER PUSH A GITHUB

```bash
cd /sessions/loving-busy-darwin/client-diagnostic-app

# Verificar cambios
git status

# Agregar cambios
git add -A

# Hacer commit
git commit -m "Deploying improvements: prices, advisor email, coupons"

# Push a main (Netlify desplegará automáticamente)
git push origin main
```

**Resultado:** Netlify comienza a construir automáticamente

---

## ⏳ PASO 2: ESPERAR DESPLIEGUE

Netlify tardará **2-5 minutos** en desplegar.

Puedes monitorear en: https://app.netlify.com
- Selecciona tu proyecto "client-diagnostic-app"
- Ve a **Deploys**
- Verás un build en progreso

**Estados:**
- 🟡 Building... (esperando)
- 🟡 Deploying... (desplegando)
- 🟢 Published (listo)

---

## ⚙️ PASO 3: CONFIGURAR VARIABLES DE ENTORNO

Una vez que el deploy sea exitoso (🟢 Published):

### 3.1 Ir a Settings

1. Abre https://app.netlify.com
2. Selecciona tu proyecto
3. Click en **Site Settings**

### 3.2 Abrir Environment Variables

En el menú lateral:
- Click en **Build & deploy**
- Click en **Environment variables**
- Click en **Edit variables**

### 3.3 Agregar/Actualizar Variables

**Si es la primera vez, agregar todas estas:**

```
SITE_URL = https://[tu-dominio].netlify.app
MERCADOPAGO_ACCESS_TOKEN = APP_USR-xxx (tu token)
PRICE_BASIC_CLP = 49900
PRICE_PREMIUM_CLP = 149900
PRICE_PREMIUM_MONTHLY_CLP = 9990
RESEND_API_KEY = re_xxx (tu API key)
FROM_EMAIL = onboarding@tu-dominio.com
REVIEWER_EMAIL = tu-correo@empresa.com
ADVISOR_EMAIL = asesor.pac@gmail.com
ADMIN_REVIEW_TOKEN = mi-token-secreto-largo-y-unico
```

**Si ya existen, cambiar:**
- PRICE_BASIC_CLP: 99000 → **49900**
- PRICE_PREMIUM_CLP: 199000 → **149900**
- Agregar: PRICE_PREMIUM_MONTHLY_CLP = **9990**
- Agregar: ADVISOR_EMAIL = **asesor.pac@gmail.com**

### 3.4 Guardar

Click en **Save**

Netlify redesplegará automáticamente con las nuevas variables (~2 minutos).

---

## ✅ PASO 4: VERIFICAR QUE FUNCIONA

### 4.1 Abre el formulario

Ve a: `https://[tu-dominio].netlify.app`

**Verifica:**
- [ ] Página carga correctamente
- [ ] Ves los precios nuevos:
  - Básico: $49.900
  - Premium: $149.900 + $9.990/mes
- [ ] El formulario es funcional

### 4.2 Prueba con cupón

1. Completa el formulario con datos de prueba
2. Ingresa cupón: `TEST100`
3. Haz click en "Continuar a pago"

**Espera:** Serás redirigido a Mercado Pago

### 4.3 Pago de prueba

En Mercado Pago, usa:
- Tarjeta: `4111 1111 1111 1111`
- Vencimiento: `11/25` (cualquiera futuro)
- CVV: `123`
- Nombre: `Prueba`

Haz clic en **Pagar**

### 4.4 Verificar emails

**Email #1: Cliente** (cuestionario)
- Deberías recibir en el email del formulario
- Asunto: "Tu cuestionario sectorial ya está disponible"
- Contiene link al cuestionario

**Email #2: Revisor**
- Llega a `REVIEWER_EMAIL`
- Asunto: "Nuevo caso pagado: [Empresa]"
- Contiene link para revisar

**Email #3: Asesor** ⭐ (NUEVO)
- Llega a `asesor.pac@gmail.com`
- Asunto: "✅ Nuevo cliente pagado: [Empresa] (BÁSICO)"
- Contiene info completa del cliente
- Incluye link directo a panel de revisión

---

## 🧪 PASO 5: PRUEBA COMPLETA END-TO-END

### 5.1 Cliente completa cuestionario

1. Abre email de cuestionario
2. Haz clic en el link
3. Responde las 6 preguntas
4. Haz clic en "Enviar cuestionario"

### 5.2 Revisor aprueba informe

1. Abre email de borrador
2. Haz clic en link de revisión (o usa):
   `https://[tu-dominio].netlify.app/review.html?lead_id=xxx&token=ADMIN_REVIEW_TOKEN`
3. Ve el informe generado
4. Haz clic en "Aprobar y enviar"

### 5.3 Cliente recibe informe final

1. Abre email final
2. Verifica que contiene:
   - Informe HTML formateado
   - 3 mejoras priorizadas
   - Plan de 30/90 días
   - Datos de la empresa

---

## 📊 PANEL ADMIN PARA AUDITORÍA

Para ver todos los datos guardados:

### URL

```
https://[tu-dominio].netlify.app/admin.html
```

### Ingresa token

Cuando pida: `ADMIN_REVIEW_TOKEN`

### Ver datos

Podrás ver:
- ✅ Estadísticas (Total leads, Ingresos, Pagos, Informes)
- ✅ Tabla completa de clientes
- ✅ Status de cada uno
- ✅ Descargar CSV

---

## 🐛 TROUBLESHOOTING

### Error 502 Bad Gateway

**Causa:** Variable de entorno faltante

**Solución:**
1. Ve a Netlify Settings → Environment variables
2. Verifica que TODAS las variables estén presentes
3. Especialmente: MERCADOPAGO_ACCESS_TOKEN y RESEND_API_KEY

### Email no llega

**Causa:** FROM_EMAIL no verificado en Resend

**Solución:**
1. Ve a https://resend.com/emails
2. Verifica el email: `onboarding@tu-dominio.com`
3. Si no está: agregarlo y esperar validación (~30 min)

### Cupones no funcionan

**Causa:** Función validate-coupon no desplegada

**Solución:**
1. Verifica que archivo `validate-coupon.js` existe en el proyecto
2. Verifica que se hizo push a main
3. Espera nuevo deploy

### Links a cuestionario/revisión no funcionan

**Causa:** SITE_URL no está configurada o incorrecta

**Solución:**
1. Verifica en Netlify → Environment variables
2. SITE_URL debe ser: `https://[exactamente-tu-dominio].netlify.app`
3. Sin barra al final

---

## 📱 URLS IMPORTANTES

Después del despliegue, estas URLs funcionarán:

```
Inicio (Formulario):
https://[nombre].netlify.app

Cuestionario (enviado por email):
https://[nombre].netlify.app/questionnaire.html?lead_id=xxx&token=xxx

Revisión (para revisor):
https://[nombre].netlify.app/review.html?lead_id=xxx&token=ADMIN_REVIEW_TOKEN

Panel Admin (ver todos los datos):
https://[nombre].netlify.app/admin.html

APIs:
https://[nombre].netlify.app/api/audit-leads?token=ADMIN_REVIEW_TOKEN
https://[nombre].netlify.app/api/validate-coupon (POST)
https://[nombre].netlify.app/api/submit-lead (POST)
```

---

## 🎟️ PRÓXIMO PASO: INTEGRACIÓN DE CUPONES

Una vez que todo funcione, integrar cupones en el formulario:

Sigue: **GUIA_INTEGRAR_CUPONES.md**

Esto agregará un campo visual para ingresar cupones.

---

## ✨ CONCLUSIÓN

Después de estos pasos, tendrás:

✅ App con precios nuevos  
✅ Emails automáticos al asesor  
✅ Cupones 100% descuento  
✅ Panel de revisión funcional  
✅ Todos los links funcionando  
✅ Panel admin para auditar  

**¡LISTO PARA PRODUCCIÓN!** 🚀

---

## 📞 SOPORTE

Si algo no funciona:

1. **Revisa los logs de Netlify:**
   - App.netlify.com → Deploys → Click en el deploy → Deploy log

2. **Verifica variables de entorno:**
   - App.netlify.com → Site Settings → Environment variables

3. **Prueba local:**
   ```bash
   netlify dev
   # http://localhost:8888
   ```

4. **Contacta a Netlify/Resend:**
   - Soporte de Netlify: support.netlify.com
   - Soporte de Resend: resend.com/support

---

**¡Que todo funcione perfecto!** 🎉

