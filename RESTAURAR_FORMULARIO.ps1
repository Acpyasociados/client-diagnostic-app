# Script para restaurar formulario a version funcional
# El formulario fue reemplazado por una version sin estilos
# Esta version restaura los estilos correctos (inline CSS)

Write-Host "Restaurando formulario a version funcional..." -ForegroundColor Green
Write-Host ""

# Remover archivo de bloqueo si existe
if (Test-Path ".\.git\index.lock") {
    Write-Host "Removiendo archivo de bloqueo..." -ForegroundColor Yellow
    Remove-Item ".\.git\index.lock" -Force
}

Write-Host "Estado actual:" -ForegroundColor Cyan
git status

Write-Host ""
Write-Host "Haciendo commit y push..." -ForegroundColor Yellow
git add index.html
git commit -m "restore: Restaurar formulario a version funcional de May 19 con estilos inline correctos"
git push origin main

Write-Host ""
Write-Host "Restauracion completada! Netlify desplegara en 2-3 minutos" -ForegroundColor Green
Write-Host ""
Write-Host "Dashboard: https://app.netlify.com/sites/acp-asociados/deploys" -ForegroundColor Cyan
