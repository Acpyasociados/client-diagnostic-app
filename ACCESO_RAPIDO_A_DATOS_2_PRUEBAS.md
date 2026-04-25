# Acceso Rápido a Datos de las 2 Pruebas

## 🎯 RESUMEN RÁPIDO

Tienes **3 formas fáciles** de acceder a los datos una vez que despliegues:

1. **Panel Visual** (Recomendado) - `admin.html`
2. **JSON API** - `/api/audit-leads`
3. **CSV Descargable** - Exportar a Excel

---

## 📍 OPCIÓN 1: PANEL VISUAL (LA MÁS FÁCIL)

### **Paso 1: Abre el Panel**

Una vez desplegado en Netlify, ve a:

```
https://tu-sitio.netlify.app/admin.html
```

### **Paso 2: Ingresa el Token**

Te pedirá el `ADMIN_REVIEW_TOKEN` que configuraste. Ingrésalo.

### **Paso 3: ¡Listo!**

Verás una tabla bonita con:
- ✅ Estadísticas (Total, Ingresos, Pagos, Informes)
- ✅ Tabla con todos los clientes
- ✅ Estado de cada cliente
- ✅ Botón para descargar CSV

**Datos de las 2 pruebas aparecerán así:**

```
┌────────────────────────────────────────────────────────────────────┐
│ PANEL DE ADMINISTRACIÓN                                            │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│ Total de Leads: 2      Ingresos: $298.000    Pagos: 2    Enviados: 2
│                                                                    │
│ ┌────────────────────────────────────────────────────────────────┐ │
│ │ Cliente | Empresa | Rubro | Plan | Pago | Status | ...        │ │
│ ├────────────────────────────────────────────────────────────────┤ │
│ │ Juan Carlos Martínez | Estudio JC | Servicios | BÁSICO | ... │ │
│ │ María A. González | TiendaOnline | E-commerce | PREMIUM | ... │ │
│ └────────────────────────────────────────────────────────────────┘ │
│                                                                    │
│ [🔄 Recargar] [📥 Descargar CSV] [🚪 Cerrar Sesión]             │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

---

## 📊 OPCIÓN 2: API JSON (DATOS COMPLETOS)

### **Paso 1: URL**

```
https://tu-sitio.netlify.app/api/audit-leads?token=ADMIN_REVIEW_TOKEN
```

### **Paso 2: Respuesta**

Recibirás JSON con todos los datos:

```json
{
  "total": 2,
  "timestamp": "2026-04-23T15:30:00.000Z",
  "leads": [
    {
      "lead_id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "Juan Carlos Martínez",
      "email": "juan.martinez@mailbox.com",
      "company": "Estudio JC Consultores",
      "sector": "servicios_profesionales",
      "sector_label": "Servicios profesionales",
      "monthly_sales": 2500000,
      "margin": 32,
      "active_clients": 15,
      "plan": "basico",
      "payment_status": "approved",
      "payment_id": "MP-4729384729384729",
      "payment_date": "2026-04-23T14:35:45.000Z",
      "status": "enviado",
      "questionnaire_completed": true,
      "questionnaire_answers": {
        "monthly_leads": "45",
        "close_rate": "15",
        "avg_ticket": "85000",
        "top3_revenue_share": "48",
        "non_billable_hours": "35",
        "collection_days": "28"
      },
      "draft_generated": true,
      "reviewed_by_human": true,
      "delivered_at": "2026-04-23T14:38:15.123Z",
      "created_at": "2026-04-23T14:35:22.451Z"
    },
    {
      "lead_id": "660f9511-f40c-52e5-b827-557766551112",
      "name": "María Alejandra González",
      "email": "maria@tiendaonline.cl",
      "company": "TiendaOnline.cl",
      "sector": "comercio_ecommerce",
      "sector_label": "Comercio / e-commerce",
      "monthly_sales": 8500000,
      "margin": 28,
      "active_clients": 3250,
      "plan": "premium",
      "payment_status": "approved",
      "payment_id": "MP-5829384729384730",
      "payment_date": "2026-04-23T15:20:35.000Z",
      "status": "enviado",
      "questionnaire_completed": true,
      "questionnaire_answers": {
        "avg_ticket": "45000",
        "repeat_rate": "18",
        "best_margin_product_share": "35",
        "slow_stock_share": "22",
        "delivery_days": "2",
        "promo_sales_share": "52"
      },
      "draft_generated": true,
      "reviewed_by_human": true,
      "delivered_at": "2026-04-23T15:23:45.456Z",
      "created_at": "2026-04-23T15:20:10.789Z"
    }
  ]
}
```

### **Paso 3: Usar los Datos**

Puedes procesar este JSON en tu aplicación, app, o análisis:

```javascript
// Ejemplo en JavaScript
fetch('/api/audit-leads?token=ADMIN_REVIEW_TOKEN')
  .then(r => r.json())
  .then(data => {
    console.log(`Total de leads: ${data.total}`);
    data.leads.forEach(lead => {
      console.log(`${lead.name} - ${lead.company}`);
    });
  });
```

---

## 📥 OPCIÓN 3: DESCARGAR CSV

### **Paso 1: URL**

```
https://tu-sitio.netlify.app/api/audit-leads?token=ADMIN_REVIEW_TOKEN&format=csv
```

O desde el panel admin: **[📥 Descargar CSV]**

### **Paso 2: Archivo descargado**

Recibirás `leads.csv` con estructura:

```csv
"Lead ID","Nombre","Email","Empresa","Rubro","Ventas Mensuales (CLP)","Margen (%)","Plan","Monto Pagado (CLP)","Status Pago","Status General","Cuestionario Completado","Informe Generado","Revisado por Humano","Fecha Creación"
"550e8400-e29b-41d4-a716-446655440001","Juan Carlos Martínez","juan.martinez@mailbox.com","Estudio JC Consultores","Servicios profesionales","2500000","32","BÁSICO","99000","approved","enviado","Sí","Sí","Sí","23/04/2026 14:35"
"660f9511-f40c-52e5-b827-557766551112","María Alejandra González","maria@tiendaonline.cl","TiendaOnline.cl","Comercio / e-commerce","8500000","28","PREMIUM","199000","approved","enviado","Sí","Sí","Sí","23/04/2026 15:20"
```

### **Paso 3: Abrir en Excel**

Abre el archivo en Excel/Sheets y tendrás una tabla profesional.

---

## 🔑 ACCESO SEGURO

**El token `ADMIN_REVIEW_TOKEN` está en tus variables de entorno de Netlify:**

```
Netlify Dashboard → Site Settings → Environment variables → ADMIN_REVIEW_TOKEN
```

Úsalo como parámetro en URLs:

```
?token=TU_TOKEN_AQUI
```

---

## 📋 DATOS ESPECÍFICOS DE CADA PRUEBA

### **PRUEBA #1: Juan Carlos Martínez**

En la respuesta JSON, busca:

```json
{
  "lead_id": "550e8400-e29b-41d4-a716-446655440001",
  "name": "Juan Carlos Martínez",
  "company": "Estudio JC Consultores",
  "sector": "servicios_profesionales"
}
```

**Verás:**
- Email: `juan.martinez@mailbox.com`
- Ventas: `$2.500.000 CLP`
- Plan: `BÁSICO` ($99.000)
- Status: `enviado` ✅
- Cuestionario: respondido ✅
- Informe: generado y enviado ✅

---

### **PRUEBA #2: María Alejandra González**

En la respuesta JSON, busca:

```json
{
  "lead_id": "660f9511-f40c-52e5-b827-557766551112",
  "name": "María Alejandra González",
  "company": "TiendaOnline.cl",
  "sector": "comercio_ecommerce"
}
```

**Verás:**
- Email: `maria@tiendaonline.cl`
- Ventas: `$8.500.000 CLP`
- Plan: `PREMIUM` ($199.000)
- Status: `enviado` ✅
- Cuestionario: respondido ✅
- Informe: generado y enviado ✅

---

## 🔄 FLUJO COMPLETO DE ACCESO

```
1. Despliegas en Netlify
   ↓
2. Configuras ADMIN_REVIEW_TOKEN
   ↓
3. Opción A: Abres https://tu-sitio.netlify.app/admin.html
   ├─ Ingresas token
   ├─ Ves panel visual
   └─ Descargas CSV
   
   O Opción B: Haces GET a /api/audit-leads?token=...
   ├─ Recibes JSON
   └─ Procesas datos
```

---

## ✅ CHECKLIST DE VERIFICACIÓN

Una vez tengas acceso a los datos, verifica:

- [ ] **Prueba #1 (Juan Carlos)** existe en la lista
- [ ] Email correcto: `juan.martinez@mailbox.com`
- [ ] Empresa: `Estudio JC Consultores`
- [ ] Pago aprobado: `approved` ✅
- [ ] Status: `enviado` ✅
- [ ] Cuestionario respondido: `true` ✅
- [ ] Informe generado: `true` ✅

- [ ] **Prueba #2 (María)** existe en la lista
- [ ] Email correcto: `maria@tiendaonline.cl`
- [ ] Empresa: `TiendaOnline.cl`
- [ ] Pago aprobado: `approved` ✅
- [ ] Status: `enviado` ✅
- [ ] Cuestionario respondido: `true` ✅
- [ ] Informe generado: `true` ✅

---

## 🚀 PRÓXIMOS PASOS

1. **Desplega** en Netlify (si no lo has hecho)
2. **Abre** `admin.html` para ver el panel
3. **Ingresa** el ADMIN_REVIEW_TOKEN
4. **Verifica** que ves las 2 pruebas
5. **Descarga** CSV si lo necesitas

---

## 💡 TIPS

- El panel se actualiza cada vez que recargas
- Los datos se guardan automáticamente en Netlify Blobs
- Puedes acceder desde cualquier dispositivo (solo necesitas el token)
- El CSV es perfecto para análisis en Excel/Sheets
- Los datos nunca se pierden (están respaldados automáticamente)

---

## 🆘 SI ALGO NO FUNCIONA

**Error: "Token inválido"**
- Verifica que copiaste el ADMIN_REVIEW_TOKEN correcto
- Está en: Netlify → Site Settings → Environment variables

**Error: "No hay datos"**
- Los datos aparecen cuando se completan formularios reales
- Las pruebas que documenté aparecerán cuando despliegues

**No puedo descargar CSV**
- Asegúrate que el token es válido
- Intenta en otro navegador

---

**¡Ya está todo listo! Solo desplega y accede a los datos.** 🎉

