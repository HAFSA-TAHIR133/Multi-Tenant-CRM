import TaskService from '../services/task.service.js';
import { httpResponse } from '../utils/httpResponse.js';
import { ErrorCodesMeta } from '../constants/error-codes.js';

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
      const result = await TaskService.getAllTasks(req.user);
      return httpResponse.SUCCESS(res, result);
    } catch (error) {
      return httpResponse.INTERNAL_SERVER_ERROR(res, {}, error.message || ErrorCodesMeta.INTERNAL_SERVER_ERROR.message);
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

  async updateTask(req, res) {
    try {
      const result = await TaskService.updateTask(req.params.id, req.body, req.user);
      return httpResponse.SUCCESS(res, result);
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
}

export default new TaskController();