import { Op } from 'sequelize';
import { Task, Lead, User, Tenant, Pipeline, Stage } from '../models/index.js';
import { UserRole } from '../constants/user-roles.js';
import { ErrorCodesMeta } from '../constants/error-codes.js';

const TaskService = {
  async createTask(data, user) {
    const {
      leadId,
      title,
      description,
      status = 'pending',
      priority,
      dueDate,
      assignedUserId,
      pipelineId,
      stageId,
    } = data;

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

    const currentUserId = user.userId || user.id;

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
      createdBy: currentUserId,
      lastUpdatedBy: currentUserId,
    });

    return task;
  },

  async getAllTasks(user) {
    const include = [
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
      const currentUserId = user.userId || user.id;
      return await Task.findAll({
        where: { tenantId: user.tenantId },
        include: [
          {
            model: Lead,
            as: 'lead',
            required: true,
            where: { assignedUserId: currentUserId },
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
    const numericId = Number(id);
    const task = await Task.findByPk(numericId, {
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
      const currentUserId = user.userId || user.id;
      if (
        String(task.tenantId) !== String(user.tenantId) ||
        String(task.lead?.assignedUserId || '') !== String(currentUserId)
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

  // TaskService.js

async updateTask(id, data, user) {
  const currentUserId = user.userId || user.id;

  // 1. Validate task existence and tenant permission
  const existingTask = await Task.findByPk(id);
  if (!existingTask) {
    const err = new Error('Task not found');
    err.code = 404;
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

  const taskUpdates = { lastUpdatedBy: currentUserId };

  if (title !== undefined) taskUpdates.title = title;
  if (description !== undefined) taskUpdates.description = description;
  if (status !== undefined) taskUpdates.status = status;
  if (priority !== undefined) taskUpdates.priority = priority;
  if (dueDate !== undefined) taskUpdates.dueDate = dueDate;
  if (assignedUserId !== undefined) taskUpdates.assignedUserId = assignedUserId;
  if (pipelineId !== undefined) taskUpdates.pipelineId = Number(pipelineId);

  // Parse stageId explicitly
  let parsedStageId = undefined;
  if (stageId !== undefined) {
    parsedStageId = Number(stageId);
    taskUpdates.stageId = parsedStageId;
  }

  // Execute database updates inside a Managed Transaction
  await Task.sequelize.transaction(async (t) => {
    // A. Direct DB Update on Task
    await Task.update(taskUpdates, {
      where: { id },
      transaction: t,
    });

    // B. Direct DB Update on Associated Lead (if stageId changed)
    if (parsedStageId !== undefined && existingTask.leadId) {
      await Lead.update(
        {
          stageId: parsedStageId,
          lastUpdatedBy: currentUserId,
        },
        {
          where: { id: existingTask.leadId },
          transaction: t,
        }
      );
    }
  });

  // 2. Fetch fresh Task instance with re-loaded nested Lead association
  const freshTask = await Task.findByPk(id, {
    include: [
      {
        model: Lead,
        as: 'lead',
        required: false,
        include: [
          { model: User, as: 'assignedUser', required: false },
          { model: Pipeline, as: 'pipeline', required: false },
          { model: Stage, as: 'stage', required: false },
        ],
      },
      { model: User, as: 'assignedUser', required: false },
    ],
  });

  return freshTask;
},

async moveTaskStage(id, stageId, user) {
  const currentUserId = user?.userId || user?.id;
  const parsedStageId = Number(stageId);

  const existingTask = await Task.findByPk(id);
  if (!existingTask) {
    const err = new Error('Task not found');
    err.code = 404;
    throw err;
  }

  // Execute Transaction to enforce both updates simultaneously
  await Task.sequelize.transaction(async (t) => {
    // 1. Force update Task table
    await Task.update(
      { stageId: parsedStageId, lastUpdatedBy: currentUserId },
      { where: { id }, transaction: t }
    );

    // 2. Force update Lead table
    if (existingTask.leadId) {
      await Lead.update(
        { stageId: parsedStageId, lastUpdatedBy: currentUserId },
        { where: { id: existingTask.leadId }, transaction: t }
      );
    }
  });

  // 3. Return completely fresh populated record
  return await Task.findByPk(id, {
    include: [
      {
        model: Lead,
        as: 'lead',
        required: false,
        include: [
          { model: Pipeline, as: 'pipeline', required: false },
          { model: Stage, as: 'stage', required: false },
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

  async getTasksForUser(userId, actor) {
    const targetUser = await User.findByPk(userId, {
      include: [{ model: Tenant, as: 'tenant', required: false }],
    });

    if (!targetUser) {
      const err = new Error('User not found');
      err.code = ErrorCodesMeta.NOT_FOUND.code;
      throw err;
    }

    const actorId = actor.userId || actor.id;

    if (actor.role === UserRole.USER) {
      if (String(targetUser.id) !== String(actorId)) {
        const err = new Error('You can only view your own tasks');
        err.code = ErrorCodesMeta.FORBIDDEN.code;
        throw err;
      }
    } else if (actor.role === UserRole.ADMIN) {
      if (String(targetUser.tenantId) !== String(actor.tenantId)) {
        const err = new Error('Admins can only view tasks for users in their tenant');
        err.code = ErrorCodesMeta.FORBIDDEN.code;
        throw err;
      }
    }

    const taskInclude = [
      {
        model: Lead,
        as: 'lead',
        required: false,
        include: [
          { model: User, as: 'assignedUser', required: false },
          { model: Pipeline, as: 'pipeline', required: true },
          { model: Stage, as: 'stage', required: true },
        ],
      },
      { model: User, as: 'assignedUser', required: false },
    ];

    const where = { assignedUserId: targetUser.id };
    if (actor.role !== UserRole.SUPERADMIN) {
      where.tenantId = targetUser.tenantId;
    }

    const tasks = await Task.findAll({
      where,
      include: taskInclude,
      order: [['createdAt', 'DESC']],
    });

    return tasks;
  },

  // task.service.js
async moveTaskStage(taskId, stageId, user) {
  const task = await Task.findByPk(taskId);
  if (!task) throw new Error('Task not found');

  const parsedStageId = Number(stageId);
  const currentUserId = user?.userId || user?.id;

  // 1. Update the Task's stageId directly in DB
  await Task.update(
    { stageId: parsedStageId, lastUpdatedBy: currentUserId },
    { where: { id: taskId } }
  );

  // 2. Update the associated Lead's stageId directly in DB
  if (task.leadId) {
    await Lead.update(
      { stageId: parsedStageId, lastUpdatedBy: currentUserId },
      { where: { id: task.leadId } }
    );
  }

  // 3. Fetch and return the fully populated task object
  return await Task.findByPk(taskId, {
    include: [
      {
        model: Lead,
        as: 'lead',
        include: [
          { model: Pipeline, as: 'pipeline' },
          { model: Stage, as: 'stage' },
        ],
      },
      { model: User, as: 'assignedUser' },
    ],
  });
}
};

export default TaskService;