Write-Host "Monitoreo continuo iniciado..." -ForegroundColor Cyan
Write-Host "Frecuencia: Cada 1 hora" -ForegroundColor Cyan
Write-Host ""

$iteration = 1

while ($true) {
    $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$ts] Iteracion $iteration - Ejecutando check..." -ForegroundColor Yellow
    
    try {
        claude -p "Ejecuta el agente netlify-monitor para revisar logs y aplicar fixes si es necesario"
        Write-Host "[$ts] Check completado" -ForegroundColor Green
    } catch {
        Write-Host "[$ts] Error: $_" -ForegroundColor Yellow
    }
    
    Write-Host "[$ts] Esperando 1 hora..." -ForegroundColor Cyan
    Write-Host ""
    
    $iteration++
    Start-Sleep -Seconds 3600
}
