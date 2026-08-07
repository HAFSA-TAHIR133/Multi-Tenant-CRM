import { User, Tenant, Lead, Task } from '../models/index.js';
import { Op } from 'sequelize';

class DashboardService {
  getTenantFilter(currentUser) {
    // SUPERADMIN has no tenantId, ADMIN and USER do
    const tenantId = currentUser?.tenantId;
    return tenantId ? { tenantId } : {};
  }

  async getStats(currentUser) {
    const tenantFilter = this.getTenantFilter(currentUser);

    const [totalUsers, totalTenants, totalLeads, totalTasks, activeTenants] = await Promise.all([
      User.count({ where: tenantFilter }),
      Tenant.count(), // No filter - tenants are global
      Lead.count({ where: tenantFilter }),
      Task.count({ where: tenantFilter }),
      Tenant.count({ where: { status: 'active' } }), // No tenantId filter on Tenant table
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
    // Only SUPERADMIN should see all tenants
    return Tenant.findAll({
      limit: 5,
      order: [['createdAt', 'DESC']],
    });
  }

  async getTenantStatusChart(currentUser) {
    // Don't filter Tenant by tenantId - Tenant table doesn't have tenantId column
    const activeCount = await Tenant.count({
      where: { status: 'active' },
    });

    const inactiveCount = await Tenant.count({
      where: { status: 'inactive' },
    });

    return [
      { status: 'Active', count: activeCount, color: '#a855f7' },
      { status: 'Inactive', count: inactiveCount, color: '#cbd5e1' },
    ];
  }

  async getTenantsChart(currentUser) {
    // Only for SUPERADMIN - no tenantFilter on Tenant table
    const rows = await Tenant.findAll({
      limit: 50, // Add a limit to avoid huge datasets
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

    const totalLeads = await Lead.count({
      where: tenantFilter,
    });

    const totalTasks = await Task.count({
      where: tenantFilter,
    });

    const openLeads = await Lead.count({
      where: { ...tenantFilter, status: 'open' },
    });

    const closedLeads = await Lead.count({
      where: { ...tenantFilter, status: 'closed' },
    });

    const completedTasks = await Task.count({
      where: { ...tenantFilter, status: 'completed' },
    });

    const pendingTasks = await Task.count({
      where: { ...tenantFilter, status: 'pending' },
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
    const userId = Number(this.getUserId(currentUser));
    const tenantFilter = this.getTenantFilter(currentUser);
    const now = new Date();

    const [assignedTasks, completedTasks, pendingTasks, overdueTasks] = await Promise.all([
      Task.count({ where: { ...tenantFilter, assignedUserId: userId } }),
      Task.count({
        where: {
          ...tenantFilter,
          assignedUserId: userId,
          status: { [Op.in]: ['completed', 'done'] },
        },
      }),
      Task.count({
        where: {
          ...tenantFilter,
          assignedUserId: userId,
          status: { [Op.notIn]: ['completed', 'done'] },
          [Op.or]: [
            { dueDate: null },
            { dueDate: { [Op.gte]: now } },
          ],
        },
      }),
      Task.count({
        where: {
          ...tenantFilter,
          assignedUserId: userId,
          status: { [Op.notIn]: ['completed', 'done'] },
          dueDate: { [Op.lt]: now },
        },
      }),
    ]);

    return {
      assignedTasks,
      completedTasks,
      pendingTasks,
      overdueTasks,
    };
  }

  async getUserLineChart(currentUser) {
    const userId = Number(this.getUserId(currentUser));
    const tenantFilter = this.getTenantFilter(currentUser);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const rows = await Task.findAll({
      where: {
        ...tenantFilter,
        assignedUserId: userId,
        createdAt: { [Op.gte]: sevenDaysAgo },
      },
      attributes: ['createdAt'],
      order: [['createdAt', 'ASC']],
    });

    // Initialize all 7 days with 0 so the graph always shows the full week
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const buckets = {};
    daysOfWeek.forEach((day) => {
      buckets[day] = { day, tasks: 0 };
    });

    rows.forEach((row) => {
      const date = new Date(row.createdAt);
      const day = date.toLocaleDateString('en-US', { weekday: 'short' });

      if (buckets[day]) buckets[day].tasks += 1;
    });

    return Object.values(buckets);
  }

  async getUserStatusChart(currentUser) {
    const userId = Number(this.getUserId(currentUser));
    const tenantFilter = this.getTenantFilter(currentUser);
    const now = new Date();

    const completedCount = await Task.count({
      where: {
        ...tenantFilter,
        assignedUserId: userId,
        status: { [Op.in]: ['completed', 'done'] },
      },
    });

    const pendingCount = await Task.count({
      where: {
        ...tenantFilter,
        assignedUserId: userId,
        status: { [Op.notIn]: ['completed', 'done'] },
        [Op.or]: [
          { dueDate: null },
          { dueDate: { [Op.gte]: now } },
        ],
      },
    });

    const overdueCount = await Task.count({
      where: {
        ...tenantFilter,
        assignedUserId: userId,
        status: { [Op.notIn]: ['completed', 'done'] },
        dueDate: { [Op.lt]: now },
      },
    });

    return [
      { label: 'Completed', value: completedCount, color: '#0f172a' },
      { label: 'Pending', value: pendingCount, color: '#3b82f6' },
      { label: 'Overdue', value: overdueCount, color: '#ef4444' },
    ];
  }
}

export default new DashboardService();