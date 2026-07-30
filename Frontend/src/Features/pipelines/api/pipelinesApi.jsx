import { fetchApi } from '../../../api/fetchApiHelper';

export const pipelinesApi = {
  getAll: () => fetchApi('/pipeline'),
  getById: (id) => fetchApi(`/pipeline/${id}`),
  create: (data) => fetchApi('/pipeline', { method: 'POST', body: data }),
  update: (id, data) => fetchApi(`/pipeline/${id}`, { method: 'PUT', body: data }),
  remove: (id) => fetchApi(`/pipeline/${id}`, { method: 'DELETE' }),

  getStages: (pipelineId) => fetchApi(`/pipeline/${pipelineId}/stages`),
  getPipelineLeads: (pipelineId) => fetchApi(`/pipeline/${pipelineId}/leads`),
  assignLeadToPipeline: (pipelineId, leadId) =>fetchApi(`/pipeline/${pipelineId}/assign-lead`, {
    method: 'POST',
    body: { leadId },
  }),

  getAllLeads: () => fetchApi('/leads'),

  createStage: (data) => fetchApi('/stage', { method: 'POST', body: data }),
  updateStage: (id, data) => fetchApi(`/stage/${id}`, { method: 'PUT', body: data }),
  deleteStage: (id) => fetchApi(`/stage/${id}`, { method: 'DELETE' }),
  reorderStages: (pipelineId, stageIds) => fetchApi('/stage/reorder', { method: 'POST', body: { pipelineId, stageIds } }),

  getLeadById: (id) => fetchApi(`/leads/${id}`),
  getLeadHistory: (id) => fetchApi(`/leads/${id}/history`),
  updateLeadStage: (leadId, stageId) => fetchApi(`/leads/${leadId}/stage`, { method: 'PUT', body: { stageId } }),
};