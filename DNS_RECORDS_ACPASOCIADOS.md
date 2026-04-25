# 🔐 DNS Records para acpasociados.cl en Resend

**Dominio:** acpasociados.cl  
**Registrador:** NIC.cl  
**Email:** onboarding@acpasociados.cl  

---

## 📋 REGISTROS A AGREGAR EN NIC.cl

Debes agregar estos 4 registros DNS. Cópialos exactamente como están.

### ✅ REGISTRO 1: DKIM (Domain Verification)

| Campo | Valor |
|-------|-------|
| **Type** | TXT |
| **Name** | resend._domainkey |
| **Value** | `p=MIGfMA0CSqGSIb3DQEBAQUAA6GNADCB1QKBgQDA4mMo11m/XjvnRRA2TPH1MDyXqqJSf/Mq/dJx7pDhFooGZFU1Xkz8r2qSq1X2gaH/7E4Y5cFyEoE4+SyCoCezY3B6agYXigYsAdnNIPA8JGC0cYTcZLyyTz2zu55RgM7azTeJ6r1g8vVMh6YbymjXrgpU3fxouePDTeRwIDBAB` |
| **TTL** | 3600 (o Auto) |

---

### ✅ REGISTRO 2: SPF (Envío de emails)

| Campo | Valor |
|-------|-------|
| **Type** | TXT |
| **Name** | send |
| **Value** | `v=spf1 include:ses.amazonaws.com ~all` |
| **TTL** | 3600 (o Auto) |

---

### ✅ REGISTRO 3: MX (Mail Exchange)

| Campo | Valor |
|-------|-------|
| **Type** | MX |
| **Name** | send |
| **Value** | `feedback-smtp.sa-east-1.amazonses.com` |
| **Priority** | 10 |
| **TTL** | 3600 (o Auto) |

---

### ✅ REGISTRO 4: DMARC (Optional pero recomendado)

| Campo | Valor |
|-------|-------|
| **Type** | TXT |
| **Name** | _dmarc |
| **Value** | `v=DMARC1; p=none;` |
| **TTL** | 3600 (o Auto) |

---

## 🚀 PASOS PARA AGREGAR EN NIC.cl

1. Ve a https://www.nic.cl
2. Inicia sesión con tu cuenta
3. Ve a **Mis Dominios** → **acpasociados.cl**
4. Busca la sección **Zona DNS** o **Registros DNS**
5. Haz clic en **Agregar Registro**
6. Copia cada registro exactamente (Type, Name, Value)
7. **IMPORTANTE:** Espera 5-15 minutos para que se propague (a veces demora más)

---

## ✔️ DESPUÉS DE AGREGAR

Una vez que agregues todos los registros en NIC.cl:
1. Vuelve a la página de Resend (veremos en el siguiente paso)
2. Haz clic en **"Verify records"**
3. Resend verificará que los registros estén correctos
4. Si todo está bien, tu dominio quedará ✅ Verified

---

## ⚠️ IMPORTANTE

- **No confundas Name y Value** - cada uno va en su lugar
- Algunos registros tienen el mismo **Name** (ej: "send"), eso es normal
- Los valores tienen caracteres especiales → cópialos exactamente
- Si hay error, verifica que NO haya espacios al inicio o final

---

**Siguiente paso:** Me avisas cuando termines de agregar los registros en NIC.cl y volvemos a Resend a verificar.
