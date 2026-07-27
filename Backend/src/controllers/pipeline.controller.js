import PipelineService from '../services/pipeline.service.js';
import { httpResponse } from '../utils/httpResponse.js';
import { ErrorCodesMeta } from '../constants/error-codes.js';

class PipelineController {
  async createPipeline(req, res) {
    try {
      const result = await PipelineService.createPipeline(req.body, req.user);
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

  async getAllPipelines(req, res) {
    try {
      const result = await PipelineService.getAllPipelines(req.user);
      return httpResponse.SUCCESS(res, result);
    } catch (error) {
      return httpResponse.INTERNAL_SERVER_ERROR(res, {}, error.message || ErrorCodesMeta.INTERNAL_SERVER_ERROR.message);
    }
  }

  async getPipelineById(req, res) {
    try {
      const result = await PipelineService.getPipelineById(req.params.id, req.user);
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

  async updatePipeline(req, res) {
    try {
      const result = await PipelineService.updatePipeline(req.params.id, req.body, req.user);
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

  async deletePipeline(req, res) {
    try {
      const result = await PipelineService.deletePipeline(req.params.id, req.user);
      return httpResponse.SUCCESS(res, result, 'Pipeline deleted successfully');
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

  async assignUsers(req, res) {
    try {
      const { userIds } = req.body;
      const result = await PipelineService.assignUsers(req.params.id, userIds, req.user);
      return httpResponse.SUCCESS(res, result, 'Users assigned successfully');
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

  async getAssignedUsers(req, res) {
    try {
      const result = await PipelineService.getAssignedUsers(req.params.id, req.user);
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
}

export default new PipelineController();