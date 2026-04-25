# 🚀 DESPLEGAR BACKEND EN RAILWAY - PASO A PASO

## ¿QUÉ ES ESTO?
Tu nuevo servidor que va a:
✅ Recibir los formularios del cliente  
✅ Validar cupones  
✅ Procesar pagos (Mercado Pago)  
✅ Guardar datos  
✅ Enviar emails  

**Sin problemas de Netlify Functions.**

---

## PASO 1: Crear cuenta en Railway (2 minutos)

1. Ve a **https://railway.app**
2. Haz clic en **"Start Project"** o **"Sign Up"**
3. Elige **"Continue with GitHub"** (más fácil)
4. Autoriza Railway para acceder a GitHub
5. **LISTO** - tienes cuenta creada

---

## PASO 2: Descargar archivos del backend

Los archivos están en: `/sessions/loving-busy-darwin/acp-backend/`

**Archivos necesarios:**
- `server.js` ← El servidor principal
- `package.json` ← Dependencias
- `railway.json` ← Configuración (opcional)
- `.env.example` ← Variables de entorno

---

## PASO 3: Crear repositorio en GitHub

Si NO tienes Git instalado:
1. Descarga desde: **https://git-scm.com/downloads**
2. Instala (próxima → próxima → finish)

**En tu computadora:**
```bash
# Abre Terminal (Mac/Linux) o PowerShell (Windows)
cd ~/Desktop  # o donde quieras
mkdir acp-backend
cd acp-backend

# Copia los 4 archivos aquí (server.js, package.json, etc)

# Luego:
git init
git add .
git commit -m "Backend inicial"
git remote add origin https://github.com/tuusuario/acp-backend.git
git push -u origin main
```

**Si prefieres sin Git:**
Salta a Paso 5 (hay opción de deploy manual)

---

## PASO 4: Conectar GitHub a Railway

1. En Railway (https://railway.app), ve a **"New Project"**
2. Selecciona **"Deploy from GitHub"**
3. Busca tu repositorio `acp-backend`
4. Haz clic en **"Deploy now"**

**Railway detectará automáticamente:**
- ✅ Es un proyecto Node.js
- ✅ Instalará dependencias
- ✅ Iniciará el servidor

---

## PASO 5: Agregar credenciales (IMPORTANTE)

Dentro de tu proyecto en Railway:

1. Ve a **"Variables"** (en el panel izquierdo)
2. Agrega estas variables:

```
MERCADOPAGO_ACCESS_TOKEN = APP_USR-7215833646681882-042314-8a6b73129c1eaa7bad24e626d312c736-254339153

SENDGRID_API_KEY = re_HxvrhAzV_MVPawJuhabzjZY3DeZKE1Kt3

ADVISOR_EMAIL = asesor.pac@gmail.com

SITE_URL = https://tudominio.netlify.app

NODE_ENV = production
```

3. Haz clic en **"Save"**
4. Railway redeploy automáticamente

---

## PASO 6: Obtener tu URL de Railway

1. En Railway, ve a **"Deployments"** (pestaña superior)
2. Busca tu último deploy (verde = exitoso)
3. Haz clic en él
4. Busca **"Domain"** - debería verse así:

```
https://acp-backend-abc123.railway.app
```

**COPIA ESTA URL** (la necesitarás en el siguiente paso)

---

## PASO 7: Actualizar el formulario

En tu archivo `index.html` (en Netlify):

Busca esta línea (casi al inicio del `<script>`):
```javascript
const BACKEND_URL = 'https://acp-backend.railway.app';
```

Cambia `acp-backend.railway.app` por la URL de Railway del paso anterior:
```javascript
const BACKEND_URL = 'https://tu-url-railway.railway.app';
```

Guarda el archivo. Listo.

---

## PASO 8: Prueba

1. Ve a tu formulario: https://tudominio.netlify.app
2. Llena el formulario
3. Aplica cupón: **TEST100**
4. Deberías ver: ✅ Cupón válido - GRATIS
5. Haz clic en **"Continuar a pago"**
6. Deberías ir a Mercado Pago automáticamente 🎉

**Si algo falla:**
- Ve a Railway → "Logs" 
- Verás exactamente qué pasó

---

## ⚠️ SEGURIDAD

- ✅ Los secrets están **SEGUROS en Railway** (no en el código)
- ✅ Nunca guardues `.env` con credenciales reales
- ✅ Las credenciales no se ven en GitHub

---

## 📊 Ver los datos guardados

Después de cada envío, los datos se guardan en la BD del servidor.

**Endpoint para ver todos:**
```
https://tu-url-railway.railway.app/api/leads
```

Devuelve un JSON con todos los leads.

---

## 🆘 Troubleshooting

**"Port is already in use"**
- Reinicia el deploy en Railway

**"Module not found"**
- Ve a Railway → Logs
- Busca el error exacto

**"Backend URL is wrong"**
- Copia la URL completa desde Railway
- Verifica que esté en `index.html` dentro de `BACKEND_URL`

**"Email no se envía"**
- Verifica que `SENDGRID_API_KEY` esté bien en Railway

---

## ✅ TODO LISTO

Una vez que todo funcione:
- ✅ Formulario → Backend → Mercado Pago
- ✅ Datos guardados → Accesible en `/api/leads`
- ✅ Emails enviados → Asesor recibe notificación
- ✅ **SIN ERRORES DE NETLIFY FUNCTIONS**

---

**¿Necesitas ayuda?**
- Comparte el error exacto de Railway (Logs)
- O comparte screenshot del navegador

**¡Listo para iniciar!**
