Set-Location "C:\Users\Admin\Documents\Claude\Projects\Acp y Asociados"

# 1. Eliminar lock si existe
$lock = ".git\index.lock"
if (Test-Path $lock) {
    Remove-Item $lock -Force
    Write-Host "Lock eliminado" -ForegroundColor Yellow
}

# 2. Agregar archivos modificados
git add netlify/functions/flow-webhook.js
git add netlify/functions/create-diagnostic-order.js
git add netlify/functions/flow-create-payment.js
git add netlify/functions/dev-simulate-payment.js
git add netlify/functions/dev-setup-sender.js
git add flow-success.html
git add admin.html
git add questionnaire.html
git add review.html
git add netlify.toml
git add netlify/functions/_lib/email.js
git add netlify/functions/_lib/report.js
git add netlify/functions/_lib/questions.js
git add netlify/functions/submit-questionnaire.js
git add netlify/functions/approve-report.js
git add netlify/functions/request-changes.js
git add netlify/functions/_lib/search.js
git add index.html
git add netlify/functions/audit-leads.js
git add netlify/functions/cleanup-test-leads.js

# 3. Commit
git commit -m "fix: cleanup-test-leads, audit-leads blobs, dev-simulate precio $1500, webhook status=2"

# 4. Push
git push origin main

Write-Host ""
Write-Host "LISTO. Netlify desplegara en 1-2 minutos." -ForegroundColor Green
Write-Host ""
Write-Host "RECORDATORIO: Para activar busqueda web en informes (Tavily):" -ForegroundColor Cyan
Write-Host "  1. Crear cuenta gratis en: https://app.tavily.com  (sin tarjeta)" -ForegroundColor Cyan
Write-Host "  2. Copiar tu API key (empieza con tvly-...)" -ForegroundColor Cyan
Write-Host "  3. En Netlify: Site settings > Environment variables > Agregar TAVILY_API_KEY" -ForegroundColor Cyan
Write-Host "  Sin esta variable el sistema sigue funcionando con casos hardcoded." -ForegroundColor Yellow
Write-Host ""
Write-Host "Presiona cualquier tecla para cerrar..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
