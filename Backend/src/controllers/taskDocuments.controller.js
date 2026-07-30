import TaskDocumentsService from "../services/taskDocuments.service.js";
import { httpResponse } from "../utils/httpResponse.js";
import { ErrorCodesMeta } from "../constants/error-codes.js";

class TaskDocumentsController {
  async getDocumentsForTask(req, res) {
    try {
      const { taskId } = req.params;
      const result = await TaskDocumentsService.getDocumentsForTask(
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

  async uploadDocumentForTask(req, res) {
    try {
      const { taskId } = req.params;
      const file = req.file; // set by multer

      const result = await TaskDocumentsService.uploadDocumentForTask(
        taskId,
        file,
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

export default new TaskDocumentsController();