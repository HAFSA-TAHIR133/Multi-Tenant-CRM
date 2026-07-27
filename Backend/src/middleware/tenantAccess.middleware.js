import { httpResponse } from '../utils/httpResponse.js';
import { ErrorCodesMeta } from '../constants/error-codes.js';
import { UserRole } from '../constants/user-roles.js';

export const allowTenantOwner = () => {
  return (req, res, next) => {
    const { id: tenantId } = req.params;
    const user = req.user;

    if (!user) {
      return httpResponse.UNAUTHORIZED(res, {}, ErrorCodesMeta.UNAUTHORIZED.message);
    }

    if (user.role === UserRole.SUPERADMIN) {
      return next();
    }

    if (user.role === UserRole.ADMIN && String(user.tenantId) === String(tenantId)) {
      return next();
    }

    return httpResponse.FORBIDDEN(
      res,
      {},
      'Access denied: you can only access your own tenant'
    );
  };
};