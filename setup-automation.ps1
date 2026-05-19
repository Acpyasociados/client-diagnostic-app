# ============================================================================
# SCRIPT MAESTRO DE AUTOMATIZACIÓN - ACP y Asociados Netlify Debugging
# ============================================================================
# Versión: 1.0
# Fecha: 18 Mayo 2026
# Propósito: Configurar automatización completa de debugging con Claude Code
# ============================================================================

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  CONFIGURACIÓN AUTOMATIZADA - ACP y Asociados" -ForegroundColor Cyan
Write-Host "  Netlify Functions Auto-Debugging System" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# PASO 1: Verificar Claude Code
# ============================================================================

Write-Host "[1/8] Verificando Claude Code..." -ForegroundColor Yellow

if (!(Get-Command claude -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Claude Code no está instalado" -ForegroundColor Red
    Write-Host "Por favor ejecuta: npm install -g @anthropic-ai/claude-code" -ForegroundColor Yellow
    exit 1
}

$claudeVersion = claude --version
Write-Host "✅ Claude Code instalado: $claudeVersion" -ForegroundColor Green

# ============================================================================
# PASO 2: Crear estructura de directorios
# ============================================================================

Write-Host ""
Write-Host "[2/8] Creando estructura de directorios..." -ForegroundColor Yellow

$directories = @(
    ".claude",
    ".claude/skills",
    ".claude/agents",
    ".claude/scripts",
    "reports",
    "reports/fixes",
    "reports/logs",
    "reports/validations"
)

foreach ($dir in $directories) {
    if (!(Test-Path $dir)) {
        New-Item -ItemType Directory -Force -Path $dir | Out-Null
        Write-Host "  ✓ Creado: $dir" -ForegroundColor Gray
    } else {
        Write-Host "  ○ Ya existe: $dir" -ForegroundColor Gray
    }
}

Write-Host "✅ Estructura de directorios lista" -ForegroundColor Green

# ============================================================================
# PASO 3: Crear skill personalizado
# ============================================================================

Write-Host ""
Write-Host "[3/8] Creando skill de debugging de Netlify..." -ForegroundColor Yellow

$skillContent = @"
# Netlify Functions Debugging Skill - ACP y Asociados

## 🎯 Contexto del Proyecto

**Proyecto:** ACP y Asociados - Plataforma de diagnóstico empresarial
**URL Producción:** https://acp-asociados.netlify.app
**Función Crítica:** create-diagnostic-order.js
**Error Principal:** event.body null al recibir POST desde formulario web

## 🔧 Problema Técnico

### Síntoma
- Usuario llena formulario completo en frontend
- Click en "Continuar al Pago"
- Función Netlify recibe request pero event.body es null
- No se crea preferencia de Mercado Pago
- Usuario no puede completar el pago

### Causa Raíz
ReadableStream de Netlify no se parsea correctamente con await event.body.text()

### Solución Implementada
Múltiples estrategias de parsing con fallbacks:
1. ReadableStream.text()
2. Response wrapper
3. String directo
4. Objeto ya parseado
5. URLSearchParams (form-urlencoded)

## 🤖 Workflow Automático de Debugging

### Cada Hora (Cron)
1. **Revisar logs de Netlify** (últimos 60 minutos)
   - Buscar pattern: "body is null"
   - Buscar pattern: "parseBody FAILED"
   - Buscar pattern: "JSON.parse FAILED"

2. **Si detecta error:**
   - Analizar logs completos
   - Identificar tipo de error específico
   - Seleccionar estrategia de fix apropiada
   - Aplicar fix al archivo create-diagnostic-order.js

3. **Commit y Deploy:**
   - git add netlify/functions/create-diagnostic-order.js
   - git commit -m "Auto-fix: [descripción específica del error]"
   - git push origin main
   - Esperar deploy de Netlify (2-3 min)

4. **Validación Post-Deploy:**
   - Ejecutar test con payload real
   - Verificar response exitoso
   - Confirmar que Mercado Pago URL se genera

5. **Generar Reporte:**
   - Timestamp del error
   - Logs relevantes
   - Fix aplicado
   - Resultado de validación
   - Tiempo total de recuperación
   - Enviar por email (SendGrid)

## 📋 Comandos Permitidos (Sin Confirmación)

### Git Operations
- git add netlify/functions/*
- git commit -m "Auto-fix: *"
- git commit -m "Debug: *"
- git push origin main

### NPM Operations
- npm install (solo si falta dependencia crítica)
- npm audit fix (solo vulnerabilidades)

### File Operations
- Leer cualquier archivo en netlify/functions/
- Editar create-diagnostic-order.js
- Crear archivos en reports/

### Netlify Operations (vía MCP)
- Leer logs de functions
- Leer estado de deploys
- Leer variables de entorno (sin valores sensibles)

## 🚫 Comandos Prohibidos (Siempre Requieren Confirmación)

- npm uninstall (cualquier paquete)
- git reset --hard
- git push --force
- Eliminar archivos
- Modificar netlify.toml
- Modificar package.json (excepto añadir deps)

## 📁 Archivos Críticos

### Prioritarios (Editar Solo Si Es Necesario)
- `netlify/functions/create-diagnostic-order.js` - Función principal
- `netlify.toml` - Configuración de build
- `package.json` - Dependencias

### Referencia (Solo Lectura)
- `index.html` - Frontend del formulario
- `.env.example` - Variables de entorno de ejemplo
- `README.md` - Documentación del proyecto

## 🧪 Tests de Validación

### Test 1: Endpoint Básico
```bash
curl -X POST https://acp-asociados.netlify.app/.netlify/functions/create-diagnostic-order \
  -H "Content-Type: application/json" \
  -d '{"plan":"test"}'
```

**Resultado Esperado:** Status 200 o error específico (no 500 genérico)

### Test 2: Payload Completo
```bash
curl -X POST https://acp-asociados.netlify.app/.netlify/functions/create-diagnostic-order \
  -H "Content-Type: application/json" \
  -d '{
    "plan": "basico",
    "empresa": "Test Corp",
    "email": "test@test.com",
    "telefono": "+56912345678",
    "sector": "tecnologia",
    "ventasMensuales": "500000",
    "margenActual": "25",
    "clientesActivos": "50"
  }'
```

**Resultado Esperado:**
```json
{
  "success": true,
  "lead_id": "lead-XXXXX",
  "mercadoPagoUrl": "https://www.mercadopago.cl/checkout/v1/redirect?pref_id=XXXXX"
}
```

### Test 3: Validación de Logs
- Logs deben mostrar "✓ Strategy X SUCCESS"
- Logs deben mostrar "✓ JSON.parse SUCCESS"
- NO debe aparecer "body is null"
- NO debe aparecer "parseBody FAILED"

## 🎯 Estrategias de Fix por Tipo de Error

### Error Tipo A: "body is null"
**Causa:** event.body no llegó del todo
**Fix:** Agregar validación temprana + logging exhaustivo
```javascript
if (!event.body) {
  console.error('Body is null, event:', JSON.stringify(event));
  return new Response(JSON.stringify({ error: 'No body' }), { status: 400 });
}
```

### Error Tipo B: "body.text is not a function"
**Causa:** ReadableStream no tiene método .text()
**Fix:** Usar Response wrapper
```javascript
const bodyText = await new Response(event.body).text();
```

### Error Tipo C: "JSON.parse failed"
**Causa:** Body no es JSON, posiblemente form-urlencoded
**Fix:** Fallback a URLSearchParams
```javascript
const params = new URLSearchParams(bodyText);
const obj = Object.fromEntries(params);
```

### Error Tipo D: "Already read stream"
**Causa:** ReadableStream ya fue consumido
**Fix:** Clonar stream antes de leer
```javascript
const clonedBody = event.body.clone();
const bodyText = await clonedBody.text();
```

## 📊 Métricas de Éxito

### KPIs Principales
- **Uptime:** >99.5% (máximo 3.6 horas downtime/mes)
- **MTTR (Mean Time To Repair):** <5 minutos desde detección
- **False Positives:** <5% de alerts
- **Conversion Rate:** >95% de formularios → pago exitoso

### Reportar Si:
- Mismo error ocurre 3+ veces en 24 horas
- Fix automático falla 2+ veces consecutivas
- MTTR excede 10 minutos
- Validation tests fallan post-fix

## 🔐 Seguridad y Datos Sensibles

### Nunca Loggear:
- API keys de Mercado Pago
- API keys de SendGrid
- Tokens de autenticación
- Información personal de usuarios (emails, teléfonos reales)

### Siempre Loggear:
- Timestamps
- Tipos de error
- Estrategias de fix aplicadas
- Resultados de validación
- IDs de lead (no info personal)

## 📧 Notificaciones por Email

### Trigger: Error Detectado
**Asunto:** [ALERTA] Error en create-diagnostic-order detectado
**Contenido:**
- Timestamp del error
- Logs relevantes (primeras 500 chars)
- Link a logs completos en Netlify
- Status: "Investigando..."

### Trigger: Fix Aplicado
**Asunto:** [AUTO-FIX] Solución aplicada a create-diagnostic-order
**Contenido:**
- Timestamp del fix
- Estrategia de fix aplicada
- Commit SHA
- Link al deploy en Netlify
- Status: "Esperando validación..."

### Trigger: Validación Exitosa
**Asunto:** [RESUELTO] Sistema restaurado completamente
**Contenido:**
- Tiempo total de downtime
- Fix aplicado
- Resultados de tests de validación
- Status: "✅ Sistema operacional"

### Trigger: Fix Falló
**Asunto:** [CRÍTICO] Fix automático falló - Intervención requerida
**Contenido:**
- Descripción del error original
- Estrategia de fix intentada
- Razón del fallo
- Logs de error
- **Acción requerida:** Intervención manual

## 💡 Tips para Claude Code

### Al Analizar Logs
- Buscar patterns, no solo keywords exactos
- Considerar contexto temporal (horario, día de semana)
- Identificar si es error recurrente o aislado

### Al Aplicar Fixes
- Siempre hacer backup antes (git commit previo)
- Aplicar el fix más conservador primero
- Validar inmediatamente después del deploy
- Si falla, probar siguiente estrategia

### Al Generar Reportes
- Usar formato Markdown consistente
- Incluir timestamp UTC y local (Chile)
- Agregar sección "Lecciones Aprendidas"
- Mantener reportes concisos (<500 líneas)

## 🔄 Actualización del Skill

**Última actualización:** 18 Mayo 2026
**Próxima revisión:** Después de primer fix automático exitoso
**Mantenedor:** Patricio Silva (asesor.pac@gmail.com)
"@

$skillContent | Out-File -FilePath ".claude/skills/netlify-debug.md" -Encoding UTF8
Write-Host "✅ Skill creado: .claude/skills/netlify-debug.md" -ForegroundColor Green

# ============================================================================
# PASO 4: Crear agente autónomo
# ============================================================================

Write-Host ""
Write-Host "[4/8] Creando agente autónomo..." -ForegroundColor Yellow

$agentContent = @"
name: netlify-monitor
description: Agente autónomo que monitorea y repara Netlify Functions 24/7
version: 1.0.0
enabled: true

# ============================================================================
# CONFIGURACIÓN DE EJECUCIÓN
# ============================================================================

schedule:
  cron: "0 * * * *"  # Cada hora en punto
  timezone: America/Santiago
  
permissions:
  read_files: true
  write_files: true
  execute_bash: true
  git_operations: true
  netlify_api: true
  web_search: true
  send_email: true

auto_approve:
  git_commit: true
  git_push: true
  file_edit: true
  npm_install: false  # Siempre pedir confirmación para npm

# ============================================================================
# CONFIGURACIÓN DE LOGGING
# ============================================================================

logging:
  level: info
  output: reports/logs/monitor-{timestamp}.log
  console: true
  max_log_size: 10MB
  retention_days: 30

# ============================================================================
# WORKFLOW DE DEBUGGING
# ============================================================================

tasks:
  # --------------------------------------------------------------------------
  # TAREA 1: Revisar Logs de Netlify
  # --------------------------------------------------------------------------
  - name: check_netlify_logs
    description: Obtener logs de la función create-diagnostic-order
    tool: netlify:netlify-deploy-services-reader
    action: get-function-logs
    params:
      site_name: acp-asociados
      function_name: create-diagnostic-order
      time_range: 1h
      limit: 50
    output: netlify_logs
    
  # --------------------------------------------------------------------------
  # TAREA 2: Detectar Errores
  # --------------------------------------------------------------------------
  - name: detect_errors
    description: Analizar logs para detectar patrones de error
    condition: |
      netlify_logs.contains("body is null") OR
      netlify_logs.contains("parseBody FAILED") OR
      netlify_logs.contains("JSON.parse FAILED") OR
      netlify_logs.contains("500 Internal Server Error")
    output: error_detected
    metadata:
      patterns:
        - "body is null"
        - "parseBody FAILED"
        - "JSON.parse FAILED"
        - "TypeError: Cannot read"
        - "undefined is not an object"
      
  # --------------------------------------------------------------------------
  # TAREA 3: Notificar Detección
  # --------------------------------------------------------------------------
  - name: notify_error_detected
    description: Enviar email de alerta cuando se detecta error
    condition: error_detected == true
    action: send_email
    params:
      to: patriciosilvavalenzuela@gmail.com
      subject: "[ALERTA] Error detectado en create-diagnostic-order"
      template: error_alert
      data:
        timestamp: "{{current_timestamp}}"
        logs_preview: "{{netlify_logs | first 500 chars}}"
        netlify_url: "https://app.netlify.com/sites/acp-asociados/functions/create-diagnostic-order"
    
  # --------------------------------------------------------------------------
  # TAREA 4: Analizar Tipo de Error
  # --------------------------------------------------------------------------
  - name: analyze_error_type
    description: Determinar qué tipo de error específico es
    condition: error_detected == true
    logic: |
      if netlify_logs.contains("body is null"):
        error_type = "TYPE_A_NULL_BODY"
      elif netlify_logs.contains("body.text is not a function"):
        error_type = "TYPE_B_NO_TEXT_METHOD"
      elif netlify_logs.contains("JSON.parse"):
        error_type = "TYPE_C_JSON_PARSE"
      elif netlify_logs.contains("Already read"):
        error_type = "TYPE_D_STREAM_CONSUMED"
      else:
        error_type = "TYPE_UNKNOWN"
    output: error_type
    
  # --------------------------------------------------------------------------
  # TAREA 5: Leer Archivo Actual
  # --------------------------------------------------------------------------
  - name: read_current_function
    description: Leer contenido actual de create-diagnostic-order.js
    condition: error_detected == true
    tool: view
    params:
      path: netlify/functions/create-diagnostic-order.js
    output: current_function_code
    
  # --------------------------------------------------------------------------
  # TAREA 6: Aplicar Fix Según Tipo de Error
  # --------------------------------------------------------------------------
  - name: apply_fix
    description: Modificar función con fix apropiado
    condition: error_detected == true
    steps:
      - read: netlify/functions/create-diagnostic-order.js
      - apply_strategy: |
          if error_type == "TYPE_A_NULL_BODY":
            # Agregar validación temprana
            add_early_validation()
          elif error_type == "TYPE_B_NO_TEXT_METHOD":
            # Usar Response wrapper
            use_response_wrapper()
          elif error_type == "TYPE_C_JSON_PARSE":
            # Agregar fallback a URLSearchParams
            add_urlsearchparams_fallback()
          elif error_type == "TYPE_D_STREAM_CONSUMED":
            # Clonar stream antes de leer
            add_stream_clone()
          else:
            # Fix genérico: todas las estrategias
            apply_all_strategies()
      - validate: syntax_check
      - output: modified_function_code
    
  # --------------------------------------------------------------------------
  # TAREA 7: Crear Commit
  # --------------------------------------------------------------------------
  - name: git_commit
    description: Hacer commit del fix aplicado
    condition: error_detected == true
    tool: bash
    command: |
      git add netlify/functions/create-diagnostic-order.js
      git commit -m "Auto-fix [{{error_type}}]: Mejorar parsing de ReadableStream en create-diagnostic-order

      - Error detectado: {{error_type}}
      - Timestamp: {{current_timestamp}}
      - Estrategia aplicada: {{applied_strategy}}
      - Logs relevantes en reports/fixes/fix-{{timestamp}}.md"
    output: commit_sha
    
  # --------------------------------------------------------------------------
  # TAREA 8: Push a Main
  # --------------------------------------------------------------------------
  - name: git_push
    description: Hacer push a repositorio remoto
    condition: error_detected == true
    tool: bash
    command: git push origin main
    retry:
      max_attempts: 3
      backoff: exponential
      on_failure: notify_push_failed
    
  # --------------------------------------------------------------------------
  # TAREA 9: Esperar Deploy de Netlify
  # --------------------------------------------------------------------------
  - name: wait_for_deploy
    description: Esperar a que Netlify complete el deploy
    condition: error_detected == true
    tool: netlify:netlify-deploy-services-reader
    action: wait-for-deploy
    params:
      site_name: acp-asociados
      commit_sha: "{{commit_sha}}"
      timeout: 300  # 5 minutos
      poll_interval: 15  # Revisar cada 15 segundos
    output: deploy_status
    
  # --------------------------------------------------------------------------
  # TAREA 10: Validar Fix (Test 1 - Básico)
  # --------------------------------------------------------------------------
  - name: validate_fix_basic
    description: Test básico del endpoint
    condition: deploy_status == "success"
    tool: bash
    command: |
      curl -s -X POST https://acp-asociados.netlify.app/.netlify/functions/create-diagnostic-order \
        -H "Content-Type: application/json" \
        -d '{"plan":"test"}' \
        -w "\nHTTP_STATUS:%{http_code}"
    output: basic_test_result
    expect: |
      HTTP_STATUS:200 OR
      (HTTP_STATUS:400 AND response.contains("error"))
    
  # --------------------------------------------------------------------------
  # TAREA 11: Validar Fix (Test 2 - Completo)
  # --------------------------------------------------------------------------
  - name: validate_fix_complete
    description: Test con payload completo
    condition: basic_test_result.success == true
    tool: bash
    command: |
      curl -s -X POST https://acp-asociados.netlify.app/.netlify/functions/create-diagnostic-order \
        -H "Content-Type: application/json" \
        -d '{
          "plan": "basico",
          "empresa": "Validation Test Corp",
          "email": "test@validation.local",
          "telefono": "+56912345678",
          "sector": "tecnologia",
          "ventasMensuales": "500000",
          "margenActual": "25",
          "clientesActivos": "50",
          "costosPrincipales": "Arriendo",
          "desafioPrincipal": "Rentabilidad",
          "objetivo6Meses": "Mejorar márgenes"
        }' \
        -w "\nHTTP_STATUS:%{http_code}"
    output: complete_test_result
    expect: |
      HTTP_STATUS:200 AND
      response.contains("success") AND
      response.contains("mercadoPagoUrl")
    
  # --------------------------------------------------------------------------
  # TAREA 12: Revisar Logs Post-Deploy
  # --------------------------------------------------------------------------
  - name: check_logs_after_fix
    description: Verificar que logs no muestran más errores
    condition: complete_test_result.success == true
    tool: netlify:netlify-deploy-services-reader
    action: get-function-logs
    params:
      site_name: acp-asociados
      function_name: create-diagnostic-order
      time_range: 5m  # Últimos 5 minutos
      limit: 10
    output: post_fix_logs
    expect: |
      NOT post_fix_logs.contains("body is null") AND
      NOT post_fix_logs.contains("parseBody FAILED")
    
  # --------------------------------------------------------------------------
  # TAREA 13: Generar Reporte de Fix
  # --------------------------------------------------------------------------
  - name: generate_fix_report
    description: Crear reporte detallado del fix aplicado
    condition: complete_test_result.success == true
    action: create_file
    params:
      path: reports/fixes/fix-{{timestamp}}.md
      content: |
        # 🔧 Reporte de Fix Automático
        
        **Timestamp:** {{current_timestamp}} (UTC) / {{current_timestamp_local}} (Chile)
        **Error Type:** {{error_type}}
        **Commit SHA:** {{commit_sha}}
        **Deploy ID:** {{deploy_status.deploy_id}}
        
        ---
        
        ## 📊 Resumen Ejecutivo
        
        - **Downtime:** {{downtime_minutes}} minutos
        - **MTTR:** {{mttr_minutes}} minutos (desde detección hasta validación exitosa)
        - **Fix Strategy:** {{applied_strategy}}
        - **Validation:** ✅ Exitosa
        
        ---
        
        ## 🔍 Detección del Error
        
        **Logs Originales (preview):**
        ```
        {{netlify_logs | first 1000 chars}}
        ```
        
        **Pattern Detectado:** {{detected_pattern}}
        
        ---
        
        ## 🛠️ Fix Aplicado
        
        **Tipo de Error:** {{error_type}}
        
        **Estrategia Utilizada:**
        {{applied_strategy_description}}
        
        **Cambios en el Código:**
        ```diff
        {{code_diff}}
        ```
        
        ---
        
        ## ✅ Validación
        
        ### Test 1: Endpoint Básico
        - **Status:** {{basic_test_result.status}}
        - **Response:** {{basic_test_result.response | truncate 200}}
        
        ### Test 2: Payload Completo
        - **Status:** {{complete_test_result.status}}
        - **Response:** {{complete_test_result.response | truncate 200}}
        - **Mercado Pago URL:** {{complete_test_result.mercadoPagoUrl | default 'N/A'}}
        
        ### Test 3: Logs Post-Fix
        - **Errores Encontrados:** {{post_fix_logs.error_count}}
        - **Warnings:** {{post_fix_logs.warning_count}}
        - **Status:** {{post_fix_logs.overall_status}}
        
        ---
        
        ## 📈 Métricas
        
        - **Tiempo Total:** {{total_time_seconds}} segundos
        - **Tiempo de Detección:** {{detection_time_seconds}} segundos
        - **Tiempo de Fix:** {{fix_time_seconds}} segundos
        - **Tiempo de Deploy:** {{deploy_time_seconds}} segundos
        - **Tiempo de Validación:** {{validation_time_seconds}} segundos
        
        ---
        
        ## 💡 Lecciones Aprendidas
        
        {{lessons_learned}}
        
        ---
        
        ## 🔗 Links Relevantes
        
        - [Netlify Deploy](https://app.netlify.com/sites/acp-asociados/deploys/{{deploy_status.deploy_id}})
        - [Function Logs](https://app.netlify.com/sites/acp-asociados/functions/create-diagnostic-order)
        - [GitHub Commit](https://github.com/[usuario]/[repo]/commit/{{commit_sha}})
        
        ---
        
        **Status Final:** ✅ Sistema restaurado y operacional
    
  # --------------------------------------------------------------------------
  # TAREA 14: Notificar Éxito
  # --------------------------------------------------------------------------
  - name: notify_fix_success
    description: Enviar email confirmando fix exitoso
    condition: complete_test_result.success == true
    action: send_email
    params:
      to: patriciosilvavalenzuela@gmail.com
      subject: "[RESUELTO] ✅ Sistema restaurado - Fix aplicado exitosamente"
      template: fix_success
      data:
        timestamp: "{{current_timestamp}}"
        error_type: "{{error_type}}"
        mttr: "{{mttr_minutes}} minutos"
        commit_sha: "{{commit_sha}}"
        report_path: "reports/fixes/fix-{{timestamp}}.md"
        netlify_url: "https://app.netlify.com/sites/acp-asociados/deploys/{{deploy_status.deploy_id}}"
    
  # --------------------------------------------------------------------------
  # TAREA 15: Notificar Fallo (Si validación falla)
  # --------------------------------------------------------------------------
  - name: notify_fix_failed
    description: Alertar si el fix automático no funcionó
    condition: |
      error_detected == true AND
      (complete_test_result.success == false OR
       post_fix_logs.contains("body is null"))
    action: send_email
    params:
      to: patriciosilvavalenzuela@gmail.com
      subject: "[CRÍTICO] ❌ Fix automático falló - Intervención requerida"
      priority: high
      template: fix_failed
      data:
        timestamp: "{{current_timestamp}}"
        error_type: "{{error_type}}"
        applied_strategy: "{{applied_strategy}}"
        failure_reason: "{{failure_reason}}"
        validation_results: "{{complete_test_result}}"
        logs: "{{post_fix_logs | first 1000 chars}}"
        action_required: "Revisar manualmente y aplicar fix"

# ============================================================================
# ESTRATEGIAS DE FIX
# ============================================================================

fix_strategies:
  TYPE_A_NULL_BODY:
    description: Body llegó como null desde el inicio
    code_changes:
      - location: "línea 10-15"
        action: "add_before_parseBody"
        snippet: |
          if (!event.body) {
            const now = new Date().toISOString();
            console.error(`[${now}] Body is null, event keys: ${Object.keys(event).join(',')}`);
            return new Response(JSON.stringify({ 
              error: 'No body received',
              debug: { method: event.httpMethod, headers: event.headers }
            }), { status: 400 });
          }
  
  TYPE_B_NO_TEXT_METHOD:
    description: ReadableStream no tiene método .text()
    code_changes:
      - location: "función parseBody"
        action: "replace_text_call"
        snippet: |
          // Estrategia 2: Response wrapper
          try {
            bodyText = await new Response(event.body).text();
            console.error(`[${now}] ✓ Strategy 2 SUCCESS (Response wrapper)`);
          } catch (e2) {
            console.error(`[${now}] ✗ Strategy 2 FAILED: ${e2.message}`);
            return null;
          }
  
  TYPE_C_JSON_PARSE:
    description: Body no es JSON válido
    code_changes:
      - location: "después de JSON.parse"
        action: "add_urlsearchparams_fallback"
        snippet: |
          } catch (e) {
            console.error(`[${now}] JSON.parse FAILED, trying URLSearchParams`);
            try {
              const params = new URLSearchParams(bodyText);
              const obj = {};
              for (const [key, value] of params) {
                obj[key] = value;
              }
              return Object.keys(obj).length > 0 ? obj : null;
            } catch (e2) {
              console.error(`[${now}] URLSearchParams FAILED: ${e2.message}`);
              return null;
            }
          }
  
  TYPE_D_STREAM_CONSUMED:
    description: ReadableStream ya fue leído
    code_changes:
      - location: "inicio de parseBody"
        action: "add_stream_clone"
        snippet: |
          // Clone stream para evitar "already read"
          const bodyClone = event.body.clone ? event.body.clone() : event.body;
          const bodyText = await bodyClone.text();

# ============================================================================
# TEMPLATES DE EMAIL
# ============================================================================

email_templates:
  error_alert:
    subject: "[ALERTA] Error detectado en create-diagnostic-order"
    body: |
      Hola Patricio,
      
      Se ha detectado un error en la función create-diagnostic-order de Netlify.
      
      📅 Timestamp: {{timestamp}}
      🔍 Logs (preview): 
      
      {{logs_preview}}
      
      🤖 Acción: El sistema está analizando el error y aplicará un fix automático en los próximos minutos.
      
      🔗 Ver logs completos: {{netlify_url}}
      
      ---
      Agente Autónomo - ACP y Asociados
      
  fix_success:
    subject: "[RESUELTO] ✅ Sistema restaurado - Fix aplicado exitosamente"
    body: |
      Hola Patricio,
      
      ¡Buenas noticias! El sistema ha restaurado automáticamente el funcionamiento de create-diagnostic-order.
      
      ✅ Status: Sistema operacional
      📅 Timestamp: {{timestamp}}
      🐛 Tipo de Error: {{error_type}}
      ⏱️ MTTR: {{mttr}}
      📝 Commit: {{commit_sha}}
      
      📊 Reporte completo disponible en:
      {{report_path}}
      
      🔗 Ver deploy en Netlify:
      {{netlify_url}}
      
      ---
      Agente Autónomo - ACP y Asociados
      
  fix_failed:
    subject: "[CRÍTICO] ❌ Fix automático falló - Intervención requerida"
    body: |
      Hola Patricio,
      
      ALERTA: El fix automático no pudo resolver el problema. Se requiere intervención manual.
      
      ❌ Status: Fix falló
      📅 Timestamp: {{timestamp}}
      🐛 Tipo de Error: {{error_type}}
      🔧 Estrategia Intentada: {{applied_strategy}}
      ❗ Razón del Fallo: {{failure_reason}}
      
      📋 Resultados de Validación:
      {{validation_results}}
      
      📄 Logs relevantes:
      {{logs}}
      
      🚨 ACCIÓN REQUERIDA:
      Por favor revisa manualmente el proyecto y aplica el fix correspondiente.
      
      Guía de referencia: Ver documento "PLAN DE ACCIÓN INMEDIATO"
      
      ---
      Agente Autónomo - ACP y Asociados

# ============================================================================
# CONFIGURACIÓN DE MÉTRICAS Y MONITOREO
# ============================================================================

metrics:
  track:
    - error_detection_count
    - fix_attempt_count
    - fix_success_count
    - fix_failure_count
    - average_mttr
    - total_downtime_minutes
  
  thresholds:
    max_mttr_minutes: 10
    max_fix_failures_per_day: 2
    max_same_error_per_day: 3
  
  alert_on_threshold_breach: true

# ============================================================================
# FIN DEL AGENTE
# ============================================================================
"@

$agentContent | Out-File -FilePath ".claude/agents/netlify-monitor.yaml" -Encoding UTF8
Write-Host "✅ Agente creado: .claude/agents/netlify-monitor.yaml" -ForegroundColor Green

# ============================================================================
# PASO 5: Crear scripts auxiliares
# ============================================================================

Write-Host ""
Write-Host "[5/8] Creando scripts de monitoreo y validación..." -ForegroundColor Yellow

# Script de monitoreo continuo
$monitorScript = @"
#!/bin/bash
# ============================================================================
# Script de Monitoreo Continuo - ACP y Asociados
# ============================================================================
# Este script ejecuta el agente de Claude Code cada hora indefinidamente
# ============================================================================

echo "🤖 Iniciando monitor continuo de Netlify Functions..."
echo "⏰ Frecuencia: Cada 1 hora"
echo "📍 Proyecto: ACP y Asociados"
echo ""

# Cambiar al directorio del proyecto
cd "C:/Users/Admin/Documents/Claude/Projects/Acp y Asociados" || exit 1

iteration=1

while true; do
  timestamp=`$(Get-Date -Format "yyyy-MM-dd HH:mm:ss")`
  echo "[$timestamp] 🔄 Iteración #$iteration - Ejecutando check..."
  
  # Ejecutar Claude Code con el agente
  claude -p "Ejecuta el agente netlify-monitor para revisar logs y aplicar fixes si es necesario"
  
  exit_code=$?
  
  if [ $exit_code -eq 0 ]; then
    echo "[$timestamp] ✅ Check completado exitosamente"
  else
    echo "[$timestamp] ⚠️ Check completó con código: $exit_code"
  fi
  
  echo "[$timestamp] ⏸️ Esperando 1 hora hasta próximo check..."
  echo ""
  
  iteration=$((iteration + 1))
  
  # Esperar 1 hora (3600 segundos)
  sleep 3600
done
"@

$monitorScript | Out-File -FilePath ".claude/scripts/monitor.sh" -Encoding UTF8
Write-Host "  ✓ Creado: .claude/scripts/monitor.sh" -ForegroundColor Gray

# Script de validación
$validateScript = @"
#!/bin/bash
# ============================================================================
# Script de Validación - ACP y Asociados
# ============================================================================
# Ejecuta tests contra el endpoint de producción
# ============================================================================

echo "🧪 Iniciando validación de create-diagnostic-order..."
echo ""

ENDPOINT="https://acp-asociados.netlify.app/.netlify/functions/create-diagnostic-order"
PASSED=0
FAILED=0

# ----------------------------------------------------------------------------
# Test 1: Endpoint Básico
# ----------------------------------------------------------------------------

echo "[Test 1/3] Endpoint básico con payload mínimo..."

RESPONSE1=`$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -d '{"plan":"test"}')`

HTTP_CODE1=`$(echo "$RESPONSE1" | grep HTTP_CODE | cut -d: -f2)`

if [ "$HTTP_CODE1" = "200" ] || [ "$HTTP_CODE1" = "400" ]; then
  echo "  ✅ Test 1 PASADO (HTTP $HTTP_CODE1)"
  PASSED=$((PASSED + 1))
else
  echo "  ❌ Test 1 FALLÓ (HTTP $HTTP_CODE1)"
  echo "  Response: $RESPONSE1"
  FAILED=$((FAILED + 1))
fi

echo ""

# ----------------------------------------------------------------------------
# Test 2: Payload Completo
# ----------------------------------------------------------------------------

echo "[Test 2/3] Payload completo con todos los campos..."

PAYLOAD2='{
  "plan": "basico",
  "empresa": "Validation Test Corp",
  "email": "test@validation.local",
  "telefono": "+56912345678",
  "sector": "tecnologia",
  "ventasMensuales": "500000",
  "margenActual": "25",
  "clientesActivos": "50",
  "costosPrincipales": "Arriendo",
  "desafioPrincipal": "Rentabilidad",
  "objetivo6Meses": "Mejorar márgenes"
}'

RESPONSE2=`$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD2")`

HTTP_CODE2=`$(echo "$RESPONSE2" | grep HTTP_CODE | cut -d: -f2)`
BODY2=`$(echo "$RESPONSE2" | grep -v HTTP_CODE)`

if [ "$HTTP_CODE2" = "200" ] && echo "$BODY2" | grep -q "success"; then
  echo "  ✅ Test 2 PASADO (HTTP $HTTP_CODE2, success=true)"
  PASSED=$((PASSED + 1))
  
  if echo "$BODY2" | grep -q "mercadoPagoUrl"; then
    echo "  ✅ Mercado Pago URL presente en response"
  else
    echo "  ⚠️ Mercado Pago URL no encontrado (revisar)"
  fi
else
  echo "  ❌ Test 2 FALLÓ (HTTP $HTTP_CODE2)"
  echo "  Response: $BODY2"
  FAILED=$((FAILED + 1))
fi

echo ""

# ----------------------------------------------------------------------------
# Test 3: Verificar que no hay errores en logs recientes
# ----------------------------------------------------------------------------

echo "[Test 3/3] Verificando logs recientes en Netlify..."
echo "  ℹ️ (Este test requiere acceso a Netlify API vía Claude Code)"
echo "  ⏭️ Saltando por ahora - ejecutar manualmente con Claude Code"
echo ""

# ----------------------------------------------------------------------------
# Resumen
# ----------------------------------------------------------------------------

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 RESUMEN DE VALIDACIÓN"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Tests Pasados: $PASSED"
echo "❌ Tests Fallados: $FAILED"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $FAILED -eq 0 ]; then
  echo "🎉 VALIDACIÓN EXITOSA - Sistema operacional"
  exit 0
else
  echo "⚠️ VALIDACIÓN FALLÓ - Revisar logs"
  exit 1
fi
"@

$validateScript | Out-File -FilePath ".claude/scripts/validate.sh" -Encoding UTF8
Write-Host "  ✓ Creado: .claude/scripts/validate.sh" -ForegroundColor Gray

# ============================================================================
# PASO 6: Crear archivo .env.example para SendGrid
# ============================================================================

Write-Host ""
Write-Host "[6/8] Creando template de configuración de SendGrid..." -ForegroundColor Yellow

$envExample = @"
# ============================================================================
# CONFIGURACIÓN DE SENDGRID - ACP y Asociados
# ============================================================================
# Este archivo es un TEMPLATE. Copia este archivo como '.env' y llena los valores reales.
# ⚠️ NUNCA hagas commit del archivo .env con valores reales
# ============================================================================

# SendGrid API Key
# Obtener en: https://app.sendgrid.com/settings/api_keys
SENDGRID_API_KEY=SG.XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Email remitente (debe estar verificado en SendGrid)
SENDGRID_FROM_EMAIL=notificaciones@acp-asociados.com
SENDGRID_FROM_NAME=ACP Automatización

# Email destinatario para alertas
ALERT_EMAIL=patriciosilvavalenzuela@gmail.com

# ============================================================================
# CONFIGURACIÓN OPCIONAL
# ============================================================================

# Nivel de logging (debug, info, warn, error)
LOG_LEVEL=info

# Zona horaria para timestamps
TIMEZONE=America/Santiago

# ============================================================================
# INSTRUCCIONES DE CONFIGURACIÓN
# ============================================================================

# 1. Ve a https://app.sendgrid.com (crea cuenta gratis si no tienes)
# 2. Ve a Settings > API Keys
# 3. Clic en "Create API Key"
# 4. Nombre: "Claude Code Automation"
# 5. Permisos: "Full Access" o "Mail Send" únicamente
# 6. Copia el API key generado (solo se muestra 1 vez)
# 7. Pega el API key en SENDGRID_API_KEY arriba
# 8. Verifica tu email en Settings > Sender Authentication
# 9. Actualiza SENDGRID_FROM_EMAIL con tu email verificado
# 10. Guarda este archivo como '.env' (sin el .example)
# 11. Ejecuta: echo ".env" >> .gitignore (para no subirlo a Git)

# ============================================================================
# VERIFICAR CONFIGURACIÓN
# ============================================================================

# Para probar que SendGrid funciona, ejecuta:
# claude -p "Envía un email de prueba usando la configuración de .env"

# ============================================================================
"@

$envExample | Out-File -FilePath ".env.example" -Encoding UTF8
Write-Host "✅ Template creado: .env.example" -ForegroundColor Green

# ============================================================================
# PASO 7: Crear dashboard HTML
# ============================================================================

Write-Host ""
Write-Host "[7/8] Generando dashboard de monitoreo..." -ForegroundColor Yellow
Write-Host "  (Esto tomará un momento, creando archivo grande...)" -ForegroundColor Gray

# El dashboard es muy grande, lo crearé en el siguiente paso
Write-Host "  ⏳ Preparando dashboard..." -ForegroundColor Gray

# Continuará en el próximo archivo...
Write-Host "✅ Scripts de configuración completados" -ForegroundColor Green

# ============================================================================
# PASO 8: Instrucciones finales
# ============================================================================

Write-Host ""
Write-Host "[8/8] Configuración de Task Scheduler (opcional)..." -ForegroundColor Yellow
Write-Host "  Para ejecutar el monitor automáticamente cada hora:" -ForegroundColor Gray
Write-Host "  1. Abre Task Scheduler (Programador de tareas)" -ForegroundColor Gray
Write-Host "  2. Crear tarea básica..." -ForegroundColor Gray
Write-Host "  3. Nombre: 'Claude Netlify Monitor'" -ForegroundColor Gray
Write-Host "  4. Trigger: Diariamente, repetir cada 1 hora" -ForegroundColor Gray
Write-Host "  5. Acción: Iniciar programa" -ForegroundColor Gray
Write-Host "  6. Programa: claude" -ForegroundColor Gray
Write-Host "  7. Argumentos: -p 'Ejecutar agente netlify-monitor'" -ForegroundColor Gray
Write-Host "  8. Iniciar en: ruta del proyecto" -ForegroundColor Gray
Write-Host ""
Write-Host "  ℹ️ O ejecuta manualmente: .\.claude\scripts\monitor.sh" -ForegroundColor Cyan

# ============================================================================
# RESUMEN FINAL
# ============================================================================

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  ✅ CONFIGURACIÓN COMPLETADA" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "📁 Archivos creados:" -ForegroundColor Cyan
Write-Host "  • .claude/skills/netlify-debug.md" -ForegroundColor White
Write-Host "  • .claude/agents/netlify-monitor.yaml" -ForegroundColor White
Write-Host "  • .claude/scripts/monitor.sh" -ForegroundColor White
Write-Host "  • .claude/scripts/validate.sh" -ForegroundColor White
Write-Host "  • .env.example" -ForegroundColor White
Write-Host "  • reports/ (directorios)" -ForegroundColor White
Write-Host ""
Write-Host "🚀 PRÓXIMOS PASOS:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Configurar SendGrid:" -ForegroundColor White
Write-Host "   • Copia .env.example a .env" -ForegroundColor Gray
Write-Host "   • Llena SENDGRID_API_KEY con tu key" -ForegroundColor Gray
Write-Host "   • Agrega .env al .gitignore" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Probar manualmente:" -ForegroundColor White
Write-Host "   • cd ""C:\Users\Admin\Documents\Claude\Projects\Acp y Asociados""" -ForegroundColor Gray
Write-Host "   • claude -p ""Ejecuta el agente netlify-monitor""" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Activar monitoreo continuo:" -ForegroundColor White
Write-Host "   • bash .claude/scripts/monitor.sh" -ForegroundColor Gray
Write-Host "   • O configurar Task Scheduler (ver arriba)" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Abrir dashboard (próximo archivo):" -ForegroundColor White
Write-Host "   • Abrir dashboard.html en tu browser" -ForegroundColor Gray
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Preguntar si quiere generar dashboard ahora
$response = Read-Host "¿Generar dashboard.html ahora? (S/N)"
if ($response -eq "S" -or $response -eq "s") {
    Write-Host ""
    Write-Host "Generando dashboard..." -ForegroundColor Yellow
    Write-Host "Dashboard se creará en el siguiente archivo..." -ForegroundColor Gray
}

Write-Host ""
Write-Host "✅ Setup completado. Dashboard se generará por separado." -ForegroundColor Green
Write-Host ""
