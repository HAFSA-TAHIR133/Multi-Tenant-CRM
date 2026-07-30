import { Task, TaskDocument, Lead, Tenant } from "../models/index.js";
import { UserRole } from "../constants/user-roles.js";
import { ErrorCodesMeta } from "../constants/error-codes.js";
import cloudinary from "cloudinary";

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const TaskDocumentsService = {
  async getDocumentsForTask(taskId, user) {
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

    return await TaskDocument.findAll({
      where: { taskId },
      order: [["createdAt", "ASC"]],
    });
  },

  async uploadDocumentForTask(taskId, file, user) {
    if (!file) {
      const err = new Error("File is required");
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

    // RBAC same as updateTask
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
          "Users can only add documents for their assigned leads"
        );
        err.code = ErrorCodesMeta.FORBIDDEN.code;
        throw err;
      }
    } else if (user.role !== UserRole.SUPERADMIN) {
      const err = new Error(ErrorCodesMeta.FORBIDDEN.message);
      err.code = ErrorCodesMeta.FORBIDDEN.code;
      throw err;
    }

    // Upload to Cloudinary
    let uploadResult;
    try {
      uploadResult = await cloudinary.v2.uploader.upload(file.path, {
        folder: `tasks/${taskId}`,
        resource_type: "auto",
      });
    } catch (err) {
      const error = new Error("Failed to upload document");
      error.code = ErrorCodesMeta.BAD_REQUEST.code;
      throw error;
    }

    const doc = await TaskDocument.create({
      taskId,
      tenantId: task.tenantId,
      name: file.originalname || file.filename,
      url: uploadResult.secure_url,
      createdBy: user.userId,
    });

    return doc;
  },
};

export default TaskDocumentsService;