# ============================================
# PUSH A GITHUB - SCRIPT AUTOMATIZADO
# ============================================

Write-Host "🔍 Buscando la carpeta del proyecto..." -ForegroundColor Cyan

# Intenta en diferentes ubicaciones
$posibles_rutas = @(
    "C:\Users\Admin\Documents\ACP y Asociados",
    "C:\Users\Admin\Documents\Claude\Projects\Acp y Asociados",
    "$env:USERPROFILE\Documents\ACP y Asociados",
    "$env:USERPROFILE\Documents\Claude\Projects\Acp y Asociados"
)

$carpeta_encontrada = $null

foreach ($ruta in $posibles_rutas) {
    if (Test-Path $ruta) {
        Write-Host "✅ Carpeta encontrada: $ruta" -ForegroundColor Green
        $carpeta_encontrada = $ruta
        break
    }
}

if (-not $carpeta_encontrada) {
    Write-Host "❌ No se encontró la carpeta del proyecto en ninguna ubicación esperada" -ForegroundColor Red
    Write-Host "Rutas buscadas:" -ForegroundColor Yellow
    $posibles_rutas | ForEach-Object { Write-Host "  - $_" }
    exit 1
}

# Navega a la carpeta
cd $carpeta_encontrada

Write-Host "`n🔄 Verificando configuración git..." -ForegroundColor Cyan
git remote -v
Write-Host ""

# Verifica que estemos en main
$rama_actual = git rev-parse --abbrev-ref HEAD
if ($rama_actual -ne "main") {
    Write-Host "⚠️  Estás en rama: $rama_actual (esperaba: main)" -ForegroundColor Yellow
    Write-Host "Cambiando a rama main..." -ForegroundColor Cyan
    git checkout main
}

# Verifica estado
Write-Host "`n📋 Estado del repositorio:" -ForegroundColor Cyan
git status

# Pregunta confirmación antes de hacer push
Write-Host "`n⚠️  LISTO PARA HACER PUSH A GITHUB" -ForegroundColor Yellow
Write-Host "Esto enviará todos los cambios a: https://github.com/patriciosilvavalenzuela/client-diagnostic-app.git" -ForegroundColor Yellow
$confirmacion = Read-Host "¿Continuar? (s/n)"

if ($confirmacion -eq "s" -or $confirmacion -eq "S") {
    Write-Host "`n🚀 Haciendo push..." -ForegroundColor Green
    git push -u origin main

    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✅ PUSH EXITOSO!" -ForegroundColor Green
        Write-Host "Los cambios fueron enviados a GitHub." -ForegroundColor Green
        Write-Host "`n⏳ Netlify iniciará el deploy automáticamente en 5-10 segundos" -ForegroundColor Cyan
        Write-Host "Monitorea en: https://app.netlify.com/sites/acp-asociados/deploys" -ForegroundColor Cyan
    } else {
        Write-Host "`n❌ Hubo un error en el push" -ForegroundColor Red
        Write-Host "Verifica tu conexión a internet y que tengas permisos en el repositorio" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ Push cancelado" -ForegroundColor Yellow
}

Write-Host "`n"
