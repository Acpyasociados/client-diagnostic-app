# Estructura del Repositorio - client-diagnostic-app

## 📁 Árbol completo

```
client-diagnostic-app/
├── .env.example                          # Variables de entorno (llenar en Netlify)
├── README.md                             # Documentación
├── package.json                          # Dependencies
├── netlify.toml                          # Config Netlify Functions
│
├── index.html                            # Landing page
├── questionnaire.html                    # Cuestionario por sector
├── review.html                           # Panel de revisión (INTERVENCIÓN MANUAL)
├── success.html                          # Confirmación post-pago
├── cancel.html                           # Cancelación de pago
│
├── assets/
│   └── style.css                         # Estilos globales
│
└── netlify/
    └── functions/
        ├── submit-lead.js                # Crear caso + enviar a MP Checkout
        ├── mercadopago-webhook.js        # Webhook de pago → Email cuestionario
        ├── submit-questionnaire.js       # Recibe respuestas + genera borrador
        ├── get-questionnaire.js          # GET cuestionario del cliente
        ├── get-review-case.js            # GET borrador para revisor
        ├── approve-report.js             # POST aprobación → envía informe final
        │
        └── _lib/
            ├── email.js                  # Funciones de envío con Resend
            ├── storage.js                # Almacenamiento en memoria / JSON
            ├── questions.js              # Preguntas por sector
            └── report.js                 # Motor de diagnóstico + thresholds
```

## 🔄 Flujo completo (cómo conecta todo)

```
1. LANDING (index.html)
   → Completa formulario inicial + elige plan
   → POST /submit-lead
   
2. SUBMIT-LEAD (función)
   → Crea caso en storage
   → Redirige a MP Checkout Pro
   
3. CLIENTE PAGA EN MP
   → MP Webhook → /mercadopago-webhook
   
4. WEBHOOK (función)
   → Verifica pago OK
   → Obtiene plan y sector
   → Envía email con link a cuestionario
   
5. CLIENTE ABRE CUESTIONARIO (questionnaire.html)
   → Llena preguntas del sector
   → POST /submit-questionnaire
   
6. SUBMIT-QUESTIONNAIRE (función)
   → Procesa respuestas
   → Motor de diagnóstico (report.js) → genera 3 mejoras
   → Almacena borrador
   → Email al REVIEWER con link de revisión
   
7. REVISOR ABRE PANEL (review.html) ⚠️ INTERVENCIÓN MANUAL
   → Ve borrador + 3 mejoras priorizadas
   → OPCIÓN A: Aprueba → POST /approve-report
   → OPCIÓN B: Rechaza y ajusta
   
8. APPROVE-REPORT (si aprueba)
   → Envía informe final por email al cliente
   → Email a reviewer confirmando envío
```

## 🧠 Motor de diagnóstico (report.js)

Según el **sector**, aplica **thresholds diferentes** para generar 3 mejoras priorizadas:

### Servicios Profesionales
- non_billable_hours > 20 → "Reducir horas no facturadas"
- top3_revenue_share > 50 → "Reducir dependencia de clientes"
- close_rate < 25 → "Aumentar tasa de cierre"
- collection_days > 30 → "Acelerar cobranza"

### Comercio / E-commerce
- repeat_rate < 20 → "Subir recompra"
- promo_sales_share > 40 → "Reducir dependencia de promociones"
- slow_stock_share > 25 → "Liberar capital en stock lento"
- delivery_days > 3 → "Reducir tiempo de entrega"

### Servicios en Terreno
- idle_time_hours > 1 → "Reducir tiempos muertos en ruta"
- quote_acceptance_rate < 40 → "Subir aceptación de presupuestos"
- repeat_rate < 25 → "Aumentar recurrencia"
- response_time_hours > 4 → "Reducir tiempo de respuesta"

Cada mejora tiene:
- Hallazgo (finding)
- Acción (action)
- KPI a monitorear
- Plazo (30/90 días)
- Nivel de intervención (Baja/Media/Alta)
- Prioridad calculada: impact + ease + speed - complexity

---

## 🔐 Variables de entorno (.env)

```
SITE_URL=https://tu-sitio.netlify.app
MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxxx
PRICE_BASIC_CLP=99000
PRICE_PREMIUM_CLP=199000
RESEND_API_KEY=re_xxxx
FROM_EMAIL=onboarding@tu-dominio.com
REVIEWER_EMAIL=tu-correo@empresa.com
ADMIN_REVIEW_TOKEN=token-largo-y-seguro
```

**Críticas para despliegue:**
- MERCADOPAGO_ACCESS_TOKEN (MP Developers)
- RESEND_API_KEY (Resend)
- FROM_EMAIL (dominio verificado en Resend)
- REVIEWER_EMAIL (tu correo)

---

## 🎯 Puntos de intervención manual

**REVISIÓN DE BORRADOR (review.html):**
- Se abre con: `https://tu-sitio.netlify.app/review.html?case=XXX&token=ADMIN_REVIEW_TOKEN`
- El revisor VE: empresa, sector, 3 mejoras priorizadas, métricas
- Puede: Aprobar (envía informe) o Rechazar (vuelve a preguntar)

---

## ✅ Verificaciones ANTES de lanzar

1. **Precios en Netlify ENV:**
   - PRICE_BASIC_CLP = 99000 ¿OK?
   - PRICE_PREMIUM_CLP = 199000 ¿OK?

2. **Textos del landing (index.html):**
   - Título, descripción, CTA ¿Son correctos?

3. **Thresholds en report.js:**
   - ¿Los umbrales tienen sentido para tus rubros?
   - Ej: non_billable_hours > 20 ¿Es realista?

4. **Email:**
   - Dominio verificado en Resend ¿Sí?
   - REVIEWER_EMAIL en Netlify ¿Correcto?

---

## 📝 Próximos pasos

1. ✅ PASO 1: Crear cuentas (Netlify, Resend, MP)
2. ⏳ PASO 2: Pushear repo a GitHub
3. ⏳ PASO 3: Conectar Netlify al repo
4. ⏳ PASO 4: Cargar variables de entorno
5. ⏳ PASO 5: Hacer compra de prueba
6. ⏳ PASO 6: Validar flujo completo
