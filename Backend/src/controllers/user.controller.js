import UserService from '../services/user.service.js';
import { httpResponse } from '../utils/httpResponse.js';
import { ErrorCodesMeta } from '../constants/error-codes.js';

class UserController {
  async getMe(req, res) {
    try {
      const result = await UserService.getUserById(req.user.id, req.user);
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

  async updateMe(req, res) {
    try {
      const result = await UserService.updateUser(req.user.id, req.body, req.user);
      return httpResponse.SUCCESS(res, result);
    } catch (error) {
      if (error.code === ErrorCodesMeta.CONFLICT.code) {
        return httpResponse.CONFLICT(res, {}, error.message);
      }
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

  async createUser(req, res) {
    try {
      const result = await UserService.createUser(req.body, req.user);
      return httpResponse.CREATED(res, result);
    } catch (error) {
      if (error.code === ErrorCodesMeta.CONFLICT.code) {
        return httpResponse.CONFLICT(res, {}, error.message);
      }
      if (error.code === ErrorCodesMeta.FORBIDDEN.code) {
        return httpResponse.FORBIDDEN(res, {}, error.message);
      }
      if (error.code === ErrorCodesMeta.NOT_FOUND.code) {
        return httpResponse.NOT_FOUND(res, {}, error.message);
      }
      return httpResponse.BAD_REQUEST(
        res,
        {},
        error.message || ErrorCodesMeta.BAD_REQUEST.message
      );
    }
  }

  async getAllUsers(req, res) {
    try {
      const result = await UserService.getAllUsers(req.user);
      return httpResponse.SUCCESS(res, result);
    } catch (error) {
      return httpResponse.INTERNAL_SERVER_ERROR(
        res,
        {},
        error.message || ErrorCodesMeta.INTERNAL_SERVER_ERROR.message
      );
    }
  }

  async getUserById(req, res) {
    try {
      const result = await UserService.getUserById(req.params.id, req.user);
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

  async updateUser(req, res) {
    try {
      const result = await UserService.updateUser(req.params.id, req.body, req.user);
      return httpResponse.SUCCESS(res, result);
    } catch (error) {
      if (error.code === ErrorCodesMeta.CONFLICT.code) {
        return httpResponse.CONFLICT(res, {}, error.message);
      }
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

  async deleteUser(req, res) {
    try {
      const result = await UserService.deleteUser(req.params.id, req.user);
      return httpResponse.SUCCESS(res, result, 'User deleted successfully');
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

export default new UserController();