import TaskService from '../services/task.service.js';
import { httpResponse } from '../utils/httpResponse.js';
import { ErrorCodesMeta } from '../constants/error-codes.js';
import { sendEmail } from '../utils/email.js';
import { User } from '../models/index.js';

class TaskController {
  async createTask(req, res) {
    try {
      const result = await TaskService.createTask(req.body, req.user);

      const { assignedUserId, title, dueDate } = req.body;

      if (assignedUserId) {
        const assignedUser = await User.findByPk(Number(assignedUserId));

        if (assignedUser?.email) {
          await sendEmail({
            to: assignedUser.email,
            subject: `Task Assigned: ${title || 'Untitled Task'}`,
            html: `
              <p>Hello ${assignedUser.name || 'there'},</p>
              <p>A new task has been assigned to you:</p>
              <ul>
                <li><strong>Task:</strong> ${title || 'Untitled Task'}</li>
                <li><strong>Due Date:</strong> ${dueDate || 'Not set'}</li>
              </ul>
            `,
          });
        }
      }

      return httpResponse.CREATED(res, result);
    } catch (error) {
      if (error.code === ErrorCodesMeta.NOT_FOUND.code) {
        return httpResponse.NOT_FOUND(res, {}, error.message);
      }
      if (error.code === ErrorCodesMeta.FORBIDDEN.code) {
        return httpResponse.FORBIDDEN(res, {}, error.message);
      }
      return httpResponse.BAD_REQUEST(
        res,
        {},
        error.message || ErrorCodesMeta.BAD_REQUEST.message
      );
    }
  }

  async getAllTasks(req, res) {
    try {
      const tasks = await TaskService.getAllTasks(req.user, req.query);
      return httpResponse.SUCCESS(res, tasks);
    } catch (error) {
      return httpResponse.INTERNAL_SERVER_ERROR(res, {}, error.message);
    }
  }

  async getTaskById(req, res) {
    try {
      const result = await TaskService.getTaskById(req.params.id, req.user);
      return httpResponse.SUCCESS(res, result);
    } catch (error) {
      if (error.code === ErrorCodesMeta.NOT_FOUND.code) {
        return httpResponse.NOT_FOUND(res, {}, error.message);
      }
      if (error.code === ErrorCodesMeta.FORBIDDEN.code) {
        return httpResponse.FORBIDDEN(res, {}, error.message);
      }
      return httpResponse.INTERNAL_SERVER_ERROR(res, {}, error.message);
    }
  }

  async updateTask(req, res) {
    try {
      const updatedTask = await TaskService.updateTask(req.params.id, req.body, req.user);
      return httpResponse.SUCCESS(res, updatedTask);
    } catch (error) {
      if (error.code === ErrorCodesMeta.NOT_FOUND.code) {
        return httpResponse.NOT_FOUND(res, {}, error.message);
      }
      if (error.code === ErrorCodesMeta.FORBIDDEN.code) {
        return httpResponse.FORBIDDEN(res, {}, error.message);
      }
      return httpResponse.BAD_REQUEST(res, {}, error.message);
    }
  }

  async deleteTask(req, res) {
    try {
      const result = await TaskService.deleteTask(req.params.id, req.user);
      return httpResponse.SUCCESS(res, result, 'Task deleted successfully');
    } catch (error) {
      if (error.code === ErrorCodesMeta.NOT_FOUND.code) {
        return httpResponse.NOT_FOUND(res, {}, error.message);
      }
      if (error.code === ErrorCodesMeta.FORBIDDEN.code) {
        return httpResponse.FORBIDDEN(res, {}, error.message);
      }
      return httpResponse.INTERNAL_SERVER_ERROR(res, {}, error.message);
    }
  }

  async uploadTaskDocument(req, res) {
    try {
      if (!req.file) {
        return httpResponse.BAD_REQUEST(res, {}, 'No file uploaded.');
      }
      const result = await TaskService.uploadTaskDocument(req.params.id, req.file, req.user);
      return httpResponse.CREATED(res, result, 'Document uploaded successfully');
    } catch (error) {
      if (error.code === ErrorCodesMeta.NOT_FOUND.code) {
        return httpResponse.NOT_FOUND(res, {}, error.message);
      }
      if (error.code === ErrorCodesMeta.FORBIDDEN.code) {
        return httpResponse.FORBIDDEN(res, {}, error.message);
      }
      return httpResponse.BAD_REQUEST(
        res,
        {},
        error.message || ErrorCodesMeta.BAD_REQUEST.message
      );
    }
  }

  async getTaskDocuments(req, res) {
    try {
      const result = await TaskService.getTaskDocuments(req.params.id, req.user);
      return httpResponse.SUCCESS(res, result);
    } catch (error) {
      if (error.code === ErrorCodesMeta.NOT_FOUND.code) {
        return httpResponse.NOT_FOUND(res, {}, error.message);
      }
      if (error.code === ErrorCodesMeta.FORBIDDEN.code) {
        return httpResponse.FORBIDDEN(res, {}, error.message);
      }
      return httpResponse.INTERNAL_SERVER_ERROR(res, {}, error.message);
    }
  }

async deleteDocumentForTask(req, res) {
  try {
    // Route is /:id/documents/:documentId
    const { id, documentId } = req.params;

    const result = await TaskService.deleteDocumentForTask(
      id,
      documentId,
      req.user
    );

    return httpResponse.SUCCESS(res, result, 'Document deleted successfully');
  } catch (error) {
    if (error.code === ErrorCodesMeta.NOT_FOUND.code) {
      return httpResponse.NOT_FOUND(res, {}, error.message);
    }
    if (error.code === ErrorCodesMeta.FORBIDDEN.code) {
      return httpResponse.FORBIDDEN(res, {}, error.message);
    }
    return httpResponse.INTERNAL_SERVER_ERROR(
      res,
      {},
      error.message || ErrorCodesMeta.INTERNAL_SERVER_ERROR.message
    );
  }
}
}

export default new TaskController();