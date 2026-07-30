import TaskService from '../services/task.service.js';
import { httpResponse } from '../utils/httpResponse.js';
import { ErrorCodesMeta } from '../constants/error-codes.js';
import { Task, Lead } from '../models/index.js';

class TaskController {
  async createTask(req, res) {
    try {
      const result = await TaskService.createTask(req.body, req.user);
      return httpResponse.CREATED(res, result);
    } catch (error) {
      if (error.code === ErrorCodesMeta.NOT_FOUND.code) {
        return httpResponse.NOT_FOUND(res, {}, error.message);
      }
      if (error.code === ErrorCodesMeta.FORBIDDEN.code) {
        return httpResponse.FORBIDDEN(res, {}, error.message);
      }
      return httpResponse.BAD_REQUEST(res, {}, error.message || ErrorCodesMeta.BAD_REQUEST.message);
    }
  }

  async getAllTasks(req, res) {
    try {
      const { userId, pipelineId } = req.query;
      const where = {};

      if (pipelineId) {
        const parsedPipelineId = Number(pipelineId);
        if (!Number.isNaN(parsedPipelineId)) {
          where.pipelineId = parsedPipelineId;
        }
      }

      if (userId) {
        const parsedUserId = Number(userId);
        if (Number.isNaN(parsedUserId)) {
          console.warn('Invalid userId in query:', userId);
          return res.status(400).json({ error: 'Invalid userId' });
        }
        where.assignedUserId = parsedUserId;
      }

      // Safeguard tenant isolation based on user context
      if (req.user?.role !== 'SUPERADMIN' && req.user?.tenantId) {
        where.tenantId = req.user.tenantId;
      }

      const tasks = await Task.findAll({
        where,
        include: [
          {
            model: Lead,
            as: 'lead',
            required: false,
          },
        ],
        order: [['createdAt', 'DESC']],
      });

      console.log('Returned tasks count:', tasks.length);
      res.json(tasks);
    } catch (err) {
      console.error('Error in getAllTasks:', err);
      res.status(500).json({ error: 'Failed to fetch tasks' });
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
      return httpResponse.INTERNAL_SERVER_ERROR(res, {}, error.message || ErrorCodesMeta.INTERNAL_SERVER_ERROR.message);
    }
  }

 async updateTask (req, res) {
  try {
    const { id } = req.params;
    const updatedTask = await TaskService.updateTask(id, req.body, req.user);
    return res.status(200).json({ data: updatedTask });
  } catch (error) {
    return res.status(error.code || 500).json({ message: error.message });
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
      return httpResponse.INTERNAL_SERVER_ERROR(res, {}, error.message || ErrorCodesMeta.INTERNAL_SERVER_ERROR.message);
    }
  }

  // task.controller.js
async updateTaskStage (req, res){
  try {
    const { id } = req.params;
    const { stageId } = req.body;
    const user = req.user;

    // Call the service method
    const updatedTask = await TaskService.moveTaskStage(id, stageId, user);

    return res.status(200).json(updatedTask);
  } catch (error) {
    return res.status(error.code || 500).json({ message: error.message });
  }
}
}

export default new TaskController();