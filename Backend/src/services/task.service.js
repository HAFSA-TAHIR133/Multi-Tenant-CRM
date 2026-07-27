import { Op } from 'sequelize';
import { Task, Lead, User, Tenant, Pipeline, Stage } from '../models/index.js';
import { UserRole } from '../constants/user-roles.js';
import { ErrorCodesMeta } from '../constants/error-codes.js';

const TaskService = {
  async createTask(data, user) {
    const {leadId,title,description,status = 'pending',priority,dueDate,assignedUserId,pipelineId,
        stageId,} = data;

    if (!title || !leadId) {
      const err = new Error(ErrorCodesMeta.BAD_REQUEST.message);
      err.code = ErrorCodesMeta.BAD_REQUEST.code;
      throw err;
    }

    const lead = await Lead.findByPk(leadId, {
      include: [
        { model: Tenant, as: 'tenant', required: true },
        { model: Pipeline, as: 'pipeline', required: true },
        { model: Stage, as: 'stage', required: true },
      ],
    });

    if (!lead) {
      const err = new Error('Lead not found');
      err.code = ErrorCodesMeta.NOT_FOUND.code;
      throw err;
    }

    if (user.role === UserRole.ADMIN && String(lead.tenantId) !== String(user.tenantId)) {
      const err = new Error('Admins can only create tasks for leads in their own tenant');
      err.code = ErrorCodesMeta.FORBIDDEN.code;
      throw err;
    }

    if (user.role !== UserRole.SUPERADMIN && user.role !== UserRole.ADMIN) {
      const err = new Error('Only admins can create tasks');
      err.code = ErrorCodesMeta.FORBIDDEN.code;
      throw err;
    }

    const task = await Task.create({
      tenantId: lead.tenantId,
      leadId,
      pipelineId: pipelineId ?? lead.pipelineId,
      stageId: stageId ?? lead.stageId,
      title,
      description,
      status,
      priority,
      dueDate,
      assignedUserId: assignedUserId ?? null,
      createdBy: user.userId,
      lastUpdatedBy: user.userId,
    });

    return task;
  },

  async getAllTasks(user) {
    const include = [
      { model: Lead, as: 'lead', required: true,
        include: [
          { model: User, as: 'assignedUser', required: false },
          { model: Pipeline, as: 'pipeline', required: true },
          { model: Stage, as: 'stage', required: true },
        ],
      },
      { model: User, as: 'assignedUser', required: false },
    ];

    if (user.role === UserRole.SUPERADMIN) {
      return await Task.findAll({ include, order: [['createdAt', 'DESC']] });
    }

    if (user.role === UserRole.ADMIN) {
      return await Task.findAll({
        where: { tenantId: user.tenantId },
        include,
        order: [['createdAt', 'DESC']],
      });
    }

    if (user.role === UserRole.USER) {
      // User sees tasks whose lead is assigned to them, in their tenant
      return await Task.findAll({
        where: { tenantId: user.tenantId },
        include: [
          {
            model: Lead,
            as: 'lead',
            required: true,
            where: { assignedUserId: user.userId },
            include: [
              { model: User, as: 'assignedUser', required: false },
              { model: Pipeline, as: 'pipeline', required: true },
              { model: Stage, as: 'stage', required: true },
            ],
          },
          { model: User, as: 'assignedUser', required: false },
        ],
        order: [['createdAt', 'DESC']],
      });
    }

    const err = new Error(ErrorCodesMeta.FORBIDDEN.message);
    err.code = ErrorCodesMeta.FORBIDDEN.code;
    throw err;
  },

  async getTaskById(id, user) {
    const task = await Task.findByPk(id, {
      include: [
        {
          model: Lead,
          as: 'lead',
          required: true,
          include: [
            { model: User, as: 'assignedUser', required: false },
            { model: Pipeline, as: 'pipeline', required: true },
            { model: Stage, as: 'stage', required: true },
            { model: Tenant, as: 'tenant', required: true },
          ],
        },
        { model: User, as: 'assignedUser', required: false },
        { model: Tenant, as: 'tenant', required: true },
      ],
    });

    if (!task) {
      const err = new Error('Task not found');
      err.code = ErrorCodesMeta.NOT_FOUND.code;
      throw err;
    }

    if (user.role === UserRole.SUPERADMIN) {
      return task;
    }

    if (user.role === UserRole.ADMIN) {
      if (String(task.tenantId) !== String(user.tenantId)) {
        const err = new Error('Admins can only access tasks in their own tenant');
        err.code = ErrorCodesMeta.FORBIDDEN.code;
        throw err;
      }
      return task;
    }

    if (user.role === UserRole.USER) {
      if (
        String(task.tenantId) !== String(user.tenantId) ||
        String(task.lead.assignedUserId || '') !== String(user.userId)
      ) {
        const err = new Error('Access denied: task is not assigned to you');
        err.code = ErrorCodesMeta.FORBIDDEN.code;
        throw err;
      }
      return task;
    }

    const err = new Error(ErrorCodesMeta.FORBIDDEN.message);
    err.code = ErrorCodesMeta.FORBIDDEN.code;
    throw err;
  },

  async updateTask(id, data, user) {
    const task = await Task.findByPk(id, {
      include: [
        {
          model: Lead,
          as: 'lead',
          required: true,
          include: [
            { model: Tenant, as: 'tenant', required: true },
            { model: User, as: 'assignedUser', required: false },
          ],
        },
        { model: Tenant, as: 'tenant', required: true },
      ],
    });

    if (!task) {
      const err = new Error('Task not found');
      err.code = ErrorCodesMeta.NOT_FOUND.code;
      throw err;
    }

    if (user.role === UserRole.ADMIN) {
      if (String(task.tenantId) !== String(user.tenantId)) {
        const err = new Error('Admins can only update tasks in their own tenant');
        err.code = ErrorCodesMeta.FORBIDDEN.code;
        throw err;
      }
    } else if (user.role === UserRole.USER) {
      if (
        String(task.tenantId) !== String(user.tenantId) ||
        String(task.lead.assignedUserId || '') !== String(user.userId)
      ) {
        const err = new Error('Users can only update tasks for their assigned leads');
        err.code = ErrorCodesMeta.FORBIDDEN.code;
        throw err;
      }
    } else if (user.role !== UserRole.SUPERADMIN) {
      const err = new Error(ErrorCodesMeta.FORBIDDEN.message);
      err.code = ErrorCodesMeta.FORBIDDEN.code;
      throw err;
    }

    const {
      title,
      description,
      status,
      priority,
      dueDate,
      assignedUserId,
      leadId,
      pipelineId,
      stageId,
    } = data;

    if (leadId !== undefined && String(leadId) !== String(task.leadId)) {
      const newLead = await Lead.findByPk(leadId, {
        include: [{ model: Tenant, as: 'tenant', required: true }],
      });
      if (!newLead) {
        const err = new Error('Lead not found');
        err.code = ErrorCodesMeta.NOT_FOUND.code;
        throw err;
      }
      if (user.role === UserRole.ADMIN && String(newLead.tenantId) !== String(user.tenantId)) {
        const err = new Error('Admins can only use leads in their own tenant');
        err.code = ErrorCodesMeta.FORBIDDEN.code;
        throw err;
      }
      task.leadId = newLead.id;
      task.tenantId = newLead.tenantId;
      task.pipelineId = newLead.pipelineId;
      task.stageId = newLead.stageId;
    }

    if (pipelineId !== undefined && String(pipelineId) !== String(task.pipelineId)) {
      task.pipelineId = pipelineId;
    }
    if (stageId !== undefined && String(stageId) !== String(task.stageId)) {
      task.stageId = stageId;
    }

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (status !== undefined) task.status = status;
    if (priority !== undefined) task.priority = priority;
    if (dueDate !== undefined) task.dueDate = dueDate;
    if (assignedUserId !== undefined) task.assignedUserId = assignedUserId;

    task.lastUpdatedBy = user.userId;
    await task.save();

    return await Task.findByPk(task.id, {
      include: [
        {
          model: Lead,
          as: 'lead',
          required: true,
          include: [
            { model: User, as: 'assignedUser', required: false },
            { model: Pipeline, as: 'pipeline', required: true },
            { model: Stage, as: 'stage', required: true },
          ],
        },
        { model: User, as: 'assignedUser', required: false },
      ],
    });
  },

  async deleteTask(id, user) {
    const task = await Task.findByPk(id);
    if (!task) {
      const err = new Error('Task not found');
      err.code = ErrorCodesMeta.NOT_FOUND.code;
      throw err;
    }

    if (user.role === UserRole.ADMIN && String(task.tenantId) !== String(user.tenantId)) {
      const err = new Error('Admins can only delete tasks in their own tenant');
      err.code = ErrorCodesMeta.FORBIDDEN.code;
      throw err;
    }

    if (user.role !== UserRole.SUPERADMIN && user.role !== UserRole.ADMIN) {
      const err = new Error('Only admins can delete tasks');
      err.code = ErrorCodesMeta.FORBIDDEN.code;
      throw err;
    }

    await task.destroy();
    return { success: true };
  },
};

export default TaskService;