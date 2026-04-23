// In-memory storage for leads during the diagnostic process
// This allows the form submission flow to work without requiring external services
const leadsStore = new Map();

export async function saveLead(leadId, data) {
  leadsStore.set(leadId, data);
  return data;
}

export async function getLead(leadId) {
  return leadsStore.get(leadId);
}
