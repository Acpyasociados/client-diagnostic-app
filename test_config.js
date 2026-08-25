// Test de configuración del proyecto
import { getStore } from '@netlify/blobs';

console.log('=== VERIFICACIÓN DE CONFIGURACIÓN ===\n');

// Variables de entorno requeridas
const envVars = {
  'SITE_URL': process.env.SITE_URL,
  'MERCADO_PAGO_ACCESS_TOKEN': process.env.MERCADO_PAGO_ACCESS_TOKEN ? '✅ Configurado' : '❌ Falta',
  'MERCADO_PAGO_WEBHOOK_SECRET': process.env.MERCADO_PAGO_WEBHOOK_SECRET ? '✅ Configurado' : '❌ Falta',
  'PRICE_BASIC_CLP': process.env.PRICE_BASIC_CLP,
  'PRICE_PREMIUM_CLP': process.env.PRICE_PREMIUM_CLP,
  'RESEND_API_KEY': process.env.RESEND_API_KEY ? '✅ Configurado' : '❌ Falta',
  'ADVISOR_EMAIL': process.env.ADVISOR_EMAIL,
};

console.log('Variables de Entorno:');
Object.entries(envVars).forEach(([key, value]) => {
  console.log(`  ${key}: ${value}`);
});

// Verificar acceso a Blobs
console.log('\nAcceso a Blobs Storage:');
try {
  const caseStore = getStore('cases');
  const leadsStore = getStore('diagnostic-leads');
  console.log('  ✅ Acceso a blobs funcional');
} catch (err) {
  console.log(`  ❌ Error: ${err.message}`);
}

console.log('\n=== FIN DE VERIFICACIÓN ===');
