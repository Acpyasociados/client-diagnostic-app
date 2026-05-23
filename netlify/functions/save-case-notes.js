import { getStore } from '@netlify/blobs';

function json(statusCode, body) {
  return new Response(JSON.stringify(body), {
    status: statusCode,
    headers: { 'Content-Type': 'application/json' }
  });
}

export default async (req) => {
  console.log('=== Save Case Notes Handler START ===');

  try {
    if (req.method !== 'POST') {
      return json(405, { error: 'Método HTTP no permitido' });
    }

    // Parse body
    let data;
    try {
      const bodyText = await req.text();
      data = JSON.parse(bodyText);
    } catch (e) {
      return json(400, { error: 'Body inválido' });
    }

    const { token, order_id, note } = data;
    const adminToken = process.env.ADMIN_REVIEW_TOKEN;

    // Validate token
    if (!token || token !== adminToken) {
      console.error('Invalid or missing token');
      return json(401, { error: 'Token inválido o faltante' });
    }

    // Validate order_id and note
    if (!order_id) {
      return json(400, { error: 'Falta order_id' });
    }

    if (!note || !note.action) {
      return json(400, { error: 'Falta note con action (create|update|delete)' });
    }

    const casesStore = getStore('cases');

    // Get current case
    const caseDataJson = await casesStore.get(order_id);
    if (!caseDataJson) {
      return json(404, { error: 'Caso no encontrado' });
    }

    const caseData = JSON.parse(caseDataJson);

    // Initialize notes array if needed
    if (!caseData.advisor_notes) {
      caseData.advisor_notes = [];
    }

    const now = new Date().toISOString();
    let updatedNotes = [...caseData.advisor_notes];

    // Handle different actions
    if (note.action === 'create') {
      // Create new note
      const newNote = {
        id: `note-${Date.now()}`,
        text: note.text,
        created_at: now,
        updated_at: now
      };
      updatedNotes.push(newNote);
      console.log('Note created:', newNote.id);

    } else if (note.action === 'update') {
      // Update existing note
      const noteIndex = updatedNotes.findIndex(n => n.id === note.id);
      if (noteIndex === -1) {
        return json(404, { error: 'Nota no encontrada' });
      }
      updatedNotes[noteIndex] = {
        ...updatedNotes[noteIndex],
        text: note.text,
        updated_at: now
      };
      console.log('Note updated:', note.id);

    } else if (note.action === 'delete') {
      // Delete note
      updatedNotes = updatedNotes.filter(n => n.id !== note.id);
      console.log('Note deleted:', note.id);

    } else {
      return json(400, { error: 'Action inválida (debe ser create|update|delete)' });
    }

    // Update case with new notes
    caseData.advisor_notes = updatedNotes;
    caseData.updated_at = now;

    // Save updated case
    await casesStore.set(order_id, JSON.stringify(caseData));

    console.log('Case notes saved:', order_id);

    return json(200, {
      success: true,
      message: `Nota ${note.action}da exitosamente`,
      notes: updatedNotes
    });

  } catch (error) {
    console.error('Save Case Notes Error:', {
      message: error.message,
      stack: error.stack
    });

    return json(500, {
      error: 'Error interno al guardar notas',
      message: error.message
    });
  }
};
