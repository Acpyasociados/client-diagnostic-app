# Diagnóstico: Error 502 en Envío de Formulario

## Problema Identificado ✓

El formulario de diagnóstico está devolviendo **error 502 Bad Gateway** cuando intenta enviar la información. 

**Causa Raíz**: Las variables de entorno necesarias **no están configuradas en Netlify**:
- `SENDGRID_API_KEY` - Para enviar emails
- `MERCADO_PAGO_ACCESS_TOKEN` - Para crear preferencias de pago

## Error en los Logs

```
Error: Error al procesar
POST /.netlify/functions/create-diagnostic-order → 502 Bad Gateway
```

## Flujo del Sistema (Actual vs Esperado)

### ❌ Flujo Actual (Con Error):
```
1. Usuario llena formulario
2. Click en "Continuar al Pago"
3. Fetch POST a función Netlify
4. Función intenta leer variables de entorno (undefined)
5. Falla al conectar a SendGrid/Mercado Pago
6. Error 502 retornado al cliente
```

### ✅ Flujo Esperado (Después de Configurar):
```
1. Usuario llena formulario
2. Click en "Continuar al Pago"
3. Fetch POST a función Netlify
4. Función procesa datos del formulario
5. Envía email a asesor.pac@gmail.com con detalles
6. Envía email de confirmación al cliente
7. Crea preferencia de pago en Mercado Pago
8. Retorna URL de checkout de Mercado Pago
9. Redirige a usuario para completar pago
```

## Solución: 2 Opciones

### Opción 1: Configurar Manualmente en Netlify (Recomendado)

1. Obtén tus credenciales:
   - SendGrid API Key: https://app.sendgrid.com/settings/api_keys
   - Mercado Pago Token: https://www.mercadopago.com/developers/panel/credentials

2. Ve a Netlify:
   - https://app.netlify.com/sites/acp-asociados/settings/env

3. Agrega las variables:

   | Key | Value |
   |-----|-------|
   | `SENDGRID_API_KEY` | Tu SendGrid API Key |
   | `MERCADO_PAGO_ACCESS_TOKEN` | Tu Mercado Pago Access Token |
   | `SENDGRID_FROM_EMAIL` | noreply@acp-asociados.com |

4. Click en **Save**
5. Espera 2-3 minutos a que Netlify redeploy

### Opción 2: Usar Script CLI (Si tienes Netlify CLI instalado)

```bash
cd "Acp y Asociados"
chmod +x setup-env-cli.sh
./setup-env-cli.sh
```

El script te pedirá las credenciales y las configurará automáticamente.

## Verificación Post-Configuración

1. Actualiza el navegador en https://acp-asociados.netlify.app/
2. Llena el formulario completamente
3. Click en "Continuar al Pago"
4. Deberías recibir dos emails:
   - **A asesor.pac@gmail.com**: Detalles completos del lead
   - **A tu email de cliente**: Confirmación de solicitud
5. Se abrirá una ventana de Mercado Pago para completar el pago

## Código del Backend

La función `/netlify/functions/create-diagnostic-order.js` hace lo siguiente:

1. ✅ Valida que sea POST
2. ✅ Parsea los datos del formulario
3. 🔴 Lee SENDGRID_API_KEY (falla sin configurar)
4. 🔴 Lee MERCADO_PAGO_ACCESS_TOKEN (falla sin configurar)
5. Crea preferencia de pago en Mercado Pago API
6. Envía email al asesor
7. Envía email de confirmación al cliente
8. Retorna URL de Mercado Pago

## Archivos de Apoyo

- **SETUP_ENV_VARS.md**: Instrucciones detalladas paso a paso
- **setup-env-cli.sh**: Script automatizado (Netlify CLI)
- **.env.example**: Variables requeridas (sin valores reales)

## Próximos Pasos

1. ✅ Obtén tus credenciales de SendGrid y Mercado Pago
2. ✅ Configura las variables en Netlify (Opción 1 o 2)
3. ✅ Espera el redeploy automático
4. ✅ Prueba el formulario
5. ✅ Verifica que los emails lleguen correctamente

## Soporte

Si tienes problemas:

1. Verifica que las credenciales sean válidas (cópialas correctamente)
2. Revisa los logs de Netlify Functions:
   - https://app.netlify.com/sites/acp-asociados → Functions → create-diagnostic-order
3. Verifica que SendGrid tenga email verificado
4. Verifica que Mercado Pago esté en ambiente de producción (no sandbox)

---

**Estado del Sistema**:
- ✅ Frontend: Funciona correctamente
- ✅ Función Netlify: Código correcto (node-fetch removido, usando fetch nativo)
- ✅ netlify.toml: Configurado correctamente
- ❌ Variables de Entorno: **FALTA CONFIGURAR**

**Estimado de Tiempo**: 5-10 minutos para resolver
