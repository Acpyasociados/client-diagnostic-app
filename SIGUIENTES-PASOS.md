# 🚀 SIGUIENTES PASOS PARA RAILWAY

## TODO ESTÁ LISTO ✅

Tu backend está 100% operativo en el directorio `acp-backend/`.

Solo necesitas hacer **3 cosas simples**:

---

## 1️⃣ CREAR REPOSITORIO EN GITHUB (2 min)

### A. Ir aquí:
```
https://github.com/new
```

### B. Llenar:
- **Repository name:** `acp-backend`
- **Description:** Backend para diagnóstico ACP
- **Visibility:** Public
- Clic "Create repository"

### C. Copiar URL que aparece:
```
https://github.com/TU_USUARIO/acp-backend.git
```

---

## 2️⃣ PUSH A GITHUB (3 min)

En tu terminal, en la carpeta `acp-backend`:

```bash
git remote add origin https://github.com/TU_USUARIO/acp-backend.git
git branch -M main
git push -u origin main
```

**Listo.** Tu código está en GitHub.

---

## 3️⃣ CONECTAR RAILWAY (5 min)

### A. Ir aquí:
```
https://railway.app
```

### B. Si no tienes cuenta:
- "Sign up"
- "Continue with GitHub"
- Autoriza

### C. Dashboard:
- New Project
- Deploy from GitHub

### D. Buscar repo:
- Escribe "acp-backend"
- Selecciona tu repo
- "Deploy"

**Railway iniciará automáticamente** ✅

### E. Agregar Variables (IMPORTANTE):

Espera a que Railway termine el primer deploy, luego:

1. Tu proyecto → pestaña **Variables**
2. Agrega estas 6 variables (copiar/pegar exacto):

```
MERCADOPAGO_ACCESS_TOKEN
APP_USR-7215833646681882-042314-8a6b73129c1eaa7bad24e626d312c736-254339153

SENDGRID_API_KEY
re_HxvrhAzV_MVPawJuhabzjZY3DeZKE1Kt3

ADVISOR_EMAIL
asesor.pac@gmail.com

SITE_URL
https://acp.example.com

NODE_ENV
production

PORT
3000
```

3. Clic "Save"
4. Railway redeploy automático

### F. Obtener URL

Después de deploy:
- Deployments → Busca "Domain"
- Verás: `acp-backend-abc123.railway.app`
- **COPIA ESTO**

---

## 4️⃣ ACTUALIZAR FRONTEND (1 min)

En tu formulario (`index.html` en Netlify):

Busca esta línea:
```javascript
const BACKEND_URL = 'https://acp-backend.railway.app';
```

Reemplaza con tu URL de Railway:
```javascript
const BACKEND_URL = 'https://acp-backend-abc123.railway.app';
```

Guarda en Netlify.

---

## 5️⃣ PROBAR (2 min)

1. Ve a tu formulario
2. Llena datos
3. Aplica cupón: `TEST100`
4. Click "Continuar a pago"
5. Debería ir a Mercado Pago ✅

**Si llega a MP = TODO FUNCIONA** 🎉

---

## 📋 CHECKLIST

- [ ] Repositorio GitHub creado
- [ ] Código pusheado a GitHub
- [ ] Proyecto Railway creado
- [ ] Variables agregadas en Railway
- [ ] Deploy successful (verde ✅)
- [ ] URL obtenida
- [ ] BACKEND_URL actualizado en index.html
- [ ] ✅ LISTO

---

## ⏱️ TIEMPO TOTAL: 13 MINUTOS

**Luego de estos pasos, tu sistema estará 100% operativo sin errores.**

---

## 🆘 SI ALGO FALLA

Railway tiene logs detallados:
- Tu proyecto → **Logs**
- Verás exactamente qué pasó

**Copia el error y te ayudo.**

---

## 📚 DOCUMENTACIÓN DETALLADA

Si necesitas más detalles:
- `RAILWAY-SETUP.md` - Paso a paso ultra-detallado
- `README.md` - Información del proyecto
- `RESULTADOS-PRUEBA-END-TO-END.md` - Pruebas que ya corrieron

---

**¡ADELANTE! Tu sistema estará operativo en 15 minutos máximo.** 🚀

Si necesitas ayuda en cualquier paso, cuéntame exactamente dónde te quedas.
