import TaskNotesService from "../services/taskNotes.service.js";
import { httpResponse } from "../utils/httpResponse.js";
import { ErrorCodesMeta } from "../constants/error-codes.js";

class TaskNotesController {
  async getNotesForTask(req, res) {
    try {
      const { taskId } = req.params;
      const result = await TaskNotesService.getNotesForTask(taskId, req.user);
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

  async createNoteForTask(req, res) {
    try {
      const { taskId } = req.params;
      const result = await TaskNotesService.createNoteForTask(
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
      return httpResponse.BAD_REQUEST(
        res,
        {},
        error.message || ErrorCodesMeta.BAD_REQUEST.message
      );
    }
  }
}

export default new TaskNotesController();