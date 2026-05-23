import crypto from 'crypto';

const FLOW_API_KEY = "7407DEBF-783B-4C84-9FB4-43C4L344D745";
const FLOW_SECRET_KEY = "419fd1dc315b285498f60189ae50507c1df2dd6a";

function generateFlowSignature(params, secret) {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}${params[key]}`)
    .join('');
  console.log('Sorted params string:', sortedParams);
  console.log('\nWith secret:', sortedParams + secret);
  return crypto.createHash('sha256').update(sortedParams + secret).digest('hex');
}

const flowParams = {
  apiKey: FLOW_API_KEY,
  commerceOrder: "ACP-1779549090010-baadf40d",
  subject: "Diagnóstico ACP - Tecnología Chile SpA",
  amount: 1000,
  email: "patriciosilvavalenzuela@gmail.com",
  currency: "CLP",
  urlReturn: "https://acp-asociados.netlify.app/flow-success.html?orderId=ACP-1779549090010-baadf40d",
  urlConfirm: "https://acp-asociados.netlify.app/.netlify/functions/flow-webhook"
};

console.log('Parameters:');
console.log(JSON.stringify(flowParams, null, 2));
console.log('\n---\n');

const sig = generateFlowSignature(flowParams, FLOW_SECRET_KEY);
console.log('\nGenerated signature:', sig);
console.log('Expected signature from logs: f71d2d2d3d6bbba6d032e9561cf0de7d22194738628968286efcbf12820c0967');
console.log('Match:', sig === 'f71d2d2d3d6bbba6d032e9561cf0de7d22194738628968286efcbf12820c0967');
