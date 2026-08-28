import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/Features/auth/context/AuthContext';
import { useTenant } from '@/context/TenantContext';
import { ROLES } from '@/constants/roles';
import {
  getAuthSession,
  hasActiveTenantSession,
} from '@/Features/auth/utils/tenantDisplay';

export default function ProtectedRoutes({ allowedRoles = [] }) {
  const { user, accessToken, isLoading } = useAuth();
  const { activeTenant } = useTenant();
  const location = useLocation();

  const storedSession = getAuthSession();

  const resolvedUser = user ?? storedSession?.user ?? null;
  const resolvedAccessToken = accessToken ?? storedSession?.accessToken ?? null;
  const resolvedTenant = activeTenant ?? storedSession?.activeTenant ?? null;
  const resolvedAuthenticated = Boolean(resolvedUser && resolvedAccessToken);

  if (isLoading && !storedSession?.isAuthenticated) {
    return null;
  }

  if (!resolvedAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const userRole = resolvedUser?.role ?? ROLES.USER;
  const isSuperAdmin = userRole === ROLES.SUPER_ADMIN;

  const tenantReady = hasActiveTenantSession({
    user: resolvedUser,
    activeTenant: resolvedTenant,
    isSuperAdmin,
  });

  if (!tenantReady) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location, reason: 'no-tenant' }}
      />
    );
  }

  if (
    allowedRoles.length > 0 &&
    !isSuperAdmin &&
    !allowedRoles.includes(userRole)
  ) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
