/**
 * Validation utilities for ACP Diagnostic System
 * Provides RUT, email, phone, and input sanitization functions
 */

import { getStore } from '@netlify/blobs';

/**
 * Validate Chilean RUT with check digit verification (módulo 11)
 * Input: "12.345.678-9" or "123456789"
 * Output: { valid: boolean, formatted: "12.345.678-9", error: string }
 */
export function validateRUT(rutInput) {
  if (!rutInput) {
    return { valid: false, error: 'RUT es requerido' };
  }

  // Clean: remove dots and dash
  let rut = rutInput.toString().replace(/\./g, '').replace(/-/g, '').trim();

  // Check format: must be 8-9 characters
  if (rut.length < 8 || rut.length > 9) {
    return { valid: false, error: 'RUT debe tener 8-9 caracteres' };
  }

  // Split number and check digit
  const number = rut.substring(0, rut.length - 1);
  const checkDigit = rut.substring(rut.length - 1).toUpperCase();

  // Validate number is numeric
  if (!/^\d+$/.test(number)) {
    return { valid: false, error: 'RUT debe contener solo números (excepto el dígito verificador)' };
  }

  // Calculate check digit using módulo 11
  let sum = 0;
  let multiplier = 2;

  for (let i = number.length - 1; i >= 0; i--) {
    sum += parseInt(number[i], 10) * multiplier;
    multiplier++;
    if (multiplier > 7) multiplier = 2;
  }

  const remainder = sum % 11;
  let calculatedDigit = 11 - remainder;

  if (calculatedDigit === 11) {
    calculatedDigit = 0;
  } else if (calculatedDigit === 10) {
    calculatedDigit = 'K';
  } else {
    calculatedDigit = calculatedDigit.toString();
  }

  // Verify check digit
  if (checkDigit !== calculatedDigit.toString()) {
    return { valid: false, error: `RUT inválido. El dígito verificador debe ser ${calculatedDigit}` };
  }

  // Format: XX.XXX.XXX-X
  const formatted = `${number.substring(0, number.length - 6)}.${number.substring(number.length - 6, number.length - 3)}.${number.substring(number.length - 3)}-${checkDigit}`;

  return { valid: true, formatted, error: null };
}

/**
 * Validate email format and check for duplicates in database
 * Input: "user@example.com"
 * Output: { valid: boolean, isDuplicate: boolean, error: string }
 */
export async function validateEmail(email, excludeId = null) {
  if (!email) {
    return { valid: false, isDuplicate: false, error: 'Email es requerido' };
  }

  // Basic email regex validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, isDuplicate: false, error: 'Email tiene un formato inválido' };
  }

  // Check for duplicates in diagnostic-leads store
  try {
    const leadsStore = getStore('diagnostic-leads');
    const casesStore = getStore('cases');

    // Check in leads
    const { blobs: leadBlobs } = await leadsStore.list();
    for (const blob of leadBlobs) {
      if (excludeId && blob.key === excludeId) continue;
      const data = await leadsStore.get(blob.key);
      if (data) {
        const lead = JSON.parse(data);
        if (lead.email && lead.email.toLowerCase() === email.toLowerCase()) {
          return { valid: true, isDuplicate: true, error: 'Este email ya está registrado' };
        }
      }
    }

    // Check in cases
    const { blobs: caseBlobs } = await casesStore.list();
    for (const blob of caseBlobs) {
      if (excludeId && blob.key === excludeId) continue;
      const data = await casesStore.get(blob.key);
      if (data) {
        const caseData = JSON.parse(data);
        if (caseData.email && caseData.email.toLowerCase() === email.toLowerCase()) {
          return { valid: true, isDuplicate: true, error: 'Este email ya está registrado' };
        }
      }
    }
  } catch (e) {
    console.error('Error checking email duplicates:', e.message);
    // Don't fail on store errors, just skip duplicate check
  }

  return { valid: true, isDuplicate: false, error: null };
}

/**
 * Validate Chilean phone number format: +56 9 XXXX XXXX
 * Input: "+56 9 1234 5678" or "56912345678" or "+56912345678"
 * Output: { valid: boolean, formatted: "+56 9 XXXX XXXX", error: string }
 */
export function validatePhone(phone) {
  if (!phone) {
    return { valid: false, error: 'Teléfono es requerido' };
  }

  // Clean: remove spaces, dashes, parentheses
  let cleaned = phone.toString().replace(/[\s\-()]/g, '');

  // Remove leading + if present
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }

  // Remove leading 56 if present (Chilean country code)
  if (cleaned.startsWith('56')) {
    cleaned = cleaned.substring(2);
  }

  // Must be mobile (starts with 9) and 8 digits
  if (cleaned.length !== 8 || !cleaned.startsWith('9')) {
    return { valid: false, error: 'Teléfono debe ser un móvil chileno (9 XXXX XXXX)' };
  }

  // Must be all digits
  if (!/^\d{8}$/.test(cleaned)) {
    return { valid: false, error: 'Teléfono debe contener solo números' };
  }

  // Format: +56 9 XXXX XXXX
  const formatted = `+56 9 ${cleaned.substring(0, 4)} ${cleaned.substring(4)}`;

  return { valid: true, formatted, error: null };
}

/**
 * Sanitize HTML input to prevent XSS attacks
 * Escapes special characters and limits length
 * Input: "<script>alert('xss')</script>"
 * Output: "&lt;script&gt;alert('xss')&lt;/script&gt;"
 */
export function sanitizeHTML(text, maxLength = 500) {
  if (!text) {
    return '';
  }

  // Limit length
  let sanitized = text.toString().substring(0, maxLength);

  // Escape HTML special characters
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');

  // Replace multiple spaces with single space (but preserve line breaks)
  sanitized = sanitized.replace(/  +/g, ' ');

  return sanitized;
}

/**
 * Validate number is within acceptable range
 * Input: value=50, min=0, max=100, fieldName="Margen"
 * Output: { valid: boolean, error: string }
 */
export function validateRange(value, min, max, fieldName = 'Valor') {
  const num = parseFloat(value);

  if (isNaN(num)) {
    return { valid: false, error: `${fieldName} debe ser un número` };
  }

  if (num < min) {
    return { valid: false, error: `${fieldName} debe ser mayor o igual a ${min}` };
  }

  if (num > max) {
    return { valid: false, error: `${fieldName} debe ser menor o igual a ${max}` };
  }

  return { valid: true, error: null };
}

/**
 * Validate required fields exist and are not empty
 * Input: data = { name: "Juan", email: "" }, required = ["name", "email"]
 * Output: { valid: boolean, missingFields: array, error: string }
 */
export function validateRequired(data, requiredFields) {
  const missingFields = [];

  for (const field of requiredFields) {
    const value = data[field];
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      missingFields.push(field);
    }
  }

  if (missingFields.length > 0) {
    return {
      valid: false,
      missingFields,
      error: `Campos requeridos faltantes: ${missingFields.join(', ')}`
    };
  }

  return { valid: true, missingFields: [], error: null };
}

/**
 * Get error message for a specific field
 */
export function getFieldError(fieldName, validationResult) {
  if (validationResult && validationResult.error) {
    return validationResult.error;
  }
  return null;
}
