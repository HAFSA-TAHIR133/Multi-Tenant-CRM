import { fetchApi } from '../../../api/fetchApiHelper';

export const notesApi = {
  getNotesForTask: (taskId) => fetchApi(`/taskNotes/${taskId}/notes`),

  createNote: (taskId, payload) =>fetchApi(`/taskNotes/${taskId}/notes`, {
      method: 'POST',
      body: payload,
    }),
};