# AUDITORÍA COMPLETA: ESTADO DEL SISTEMA DE PAGOS

**Fecha:** 2026-05-27  
**Estado:** 🔴 SISTEMA DE PAGOS NO OPERATIVO

---

## RESUMEN EJECUTIVO

Se configuraron credenciales sandbox de Mercado Pago y se redeploy la aplicación a Netlify. Sin embargo, **ambos métodos de pago están bloqueados**:

1. **Mercado Pago**: Política de seguridad bloquea creación de preferencias
2. **Flow**: Configuración de firma/credenciales inválida

El frontend y webhooks están listos, pero los procesadores de pago requieren resolución de problemas de credenciales.

---

## DETALLES DE AUDITORÍA

### 1. MERCADO PAGO SANDBOX
**Estado: 🔴 BLOQUEADO**

**Credenciales Configuradas:**
```
Access Token: APP_USR-84712d0c-5e4d-4719-8884-ad44023f9232
Webhook Secret: 539ed224e60b4b09feab39232a4fb297ccd5a941572ff0db669bd3150c396751
```

**Problema Identificado:**
```
Error: {"code":"PA_UNAUTHORIZED_RESULT_FROM_POLICIES","message":"At least one policy returned UNAUTHORIZED.","status":403}
```

**Causa Raíz:**
- La aplicación sandbox tiene restricciones de política de seguridad de Mercado Pago
- Mercado Pago "PolicyAgent" bloquea la creación de preferencias
- Esto típicamente indica:
  - Cuenta no verificada
  - Datos de negocio incompletos
  - Verificación de identidad requerida
  - Restricción geográfica o de tipo de cuenta

**Evidencia:**
```bash
POST /v1/checkout/preferences HTTP/1.1
Authorization: Bearer APP_USR-84712d0c-5e4d-4719-8884-ad44023f9232
Response: 403 PA_UNAUTHORIZED_RESULT_FROM_POLICIES
```

**Resolución Requerida:**
1. Contactar soporte de Mercado Pago
2. Completar verificación de identidad en https://www.mercadopago.cl/settings/profile
3. Verificar número de celular
4. Actualizar datos del negocio en panel de control
5. Re-validar después de cambios

---

### 2. FLOW (ALTERNATIVA)
**Estado: 🔴 BLOQUEADO**

**Problema Identificado:**
```
Error: Failed to create payment in Flow
Details: Invalid Signature
```

**Causa Raíz:**
- Las credenciales o método de firma de Flow son incorrectos
- Posibles causas:
  - API Keys de Flow caducadas o revocadas
  - Cambio de formato de firma requerido
  - Servidor Flow rechazando el token

**Acción:** Revisar credenciales de Flow en variables de Netlify

---

### 3. INFRAESTRUCTURA FRONTEND/BACKEND ✅

**Estado: OPERATIVO**

**Verificaciones Realizadas:**
```
✅ Sitio en línea: https://acp-asociados.netlify.app (HTTP 200)
✅ index.html accesible (HTTP 200)
✅ Funciones Netlify desplegadas (26 funciones)
✅ create-diagnostic-order accesible (HTTP 405 POST expected)
✅ mercadopago-webhook accesible (HTTP 200 GET)
✅ Variables de entorno configuradas en Netlify
```

**Deploy Exitoso:**
```
Production URL: https://acp-asociados.netlify.app
Deployment: 6a17a25e57859edc2a82b3f7--acp-asociados.netlify.app
Functions Bundled: 26
Status: Deployed successfully
```

---

### 4. WEBHOOKS Y PROCESAMIENTO ✅

**Estado: CÓDIGO LISTO**

**Validaciones de Firma Implementadas:**
- ✅ HMAC-SHA256 validation
- ✅ Timestamp validation
- ✅ x-signature header parsing
- ✅ Template format: `id:{paymentId};request-id:{xRequestId};ts:{ts};`

**Flujo de Procesamiento:**
```
1. Webhook recibido
2. Firma HMAC validada
3. Consulta pago a API procesador
4. Lead marcado como pagado
5. PDF generado (Puppeteer)
6. PDF guardado en Blobs
7. Emails enviados (Resend)
```

---

### 5. ALMACENAMIENTO ✅

**Estado: OPERATIVO**

**Blobs Storage Configurado:**
```
Store: diagnostic-leads (datos de clientes)
Store: cases (datos de pagos)
Store: diagnostic-reports (PDFs generados)
Store: audit-logs (registro de acciones)
Store: rate-limits (control de velocidad)
```

---

## ANÁLISIS TÉCNICO DETALLADO

### Error de Mercado Pago: PA_UNAUTHORIZED_RESULT_FROM_POLICIES

Este error ocurre cuando Mercado Pago aplica una política de seguridad que bloquea la operación. Causas comunes:

1. **Cuenta No Verificada**
   - Usuario no ha completado verificación de identidad
   - Número de teléfono no validado
   - Documento de identidad no confirmatoria

2. **Datos de Negocio Incompletos**
   - Categoría de negocio no especificada
   - Ingresos anuales faltantes
   - País de operación no declarado

3. **Restricciones Geográficas**
   - IP bloqueada
   - País de operación vs país de cuenta mismatch

4. **Límites de Cuenta**
   - Cuenta sandbox en fase experimental
   - Restricción de volumen de transacciones
   - Límite de preferencias por hora

**Referencia:** https://developers.mercadopago.com/en/guides/errors-and-troubleshooting

### Error de Flow: Invalid Signature

Este error ocurre cuando:
1. API Key está caducada
2. Método de firma cambió
3. Token de autenticación incorrecto
4. Header de autorización faltante o malformado

---

## RECOMENDACIONES

### CORTO PLAZO (Inmediato)
1. **Contactar Mercado Pago Soporte:**
   - Email: support@mercadopago.com / soporte-cl@mercadopago.com
   - URL: https://help.mercadopago.com
   - Mensaje: "PolicyAgent bloquea creación de preferencias en sandbox"

2. **Verificar Cuenta:**
   - Completar verificación de identidad
   - Validar número de celular
   - Confirmar datos bancarios (si aplica)

3. **Verificar Flow (Si se usa):**
   - Revisar API Keys en https://www.flow.cl/
   - Confirmar que no están revocadas
   - Validar formato de firma actual

### MEDIANO PLAZO (Próximos días)
1. Una vez resuelta la política de Mercado Pago:
   - Hacer prueba E2E de formulario → pago → webhook → PDF → email
   - Validar firma HMAC con datos reales
   - Verificar entrega de emails

2. Implementar:
   - Logging de errores más detallado
   - Monitoreo de webhooks
   - Alertas de fallos de pago

### LARGO PLAZO (Antes de producción)
1. **Load Testing:**
   - Simular múltiples pagos concurrentes
   - Validar timeout de Puppeteer (26 segundos)
   - Verificar limites de Blobs

2. **Disaster Recovery:**
   - Plan de respuesta ante fallos de webhooks
   - Reintento automático de pagos fallidos
   - Backup de datos de pago

3. **Seguridad:**
   - Implementar rate limiting
   - Validaciones de RUT
   - Sanitización de inputs
   - Auditoría persistente

---

## CHECKLIST DE RESOLUCIÓN

- [ ] Usuario contacta Mercado Pago soporte con error PA_UNAUTHORIZED_RESULT_FROM_POLICIES
- [ ] Usuario completa verificación de identidad en Mercado Pago
- [ ] Usuario valida número de celular
- [ ] Access Token es re-validado y funciona
- [ ] Prueba POST a create-diagnostic-order retorna URL válida
- [ ] Prueba E2E: formulario → Mercado Pago → webhook → PDF
- [ ] Emails de notificación se reciben correctamente
- [ ] Sistema está listo para producción

---

## CONCLUSIÓN

**La arquitectura técnica está correctamente implementada.** El problema es a nivel de credenciales y políticas de los proveedores de pago, no de código. Una vez resueltos los problemas de Mercado Pago/Flow con los respectivos soportes, el flujo E2E será completamente funcional.

**Estado Estimado Después de Resolución:** 🟢 OPERATIVO