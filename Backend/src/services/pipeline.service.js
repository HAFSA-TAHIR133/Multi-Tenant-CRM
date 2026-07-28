import { Op } from 'sequelize';
import {
  Pipeline,
  User,
  PipelineAssignment,
  Tenant,
  Stage, Lead 
} from '../models/index.js';
import { UserRole } from '../constants/user-roles.js';
import { ErrorCodesMeta } from '../constants/error-codes.js';

const PipelineService = {
  async createPipeline(data, creator) {
    const { tenantId, name, description = null, isDefault = false, order = null } = data;

    if (!name) {
      const err = new Error(ErrorCodesMeta.BAD_REQUEST.message);
      err.code = ErrorCodesMeta.BAD_REQUEST.code;
      throw err;
    }

    if (creator.role === UserRole.ADMIN &&
        tenantId &&
        String(tenantId) !== String(creator.tenantId)
      ) {
        const err = new Error(
          'Admins can only create pipelines in their own tenant'
        );
        err.code = ErrorCodesMeta.FORBIDDEN.code;
        throw err;
      }

    const finalTenantId =
      creator.role === UserRole.SUPERADMIN ? tenantId : creator.tenantId;

    if (!finalTenantId) {
      const err = new Error('tenantId is required');
      err.code = ErrorCodesMeta.BAD_REQUEST.code;
      throw err;
    }

    const tenant = await Tenant.findByPk(finalTenantId);
    if (!tenant) {
      const err = new Error('Tenant not found');
      err.code = ErrorCodesMeta.NOT_FOUND.code;
      throw err;
    }

    return await Pipeline.create({
      tenantId: finalTenantId,
      name,
      description,
      isDefault,
      order,
      createdBy: creator.userId,
    });
  },

  async getAllPipelines(user) {
    if (user.role === UserRole.SUPERADMIN) {
      return await Pipeline.findAll({
        order: [['createdAt', 'DESC']],
      });
    }

    if (user.role === UserRole.ADMIN) {
      return await Pipeline.findAll({
        where: { tenantId: user.tenantId },
        order: [['createdAt', 'DESC']],
      });
    }

    const pipelines = await Pipeline.findAll({
      include: [
        {
          model: User,
          as: 'assignedUsers',
          where: { id: user.userId },
          through: { attributes: [] },
          required: true,
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    return pipelines;
  },

  async getPipelineById(id, user) {
    const pipeline = await Pipeline.findByPk(id, {
      include: [
        { model: User, as: 'creator', required: false },
        { model: Tenant, as: 'tenant', required: false },
      ],
    });

    if (!pipeline) {
      const err = new Error('Pipeline not found');
      err.code = ErrorCodesMeta.NOT_FOUND.code;
      throw err;
    }

    if (user.role === UserRole.SUPERADMIN) {
      return pipeline;
    }

    if (user.role === UserRole.ADMIN) {
      if (String(pipeline.tenantId) !== String(user.tenantId)) {
        const err = new Error('Admins can only access pipelines in their own tenant');
        err.code = ErrorCodesMeta.FORBIDDEN.code;
        throw err;
      }
      return pipeline;
    }

    const assigned = await Pipeline.findOne({
      where: { id: pipeline.id },
      include: [
        {
          model: User,
          as: 'assignedUsers',
          where: { id: user.userId },
          through: { attributes: [] },
          required: true,
        },
      ],
    });

    if (!assigned) {
      const err = new Error('Access denied: pipeline is not assigned to you');
      err.code = ErrorCodesMeta.FORBIDDEN.code;
      throw err;
    }

    return pipeline;
  },

  async updatePipeline(id, data, user) {
    const pipeline = await Pipeline.findByPk(id);
    if (!pipeline) {
      const err = new Error('Pipeline not found');
      err.code = ErrorCodesMeta.NOT_FOUND.code;
      throw err;
    }

    if (user.role === UserRole.ADMIN && String(pipeline.tenantId) !== String(user.tenantId)) {
      const err = new Error('Admins can only update pipelines in their own tenant');
      err.code = ErrorCodesMeta.FORBIDDEN.code;
      throw err;
    }

    const { name, description, isDefault, order, tenantId } = data;

    if (user.role === UserRole.ADMIN && tenantId && String(tenantId) !== String(user.tenantId)) {
      const err = new Error('Admins cannot move pipelines to another tenant');
      err.code = ErrorCodesMeta.FORBIDDEN.code;
      throw err;
    }

    await pipeline.update({
      name: name ?? pipeline.name,
      description: description ?? pipeline.description,
      isDefault: isDefault ?? pipeline.isDefault,
      order: order ?? pipeline.order,
      tenantId: user.role === UserRole.SUPERADMIN ? (tenantId ?? pipeline.tenantId) : pipeline.tenantId,
    });

    return pipeline;
  },

  async deletePipeline(id, user) {
    const pipeline = await Pipeline.findByPk(id);
    if (!pipeline) {
      const err = new Error('Pipeline not found');
      err.code = ErrorCodesMeta.NOT_FOUND.code;
      throw err;
    }

    if (user.role === UserRole.ADMIN && String(pipeline.tenantId) !== String(user.tenantId)) {
      const err = new Error('Admins can only delete pipelines in their own tenant');
      err.code = ErrorCodesMeta.FORBIDDEN.code;
      throw err;
    }

    await PipelineAssignment.destroy({ where: { pipelineId: id } });
    await pipeline.destroy();

    return { success: true };
  },

  async assignUsers(pipelineId, userIds, user) {
    const pipeline = await Pipeline.findByPk(pipelineId);
    if (!pipeline) {
      const err = new Error('Pipeline not found');
      err.code = ErrorCodesMeta.NOT_FOUND.code;
      throw err;
    }

    if (user.role === UserRole.ADMIN && String(pipeline.tenantId) !== String(user.tenantId)) {
      const err = new Error('Admins can only assign pipelines in their own tenant');
      err.code = ErrorCodesMeta.FORBIDDEN.code;
      throw err;
    }

    const users = await User.findAll({
      where: {
        id: { [Op.in]: userIds },
        tenantId: pipeline.tenantId,
      },
    });

    if (users.length !== userIds.length) {
      const err = new Error('Some users were not found in this tenant');
      err.code = ErrorCodesMeta.BAD_REQUEST.code;
      throw err;
    }

    const rows = userIds.map((uid) => ({
      pipelineId,
      userId: uid,
      assignedBy: user.userId,
    }));

    await PipelineAssignment.bulkCreate(rows, {
      ignoreDuplicates: true,
    });

    return { success: true };
  },

  async getAssignedUsers(pipelineId, user) {
    const pipeline = await Pipeline.findByPk(pipelineId, {
      include: [
        {
          model: User,
          as: 'assignedUsers',
          through: { attributes: [] },
        },
      ],
    });

    if (!pipeline) {
      const err = new Error('Pipeline not found');
      err.code = ErrorCodesMeta.NOT_FOUND.code;
      throw err;
    }

    if (user.role === UserRole.ADMIN && String(pipeline.tenantId) !== String(user.tenantId)) {
      const err = new Error('Admins can only view assignments in their own tenant');
      err.code = ErrorCodesMeta.FORBIDDEN.code;
      throw err;
    }

    return pipeline.assignedUsers || [];
  },

  async  getPipelineStages(id, user) {
    const pipeline = await Pipeline.findByPk(id);
    if (!pipeline) {
      const err = new Error('Pipeline not found');
      err.code = ErrorCodesMeta.NOT_FOUND.code;
      throw err;
    }

    if (user.role === UserRole.ADMIN && String(pipeline.tenantId) !== String(user.tenantId)) {
      const err = new Error('Admins can only access pipelines in their own tenant');
      err.code = ErrorCodesMeta.FORBIDDEN.code;
      throw err;
    }

    return await Stage.findAll({
      where: { pipelineId: id },
      order: [['order', 'ASC'], ['createdAt', 'ASC']],
    });
  },

  async  getPipelineLeads(id, user) {
    const pipeline = await Pipeline.findByPk(id);
    if (!pipeline) {
      const err = new Error('Pipeline not found');
      err.code = ErrorCodesMeta.NOT_FOUND.code;
      throw err;
    }

    if (user.role === UserRole.ADMIN && String(pipeline.tenantId) !== String(user.tenantId)) {
      const err = new Error('Admins can only access pipelines in their own tenant');
      err.code = ErrorCodesMeta.FORBIDDEN.code;
      throw err;
    }

    return await Lead.findAll({
      where: { pipelineId: id },
      order: [['createdAt', 'DESC']],
    });
  },

  async assignLeadToPipeline(pipelineId, leadId, user) {
  const pipeline = await Pipeline.findByPk(pipelineId);
  if (!pipeline) {
    const err = new Error('Pipeline not found');
    err.code = ErrorCodesMeta.NOT_FOUND.code;
    throw err;
  }

  const lead = await Lead.findByPk(leadId);
  if (!lead) {
    const err = new Error('Lead not found');
    err.code = ErrorCodesMeta.NOT_FOUND.code;
    throw err;
  }

  if (String(lead.tenantId) !== String(pipeline.tenantId)) {
    const err = new Error('Lead and pipeline must belong to the same tenant');
    err.code = ErrorCodesMeta.FORBIDDEN.code;
    throw err;
  }

  lead.pipelineId = pipelineId;
  await lead.save();

  return lead;
}

};

export default PipelineService;