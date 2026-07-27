import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../Features/auth/context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import { ROLES } from '../../constants/roles'; 

export default function ProtectedRoutes({ allowedRoles = [] }) {
  const { isAuthenticated, user } = useAuth();
  const { activeTenant } = useTenant();
  const location = useLocation();

  console.log("ProtectedRoutes", {
    isAuthenticated,
    user,
    activeTenant,
    allowedRoles,
  });

  if (!isAuthenticated) {
    console.log("Redirect: Not authenticated");
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!activeTenant) {
    console.log("Redirect: No active tenant");
    return <Navigate to="/login" replace state={{ from: location, reason: "no-tenant" }} />;
  }

  const userRole = user?.role ?? ROLES.USER;
  const isSuperAdmin = userRole === ROLES.SUPER_ADMIN;

  console.log("Role Check", {
    userRole,
    isSuperAdmin,
    allowedRoles,
  });

  if (allowedRoles.length > 0 && !isSuperAdmin && !allowedRoles.includes(userRole)) {
    console.log("Redirect: Unauthorized");
    return <Navigate to="/unauthorized" replace />;
  }

  console.log("Access Granted");
  return <Outlet />;
}