# Script para hacer push del fix de formulario a GitHub
# Ejecutar desde PowerShell en la raíz del proyecto

Write-Host "🔧 Reparando formulario - Agregando enlace CSS..." -ForegroundColor Green
Write-Host ""

# Verificar estado
Write-Host "📋 Estado del repositorio:" -ForegroundColor Cyan
git status

Write-Host ""
Write-Host "📤 Haciendo push a GitHub..." -ForegroundColor Yellow
git push -u origin main

Write-Host ""
Write-Host "✅ ¡Push completado! Netlify desplegará automáticamente en 2-3 minutos" -ForegroundColor Green
Write-Host ""
Write-Host "Puedes monitorear el deploy en: https://app.netlify.com/sites/acp-asociados/deploys" -ForegroundColor Cyan
