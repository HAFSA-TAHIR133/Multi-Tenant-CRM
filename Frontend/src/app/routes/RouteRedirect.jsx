
import { Navigate } from "react-router-dom";
import { useAuth } from "@/Features/auth/context/AuthContext";
import { ROLES } from "../../constants/roles";

export default function RootRedirect() {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  const role = user.role;

  if (role === ROLES.SUPER_ADMIN) {
    return <Navigate to="/dashboard" replace />;
  }
  if (role === ROLES.ADMIN) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  // USER
  return <Navigate to="/user/dashboard" replace />;
}