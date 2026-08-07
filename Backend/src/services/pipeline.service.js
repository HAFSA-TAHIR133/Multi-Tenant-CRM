import { Op } from 'sequelize';
import {
  Pipeline,
  User,
  PipelineAssignment,
  Tenant,
  Stage,
  Lead,
  Task
} from '../models/index.js';
import { UserRole } from '../constants/user-roles.js';
import { ErrorCodesMeta } from '../constants/error-codes.js';

const PipelineService = {
  /**
   * Private Helper: Checks if a standard USER has access to a pipeline.
   * Access is granted if they are directly assigned to the pipeline OR if they own a lead in it.
   */
  async _verifyUserAccess(pipelineId, userId) {
    const pipeline = await Pipeline.findOne({
      where: { id: pipelineId },
      include: [
        {
          model: User,
          as: 'assignedUsers',
          where: { id: userId },
          through: { attributes: [] },
          required: false,
        },
        {
          model: Lead,
          as: 'leads',
          where: { assignedUserId: userId },
          required: false,
        },
      ],
    });

    const isDirectlyAssigned = pipeline?.assignedUsers?.length > 0;
    const hasAssignedLeads = pipeline?.leads?.length > 0;

    if (isDirectlyAssigned || hasAssignedLeads) return true;

    // Also check if user has any leads in this pipeline via task assignments
    const taskLeadIds = await Task.findAll({
      where: { assignedUserId: userId },
      attributes: ['leadId'],
      raw: true,
    });
    const taskAssignedLeadIds = [...new Set(taskLeadIds.map((row) => row.leadId))];

    if (taskAssignedLeadIds.length > 0) {
      const leadsViaTasks = await Lead.count({
        where: {
          id: { [Op.in]: taskAssignedLeadIds },
          pipelineId: pipelineId,
        },
      });
      if (leadsViaTasks > 0) return true;
    }

    if (!pipeline) {
      const err = new Error('Pipeline not found');
      err.code = ErrorCodesMeta.NOT_FOUND.code;
      throw err;
    }

    const err = new Error('Access denied: You are not assigned to this pipeline');
    err.code = ErrorCodesMeta.FORBIDDEN.code;
    throw err;
  },

  async createPipeline(data, creator) {
    const { tenantId, name, description = null, isDefault = false, order = null } = data;

    if (!name) {
      const err = new Error(ErrorCodesMeta.BAD_REQUEST.message);
      err.code = ErrorCodesMeta.BAD_REQUEST.code;
      throw err;
    }

    if (
      creator.role === UserRole.ADMIN &&
      tenantId &&
      String(tenantId) !== String(creator.tenantId)
    ) {
      const err = new Error('Admins can only create pipelines in their own tenant');
      err.code = ErrorCodesMeta.FORBIDDEN.code;
      throw err;
    }

    const finalTenantId = creator.role === UserRole.SUPERADMIN ? tenantId : creator.tenantId;

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
      createdBy: creator.userId || creator.id,
    });
  },

  async getAllPipelines(user) {
  const currentUserId = user.userId || user.id;

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

  // Regular User: Get pipelines where user has tasks OR directly assigned leads
  // First, get all pipelines in the tenant
  const allTenantPipelines = await Pipeline.findAll({
    where: { tenantId: user.tenantId },
    order: [['createdAt', 'DESC']],
  });

  // Get leads assigned to this user
  const userLeads = await Lead.findAll({
    where: { 
      tenantId: user.tenantId,
      assignedUserId: currentUserId 
    },
    attributes: ['pipelineId'],
    raw: true,
  });
  const pipelineIdsFromLeads = [...new Set(userLeads.map(l => l.pipelineId))];

  // Get tasks assigned to this user
  const userTasks = await Task.findAll({
    where: { 
      tenantId: user.tenantId,
      assignedUserId: currentUserId 
    },
    attributes: ['pipelineId'],
    raw: true,
  });
  const pipelineIdsFromTasks = [...new Set(userTasks.map(t => t.pipelineId))];

  // Combine both sets
  const accessiblePipelineIds = new Set([
    ...pipelineIdsFromLeads,
    ...pipelineIdsFromTasks
  ]);

  // Filter pipelines to only accessible ones
  const accessiblePipelines = allTenantPipelines.filter(p => 
    accessiblePipelineIds.has(p.id)
  );

  return accessiblePipelines;
},

  async getPipelineById(id, user) {
    const currentUserId = user.userId || user.id;

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

    // USER role permission validation
    await this._verifyUserAccess(id, currentUserId);
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
      assignedBy: user.userId || user.id,
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

    if (user.role === UserRole.USER) {
      await this._verifyUserAccess(pipelineId, user.userId || user.id);
    }

    return pipeline.assignedUsers || [];
  },

  async getPipelineStages(id, user) {
    const currentUserId = user.userId || user.id;
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

    if (user.role === UserRole.USER) {
      if (String(pipeline.tenantId) !== String(user.tenantId)) {
        const err = new Error('Access denied');
        err.code = ErrorCodesMeta.FORBIDDEN.code;
        throw err;
      }
      await this._verifyUserAccess(id, currentUserId);
    }

    return await Stage.findAll({
      where: { pipelineId: id },
      order: [['order', 'ASC'], ['createdAt', 'ASC']],
    });
  },

  async getPipelineLeads(id, user) {
  const currentUserId = user.userId || user.id;
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

  const leadWhereClause = { pipelineId: id };

  // Standard Users only see leads directly assigned to them or linked via tasks
  if (user.role === UserRole.USER) {
    if (String(pipeline.tenantId) !== String(user.tenantId)) {
      const err = new Error('Access denied');
      err.code = ErrorCodesMeta.FORBIDDEN.code;
      throw err;
    }

    // Get leads assigned to this user via tasks
    const taskLeadIds = await Task.findAll({
      where: { assignedUserId: currentUserId },
      attributes: ['leadId'],
      raw: true,
    });
    const taskAssignedLeadIds = [...new Set(taskLeadIds.map((row) => row.leadId))];

    // Include leads directly assigned OR linked via a task
    if (taskAssignedLeadIds.length > 0) {
      leadWhereClause[Op.or] = [
        { assignedUserId: currentUserId },
        { id: { [Op.in]: taskAssignedLeadIds } },
      ];
    } else {
      leadWhereClause.assignedUserId = currentUserId;
    }
  }

  return await Lead.findAll({
    where: leadWhereClause,
    include: [
      { model: Pipeline, as: 'pipeline', required: false },
      { model: User, as: 'assignedUser', required: false },
      { model: Stage, as: 'stage', required: false },
    ],
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

    if (user.role === UserRole.ADMIN && String(pipeline.tenantId) !== String(user.tenantId)) {
      const err = new Error('Admins can only modify pipelines in their own tenant');
      err.code = ErrorCodesMeta.FORBIDDEN.code;
      throw err;
    }

    lead.pipelineId = pipelineId;

    // Default to the first stage of the target pipeline if no stage is assigned
    if (!lead.stageId) {
      const firstStage = await Stage.findOne({
        where: { pipelineId },
        order: [['order', 'ASC'], ['createdAt', 'ASC']],
      });
      if (firstStage) {
        lead.stageId = firstStage.id;
      }
    }

    lead.lastUpdatedBy = user.userId || user.id;
    await lead.save();

    return lead;
  }
};

export default PipelineService;