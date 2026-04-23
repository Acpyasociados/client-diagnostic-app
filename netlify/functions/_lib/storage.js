import { getStore } from '@netlify/blobs';

const store = getStore('diagnostic-cases');

export async function saveLead(leadId, data) {
  await store.setJSON(leadId, data);
  return data;
}

export async function getLead(leadId) {
  return store.get(leadId, { type: 'json' });
}
