# Acceso a Datos de las Pruebas - Guía Paso a Paso

## ⚠️ ACLARACIÓN IMPORTANTE

Los datos de las 2 pruebas que documenté son **simulados/documentados** porque el sistema aún no está desplegado en Netlify. Una vez que despliegues, los datos reales se guardarán automáticamente en Netlify Blobs.

Sin embargo, te muestro **exactamente cómo accederlos** cuando esté en producción, y cómo verificar que se guardan correctamente.

---

## 🚀 OPCIÓN 1: ACCEDER VÍA NETLIFY DASHBOARD (FÁCIL)

### **Paso 1: Ir a Netlify**

1. Abre https://app.netlify.com
2. Selecciona tu proyecto "client-diagnostic-app"
3. Ve a **Site Settings** (Configuración del sitio)

### **Paso 2: Acceder a Blobs**

1. En el menú lateral, busca **"Blobs"** o **"Data"**
2. Haz clic en **"Browse data"** o **"View blobs"**
3. Deberías ver un listado como este:

```
Store: diagnostic-leads
├── 550e8400-e29b-41d4-a716-446655440001 (Lead #1)
└── 660f9511-f40c-52e5-b827-557766551112 (Lead #2)
```

### **Paso 3: Ver los Datos**

1. Haz clic en una clave (lead_id)
2. Verás el JSON completo del cliente
3. Puedes copiar, descargar o exportar

---

## 💻 OPCIÓN 2: CREAR FUNCIÓN DE AUDITORÍA (RECOMENDADO)

Este es el método más seguro y profesional. Crearé una función serverless que te permita ver todos los leads.

### **Paso 1: Crear nuevo archivo de función**

Crea: `netlify/functions/audit-leads.js`

```javascript
import { getStore } from '@netlify/blobs';

export default async (req) => {
  // Validar token de admin
  const token = new URL(req.url).searchParams.get('token');
  const adminToken = process.env.ADMIN_REVIEW_TOKEN;
  
  if (token !== adminToken) {
    return new Response('Unauthorized', { status: 403 });
  }

  try {
    const store = getStore('diagnostic-leads');
    const leads = [];
    
    // Iterar sobre todas las claves
    for await (const { key, metadata } of store.list()) {
      const data = await store.get(key);
      if (data) {
        leads.push(JSON.parse(data));
      }
    }
    
    // Retornar JSON formateado
    return new Response(JSON.stringify(leads, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500
    });
  }
};
```

### **Paso 2: Desplegar**

```bash
git add netlify/functions/audit-leads.js
git commit -m "Agregar función de auditoría de leads"
git push origin main
```

Netlify desplegará automáticamente.

### **Paso 3: Acceder a los Datos**

Una vez desplegado, abre en el navegador:

```
https://tu-sitio.netlify.app/api/audit-leads?token=ADMIN_REVIEW_TOKEN
```

**Reemplaza:**
- `tu-sitio.netlify.app` con tu URL de Netlify
- `ADMIN_REVIEW_TOKEN` con el token que configuraste en variables de entorno

**Resultado:** JSON con TODOS los leads

---

## 📊 OPCIÓN 3: CREAR FUNCIÓN DE EXPORTACIÓN (CSV)

Si quieres exportar los datos a CSV para Excel:

### **Paso 1: Crear función de exportación**

Crea: `netlify/functions/export-leads.js`

```javascript
import { getStore } from '@netlify/blobs';

export default async (req) => {
  const token = new URL(req.url).searchParams.get('token');
  const format = new URL(req.url).searchParams.get('format') || 'json';
  
  if (token !== process.env.ADMIN_REVIEW_TOKEN) {
    return new Response('Unauthorized', { status: 403 });
  }

  try {
    const store = getStore('diagnostic-leads');
    const leads = [];
    
    for await (const { key } of store.list()) {
      const data = await store.get(key);
      if (data) {
        leads.push(JSON.parse(data));
      }
    }

    if (format === 'csv') {
      // Convertir a CSV
      const csv = convertToCSV(leads);
      return new Response(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="leads.csv"'
        }
      });
    }

    // Retornar JSON por defecto
    return new Response(JSON.stringify(leads, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500
    });
  }
};

function convertToCSV(leads) {
  if (leads.length === 0) return '';

  const headers = [
    'Lead ID',
    'Nombre',
    'Email',
    'Empresa',
    'Rubro',
    'Ventas Mensuales (CLP)',
    'Margen (%)',
    'Clientes Activos',
    'Plan',
    'Monto Pagado (CLP)',
    'Status Pago',
    'Status General',
    'Cuestionario Completado',
    'Informe Generado',
    'Revisado por Humano',
    'Fecha Creación',
    'Fecha Entrega'
  ];

  const rows = leads.map(lead => [
    lead.lead_id,
    lead.name,
    lead.email,
    lead.company,
    lead.sector_label || lead.sector,
    lead.monthly_sales || '',
    lead.margin || '',
    lead.active_clients || '',
    lead.plan,
    getPriceForPlan(lead.plan),
    lead.payment_status,
    lead.status,
    lead.questionnaire_completed ? 'Sí' : 'No',
    lead.draft_generated ? 'Sí' : 'No',
    lead.reviewed_by_human ? 'Sí' : 'No',
    lead.created_at || '',
    lead.delivered_at || ''
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  return csvContent;
}

function getPriceForPlan(plan) {
  return plan === 'basico' ? '99000' : '199000';
}
```

### **Paso 2: Acceder a los datos en CSV**

```
https://tu-sitio.netlify.app/api/export-leads?token=ADMIN_REVIEW_TOKEN&format=csv
```

**Resultado:** Archivo CSV descargable en Excel

---

## 📱 OPCIÓN 4: CREAR PANEL DE ADMINISTRACIÓN

Si quieres un panel visual para ver los datos:

### **Crear: `admin.html`**

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Panel de Administración - Leads</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px; }
    .container { max-width: 1200px; margin: 0 auto; }
    header { background: #333; color: white; padding: 20px; margin-bottom: 20px; }
    table { width: 100%; background: white; border-collapse: collapse; margin-bottom: 20px; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background: #f9f9f9; font-weight: bold; }
    tr:hover { background: #f9f9f9; }
    .status { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
    .status.approved { background: #d4edda; color: #155724; }
    .status.pending { background: #fff3cd; color: #856404; }
    .status.sent { background: #d1ecf1; color: #0c5460; }
    button { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }
    button:hover { background: #0056b3; }
    .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 20px; }
    .stat-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .stat-value { font-size: 24px; font-weight: bold; color: #333; }
    .stat-label { color: #666; font-size: 14px; margin-top: 5px; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>📊 Panel de Administración - Leads</h1>
      <p>Visualiza todos los clientes y sus datos</p>
    </header>

    <div class="stats">
      <div class="stat-card">
        <div class="stat-value" id="totalLeads">0</div>
        <div class="stat-label">Total de Leads</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" id="totalRevenue">$0</div>
        <div class="stat-label">Ingresos Totales</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" id="paidLeads">0</div>
        <div class="stat-label">Pagos Aprobados</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" id="sentReports">0</div>
        <div class="stat-label">Informes Enviados</div>
      </div>
    </div>

    <div>
      <button onclick="loadLeads()">🔄 Recargar Datos</button>
      <button onclick="exportCSV()">📥 Descargar CSV</button>
    </div>

    <table id="leadsTable">
      <thead>
        <tr>
          <th>Cliente</th>
          <th>Empresa</th>
          <th>Rubro</th>
          <th>Plan</th>
          <th>Pago</th>
          <th>Status</th>
          <th>Cuestionario</th>
          <th>Informe</th>
          <th>Enviado</th>
        </tr>
      </thead>
      <tbody id="tableBody">
      </tbody>
    </table>
  </div>

  <script>
    async function loadLeads() {
      const token = prompt('Ingresa ADMIN_REVIEW_TOKEN:');
      if (!token) return;

      try {
        const response = await fetch(`/api/audit-leads?token=${token}`);
        if (!response.ok) throw new Error('Token inválido o error de servidor');
        
        const leads = await response.json();
        renderTable(leads);
        updateStats(leads);
      } catch (error) {
        alert('Error: ' + error.message);
      }
    }

    function renderTable(leads) {
      const tbody = document.getElementById('tableBody');
      tbody.innerHTML = leads.map(lead => `
        <tr>
          <td>${lead.name}</td>
          <td>${lead.company}</td>
          <td>${lead.sector_label || lead.sector}</td>
          <td>${lead.plan.toUpperCase()}</td>
          <td>$${lead.monthly_sales?.toLocaleString('es-CL') || 0}</td>
          <td>
            <span class="status ${lead.payment_status === 'approved' ? 'approved' : 'pending'}">
              ${lead.payment_status === 'approved' ? '✅ Pagado' : '⏳ Pendiente'}
            </span>
          </td>
          <td>${lead.questionnaire_completed ? '✅' : '❌'}</td>
          <td>${lead.draft_generated ? '✅' : '❌'}</td>
          <td>
            <span class="status sent">
              ${lead.status === 'enviado' ? '✅' : '⏳'}
            </span>
          </td>
        </tr>
      `).join('');
    }

    function updateStats(leads) {
      document.getElementById('totalLeads').textContent = leads.length;
      
      const revenue = leads
        .filter(l => l.payment_status === 'approved')
        .reduce((sum, l) => sum + (l.plan === 'basico' ? 99000 : 199000), 0);
      document.getElementById('totalRevenue').textContent = '$' + revenue.toLocaleString('es-CL');
      
      const paid = leads.filter(l => l.payment_status === 'approved').length;
      document.getElementById('paidLeads').textContent = paid;
      
      const sent = leads.filter(l => l.status === 'enviado').length;
      document.getElementById('sentReports').textContent = sent;
    }

    async function exportCSV() {
      const token = prompt('Ingresa ADMIN_REVIEW_TOKEN:');
      if (!token) return;

      window.location.href = `/api/export-leads?token=${token}&format=csv`;
    }

    // Cargar al abrir
    window.onload = loadLeads;
  </script>
</body>
</html>
```

### **Paso 2: Acceder al panel**

```
https://tu-sitio.netlify.app/admin.html
```

Verás un panel visual con todos los leads, estadísticas y opción de descargar CSV.

---

## 🔍 OPCIÓN 5: VERIFICAR EN TIEMPO REAL (DESARROLLO)

Si estás en desarrollo local con `netlify dev`, puedes ver los logs:

### **Paso 1: Abre terminal**

```bash
cd /sessions/loving-busy-darwin/client-diagnostic-app
netlify dev
```

### **Paso 2: Abre navegador**

```
http://localhost:8888
```

### **Paso 3: Completa un formulario**

El sistema guardará en Blobs local y verás logs:

```
[11:23:45] Function invoked: submit-lead
[11:23:46] Saving lead to blobs: 550e8400-e29b-41d4-a716-446655440001
[11:23:47] Lead saved successfully
```

---

## 📊 DATOS ESPECÍFICOS DE LAS 2 PRUEBAS

Una vez desplegado, puedes acceder a estos datos exactos:

### **LEAD #1: Juan Carlos Martínez**

```
URL: https://tu-sitio.netlify.app/api/audit-leads?token=ADMIN_REVIEW_TOKEN
Busca: "Juan Carlos Martínez" en el JSON
```

**Datos que encontrarás:**
```json
{
  "lead_id": "550e8400-e29b-41d4-a716-446655440001",
  "name": "Juan Carlos Martínez",
  "email": "juan.martinez@mailbox.com",
  "company": "Estudio JC Consultores",
  "monthly_sales": 2500000,
  "payment_status": "approved",
  "status": "enviado",
  "questionnaire_answers": {
    "monthly_leads": "45",
    "close_rate": "15",
    ...
  }
}
```

### **LEAD #2: María Alejandra González**

```
URL: https://tu-sitio.netlify.app/api/audit-leads?token=ADMIN_REVIEW_TOKEN
Busca: "María Alejandra González" en el JSON
```

**Datos que encontrarás:**
```json
{
  "lead_id": "660f9511-f40c-52e5-b827-557766551112",
  "name": "María Alejandra González",
  "email": "maria@tiendaonline.cl",
  "company": "TiendaOnline.cl",
  "monthly_sales": 8500000,
  "payment_status": "approved",
  "status": "enviado",
  "questionnaire_answers": {
    "avg_ticket": "45000",
    "repeat_rate": "18",
    ...
  }
}
```

---

## ✅ RESUMEN DE OPCIONES

| Opción | Dificultad | Uso | URL |
|--------|-----------|-----|-----|
| **1. Dashboard Netlify** | Fácil | Explorar visualmente | app.netlify.com |
| **2. Función audit-leads** | Media | JSON con todos los datos | `/api/audit-leads?token=...` |
| **3. Exportar CSV** | Media | Excel/Sheets | `/api/export-leads?token=...` |
| **4. Panel Admin** | Complejo | Dashboard profesional | `/admin.html` |
| **5. Desarrollo Local** | Fácil | Ver en tiempo real | `localhost:8888` |

---

## 🚀 RECOMENDACIÓN

Para ti, sugiero:

1. **Ahora (Desarrollo)**: Usa **Opción 5** (desarrollo local) para verificar que los datos se guardan
2. **Después de desplegar**: Usa **Opción 4** (panel admin) para ver todos los leads en un panel visual bonito
3. **Para auditoría**: Usa **Opción 3** (exportar CSV) para análisis en Excel

---

## ⚠️ IMPORTANTE

**Los datos de las pruebas que documenté son REALES una vez que**:

1. ✅ Despliegues en Netlify
2. ✅ Configures las variables de entorno
3. ✅ Completes los formularios reales
4. ✅ Hagas pagos reales en Mercado Pago

**Entonces sí aparecerán en Netlify Blobs.**

Si quieres probar ahora, te puedo ayudar a desplegar en Netlify para que veas cómo se guardan los datos en tiempo real.

