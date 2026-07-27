import StageService from '../services/stage.service.js';
import { httpResponse } from '../utils/httpResponse.js';
import { ErrorCodesMeta } from '../constants/error-codes.js';

class StageController {
  async createStage(req, res) {
    try {
      const result = await StageService.createStage(req.body, req.user);
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

  async getAllStages(req, res) {
    try {
      const result = await StageService.getAllStages(req.user);
      return httpResponse.SUCCESS(res, result);
    } catch (error) {
      return httpResponse.INTERNAL_SERVER_ERROR(res, {}, error.message || ErrorCodesMeta.INTERNAL_SERVER_ERROR.message);
    }
  }

  async getStageById(req, res) {
    try {
      const result = await StageService.getStageById(req.params.id, req.user);
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

  async updateStage(req, res) {
    try {
      const result = await StageService.updateStage(req.params.id, req.body, req.user);
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

  async deleteStage(req, res) {
    try {
      const result = await StageService.deleteStage(req.params.id, req.user);
      return httpResponse.SUCCESS(res, result, 'Stage deleted successfully');
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

  async reorderStages(req, res) {
    try {
      const { pipelineId, stageIds } = req.body;
      const result = await StageService.reorderStages(pipelineId, stageIds, req.user);
      return httpResponse.SUCCESS(res, result, 'Stages reordered successfully');
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
}

export default new StageController();