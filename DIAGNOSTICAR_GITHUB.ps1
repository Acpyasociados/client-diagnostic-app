# ============================================
# DIAGNOSTICAR ACCESO A GITHUB
# ============================================

Write-Host "🔍 Diagnosticando acceso a GitHub..." -ForegroundColor Cyan
Write-Host ""

# Navega a la carpeta
cd "C:\Users\Admin\Documents\Claude\Projects\Acp y Asociados"

# Verifica configuración git
Write-Host "📋 Configuración git actual:" -ForegroundColor Yellow
Write-Host "Remoto origin:" -ForegroundColor Cyan
git remote -v
Write-Host ""

# Intenta listar repositorios (requiere gh cli)
Write-Host "🔐 Verificando credenciales de GitHub..." -ForegroundColor Yellow

# Primero intenta con git fetch (sin cambios, solo verificar acceso)
Write-Host "Intentando conectar a GitHub..." -ForegroundColor Cyan
git fetch origin 2>&1 | Select-String -Pattern "fatal|error|success" -ErrorAction SilentlyContinue

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Conexión exitosa a GitHub" -ForegroundColor Green
} else {
    Write-Host "❌ No se pudo conectar a GitHub" -ForegroundColor Red
    Write-Host ""
    Write-Host "⚠️  El repositorio 'client-diagnostic-app' no existe o no tienes acceso" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "OPCIONES:" -ForegroundColor Cyan
    Write-Host "1. Si el repo cambió de nombre, actualiza el remoto:" -ForegroundColor White
    Write-Host "   git remote set-url origin https://github.com/USUARIO/NUEVO_NOMBRE.git" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Si no tienes un repositorio en GitHub, crea uno:" -ForegroundColor White
    Write-Host "   - Abre https://github.com/new" -ForegroundColor Gray
    Write-Host "   - Crea un repositorio público o privado" -ForegroundColor Gray
    Write-Host "   - Copia la URL HTTPS" -ForegroundColor Gray
    Write-Host "   - Luego ejecuta: git remote set-url origin URL_COPIADA" -ForegroundColor Gray
    Write-Host ""
    Write-Host "3. Si ya tienes un repositorio, verifica que tienes credenciales:" -ForegroundColor White
    Write-Host "   - Abre Administrador de credenciales Windows" -ForegroundColor Gray
    Write-Host "   - Busca credenciales para github.com" -ForegroundColor Gray
    Write-Host "   - Verifica que el usuario y token sean correctos" -ForegroundColor Gray
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "¿QUÉ REPOSITORIO TIENES EN GITHUB?" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Opción A: Abre https://github.com/patriciosilvavalenzuela?tab=repositories" -ForegroundColor White
Write-Host "Opción B: Dime el nombre del repositorio y lo configuramos aquí" -ForegroundColor White
Write-Host ""
