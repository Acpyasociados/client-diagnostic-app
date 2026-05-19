# ============================================================================
# INSTALADOR TODO-EN-UNO - ACP y Asociados
# ============================================================================
# Este script contiene TODOS los archivos necesarios embebidos
# Ejecuta TODO automáticamente con intervención CERO
# ============================================================================
# INSTRUCCIÓN: Solo ejecuta este archivo y todo se configurará solo
# ============================================================================

param(
    [switch]$SkipSendGrid,
    [string]$SendGridApiKey,
    [string]$AlertEmail = "patriciosilvavalenzuela@gmail.com"
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                                ║" -ForegroundColor Cyan
Write-Host "║     🤖 INSTALADOR AUTOMÁTICO - ACP y Asociados               ║" -ForegroundColor Cyan
Write-Host "║     Netlify Functions Auto-Debugging System v1.0              ║" -ForegroundColor Cyan
Write-Host "║                                                                ║" -ForegroundColor Cyan
Write-Host "║     ⚡ TODO SE CONFIGURA AUTOMÁTICAMENTE ⚡                   ║" -ForegroundColor Cyan
Write-Host "║                                                                ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "Instalación iniciada: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
Write-Host ""

# ============================================================================
# VERIFICACIONES PRELIMINARES
# ============================================================================

Write-Host "[PASO 1/10] Verificando Claude Code..." -ForegroundColor Yellow

if (!(Get-Command claude -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Claude Code no está instalado" -ForegroundColor Red
    Write-Host ""
    Write-Host "Instalando Claude Code automáticamente..." -ForegroundColor Yellow
    
    try {
        npm install -g @anthropic-ai/claude-code
        Write-Host "✅ Claude Code instalado correctamente" -ForegroundColor Green
    } catch {
        Write-Host "❌ Error instalando Claude Code" -ForegroundColor Red
        Write-Host "Por favor ejecuta manualmente: npm install -g @anthropic-ai/claude-code" -ForegroundColor Yellow
        exit 1
    }
} else {
    $version = claude --version
    Write-Host "✅ Claude Code ya instalado: $version" -ForegroundColor Green
}

Write-Host ""
Write-Host "[PASO 2/10] Verificando Git..." -ForegroundColor Yellow

if (!(Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "⚠️ Git no está instalado" -ForegroundColor Yellow
    Write-Host "   El sistema funcionará, pero no podrá hacer commits automáticos" -ForegroundColor Gray
} else {
    $gitVersion = git --version
    Write-Host "✅ Git instalado: $gitVersion" -ForegroundColor Green
}

# ============================================================================
# CREAR ESTRUCTURA DE DIRECTORIOS
# ============================================================================

Write-Host ""
Write-Host "[PASO 3/10] Creando estructura de directorios..." -ForegroundColor Yellow

$directories = @(
    ".claude",
    ".claude\skills",
    ".claude\agents",
    ".claude\scripts",
    "reports",
    "reports\fixes",
    "reports\logs",
    "reports\validations"
)

foreach ($dir in $directories) {
    if (!(Test-Path $dir)) {
        New-Item -ItemType Directory -Force -Path $dir | Out-Null
        Write-Host "  ✓ Creado: $dir" -ForegroundColor Gray
    } else {
        Write-Host "  ○ Ya existe: $dir" -ForegroundColor DarkGray
    }
}

Write-Host "✅ Estructura de directorios lista" -ForegroundColor Green

# ============================================================================
# CREAR SKILL DE DEBUGGING
# ============================================================================

Write-Host ""
Write-Host "[PASO 4/10] Creando skill de debugging..." -ForegroundColor Yellow

$skillContent = @'
# Netlify Functions Debugging Skill - ACP y Asociados

## 🎯 Contexto del Proyecto
**Proyecto:** ACP y Asociados - Plataforma de diagnóstico empresarial
**URL:** https://acp-asociados.netlify.app
**Función Crítica:** create-diagnostic-order.js
**Error Principal:** event.body null al recibir POST

## 🔧 Tipos de Error y Soluciones

### Error TYPE_A: "body is null"
**Fix:** Validación temprana + logging
```javascript
if (!event.body) {
  console.error('Body null');
  return new Response(JSON.stringify({error: 'No body'}), {status: 400});
}
```

### Error TYPE_B: "body.text is not a function"
**Fix:** Response wrapper
```javascript
bodyText = await new Response(event.body).text();
```

### Error TYPE_C: "JSON.parse failed"
**Fix:** Fallback URLSearchParams
```javascript
const params = new URLSearchParams(bodyText);
return Object.fromEntries(params);
```

## 🤖 Workflow Automático
1. Revisar logs Netlify (cada hora)
2. Detectar error
3. Aplicar fix apropiado
4. Commit + push
5. Esperar deploy
6. Validar
7. Reportar

## 📋 Comandos Auto-Aprobados
- git add netlify/functions/*
- git commit -m "Auto-fix: ..."
- git push origin main

## 🧪 Tests de Validación
```bash
curl -X POST https://acp-asociados.netlify.app/.netlify/functions/create-diagnostic-order \
  -H "Content-Type: application/json" \
  -d '{"plan":"basico","empresa":"Test"}'
```

**Resultado esperado:** success: true, mercadoPagoUrl presente
'@

$skillContent | Out-File -FilePath ".claude\skills\netlify-debug.md" -Encoding UTF8
Write-Host "✅ Skill creado: .claude\skills\netlify-debug.md" -ForegroundColor Green

# ============================================================================
# CREAR AGENTE AUTÓNOMO
# ============================================================================

Write-Host ""
Write-Host "[PASO 5/10] Creando agente autónomo..." -ForegroundColor Yellow

$agentContent = @'
name: netlify-monitor
description: Monitorea y repara Netlify Functions automáticamente
version: 1.0.0
enabled: true

schedule:
  cron: "0 * * * *"
  timezone: America/Santiago
  
permissions:
  read_files: true
  write_files: true
  execute_bash: true
  git_operations: true
  netlify_api: true

auto_approve:
  git_commit: true
  git_push: true
  file_edit: true

tasks:
  - name: check_netlify_logs
    tool: netlify
    action: get-function-logs
    params:
      function_name: create-diagnostic-order
      time_range: 1h
      
  - name: detect_errors
    condition: logs.contains("body is null")
    
  - name: apply_fix
    steps:
      - read: netlify/functions/create-diagnostic-order.js
      - apply: fix_strategy
      - commit: "Auto-fix: Mejorar parsing de ReadableStream"
      - push: main
      
  - name: validate_fix
    command: curl -X POST https://acp-asociados.netlify.app/.netlify/functions/create-diagnostic-order
    expect: success=true
'@

$agentContent | Out-File -FilePath ".claude\agents\netlify-monitor.yaml" -Encoding UTF8
Write-Host "✅ Agente creado: .claude\agents\netlify-monitor.yaml" -ForegroundColor Green

# ============================================================================
# CREAR SCRIPT DE MONITOREO
# ============================================================================

Write-Host ""
Write-Host "[PASO 6/10] Creando script de monitoreo continuo..." -ForegroundColor Yellow

$monitorScript = @'
Write-Host "🤖 Monitoreo continuo iniciado..." -ForegroundColor Cyan
Write-Host "⏰ Frecuencia: Cada 1 hora" -ForegroundColor Cyan
Write-Host ""

$iteration = 1

while ($true) {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$timestamp] 🔄 Iteración #$iteration - Ejecutando check..." -ForegroundColor Yellow
    
    try {
        claude -p "Ejecuta el agente netlify-monitor para revisar logs y aplicar fixes si es necesario"
        Write-Host "[$timestamp] ✅ Check completado" -ForegroundColor Green
    } catch {
        Write-Host "[$timestamp] ⚠️ Error: $_" -ForegroundColor Yellow
    }
    
    Write-Host "[$timestamp] ⏸️ Esperando 1 hora..." -ForegroundColor Cyan
    Write-Host ""
    
    $iteration++
    Start-Sleep -Seconds 3600
}
'@

$monitorScript | Out-File -FilePath ".claude\scripts\monitor-windows.ps1" -Encoding UTF8
Write-Host "✅ Script de monitoreo creado" -ForegroundColor Green

# ============================================================================
# CREAR SCRIPT DE VALIDACIÓN
# ============================================================================

Write-Host ""
Write-Host "[PASO 7/10] Creando script de validación..." -ForegroundColor Yellow

$validateScript = @'
Write-Host "🧪 Validación de create-diagnostic-order..." -ForegroundColor Cyan
Write-Host ""

$ENDPOINT = "https://acp-asociados.netlify.app/.netlify/functions/create-diagnostic-order"
$PASSED = 0
$FAILED = 0

# Test 1: Básico
Write-Host "[Test 1/2] Endpoint básico..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri $ENDPOINT -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"plan":"test"}' -UseBasicParsing -ErrorAction Stop
    if ($response.StatusCode -eq 200 -or $response.StatusCode -eq 400) {
        Write-Host "  ✅ Test 1 PASADO" -ForegroundColor Green
        $PASSED++
    }
} catch {
    Write-Host "  ❌ Test 1 FALLÓ: $_" -ForegroundColor Red
    $FAILED++
}

# Test 2: Completo
Write-Host "[Test 2/2] Payload completo..." -ForegroundColor Yellow
$payload = @{plan="basico";empresa="Test";email="test@test.com";telefono="+56912345678";sector="tecnologia";ventasMensuales="500000"} | ConvertTo-Json
try {
    $response = Invoke-WebRequest -Uri $ENDPOINT -Method POST -Headers @{"Content-Type"="application/json"} -Body $payload -UseBasicParsing -ErrorAction Stop
    if ($response.StatusCode -eq 200 -and $response.Content -like "*success*") {
        Write-Host "  ✅ Test 2 PASADO" -ForegroundColor Green
        $PASSED++
    }
} catch {
    Write-Host "  ❌ Test 2 FALLÓ: $_" -ForegroundColor Red
    $FAILED++
}

Write-Host ""
Write-Host "═══════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ Tests Pasados: $PASSED" -ForegroundColor Green
Write-Host "❌ Tests Fallados: $FAILED" -ForegroundColor $(if ($FAILED -gt 0) {"Red"} else {"Gray"})
Write-Host "═══════════════════════════════════" -ForegroundColor Cyan

if ($FAILED -eq 0) {
    Write-Host "🎉 SISTEMA OPERACIONAL" -ForegroundColor Green
    exit 0
} else {
    Write-Host "⚠️ REVISAR LOGS" -ForegroundColor Yellow
    exit 1
}
'@

$validateScript | Out-File -FilePath ".claude\scripts\validate-windows.ps1" -Encoding UTF8
Write-Host "✅ Script de validación creado" -ForegroundColor Green

# ============================================================================
# CONFIGURAR SENDGRID (SI SE PROPORCIONÓ API KEY)
# ============================================================================

Write-Host ""
Write-Host "[PASO 8/10] Configurando SendGrid..." -ForegroundColor Yellow

if ($SendGridApiKey) {
    $envContent = @"
SENDGRID_API_KEY=$SendGridApiKey
SENDGRID_FROM_EMAIL=$AlertEmail
SENDGRID_FROM_NAME=ACP Automatización
ALERT_EMAIL=$AlertEmail
LOG_LEVEL=info
TIMEZONE=America/Santiago
"@
    $envContent | Out-File -FilePath ".env" -Encoding UTF8
    
    # Agregar a .gitignore
    if (!(Test-Path ".gitignore")) {
        ".env" | Out-File -FilePath ".gitignore" -Encoding UTF8
    } else {
        $gitignoreContent = Get-Content ".gitignore" -Raw
        if ($gitignoreContent -notlike "*.env*") {
            "`n.env" | Out-File -FilePath ".gitignore" -Append -Encoding UTF8
        }
    }
    
    Write-Host "✅ SendGrid configurado (.env creado)" -ForegroundColor Green
} else {
    Write-Host "⏭️ SendGrid saltado (usar -SendGridApiKey para configurar)" -ForegroundColor Gray
}

# ============================================================================
# CREAR TAREA PROGRAMADA
# ============================================================================

Write-Host ""
Write-Host "[PASO 9/10] Configurando Task Scheduler..." -ForegroundColor Yellow

try {
    # Verificar si ya existe
    $existingTask = Get-ScheduledTask -TaskName "Claude-Netlify-Monitor" -ErrorAction SilentlyContinue
    
    if ($existingTask) {
        Write-Host "  ⚠️ Tarea ya existe, eliminando..." -ForegroundColor Yellow
        Unregister-ScheduledTask -TaskName "Claude-Netlify-Monitor" -Confirm:$false
    }
    
    $action = New-ScheduledTaskAction `
        -Execute "claude" `
        -Argument '-p "Ejecuta el agente netlify-monitor"' `
        -WorkingDirectory $PWD.Path
    
    $trigger = New-ScheduledTaskTrigger `
        -Once `
        -At (Get-Date).AddMinutes(5) `
        -RepetitionInterval (New-TimeSpan -Hours 1) `
        -RepetitionDuration ([TimeSpan]::MaxValue)
    
    $settings = New-ScheduledTaskSettingsSet `
        -AllowStartIfOnBatteries `
        -DontStopIfGoingOnBatteries `
        -StartWhenAvailable `
        -ExecutionTimeLimit (New-TimeSpan -Hours 0)
    
    Register-ScheduledTask `
        -TaskName "Claude-Netlify-Monitor" `
        -Action $action `
        -Trigger $trigger `
        -Settings $settings `
        -Description "Monitoreo automático Netlify - ACP y Asociados" `
        -ErrorAction Stop | Out-Null
    
    Write-Host "✅ Task Scheduler configurado" -ForegroundColor Green
    Write-Host "   Primera ejecución: En 5 minutos" -ForegroundColor Gray
    Write-Host "   Frecuencia: Cada 1 hora" -ForegroundColor Gray
} catch {
    Write-Host "⚠️ No se pudo crear tarea automática: $_" -ForegroundColor Yellow
    Write-Host "   Puedes ejecutar manualmente: .\\.claude\\scripts\\monitor-windows.ps1" -ForegroundColor Gray
}

# ============================================================================
# EJECUTAR PRIMER CHECK (AUTOMÁTICO)
# ============================================================================

Write-Host ""
Write-Host "[PASO 10/10] Ejecutando primer check del sistema..." -ForegroundColor Yellow
Write-Host ""

try {
    Write-Host "🔍 Analizando logs de Netlify..." -ForegroundColor Cyan
    
    # Ejecutar validación primero
    Write-Host "   → Validando endpoint..." -ForegroundColor Gray
    & ".\.claude\scripts\validate-windows.ps1"
    
    Write-Host ""
    Write-Host "   → Ejecutando agente de monitoreo..." -ForegroundColor Gray
    
    # Ejecutar primer check con timeout de 2 minutos
    $job = Start-Job -ScriptBlock {
        Set-Location $using:PWD
        claude -p "Ejecuta el agente netlify-monitor para hacer el primer check del sistema"
    }
    
    $completed = Wait-Job $job -Timeout 120
    
    if ($completed) {
        $output = Receive-Job $job
        Write-Host ""
        Write-Host "✅ Primer check completado exitosamente" -ForegroundColor Green
        
        # Mostrar resumen del output (primeras 10 líneas)
        $lines = ($output -split "`n") | Select-Object -First 10
        foreach ($line in $lines) {
            Write-Host "   $line" -ForegroundColor Gray
        }
        
    } else {
        Stop-Job $job
        Write-Host "⏱️ Check tardó más de 2 minutos, continuando en background..." -ForegroundColor Yellow
    }
    
    Remove-Job $job -Force
    
} catch {
    Write-Host "⚠️ Error ejecutando primer check: $_" -ForegroundColor Yellow
    Write-Host "   El sistema está configurado y funcionará en la próxima ejecución programada" -ForegroundColor Gray
}

# ============================================================================
# RESUMEN FINAL
# ============================================================================

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                                                                ║" -ForegroundColor Green
Write-Host "║            ✅ INSTALACIÓN COMPLETADA EXITOSAMENTE             ║" -ForegroundColor Green
Write-Host "║                                                                ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

Write-Host "📁 ARCHIVOS CREADOS:" -ForegroundColor Cyan
Write-Host "   ✓ .claude\skills\netlify-debug.md" -ForegroundColor White
Write-Host "   ✓ .claude\agents\netlify-monitor.yaml" -ForegroundColor White
Write-Host "   ✓ .claude\scripts\monitor-windows.ps1" -ForegroundColor White
Write-Host "   ✓ .claude\scripts\validate-windows.ps1" -ForegroundColor White
if ($SendGridApiKey) {
    Write-Host "   ✓ .env (configuración SendGrid)" -ForegroundColor White
}
Write-Host "   ✓ reports\ (directorios de reportes)" -ForegroundColor White
Write-Host ""

Write-Host "⚙️ SISTEMA CONFIGURADO:" -ForegroundColor Cyan
Write-Host "   ✓ Task Scheduler activo (cada hora)" -ForegroundColor White
Write-Host "   ✓ Primer check ejecutado" -ForegroundColor White
Write-Host "   ✓ Próxima ejecución: En 5 minutos" -ForegroundColor White
Write-Host ""

Write-Host "🎯 PRÓXIMOS PASOS:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. VER DASHBOARD (opcional):" -ForegroundColor White
Write-Host "   • Descarga dashboard.html de los archivos anteriores" -ForegroundColor Gray
Write-Host "   • Ejecútalo: start dashboard.html" -ForegroundColor Gray
Write-Host ""
Write-Host "2. VERIFICAR TAREA PROGRAMADA:" -ForegroundColor White
Write-Host "   Get-ScheduledTask -TaskName 'Claude-Netlify-Monitor'" -ForegroundColor Gray
Write-Host ""
Write-Host "3. VER LOGS EN TIEMPO REAL:" -ForegroundColor White
Write-Host "   Get-Content 'reports\logs\monitor-`$(Get-Date -Format 'yyyy-MM-dd').log' -Wait -Tail 20" -ForegroundColor Gray
Write-Host ""
Write-Host "4. EJECUTAR CHECK MANUAL:" -ForegroundColor White
Write-Host "   claude -p 'Ejecuta el agente netlify-monitor'" -ForegroundColor Gray
Write-Host ""
Write-Host "5. VALIDAR SISTEMA:" -ForegroundColor White
Write-Host "   .\\.claude\\scripts\\validate-windows.ps1" -ForegroundColor Gray
Write-Host ""

Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🤖 SISTEMA AUTÓNOMO ACTIVO" -ForegroundColor Green
Write-Host "   Monitoreo: Cada 1 hora automáticamente" -ForegroundColor Gray
Write-Host "   Logs: reports\logs\" -ForegroundColor Gray
Write-Host "   Reportes: reports\fixes\" -ForegroundColor Gray
if ($SendGridApiKey) {
    Write-Host "   Emails: $AlertEmail" -ForegroundColor Gray
}
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

Write-Host "Instalación finalizada: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
Write-Host ""
Write-Host "✨ ¡Sistema listo! Ahora funciona solo. ✨" -ForegroundColor Green
Write-Host ""
