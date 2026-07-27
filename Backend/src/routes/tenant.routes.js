import { Router } from 'express';
import TenantController from '../controllers/tenant.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { UserRole } from '../constants/user-roles.js';
import { allowTenantOwner } from '../middleware/tenantAccess.middleware.js';

const router = Router();

// All routes here are protected
router.post('/', authMiddleware(UserRole.SUPERADMIN), TenantController.createTenant.bind(TenantController));
router.get('/', authMiddleware(UserRole.ADMIN), TenantController.getAllTenants.bind(TenantController));
router.get('/:id', authMiddleware(UserRole.ADMIN), allowTenantOwner(), TenantController.getTenantById.bind(TenantController));
router.patch('/:id', authMiddleware(UserRole.ADMIN), allowTenantOwner(), TenantController.updateTenant.bind(TenantController));
router.delete('/:id', authMiddleware(UserRole.SUPERADMIN), TenantController.deleteTenant.bind(TenantController));
router.patch('/:id/status', authMiddleware(UserRole.SUPERADMIN),TenantController.updateTenantStatus.bind(TenantController));
export default router;