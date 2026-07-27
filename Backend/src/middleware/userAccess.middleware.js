import { httpResponse } from '../utils/httpResponse.js';
import { ErrorCodesMeta } from '../constants/error-codes.js';
import { UserRole } from '../constants/user-roles.js';

export const allowUserTenantAccess = () => {
  return (req, res, next) => {
    const { id } = req.params;
    const user = req.user;

    if (!user) {
      return httpResponse.UNAUTHORIZED(res, {}, ErrorCodesMeta.UNAUTHORIZED.message);
    }

    if (user.role === UserRole.SUPERADMIN) {
      return next();
    }

    if (user.role !== UserRole.ADMIN) {
      return httpResponse.FORBIDDEN(res, {}, 'Access denied');
    }

    req.targetUserId = id;
    return next();
  };
};