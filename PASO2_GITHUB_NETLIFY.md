# PASO 2: PUSHEAR A GITHUB + CONECTAR A NETLIFY (7 min)

## Instrucciones paso a paso

### 1️⃣ CREAR REPOSITORIO EN GITHUB

- Ve a https://github.com/new
- **Repository name:** `client-diagnostic-app`
- **Description:** Sistema de diagnóstico de clientes con Mercado Pago
- **Public** (recomendado para Netlify)
- Clic en "Create repository"

✅ Ya tienes URL: `https://github.com/TU_USUARIO/client-diagnostic-app.git`

---

### 2️⃣ PUSHEAR EL CÓDIGO A GITHUB

En tu terminal local (donde clonaste/bajaste el zip):

```bash
cd client-diagnostic-app

# Configurar remoto (reemplaza TU_USUARIO)
git remote add origin https://github.com/TU_USUARIO/client-diagnostic-app.git

# Renombrar rama a 'main' (Netlify preferencia)
git branch -M main

# Pushear el código
git push -u origin main
```

✅ Ahora tu repo está en GitHub con toda la app lista.

---

### 3️⃣ CONECTAR A NETLIFY

- Ve a https://app.netlify.com
- Click en **"Add new site"** → **"Import an existing project"**
- Selecciona **GitHub**
- Autoriza a Netlify para acceder a GitHub
- Busca y selecciona **`client-diagnostic-app`**
- Click **"Deploy site"**

Netlify automáticamente:
- Detecta el `netlify.toml`
- Configura las funciones serverless
- Asigna URL: `tu-sitio-XXXXX.netlify.app`

✅ Tu sitio está deployado (pero sin variables de entorno aún).

---

## 📋 Checklist de este paso

- [ ] Repositorio creado en GitHub
- [ ] Código pusheado a `main`
- [ ] Netlify conectado al repo
- [ ] URL asignada (ej: `mysite-12345.netlify.app`)

---

## ⚠️ SIGUIENTES: Cargar variables de entorno

Cuando confirmes que llegaste hasta acá, te digo cómo llenar:
- MERCADOPAGO_ACCESS_TOKEN
- RESEND_API_KEY
- FROM_EMAIL
- Etc.

**RESPONDE CUANDO TENGAS:** URL de Netlify confirmada.
