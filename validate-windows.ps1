# ============================================================================
# Script de Validación - ACP y Asociados (Windows PowerShell)
# ============================================================================
# Ejecuta tests contra el endpoint de producción
# ============================================================================

Write-Host "🧪 Iniciando validación de create-diagnostic-order..." -ForegroundColor Cyan
Write-Host ""

$ENDPOINT = "https://acp-asociados.netlify.app/.netlify/functions/create-diagnostic-order"
$PASSED = 0
$FAILED = 0

# ============================================================================
# Test 1: Endpoint Básico
# ============================================================================

Write-Host "[Test 1/3] Endpoint básico con payload mínimo..." -ForegroundColor Yellow

$payload1 = @{
    plan = "test"
} | ConvertTo-Json

try {
    $response1 = Invoke-WebRequest -Uri $ENDPOINT `
        -Method POST `
        -Headers @{"Content-Type"="application/json"} `
        -Body $payload1 `
        -UseBasicParsing `
        -ErrorAction Stop
    
    $statusCode1 = $response1.StatusCode
    
    if ($statusCode1 -eq 200 -or $statusCode1 -eq 400) {
        Write-Host "  ✅ Test 1 PASADO (HTTP $statusCode1)" -ForegroundColor Green
        $PASSED++
    } else {
        Write-Host "  ❌ Test 1 FALLÓ (HTTP $statusCode1)" -ForegroundColor Red
        Write-Host "  Response: $($response1.Content)" -ForegroundColor Gray
        $FAILED++
    }
    
} catch {
    $statusCode1 = $_.Exception.Response.StatusCode.value__
    
    if ($statusCode1 -eq 200 -or $statusCode1 -eq 400) {
        Write-Host "  ✅ Test 1 PASADO (HTTP $statusCode1)" -ForegroundColor Green
        $PASSED++
    } else {
        Write-Host "  ❌ Test 1 FALLÓ (HTTP $statusCode1)" -ForegroundColor Red
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Gray
        $FAILED++
    }
}

Write-Host ""

# ============================================================================
# Test 2: Payload Completo
# ============================================================================

Write-Host "[Test 2/3] Payload completo con todos los campos..." -ForegroundColor Yellow

$payload2 = @{
    plan = "basico"
    name = "Test Usuario Validacion"
    email = "test@validation.local"
    phone = "+56912345678"
    company = "Test Corp Validacion"
    sector = "tecnologia"
    monthly_sales = "500000"
    margin = "25"
    active_clients = "50"
    top_costs = "Arriendo"
    main_problem = "Rentabilidad"
    goal_6m = "Mejorar margenes"
} | ConvertTo-Json

try {
    $response2 = Invoke-WebRequest -Uri $ENDPOINT `
        -Method POST `
        -Headers @{"Content-Type"="application/json"} `
        -Body $payload2 `
        -UseBasicParsing `
        -ErrorAction Stop
    
    $statusCode2 = $response2.StatusCode
    $body2 = $response2.Content
    
    if ($statusCode2 -eq 200 -and $body2 -like "*success*") {
        Write-Host "  ✅ Test 2 PASADO (HTTP $statusCode2, success=true)" -ForegroundColor Green
        $PASSED++
        
        if ($body2 -like "*mercadoPagoUrl*") {
            Write-Host "  ✅ Mercado Pago URL presente en response" -ForegroundColor Green
        } else {
            Write-Host "  ⚠️ Mercado Pago URL no encontrado (revisar)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "  ❌ Test 2 FALLÓ (HTTP $statusCode2)" -ForegroundColor Red
        Write-Host "  Response: $body2" -ForegroundColor Gray
        $FAILED++
    }
    
} catch {
    $statusCode2 = $_.Exception.Response.StatusCode.value__
    Write-Host "  ❌ Test 2 FALLÓ (HTTP $statusCode2)" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Gray
    $FAILED++
}

Write-Host ""

# ============================================================================
# Test 3: Verificar logs recientes
# ============================================================================

Write-Host "[Test 3/3] Verificando logs recientes en Netlify..." -ForegroundColor Yellow
Write-Host "  ℹ️ (Este test requiere acceso a Netlify API vía Claude Code)" -ForegroundColor Cyan
Write-Host "  ⏭️ Saltando por ahora - ejecutar manualmente con Claude Code" -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# Resumen
# ============================================================================

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "📊 RESUMEN DE VALIDACIÓN" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "✅ Tests Pasados: $PASSED" -ForegroundColor Green
Write-Host "❌ Tests Fallados: $FAILED" -ForegroundColor $(if ($FAILED -gt 0) { "Red" } else { "Gray" })
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

if ($FAILED -eq 0) {
    Write-Host "🎉 VALIDACIÓN EXITOSA - Sistema operacional" -ForegroundColor Green
    exit 0
} else {
    Write-Host "⚠️ VALIDACIÓN FALLÓ - Revisar logs" -ForegroundColor Yellow
    exit 1
}
