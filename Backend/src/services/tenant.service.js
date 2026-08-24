import { Tenant } from '../models/index.js';
import { ErrorCodesMeta } from '../constants/error-codes.js';
import { UserRole } from '../constants/user-roles.js';

const TenantService = {
  async createTenant(data) {
    const { name, slug, domain = null, status = 'active', settings = {} } = data;

    if (!name || !slug) {
      const err = new Error(ErrorCodesMeta.BAD_REQUEST.message);
      err.code = ErrorCodesMeta.BAD_REQUEST.code;
      throw err;
    }

    const existing = await Tenant.findOne({ where: { slug } });
    if (existing) {
      const err = new Error('Tenant already exists with this slug');
      err.code = ErrorCodesMeta.CONFLICT.code;
      throw err;
    }

    return await Tenant.create({
      name,
      slug,
      domain,
      status,
      settings,
    });
  },

  async getAllTenants(user) {
    if (user?.role === UserRole.SUPERADMIN) {
      return await Tenant.findAll({ order: [['createdAt', 'DESC']] });
    }

    // Admin sees only their own tenant
    return await Tenant.findAll({
      where: { id: user?.tenantId },
      order: [['createdAt', 'DESC']],
    });
  },

  async getTenantById(id, user) {
    if (user?.role !== UserRole.SUPERADMIN && String(user?.tenantId) !== String(id)) {
      const err = new Error('Access denied: you can only access your own tenant');
      err.code = ErrorCodesMeta.FORBIDDEN.code;
      throw err;
    }

    const tenant = await Tenant.findByPk(id);

    if (!tenant) {
      const err = new Error('Tenant not found');
      err.code = ErrorCodesMeta.NOT_FOUND.code;
      throw err;
    }

    return tenant;
  },

  async updateTenant(id, data, user) {
    if (user?.role !== UserRole.SUPERADMIN && String(user?.tenantId) !== String(id)) {
      const err = new Error('Access denied: you can only update your own tenant');
      err.code = ErrorCodesMeta.FORBIDDEN.code;
      throw err;
    }

    const tenant = await Tenant.findByPk(id);

    if (!tenant) {
      const err = new Error('Tenant not found');
      err.code = ErrorCodesMeta.NOT_FOUND.code;
      throw err;
    }

    const { name, slug, domain, status, settings } = data;

    if (slug && slug !== tenant.slug) {
      const existing = await Tenant.findOne({ where: { slug } });
      if (existing) {
        const err = new Error('Tenant already exists with this slug');
        err.code = ErrorCodesMeta.CONFLICT.code;
        throw err;
      }
    }

    await tenant.update({
      name: name ?? tenant.name,
      slug: slug ?? tenant.slug,
      domain: domain ?? tenant.domain,
      status: status ?? tenant.status,
      settings: settings ?? tenant.settings,
    });

    return tenant;
  },

  async updateTenantStatus(id, dataOrStatus, user) {
    // Only Super Admin can change tenant active/deactivated status
    if (user?.role && user.role !== UserRole.SUPERADMIN) {
      const err = new Error('Access denied: Only Super Admin can modify tenant status');
      err.code = ErrorCodesMeta.FORBIDDEN.code;
      throw err;
    }

    const tenant = await Tenant.findByPk(id);
    if (!tenant) {
      const err = new Error('Tenant not found');
      err.code = ErrorCodesMeta.NOT_FOUND.code;
      throw err;
    }

    // Extract status if passed as object `{ status: '...' }` or raw string
    const status = typeof dataOrStatus === 'object' ? dataOrStatus?.status : dataOrStatus;

    const validStatuses = ['active', 'inactive', 'deactivated'];
    if (!status || !validStatuses.includes(status.toLowerCase())) {
      const err = new Error('Invalid status provided. Expected active, inactive, or deactivated.');
      err.code = ErrorCodesMeta.BAD_REQUEST.code;
      throw err;
    }

    await tenant.update({ status: status.toLowerCase() });
    return tenant;
  },

 async deleteTenant(id, user) {
  if (user?.role && user.role !== UserRole.SUPERADMIN) {
    const err = new Error('Access denied: Only Super Admin can delete tenants');
    err.code = ErrorCodesMeta.FORBIDDEN.code;
    throw err;
  }

  const tenant = await Tenant.findByPk(id);
  if (!tenant) {
    const err = new Error('Tenant not found');
    err.code = ErrorCodesMeta.NOT_FOUND.code;
    throw err;
  }

  await tenant.destroy({ hooks: false });
  
  return { id, deleted: true };
}
};

export default TenantService;