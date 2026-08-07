// services/taskComments.service.js
import { Task, TaskComment, Lead, Tenant, User } from "../models/index.js";
import { UserRole } from "../constants/user-roles.js";
import { ErrorCodesMeta } from "../constants/error-codes.js";

const TaskCommentsService = {
 async getCommentsForTask(taskId, user) {
  const task = await Task.findByPk(taskId, {
    include: [
      {
        model: Lead,
        as: "lead",
        required: true,
        include: [{ model: Tenant, as: "tenant", required: true }],
      },
    ],
  });

  if (!task) {
    const err = new Error("Task not found");
    err.code = ErrorCodesMeta.NOT_FOUND.code;
    throw err;
  }

  // Access rules same as getTaskById
  if (user.role === UserRole.SUPERADMIN) {
    // ok
  } else if (user.role === UserRole.ADMIN) {
    if (String(task.tenantId) !== String(user.tenantId)) {
      const err = new Error(
        "Admins can only access tasks in their own tenant"
      );
      err.code = ErrorCodesMeta.FORBIDDEN.code;
      throw err;
    }
  } else if (user.role === UserRole.USER) {
    // ✅ Check task's assignedUserId, not lead's
    const currentUserId = user.userId || user.id;
    const isTaskAssigned = String(task.assignedUserId || "") === String(currentUserId);
    const isLeadAssigned = String(task.lead.assignedUserId || "") === String(currentUserId);
    
    if (
      String(task.tenantId) !== String(user.tenantId) ||
      (!isTaskAssigned && !isLeadAssigned)
    ) {
      const err = new Error("Access denied: task is not assigned to you");
      err.code = ErrorCodesMeta.FORBIDDEN.code;
      throw err;
    }
  } else {
    const err = new Error(ErrorCodesMeta.FORBIDDEN.message);
    err.code = ErrorCodesMeta.FORBIDDEN.code;
    throw err;
  }

  return await TaskComment.findAll({
    where: { taskId },
    include: [{ model: User, as: "user", required: false }],
    order: [["createdAt", "ASC"]],
  });
},

async createCommentForTask(taskId, data, user) {
  const { text } = data;

  if (!text || !text.trim()) {
    const err = new Error("Comment text is required");
    err.code = ErrorCodesMeta.BAD_REQUEST.code;
    throw err;
  }

  const task = await Task.findByPk(taskId, {
    include: [
      {
        model: Lead,
        as: "lead",
        required: true,
        include: [{ model: Tenant, as: "tenant", required: true }],
      },
    ],
  });

  if (!task) {
    const err = new Error("Task not found");
    err.code = ErrorCodesMeta.NOT_FOUND.code;
    throw err;
  }

  // Same rules as updateTask
  if (user.role === UserRole.ADMIN) {
    if (String(task.tenantId) !== String(user.tenantId)) {
      const err = new Error(
        "Admins can only update tasks in their own tenant"
      );
      err.code = ErrorCodesMeta.FORBIDDEN.code;
      throw err;
    }
  } else if (user.role === UserRole.USER) {
    // ✅ Check task's assignedUserId, not lead's
    const currentUserId = user.userId || user.id;
    const isTaskAssigned = String(task.assignedUserId || "") === String(currentUserId);
    const isLeadAssigned = String(task.lead.assignedUserId || "") === String(currentUserId);
    
    if (
      String(task.tenantId) !== String(user.tenantId) ||
      (!isTaskAssigned && !isLeadAssigned)
    ) {
      const err = new Error(
        "Users can only comment on their assigned leads"
      );
      err.code = ErrorCodesMeta.FORBIDDEN.code;
      throw err;
    }
  } else if (user.role !== UserRole.SUPERADMIN) {
    const err = new Error(ErrorCodesMeta.FORBIDDEN.message);
    err.code = ErrorCodesMeta.FORBIDDEN.code;
    throw err;
  }

  const comment = await TaskComment.create({
    taskId,
    tenantId: task.tenantId,
    userId: user.userId,
    text,
  });

  // Include user for frontend display
  return await TaskComment.findByPk(comment.id, {
    include: [{ model: User, as: "user", required: false }],
  });
},
};

export default TaskCommentsService;