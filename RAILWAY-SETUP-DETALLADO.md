# 🚀 RAILWAY SETUP - PASO A PASO EXACTO

## ⚡ ANTES DE EMPEZAR

Necesitas:
- [ ] Cuenta GitHub (o crear en 2 min en github.com)
- [ ] Cuenta Railway (gratis, 5 min)
- [ ] Este repositorio pusheado a GitHub

---

## PASO 1: Crear Repositorio en GitHub

### 1.1 Ir a GitHub
```
https://github.com/new
```

### 1.2 Llenar formulario
```
Repository name: acp-backend
Description: Backend para diagnóstico ACP
Visibility: Public (más fácil)
```

### 1.3 Crear repo
Clic en "Create repository"

### 1.4 Copiar URL
Verás algo como:
```
https://github.com/TU_USUARIO/acp-backend.git
```

---

## PASO 2: Push Código a GitHub

En tu terminal (en carpeta acp-backend):

```bash
# Si aún no está configurado git:
git init
git add .
git commit -m "Backend ACP - Operativo"

# Agregar remote (reemplaza URL)
git remote add origin https://github.com/TU_USUARIO/acp-backend.git
git branch -M main
git push -u origin main
```

**Espera:** 30 segundos a que termine

**Verifica:** Abre GitHub → tu repo → verás los archivos ✅

---

## PASO 3: Crear Proyecto en Railway

### 3.1 Ir a Railway
```
https://railway.app
```

### 3.2 Hacer login/signup
- Clic "Login" o "Sign up"
- Selecciona "Continue with GitHub"
- Autoriza Railway

### 3.3 Dashboard
Una vez dentro, haz clic en "New Project"

### 3.4 Seleccionar repositorio
- Clic en "Deploy from GitHub"
- Busca "acp-backend"
- Clic en el repositorio
- Autoriza Railway para leer tu GitHub

### 3.5 Detectar Node.js
Railway debería detectar automáticamente:
```
✅ Node.js project detected
✅ Install dependencies
✅ Run npm start (o node server.js)
```

Si no se detecta, no hay problema - Railway lo hace automático.

### 3.6 Deploy comienza
Verás logs en vivo:
```
> npm install
> Starting server
✅ Server listening on port 3000
```

---

## PASO 4: Agregar Variables de Entorno

### 4.1 En Railway, encuentra "Variables"
En tu proyecto → pestaña **Variables**

### 4.2 Agregar cada variable

Copia/pega exactamente ESTO (una por una):

**Variable 1:**
```
Key: MERCADOPAGO_ACCESS_TOKEN
Value: APP_USR-7215833646681882-042314-8a6b73129c1eaa7bad24e626d312c736-254339153
```
Clic "Add"

**Variable 2:**
```
Key: SENDGRID_API_KEY
Value: re_HxvrhAzV_MVPawJuhabzjZY3DeZKE1Kt3
```
Clic "Add"

**Variable 3:**
```
Key: ADVISOR_EMAIL
Value: asesor.pac@gmail.com
```
Clic "Add"

**Variable 4:**
```
Key: SITE_URL
Value: https://acp.example.com
```
(Reemplaza con tu dominio Netlify)
Clic "Add"

**Variable 5:**
```
Key: NODE_ENV
Value: production
```
Clic "Add"

**Variable 6:**
```
Key: PORT
Value: 3000
```
Clic "Add"

### 4.3 Guardar
Debería haber un botón "Save" o "Update"

### 4.4 Redeploy
Railway redeploy automáticamente con las nuevas variables

Espera a ver:
```
✅ Deployment successful
```

---

## PASO 5: Obtener URL de Railway

### 5.1 En Railway
Tu proyecto → pestaña **Deployments**

### 5.2 Buscar "Domain"
Verás algo como:
```
acp-backend-abc123.railway.app
```

**COPIA ESTA URL** (la necesitarás)

---

## PASO 6: Probar el Backend

En tu navegador, prueba:
```
https://acp-backend-abc123.railway.app/api/health
```

Debería devolver:
```json
{
  "status": "healthy",
  "timestamp": "..."
}
```

✅ **Si ves eso, el backend está OPERATIVO**

---

## PASO 7: Actualizar Frontend

En tu `index.html` (en Netlify), busca esta línea:

```javascript
const BACKEND_URL = 'https://acp-backend.railway.app';
```

Reemplaza con tu URL real:
```javascript
const BACKEND_URL = 'https://acp-backend-abc123.railway.app';
```

Guarda y despliega en Netlify.

---

## PASO 8: Prueba End-to-End

1. Ve a tu formulario en Netlify
2. Llena los datos
3. Aplica cupón: **TEST100**
4. Haz clic "Continuar a pago"
5. ✅ Debería ir a Mercado Pago

**Si llega a Mercado Pago = TODO FUNCIONA** 🎉

---

## 🆘 TROUBLESHOOTING

### El servidor no inicia
**En Railway → Logs:**
```
Busca el error exacto
```

### "Module not found"
```
Railway está instalando dependencias
Espera 2-3 minutos y recarga
```

### "Cannot find MERCADOPAGO_ACCESS_TOKEN"
```
Verificar que las variables estén agregadas
Railway → Variables → Ver que aparezcan todas
```

### "Mercado Pago no responde"
```
Las credenciales están bien
El problema es probablemente un error temporal de MP
Intenta de nuevo en 5 minutos
```

### Puerto bloqueado
```
No es problema - Railway maneja puertos automáticamente
```

---

## ✅ CHECKLIST FINAL

- [ ] Repositorio creado en GitHub
- [ ] Código pusheado
- [ ] Proyecto creado en Railway
- [ ] Variables de entorno agregadas
- [ ] Deploy successful (verde en Railway)
- [ ] URL obtenida: `https://acp-backend-xxx.railway.app`
- [ ] Health check devuelve JSON
- [ ] BACKEND_URL actualizado en index.html
- [ ] Formulario redirige a Mercado Pago
- [ ] ✅ **TODO OPERATIVO**

---

## 🎯 TIEMPO TOTAL

- GitHub: 2 min
- Railway setup: 3 min
- Agregar variables: 2 min
- Esperar deploy: 2 min
- Probar: 2 min

**Total: 11 minutos**

---

## 📞 AYUDA

Si algo falla:
1. Ve a Railway → Logs
2. Busca el error exacto
3. Verifica las variables de entorno
4. Haz redeploy manualmente

**Railway es muy confiable - si sigues estos pasos, funcionará 100%**

---

**¡LISTO PARA EMPEZAR! 🚀**
