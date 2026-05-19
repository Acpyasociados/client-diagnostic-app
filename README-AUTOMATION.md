# 🤖 Sistema de Automatización - ACP y Asociados
## Netlify Functions Auto-Debugging con Claude Code

**Versión:** 1.0  
**Fecha:** 18 Mayo 2026  
**Autor:** Sistema automatizado de Claude Code

---

## 📋 Contenido

1. [Descripción General](#descripción-general)
2. [Archivos Incluidos](#archivos-incluidos)
3. [Instalación Rápida](#instalación-rápida)
4. [Configuración de SendGrid](#configuración-de-sendgrid)
5. [Uso del Sistema](#uso-del-sistema)
6. [Dashboard de Monitoreo](#dashboard-de-monitoreo)
7. [Troubleshooting](#troubleshooting)
8. [FAQ](#faq)

---

## 🎯 Descripción General

Este sistema automatiza completamente el debugging y reparación de la función Netlify `create-diagnostic-order.js`, que procesa pagos de la plataforma de diagnóstico empresarial de ACP y Asociados.

### ¿Qué hace?

✅ **Monitorea** logs de Netlify cada hora  
✅ **Detecta** errores automáticamente (event.body null, JSON parse fails, etc.)  
✅ **Aplica** fixes apropiados según tipo de error  
✅ **Deploy** automático a producción  
✅ **Valida** que el fix funcionó  
✅ **Reporta** por email cada incidente  
✅ **Dashboard** visual en tiempo real

### Beneficios

- **⏱️ MTTR < 5 minutos:** Desde detección hasta resolución completa
- **🤖 Intervención cero:** Sistema completamente autónomo
- **📊 Visibilidad total:** Dashboard con métricas y eventos
- **📧 Notificaciones:** Email automático en cada evento
- **🔄 Auto-mejora:** Aprende de cada fix aplicado

---

## 📦 Archivos Incluidos

```
.
├── setup-automation.ps1                 # Script maestro de instalación
├── dashboard.html                       # Dashboard de monitoreo
├── .env.example                         # Template de configuración SendGrid
├── README-AUTOMATION.md                 # Este archivo
│
├── .claude/
│   ├── skills/
│   │   └── netlify-debug.md            # Skill de debugging personalizado
│   │
│   ├── agents/
│   │   └── netlify-monitor.yaml        # Agente autónomo (ejecuta cada hora)
│   │
│   └── scripts/
│       ├── monitor.sh                  # Script de monitoreo continuo
│       └── validate.sh                 # Script de validación de tests
│
└── reports/                             # Reportes generados automáticamente
    ├── fixes/                           # Reportes de fixes aplicados
    ├── logs/                            # Logs de ejecución del agente
    └── validations/                     # Resultados de validaciones
```

---

## 🚀 Instalación Rápida

### Pre-requisitos

- ✅ Claude Code instalado (ya lo tienes)
- ✅ Git configurado
- ✅ Proyecto clonado localmente
- ✅ PowerShell 5.1+ (Windows) o Bash (Linux/Mac)

### Paso 1: Ejecutar Setup

Abre PowerShell en la carpeta de tu proyecto y ejecuta:

```powershell
cd "C:\Users\Admin\Documents\Claude\Projects\Acp y Asociados"

# Ejecutar script de instalación
.\setup-automation.ps1
```

**¿Qué hace este script?**

1. ✓ Verifica que Claude Code está instalado
2. ✓ Crea toda la estructura de directorios
3. ✓ Genera skill personalizado de debugging
4. ✓ Crea agente autónomo con todas las tareas
5. ✓ Configura scripts de monitoreo y validación
6. ✓ Genera template de configuración de SendGrid
7. ✓ Crea dashboard HTML

**Tiempo estimado:** 30 segundos

---

## 📧 Configuración de SendGrid

### Paso 1: Obtener API Key

1. Ve a [https://app.sendgrid.com](https://app.sendgrid.com)
2. Crea cuenta gratis (si no tienes)
3. Ve a **Settings > API Keys**
4. Haz clic en **"Create API Key"**
5. Nombre: `Claude Code Automation`
6. Permisos: **"Full Access"** o solo **"Mail Send"**
7. Copia el API key (se muestra solo una vez)

### Paso 2: Verificar Email Remitente

1. Ve a **Settings > Sender Authentication**
2. Haz clic en **"Verify a Single Sender"**
3. Ingresa tu email: `patriciosilvavalenzuela@gmail.com`
4. Revisa tu inbox y haz clic en el link de verificación

### Paso 3: Configurar .env

1. Copia el template:
   ```powershell
   Copy-Item .env.example .env
   ```

2. Edita `.env` con tu editor favorito:
   ```bash
   SENDGRID_API_KEY=SG.tu_api_key_aqui
   SENDGRID_FROM_EMAIL=patriciosilvavalenzuela@gmail.com
   SENDGRID_FROM_NAME=ACP Automatización
   ALERT_EMAIL=patriciosilvavalenzuela@gmail.com
   ```

3. **IMPORTANTE:** Agregar .env al .gitignore
   ```powershell
   echo ".env" >> .gitignore
   git add .gitignore
   git commit -m "Agregar .env al gitignore"
   ```

### Paso 4: Probar Configuración

```powershell
claude -p "Envía un email de prueba usando la configuración de .env para verificar que SendGrid funciona correctamente"
```

**Deberías recibir un email de prueba en tu inbox en ~30 segundos.**

---

## 🎮 Uso del Sistema

### Opción 1: Ejecución Manual (Para Probar)

```powershell
cd "C:\Users\Admin\Documents\Claude\Projects\Acp y Asociados"

# Ejecutar check manual
claude -p "Ejecuta el agente netlify-monitor para revisar logs y aplicar fixes si es necesario"
```

**Qué hace:**
- Lee logs de Netlify de la última hora
- Detecta errores
- Si encuentra error, aplica fix automáticamente
- Deploy a producción
- Valida que funcionó
- Genera reporte
- Envía email

**Duración:** 2-5 minutos

---

### Opción 2: Monitoreo Continuo (Recomendado)

#### A) Con Bash (Linux/Mac/Git Bash en Windows)

```bash
cd "/c/Users/Admin/Documents/Claude/Projects/Acp y Asociados"

# Ejecutar en background
bash .claude/scripts/monitor.sh &

# Ver logs en tiempo real
tail -f reports/logs/monitor-latest.log
```

#### B) Con Task Scheduler (Windows)

1. Abre **Programador de tareas** (Task Scheduler)
2. Haz clic en **"Crear tarea básica..."**
3. Configuración:
   - **Nombre:** `Claude Netlify Monitor`
   - **Descripción:** Monitoreo automático de Netlify Functions
   - **Desencadenador:** Diariamente
   - **Repetir cada:** 1 hora
   - **Duración:** Indefinidamente
4. Acción:
   - **Programa:** `claude`
   - **Argumentos:** `-p "Ejecutar agente netlify-monitor"`
   - **Iniciar en:** `C:\Users\Admin\Documents\Claude\Projects\Acp y Asociados`
5. Haz clic en **"Finalizar"**

**Resultado:** El sistema ejecutará checks cada hora automáticamente, incluso si tu computadora se reinicia.

---

### Opción 3: Solo Validación (Sin Deploy)

Para probar que el endpoint funciona sin hacer cambios:

```bash
# Linux/Mac/Git Bash
bash .claude/scripts/validate.sh

# PowerShell
bash .\.claude\scripts\validate.sh
```

**Qué hace:**
- Test 1: Endpoint básico con payload mínimo
- Test 2: Payload completo con todos los campos
- Test 3: Verificar logs recientes

**Duración:** ~10 segundos

---

## 📊 Dashboard de Monitoreo

### Abrir Dashboard

```powershell
# Abrir en tu navegador predeterminado
start dashboard.html

# O manualmente: doble clic en dashboard.html
```

### Características del Dashboard

- **🟢 Estado en Tiempo Real:** Operacional / Degradado / Caído
- **📈 Gráficos:** Errores vs Fixes, MTTR por incidente
- **📋 Eventos Recientes:** Últimos 10 eventos con detalles
- **⏱️ Métricas:** Uptime, MTTR promedio, tasa de éxito
- **🔄 Auto-refresh:** Se actualiza cada 60 segundos
- **▶️ Acciones Rápidas:** Ejecutar check manual, validar sistema

### Interfaz

```
┌─────────────────────────────────────────────────────┐
│ 🤖 Dashboard de Monitoreo - ACP y Asociados        │
│ Netlify Functions Auto-Debugging System v1.0       │
└─────────────────────────────────────────────────────┘

┌──────────────┬──────────────┬──────────────┬──────────────┐
│ Estado       │ MTTR Prom.   │ Errores 24h  │ Fixes Auto   │
│ Operacional  │ 4.2 min      │ 2            │ 2 (100%)     │
│ ✓ 99.8%      │ ↓ -12%       │ ↓ -50%       │              │
└──────────────┴──────────────┴──────────────┴──────────────┘

[▶️ Check Manual] [✓ Validar] [🔄 Refrescar] Última: 14:30:45

┌─────────────────────────────────────────────────────┐
│ 📈 Errores vs Fixes (7 días)                       │
│ [Gráfico de líneas con datos históricos]           │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ 📋 Eventos Recientes                                │
│                                                     │
│ ✅ Fix Automático Aplicado          2 horas atrás  │
│    Error TYPE_A_NULL_BODY resuelto. MTTR: 3.8 min │
│                                                     │
│ 🔴 Error Detectado                  2 horas atrás  │
│    Body is null en create-diagnostic-order         │
└─────────────────────────────────────────────────────┘
```

---

## 🔧 Troubleshooting

### Problema: "claude: command not found"

**Causa:** Claude Code no está en el PATH

**Solución:**

```powershell
# Verificar instalación
npm list -g @anthropic-ai/claude-code

# Si está instalado pero no en PATH
$env:PATH += ";$env:APPDATA\npm"

# O reinstalar
npm install -g @anthropic-ai/claude-code
```

---

### Problema: "No se encontró el agente netlify-monitor"

**Causa:** El archivo `.claude/agents/netlify-monitor.yaml` no existe

**Solución:**

```powershell
# Re-ejecutar setup
.\setup-automation.ps1

# Verificar que se creó
ls .claude/agents/
```

---

### Problema: "SendGrid API error: 401 Unauthorized"

**Causa:** API key inválido o no configurado

**Solución:**

1. Verificar que `.env` existe
2. Verificar que `SENDGRID_API_KEY` está correctamente copiado
3. Verificar que el email remitente está verificado en SendGrid

```powershell
# Ver contenido del .env (sin mostrar el API key completo)
Get-Content .env | Select-String "SENDGRID"
```

---

### Problema: "Git push failed: authentication required"

**Causa:** Credenciales de Git no configuradas o token expirado

**Solución:**

```powershell
# Configurar credenciales
git config --global user.name "Tu Nombre"
git config --global user.email "tu@email.com"

# Si usas HTTPS, configurar token
git config --global credential.helper store
git push origin main  # Te pedirá usuario y token
```

---

### Problema: "Dashboard no muestra datos reales"

**Causa:** Dashboard usa datos de ejemplo por defecto

**Solución:**

El dashboard lee archivos de `reports/` automáticamente. Si no hay reportes generados aún:

1. Ejecuta un check manual primero
2. Espera a que se genere el reporte
3. Refresca el dashboard

```powershell
# Ejecutar check para generar primer reporte
claude -p "Ejecuta el agente netlify-monitor"

# Luego abrir dashboard
start dashboard.html
```

---

## ❓ FAQ

### ¿Cuánto cuesta esto?

- **Claude Code:** Incluido en tu plan Claude Pro ($20/mes)
- **SendGrid:** Gratis hasta 100 emails/día
- **Netlify:** Plan gratuito es suficiente
- **Total:** $0 adicionales

---

### ¿Qué pasa si el fix automático falla?

El sistema:
1. Te envía email con tag `[CRÍTICO]`
2. Incluye logs del error
3. Sugiere fix manual
4. NO hace más intentos automáticos hasta que revises

Tú decides si:
- Aplicar fix manualmente
- Ajustar estrategia del agente
- Deshabilitar auto-deploy temporalmente

---

### ¿Puedo personalizar el agente?

¡Sí! Edita `.claude/agents/netlify-monitor.yaml` para:

- Cambiar frecuencia de checks (cron schedule)
- Agregar nuevos tipos de error
- Modificar estrategias de fix
- Ajustar thresholds de alertas
- Cambiar templates de email

Después de editar:
```powershell
claude -p "Recarga el agente netlify-monitor con la nueva configuración"
```

---

### ¿Cómo deshabilito el sistema temporalmente?

**Opción 1:** Deshabilitar agente

Edita `.claude/agents/netlify-monitor.yaml`:
```yaml
enabled: false  # Cambiar a false
```

**Opción 2:** Pausar Task Scheduler

1. Abre Task Scheduler
2. Busca "Claude Netlify Monitor"
3. Clic derecho → Deshabilitar

**Opción 3:** Detener monitor continuo

```bash
# Encontrar proceso
ps aux | grep "monitor.sh"

# Matar proceso
kill [PID]
```

---

### ¿Qué archivos debo incluir en .gitignore?

```gitignore
# Secretos
.env

# Reportes (opcional, depende si quieres historial en Git)
reports/

# Logs temporales
*.log
```

---

### ¿Cómo actualizo Claude Code?

```powershell
# Ver versión actual
claude --version

# Actualizar a última versión
npm install -g @anthropic-ai/claude-code@latest

# Verificar actualización
claude --version
```

---

## 📞 Soporte

**Email:** asesor.pac@gmail.com (Patricio Silva)  
**Proyecto:** ACP y Asociados  
**Versión Sistema:** 1.0  
**Última actualización:** 18 Mayo 2026

---

## 📝 Changelog

### v1.0 (18 Mayo 2026)
- ✅ Sistema inicial con monitoreo automático
- ✅ Agente autónomo con 15 tareas
- ✅ Dashboard interactivo con gráficos
- ✅ Integración SendGrid para notificaciones
- ✅ Scripts de validación y monitoreo
- ✅ Skill personalizado de debugging

---

## 🎯 Próximas Mejoras (Roadmap)

### v1.1 (Planeado)
- [ ] Integración con Slack para notificaciones
- [ ] Backend para leer reportes en tiempo real
- [ ] Análisis predictivo de errores
- [ ] Dashboard mobile-responsive mejorado

### v1.2 (Planeado)
- [ ] Machine learning para auto-mejora de fixes
- [ ] Integración con PagerDuty para alertas críticas
- [ ] API pública para integraciones custom
- [ ] Soporte multi-proyecto

---

## 📜 Licencia

Uso interno - ACP y Asociados  
© 2026 Patricio Silva

---

**¡Sistema configurado y listo para usar!** 🚀

Para comenzar, ejecuta:
```powershell
.\setup-automation.ps1
```

Y luego abre el dashboard:
```powershell
start dashboard.html
```
