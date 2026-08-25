@echo off
echo === Deploy Fix Flow - ACP Asociados ===
echo.

cd /d "C:\Users\Admin\Documents\Claude\Projects\Acp y Asociados"

echo [1/5] Limpiando lock de git...
if exist ".git\index.lock" del /f ".git\index.lock"
if exist ".git\MERGE_HEAD" del /f ".git\MERGE_HEAD"

echo [2/5] Agregando archivos corregidos...
git add netlify/functions/flow-create-payment.js
git add netlify/functions/flow-webhook.js

echo [3/5] Haciendo commit...
git commit -m "fix: Corregir firma Flow - HMAC-SHA256 y urlConfirmation"

echo [4/5] Haciendo push a GitHub...
git push origin main

echo [5/5] Listo! Netlify desplegara automaticamente en 1-2 minutos.
echo.
echo Abre https://app.netlify.com/projects/acp-asociados para verificar el deploy.
pause
