# 🧪 Instrucciones de Prueba E2E Manual - Flow Producción (2026-05-23)

## Estado Actual del Sistema

✅ **Credenciales de Producción Configuradas**
✅ **Endpoint de Producción Activado**
✅ **Redeploy a Producción Completado**
✅ **Sistema Listo para Procesar Dinero Real**

---

## 🎯 Objetivo de la Prueba E2E

Validar que el sistema completo funciona correctamente con dinero REAL:
1. ✅ Formulario se envía correctamente
2. ✅ Backend recibe y procesa datos
3. ✅ Flow API acepta credenciales de producción
4. ✅ Cliente es redirigido a checkout de Flow
5. ✅ Pago se procesa correctamente
6. ✅ Webhook recibe confirmación
7. ✅ Caso se marca como "pagado"
8. ✅ Emails de notificación se envían

---

## 📋 Pasos para Ejecutar la Prueba E2E

### PASO 1: Acceder a la Aplicación
```
URL: https://acp-asociados.netlify.app
Navegador: Chrome, Firefox, Safari, Edge
Modo: Normal (no incógnito)
```

### PASO 2: Llenar Sección 1 - Información de la Empresa

| Campo | Valor de Prueba | Requerido |
|-------|-----------------|-----------|
| Nombre de la Empresa | Test E2E Production | ✅ |
| RUT de la Empresa | 12.345.678-9 | ✅ |
| Tu Nombre | [Tu nombre real] | ✅ |
| WhatsApp | +56 9 XXXX XXXX | ✅ |
| Email | [Tu email real] | ✅ |

**Importante:** Usa tu EMAIL REAL para poder verificar que recibes la notificación de pago.

### PASO 3: Llenar Sección 2 - Perfil del Negocio

| Campo | Valor | Requerido |
|-------|-------|-----------|
| Rubro / Sector | Tecnología y Software | ✅ |
| Ingresos Mensuales (CLP) | 4500000 | ✅ |
| Margen de Ganancia (%) | 22 | ✅ |
| Clientes Activos | 45 | ✅ |
| Régimen Tributario | Régimen Simplificado | ✅ |

### PASO 4: Llenar Sección 3 - Información Operacional

| Campo | Valor | Requerido |
|-------|-------|-----------|
| Top 3 Costos Principales | Salarios, software, infraestructura | ✅ |
| ¿Tienes Presencia Digital? | Sí, tengo presencia | ✅ |
| Asesor Tributario | [Nombre del asesor o tu nombre] | ❌ |

### PASO 5: Llenar Sección 4 - Tu Situación Actual

| Campo | Valor | Requerido |
|-------|-------|-----------|
| ¿Cuál es tu mayor desafío? | Problemas de flujo de caja | ✅ |
| Objetivo a 6 Meses | Reducir costos 25% en 6 meses | ✅ |

### PASO 6: Seleccionar Plan (Sección 5)

**Opción A: Plan Básico** (Recomendado para primera prueba)
```
Costo: $1,000 CLP
Incluye:
- Informe inicial
- 3 mejoras identificadas
- Análisis de 48 horas
```

**Opción B: Plan Premium**
```
Costo: $11,000 CLP
Incluye:
- Plan 30/90/180 días
- Seguimiento personalizado
- Análisis detallado
```

**Para esta prueba:** Selecciona PLAN BÁSICO ($1,000 CLP)

### PASO 7: Hacer Click en "Continuar al Pago"

```
Botón: Naranja, dice "Continuar al Pago ($1.000)" o "Continuar al Pago ($11.000)"
Ubicación: Parte inferior del formulario
```

**Espera 2-3 segundos** mientras el backend procesa los datos.

### PASO 8: Verificar Redirección a Flow

**Esperado:**
```
URL cambia a: https://www.flow.cl/app/pay.php?token=xxxxx
Página de Flow aparece: "Checkout de Pago"
Opciones de pago mostradas (Tarjeta de Crédito, Débito, etc.)
```

**Si esto NO sucede:**
```
❌ Error: Ver consola del navegador (F12 > Console)
Verificar: ¿Ves algún mensaje de error rojo?
```

### PASO 9: Procesar el Pago en Flow

**Ingresa datos de tarjeta:**
```
Tarjeta de Crédito/Débito: [Tu tarjeta REAL]
Nombres: [Tu nombre real]
Fecha Expiración: [Tu tarjeta real]
CVV: [Tu tarjeta real]
RUT: [Tu RUT real]
```

**NO hay "tarjeta de prueba" en producción - debe ser REAL**

### PASO 10: Confirmar Pago

```
Haz click en "Pagar" o "Confirmar Pago"
Flow procesa con tu banco
Se solicita confirmación de banco (SMS/OTP)
Ingresa código de confirmación si es necesario
```

**Tiempo esperado:** 10-30 segundos

### PASO 11: Esperar Confirmación

**Esperado:**
```
Página redirige a: https://acp-asociados.netlify.app/flow-success.html?orderId=ACP-XXXXX
Mensaje: "¡Pago completado exitosamente!"
O se redirecciona automáticamente a inicio
```

---

## ✅ Validación POST-PAGO (Haz esto después de 5 minutos)

### Verificación 1: Email de Cuestionario
```
Revisa tu INBOX en: [Tu email ingresado en paso 2]
Busca email de: noreply@acp-asociados.com o Resend
Asunto: "Cuestionario Diagnóstico - [Tu Empresa]"
Debe llegar en: 1-5 minutos
```

**Si NO llega:**
```
[ ] Verifica spam/promociones
[ ] Revisa direcciones correctas en netlify.toml
[ ] Ver logs: netlify logs --function=send-questionnaire-email
```

### Verificación 2: Email al Asesor
```
Email al Asesor: asesor.pac@gmail.com
Verifica bandeja de asesor (o pídele que verifique)
Asunto: "💰 Pago confirmado: [Empresa] - [Plan]"
Debe contener:
  - Datos del cliente
  - Monto pagado ($1,000 CLP)
  - Enlace a caso
  - Enlace a reporte (si está generado)
```

### Verificación 3: Estado en Netlify Blobs
```
Acceso: Requiere credenciales de Netlify
Ubicación: Dashboard Netlify > Función > Blobs > cases
Buscar: orderId que viste en flow-success.html
Debe mostrar:
  - status: "pagado"
  - paid_at: [timestamp]
  - flow_token: [token de Flow]
  - flow_reference: [referencia de Flow]
```

### Verificación 4: Reporte PDF Generado
```
Búsqueda: En Blobs debe existir archivo:
  - Nombre: "[orderId]-report.pdf"
Debe contener: Análisis diagnóstico personalizado
Tamaño: 50-500 KB (típicamente)
```

---

## 🔍 Solución de Problemas

### Problema: "Failed to create payment in Flow"

**Causas posibles:**
1. ❌ Credenciales incorrectas (pero ya las actualizamos)
2. ❌ Endpoint sandbox en lugar de producción (ya lo cambiamos)
3. ❌ Firma HMAC invalida
4. ❌ Parámetros mal formateados

**Qué hacer:**
```bash
# Ver logs detallados
netlify logs --function=flow-create-payment --since=10m

# Buscar errores de Flow en respuesta
Verifica el mensaje de error específico de Flow
```

### Problema: Pago se procesa pero NO llegan emails

**Causas posibles:**
1. RESEND_API_KEY no configurada o inválida
2. Email destinatario bloqueado
3. Función de email con timeout

**Qué hacer:**
```bash
# Verificar RESEND_API_KEY
netlify env:list | grep RESEND

# Ver logs de email
netlify logs --function=send-questionnaire-email --since=10m
netlify logs --function=send-advisor-payment-notification --since=10m
```

### Problema: Pago en Flow pero NO se marca como "pagado"

**Causas posibles:**
1. Webhook no se disparó
2. Firma de webhook no coincide
3. URL de webhook incorrecta

**Qué hacer:**
```bash
# Ver logs del webhook
netlify logs --function=flow-webhook --since=10m

# Verificar que case fue creado
Revisar en Blobs si existe caso con status "pending"
```

---

## 📊 Flujo de Datos Esperado

```
CLIENTE INPUT
├─ Formulario → 15 campos de datos
└─ Plan seleccionado (Básico o Premium)

BACKEND PROCESSING
├─ flow-create-payment.js
│  ├─ Recibe datos
│  ├─ Valida campos
│  ├─ Crea caso en Blobs (status: pending)
│  ├─ Calcula firma SHA256
│  └─ POST a Flow API (PRODUCCIÓN)
└─ Response: payment URL

FLOW PRODUCCIÓN
├─ Verifica firma
├─ Crea sesión de pago
└─ Retorna URL de checkout

CLIENTE PAGA
├─ Ingresa tarjeta real
├─ Confirma con banco
└─ Flow procesa transacción

WEBHOOK CONFIRMATION
├─ flow-webhook.js
├─ Verifica firma de Flow
├─ Actualiza caso (status: pagado)
└─ Dispara 3 funciones paralelas:
    ├─ send-questionnaire-email.js
    ├─ generate-report.js
    └─ send-advisor-payment-notification.js

CONFIRMACIÓN FINAL
├─ Cliente recibe email de cuestionario
├─ Asesor recibe notificación de pago
└─ Sistema completado ✅
```

---

## 🔐 Seguridad y Dinero Real

### ⚠️ IMPORTANTE

- 💰 **DINERO REAL:** Este pago será auténtico y se transferirá dinero de verdad
- 🏦 **Cuenta Bancaria:** El monto irá a la cuenta registrada en Flow
- ⏰ **Tiempo:** El depósito puede tomar 1-3 días hábiles
- 📝 **Registro:** Todos los movimientos quedarán registrados en Flow dashboard
- 🚫 **NO REVERSIBLE:** Los pagos en producción NO se pueden deshacer automáticamente

### Recomendaciones

1. **Antes de pagar:**
   - Verifica que todos los datos estén correctos
   - Confirma que la tarjeta a usar es la correcta
   - Ten a mano datos de tu banco para confirmación

2. **Durante el pago:**
   - NO recargues la página
   - Espera a que Flow complete el proceso
   - Sigue todas las instrucciones de confirmación de banco

3. **Después del pago:**
   - Guarda el orderId que ves en pantalla
   - Verifica que los emails lleguen (inbox y spam)
   - Revisa Flow dashboard para confirmar transacción

---

## 📞 Contacto de Soporte

### Si algo falla:

**Flow Support:**
- Sitio: https://dashboard.flow.cl
- Email: support@flow.cl
- Teléfono: [Ver en tu dashboard]

**Datos que necesitarás:**
- API Key: `1F7ABDF2-7286-4261-9A54-963935CDCL21`
- RUT de tu negocio
- Monto de la transacción ($1,000 CLP)
- Timestamp aproximado del intento

---

## ✨ Checklist Antes de Empezar

- [ ] Credenciales de producción configuradas ✅
- [ ] Endpoint en producción (www.flow.cl) ✅
- [ ] Sistema redesplegado ✅
- [ ] Tienes acceso a tu email real
- [ ] Tienes tarjeta de débito/crédito REAL
- [ ] Tienes 5-10 minutos sin interrupciones
- [ ] Internet conexión estable
- [ ] Tienes el RUT a mano
- [ ] Apuntaste los datos del formulario para referencia

---

## Resumen Final

**El sistema está 100% listo para procesar tu primer pago real con Flow en producción.**

1. **Llena el formulario** completamente
2. **Click "Continuar al Pago"**
3. **Completa el pago en Flow** con tarjeta real
4. **Espera confirmación**
5. **Verifica emails** (5 minutos después)

**Si todo funciona, el sistema E2E está validado y listo para producción! 🎉**

---

**Última actualización:** 2026-05-23 15:45 UTC  
**Status:** ✅ LISTO PARA PRUEBA E2E CON DINERO REAL  
**Credenciales:** Reales de Producción  
**Endpoint:** www.flow.cl (Producción)
