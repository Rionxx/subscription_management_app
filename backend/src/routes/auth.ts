import { Router } from 'express';
import { authController } from '../controllers/authController';
import { validateRegister, validateLogin } from '../middleware/validation';

const router = Router();

// POST /api/auth/register
router.post('/register', validateRegister, authController.register);

// POST /api/auth/login
router.post('/login', validateLogin, authController.login);

// POST /api/auth/refresh
router.post('/refresh', authController.refreshToken);

// POST /api/auth/logout
router.post('/logout', authController.logout);

export default router;