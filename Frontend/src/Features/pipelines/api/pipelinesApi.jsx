import { fetchApi } from '../../../api/fetchApiHelper';

export const pipelinesApi = {
  getAll: () => fetchApi('/pipeline'),
  getById: (id) => fetchApi(`/pipeline/${id}`),
  create: (data) => fetchApi('/pipeline', data),
  update: (id, data) => fetchApi(`/pipeline/${id}`, data),
  remove: (id) => fetchApi(`/pipeline/${id}`),

  getStages: (pipelineId) => fetchApi(`/pipeline/${pipelineId}/stages`),
  getPipelineLeads: (pipelineId) => fetchApi(`/pipeline/${pipelineId}/leads`),
  assignLeadToPipeline: (pipelineId, leadId) =>fetchApi(`/pipeline/${pipelineId}/assign-lead`, {
    method: 'POST',
    body: { leadId },
  }),

  getAllLeads: () => fetchApi('/leads'),

  createStage: (data) => fetchApi('/stage', data),
  updateStage: (id, data) => fetchApi(`/stage/${id}`, data),
  deleteStage: (id) => fetchApi(`/stage/${id}`),
  reorderStages: (pipelineId, stageIds) => fetchApi('/stage/reorder', { pipelineId, stageIds }),

  getLeadById: (id) => fetchApi(`/leads/${id}`),
  getLeadHistory: (id) => fetchApi(`/leads/${id}/history`),
  updateLeadStage: (leadId, stageId) => fetchApi(`/leads/${leadId}/stage`, { stageId }),
};