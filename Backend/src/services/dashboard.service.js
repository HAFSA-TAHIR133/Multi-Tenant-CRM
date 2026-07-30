import { User, Tenant, Lead, Task } from '../models/index.js';
import { Op } from 'sequelize';

class DashboardService {
  getTenantFilter(currentUser) {
    const tenantId = currentUser?.tenantId;
    return tenantId ? { tenantId } : {};
  }

  async getStats(currentUser) {
    const tenantFilter = this.getTenantFilter(currentUser);

    const [totalUsers, totalTenants, totalLeads, totalTasks, activeTenants] = await Promise.all([
      User.count({ where: tenantFilter }),
      Tenant.count(),
      Lead.count({ where: tenantFilter }),
      Task.count({ where: tenantFilter }),
      Tenant.count({ where: { ...tenantFilter, status: 'active' } }),
    ]);

    return {
      totalUsers,
      totalTenants,
      activeTenants,
      activityCount: totalLeads + totalTasks,
    };
  }

  async getRecentUsers(currentUser) {
    const tenantFilter = this.getTenantFilter(currentUser);

    return User.findAll({
      where: tenantFilter,
      limit: 5,
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'name', 'email', 'role', 'createdAt'],
    });
  }

  async getRecentTenants() {
    return Tenant.findAll({
      limit: 5,
      order: [['createdAt', 'DESC']],
    });
  }

  async getTenantStatusChart(currentUser) {
    const tenantFilter = this.getTenantFilter(currentUser);

    const activeCount = await Tenant.count({
      where: { ...tenantFilter, status: 'active' },
    });

    const inactiveCount = await Tenant.count({
      where: { ...tenantFilter, status: 'inactive' },
    });

    return [
      { status: 'Active', count: activeCount, color: '#a855f7' },
      { status: 'Inactive', count: inactiveCount, color: '#cbd5e1' },
    ];
  }

  async getTenantsChart(currentUser) {
    const tenantFilter = this.getTenantFilter(currentUser);

    const rows = await Tenant.findAll({
      where: tenantFilter,
      attributes: ['createdAt'],
      order: [['createdAt', 'ASC']],
    });

    const buckets = {};
    rows.forEach((row) => {
      const date = new Date(row.createdAt);
      const day = date.toLocaleDateString('en-US', { weekday: 'short' });

      if (!buckets[day]) buckets[day] = { day, tenants: 0 };
      buckets[day].tenants += 1;
    });

    return Object.values(buckets);
  }

  async getAdminStats(currentUser) {
  const tenantFilter = this.getTenantFilter(currentUser);
  console.log('getAdminStats currentUser:', currentUser);
  console.log('getAdminStats tenantFilter:', tenantFilter);

  const totalLeads = await Lead.count({
    where: tenantFilter,
    logging: console.log,
  });

  const totalTasks = await Task.count({
    where: tenantFilter,
    logging: console.log,
  });

  const openLeads = await Lead.count({
    where: { ...tenantFilter, status: 'open' },
    logging: console.log,
  });

  const closedLeads = await Lead.count({
    where: { ...tenantFilter, status: 'closed' },
    logging: console.log,
  });

  const completedTasks = await Task.count({
    where: { ...tenantFilter, status: 'completed' },
    logging: console.log,
  });

  const pendingTasks = await Task.count({
    where: { ...tenantFilter, status: 'pending' },
    logging: console.log,
  });

  return {
    totalLeads,
    totalTasks,
    openLeads,
    closedLeads,
    completedTasks,
    pendingTasks,
    activePipelines: totalLeads,
  };
}

  async getAdminLineChart(currentUser) {
    const tenantFilter = this.getTenantFilter(currentUser);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const rows = await Lead.findAll({
      where: {
        ...tenantFilter,
        createdAt: {
          [Op.gte]: sevenDaysAgo,
        },
      },
      attributes: ['createdAt', 'value'], 
      order: [['createdAt', 'ASC']],
    });

    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const buckets = {};

    rows.forEach((row) => {
      const date = new Date(row.createdAt);
      const day = date.toLocaleDateString('en-US', { weekday: 'short' });

      if (!buckets[day]) buckets[day] = { day, revenue: 0 };
      
      buckets[day].revenue += Number(row.value || row.amount || 0);
    });

    return Object.values(buckets);
  }

  async getAdminStatusChart(currentUser) {
    const tenantFilter = this.getTenantFilter(currentUser);

    const openCount = await Lead.count({
      where: { ...tenantFilter, status: 'open' },
    });

    const closedCount = await Lead.count({
      where: { ...tenantFilter, status: 'closed' },
    });

    return [
      { label: 'Open', value: openCount, color: '#0f172a' },
      { label: 'Closed', value: closedCount, color: '#cbd5e1' },
    ];
  }

  getUserId(currentUser) {
    const userId = currentUser?.id ?? currentUser?._id ?? currentUser?.userId;
    if (!userId) {
      throw new Error('User identity missing: currentUser.id is undefined');
    }
    return userId;
  }

  async getUserStats(currentUser) {
    const userId = this.getUserId(currentUser);
    const tenantFilter = this.getTenantFilter(currentUser);

    const [assignedTasks, completedTasks, pendingTasks] = await Promise.all([
      Task.count({ where: { ...tenantFilter, assignedUserId: userId } }),
      Task.count({ where: { ...tenantFilter, assignedUserId: userId, status: 'completed' } }),
      Task.count({ where: { ...tenantFilter, assignedUserId: userId, status: 'pending' } }),
    ]);

    return {
      assignedTasks,
      completedTasks,
      pendingTasks,
    };
  }

  async getUserLineChart(currentUser) {
    const userId = this.getUserId(currentUser);
    const tenantFilter = this.getTenantFilter(currentUser);

    const rows = await Task.findAll({
      where: { ...tenantFilter, assignedUserId: userId },
      attributes: ['createdAt'],
      order: [['createdAt', 'ASC']],
    });

    const buckets = {};
    rows.forEach((row) => {
      const date = new Date(row.createdAt);
      const day = date.toLocaleDateString('en-US', { weekday: 'short' });

      if (!buckets[day]) buckets[day] = { day, value: 0 };
      buckets[day].value += 1;
    });

    return Object.values(buckets);
  }

  async getUserStatusChart(currentUser) {
    const userId = this.getUserId(currentUser);
    const tenantFilter = this.getTenantFilter(currentUser);

    const completedCount = await Task.count({
      where: { ...tenantFilter, assignedUserId: userId, status: 'completed' },
    });

    const pendingCount = await Task.count({
      where: { ...tenantFilter, assignedUserId: userId, status: 'pending' },
    });

    return [
      { label: 'Completed', value: completedCount, color: '#0f172a' },
      { label: 'Pending', value: pendingCount, color: '#cbd5e1' },
    ];
  }
}

export default new DashboardService();