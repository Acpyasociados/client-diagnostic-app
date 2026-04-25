# Configuración de Netlify - Guía Paso a Paso

## Paso 1: Conectar Repositorio (Si no está hecho)

1. Ve a https://app.netlify.com
2. Click en "Add new site" → "Import an existing project"
3. Conecta tu cuenta GitHub
4. Selecciona el repositorio `client-diagnostic-app`
5. Deja los valores por defecto:
   - Build command: (Netlify lo detecta automáticamente)
   - Publish directory: `.` (raíz)
   - Functions directory: `netlify/functions` (automático)
6. Click en "Deploy site"

## Paso 2: Agregar Variables de Entorno

Una vez desplegado, ve a:

**Netlify Dashboard → Site Settings → Environment Variables**

Click en "Edit variables" y agrega cada una:

### Variable 1: SITE_URL
```
Key: SITE_URL
Value: https://your-site-name.netlify.app
```
*(Esta es la URL que Netlify te asignó, visible en la parte superior del dashboard)*

### Variable 2: MERCADOPAGO_ACCESS_TOKEN
```
Key: MERCADOPAGO_ACCESS_TOKEN
Value: APP_USR-xxxx (el token que ya tienes)
```
**Importante**: Usa el token de PRODUCCIÓN cuando hagas deploy a producción.

### Variable 3: PRICE_BASIC_CLP
```
Key: PRICE_BASIC_CLP
Value: 99000
```

### Variable 4: PRICE_PREMIUM_CLP
```
Key: PRICE_PREMIUM_CLP
Value: 199000
```

### Variable 5: RESEND_API_KEY
```
Key: RESEND_API_KEY
Value: re_xxxx (el token que ya tienes)
```

### Variable 6: FROM_EMAIL
```
Key: FROM_EMAIL
Value: onboarding@tu-dominio.com
```
**IMPORTANTE**: Este email debe estar verificado en Resend. Ver sección "Verificar Email en Resend" abajo.

### Variable 7: REVIEWER_EMAIL
```
Key: REVIEWER_EMAIL
Value: tu-correo@tu-empresa.com
```
*(El correo donde recibirá notificaciones el revisor)*

### Variable 8: ADMIN_REVIEW_TOKEN
```
Key: ADMIN_REVIEW_TOKEN
Value: un-string-seguro-y-largo-ej-az8F9xK2mP1qR5vT
```
*(Puede ser cualquier string. Guárdalo seguro, es la contraseña del panel de revisión)*

## Paso 3: Verificar Despliegue

Después de agregar variables:

1. Netlify redesplegará automáticamente
2. Ve a "Deploys" y espera a que se complete
3. Si hay un ✅ verde, está todo bien
4. Si hay ❌ rojo, click en el deploy fallido → "Deploy log" para ver el error

### Errores Comunes al Desplegar

**Error: "MODULE_NOT_FOUND"**
- Causa: Falta instalar dependencias
- Solución: Netlify las instala automáticamente, pero verifica que `package.json` está en la raíz

**Error: "Cannot find variable XXXX"**
- Causa: Variable de entorno no configurada
- Solución: Agrega la variable en Environment variables

**Error 502 Bad Gateway**
- Causa: Variable de entorno faltante en función
- Solución: Revisa que todas las 8 variables están configuradas

## Paso 4: Verificar Email en Resend

Este paso es **CRÍTICO** para que los emails se envíen.

1. Ve a https://resend.com/dashboard/emails
2. Busca el email `onboarding@tu-dominio.com` (o el que configuraste)
3. Si está con ✅ "Verified", estás bien
4. Si está con ⏳ "Pending" o ❌ no existe:
   - Click en "Add Domain" o "Add Email"
   - Sigue los pasos de Resend
   - Espera a que Netlify lo verifique (~5 minutos)

### Opción A: Usar Dominio Propio

Si tienes dominio registrado (ejemplo: empresa.com):

1. En Resend → "Add Domain"
2. Ingresa `empresa.com`
3. Resend te dará 3 registros DNS para agregar en tu proveedor (GoDaddy, Namecheap, etc)
4. Agrega los registros DNS en tu proveedor
5. Espera validación (~30 minutos)
6. Luego usa `onboarding@empresa.com` en FROM_EMAIL

### Opción B: Email Temporal (Solo Prueba)

Si quieres probar sin dominio propio:

1. Usa un email temporal que Resend ya permite
2. En FROM_EMAIL configura: `onboarding@resend.dev`
3. Los emails de prueba funcionan pero vienen de un dominio diferente
4. Cambia a tu dominio en producción

## Paso 5: Configurar Webhook de Mercado Pago

Para que los pagos se procesen automáticamente:

1. Ve a https://www.mercadopago.com/developers/panel/app
2. Selecciona tu aplicación
3. Ve a "Configuración" → "Webhooks"
4. Click en "Agregar webhook"
5. URL: `https://tu-sitio-name.netlify.app/api/mercadopago-webhook`
6. Selecciona eventos: "payment.created" y "payment.updated"
7. Click en "Guardar"

**Nota**: El webhook es idempotente, así que no hay problema si se dispara 2 veces.

## Paso 6: Probar Todo

### Prueba Completa (5 minutos)

1. Abre `https://tu-sitio.netlify.app` en el navegador
2. Completa el formulario:
   ```
   Nombre: Prueba Userz
   Email: tu-correo@gmail.com
   Teléfono: 912345678
   Empresa: Empresa Test
   Rubro: Servicios profesionales
   Ventas mensuales: 500000
   Margen: 35
   Clientes activos: 10
   Top 3 costos: Personal, arriendo, software
   Canal principal: Referidos
   Problema principal: Bajo cierre
   Objetivo 6 meses: Aumentar cierre 20%
   Plan: Básico
   ```
3. Haz click en "Continuar a pago"
4. Serás redirigido a Mercado Pago
   - Usa tarjeta de prueba: `4111 1111 1111 1111`
   - Vencimiento: 11/25 (cualquiera futura)
   - CVV: 123
   - Nombre: Prueba
5. Completa el pago
6. Deberías ver página de éxito
7. **Revisa tu email** (inbox + spam) - deberías recibir el link al cuestionario
8. Haz click en el link y completa el cuestionario
9. El sistema generará un borrador automáticamente
10. Revisa tu email nuevamente - notificación para revisor
11. Usa el token de revisor: `https://tu-sitio.netlify.app/review.html?lead_id=XXXXXX&token=ADMIN_REVIEW_TOKEN`
12. Haz click en "Aprobar y enviar"
13. Revisa email nuevamente - informe final

Si todo funciona, ¡está listo para producción!

## Troubleshooting Específico

### Los emails no llegan

**Checklist:**
- [ ] `FROM_EMAIL` está verificado en Resend
- [ ] `RESEND_API_KEY` es válido
- [ ] El email no está en spam
- [ ] `REVIEWER_EMAIL` está bien escrito

**Solución**: En Netlify → Deploy log, verifica si hay errores de Resend

### Mercado Pago rechaza el pago

**Checklist:**
- [ ] `MERCADOPAGO_ACCESS_TOKEN` es válido
- [ ] Token es de PRODUCCIÓN (no de ambiente de prueba)
- [ ] Token tiene permisos para crear checkouts

**Solución**: Revisa en Mercado Pago que el token sea válido

### El lead no se guarda

**Checklist:**
- [ ] `SITE_URL` es exactamente la URL de Netlify
- [ ] Netlify Blobs está habilitado (es automático)

**Solución**: Revisa en Netlify → Functions → el log de `submit-lead`

## Monitoreo en Producción

Una vez en producción, monitorea:

1. **Netlify → Analytics**: Visitas al sitio
2. **Netlify → Functions**: Errores de funciones
3. **Resend → Analytics**: Emails enviados/entregados
4. **Mercado Pago → Reportes**: Pagos recibidos

## Escalabilidad

El sistema está optimizado para escalar:

- **Netlify Functions**: Automáticamente escalan sin límite
- **Netlify Blobs**: Soportan millones de registros
- **Resend**: Soporta 1000+ emails/día en plan gratuito
- **Mercado Pago**: Sin límite de transacciones

No necesitas cambiar nada para crecer.

## Seguridad en Producción

Antes de pasar a producción, verifica:

- [ ] `ADMIN_REVIEW_TOKEN` es un string largo y único
- [ ] `MERCADOPAGO_ACCESS_TOKEN` es de PRODUCCIÓN
- [ ] `FROM_EMAIL` está verificado (dominio propio si es posible)
- [ ] `SITE_URL` es tu dominio real (con HTTPS)
- [ ] Los logs de Netlify están configurados (automático)

---

**¡Listo! Tu aplicación está en Netlify.**

Si tienes problemas, revisa:
1. Deploy log (Netlify → Deploys)
2. Function logs (Netlify → Functions)
3. Email delivery (Resend → Analytics)

Cualquier error específico, busca en Google o pregunta al soporte de Netlify.
