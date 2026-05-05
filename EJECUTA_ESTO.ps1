# SOLUCIÓN DEFINITIVA - VERSIÓN SIMPLE

Write-Host "`n=== SOLUCIÓN DEFINITIVA ===" -ForegroundColor Cyan
Write-Host "Limpiando GitHub y actualizando Render`n" -ForegroundColor Yellow

# PASO 1: Force Push a GitHub
Write-Host "PASO 1: Force push a GitHub (limpia historial sin .env)" -ForegroundColor Green

$repoPath = "C:\Users\Admin\Documents\Claude\Projects\Acp y Asociados\acp-backend"
cd $repoPath

Write-Host "Ejecutando: git push origin main --force" -ForegroundColor Magenta
git push origin main --force

if ($?) {
    Write-Host "OK - GitHub limpiado" -ForegroundColor Green
} else {
    Write-Host "ADVERTENCIA - Verifica que tengas acceso a GitHub" -ForegroundColor Yellow
}

# PASO 2: Instrucciones para Render
Write-Host "`nPASO 2: Actualizar credenciales en Render" -ForegroundColor Green

$menuRendar = @"

ABRE: https://dashboard.render.com

1. Selecciona 'acp-backend'
2. Ve a Settings -> Environment
3. BUSCA: SENDGRID_API_KEY
4. HAGO:
   a) Borra el valor actual
   b) Abre: https://app.sendgrid.com/settings/api_keys
   c) Crea NUEVA API Key (Full Access)
   d) Copia el valor (empieza con SG.)
   e) Pega en Render
   f) Click SAVE
5. ESPERA 3-5 minutos (Deploy)

PRESIONA ENTER cuando hayas terminado en Render
"@

Write-Host $menuRendar -ForegroundColor Cyan
Read-Host "Presiona ENTER"

# PASO 3: Test SendGrid
Write-Host "`nPASO 3: Probando SendGrid" -ForegroundColor Green

$apiKey = Read-Host "Pega la NUEVA SendGrid API Key (SG.xxxxx)"

$headers = @{
    "Authorization" = "Bearer $apiKey"
    "Content-Type" = "application/json"
}

$body = @{
    personalizations = @(@{
        to = @(@{ email = "asesor.pac@gmail.com" })
        subject = "Test - ACP Sistema"
    })
    from = @{ email = "noreply@acp.cl"; name = "ACP" }
    content = @(@{
        type = "text/html"
        value = "<h2>Test SendGrid</h2><p>Si recibes esto, funciona OK</p>"
    })
} | ConvertTo-Json -Depth 10

Write-Host "Enviando email de prueba..." -ForegroundColor Magenta

try {
    $response = Invoke-WebRequest `
        -Uri "https://api.sendgrid.com/v3/mail/send" `
        -Method POST `
        -Headers $headers `
        -Body $body `
        -TimeoutSec 10

    if ($response.StatusCode -eq 202) {
        Write-Host "OK - Email enviado (Status 202)" -ForegroundColor Green
        Write-Host "Verifica: asesor.pac@gmail.com" -ForegroundColor Green
    }
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

# PASO 4: Test Backend
Write-Host "`nPASO 4: Test del backend" -ForegroundColor Green

$testBody = @{
    name = "Test"
    email = "test@example.com"
    phone = "+56912345678"
    company = "Empresa Test"
    sector = "tecnologia"
    monthly_sales = "5000000"
    margin = "20"
    active_clients = "25"
    top_costs = "Salarios"
    main_channel = "Facebook"
    main_problem = "costos_altos"
    goal_6m = "Crecer"
    plan = "basico"
    finalPrice = 49900
} | ConvertTo-Json

Write-Host "Enviando formulario al backend..." -ForegroundColor Magenta

try {
    $response = Invoke-WebRequest `
        -Uri "https://acp-backend-g3io.onrender.com/api/submit-lead" `
        -Method POST `
        -ContentType "application/json" `
        -Body $testBody `
        -TimeoutSec 60

    if ($response.StatusCode -eq 200) {
        Write-Host "OK - Backend responde correctamente (Status 200)" -ForegroundColor Green
        $result = $response.Content | ConvertFrom-Json
        Write-Host "Lead ID: $($result.lead_id)" -ForegroundColor Green
    }
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== COMPLETADO ===" -ForegroundColor Cyan
Write-Host "Sistema deberia estar operativo ahora" -ForegroundColor Green
Write-Host "Verifica email en: asesor.pac@gmail.com`n" -ForegroundColor Yellow

Read-Host "Presiona ENTER para salir"
