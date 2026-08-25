# 🔒 GIT INDEX.LOCK - PROBLEMA Y SOLUCIÓN

## 🚨 PROBLEMA

**Error típico:**
```
fatal: Unable to create 'C:/Users/Admin/Documents/Claude/Projects/Acp y Asociados/.git/index.lock': File exists.
Another git process seems to be running in this repository, or the lock file may be stale
```

**Síntomas:**
- No puedes hacer `git add`
- No puedes hacer `git commit`
- No puedes hacer `git push`
- `git status` funciona normal
- El archivo `.git/index.lock` existe

---

## 🔍 CAUSAS (Por orden de probabilidad)

### 1. **Proceso Git o PowerShell Corriendo en Background** (MÁS COMÚN)
- Una ventana de PowerShell anterior se quedó ejecutando comandos de git
- Un script PowerShell sigue corriendo en background
- Un hook de git está bloqueado

**Síntoma característico:** El lock aparece, desaparece, vuelve a aparecer ("se crea y borra a la vez")

### 2. **Antivirus / Windows Defender Bloqueando Archivo**
- El antivirus está escaneando la carpeta `.git`
- Windows Defender está sincronizando
- OneDrive/Dropbox está sincronizando

**Síntoma:** El archivo existe pero no puedes borrarlo (Permission Denied)

### 3. **Editor o IDE Abierto**
- VSCode está sincronizando con git
- GitHub Desktop está corriendo
- Otra herramienta está monitoreando los cambios

---

## ✅ SOLUCIONES (Prueba EN ORDEN)

### **SOLUCIÓN 1: Matar Procesos Background (RECOMENDADO)**

Ejecuta en PowerShell **como administrador**:

```powershell
# Mata todos los PowerShell corriendo
Get-Process powershell -ErrorAction SilentlyContinue | Stop-Process -Force

# Mata todos los Node.js
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

# Espera 2 segundos
Start-Sleep -Seconds 2

# Abre una NUEVA ventana de PowerShell

# Navega a la carpeta
cd "C:\Users\Admin\Documents\Claude\Projects\Acp y Asociados"

# Ahora intenta el comando que falló
git add gratis.html
```

**Éxito:** El comando funciona sin error

---

### **SOLUCIÓN 2: Eliminar el Archivo de Lock**

Si la solución 1 no funciona:

```powershell
# Verifica si el archivo existe
Test-Path "C:\Users\Admin\Documents\Claude\Projects\Acp y Asociados\.git\index.lock"

# Si retorna True, elimínalo:
Remove-Item "C:\Users\Admin\Documents\Claude\Projects\Acp y Asociados\.git\index.lock" -Force -ErrorAction Stop

# Espera 1 segundo
Start-Sleep -Seconds 1

# Intenta tu comando nuevamente
git commit -m "tu mensaje"
```

**Éxito:** El comando funciona sin error

---

### **SOLUCIÓN 3: Reset Git**

Si las anteriores no funcionan:

```powershell
cd "C:\Users\Admin\Documents\Claude\Projects\Acp y Asociados"

# Reset suave (mantiene cambios)
git reset --soft HEAD

# O reset hard (descarta cambios - ¡CUIDADO!)
git reset --hard HEAD

# Intenta nuevamente
git add gratis.html
git commit -m "tu mensaje"
```

**⚠️ ADVERTENCIA:** `--hard` elimina cambios no commiteados. Usa solo si no importan.

---

### **SOLUCIÓN 4: Cerrar Herramientas**

Si nada funciona, cierra:
- ❌ VSCode
- ❌ GitHub Desktop
- ❌ Cualquier terminal PowerShell abierta
- ❌ Antivirus temporalmente (si es posible)

Luego intenta nuevamente:

```powershell
cd "C:\Users\Admin\Documents\Claude\Projects\Acp y Asociados"
git add gratis.html
git commit -m "tu mensaje"
```

---

## 🛡️ PREVENCIÓN

### 1. **NO Commitear desde Bash/Sandbox**
- ❌ NO: Bash desde Claude
- ✅ SÍ: PowerShell desde tu computadora

**Razón:** El sandbox crea/borra lock files que afectan el repo local.

### 2. **Cierra VSCode/Editores Antes de Git**
```powershell
# Antes de hacer git operations importantes:
# 1. Cierra VSCode
# 2. Espera 2 segundos
# 3. Abre nueva ventana PowerShell
# 4. Haz tu git commit/push
```

### 3. **Evita Scripts Automáticos**
- No ejecutes scripts PowerShell que toquen git en background
- Si necesitas automatización, crea un schedule específico (no continuo)

### 4. **No Tengas Múltiples PowerShell Abiertos en la Misma Carpeta**
- Una ventana de PowerShell por carpeta de proyecto
- Si abres otra, cierra la anterior

---

## 🔄 REFERENCIA RÁPIDA (COPIAR-PEGAR)

**Cuando veas el error de index.lock:**

```powershell
# Paso 1: Mata procesos
Get-Process powershell -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# Paso 2: Abre NUEVA ventana PowerShell

# Paso 3: Navega
cd "C:\Users\Admin\Documents\Claude\Projects\Acp y Asociados"

# Paso 4: Elimina el lock
Remove-Item ".git\index.lock" -Force -ErrorAction SilentlyContinue

# Paso 5: Intenta nuevamente
git add gratis.html
git commit -m "tu mensaje"
git push origin main
```

---

## 📊 CASO ESPECÍFICO - 11 JUNIO 2026

**Lo que pasó:**
1. Hice cambios en gratis.html desde sandbox (Claude)
2. El sandbox creó/borró el index.lock repetidamente
3. Bash no pudo hacer git commit (permisos)
4. PowerShell del usuario tampoco podía (lock persistía)

**Solución aplicada:**
1. Matar todos los procesos PowerShell
2. Remover `.git/index.lock` forzadamente
3. Abrir NUEVA ventana PowerShell
4. Ejecutar git commit/push
5. ✅ Funcionó

**Lección:** El sandbox y PowerShell no pueden compartir git operations simultáneamente.

---

## 📝 NOTAS FINALES

- El archivo `.git/index.lock` es **normal** durante una operación git
- Se crea automáticamente cuando starts git operation
- Se borra automáticamente cuando termina
- Problema = Se queda creado después de que debería haber sido borrado

- Si ves este error **FRECUENTEMENTE**, probablemente hay:
  - Un script corriendo en background
  - Un problema con antivirus/sincronización
  - Una herramienta de IDE que toca git constantemente

---

**Próxima ocurrencia:** Usa la "REFERENCIA RÁPIDA" arriba y función perfectamente.

**Último actualizado:** 11 Junio 2026  
**Casos resueltos:** 1 (commit e18414a)
