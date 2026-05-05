# Sistema semi-automático de diagnóstico de clientes

## Qué incluye
- Landing con formulario inicial
- Checkout con Mercado Pago Checkout Pro
- Cuestionario sectorial por rubro
- Motor de diagnóstico basado en reglas
- Revisión humana interna
- Envío final por email

## Rubros soportados
- Servicios profesionales
- Comercio / e-commerce
- Servicios en terreno

## Flujo
1. Cliente completa formulario inicial.
2. El sistema crea el caso y envía al checkout.
3. Mercado Pago aprueba el pago y dispara webhook.
4. El cliente recibe cuestionario sectorial por email.
5. El sistema genera borrador del informe.
6. Tú abres la vista de revisión y apruebas.
7. El cliente recibe el informe por correo.

## Variables de entorno
Copia `.env.example` y carga estas variables en Netlify:
- `SITE_URL`
- `MERCADOPAGO_ACCESS_TOKEN`
- `PRICE_BASIC_CLP`
- `PRICE_PREMIUM_CLP`
- `RESEND_API_KEY`
- `FROM_EMAIL`
- `REVIEWER_EMAIL`
- `ADMIN_REVIEW_TOKEN`

## Despliegue en Netlify
1. Sube este proyecto a GitHub.
2. Crea un nuevo sitio en Netlify desde ese repositorio.
3. Netlify detectará `netlify.toml` automáticamente.
4. En **Site configuration > Environment variables**, agrega todas las variables.
5. En **Deploys**, vuelve a desplegar el sitio.

## Configuración de Mercado Pago
1. Crea tu aplicación en Mercado Pago Developers.
2. Copia el Access Token productivo.
3. En Checkout Pro no necesitas frontend SDK para esta versión: la preferencia se crea desde `submit-lead`.
4. Configura webhook con esta URL:
   - `https://tu-sitio.netlify.app/api/mercadopago-webhook`
5. Haz una compra de prueba y valida que el caso cambie a `pagado`.

## Configuración de Resend
1. Crea cuenta gratuita.
2. Verifica dominio o remitente.
3. Usa un email autorizado como `FROM_EMAIL`.
4. El reviewer interno debe quedar en `REVIEWER_EMAIL`.

## Revisión humana
Cuando el cliente complete el cuestionario, te llegará un correo con el enlace a `review.html`.

Formato:
`https://tu-sitio.netlify.app/review.html?lead_id=LEAD_ID&token=ADMIN_REVIEW_TOKEN`

## Intervención manual obligatoria
Solo debes intervenir en 2 puntos:
- revisar borrador
- aprobar envío

## Checklist de prueba
- [ ] El formulario inicial envía al checkout
- [ ] El pago aprobado dispara webhook
- [ ] Llega email con cuestionario
- [ ] El cuestionario guarda respuestas
- [ ] Se genera borrador interno
- [ ] Se puede aprobar y enviar

## Lo que deberías ajustar antes de vender
- texto comercial del landing
- precios básico/premium
- remitente de email real
- copy del informe final
- thresholds de reglas por sector


## Seguridad
- Credenciales sensibles (API keys, tokens) se configuran únicamente en Netlify UI
- - Nunca commit credentials a GitHub
  - - Rotación de credenciales: 4 de mayo de 2026
