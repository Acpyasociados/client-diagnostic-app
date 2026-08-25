# 🔐 ENCRIPTACIÓN - SETUP INSTRUCCIONES

## ¿QUÉ SE ENCRIPTA?

Datos sensibles (PII) en Netlify Blobs:
- ✅ **email**
- ✅ **name** (nombre del usuario)
- ✅ **company** (nombre empresa)

NO se encriptan:
- ❌ sector (no es PII)
- ❌ monthly_sales (agregado)
- ❌ main_problem (contexto)
- ❌ metadatos (created_at, payment_status, etc.)

---

## CONFIGURACIÓN REQUERIDA

### 1. Generar Clave de Encriptación (32 bytes)

En PowerShell:

```powershell
# Abre Node.js
node

# En la consola de Node:
const crypto = require('crypto');
const key = crypto.randomBytes(32);
console.log(key.toString('base64'));
```

Ejemplo de salida:
```
rZ3k9L2jQ8mNvWx4pY6sT1uAb5cDeFgHiJkLmNoPqR7sT8uVwXyZ0aB1cD2eF3gH4i=
```

**Copiar este valor.**

---

### 2. Guardar en Netlify Environment Variables

**En Netlify Dashboard:**

1. Abre https://app.netlify.com/sites/acp-asociados/settings/deploys
2. Busca "Environment variables" → "Post processing"
3. Click "Edit variables"
4. Click "New variable"
5. **Name:** `ENCRYPTION_KEY`
6. **Value:** Pega la clave generada (base64)
7. Click "Save"

**Resultado:**
```
ENCRYPTION_KEY = rZ3k9L2jQ8mNvWx4pY6sT1uAb5cDeFgHiJkLmNoPqR7sT8uVwXyZ0aB1cD2eF3gH4i=
```

---

### 3. Verificar Configuración

**Test: Ejecutar función que usa encriptación**

Después de setup, nuevos leads se encriptarán automáticamente:

```bash
# Haz un submit en /gratis.html

# En Netlify Blobs (diagnostic-leads):
# email: "pY6sT1uAb5cDeFgHiJkL...base64..." ← encriptado
# name: "mNoPqR7sT8uVwXyZ0aB1...base64..."   ← encriptado
# company: "cD2eF3gH4iJkLmNoPqR7...base64..." ← encriptado
```

---

## CÓMO FUNCIONA

### Encriptación (al guardar)

```
1. Usuario envía: { email: "user@example.com", name: "Juan" }
   ↓
2. free-diagnostic.js recibe
   ↓
3. encryptObject(data) transforma:
   { email: "rZ3k9L2jQ8mNvWx4...base64", name: "pY6sT1uAb5cD...base64" }
   ↓
4. Guarda en Netlify Blobs (encriptado)
   ↓
5. API retorna: { email: "user@example.com", name: "Juan" } ← sin encriptar
```

---

### Desencriptación (al leer)

```
1. getLead(leadId)
   ↓
2. Lee de Blobs: { email: "rZ3k9L2jQ8...base64" }
   ↓
3. decryptObject() recupera:
   { email: "user@example.com", name: "Juan" }
   ↓
4. Retorna: datos originales
```

---

## SEGURIDAD

### ¿Por qué es seguro?

1. **AES-256-GCM**
   - Estándar de encriptación military-grade
   - Autenticación (imposible tampering)
   - 256-bit = 2^256 posibilidades

2. **IV único (Initialization Vector)**
   - Cada encriptación genera IV diferente
   - Mismo plaintext = diferentes ciphertexts
   - Imposible patrones

3. **Clave segura**
   - 32 bytes random
   - Guardada en env var (no en código)
   - Rotate periódicamente si es necesario

### ¿Qué NO protege?

- ❌ Metadatos no encriptados (timestamps, IDs)
- ❌ Acceso a env vars de Netlify (requiere admin)
- ❌ Backdoors en Netlify o Node.js

### Mejoras Futuras (Fase 3)

- ✅ Key rotation (cambiar clave periódicamente)
- ✅ Encriptación en tránsito (HTTPS + TLS)
- ✅ Auditoría de acceso a keys
- ✅ Hardware Security Module (HSM)

---

## TROUBLESHOOTING

### "Encriptación deshabilitada" (warning en logs)

**Causa:** ENCRYPTION_KEY no definida

**Solución:**
1. Verifica que esté en Netlify Environment Variables
2. Redeploy el sitio (Netlify → Deploy)
3. Espera 2-3 minutos para que aplique

```bash
# En logs (Netlify dashboard):
✅ "ENCRYPTION_KEY" encontrada
```

---

### Datos viejos no encriptados

**Esperado:** Sprint 2 solo encripta datos nuevos

**Datos antes de implementación:** sin encriptar (históricos)

**Migración:** Implementada en Sprint 3 (opcional)

---

### Error "Error desencriptando"

**Causa:** Formato corrupto o clave incorrecta

**Acción:** El dato se retorna sin desencriptar (fail-safe)

**Prevención:**
- No cambiar ENCRYPTION_KEY sin migración
- Si cambias, datos viejos serán ilegibles

---

## CHECKLIST SETUP

```
✅ Generar clave (crypto.randomBytes)
✅ Copiar en base64
✅ Agregar a Netlify Environment Variables
✅ Verificar nombre: ENCRYPTION_KEY
✅ Redeploy en Netlify
✅ Esperar 2-3 minutos
✅ Test: Enviar form en /gratis.html
✅ Verificar logs: "ENCRYPTION_KEY encontrada"
✅ Revisar Blobs: email/name/company encriptados
```

---

## REFERENCIAS

- **Algoritmo:** AES-256-GCM (crypto.createCipheriv)
- **IV:** 12 bytes random
- **Auth Tag:** 128 bits
- **Encoding:** Base64 + hex

**Código:** `netlify/functions/_lib/encryption.js`

---

**Setup completado:** ✅ Si ENCRYPTION_KEY está en Netlify env vars  
**Verificación:** Revisar logs + Blobs al hacer test submit  
**Status:** Sprint 2 ready once variables están definidas
