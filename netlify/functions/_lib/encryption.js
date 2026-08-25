/**
 * encryption.js
 * ─────────────────────────────────────────────────────────────────────
 * Encriptación simétrica para datos sensibles (PII) en Netlify Blobs
 *
 * Usa: crypto.createCipheriv (AES-256-GCM)
 * Clave: ENCRYPTION_KEY (env var - 32 bytes base64)
 *
 * Datos encriptados:
 *   - email
 *   - name (nombre del usuario)
 *   - company (nombre empresa)
 *
 * No se encriptan:
 *   - sector (público)
 *   - monthly_sales (agregado)
 *   - main_problem (contexto)
 *   - created_at, payment_status (metadatos)
 * ─────────────────────────────────────────────────────────────────────
 */

import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!ENCRYPTION_KEY) {
  console.warn('⚠️ ENCRYPTION_KEY no definida. Encriptación deshabilitada.');
}

/**
 * Encripta un valor usando AES-256-GCM
 * @param {string} plaintext - Valor a encriptar
 * @returns {string|null} Base64 "iv:authTag:encryptedData" o null si no hay clave
 */
export function encrypt(plaintext) {
  if (!ENCRYPTION_KEY || !plaintext) return plaintext; // Sin encriptación si falta clave

  try {
    const key = Buffer.from(ENCRYPTION_KEY, 'base64');
    const iv = crypto.randomBytes(12); // 12 bytes para GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Formato: base64(iv:authTag:encrypted)
    const combined = `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    return Buffer.from(combined).toString('base64');
  } catch (err) {
    console.error('Error en encrypt:', err);
    return plaintext; // Falla segura
  }
}

/**
 * Desencripta un valor
 * @param {string} ciphertext - Valor encriptado (base64 format)
 * @returns {string} Valor original o ciphertext si no se puede desencriptar
 */
export function decrypt(ciphertext) {
  if (!ENCRYPTION_KEY || !ciphertext) return ciphertext;

  try {
    const combined = Buffer.from(ciphertext, 'base64').toString();
    const [ivHex, authTagHex, encrypted] = combined.split(':');

    if (!ivHex || !authTagHex || !encrypted) {
      return ciphertext; // No es encriptado
    }

    const key = Buffer.from(ENCRYPTION_KEY, 'base64');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (err) {
    console.warn('Error desencriptando:', err.message);
    return ciphertext; // Retorna original si falla
  }
}

/**
 * Encripta objeto completo (fields específicos)
 * @param {object} obj - Objeto con datos
 * @returns {object} Objeto con campos encriptados
 */
export function encryptObject(obj) {
  if (!obj) return obj;

  const fieldsToEncrypt = ['email', 'name', 'company'];
  const encrypted = { ...obj };

  for (const field of fieldsToEncrypt) {
    if (encrypted[field]) {
      encrypted[field] = encrypt(encrypted[field]);
    }
  }

  return encrypted;
}

/**
 * Desencripta objeto completo
 * @param {object} obj - Objeto con campos encriptados
 * @returns {object} Objeto con datos desencriptados
 */
export function decryptObject(obj) {
  if (!obj) return obj;

  const fieldsToDecrypt = ['email', 'name', 'company'];
  const decrypted = { ...obj };

  for (const field of fieldsToDecrypt) {
    if (decrypted[field]) {
      decrypted[field] = decrypt(decrypted[field]);
    }
  }

  return decrypted;
}
