import { fetchApi } from '../../../api/fetchApiHelper';

export const tenantsApi = {
  getTenants: () => fetchApi('/tenants'),
  createTenant: (payload) => fetchApi('/tenants', {
    method: 'POST',
    body: payload,
  }),
  updateTenant: (id, payload) => fetchApi(`/tenants/${id}`, {
    method: 'PATCH',
    body: payload,
  }),
  deleteTenant: (id) => fetchApi(`/tenants/${id}`, {
    method: 'DELETE',
  }),
  updateTenantStatus: (id, newStatus) => fetchApi(`/tenants/${id}/status`, {
    method: 'PATCH',
    body: {status: newStatus},
  }),
};