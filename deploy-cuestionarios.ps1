# 🚀 SCRIPT DE DEPLOY - MEJORAS CUESTIONARIOS ACP
# Fecha: 21 Mayo 2026
# Cambios: 7 nuevas preguntas para sector Servicios en Terreno

Write-Host "🚀 INICIANDO DEPLOY DE MEJORAS - CUESTIONARIOS ACP" -ForegroundColor Cyan
Write-Host ""

# Configuración
$projectPath = "C:\Users\Admin\Documents\Claude\Projects\Acp y Asociados"
$questionsFile = "netlify\functions\_lib\questions.js"

# Verificar que estamos en el directorio correcto
Write-Host "📂 Verificando directorio del proyecto..." -ForegroundColor Yellow
if (!(Test-Path $projectPath)) {
    Write-Host "❌ ERROR: No se encontró el directorio del proyecto" -ForegroundColor Red
    Write-Host "   Ruta esperada: $projectPath" -ForegroundColor Red
    exit 1
}

Set-Location $projectPath
Write-Host "✅ Directorio verificado: $projectPath" -ForegroundColor Green
Write-Host ""

# Verificar que el archivo questions.js descargado existe
Write-Host "📥 Buscando archivo questions.js descargado..." -ForegroundColor Yellow
$downloadPath = "$env:USERPROFILE\Downloads\questions.js"
if (!(Test-Path $downloadPath)) {
    Write-Host "❌ ERROR: No se encontró questions.js en Downloads" -ForegroundColor Red
    Write-Host "   Por favor descarga el archivo primero desde Claude" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Archivo encontrado en Downloads" -ForegroundColor Green
Write-Host ""

# Hacer backup del archivo actual
Write-Host "💾 Creando backup del archivo actual..." -ForegroundColor Yellow
$backupFile = "netlify\functions\_lib\questions.js.backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
if (Test-Path $questionsFile) {
    Copy-Item $questionsFile $backupFile
    Write-Host "✅ Backup creado: $backupFile" -ForegroundColor Green
} else {
    Write-Host "⚠️  ADVERTENCIA: No se encontró archivo original para backup" -ForegroundColor Yellow
}
Write-Host ""

# Copiar el nuevo archivo
Write-Host "📋 Copiando nuevo archivo questions.js..." -ForegroundColor Yellow
Copy-Item $downloadPath $questionsFile -Force
Write-Host "✅ Archivo copiado exitosamente" -ForegroundColor Green
Write-Host ""

# Verificar el archivo
Write-Host "🔍 Verificando contenido del archivo..." -ForegroundColor Yellow
$content = Get-Content $questionsFile -Raw
if ($content -match "client_acquisition_method" -and $content -match "fuel_purchase_structure") {
    Write-Host "✅ Archivo verificado - contiene las nuevas preguntas" -ForegroundColor Green
} else {
    Write-Host "❌ ERROR: El archivo no contiene las preguntas esperadas" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Git status
Write-Host "📊 Estado de Git..." -ForegroundColor Yellow
git status --short
Write-Host ""

# Commit
Write-Host "💬 Creando commit..." -ForegroundColor Yellow
git add $questionsFile
git commit -m "feat: Agregar 7 preguntas al cuestionario de Servicios en Terreno

- FASE 1 (Críticas): client_acquisition_method, fuel_purchase_structure
- FASE 2 (Importantes): return_trip_utilization, management_control_system
- FASE 3 (Útiles): avg_cost_per_trip, client_mix, tax_advisor_name

Total: 13 preguntas para sector transporte (6 originales + 7 nuevas)
Identificadas desde gaps del caso Transportes Aravena"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Commit creado exitosamente" -ForegroundColor Green
} else {
    Write-Host "❌ ERROR al crear commit" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Push
Write-Host "🚀 Haciendo push a GitHub..." -ForegroundColor Yellow
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Push exitoso - Netlify iniciará el deploy automáticamente" -ForegroundColor Green
} else {
    Write-Host "❌ ERROR al hacer push" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Resumen
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "✅ DEPLOY COMPLETADO EXITOSAMENTE" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 CAMBIOS IMPLEMENTADOS:" -ForegroundColor Yellow
Write-Host "   • Sector: Servicios en Terreno / Transporte" -ForegroundColor White
Write-Host "   • Preguntas nuevas: 7" -ForegroundColor White
Write-Host "   • Total preguntas: 13 (6 originales + 7 nuevas)" -ForegroundColor White
Write-Host ""
Write-Host "🚨 FASE 1 - CRÍTICAS (2):" -ForegroundColor Red
Write-Host "   ✓ client_acquisition_method - ¿Cómo llegan los clientes?" -ForegroundColor White
Write-Host "   ✓ fuel_purchase_structure - ¿Cómo compras combustible?" -ForegroundColor White
Write-Host ""
Write-Host "🟡 FASE 2 - IMPORTANTES (2):" -ForegroundColor Yellow
Write-Host "   ✓ return_trip_utilization - Viajes de vuelta cargados/vacíos" -ForegroundColor White
Write-Host "   ✓ management_control_system - Control de operaciones" -ForegroundColor White
Write-Host ""
Write-Host "🟢 FASE 3 - ÚTILES (3):" -ForegroundColor Green
Write-Host "   ✓ avg_cost_per_trip - Costo por viaje" -ForegroundColor White
Write-Host "   ✓ client_mix - Contratos fijos vs puntuales" -ForegroundColor White
Write-Host "   ✓ tax_advisor_name - Nombre del contador" -ForegroundColor White
Write-Host ""
Write-Host "📍 PRÓXIMOS PASOS:" -ForegroundColor Cyan
Write-Host "   1. Espera ~2-3 minutos para que Netlify complete el deploy" -ForegroundColor White
Write-Host "   2. Verifica en: https://app.netlify.com/sites/acp-asociados/deploys" -ForegroundColor White
Write-Host "   3. Prueba el formulario en: https://acp-asociados.netlify.app" -ForegroundColor White
Write-Host "   4. Selecciona 'Servicios en terreno' y verifica las 13 preguntas" -ForegroundColor White
Write-Host ""
Write-Host "💾 BACKUP GUARDADO EN:" -ForegroundColor Yellow
Write-Host "   $backupFile" -ForegroundColor White
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
