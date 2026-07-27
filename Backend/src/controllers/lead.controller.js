import LeadService from '../services/lead.service.js';
import { httpResponse } from '../utils/httpResponse.js';
import { ErrorCodesMeta } from '../constants/error-codes.js';

class LeadController {
  async createLead(req, res) {
    try {
      const result = await LeadService.createLead(req.body, req.user);
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

  async getAllLeads(req, res) {
    try {
      const result = await LeadService.getAllLeads(req.user);
      return httpResponse.SUCCESS(res, result);
    } catch (error) {
      return httpResponse.INTERNAL_SERVER_ERROR(res, {}, error.message || ErrorCodesMeta.INTERNAL_SERVER_ERROR.message);
    }
  }

  async getLeadById(req, res) {
    try {
      const result = await LeadService.getLeadById(req.params.id, req.user);
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

  async updateLead(req, res) {
    try {
      const result = await LeadService.updateLead(req.params.id, req.body, req.user);
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

  async deleteLead(req, res) {
    try {
      const result = await LeadService.deleteLead(req.params.id, req.user);
      return httpResponse.SUCCESS(res, result, 'Lead deleted successfully');
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

  async getLeadHistory(req, res) {
    try {
      const result = await LeadService.getLeadHistory(req.params.id, req.user);
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

export default new LeadController();