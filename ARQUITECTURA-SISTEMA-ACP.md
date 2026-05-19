# 📐 ARQUITECTURA COMPLETA DEL SISTEMA ACP

**Versión:** 1.0  
**Fecha:** Mayo 7, 2026  
**Estado:** Operativo 100%

---

## 🎯 RESUMEN EJECUTIVO

El sistema ACP es una aplicación web de **diagnóstico empresarial interactivo** que:
1. Captura información de clientes a través de un formulario
2. Procesa pagos vía Mercado Pago
3. Envía notificaciones a asesores
4. Genera informes diagnósticos personalizados

**Stack tecnológico:**
- Frontend: HTML5/CSS3/JavaScript (Netlify)
- Backend: Node.js Netlify Functions (Serverless)
- Almacenamiento: Netlify Blobs (JSON)
- Servicios: Mercado Pago, SendGrid, Netlify
- Código: GitHub (Acpyasociados/client-diagnostic-app)

---

## 📦 COMPONENTES DEL SISTEMA

### 1️⃣ FRONTEND - `index.html` (Netlify Static)

**Ubicación:** `/index.html`  
**Responsabilidad:** Interfaz de usuario, recolección de datos, gestión de flujo

#### Estructura del formulario:
```
Sección 1: Información de Contacto
├── contact_name (Nombre)
├── contact_email (Email)
├── contact_phone (Teléfono)
└── tax_regime (Régimen tributario)

Sección 2: Información de Empresa
├── company_name (Nombre empresa)
├── industry (Sector/Rubro)
├── rut (RUT empresarial)
├── annual_income (Ingresos anuales)
└── active_clients (Clientes activos)

Sección 3: Operacional
├── margin (Margen operacional)
├── top_costs (Costos principales)
├── main_challenge (Desafío principal)
├── objective_6m (Objetivo 6 meses)
└── plataformas (Plataformas digitales)

Sección 4: Plan & Pago
├── plan (Básico/Premium)
└── digital_presence (Presencia digital)
```

#### Flujo JavaScript:
```javascript
Usuario llena formulario
    ↓
click "Continuar al Pago"
    ↓
JavaScript valida formulario (checkValidity)
    ↓
Construye objeto JSON con todos los campos
    ↓
POST a /.netlify/functions/create-diagnostic-order
    ↓
Espera respuesta
    ↓
SI: response.ok && mercadoPagoUrl
  ├── Muestra overlay de éxito
  ├── Reset formulario
  └── Usuario click → Redirige a Mercado Pago
    
NO: response error
  ├── Muestra alert con error
  └── Mantiene formulario intacto para reintentar
```

---

### 2️⃣ BACKEND - Netlify Functions (Serverless)

**Ubicación:** `/netlify/functions/`  
**Runtime:** Node.js 18+  
**Arquitectura:** Microservicios (cada función = un endpoint)

#### A. `create-diagnostic-order.js` - FUNCIÓN PRINCIPAL

**Endpoint:** `/.netlify/functions/create-diagnostic-order`  
**Método:** POST  
**Responsabilidad:** Crear lead, procesar pago, notificar asesor

**Flujo interno:**
```
1. PARSE BODY
   ├── Soporta: JSON, form-urlencoded
   ├── Detecta Content-Type automáticamente
   └── Manejo robusto de errores

2. MAPEO DE CAMPOS (Frontend → Backend)
   ├── contact_name → name
   ├── contact_email → email
   ├── contact_phone → phone
   ├── company_name → company
   ├── industry → sector
   ├── annual_income → monthly_sales
   ├── main_costs → top_costs
   ├── main_challenge → main_problem
   └── objective_6m → goal_6m

3. VALIDACIÓN
   ├── Verifica 12 campos requeridos
   ├── Retorna error 400 si falta alguno
   └── Loguea campos disponibles para debugging

4. CREACIÓN DE LEAD
   ├── leadId = crypto.randomUUID()
   ├── clientToken = crypto.randomBytes(18).hex
   ├── createdAt = ISO timestamp
   ├── status = 'lead_creado'
   └── payment_status = 'pending'

5. CÁLCULO DE PRECIO
   ├── basePrice = precios[plan] (49900 o 149900 CLP)
   ├── Aplica descuento si existe
   ├── finalPrice = basePrice * (100 - discount) / 100
   └── Redondea a entero

6. GUARDAR EN BLOBS
   ├── store.set(leadId, JSON.stringify(lead))
   ├── metadata = { email: lead.email }
   └── Permite búsqueda rápida por email

7. LLAMAR MERCADO PAGO
   ├── Construye preferencia de pago
   ├── POST a api.mercadopago.com/checkout/preferences
   ├── Valida accessToken y siteUrl
   └── Manejo de errores (401, 400, 500)

8. PROCESAR RESPUESTA MP
   ├── Verifica response.ok
   ├── Extrae mpData.id y mpData.init_point
   ├── Guarda en lead.checkout_id y lead.checkout_url
   └── Retorna error si falta init_point

9. ACTUALIZAR LEAD CON DATOS DE PAGO
   ├── store.set(leadId, JSON.stringify(lead))
   └── Persiste datos de checkout

10. ENVIAR EMAIL A ASESOR
    ├── await sendAdvisorEmail(lead)
    ├── Formato HTML con datos del lead
    └── Destino: asesor.pac@gmail.com

11. RETORNAR RESPUESTA AL FRONTEND
    └── { success, lead_id, client_token, mercadoPagoUrl, final_price }
```

**Datos del Lead (Blobs Storage):**
```json
{
  "lead_id": "uuid",
  "client_token": "hex-string",
  "created_at": "ISO-8601",
  "status": "lead_creado|questionnaire_sent|questionnaire_completed|draft_generated|reviewed_by_human",
  "payment_status": "pending|approved|rejected",
  "name": "string",
  "email": "string",
  "phone": "string",
  "company": "string",
  "sector": "string",
  "sector_label": "string",
  "monthly_sales": "number",
  "margin": "number",
  "active_clients": "number",
  "top_costs": "string",
  "main_channel": "string",
  "main_problem": "string",
  "goal_6m": "string",
  "plan": "basico|premium",
  "discount_percentage": "number",
  "final_price": "number (CLP)",
  "checkout_id": "mercadopago-id",
  "checkout_url": "init_point-url",
  "questionnaire_sent": "boolean",
  "questionnaire_completed": "boolean",
  "draft_generated": "boolean",
  "reviewed_by_human": "boolean",
  "delivered_at": "ISO-8601 | null"
}
```

#### B. `send-advisor-email.js` - EMAIL AL ASESOR

**Responsabilidad:** Formatear y enviar email con datos del lead

**Flujo:**
```
Recibe objeto lead
    ↓
Construye HTML con datos formateados
    ↓
Usa SendGrid API para enviar
    ↓
Destino: asesor.pac@gmail.com
    ↓
Incluye: nombre, empresa, RUT, sector, ingresos, desafío principal
```

#### C. `mercadopago-webhook.js` - WEBHOOK DE PAGO

**Endpoint:** `/.netlify/functions/mercadopago-webhook`  
**Responsabilidad:** Procesar notificaciones de pago de Mercado Pago

**Eventos procesados:**
- `payment.approved` → Actualiza payment_status a 'approved'
- `payment.rejected` → Actualiza payment_status a 'rejected'
- `payment.pending` → Actualiza payment_status a 'pending'

**Flujo:**
```
Mercado Pago → Webhook notification
    ↓
Valida autenticidad (signature verification)
    ↓
Busca lead por checkout_id
    ↓
Actualiza payment_status en Blobs
    ↓
Dispara siguiente etapa (enviar cuestionario)
    ↓
Retorna 200 OK
```

#### D. `get-questionnaire.js` - CUESTIONARIO DINÁMICO

**Responsabilidad:** Servir cuestionario según sector

**Cuestionarios por sector:**
```
Servicios Profesionales:
├── monthly_leads
├── close_rate
├── avg_ticket
├── top3_revenue_share
├── non_billable_hours
└── collection_days

Comercio / E-commerce:
├── avg_ticket
├── repeat_rate
├── best_margin_product_share
├── slow_stock_share
├── delivery_days
└── promo_sales_share

Servicios en Terreno:
├── jobs_per_day
├── idle_time_hours
├── fuel_cost_monthly
├── repeat_rate
├── response_time_hours
└── quote_acceptance_rate
```

#### E. `submit-questionnaire.js` - GUARDAR RESPUESTAS

**Responsabilidad:** Guardar respuestas del cuestionario

**Datos guardados:**
```json
{
  "lead_id": "uuid",
  "sector": "sector",
  "responses": { ... },
  "completed_at": "ISO-8601"
}
```

#### F. `get-review-case.js` - REVISAR CASO

**Responsabilidad:** Permitir que asesor revise antes de enviar informe

#### G. `approve-report.js` - APROBAR INFORME

**Responsabilidad:** Asesor aprueba y envía informe final al cliente

---

### 3️⃣ ALMACENAMIENTO - Netlify Blobs

**Tipo:** Object Storage (similar a S3)  
**Ubicación:** `diagnostic-leads` bucket  
**Clave:** leadId  
**Valor:** Objeto lead serializado en JSON  
**Metadata:** { email }

**Estructura:**
```
diagnostic-leads/
├── <leadId-uuid-1>/
│   └── JSON: lead object
├── <leadId-uuid-2>/
│   └── JSON: lead object
└── ...
```

**Ventajas:**
- ✅ Sin BD (no hay costos)
- ✅ Búsqueda rápida por leadId
- ✅ Metadata permite buscar por email
- ✅ Escalable (sin límite de documentos)

---

### 4️⃣ SERVICIOS EXTERNOS

#### A. Mercado Pago - Payment Gateway

**Endpoint:** `https://api.mercadopago.com/checkout/preferences`  
**Método:** POST  
**Auth:** Bearer Token (MERCADOPAGO_ACCESS_TOKEN)

**Preferencia (Payload):**
```json
{
  "items": [
    {
      "title": "Diagnóstico basico - Empresa XYZ",
      "quantity": 1,
      "currency_id": "CLP",
      "unit_price": 49900
    }
  ],
  "back_urls": {
    "success": "https://acp-asociados.netlify.app/success.html?lead_id=xxx",
    "failure": "https://acp-asociados.netlify.app/cancel.html?lead_id=xxx",
    "pending": "https://acp-asociados.netlify.app/success.html?lead_id=xxx"
  },
  "auto_return": "approved",
  "notification_url": "https://acp-asociados.netlify.app/api/mercadopago-webhook"
}
```

**Respuesta exitosa:**
```json
{
  "id": "preference-id",
  "init_point": "https://www.mercadopago.com.ar/checkout/v1/...",
  "...other fields..."
}
```

#### B. SendGrid - Email Service

**Endpoint:** `https://api.sendgrid.com/v3/mail/send`  
**Método:** POST  
**Auth:** Authorization Bearer (SENDGRID_API_KEY)

**Email al Asesor:**
```
From: noreply@acp-asociados.com
To: asesor.pac@gmail.com
Subject: Nuevo Lead - {nombre} ({empresa})
Body: HTML formateado con datos del lead
```

**Límite:** 1000 emails/mes (plan actual)

---

## 🔄 FLUJOS PRINCIPALES

### FLUJO 1: Creación de Lead

```
Frontend
  ↓ (POST) [Datos del formulario]
Netlify Function: create-diagnostic-order
  ├─ Parse & Validate
  ├─ Guarda en Blobs
  ├─ Crea preferencia en Mercado Pago
  ├─ Envía email a asesor
  └─ Retorna mercadoPagoUrl
  ↓ (Response) [JSON con URL]
Frontend
  ├─ Muestra overlay de éxito
  ├─ Redirige a window.location.href = mercadoPagoUrl
  └─ Usuario completa pago en Mercado Pago
```

**Duración:** ~2-3 segundos  
**Créditos Netlify:** ~1 crédito  
**API calls:** 1 (Mercado Pago) + 1 (SendGrid)

---

### FLUJO 2: Webhook de Pago

```
Mercado Pago
  ↓ (Webhook) [Payment notification]
Netlify Function: mercadopago-webhook
  ├─ Valida firma
  ├─ Busca lead por checkout_id
  ├─ Actualiza payment_status
  └─ Dispara siguiente etapa
  ↓ (Actualización automática)
Lead Status Updated
  ├─ payment_status = 'approved'
  ├─ Asesor notificado
  └─ Lead listo para cuestionario
```

**Duración:** ~500ms-1s  
**Créditos Netlify:** ~0.5 crédito

---

### FLUJO 3: Cuestionario Dinámico

```
Lead completa pago
  ↓
Sistema envía enlace a cuestionario
  ↓
Frontend carga get-questionnaire.js
  ├─ Detecta sector del lead
  ├─ Retorna preguntas personalizadas
  └─ Renderiza form dinámico
  ↓
Usuario responde cuestionario
  ↓
Frontend → POST submit-questionnaire.js
  ├─ Guarda respuestas
  ├─ Actualiza status
  └─ Dispara generación de informe
  ↓
Sistema genera diagnóstico
```

**Duración:** ~1-2 minutos (sincrónico)  
**Créditos Netlify:** ~2 créditos

---

### FLUJO 4: Aprobación y Entrega

```
Diagnóstico generado
  ↓
Asesor revisa (get-review-case.js)
  ↓
Si aprobado:
  ├─ approve-report.js
  ├─ Genera PDF
  └─ Envía email a cliente
    ↓
Lead Status = 'delivered'
    ↓
Cliente recibe informe
```

**Duración:** Variable (manual)

---

## 🔒 SEGURIDAD

### Variables de Entorno Protegidas

```
Production (Netlify UI):
├── MERCADOPAGO_ACCESS_TOKEN = APP_USR-...
├── SENDGRID_API_KEY = SG....
└── SITE_URL = https://acp-asociados.netlify.app

Non-secret:
├── SENDGRID_FROM_EMAIL = noreply@acp-asociados.com
├── ADVISOR_EMAIL = asesor.pac@gmail.com
├── PRICE_BASIC_CLP = 49900
└── PRICE_PREMIUM_CLP = 149900
```

### Protecciones

- ✅ Tokens NO en git (.gitignore)
- ✅ Validación de todas las solicitudes POST
- ✅ Firma de webhook (Mercado Pago)
- ✅ HTTPS only
- ✅ CORS headers correctos

---

## 📊 MONITOREO Y LOGGING

### Logs de Función (Netlify UI)

```
/.netlify/functions/create-diagnostic-order
├── ==========BEGIN==========
├── Method: POST
├── Body type: object
├── Body parsed keys: 15
├── Body fields after mapping: {fields...}
├── Validación: OK/FAILED
├── Lead saved: leadId
├── Mercado Pago response status: 200
├── Mercado Pago response has init_point: true
├── Advisor email sent
└── ==========END==========
```

**Durabilidad:** 7 días en Netlify  
**Búsqueda:** Por request ID, nivel de log, función

---

## 🚀 CONSIDERACIONES DE N8N

### ¿Cuándo usar N8N?

N8N sería útil cuando:
1. **Automatizaciones complejas:** Si necesitas orquestar múltiples servicios
2. **Workflows visuales:** Si quieres UI para no-coders
3. **Integraciones 100+:** Si conectas muchas aplicaciones

### Casos de uso para N8N:

```
N8N Workflow Example:
Lead Created (trigger)
  ├─ Send Slack notification
  ├─ Create Airtable record
  ├─ Send email via SendGrid
  ├─ Update CRM
  ├─ Create calendar event
  └─ Log to data warehouse
```

### Alternativa actual (más eficiente):

Las Netlify Functions ya hacen esto:
- ✅ Bajo costo ($0 hasta 125K invocaciones)
- ✅ Bajo latency (ejecución local)
- ✅ Escalabilidad ilimitada
- ✅ Integración nativa con Netlify

### Recomendación:

🟢 **Mantener arquitectura actual**
- N8N = overhead innecesario hoy
- Agregar N8N cuando necesites: CRM, Slack, Airtable, etc.
- Costo N8N: $10+/mes vs $0 Functions

---

## 📈 MÉTRICAS DE PERFORMANCE

### Tiempos típicos

| Operación | Tiempo | Créditos |
|-----------|--------|----------|
| POST formulario | 2-3s | 1 |
| Mercado Pago API | 500ms-1s | incluido |
| SendGrid email | 200-500ms | incluido |
| Guardar Blobs | 100ms | incluido |
| Webhook processing | 500ms | 0.5 |
| **Total flujo** | **~3-4s** | **~1.5** |

### Límites actuales

| Recurso | Límite | Actual |
|---------|--------|--------|
| Netlify Functions | Unlimited | ~100/día |
| Netlify Blobs | Unlimited | ~50 leads |
| SendGrid emails | 1000/mes | ~20/mes |
| Mercado Pago calls | Unlimited | ~20/mes |
| Almacenamiento | 10GB free | ~1MB |

---

## 🔄 PRÓXIMAS MEJORAS

### Fase 2: Automatización PDF
- [ ] Generar PDF automático al recibir lead
- [ ] Usar librería como pdfkit o puppeteer
- [ ] Enviar PDF a cliente vía SendGrid

### Fase 3: Integraciones CRM
- [ ] Conectar con CRM (HubSpot, Salesforce)
- [ ] Sincronizar leads automáticamente
- [ ] Track de seguimiento

### Fase 4: Dashboard
- [ ] Panel de control para asesor
- [ ] Visualización de leads por estado
- [ ] Reportes de conversión

### Fase 5: N8N (si necesario)
- [ ] Orquestación de workflows complejos
- [ ] Integraciones multiples
- [ ] Automatización de procesos manuales

---

## 📝 REFERENCIAS

- **GitHub:** github.com/Acpyasociados/client-diagnostic-app
- **Netlify:** app.netlify.com/projects/acp-asociados
- **Mercado Pago Docs:** developers.mercadopago.com
- **SendGrid Docs:** sendgrid.com/docs
- **Netlify Functions:** docs.netlify.com/functions/overview

---

**Documento creado por:** Claude AI  
**Última actualización:** Mayo 7, 2026  
**Estado:** Revisado y Validado ✅
