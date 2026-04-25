# Checklist Pre-Producción

## ✅ Checklist Técnico

### Código Fuente
- [x] Sintaxis verificada en todos los archivos `.js`
- [x] Rutas de importación correctas (`./_lib/`)
- [x] Persistencia implementada (Netlify Blobs)
- [x] Errores de SyntaxError eliminados
- [x] Módulos de email, report, questions implementados
- [x] 6 funciones serverless completas

### Flujo de Datos
- [x] submit-lead.js: Crea lead + Mercado Pago ✅
- [x] mercadopago-webhook.js: Procesa pagos ✅
- [x] submit-questionnaire.js: Genera informe ✅
- [x] approve-report.js: Envía email final ✅
- [x] get-questionnaire.js: Obtiene preguntas ✅
- [x] get-review-case.js: Panel de revisión ✅

### Seguridad
- [x] Token único por cliente (crypto.randomBytes)
- [x] ADMIN_REVIEW_TOKEN para panel de revisión
- [x] Validación de tokens en cada paso
- [x] Datos encriptados en Netlify Blobs
- [x] Webhooks validados

### Persistencia
- [x] Almacenamiento en Netlify Blobs (no en memoria)
- [x] Datos persisten entre invocaciones
- [x] Acceso sincronizado con getStore

## 📋 Checklist de Configuración Netlify

### Despliegue
- [ ] Repositorio conectado a Netlify
- [ ] Build completó exitosamente (sin errores ❌)
- [ ] Site URL asignada (ejemplo: client-diagnostic.netlify.app)
- [ ] Dominio personalizado configurado (opcional)

### Variables de Entorno
- [ ] SITE_URL = tu-dominio.netlify.app
- [ ] MERCADOPAGO_ACCESS_TOKEN = APP_USR-xxx (Producción)
- [ ] PRICE_BASIC_CLP = 99000
- [ ] PRICE_PREMIUM_CLP = 199000
- [ ] RESEND_API_KEY = re_xxx
- [ ] FROM_EMAIL = email-verificado@tu-dominio.com
- [ ] REVIEWER_EMAIL = correo-revisor@empresa.com
- [ ] ADMIN_REVIEW_TOKEN = token-largo-y-unico

### Integraciones
- [ ] FROM_EMAIL verificado en Resend (✅ estado)
- [ ] Mercado Pago webhook configurado
- [ ] Webhook URL correcta: `/api/mercadopago-webhook`
- [ ] Token de Mercado Pago es de PRODUCCIÓN (no prueba)

## 🧪 Checklist de Pruebas

### Prueba 1: Formulario Inicial
- [ ] Página carga correctamente
- [ ] Todos los campos aceptan datos
- [ ] Validación funciona (requiere campos)
- [ ] Plan selection funciona (click en plan cambia valor)
- [ ] Botón "Continuar a pago" funciona

### Prueba 2: Pago
- [ ] Redirige a Mercado Pago
- [ ] Checkout se crea con datos correctos
- [ ] Pago se procesa (usar tarjeta de prueba MP)
- [ ] Redirige a success.html después de pago

### Prueba 3: Email de Cuestionario
- [ ] Email llega en menos de 1 minuto
- [ ] Email viene de FROM_EMAIL configurado
- [ ] Link al cuestionario es válido
- [ ] Revisar spam si no llega a inbox

### Prueba 4: Cuestionario
- [ ] Página carga con preguntas correctas del rubro
- [ ] Valida campos requeridos
- [ ] Acepta números
- [ ] Botón "Enviar cuestionario" funciona

### Prueba 5: Generación de Informe
- [ ] Informe se genera automáticamente
- [ ] Contiene 3 mejoras priorizadas
- [ ] Mejoras tienen títulos y acciones específicas
- [ ] Email se envía a REVIEWER_EMAIL

### Prueba 6: Panel de Revisión
- [ ] URL con lead_id y token correcto abre página
- [ ] Muestra informe generado
- [ ] Botón "Aprobar y enviar" funciona
- [ ] Genera email al cliente

### Prueba 7: Email Final
- [ ] Cliente recibe informe final
- [ ] HTML del informe se renderiza correctamente
- [ ] Datos de empresa están correctos
- [ ] Mejoras están completas y accionables

## 📊 Checklist de Monitoreo

### Después del Despliegue
- [ ] Verificar Netlify → Functions (sin errores)
- [ ] Verificar Netlify → Analytics (tráfico)
- [ ] Verificar Resend → Analytics (emails enviados)
- [ ] Verificar Mercado Pago → Pagos (transacciones)

### Logs a Revisar
- [ ] Netlify → Deploys → Deploy log (build exitoso)
- [ ] Netlify → Functions → Logs de cada función
- [ ] Resend → Emails (entrega de cada email)
- [ ] Mercado Pago → Webhooks (recepción de eventos)

## 🔧 Checklist de Producción vs Prueba

### Cambio a Producción

**Antes de cambiar:**
- [ ] Cambiar `MERCADOPAGO_ACCESS_TOKEN` a versión de PRODUCCIÓN
- [ ] Cambiar `SITE_URL` a dominio real (si diferente)
- [ ] Cambiar `FROM_EMAIL` a email oficial de empresa
- [ ] Cambiar `REVIEWER_EMAIL` a correo de persona responsable
- [ ] Generar nuevo `ADMIN_REVIEW_TOKEN` (largo y único)

**Después de cambiar:**
- [ ] Hacer prueba completa con datos reales (una transacción)
- [ ] Verificar emails llegan a inbox (no spam)
- [ ] Verificar informe se genera correctamente
- [ ] Verificar cifras de Mercado Pago coinciden

## 📧 Checklist de Emails

### Resend
- [ ] Cuenta Resend existe y activa
- [ ] API key es válido
- [ ] FROM_EMAIL verificado (✅ estado)
- [ ] Dominio verificado (si es personalizado)
- [ ] Plan tiene suficiente cuota (1000+ emails/día)

### Envíos
- [ ] Email 1: Cuestionario al cliente (después de pago)
- [ ] Email 2: Notificación al revisor (cuando cuestionario enviado)
- [ ] Email 3: Informe final al cliente (cuando aprobado)

### Validación
- [ ] Emails no van a spam
- [ ] Links funcionan (lead_id y token válidos)
- [ ] HTML se renderiza correctamente
- [ ] Información es exacta

## 🔐 Checklist de Seguridad

### Credenciales
- [ ] Tokens no están en código (están en env variables)
- [ ] ADMIN_REVIEW_TOKEN es secreto y fuerte
- [ ] Mercado Pago token de producción (no test)
- [ ] Resend API key es válido

### Validación
- [ ] Cliente token se valida en cuestionario
- [ ] Admin token se valida en panel de revisión
- [ ] Mercado Pago webhook valida origen
- [ ] Todas las entradas se validan

### Data
- [ ] Lead data encriptada en Netlify Blobs
- [ ] No hay datos sensibles en logs
- [ ] Tokens únicos por cliente
- [ ] Acceso controlado por tokens

## 📱 Checklist de Responsividad

### Dispositivos
- [ ] Desktop: Prueba en Chrome, Firefox, Safari
- [ ] Mobile: Prueba en celular (iPhone + Android)
- [ ] Tablet: Prueba en tablet

### Elementos
- [ ] Formulario se ve bien en móvil
- [ ] Botones son clickeables (>44px)
- [ ] Texto es legible (>12px)
- [ ] Imágenes se cargan correctamente
- [ ] No hay scroll horizontal innecesario

## ⚡ Checklist de Performance

- [ ] Página inicial carga en <3 segundos
- [ ] Formulario submit toma <5 segundos (pago)
- [ ] Cuestionario carga en <2 segundos
- [ ] Informe genera en <10 segundos
- [ ] Emails se envían en <30 segundos

## 🚀 Go/No-Go Decision

**SOLO marcar SI TODOS los checks anteriores están ✅**

### Criterios Go
- [ ] Todos los checks técnicos: ✅
- [ ] Todas las variables de entorno: ✅
- [ ] Prueba completa exitosa: ✅
- [ ] Emails funcionando: ✅
- [ ] Seguridad validada: ✅
- [ ] Responsividad OK: ✅

### Decisión
- [ ] **GO** - Listo para promocionar a producción
- [ ] **NO-GO** - Corregir y repetir checklist

---

**Fecha de verificación**: ___________

**Verificado por**: ___________

**Notas**:
```
_________________________________
_________________________________
_________________________________
```

**Siguiente paso**: Una vez todos los checks estén marcados, el sistema está listo para servir clientes reales.
