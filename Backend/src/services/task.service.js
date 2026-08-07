import { Task, Lead, User, Tenant, TaskDocument } from '../models/index.js';
import { UserRole } from '../constants/user-roles.js';
import { ErrorCodesMeta } from '../constants/error-codes.js';
import { uploadToCloudinary,deleteFromCloudinary } from '../utils/fileStorage.js';
const TaskService = {
  async createTask(data, user) {
    const { leadId, title, description, status = 'pending', priority, dueDate, assignedUserId } = data;

    if (!title || !leadId) {
      const err = new Error('Title and Lead ID are required');
      err.code = ErrorCodesMeta.BAD_REQUEST.code;
      throw err;
    }

    const lead = await Lead.findByPk(leadId);
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

    return await Task.create({
      tenantId: lead.tenantId,
      leadId,
      title,
      description,
      status,
      priority,
      dueDate,
      assignedUserId: assignedUserId ?? null,
      createdBy: currentUserId,
      lastUpdatedBy: currentUserId,
    });
  },

  async getAllTasks(user, query = {}) {
    const { userId, leadId } = query;
    const where = {};

    // Tenant isolation
    if (user.role !== UserRole.SUPERADMIN && user.tenantId) {
      where.tenantId = user.tenantId;
    }

    // Role-based visibility scoping
    if (user.role === UserRole.USER) {
      const currentUserId = user.userId || user.id;
      where.assignedUserId = Number(currentUserId);
    } else if (userId) {
      where.assignedUserId = Number(userId);
    }

    if (leadId) {
      where.leadId = Number(leadId);
    }

    return await Task.findAll({
      where,
      include: [
        {
          model: Lead,
          as: 'lead',
          required: false,
          attributes: ['id', 'title', 'companyName', 'contactName', 'email', 'assignedUserId'],
        },
        {
          model: User,
          as: 'assignedUser',
          required: false,
          attributes: ['id', 'name', 'email', 'role'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });
  },

  async getTaskById(id, user) {
    const task = await Task.findByPk(id, {
      include: [
        {
          model: Lead,
          as: 'lead',
          required: false,
          attributes: ['id', 'title', 'companyName', 'contactName', 'email', 'assignedUserId'],
        },
        {
          model: User,
          as: 'assignedUser',
          required: false,
          attributes: ['id', 'name', 'email', 'role'],
        },
      ],
    });

    if (!task) {
      const err = new Error('Task not found');
      err.code = ErrorCodesMeta.NOT_FOUND.code;
      throw err;
    }

    this._checkAccessPermission(task, user);
    return task;
  },

  async updateTask(id, data, user) {
    const currentUserId = user.userId || user.id;
    const existingTask = await Task.findByPk(id, {
      include: [{ model: Lead, as: 'lead', attributes: ['id', 'assignedUserId'] }],
    });

    if (!existingTask) {
      const err = new Error('Task not found');
      err.code = ErrorCodesMeta.NOT_FOUND.code;
      throw err;
    }

    this._checkAccessPermission(existingTask, user);

    const { title, description, status, priority, dueDate, assignedUserId } = data;

    // Normal users cannot reassign tasks to others
    if (user.role === UserRole.USER && assignedUserId !== undefined && Number(assignedUserId) !== Number(currentUserId)) {
      const err = new Error('Users cannot reassign tasks');
      err.code = ErrorCodesMeta.FORBIDDEN.code;
      throw err;
    }

    const taskUpdates = { lastUpdatedBy: currentUserId };
    if (title !== undefined) taskUpdates.title = title;
    if (description !== undefined) taskUpdates.description = description;
    if (status !== undefined) taskUpdates.status = status;
    if (priority !== undefined) taskUpdates.priority = priority;
    if (dueDate !== undefined) taskUpdates.dueDate = dueDate;
    if (assignedUserId !== undefined) taskUpdates.assignedUserId = assignedUserId;

    await existingTask.update(taskUpdates);

    return await this.getTaskById(id, user);
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

  async uploadTaskDocument(taskId, file, user) {
    const task = await Task.findByPk(taskId, {
      include: [{ model: Lead, as: 'lead', attributes: ['id', 'assignedUserId'] }],
    });

    if (!task) {
      const err = new Error('Task not found');
      err.code = ErrorCodesMeta.NOT_FOUND.code;
      throw err;
    }

    this._checkAccessPermission(task, user);

    const currentUserId = user.userId || user.id;
    const cloudUrl = await uploadToCloudinary(
      file.path,
      `tenants/${task.tenantId}/tasks/${taskId}`
    );

    return await TaskDocument.create({
      taskId,
      tenantId: task.tenantId,
      name: file.originalname,
      url: cloudUrl,
      createdBy: currentUserId,
    });
  },

  async getTaskDocuments(taskId, user) {
    const task = await Task.findByPk(taskId, {
      include: [{ model: Lead, as: 'lead', attributes: ['id', 'assignedUserId'] }],
    });

    if (!task) {
      const err = new Error('Task not found');
      err.code = ErrorCodesMeta.NOT_FOUND.code;
      throw err;
    }

    this._checkAccessPermission(task, user);

    return await TaskDocument.findAll({
      where: { taskId },
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });
  },

    async deleteDocumentForTask(taskId, documentId, user) {
    const task = await Task.findByPk(taskId);

    if (!task) {
      const err = new Error('Task not found');
      err.code = ErrorCodesMeta.NOT_FOUND.code;
      throw err;
    }

    // RBAC Validation
    if (user.role === UserRole.ADMIN) {
      if (String(task.tenantId) !== String(user.tenantId)) {
        const err = new Error('Admins can only delete documents in their own tenant');
        err.code = ErrorCodesMeta.FORBIDDEN.code;
        throw err;
      }
    } else if (user.role === UserRole.USER) {
      const err = new Error('Regular users are not allowed to delete task documents');
      err.code = ErrorCodesMeta.FORBIDDEN.code;
      throw err;
    } else if (user.role !== UserRole.SUPERADMIN) {
      const err = new Error(ErrorCodesMeta.FORBIDDEN.message);
      err.code = ErrorCodesMeta.FORBIDDEN.code;
      throw err;
    }

    const document = await TaskDocument.findOne({
      where: { id: documentId, taskId, tenantId: task.tenantId },
    });

    if (!document) {
      const err = new Error('Document not found');
      err.code = ErrorCodesMeta.NOT_FOUND.code;
      throw err;
    }

    // Delete from Cloudinary (helper handles raw/image/auto)
    await deleteFromCloudinary(document.url);

    // Remove from Database
    await document.destroy();
    return { message: 'Task document deleted successfully' };
  },

  // ✅ Restore this helper — it was missing
  _checkAccessPermission(task, user) {
    if (user.role === UserRole.SUPERADMIN) return;

    if (String(task.tenantId) !== String(user.tenantId)) {
      const err = new Error('Access denied: tenant mismatch');
      err.code = ErrorCodesMeta.FORBIDDEN.code;
      throw err;
    }

    if (user.role === UserRole.USER) {
      const currentUserId = user.userId || user.id;
      const isAssignedUser = String(task.assignedUserId || '') === String(currentUserId);
      const isLeadOwner = String(task.lead?.assignedUserId || '') === String(currentUserId);

      if (!isAssignedUser && !isLeadOwner) {
        const err = new Error('Access denied: task is not assigned to you');
        err.code = ErrorCodesMeta.FORBIDDEN.code;
        throw err;
      }
    }
  },
};

export default TaskService;