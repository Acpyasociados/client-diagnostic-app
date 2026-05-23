import { getStore } from '@netlify/blobs';

export default async (event, context) => {
  console.log('=== Save Case Notes Handler START ===');

  try {
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Método HTTP no permitido' })
      };
    }

    // Parse body
    let data;
    if (typeof event.body === 'string') {
      data = JSON.parse(event.body);
    } else if (event.body && typeof event.body === 'object') {
      data = event.body;
    } else {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Body inválido' })
      };
    }

    const { token, order_id, note } = data;
    const adminToken = process.env.ADMIN_REVIEW_TOKEN;

    // Validate token
    if (!token || token !== adminToken) {
      console.error('Invalid or missing token');
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Token inválido o faltante' })
      };
    }

    // Validate order_id and note
    if (!order_id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Falta order_id' })
      };
    }

    if (!note || !note.action) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Falta note con action (create|update|delete)' })
      };
    }

    const casesStore = getStore('cases');

    // Get current case
    const caseDataJson = await casesStore.get(order_id);
    if (!caseDataJson) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Caso no encontrado' })
      };
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
        return {
          statusCode: 404,
          body: JSON.stringify({ error: 'Nota no encontrada' })
        };
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
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Action inválida (debe ser create|update|delete)' })
      };
    }

    // Update case with new notes
    caseData.advisor_notes = updatedNotes;
    caseData.updated_at = now;

    // Save updated case
    await casesStore.set(order_id, JSON.stringify(caseData));

    console.log('Case notes saved:', order_id);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: `Nota ${note.action}da exitosamente`,
        notes: updatedNotes
      })
    };

  } catch (error) {
    console.error('Save Case Notes Error:', {
      message: error.message,
      stack: error.stack
    });

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Error interno al guardar notas',
        message: error.message
      })
    };
  }
};
