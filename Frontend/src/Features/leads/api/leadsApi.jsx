import { fetchApi } from '../../../api/fetchApiHelper';

export const leadsApi = {
  getAll: () => fetchApi('/leads'),
  getById: (id) => fetchApi(`/leads/${id}`),
  create: (data) => fetchApi('/leads', { method: 'POST', body: data }),
  update: (id, data) => fetchApi(`/leads/${id}`, { method: 'PUT', body: data }),
  remove: (id) => fetchApi(`/leads/${id}`, { method: 'DELETE' }),
  getHistory: (id) => fetchApi(`/leads/${id}/history`),
};