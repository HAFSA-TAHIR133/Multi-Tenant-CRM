// controllers/taskComments.controller.js
import TaskCommentsService from "../services/taskComments.service.js";
import { httpResponse } from "../utils/httpResponse.js";
import { ErrorCodesMeta } from "../constants/error-codes.js";

class TaskCommentsController {
  async getCommentsForTask(req, res) {
    try {
      const { taskId } = req.params;
      const result = await TaskCommentsService.getCommentsForTask(
        taskId,
        req.user
      );
      return httpResponse.SUCCESS(res, result);
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

  async createCommentForTask(req, res) {
    try {
      const { taskId } = req.params;
      const result = await TaskCommentsService.createCommentForTask(
        taskId,
        req.body,
        req.user
      );
      return httpResponse.CREATED(res, result);
    } catch (error) {
      if (error.code === ErrorCodesMeta.NOT_FOUND.code) {
        return httpResponse.NOT_FOUND(res, {}, error.message);
      }
      if (error.code === ErrorCodesMeta.FORBIDDEN.code) {
        return httpResponse.FORBIDDEN(res, {}, error.message);
      }
      if (error.code === ErrorCodesMeta.BAD_REQUEST.code) {
        return httpResponse.BAD_REQUEST(res, {}, error.message);
      }
      return httpResponse.INTERNAL_SERVER_ERROR(
        res,
        {},
        error.message || ErrorCodesMeta.INTERNAL_SERVER_ERROR.message
      );
    }
  }
}

export default new TaskCommentsController();