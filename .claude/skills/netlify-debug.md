# Netlify Functions Debugging Skill - ACP y Asociados

## Contexto del Proyecto
**Proyecto:** ACP y Asociados - Plataforma de diagnostico empresarial
**URL:** https://acp-asociados.netlify.app
**Funcion Critica:** create-diagnostic-order.js
**Error Principal:** event.body null al recibir POST

## Tipos de Error y Soluciones

### Error TYPE_A: body is null
**Fix:** Validacion temprana + logging

### Error TYPE_B: body.text is not a function
**Fix:** Response wrapper

### Error TYPE_C: JSON.parse failed
**Fix:** Fallback URLSearchParams

## Workflow Automatico
1. Revisar logs Netlify (cada hora)
2. Detectar error
3. Aplicar fix apropiado
4. Commit + push
5. Esperar deploy
6. Validar
7. Reportar

## Comandos Auto-Aprobados
- git add netlify/functions/*
- git commit -m "Auto-fix: ..."
- git push origin main

## Tests de Validacion
Endpoint: https://acp-asociados.netlify.app/.netlify/functions/create-diagnostic-order
Resultado esperado: success: true, mercadoPagoUrl presente
