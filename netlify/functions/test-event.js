export default async (event, context) => {
  console.log('=== TEST-EVENT START ===');
  console.log('Event keys:', Object.keys(event).sort());
  console.log('Event.body exists:', 'body' in event);
  console.log('Event.body type:', typeof event.body);
  console.log('Event.body value (first 100 chars):', event.body ? String(event.body).substring(0, 100) : 'NULL/UNDEFINED');
  console.log('Event.rawBody exists:', 'rawBody' in event);
  console.log('Event.rawBody type:', typeof event.rawBody);
  console.log('Event.headers:', event.headers);
  console.log('Event.httpMethod:', event.httpMethod);
  console.log('=== TEST-EVENT END ===');

  return new Response(JSON.stringify({
    received: true,
    bodyExists: 'body' in event,
    bodyIsNull: event.body === null,
    bodyIsUndefined: event.body === undefined,
    bodyType: typeof event.body,
    eventKeys: Object.keys(event).sort()
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
