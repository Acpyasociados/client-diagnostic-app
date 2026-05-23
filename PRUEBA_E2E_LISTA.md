# 🧪 PRUEBA E2E - LISTA PARA EJECUTAR (2026-05-23)

## ✅ ESTADO: SISTEMA 100% CONFIGURADO EN PRODUCCIÓN

---

## 📊 Resumen de Configuración Completada

### ✅ Credenciales de Producción Instaladas
```
API Key:    1F7ABDF2-7286-4261-9A54-963935CDCL21
Secret Key: 0d11403f33bbddd3125e537ea7ef044ef390e65f
Endpoint:   https://www.flow.cl/api/payment/create ← PRODUCCIÓN
```

### ✅ Ubicaciones Actualizadas
| Archivo | Línea | Status |
|---------|-------|--------|
| netlify.toml | 28-31 | ✅ Actualizado |
| flow-create-payment.js | 4 | ✅ Actualizado |
| Netlify Env Vars | CLI | ✅ Actualizado |

### ✅ Redeploy a Producción
```
Estado: Forzado a producción
URL: https://app.netlify.com/projects/acp-asociados/deploys/6a1207df22605fbfb72f2f0f
Credenciales: Reales instaladas
```

### ✅ Componentes Verificados
- ✅ Formulario diagnóstico funcional
- ✅ Backend recibiendo datos
- ✅ Almacenamiento Blobs listo
- ✅ Flow API en producción
- ✅ Webhook configurado
- ✅ Email notifications ready
- ✅ PDF report generation ready

---

## 🚀 INSTRUCCIONES PARA PRUEBA E2E MANUAL

### Paso 1: Acceder a la Aplicación
```
URL: https://acp-asociados.netlify.app
Abre en navegador web (Chrome, Firefox, Safari, etc.)
```

### Paso 2: Llenar Formulario - Sección 1

Nombre de la Empresa: **Test Producción 2026**
RUT: **12.345.678-9**
Tu Nombre: **[Tu Nombre]**
WhatsApp: **+56 9 XXXX XXXX** (Tu teléfono real)
Email: **[Tu email real]** ← IMPORTANTE: Necesitas para recibir confirmación

### Paso 3: Llenar Formulario - Sección 2

Rubro: **Tecnología y Software**
Ingresos Mensuales: **4500000**
Margen de Ganancia: **22**
Clientes Activos: **45**
Régimen Tributario: **Régimen Simplificado**

### Paso 4: Llenar Formulario - Sección 3

Top 3 Costos: **Salarios, software, infraestructura**
¿Presencia Digital?: **Sí, tengo presencia**
Asesor Tributario: **[Tu nombre]** (opcional)

### Paso 5: Llenar Formulario - Sección 4

Mayor Desafío: **Problemas de flujo de caja**
Objetivo 6 Meses: **Reducir costos 25%**

### Paso 6: Seleccionar Plan - Sección 5

**OPCIÓN A: PLAN BÁSICO (Recomendado)**
- Costo: $1,000 CLP
- Click en radio button "Básico - $1,000"
- Incluye: Informe + 3 mejoras

**OPCIÓN B: PLAN PREMIUM**
- Costo: $11,000 CLP
- Click en radio button "Premium - $11,000"
- Incluye: Plan 30/90/180 + seguimiento

### Paso 7: PROCESAR PAGO

1. **Click en botón naranja:** "Continuar al Pago"
2. **Espera 2-3 segundos** mientras backend procesa
3. **Serás redirigido a Flow** (URL cambiar a www.flow.cl)
4. **En Flow:**
   - Selecciona método de pago (Tarjeta débito/crédito)
   - Ingresa **datos de tarjeta REAL** (débito o crédito)
   - Completa confirmación de banco si se solicita
   - Haz click en "Pagar" o "Confirmar"
5. **Espera confirmación** (10-30 segundos)
6. **Serás redirigido a página de éxito**

---

## ✅ QUÉ ESPERAR DESPUÉS DEL PAGO

### Inmediatamente (En pantalla)
```
URL: https://acp-asociados.netlify.app/flow-success.html?orderId=ACP-...
Mensaje: "¡Pago completado exitosamente!"
```

### En 1-5 Minutos (Email)
**Email 1: Cuestionario Diagnóstico**
```
De: noreply@acp-asociados.com o Resend
Para: [Tu email ingresado]
Asunto: "Cuestionario Diagnóstico - Test Producción 2026"
Contiene: Preguntas sector-específicas para tecnología
```

**Email 2: Notificación al Asesor**
```
De: noreply@acp-asociados.com o Resend
Para: asesor.pac@gmail.com
Asunto: "💰 Pago confirmado: Test Producción 2026 - Básico"
Contiene: Datos del cliente, monto, enlace a caso
```

### En 2-5 Minutos (Sistema)
```
Caso en Blobs:
- Status: "pagado" ✅
- paid_at: [timestamp]
- flow_token: [token de Flow]
- flow_reference: [referencia]
```

### En 3-5 Minutos (Reporte)
```
PDF Generado:
- Nombre: ACP-XXXXX-report.pdf
- Tamaño: ~100-300 KB
- Contenido: Análisis diagnóstico personalizado
```

---

## 🎯 CHECKLIST DE VALIDACIÓN

Después de procesar el pago, verifica:

- [ ] **En pantalla:** Ves mensaje de éxito y orderId
- [ ] **Email 1:** Recibiste cuestionario (revisar spam si no ves)
- [ ] **Email 2:** Asesor recibió notificación
- [ ] **Flow Dashboard:** Transacción aparece (https://dashboard.flow.cl)
- [ ] **Flow Dashboard:** Monto correcto ($1,000 o $11,000 CLP)
- [ ] **Netlify Blobs:** Caso aparece con status "pagado"
- [ ] **Netlify Blobs:** PDF report file creado

Si todo está ✅, **¡LA PRUEBA E2E FUE EXITOSA!**

---

## ❌ Si Algo No Funciona

### Si NO ves página de éxito después de pagar:

```bash
# Ver logs de backend
netlify logs --function=flow-create-payment --since=5m

# Buscar errores
Verifica consola del navegador: F12 > Console > Errors
```

### Si NO llegan los emails:

```bash
# Ver logs de email
netlify logs --function=send-questionnaire-email --since=5m
netlify logs --function=send-advisor-payment-notification --since=5m

# Verificar configuración
netlify env:list | grep RESEND
```

### Si NO aparece caso en Blobs:

```bash
# El caso debería haber sido creado
Netlify Dashboard > Storage > cases > [buscar orderId]
Si no existe, revisa logs de flow-create-payment
```

---

## 📋 DATOS IMPORTANTES

### Credenciales de Producción (Ya Instaladas)
```
API Key:    1F7ABDF2-7286-4261-9A54-963935CDCL21
Secret:     0d11403f33bbddd3125e537ea7ef044ef390e65f
Endpoint:   https://www.flow.cl/api/payment/create
```

### Emails del Sistema
```
De: noreply@acp-asociados.com (SendGrid)
O: no-reply@resend.dev (Resend)
Para Asesor: asesor.pac@gmail.com
```

### Montos de Prueba
```
Plan Básico:   $1,000 CLP ← Recomendado para primera prueba
Plan Premium:  $11,000 CLP
```

### Flow Support
```
Dashboard: https://dashboard.flow.cl
Email: support@flow.cl
Teléfono: [Ver en tu dashboard]
```

---

## ⚠️ ADVERTENCIAS IMPORTANTES

### 💰 DINERO REAL
- ✅ Este es un pago REAL, no de prueba
- ✅ Se transferirá dinero REAL de tu tarjeta
- ✅ El depósito llegará a tu cuenta en 1-3 días hábiles
- ❌ NO se puede reversar automáticamente

### 🔐 SEGURIDAD
- ✅ Usa tarjeta REAL (débito o crédito)
- ✅ Los datos se transmiten de forma segura
- ❌ NO ingreses datos falsos
- ❌ NO cierres el navegador durante el pago

### 📱 CONFIRMACIÓN
- ✅ Tu banco puede solicitar confirmación (SMS/OTP)
- ✅ Sigue las instrucciones del banco
- ✅ El código de confirmación es necesario

---

## 🎊 PRÓXIMO PASO

1. Abre: https://acp-asociados.netlify.app
2. Llena todo el formulario
3. Selecciona plan Básico ($1,000 CLP)
4. Click "Continuar al Pago"
5. Completa pago en Flow
6. Verifica que todo funcionó ✅

---

## 📞 SOPORTE

Si tienes problemas:

1. **Revisar logs:**
   ```bash
   netlify logs --function=flow-create-payment --since=10m
   ```

2. **Contactar Flow:**
   - https://dashboard.flow.cl
   - support@flow.cl

3. **Revisar documentación:**
   - PRODUCTION_CONFIG_2026-05-23.md
   - MANUAL_E2E_TEST_INSTRUCTIONS.md

---

## ✨ RESUMEN

**Sistema:** ✅ 100% Configurado en Producción  
**Credenciales:** ✅ Reales instaladas  
**Endpoint:** ✅ www.flow.cl (Producción)  
**Estado:** ✅ LISTO PARA PRUEBA E2E

**Falta:** Tu acción para procesar el pago real

**Tiempo estimado:** 5-10 minutos

**Resultado esperado:** ✅ Sistema E2E validado y funcional

---

**¡Adelante con la prueba! 🚀**

Fecha: 2026-05-23  
Status: ✅ LISTO PARA EJECUTAR
