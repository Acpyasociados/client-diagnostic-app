# 🚀 ACP Backend - Sistema de Diagnóstico

Backend Node.js/Express para el sistema de diagnóstico de ACP y Asociados.

**Status:** ✅ Operativo y listo para Railway

---

## ⚡ Despliegue Rápido (2 minutos)

### 1. GitHub
```bash
git add .
git commit -m "Backend ACP - Operativo"
git push origin main
```

### 2. Railway (interfaz web)
1. Ve a https://railway.app
2. New Project → Deploy from GitHub
3. Selecciona `acp-backend`
4. Railway detecta Node.js automáticamente ✅

### 3. Variables de Entorno (copiar/pegar)
En Railway → Project → Variables:

```
MERCADOPAGO_ACCESS_TOKEN=APP_USR-7215833646681882-042314-8a6b73129c1eaa7bad24e626d312c736-254339153
SENDGRID_API_KEY=re_HxvrhAzV_MVPawJuhabzjZY3DeZKE1Kt3
ADVISOR_EMAIL=asesor.pac@gmail.com
SITE_URL=https://tu-dominio.netlify.app
NODE_ENV=production
PORT=3000
```

### 4. Deploy
- Clic en "Deploy"
- Espera 1-2 minutos
- ✅ Obtienes URL: `https://acp-backend-xyz.railway.app`

### 5. Frontend
En tu `index.html`, actualiza:
```javascript
const BACKEND_URL = 'https://acp-backend-xyz.railway.app';
```

---

## 📊 Endpoints

### Health Check
```bash
GET /api/health
```

### Validar Cupón
```bash
POST /api/validate-coupon
{
  "coupon": "TEST100",
  "plan": "basico"
}
```

### Enviar Lead
```bash
POST /api/submit-lead
{
  "name": "...",
  "email": "...",
  "phone": "...",
  "company": "...",
  "sector": "servicios_profesionales",
  "monthly_sales": "5000000",
  "margin": "50",
  "active_clients": "100",
  "top_costs": "...",
  "main_channel": "...",
  "main_problem": "...",
  "goal_6m": "...",
  "plan": "basico",
  "discountPercentage": "100",
  "finalPrice": "0"
}
```

### Ver Leads
```bash
GET /api/leads
```

---

## 🛠️ Desarrollo Local

```bash
npm install
MERCADOPAGO_ACCESS_TOKEN=... SENDGRID_API_KEY=... node server.js
```

O copiar `.env.example` a `.env` y:
```bash
npm install
npm start
```

---

## 📋 Stack

- **Framework:** Express.js
- **BD:** SQLite (memory)
- **APIs:** Mercado Pago, SendGrid
- **Hosting:** Railway
- **Runtime:** Node.js 18+

---

## ✅ Checklist Deployment

- [ ] Push a GitHub
- [ ] Conectar Railway
- [ ] Agregar variables de entorno
- [ ] Deploy automático
- [ ] Obtener URL
- [ ] Actualizar BACKEND_URL en frontend
- [ ] Probar formulario
- [ ] ✅ Listo

---

## 🆘 Troubleshooting

**"Module not found"**
- Verifica que `npm install` esté completo en Railway

**"Port already in use"**
- Railway maneja puertos automáticamente

**"Mercado Pago error"**
- Verifica `MERCADOPAGO_ACCESS_TOKEN` en Variables
- Las credenciales deben ser exactas

**"Email no se envía"**
- Verifica `SENDGRID_API_KEY` en Variables

---

## 📞 Support

Ver logs en Railway → Deployments → Logs

---

**Creado para:** ACP y Asociados  
**Versión:** 1.0  
**Status:** ✅ Producción
