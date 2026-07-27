import { Router } from 'express';
import UserController from '../controllers/user.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { UserRole } from '../constants/user-roles.js';
import { allowUserTenantAccess } from '../middleware/userAccess.middleware.js';

const router = Router();

router.post('/',authMiddleware(UserRole.ADMIN), UserController.createUser.bind(UserController));

router.get('/',authMiddleware(UserRole.ADMIN),UserController.getAllUsers.bind(UserController));

router.get('/:id',authMiddleware(UserRole.ADMIN),allowUserTenantAccess(),UserController.getUserById.bind(UserController));

router.put('/:id',authMiddleware(UserRole.ADMIN),allowUserTenantAccess(),UserController.updateUser.bind(UserController));

router.delete('/:id',authMiddleware(UserRole.ADMIN),allowUserTenantAccess(),UserController.deleteUser.bind(UserController));

export default router;