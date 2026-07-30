import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/Features/auth/context/AuthContext';
import { useTenant } from '@/context/TenantContext';
import { ROLES } from '@/constants/roles';

export default function ProtectedRoutes({ allowedRoles = [] }) {
  const { isAuthenticated, user, isLoading } = useAuth();
  const { activeTenant } = useTenant();
  const location = useLocation();

  if (isLoading) {
    return null; // Or a loading spinner
  }

  if (!isAuthenticated) {
    console.log("Redirect: Not authenticated");
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const userRole = user?.role ?? ROLES.USER;
  const isSuperAdmin = userRole === ROLES.SUPER_ADMIN;

  // Extract valid tenant identifier regardless of object vs string structure
  const tenantId = typeof activeTenant === 'object' ? activeTenant?.id || activeTenant?._id : activeTenant;
  const hasActiveTenant = Boolean(tenantId || activeTenant);

  if (!hasActiveTenant && !isSuperAdmin) {
    console.log("Redirect: No active tenant");
    return <Navigate to="/login" replace state={{ from: location, reason: "no-tenant" }} />;
  }

  if (allowedRoles.length > 0 && !isSuperAdmin && !allowedRoles.includes(userRole)) {
    console.log("Redirect: Unauthorized");
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}