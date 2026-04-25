# Instrucciones de Despliegue - Aplicación de Diagnóstico

## Estado del Proyecto

✅ **PROYECTO LISTO PARA DESPLIEGUE EN NETLIFY**

El sistema está 100% funcional. El ciclo completo está implementado:
- Cliente completa formulario → Pago Mercado Pago → Cuestionario → Informe Automático → Revisión Humana → Email Entrega

## Pasos para Desplegar

### 1. Acceder a Netlify

- Ve a https://app.netlify.com
- Selecciona tu proyecto "client-diagnostic-app" o crea uno nuevo
- Conecta tu repositorio de GitHub

### 2. Configurar Variables de Entorno

En **Netlify → Site Settings → Environment variables**, agrega las siguientes variables:

```
SITE_URL = https://tu-dominio.netlify.app
MERCADOPAGO_ACCESS_TOKEN = APP_USR-xxxx (ya tienes este valor)
PRICE_BASIC_CLP = 99000
PRICE_PREMIUM_CLP = 199000
RESEND_API_KEY = re_xxxx (ya tienes este valor)
FROM_EMAIL = onboarding@tu-dominio.com
REVIEWER_EMAIL = tu-correo@empresa.com
ADMIN_REVIEW_TOKEN = un-token-seguro-largo
```

**Notas importantes:**
- `FROM_EMAIL` debe estar verificado en Resend (https://resend.com)
- `ADMIN_REVIEW_TOKEN` puede ser cualquier string largo y único (úsalo en los links de revisión)
- `SITE_URL` es la URL que Netlify asigne a tu sitio

### 3. Desplegar

Opción A: Automático desde GitHub
- Haz push a la rama main
- Netlify desplegar automáticamente

Opción B: Manual
- En Netlify, clic en "Deploy site"
- Espera a que termine

### 4. Verificar Despliegue

El build debe completar exitosamente. Si hay errores:
- Ve a **Netlify → Deploys**
- Haz clic en el deploy fallido
- Ve a "Deploy log" para ver los errores
- Los errores comunes son: falta de variables de entorno

### 5. Probar el Sistema End-to-End

1. **Paso 1: Formulario Inicial**
   - Ve a `https://tu-dominio.netlify.app`
   - Completa el formulario con datos de prueba
   - Selecciona plan "Básico"
   - Haz clic en "Continuar a pago"

2. **Paso 2: Pago de Prueba**
   - Serás redirigido a Mercado Pago
   - En ambiente de prueba, usa tarjeta: `4111 1111 1111 1111`
   - Vencimiento: cualquier fecha futura
   - CVV: 123
   - Nombre: Prueba
   - Email: tu correo

3. **Paso 3: Verificar Email**
   - Deberías recibir un email con el link al cuestionario
   - Si no llega, revisa spam o verifica que `FROM_EMAIL` está verificado en Resend

4. **Paso 4: Completar Cuestionario**
   - Abre el link del email
   - Completa el cuestionario con números realistas
   - Haz clic en "Enviar cuestionario"

5. **Paso 5: Revisor Aprueba**
   - Usa este link (reemplaza valores):
     `https://tu-dominio.netlify.app/review.html?lead_id=ID_DEL_LEAD&token=ADMIN_REVIEW_TOKEN`
   - El revisor verá el informe generado
   - Haz clic en "Aprobar y enviar"

6. **Paso 6: Verificar Email Final**
   - El cliente debe recibir el informe completo

## Troubleshooting

### Error 502 Bad Gateway
- Verifica que todas las variables de entorno están configuradas
- Revisa el Deploy log en Netlify

### Emails no llegan
- Verifica que `FROM_EMAIL` está verificado en Resend (https://resend.com/emails)
- Verifica que `RESEND_API_KEY` es correcto

### Mercado Pago no funciona
- Verifica que `MERCADOPAGO_ACCESS_TOKEN` es correcto (debe empezar con APP_USR-)
- En producción, usa un token de APP_USR producción, no prueba

### Lead no se guarda
- Verifica que la variable `SITE_URL` es correcta
- Los datos se guardan en Netlify Blobs automáticamente

## Ambiente de Prueba vs Producción

### Mercado Pago
- **Prueba**: Usa tarjeta `4111 1111 1111 1111` (de prueba)
- **Producción**: Usa token APP_USR de producción

### Resend
- Para usar tu dominio real, necesitas:
  1. Agregar un registro DNS en tu proveedor de dominio
  2. Verificar en https://resend.com
  3. Cambiar `FROM_EMAIL` a tu dominio

## Estructura del Proyecto

```
client-diagnostic-app/
├── index.html                    ← Formulario inicial
├── questionnaire.html            ← Cuestionario sectorial
├── review.html                   ← Panel de revisión
├── success.html                  ← Confirmación de pago
├── cancel.html                   ← Cancelación
├── assets/
│   └── style.css
├── netlify/
│   └── functions/
│       ├── submit-lead.js        ← Crea lead y checkout
│       ├── mercadopago-webhook.js ← Procesa pagos
│       ├── submit-questionnaire.js ← Procesa respuestas
│       ├── get-questionnaire.js   ← Obtiene preguntas
│       ├── get-review-case.js     ← Obtiene caso para revisor
│       ├── approve-report.js      ← Aprueba informe
│       └── _lib/
│           ├── storage.js        ← Persistencia (Netlify Blobs)
│           ├── questions.js      ← Definiciones
│           ├── report.js         ← Generación de informes
│           └── email.js          ← Integración Resend
├── netlify.toml                 ← Config de Netlify
├── package.json
└── .env.example
```

## Soporte

Si tienes problemas:

1. **Revisa el Deploy log**: Netlify → Deploys → Build log
2. **Verifica variables de entorno**: Netlify → Site settings → Environment variables
3. **Prueba localmente**: 
   ```bash
   npm install
   npx netlify dev
   ```

## Seguridad

- ✅ Tokens de cliente únicos generados para cada lead
- ✅ Validación de token en todas las operaciones
- ✅ Email verificado requerido (Resend)
- ✅ ADMIN_REVIEW_TOKEN protege el panel de revisión
- ✅ Datos guardados en Netlify Blobs (encriptado)

---

**¡Tu aplicación está lista para el mercado!**

Cualquier pregunta, consulta la documentación en `ESTADO_PROYECTO.md` dentro del repositorio.
