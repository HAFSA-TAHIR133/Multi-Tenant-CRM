import { httpResponse } from '../utils/httpResponse.js';
import { ErrorCodesMeta } from '../constants/error-codes.js';
import { UserRole } from '../constants/user-roles.js';
import { User } from '../models/index.js';

export const allowUserAccess = () => {
  return async (req, res, next) => {
    const { id } = req.params;
    const user = req.user;

    if (!user) {
      return httpResponse.UNAUTHORIZED(res, {}, ErrorCodesMeta.UNAUTHORIZED.message);
    }

    if (user.role === UserRole.SUPERADMIN) {
      return next();
    }

    if (user.role === UserRole.USER) {
      if (String(user.userId) === String(id)) return next();

      return httpResponse.FORBIDDEN(res, {}, 'Users can only access their own profile');
    }

    if (user.role === UserRole.ADMIN) {
      const targetUser = await User.findByPk(id);

      if (!targetUser) {
        return httpResponse.NOT_FOUND(res, {}, 'User not found');
      }

      if (String(targetUser.tenantId) === String(user.tenantId)) {
        return next();
      }

      return httpResponse.FORBIDDEN(res, {}, 'Admins can only access users in their own tenant');
    }

    return httpResponse.FORBIDDEN(res, {}, 'Access denied');
  };
};