import express from 'express';
import DashboardController from '../controllers/dashboard.controller.js';

const router = express.Router();

// Superadmin
router.get('/stats', DashboardController.getStats);
router.get('/recent-users', DashboardController.getRecentUsers);
router.get('/recent-tenants', DashboardController.getRecentTenants);
router.get('/tenants-chart', DashboardController.getTenantsChart);
router.get('/tenant-status-chart', DashboardController.getTenantStatusChart);

// Admin
router.get('/admin/stats', DashboardController.getAdminStats);
router.get('/admin/line-chart', DashboardController.getAdminLineChart);
router.get('/admin/status-chart', DashboardController.getAdminStatusChart);

// User
router.get('/user/stats', DashboardController.getUserStats);
router.get('/user/line-chart', DashboardController.getUserLineChart);
router.get('/user/status-chart', DashboardController.getUserStatusChart);

export default router;