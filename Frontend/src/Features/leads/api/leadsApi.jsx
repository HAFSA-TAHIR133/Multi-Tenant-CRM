import { fetchApi } from '../../../api/fetchApiHelper';

const unwrap = async (promise) => {
  try {
    const response = await promise;
    return response?.data?.data ?? response?.data ?? response ?? null;
  } catch (error) {
    throw error;
  }
};

export const leadsApi = {
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/leads?${queryString}` : '/leads';
    return unwrap(fetchApi(endpoint, { method: 'GET' }));
  },

  getById: (id) => {
    return unwrap(fetchApi(`/leads/${id}`, { method: 'GET' }));
  },

  create: (leadData) => {
    return unwrap(fetchApi('/leads', { method: 'POST', body: leadData }));
  },

  update: (id, leadData) => {
    return unwrap(fetchApi(`/leads/${id}`, { method: 'PUT', body: leadData }));
  },

  delete: (id) => {
    return unwrap(fetchApi(`/leads/${id}`, { method: 'DELETE' }));
  },

  getHistory: (id) => {
    return unwrap(fetchApi(`/leads/${id}/history`, { method: 'GET' }));
  },

  updateStage: (id, stageId) => {
    return unwrap(fetchApi(`/leads/${id}/stage`, { method: 'PUT', body: { stageId } }));
  },

  updateStatus: (id, status) => {
    return unwrap(fetchApi(`/leads/${id}/status`, { method: 'PUT', body: { status } }));
  },

  assignLead: (id, assignedUserId) => {
    return unwrap(fetchApi(`/leads/${id}/assign`, { method: 'PATCH', body: { assignedUserId } }));
  },

  getDocuments: (id) => {
    return unwrap(fetchApi(`/leads/${id}/documents`, { method: 'GET' }));
  },

  uploadDocument: (id, fileOrFormData) => {
    let body;
    if (fileOrFormData instanceof FormData) {
      body = fileOrFormData;
    } else {
      body = new FormData();
      body.append('file', fileOrFormData);
    }
    return unwrap(fetchApi(`/leads/${id}/documents/upload`, { method: 'POST', body }));
  },

  deleteDocument: (leadId, documentId) => {
    return unwrap(fetchApi(`/leads/${leadId}/documents/${documentId}`, { method: 'DELETE' }));
  },
};

export default leadsApi;