# INCIDENTE: Error post-pago — 404 y 403
**Fecha:** 4 de junio 2026  
**Proyecto:** ACP y Asociados (acp-asociados.netlify.app)  
**Estado:** RESUELTO ✅

---

## Qué pasó

Un cliente completó el pago en Flow y fue redirigido a una página 404. El dinero se descontó de la cuenta bancaria pero el cliente no recibió el cuestionario ni la confirmación.

---

## Causa raíz (2 bugs independientes)

### Bug 1 — Webhook con API obsoleta (CRÍTICO)
**Archivo:** `netlify/functions/flow-webhook.js`

**Problema:** La función usaba la sintaxis de Netlify Functions v1:
```javascript
// ❌ INCORRECTO — Netlify lo ejecuta como v2, event es un Request object
export default async (event, context) => {
  const params = event.queryStringParameters; // → undefined siempre
```

**Por qué falló:** Al usar `export default` en ESM, Netlify trata la función como v2. En v2, el primer argumento es un objeto `Request` estándar del navegador, no un objeto `event` con `queryStringParameters`. El resultado: `params` era `undefined`, la verificación de firma fallaba, y **ningún pago se procesaba correctamente desde el principio**.

**Solución aplicada:**
```javascript
// ✅ CORRECTO — Netlify Functions v2
export default async (req) => {
  const url = new URL(req.url);
  const params = Object.fromEntries(url.searchParams.entries());
```

---

### Bug 2 — Página 404 durante deploy (MENOR)
**Archivo:** `flow-success.html`

**Problema:** El cliente hizo el pago exactamente durante los ~60 segundos en que se estaba publicando un nuevo deploy de Netlify. La página existe y funciona, pero el timing fue desfavorable.

**Nota:** Netlify usa deploys atómicos, lo que minimiza este riesgo. No requiere cambio de código, solo documentación.

---

## Impacto del incidente

| Aspecto | Detalle |
|---|---|
| Cliente afectado | Animal Food Spa |
| Orden | `c58ee35d-e41d-4b83-b931-61d3a4bc841b` |
| Monto | Descontado correctamente de cuenta bancaria |
| Cuestionario enviado | ❌ No (webhook no procesó el pago) |
| Recuperación | ✅ Manual vía `resend-questionnaire` el mismo día |

---

## Solución implementada

### 1. Corrección del webhook (permanente)
`flow-webhook.js` corregido a Netlify Functions v2. Todos los pagos futuros se procesan correctamente.

### 2. Función de recuperación (nueva)
`netlify/functions/resend-questionnaire.js` — permite reenviar el cuestionario a cualquier lead pagado sin necesidad de código adicional.

**Uso para recuperar un pago:**
```powershell
Invoke-RestMethod `
  -Uri "https://acp-asociados.netlify.app/.netlify/functions/resend-questionnaire" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"lead_id":"LEAD_ID_AQUI","admin_token":"TU_ADMIN_REVIEW_TOKEN"}'
```

### 3. Protección contra duplicados (nueva)
El webhook ahora verifica si un pago ya fue procesado antes de volver a ejecutarlo:
```javascript
if (lead.status === 'pagado') {
  console.log('Pago ya procesado anteriormente para:', leadId);
  return new Response(JSON.stringify({ success: true, status: 'ya_procesado' }), ...);
}
```

---

## Cómo verificar que un pago se procesó correctamente

1. Abre el panel admin: `https://acp-asociados.netlify.app/admin.html`
2. Busca el lead por nombre o email
3. El estado debe ser `pagado` o superior
4. El campo `questionnaire_email_sent_at` debe tener una fecha

Si el lead tiene estado `pending` pero el pago se efectuó en el banco, usar la función `resend-questionnaire` del paso anterior.

---

## Checklist post-deploy (ejecutar después de cada deploy en producción)

- [ ] Verificar que `flow-success.html` carga: `https://acp-asociados.netlify.app/flow-success.html`
- [ ] Revisar admin panel para confirmar que los leads recientes tienen estado correcto
- [ ] Si hay leads en estado `pending` con más de 30 min, usar `resend-questionnaire`

---

## Lección para proyectos futuros

Ver documento: `LECCION-NETLIFY-FUNCTIONS-V2.md`

