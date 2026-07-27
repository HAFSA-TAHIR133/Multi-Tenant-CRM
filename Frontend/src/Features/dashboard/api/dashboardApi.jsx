import { fetchApi } from '../../../api/fetchApiHelper';

export const dashboardApi = {
  // Superadmin
  getStats: () => fetchApi('/dashboard/stats'),
  getTenantsChart: () => fetchApi('/dashboard/tenants-chart'),
  getTenantStatusChart: () => fetchApi('/dashboard/tenant-status-chart'),
  getRecentUsers: () => fetchApi('/dashboard/recent-users'),
  getRecentTenants: () => fetchApi('/dashboard/recent-tenants'),

  // Admin
  getAdminStats: () => fetchApi('/dashboard/admin/stats'),
  getAdminLineChart: () => fetchApi('/dashboard/admin/line-chart'),
  getAdminStatusChart: () => fetchApi('/dashboard/admin/status-chart'),
  getRecentLeads: () => fetchApi('/dashboard/admin/recent-leads'),
  getRecentTasks: () => fetchApi('/dashboard/admin/recent-tasks'),

  // User
  getUserStats: () => fetchApi('/dashboard/user/stats'),
  getUserLineChart: () => fetchApi('/dashboard/user/line-chart'),
  getUserStatusChart: () => fetchApi('/dashboard/user/status-chart'),
  getUserActivities: () => fetchApi('/dashboard/user/activities'),
};