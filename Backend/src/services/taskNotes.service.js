import { Task, TaskNote, Lead, Tenant } from "../models/index.js";
import { UserRole } from "../constants/user-roles.js";
import { ErrorCodesMeta } from "../constants/error-codes.js";

const TaskNotesService = {
  async getNotesForTask(taskId, user) {
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
      if (
        String(task.tenantId) !== String(user.tenantId) ||
        String(task.lead.assignedUserId || "") !== String(user.userId)
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

    return await TaskNote.findAll({
      where: { taskId },
      order: [["createdAt", "ASC"]],
    });
  },

  async createNoteForTask(taskId, data, user) {
    const { content } = data;

    if (!content || !content.trim()) {
      const err = new Error("Note content is required");
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
      if (
        String(task.tenantId) !== String(user.tenantId) ||
        String(task.lead.assignedUserId || "") !== String(user.userId)
      ) {
        const err = new Error(
          "Users can only add notes for their assigned leads"
        );
        err.code = ErrorCodesMeta.FORBIDDEN.code;
        throw err;
      }
    } else if (user.role !== UserRole.SUPERADMIN) {
      const err = new Error(ErrorCodesMeta.FORBIDDEN.message);
      err.code = ErrorCodesMeta.FORBIDDEN.code;
      throw err;
    }

    const note = await TaskNote.create({
      taskId,
      tenantId: task.tenantId,
      content,
      createdBy: user.userId,
      updatedBy: user.userId,
    });

    return note;
  },
};

export default TaskNotesService;