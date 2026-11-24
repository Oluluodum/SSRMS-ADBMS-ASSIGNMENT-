import { Router } from 'express';
import { currentUser, login, logout } from '../controllers/authController.js';
import { authenticate } from '../middleware/authenticate.js';
import { loginLimiter } from '../middleware/loginLimiter.js';

const router = Router();
router.post('/login', loginLimiter, login);
router.get('/me', authenticate, currentUser);
router.post('/logout', authenticate, logout);
export default router;
