import { fetchApi } from '../../../api/fetchApiHelper';

export const notesApi = {
  getNotesForTask: (taskId) => fetchApi(`/taskComments/${taskId}/comments`),

  createNote: (taskId, payload) =>fetchApi(`/taskComments/${taskId}/comments`, {
      method: 'POST',
      body: payload,
    }),
};
