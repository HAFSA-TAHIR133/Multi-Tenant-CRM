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
import AddLeadDialog from '@/Features/leads/components/AddLeadDialog';
import EditLeadDialog from '@/Features/leads/components/EditLeadDialog';

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
        </Route>
      </Route>

      {/* Admin Routes */}
      <Route element={<ProtectedRoutes allowedRoles={[ROLES.ADMIN]} />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/leads" element={<Leads />} />
          <Route path="/admin/leads/:id" element={<LeadDetails />} />
          <Route path="/admin/pipelines" element={<Pipelines />} />
          <Route path="/users" element={<Users />} />
          <Route path="/users/:id" element={<UserDetails />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path='/leads/:id/edit' element={<EditLeadDialog />} />
        </Route>
      </Route>

      {/* User Routes */}
      <Route element={<ProtectedRoutes allowedRoles={[ROLES.USER]} />}>
        <Route element={<UserLayout />}>
          <Route path="/user/dashboard" element={<UserDashboard />} />
          <Route path="/user/leads" element={<Leads />} />
          <Route path="/user/leads/:id" element={<LeadDetails />} />
          <Route path="/user/users" element={<Users />} />
          <Route path="/user/tasks" element={<Tasks />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}