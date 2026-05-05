import { getStore } from '@netlify/blobs';

const STORE_NAME = 'diagnostic-leads';

export async function saveLead(leadId, data) {
  const store = getStore(STORE_NAME);
  await store.set(leadId, JSON.stringify(data, null, 2));
  return data;
}

export async function getLead(leadId) {
  const store = getStore(STORE_NAME);
  const data = await store.get(leadId);
  return data ? JSON.parse(data) : null;
}
