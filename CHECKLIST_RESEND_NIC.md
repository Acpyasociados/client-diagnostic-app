# ✅ CHECKLIST: Verificación Dominio en Resend + NIC.cl

## ESTADO ACTUAL

- ✅ Cuenta Resend creada
- ✅ Dominio acpasociados.cl agregado en Resend
- ✅ DNS Records generados por Resend
- ⏳ **PENDIENTE:** Agregar DNS records en NIC.cl
- ⏳ **PENDIENTE:** Verificar dominio en Resend
- ⏳ **PENDIENTE:** Copiar API Key de Resend

---

## 📋 PASO SIGUIENTE: Agregar DNS en NIC.cl

### Ubicación en NIC.cl:
1. Ir a https://www.nic.cl
2. Inicia sesión
3. Busca el dominio **acpasociados.cl**
4. Haz clic en pestaña **"Avanzados"**
5. Busca **"Zona DNS"** o **"Registros DNS"**

### Registros a agregar (4 total):

#### REGISTRO 1 - DKIM
```
Type:  TXT
Name:  resend._domainkey
Value: p=MIGfMA0CSqGSIb3DQEBAQUAA6GNADCB1QKBgQDA4mMo11m/XjvnRRA2TPH1MDyXqqJSf/Mq/dJx7pDhFooGZFU1Xkz8r2qSq1X2gaH/7E4Y5cFyEoE4+SyCoCezY3B6agYXigYsAdnNIPA8JGC0cYTcZLyyTz2zu55RgM7azTeJ6r1g8vVMh6YbymjXrgpU3fxouePDTeRwIDBAB
TTL:   3600
```

#### REGISTRO 2 - SPF
```
Type:  TXT
Name:  send
Value: v=spf1 include:ses.amazonaws.com ~all
TTL:   3600
```

#### REGISTRO 3 - MX
```
Type:     MX
Name:     send
Value:    feedback-smtp.sa-east-1.amazonses.com
Priority: 10
TTL:      3600
```

#### REGISTRO 4 - DMARC (opcional)
```
Type:  TXT
Name:  _dmarc
Value: v=DMARC1; p=none;
TTL:   3600
```

---

## ⏱️ DESPUÉS DE AGREGAR EN NIC.cl

1. Espera 5-15 minutos para propagación
2. Vuelve a Resend
3. Haz clic en **"Verify records"** (botón que veremos después)
4. Si está todo OK, tu dominio quedará verificado ✅

---

## 🔑 DESPUÉS: Copiar API Key

Una vez verificado el dominio:
1. Ve a **API Keys** en Resend (menu izquierdo)
2. Copia el **API Key** (empieza con `re_`)
3. Guarda en archivo seguro

---

**SIGUIENTE PASO:** Agregalos en NIC.cl → Verifica en Resend → Copias API Key → Continuamos con Mercado Pago
