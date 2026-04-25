# 🚀 WINDOWS - PUSH A GITHUB (PowerShell)

## ✅ PASO 1: DESCARGAR ZIP

1. **Descarga:** `acp-backend.zip` (desde tu carpeta de trabajo)
2. **Extraer:** Click derecho → "Extract All..."
3. **Carpeta resultante:** `acp-backend/`

---

## ✅ PASO 2: CREAR REPOSITORIO EN GITHUB

### A. Ir aquí:
```
https://github.com/new
```

### B. Llenar:
```
Repository name: acp-backend
Description: Backend para sistema diagnóstico ACP
Visibility: Public
```

### C. Crear

### D. Copiar URL que aparece:
```
https://github.com/TU_USUARIO/acp-backend.git
```

---

## ✅ PASO 3: PUSH DESDE WINDOWS

### A. Abrir PowerShell

En Windows:
- Presiona **Win + X**
- Selecciona "Terminal" (o PowerShell)

### B. Navegar a carpeta

```powershell
cd "C:\Ruta\Donde\Descargaste\acp-backend"
```

**Ejemplo:**
```powershell
cd "C:\Users\Patricio\Downloads\acp-backend"
```

### C. Verificar que git está instalado

```powershell
git --version
```

**Debería mostrar:** `git version 2.x.x`

Si NO lo muestra → Descarga Git aquí: https://git-scm.com/download/win

### D. Configurar git (primera vez)

```powershell
git config --global user.email "patriciosilvavalenzuela@gmail.com"
git config --global user.name "Patricio Silva"
```

### E. Inicializar repositorio

```powershell
git init
```

### F. Agregar archivos

```powershell
git add .
```

### G. Hacer commit

```powershell
git commit -m "Backend ACP - Operativo para Railway"
```

### H. Agregar origin (REEMPLAZA TU_USUARIO)

```powershell
git remote add origin https://github.com/TU_USUARIO/acp-backend.git
```

**Ejemplo:**
```powershell
git remote add origin https://github.com/patriciosilva/acp-backend.git
```

### I. Cambiar rama a main

```powershell
git branch -M main
```

### J. **PUSH A GITHUB** 🚀

```powershell
git push -u origin main
```

**Cuando pida credenciales:**
- Usuario: Tu usuario GitHub
- Password: Tu token personal (o contraseña si tienes acceso)

Si no tienes token, créalo aquí: https://github.com/settings/tokens

---

## ✅ VERIFICAR EN GITHUB

1. Abre: `https://github.com/TU_USUARIO/acp-backend`
2. Deberías ver **todos los archivos**:
   - server.js ✅
   - package.json ✅
   - README.md ✅

Si los ves → **¡ÉXITO!** ✅

---

## 🆘 ERRORES COMUNES EN WINDOWS

### Error: "git not found"
```
Descarga Git: https://git-scm.com/download/win
Instala y reinicia PowerShell
```

### Error: "fatal: not a git repository"
```
Verifica que estés en la carpeta correcta:
cd C:\Users\Patricio\Downloads\acp-backend
git init
```

### Error: "Authentication failed"
```
Necesitas token GitHub:
1. GitHub Settings → Developer settings → Tokens
2. Genera nuevo token
3. Cópialo
4. Cuando pida password, pega el token
```

### Error: "fatal: remote origin already exists"
```
Ya tiene origin agregado (de ZIP)
Ejecuta:
git remote set-url origin https://github.com/TU_USUARIO/acp-backend.git
```

---

## 📋 CHECKLIST

- [ ] ZIP descargado
- [ ] ZIP extraído a `acp-backend/`
- [ ] Repositorio creado en GitHub
- [ ] Git instalado en Windows (`git --version`)
- [ ] PowerShell abierto en carpeta correcta
- [ ] `git add .` ejecutado
- [ ] `git commit` hecho
- [ ] `git remote add origin` configurado
- [ ] `git push -u origin main` completado
- [ ] Archivos visibles en GitHub ✅

---

## ⏱️ TIEMPO TOTAL: 5 MINUTOS

Una vez que hagas push, el próximo paso es **Railway** (2-3 minutos).

---

## 🎯 SIGUIENTE PASO

Una vez que veas los archivos en GitHub:

1. Ir a **https://railway.app**
2. "Deploy from GitHub"
3. Seleccionar "acp-backend"
4. Agregar variables
5. ✅ Deploy automático

---

**¿Tienes Git instalado en Windows? ¿Necesitas ayuda con algo específico?**
