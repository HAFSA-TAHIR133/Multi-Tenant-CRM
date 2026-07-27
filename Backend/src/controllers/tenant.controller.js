import TenantService from '../services/tenant.service.js';
import { httpResponse } from '../utils/httpResponse.js';
import { ErrorCodesMeta } from '../constants/error-codes.js';
import { UserRole } from '../constants/user-roles.js';

class TenantController {
  async createTenant(req, res) {
    try {
      const result = await TenantService.createTenant(req.body);
      return httpResponse.CREATED(res, result);
    } 
    catch (error) {
      if (error.code === ErrorCodesMeta.CONFLICT.code) {
        return httpResponse.CONFLICT(res, {}, error.message);
      }

      return httpResponse.BAD_REQUEST(
        res,
        {},
        error.message || ErrorCodesMeta.BAD_REQUEST.message
      );
    }
  }

  async getAllTenants(req, res) {
    try {
      const result = await TenantService.getAllTenants(req.user);
      return httpResponse.SUCCESS(res, result);
    } 
    catch (error) {
      return httpResponse.INTERNAL_SERVER_ERROR(
        res,
        {},
        error.message || ErrorCodesMeta.INTERNAL_SERVER_ERROR.message
      );
    }
  }

  async getTenantById(req, res) {
    try {
      const { id } = req.params;
      const result = await TenantService.getTenantById(id, req.user);
      return httpResponse.SUCCESS(res, result);
    } 
    catch (error) {
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

  async updateTenant(req, res) {
    try {
      const { id } = req.params;
      const result = await TenantService.updateTenant(id, req.body, req.user);
      return httpResponse.SUCCESS(res, result);
    } 
    catch (error) {
      if (error.code === ErrorCodesMeta.NOT_FOUND.code) {
        return httpResponse.NOT_FOUND(res, {}, error.message);
      }

      if (error.code === ErrorCodesMeta.CONFLICT.code) {
        return httpResponse.CONFLICT(res, {}, error.message);
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

  async updateTenantStatus(req, res) {
    try {
      const { status } = req.body;
      console.log(req.body);
      const tenant = await TenantService.updateTenantStatus(req.params.id, status);
      return httpResponse.SUCCESS(res, tenant, 'Tenant status updated successfully');
    } 
    catch (error) {
      if (error.code === ErrorCodesMeta.NOT_FOUND.code) {
        return httpResponse.NOT_FOUND(res, {}, error.message);
      }

      if (error.code === ErrorCodesMeta.FORBIDDEN.code) {
        return httpResponse.FORBIDDEN(res, {}, error.message);
      }

      if (error.code === ErrorCodesMeta.BAD_REQUEST.code) {
        return httpResponse.BAD_REQUEST(res, {}, error.message);
      }

      return httpResponse.BAD_REQUEST(
        res,
        {},
        error.message || ErrorCodesMeta.BAD_REQUEST.message
      );
    }
  }

  async deleteTenant(req, res) {
    try {
      const { id } = req.params;
      const result = await TenantService.deleteTenant(id);
      return httpResponse.SUCCESS(res, result, 'Tenant deleted successfully');
    } 
    catch (error) {
      if (error.code === ErrorCodesMeta.NOT_FOUND.code) {
        return httpResponse.NOT_FOUND(res, {}, error.message);
      }

      return httpResponse.INTERNAL_SERVER_ERROR(
        res,
        {},
        error.message || ErrorCodesMeta.INTERNAL_SERVER_ERROR.message
      );
    }
  }
}

export default new TenantController();