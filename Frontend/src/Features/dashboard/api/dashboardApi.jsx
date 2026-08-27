import { fetchApi } from '../../../api/fetchApiHelper';

const unwrap = async (promise) => {
  const response = await promise;
  return response?.data ?? response;
};

export const dashboardApi = {
  // Superadmin
  getStats: () => unwrap(fetchApi('/dashboard/stats')),
  getTenantsChart: (period = 'This Week') => {
    const params = typeof period === 'string' ? { period } : period;
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/dashboard/tenants-chart?${queryString}` : '/dashboard/tenants-chart';
    return unwrap(fetchApi(endpoint));
  },
  getTenantStatusChart: () => unwrap(fetchApi('/dashboard/tenant-status-chart')),
  getRecentUsers: () => unwrap(fetchApi('/dashboard/recent-users')),
  getRecentTenants: () => unwrap(fetchApi('/dashboard/recent-tenants')),

  // Admin
  getAdminStats: () => unwrap(fetchApi('/dashboard/admin/stats')),
  getAdminLineChart: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/dashboard/admin/line-chart?${queryString}` : '/dashboard/admin/line-chart';
    return unwrap(fetchApi(endpoint));
  },
  getAdminStatusChart: () => unwrap(fetchApi('/dashboard/admin/status-chart')),
  getRecentLeads: () => unwrap(fetchApi('/dashboard/admin/recent-leads')),
  getRecentTasks: () => unwrap(fetchApi('/dashboard/admin/recent-tasks')),

  // User
  getUserStats: () => unwrap(fetchApi('/dashboard/user/stats')),
  getUserLineChart: (period = 'This Week') => {
    const params = typeof period === 'string' ? { period } : period;
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/dashboard/user/line-chart?${queryString}` : '/dashboard/user/line-chart';
    return unwrap(fetchApi(endpoint));
  },
  
  getUserStatusChart: () => unwrap(fetchApi('/dashboard/user/status-chart')),
  getUserActivities: () => unwrap(fetchApi('/dashboard/user/activities')),
};