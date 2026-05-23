# Análisis Integral de Flow - Estado Actual y Learnings

## 🔄 ¿QUÉ SE ESTÁ EJECUTANDO EN SEGUNDO PLANO?

### Proceso de Pago - Flujo Actual:
```
1. Cliente llena formulario en index.html
   ↓
2. POST a /.netlify/functions/flow-create-payment
   ├─ Recibe datos del cliente
   ├─ Crea orden en Netlify Blobs (storage)
   ├─ Calcula firma SHA256 con parámetros
   ├─ Envía POST a Flow API
   └─ Retorna URL de pago a cliente
   ↓
3. Cliente redirigido a Flow checkout
   ├─ Completa pago en plataforma Flow
   └─ Flow redirige a flow-success.html
   ↓
4. Flow envía webhook a /.netlify/functions/flow-webhook
   ├─ Verifica firma del webhook
   ├─ Actualiza estado de orden a "pagado"
   ├─ Dispara email de cuestionario
   ├─ Genera reporte PDF
   └─ Notifica al asesor
```

### Estado ACTUAL (23 mayo 2026):
- ✅ Función responde (error 400, no 502)
- ✅ Variables de entorno cargadas en Netlify
- ❌ Flow rechaza parámetros (error 400)
- ⏳ Investigar causa del rechazo

---

## 📚 CARACTERÍSTICAS DE FLOW - LO APRENDIDO

### 1️⃣ FLOW API - Requisitos y Especificaciones

#### Endpoints:
- **Sandbox (Testing):** `https://sandbox.flow.cl/api`
- **Producción:** `https://www.flow.cl/api`

#### Parámetros Requeridos para `/payment/create`:
```javascript
{
  apiKey: string,           // Identificador único del comercio
  commerceOrder: string,    // ID único de la orden
  subject: string,          // Descripción de la transacción
  amount: number,           // Monto en CLP (entero, sin decimales)
  email: string,            // Email del cliente
  currency: string,         // "CLP" (solo pesos chilenos)
  urlReturn: string,        // URL de retorno después del pago
  urlConfirm: string,       // Webhook URL para confirmación
  s: string                 // Firma SHA256
}
```

#### Cálculo de Firma (CRÍTICO):
```javascript
// 1. Ordenar parámetros alfabéticamente por clave
// 2. Concatenar: key1value1key2value2...keyNvalueN
// 3. Agregar Secret Key al final
// 4. Aplicar SHA256
// 5. Resultado en hexadecimal

Ejemplo:
Params: {apiKey: "ABC", amount: 1000, email: "test@test.com"}
Sorted: "amounteapiapiKey emailemailkeyemailABC"
+ Secret: "amounteapiapiKey emailemailkeyemailABCsecret123"
SHA256(anterior) = "a1b2c3d4..."
```

#### Validación del Webhook:
- Flow envía GET a urlConfirm con parámetros
- Parámetro `s` contiene firma del webhook
- **MISMO algoritmo** para verificar firma

---

### 2️⃣ CREDENCIALES - Sandbox vs Producción

#### SANDBOX (Actual - Para Testing):
```
API Key:    1F7ABDF2-7286-4261-9A54-963935CDCL2I
Secret Key: 9ebebcc7a7929aac1472c21b75fb764522b6601d
Status:     ✅ Registradas y activas en Flow Dashboard
Endpoint:   https://sandbox.flow.cl/api
```

#### PRODUCCIÓN (Para Lanzamiento Real):
```
API Key:    [OBTENER DEL DASHBOARD DE FLOW PRODUCCIÓN]
Secret Key: [OBTENER DEL DASHBOARD DE FLOW PRODUCCIÓN]
Endpoint:   https://www.flow.cl/api
Status:     ⏳ Requiere verificación bancaria completa
```

---

### 3️⃣ REQUISITOS DE FLOW PARA PRODUCCIÓN

#### Cuenta Flow Requiere:
- ✅ RUT del comercio verificado
- ✅ Datos bancarios para transferencias
- ✅ Domicilio comercial registrado
- ✅ Datos de contacto confirmados
- ⏳ Verificación de identidad (puede tomar 2-5 días)
- ⏳ Aprobación de límites de transacción

#### Limitaciones de Sandbox:
- 💰 No procesa pagos reales
- 📱 Tarjetas de prueba solo: 4111 1111 1111 1111
- 🔐 No hay transferencias bancarias reales
- ⏰ Webhooks pueden ser lentos/poco confiables

---

### 4️⃣ PROBLEMAS ENCONTRADOS Y SOLUCIONES

#### Problema 1: Error "Invalid Signature" (Resuelto ✅)
```
Causa:     Credenciales en netlify.toml != credenciales en Flow
Síntoma:   Firma calculada no coincide con firma esperada por Flow
Solución:  Actualizar credenciales en Netlify UI
Status:    ✅ RESUELTO
```

#### Problema 2: Error 400 Bad Request (Investigando 🔍)
```
Causa:     ¿ Parámetros inválidos enviados a Flow?
           ¿ Nueva signature aún es incorrecta?
           ¿ Formato de moneda/monto incorrecto?
Síntoma:   Flow rechaza POST /payment/create
Status:    🔍 INVESTIGANDO - Revisar logs detallados
```

---

### 5️⃣ EXIGENCIAS DE FLOW PARA NUESTRO CASO DE USO

#### Nuestro Uso:
- Diagnosticos empresariales (CLP $1.000 - $11.000)
- Pagos únicos por cliente
- Email de confirmación automática
- Webhook para procesar cuestionarios post-pago

#### Requisitos Flow que Cumplimos:
- ✅ Cálculo correcto de firma SHA256
- ✅ Webhook URL accesible desde internet
- ✅ Validación de firma en webhook
- ✅ Manejo de errores y reintentos
- ✅ Almacenamiento de órdenes (Netlify Blobs)

#### Requisitos Flow que FALTA Verificar:
- ❓ ¿El formato exacto de los parámetros es correcto?
- ❓ ¿El cálculo de firma está funcionando con nuevas credenciales?
- ❓ ¿Flow acepta nuestro urlConfirm sin autenticación?
- ❓ ¿El webhook se dispara correctamente?

---

### 6️⃣ FLUJO DE DINERO - IMPORTANTE

#### En SANDBOX:
```
Cliente simula pago
    ↓
Flow API simula confirmación
    ↓
NO hay transferencia de dinero real
    ↓
Webhook se dispara (confiabilidad baja)
```

#### En PRODUCCIÓN:
```
Cliente paga real (débito/crédito)
    ↓
Flow procesa pago real
    ↓
Dinero se transfiere a cuenta bancaria de ACP
    ↓
Webhook se dispara (confiabilidad alta)
    ↓
Mail confirma pago al cliente
```

---

## 🎯 CHECKLIST PARA MIGRACIÓN A PRODUCCIÓN

### Requisitos de Flow:
- [ ] Cuenta Flow verificada completamente
- [ ] Credenciales de producción obtidas
- [ ] Límites de transacción configurados
- [ ] Datos bancarios registrados

### Actualización de Código:
- [ ] Cambiar FLOW_API_URL a producción
- [ ] Actualizar FLOW_API_KEY (producción)
- [ ] Actualizar FLOW_SECRET_KEY (producción)
- [ ] Cambiar urls: sandbox.flow.cl → www.flow.cl
- [ ] Verificar SITE_URL es dominio real (no localhost)

### Testing Producción:
- [ ] Prueba E2E con pago real de CLP $1
- [ ] Verificar webhook se dispara
- [ ] Confirmar email se envía al cliente
- [ ] Confirmar dinero se transfiere a banco
- [ ] Confirmar reporte se genera correctamente

### Monitoreo Producción:
- [ ] Alertas si webhook falla
- [ ] Log de todos los pagos
- [ ] Verificación diaria de transferencias bancarias
- [ ] Dashboard de estatus de órdenes

---

## 🔍 PRÓXIMOS PASOS - AHORA MISMO

### 1. Debuggear Error 400:
```bash
# Revisar logs detallados de la función
netlify logs --function flow-create-payment --since 10m

# Buscar exactamente qué parámetros se envían
# Buscar respuesta de Flow API
```

### 2. Verificar Parámetros:
```javascript
// ¿Amount es número entero sin decimales?
// ¿Email es válido?
// ¿URL es accesible desde internet?
// ¿Firma SHA256 es correcta con nuevas credenciales?
```

### 3. Prueba Mínima:
```bash
# Curl directo a Flow con parámetros de prueba
curl -X POST https://sandbox.flow.cl/api/payment/create \
  -d "apiKey=1F7ABDF2-7286-4261-9A54-963935CDCL2I&..."
```

---

## 📝 DOCUMENTACIÓN REFERENCIA FLOW

- **Flow Dashboard:** https://dashboard.sandbox.flow.cl
- **API Docs:** https://www.flow.cl/docs/api
- **Test Cards:** 4111 1111 1111 1111 (cualquier fecha futura, cualquier CVV)
- **Support:** support@flow.cl

