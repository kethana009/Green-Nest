import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { getMe, updateProfile } from '../controllers/auth.controller';

const router = Router();

// GET /api/auth/me — Returns the authenticated user's profile
router.get('/me', authMiddleware, getMe);

// PUT /api/auth/profile — Updates user profile fields
router.put('/profile', authMiddleware, updateProfile);

export default router;
