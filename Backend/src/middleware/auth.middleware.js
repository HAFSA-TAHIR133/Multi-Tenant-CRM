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

      // Check tenant status (skip for users without a tenant)
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

      // FIXED: Safely convert roles to Numbers before checking hierarchy
      const userRoleNum = Number(decoded.role);
const requiredRoleNum = Number(requiredRole);

if (
  requiredRole !== undefined &&
  !isNaN(userRoleNum) &&
  !isNaN(requiredRoleNum) &&
  userRoleNum < requiredRoleNum // FIXED: Block if user's role level is LESS than required
) {
  return httpResponse.FORBIDDEN(
    res,
    {},
    ErrorCodesMeta.INSUFFICIENT_PERMISSION?.message ||
      ErrorCodesMeta.FORBIDDEN.message
  );
}

      // Standardize user object
      req.user = {
        ...decoded,
        id: decoded.id || decoded.userId,
      };

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