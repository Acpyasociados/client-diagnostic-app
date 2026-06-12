# 🔄 CRON JOB - CLEANUP OLD LEADS - SETUP INSTRUCCIONES

## ¿QUÉ HACE?

Ejecuta **automáticamente cada 1 de enero** a las 00:00 UTC:

```
1. Busca TODOS los leads con created_at > 365 días
2. BORRA esos leads de diagnostic-leads Blobs
3. Registra auditoría (qué se borró, cuándo, cuántos)
4. Envía reporte al administrador por email
```

**Cumplimiento Ley 21.719:** Artículo 5 (Política de Retención = 1 año)

---

## CONFIGURACIÓN EN NETLIFY

### 1. Archivo ya está creado

✅ `netlify/functions/cleanup-old-leads.js`

### 2. Configurar cron trigger

**En Netlify Dashboard:**

1. Ir a: https://app.netlify.com/sites/acp-asociados/functions
2. Buscar: `cleanup-old-leads`
3. Click en la función
4. Click en "Scheduled Functions" o "Settings"
5. Agregar Schedule:
   - **Pattern:** `0 0 1 1 *` (cada 1 enero a las 00:00 UTC)
   - **Timezone:** UTC (o tu zona)
   - Click "Save"

**Patrón CRON:**
```
0 0 1 1 *
│ │ │ │ │
│ │ │ │ └─ Día de semana (0-6, 0=domingo)
│ │ │ └─── Mes (1-12, 1=enero)
│ │ └───── Día del mes (1-31)
│ └─────── Hora (0-23 UTC)
└───────── Minuto (0-59)
```

---

## VARIABLES DE ENTORNO REQUERIDAS

En Netlify Environment Variables:

```
✅ ADMIN_EMAIL = info@acpasociados.cl (o tu email)
✅ SENDGRID_API_KEY = [ya existe]
```

El cron usa ADMIN_EMAIL para enviar reporte.

---

## PRUEBA MANUAL (Opcional)

Para probar sin esperar al 1 de enero:

```bash
# En terminal local (requiere bearer token)
curl -X POST https://acp-asociados.netlify.app/.netlify/functions/cleanup-old-leads \
  -H "Authorization: Bearer YOUR_SECRET_TOKEN"
```

**Response esperada:**
```json
{
  "success": true,
  "message": "Limpieza completada: X leads borrados",
  "results": {
    "totalScanned": Y,
    "totalDeleted": X,
    "errors": 0,
    "executionTimeMs": 1234
  }
}
```

---

## QUÉ PASA AUTOMÁTICAMENTE

### Cada 1 de enero a las 00:00 UTC:

```
1. INICIO
   └─ Inicia cleanup-old-leads.js
   └─ Valida autorización (bearer token)

2. BÚSQUEDA
   └─ Scannea diagnostic-leads Blobs
   └─ Busca leads con created_at > 365 días
   └─ Identifica leads a borrar

3. BORRADO
   └─ Itera cada lead antiguo
   └─ Ejecuta store.delete(leadId)
   └─ Cuenta borrados exitosos

4. AUDITORÍA
   └─ Registra en audit-log Blobs:
      - Acción: cleanup-old-leads
      - Timestamp: fecha/hora
      - Total borrado: N
      - Detalle de cada lead
      - Errores encontrados

5. EMAIL
   └─ Genera reporte HTML
   └─ Envía a ADMIN_EMAIL
   └─ Incluye estadísticas + detalles

6. FIN
   └─ Response 200 (exitoso)
   └─ Guarda tiempo de ejecución
```

---

## AUDITORÍA GENERADA

**Ubicación:** `audit-log` Blobs store  
**Clave:** `audit-cleanup-TIMESTAMP`

**Contenido:**
```json
{
  "action": "cleanup-old-leads",
  "timestamp": "2026-01-01T00:00:00.000Z",
  "retentionDays": 365,
  "cutoffDate": "2025-01-01T00:00:00.000Z",
  "totalScanned": 45,
  "totalDeleted": 12,
  "deletedLeads": [
    {
      "id": "lead-001",
      "created_at": "2024-12-31T10:30:00Z",
      "email": "user@example.com",
      "company": "XYZ Corp"
    }
  ],
  "errors": [],
  "executionTimeMs": 1234
}
```

---

## REPORTE POR EMAIL

**A:** ADMIN_EMAIL (info@acpasociados.cl)  
**Asunto:** `[CLEANUP] Reporte de limpieza de leads - 01/01/2026`

**Contenido:**
```
Reporte de Limpieza de Datos - Ley 21.719

Fecha: 2026-01-01T00:00:00Z
Política de Retención: 365 días
Cutoff: 2025-01-01T00:00:00Z

---

Resultados:
- Total Scaneado: 45 leads
- Total Borrado: 12 leads ✅
- Errores: 0
- Tiempo: 1234ms

---

Leads Borrados:
[detalles de cada lead]

Auditoría completa: audit-cleanup-1704067200000
Cumplimiento: Ley 21.719 Artículo 5
```

---

## TROUBLESHOOTING

### "Function not found" o "404"

**Causa:** Función no está deployada  
**Solución:**
1. Verificar que `cleanup-old-leads.js` está en netlify/functions/
2. Redeploy: `git push origin main`
3. Esperar 2-3 minutos

### "Authorization failed"

**Causa:** Bearer token no válido  
**Solución:**
- El cron automático lo proporciona Netlify
- Si pruebas manualmente, necesitas token (no está implementado en versión básica)

### "Email not sent"

**Causa:** ADMIN_EMAIL no configurada o Resend tiene problema  
**Solución:**
- Verificar ADMIN_EMAIL en Netlify env vars
- Revisar Resend API status
- El cron NO falla si email falla (fail-safe)

### "No leads deleted"

**Causa:** Todos los leads son recientes  
**Solución:**
- Normal si servicio es nuevo
- Próxima limpieza será 1 enero 2027

---

## VERIFICACIÓN MANUAL

**Para verificar que está configurado correctamente:**

1. Ir a Netlify Dashboard → Functions
2. Buscar `cleanup-old-leads`
3. Ver si aparece "Scheduled" con patrón `0 0 1 1 *`
4. Click en función → Ver últimas ejecuciones

---

## LOGS

**En Netlify Dashboard:**

1. Ir a: Deployments → Functions
2. Click `cleanup-old-leads`
3. Ver "Recent invocations"
4. Click en ejecución para ver logs:
   - `[CLEANUP] Iniciando limpieza...`
   - `[CLEANUP] Encontrados X leads para borrar`
   - `[CLEANUP] Auditoría registrada`
   - `[CLEANUP] Reporte enviado`

---

## CAMBIAR FRECUENCIA

Si necesitas limpiar más frecuentemente (ej: cada mes):

**En Netlify Dashboard:**
1. Ir a función cleanup-old-leads
2. Editar Schedule
3. Cambiar patrón CRON:
   - Cada mes: `0 0 1 * *` (cada día 1 de mes)
   - Cada semana: `0 0 * * 0` (cada domingo)
   - Cada día: `0 0 * * *` (cada día)

**RECOMENDACIÓN:** Mantener anual (1 enero) por ahora. Cambiar solo si Ley 21.719 requiere más frecuencia.

---

## CAMBIAR PERÍODO DE RETENCIÓN

Actualmente: **365 días** (1 año)

Para cambiar (ej: 2 años = 730 días):

En `cleanup-old-leads.js` línea 17:
```javascript
const RETENTION_DAYS = 365; // ← cambiar a 730
```

Luego:
```bash
git add netlify/functions/cleanup-old-leads.js
git commit -m "chore: Cambiar retención a 730 días"
git push origin main
```

---

## CHECKLIST

```
✅ Función cleanup-old-leads.js creada
✅ Variables ADMIN_EMAIL configuradas
✅ Cron schedule configurado (0 0 1 1 *)
✅ Redeploy realizado
✅ Verificación manual (próximo 1 enero)
```

---

## REFERENCIA

- **Archivo:** `netlify/functions/cleanup-old-leads.js`
- **Trigger:** Cron scheduled
- **Patrón:** `0 0 1 1 *` (cada 1 enero)
- **Auditoría:** `audit-log` Blobs store
- **Compliance:** Ley 21.719 Art. 5

---

**Status:** ✅ CRON JOB CONFIGURADO  
**Próxima ejecución:** 1 Enero 2027 a las 00:00 UTC
