import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../../Features/auth/pages/Login';
import ProtectedRoutes from './ProtectedRoutes';
import { ROLES } from '../../constants/roles';

import RootRedirect from './RouteRedirect'; 

import SuperAdminDashboard from '../../Features/dashboard/pages/SuperAdminDashboard';
import AdminDashboard from '../../Features/dashboard/pages/AdminDashboard';
import UserDashboard from '../../Features/dashboard/pages/UserDashboard'; 

import DashboardLayout from '../../components/layout/dashboard-layout';
import AdminLayout from '../../components/layout/AdminLayout';
import UserLayout from '../../components/layout/UserLayout'; 

import Tenants from '../../Features/tenants/pages/Tenants';
import TenantUsers from '../../Features/tenants/pages/TenantsUsers';
import LeadDetails from '@/Features/leads/pages/LeadDetails';
import Leads from '../../Features/leads/pages/Leads';
import Pipelines from '@/Features/pipelines/pages/Pipelines';
import Users from '@/Features/users/pages/Users';
import UserDetails from '@/Features/users/pages/UserDetails';
import TaskDetails from "@/Features/tasks/pages/TaskDetails";
import Tasks from '@/Features/tasks/pages/Tasks';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Root redirect based on role */}
      <Route path="/" element={<RootRedirect />} />

      {/* Public */}
      <Route path="/login" element={<Login />} />

      {/* SuperAdmin */}
      <Route element={<ProtectedRoutes allowedRoles={[ROLES.SUPER_ADMIN]} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<SuperAdminDashboard />} />
          <Route path="/tenants" element={<Tenants />} />
          <Route path="/superadmin/tenants/:tenantId/users" element={<TenantUsers />} />
        </Route>
      </Route>

      {/* Admin */}
      <Route element={<ProtectedRoutes allowedRoles={[ROLES.ADMIN]} />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/leads" element={<Leads />} />
          <Route path="/leads/:id" element={<LeadDetails />} />
          <Route path="/admin/pipelines" element={<Pipelines />} />
          <Route path="/users" element={<Users />} />
          <Route path="/users/:id" element={<UserDetails />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/tasks/:id" element={<TaskDetails />} />
        </Route>
      </Route>

      {/* User */}
      <Route element={<ProtectedRoutes allowedRoles={[ROLES.USER]} />}>
        <Route element={<UserLayout />}>
          <Route path="/user/dashboard" element={<UserDashboard />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}