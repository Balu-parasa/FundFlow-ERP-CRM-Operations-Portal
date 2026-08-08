import { Router } from 'express';
import { login, getMe } from '../controllers/authController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.post('/login', login);
router.get('/me', authMiddleware, getMe);

export default router;
