
import { Navigate } from "react-router-dom";
import { useAuth } from "@/Features/auth/context/AuthContext";
import { getAuthSession } from "@/Features/auth/utils/tenantDisplay";
import { ROLES } from "../../constants/roles";

export default function RootRedirect() {
  const { isAuthenticated, user } = useAuth();
  const storedSession = getAuthSession();

  const resolvedUser = user ?? storedSession?.user ?? null;
  const resolvedAuthenticated = Boolean(
    (isAuthenticated && user) || storedSession?.isAuthenticated
  );

  if (!resolvedAuthenticated || !resolvedUser) {
    return <Navigate to="/login" replace />;
  }

  const role = resolvedUser.role;

  if (role === ROLES.SUPER_ADMIN) {
    return <Navigate to="/dashboard" replace />;
  }
  if (role === ROLES.ADMIN) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  // USER
  return <Navigate to="/user/dashboard" replace />;
}