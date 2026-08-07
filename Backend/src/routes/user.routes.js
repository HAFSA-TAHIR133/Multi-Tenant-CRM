import { Router } from 'express';
import UserController from '../controllers/user.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { UserRole } from '../constants/user-roles.js';
import { allowUserAccess } from '../middleware/userAccess.middleware.js';

const router = Router();

router.get('/me', authMiddleware(UserRole.USER), UserController.getMe.bind(UserController));
router.put('/me', authMiddleware(UserRole.USER), UserController.updateMe.bind(UserController));

router.post('/', authMiddleware(UserRole.ADMIN), UserController.createUser.bind(UserController));
router.get('/', authMiddleware(UserRole.USER), UserController.getAllUsers.bind(UserController));

router.get('/:id', authMiddleware(UserRole.USER), allowUserAccess(), UserController.getUserById.bind(UserController));
router.put('/:id', authMiddleware(UserRole.USER), allowUserAccess(), UserController.updateUser.bind(UserController));
router.delete('/:id', authMiddleware(UserRole.ADMIN), allowUserAccess(), UserController.deleteUser.bind(UserController));

export default router;