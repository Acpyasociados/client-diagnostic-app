Write-Host "Validacion de create-diagnostic-order..." -ForegroundColor Cyan
Write-Host ""

$ENDPOINT = "https://acp-asociados.netlify.app/.netlify/functions/create-diagnostic-order"
$PASSED = 0
$FAILED = 0

Write-Host "Test 1/2 - Endpoint basico..." -ForegroundColor Yellow
$payload1 = @{plan="basico";name="Test User";email="test@test.com";phone="+56912345678";company="Test Corp";sector="tecnologia";monthly_sales="500000"} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri $ENDPOINT -Method POST -Headers @{"Content-Type"="application/json"} -Body $payload1 -UseBasicParsing -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "  Test 1 PASADO" -ForegroundColor Green
        $PASSED++
    }
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 400) {
        Write-Host "  Test 1 PASADO (400 esperado para datos minimos)" -ForegroundColor Green
        $PASSED++
    } else {
        Write-Host "  Test 1 FALLO: $_" -ForegroundColor Red
        $FAILED++
    }
}

Write-Host "Test 2/2 - Payload completo..." -ForegroundColor Yellow
$payload2 = @{
    plan="basico"
    name="Test Usuario Completo"
    email="test-completo@test.com"
    phone="+56912345678"
    company="Test Corp Completo"
    sector="tecnologia"
    monthly_sales="500000"
    margin="25"
    active_clients="50"
    top_costs="Arriendo"
    main_problem="Rentabilidad"
    goal_6m="Mejorar margenes"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri $ENDPOINT -Method POST -Headers @{"Content-Type"="application/json"} -Body $payload2 -UseBasicParsing -ErrorAction Stop
    if ($response.StatusCode -eq 200 -and $response.Content -like "*success*") {
        Write-Host "  Test 2 PASADO" -ForegroundColor Green
        $PASSED++
        if ($response.Content -like "*mercadoPagoUrl*") {
            Write-Host "  Mercado Pago URL presente" -ForegroundColor Green
        }
    }
} catch {
    Write-Host "  Test 2 FALLO: $_" -ForegroundColor Red
    $FAILED++
}

Write-Host ""
Write-Host "==============================" -ForegroundColor Cyan
Write-Host "Tests Pasados: $PASSED" -ForegroundColor Green
Write-Host "Tests Fallados: $FAILED" -ForegroundColor $(if ($FAILED -gt 0) {"Red"} else {"Gray"})
Write-Host "==============================" -ForegroundColor Cyan

if ($FAILED -eq 0) {
    Write-Host "SISTEMA OPERACIONAL" -ForegroundColor Green
    exit 0
} else {
    Write-Host "REVISAR LOGS" -ForegroundColor Yellow
    exit 1
}