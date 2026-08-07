import jwt from 'jsonwebtoken';
import { httpResponse } from '../utils/httpResponse.js';
import { ErrorCodesMeta } from '../constants/error-codes.js';
import { Tenant } from '../models/index.js';

export const authMiddleware = (requiredRole) => {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return httpResponse.UNAUTHORIZED(
          res,
          {},
          ErrorCodesMeta.UNAUTHORIZED.message
        );
      }

      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Check tenant status (skip for users without a tenant, e.g. system-level)
      if (decoded.tenantId) {
        const tenant = await Tenant.findByPk(decoded.tenantId);
        if (!tenant) {
          return httpResponse.UNAUTHORIZED(res, {}, 'Tenant not found');
        }

        if (String(tenant.status || '').toLowerCase() === 'inactive') {
          return httpResponse.UNAUTHORIZED(
            res,
            {},
            ErrorCodesMeta.TENANT_INACTIVE?.message ||
              ErrorCodesMeta.FORBIDDEN.message
          );
        }
      }

      // Role check
      if (requiredRole && decoded.role < requiredRole) {
        return httpResponse.FORBIDDEN(
          res,
          {},
          ErrorCodesMeta.INSUFFICIENT_PERMISSION?.message ||
            ErrorCodesMeta.FORBIDDEN.message
        );
      }

      req.user = decoded;
      req.tenant = decoded.tenantId ? await Tenant.findByPk(decoded.tenantId) : null;

      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      return httpResponse.UNAUTHORIZED(
        res,
        {},
        ErrorCodesMeta.UNAUTHORIZED.message
      );
    }
  };
};