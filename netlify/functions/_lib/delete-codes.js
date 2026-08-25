/**
 * delete-codes.js
 * Maneja códigos temporales para confirmación de derecho al olvido
 * Almacena en Netlify Blobs con expiración (15 minutos)
 */

import crypto from 'crypto';
import { getStore } from '@netlify/blobs';

const CODES_STORE = 'delete-codes';
const CODE_EXPIRY_MINUTES = 15;

/**
 * Genera un código de 6 dígitos aleatorio
 */
export function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Guarda código vinculado a un email con timestamp de expiración
 */
export async function saveCode(email, code) {
  const store = getStore(CODES_STORE);
  const expiresAt = Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000;

  const codeData = {
    email: email.toLowerCase().trim(),
    code,
    createdAt: new Date().toISOString(),
    expiresAt,
  };

  // Guardar con clave = código
  await store.set(code, JSON.stringify(codeData));
  return codeData;
}

/**
 * Recupera y valida un código
 * @returns {Promise<{email: string} | null>} email si es válido, null si expiró
 */
export async function validateCode(code) {
  const store = getStore(CODES_STORE);
  const data = await store.get(code);

  if (!data) return null; // No existe

  let codeData;
  try {
    codeData = JSON.parse(data);
  } catch (e) {
    return null; // Corrupted
  }

  // Verificar expiración
  if (Date.now() > codeData.expiresAt) {
    await store.delete(code); // Limpiar código expirado
    return null;
  }

  return { email: codeData.email };
}

/**
 * Elimina un código después de usarlo
 */
export async function deleteCode(code) {
  const store = getStore(CODES_STORE);
  await store.delete(code);
}
