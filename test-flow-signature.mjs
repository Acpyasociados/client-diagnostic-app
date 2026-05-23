import crypto from 'crypto';

// Las credenciales que estás usando
const API_KEY = "7407DEBF-783B-4C84-9FB4-43C4L344D745";
const SECRET_KEY = "419fd1dc315b285498f60189ae50507c1df2dd6a";

// Función de firma exactamente como está en el código
function generateFlowSignature(params, secret) {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}${params[key]}`)
    .join('');
  return crypto.createHash('sha256').update(sortedParams + secret).digest('hex');
}

// Parámetros mínimos para una prueba
const testParams = {
  apiKey: API_KEY,
  commerceOrder: "TEST-1234",
  subject: "Test",
  amount: 1000,
  email: "test@test.com",
  currency: "CLP",
  urlReturn: "http://example.com/return",
  urlConfirm: "http://example.com/confirm"
};

console.log('🔐 ANÁLISIS DE FIRMA FLOW\n');
console.log('API Key:', API_KEY);
console.log('Secret Key:', SECRET_KEY);
console.log('\n---\n');

console.log('Parámetros de prueba:');
console.log(JSON.stringify(testParams, null, 2));
console.log('\n---\n');

const sig = generateFlowSignature(testParams, SECRET_KEY);
console.log('Firma generada:', sig);
console.log('\n---\n');

// Ahora vamos a simular lo que Flow debería hacer para verificar
console.log('📋 VERIFICACIÓN DE FLOW (simulada):');
const sortedParams = Object.keys(testParams)
  .sort()
  .map(key => `${key}${testParams[key]}`)
  .join('');
console.log('String concatenado:', sortedParams);
console.log('\nCon secret:', sortedParams + SECRET_KEY);
console.log('\nHash SHA256:', sig);

// Análisis del API Key
console.log('\n---\n');
console.log('⚠️ ANÁLISIS DEL API KEY:');
console.log('Longitud:', API_KEY.length);
console.log('Contiene "L" (letra):', API_KEY.includes('L'));
console.log('Índices de "L":', [...API_KEY].map((c, i) => c === 'L' ? i : null).filter(x => x !== null));

// Verificar si es un carácter extraño
const charCode = API_KEY.charCodeAt(18); // Índice de la "L"
console.log(`Código del carácter en posición 18: ${charCode} (${String.fromCharCode(charCode)})`);

// Alternativos posibles
console.log('\n---\n');
console.log('🔄 POSIBLES CORRECCIONES:');
const alt1 = API_KEY.replace('L', '1');
console.log('Si fuera "1" (número uno):', alt1);
console.log('Firma con alternativa:', generateFlowSignature({...testParams, apiKey: alt1}, SECRET_KEY));

const alt2 = API_KEY.replace('L', 'I');
console.log('\nSi fuera "I" (letra I):', alt2);
console.log('Firma con alternativa:', generateFlowSignature({...testParams, apiKey: alt2}, SECRET_KEY));
