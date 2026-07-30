import express from 'express';
import DashboardController from '../controllers/dashboard.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { UserRole } from '../constants/user-roles.js';

const router = express.Router();

router.get('/stats', authMiddleware(UserRole.SUPER_ADMIN), DashboardController.getStats);
router.get('/recent-users', authMiddleware(UserRole.SUPER_ADMIN), DashboardController.getRecentUsers);
router.get('/recent-tenants', authMiddleware(UserRole.SUPER_ADMIN), DashboardController.getRecentTenants);
router.get('/tenants-chart', authMiddleware(UserRole.SUPER_ADMIN), DashboardController.getTenantsChart);
router.get('/tenant-status-chart', authMiddleware(UserRole.SUPER_ADMIN), DashboardController.getTenantStatusChart);


router.get('/admin/stats', authMiddleware(UserRole.ADMIN), DashboardController.getAdminStats);
router.get('/admin/line-chart', authMiddleware(UserRole.ADMIN), DashboardController.getAdminLineChart);
router.get('/admin/status-chart', authMiddleware(UserRole.ADMIN), DashboardController.getAdminStatusChart);


router.get('/user/stats', authMiddleware(UserRole.USER), DashboardController.getUserStats);
router.get('/user/line-chart', authMiddleware(UserRole.USER), DashboardController.getUserLineChart);
router.get('/user/status-chart', authMiddleware(UserRole.USER), DashboardController.getUserStatusChart);

export default router;