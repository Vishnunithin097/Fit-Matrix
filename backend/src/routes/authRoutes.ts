import { Router } from 'express';
import { register, login, onboard, forgotPassword, logout, getProfile } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateOnboarding } from '../middleware/validationGuard.js';

const router = Router();

// Endpoints
router.post('/register', register);
router.post('/login', login);
router.post('/onboard', protect, validateOnboarding, onboard);
router.post('/forgot-password', forgotPassword);
router.post('/logout', protect, logout);
router.get('/me', protect, getProfile);

export default router;
