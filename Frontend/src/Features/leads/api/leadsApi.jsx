import { fetchApi } from '../../../api/fetchApiHelper';

const unwrap = async (promise) => {
  const response = await promise;
  return response?.data ?? response;
};

export const leadsApi = {
  // GET /leads
  getLeads: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/leads?${queryString}` : '/leads';
    return unwrap(
      fetchApi(endpoint, {
        method: 'GET',
      })
    );
  },

  // Alias
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/leads?${queryString}` : '/leads';
    return unwrap(
      fetchApi(endpoint, {
        method: 'GET',
      })
    );
  },

  // GET /leads/:id
  getLeadById: (id) => {
    return unwrap(
      fetchApi(`/leads/${id}`, {
        method: 'GET',
      })
    );
  },

  // Alias
  getById: (id) => {
    return unwrap(
      fetchApi(`/leads/${id}`, {
        method: 'GET',
      })
    );
  },

  // POST /leads
  createLead: (leadData) => {
    return unwrap(
      fetchApi('/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(leadData),
      })
    );
  },

  // PUT /leads/:id
  updateLead: (id, leadData) => {
    return unwrap(
      fetchApi(`/leads/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(leadData),
      })
    );
  },

  // DELETE /leads/:id
  deleteLead: (id) => {
    return unwrap(
      fetchApi(`/leads/${id}`, {
        method: 'DELETE',
      })
    );
  },

  // Alias
  delete: (id) => {
    return unwrap(
      fetchApi(`/leads/${id}`, {
        method: 'DELETE',
      })
    );
  },

  // GET /leads/:id/history
  getHistory: (id) => {
    return unwrap(
      fetchApi(`/leads/${id}/history`, {
        method: 'GET',
      })
    );
  },

  // PUT /leads/:id/stage
  updateStage: (id, stageId) => {
    return unwrap(
      fetchApi(`/leads/${id}/stage`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ stageId }),
      })
    );
  },

  // PUT /leads/:id/status
  updateStatus: (id, status) => {
    return unwrap(
      fetchApi(`/leads/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      })
    );
  },

  // PATCH /leads/:id/assign
  assignLead: (id, assignedUserId) => {
    return unwrap(
      fetchApi(`/leads/${id}/assign`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ assignedUserId }),
      })
    );
  },

  // GET /leads/:id/documents
  getDocuments: (id) => {
    return unwrap(
      fetchApi(`/leads/${id}/documents`, {
        method: 'GET',
      })
    );
  },

  // POST /leads/:id/documents/upload
  uploadDocument: (id, fileOrFormData) => {
    let body;

    if (fileOrFormData instanceof FormData) {
      body = fileOrFormData;
    } else {
      body = new FormData();
      body.append('file', fileOrFormData);
    }

    return unwrap(
      fetchApi(`/leads/${id}/documents/upload`, {
        method: 'POST',
        body, // do NOT set Content-Type – browser sets multipart boundary
      })
    );
  },

  // DELETE /leads/:id/documents/:documentId
  deleteDocument: (leadId, documentId) => {
    return unwrap(
      fetchApi(`/leads/${leadId}/documents/${documentId}`, {
        method: 'DELETE',
      })
    );
  },
};

export default leadsApi;