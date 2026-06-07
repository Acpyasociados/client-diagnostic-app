# ---------------------------------------------------------
# test-e2e.ps1
# Ejecuta la prueba E2E completa sin pago real.
# Crea un lead de prueba con pago aprobado y envia los emails.
# ---------------------------------------------------------

$siteUrl    = "https://acp-asociados.netlify.app"
$adminToken = Read-Host "Ingresa tu ADMIN_REVIEW_TOKEN"

# Datos del cliente de prueba (puedes cambiarlos)
$testEmail   = Read-Host "Email del cliente de prueba (Enter = patriciosilvavalenzuela@gmail.com)"
if ([string]::IsNullOrWhiteSpace($testEmail)) { $testEmail = "patriciosilvavalenzuela@gmail.com" }

$testName    = "Patricio Silva"
$testCompany = "Empresa Test SpA"
$testSector  = "servicios_terreno"
$testPlan    = "basico"

Write-Host ""
Write-Host "Creando lead de prueba..." -ForegroundColor Cyan

$body = @{
    token   = $adminToken
    email   = $testEmail
    name    = $testName
    company = $testCompany
    sector  = $testSector
    plan    = $testPlan
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod `
        -Uri "$siteUrl/.netlify/functions/dev-simulate-payment" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body

    Write-Host ""
    Write-Host "LEAD DE PRUEBA CREADO" -ForegroundColor Green
    Write-Host "-------------------------------------------------" -ForegroundColor DarkGray
    Write-Host "Lead ID  : $($response.lead_id)" -ForegroundColor White
    Write-Host ""
    Write-Host "Emails enviados:" -ForegroundColor Yellow
    Write-Host "  Cliente : $($response.emails.cliente.to) -> $($response.emails.cliente.enviado)" -ForegroundColor White
    Write-Host "  Asesor  : $($response.emails.asesor.to) -> $($response.emails.asesor.enviado)" -ForegroundColor White
    Write-Host ""
    Write-Host "URLs del flujo:" -ForegroundColor Yellow
    Write-Host "  1. Cuestionario (cliente):" -ForegroundColor Cyan
    Write-Host "     $($response.urls.cuestionario)" -ForegroundColor White
    Write-Host "  2. Revision del borrador (asesor):" -ForegroundColor Cyan
    Write-Host "     $($response.urls.revision)" -ForegroundColor White
    Write-Host "  3. Panel de seguimiento:" -ForegroundColor Cyan
    Write-Host "     $($response.urls.admin)" -ForegroundColor White
    Write-Host ""
    Write-Host "Pasos siguientes:" -ForegroundColor Yellow
    $response.instrucciones | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
    Write-Host ""

    $open = Read-Host "Abrir cuestionario en el navegador? (S/N)"
    if ($open -eq "S" -or $open -eq "s") {
        Start-Process $response.urls.cuestionario
    }

} catch {
    Write-Host ""
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        Write-Host $reader.ReadToEnd() -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Presiona cualquier tecla para cerrar..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
