import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { completeTask, logIntake, getProgressLogs } from '../controllers/streakController.js';
import { getPlan, toggleDayMode, toggleDietRule } from '../controllers/planController.js';

const router = Router();

// Retrieve combined plans (diet and workouts)
router.get('/plan', protect, getPlan);

// Day mode switcher (ACTIVATE DAY vs REST DAY)
router.post('/toggle-mode', protect, toggleDayMode);

// Dietary rules toggles (Egg today, Veg only)
router.post('/toggle-diet', protect, toggleDietRule);

// Progression and Logging endpoints
router.post('/complete-task', protect, completeTask);
router.post('/log-intake', protect, logIntake);
router.get('/logs', protect, getProgressLogs);

export default router;
