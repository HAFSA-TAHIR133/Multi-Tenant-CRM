import { User, Tenant, Lead, Task } from '../models/index.js';
import { Op } from 'sequelize';

class DashboardService {
  getTenantFilter(currentUser) {
    const tenantId = currentUser?.tenantId;
    return tenantId !== undefined && tenantId !== null
      ? { tenantId: Number(tenantId) }
      : {};
  }

  getUserId(currentUser) {
    const userId = currentUser?.id ?? currentUser?._id ?? currentUser?.userId;
    if (!userId) {
      throw new Error('User identity missing: currentUser.id is undefined');
    }
    return userId;
  }

  async getStats(currentUser) {
    const tenantFilter = this.getTenantFilter(currentUser);
    const [totalUsers, totalTenants, totalLeads, totalTasks, activeTenants] = await Promise.all([
      User.count({ where: tenantFilter }),
      Tenant.count(), // No filter - tenants are global
      Lead.count({ where: tenantFilter }),
      Task.count({ where: tenantFilter }),
      Tenant.count({ where: { status: 'active' } }),
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
    const rows = await Tenant.findAll({
      limit: 50,
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

  async getAdminLineChart(currentUser, query = {}) {
    const tenantFilter = this.getTenantFilter(currentUser);
    const period = query.period || query.range || query.timeframe || 'Last 1 Week';

    const today = new Date();
    today.setHours(23, 59, 59, 999);
    let startDate = new Date();
    let daysToFetch = 7;
    let formatAsDayName = true;

    if (period === 'Last 1 Month' || period === '1 Month' || period === '30 Days') {
      daysToFetch = 30;
      startDate.setDate(today.getDate() - 29);
      formatAsDayName = false;
    } else if (period === 'Last 14 Days' || period === '14 Days') {
      daysToFetch = 14;
      startDate.setDate(today.getDate() - 13);
      formatAsDayName = false;
    } else {
      // Default: "Last 1 Week" / "Last 7 Days"
      daysToFetch = 7;
      startDate.setDate(today.getDate() - 6);
      formatAsDayName = true;
    }
    startDate.setHours(0, 0, 0, 0);

    const rows = await Lead.findAll({
      where: {
        ...tenantFilter,
        createdAt: {
          [Op.gte]: startDate,
          [Op.lte]: today,
        },
      },
      attributes: ['createdAt', 'value'],
      raw: true,
      order: [['createdAt', 'ASC']],
    });

    const toDateKey = (dateObj) => {
      const d = new Date(dateObj);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const buckets = {};
    for (let i = 0; i < daysToFetch; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const key = toDateKey(d);
      const label = formatAsDayName
        ? d.toLocaleDateString('en-US', { weekday: 'short' })
        : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      buckets[key] = {
        day: label,
        revenue: 0,
      };
    }

    rows.forEach((row) => {
      if (row.createdAt) {
        const key = toDateKey(row.createdAt);
        if (buckets[key]) {
          const numericVal = parseFloat(row.value) || 0;
          buckets[key].revenue += numericVal;
        }
      }
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

  async getUserLineChart(currentUser, query = {}) {
    const userId = Number(this.getUserId(currentUser));
    const tenantFilter = this.getTenantFilter(currentUser);
    const period = query.period || query.range || query.timeframe || 'Last 1 Week';

    const today = new Date();
    today.setHours(23, 59, 59, 999);
    let startDate = new Date();
    let daysToFetch = 7;
    let formatAsDayName = true;

    // Timeline condition mapping:
    if (period === 'Last 1 Month' || period === '1 Month' || period === '30 Days') {
      // Last 1 Month: 30 rolling days (formatted as "MMM DD")
      daysToFetch = 30;
      startDate.setDate(today.getDate() - 29);
      formatAsDayName = false;
    } else if (period === 'Last 14 Days' || period === '14 Days') {
      // Last 14 Days: 14 rolling days (formatted as "MMM DD")
      daysToFetch = 14;
      startDate.setDate(today.getDate() - 13);
      formatAsDayName = false;
    } else {
      // Default / "Last 1 Week" / "Last 7 Days" / "This Week": 7 rolling days (formatted as day name e.g. "Mon")
      daysToFetch = 7;
      startDate.setDate(today.getDate() - 6);
      formatAsDayName = true;
    }
    startDate.setHours(0, 0, 0, 0);

    const rows = await Task.findAll({
      where: {
        ...tenantFilter,
        assignedUserId: userId,
        createdAt: {
          [Op.gte]: startDate,
          [Op.lte]: today,
        },
      },
      attributes: ['createdAt'],
      raw: true,
      order: [['createdAt', 'ASC']],
    });

    const toDateKey = (dateObj) => {
      const d = new Date(dateObj);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const buckets = {};
    for (let i = 0; i < daysToFetch; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const key = toDateKey(d);
      const label = formatAsDayName
        ? d.toLocaleDateString('en-US', { weekday: 'short' })
        : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      buckets[key] = {
        day: label,
        tasks: 0,
      };
    }

    rows.forEach((row) => {
      if (row.createdAt) {
        const key = toDateKey(row.createdAt);
        if (buckets[key]) {
          buckets[key].tasks += 1;
        }
      }
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