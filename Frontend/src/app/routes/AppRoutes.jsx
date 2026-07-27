import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../../Features/auth/pages/Login';
import ProtectedRoutes from './ProtectedRoutes';
import { ROLES } from '../../constants/roles';

import SuperAdminDashboard from '../../Features/dashboard/pages/SuperAdminDashboard';
import AdminDashboard from '../../Features/dashboard/pages/AdminDashboard';

import DashboardLayout from '../../components/layout/dashboard-layout';
import AdminLayout from '../../components/layout/AdminLayout';

import Tenants from '../../Features/tenants/pages/Tenants';
import TenantUsers from '../../Features/tenants/pages/TenantsUsers';
import LeadDetails from '@/Features/leads/pages/LeadDetails';
import Leads from '../../Features/leads/pages/Leads';
// import Pipelines from '../../features/pipelines/pages/Pipelines';
// import Tasks from '../../features/tasks/pages/Tasks';
// import Users from '../../features/users/pages/Users';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoutes allowedRoles={[ROLES.SUPER_ADMIN]} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<SuperAdminDashboard />} />
          <Route path="/tenants" element={<Tenants />} />
          <Route path="/superadmin/tenants/:tenantId/users" element={<TenantUsers />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoutes allowedRoles={[ROLES.ADMIN]} />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
           <Route path="/admin/leads" element={<Leads />} />
           <Route path="/leads/:id" element={<LeadDetails />} />
          {/*<Route path="/admin/pipelines" element={<Pipelines />} />
          <Route path="/admin/tasks" element={<Tasks />} />
          <Route path="/admin/users" element={<Users />} /> */}
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}