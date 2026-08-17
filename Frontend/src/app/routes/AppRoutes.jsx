import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../../Features/auth/pages/Login';
import ProtectedRoutes from './protectedRoutes';
import { ROLES } from '../../constants/roles';

import RootRedirect from './RouteRedirect';

import SuperAdminDashboard from '../../Features/dashboard/pages/SuperadminDashboard';
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
import Tasks from '@/Features/tasks/pages/Tasks';
import EditLeadDialog from '@/Features/leads/components/EditLeadDialog';
import NotFound from '../../../src/components/common/pages/NotFound';
import ProfilePage from '@/components/common/pages/ProfilePage';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Root redirect based on role */}
      <Route path="/" element={<RootRedirect />} />

      {/* Public */}
      <Route path="/login" element={<Login />} />

      {/* SuperAdmin Routes */}
      <Route element={<ProtectedRoutes allowedRoles={[ROLES.SUPER_ADMIN]} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<SuperAdminDashboard />} />
          <Route path="/tenants" element={<Tenants />} />
          <Route path="/superadmin/tenants/:tenantId/users" element={<TenantUsers />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Route>

      {/* Admin Routes */}
      <Route element={<ProtectedRoutes allowedRoles={[ROLES.ADMIN]} />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/leads" element={<Leads />} />
          <Route path="/admin/leads/:id" element={<LeadDetails />} />
          <Route path="/admin/leads/:id/edit" element={<EditLeadDialog />} />
          <Route path="/admin/pipelines" element={<Pipelines />} />

          <Route path="/admin/users" element={<Users />} />
          <Route path="/admin/users/:id" element={<UserDetails />} />
          <Route path="/admin/tasks" element={<Tasks />} />

          {/* Legacy un-prefixed URLs */}
          <Route path="/users" element={<Navigate to="/admin/users" replace />} />
          <Route path="/users/:id" element={<Navigate to="/admin/users" replace />} />
          <Route path="/tasks" element={<Navigate to="/admin/tasks" replace />} />
          <Route path="/leads/:id/edit" element={<Navigate to="/admin/leads" replace />} />

          {/* Admin Profile Route */}
          <Route path="/admin/profile" element={<ProfilePage />} />
          <Route path="/profile" element={<Navigate to="/admin/profile" replace />} />
        </Route>
      </Route>

      {/* Standard User Routes */}
      <Route element={<ProtectedRoutes allowedRoles={[ROLES.USER]} />}>
        <Route element={<UserLayout />}>
          <Route path="/user/dashboard" element={<UserDashboard />} />
          <Route path="/user/leads" element={<Leads />} />
          <Route path="/user/leads/:id" element={<LeadDetails />} />
          <Route path="/user/tasks" element={<Tasks />} />

          {/* User Profile Route */}
          <Route path="/user/profile" element={<ProfilePage />} />
          <Route path="/profile" element={<Navigate to="/user/profile" replace />} />
        </Route>
      </Route>

      {/* Catch-all Fallback */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}