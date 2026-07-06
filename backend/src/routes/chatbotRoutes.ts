import { Router } from 'express';
import { queryChatbot, scanLabel } from '../controllers/chatbotController.js';
import { protect } from '../middleware/authMiddleware.js';
import { uploadLabel } from '../middleware/uploadMiddleware.js';

const router = Router();

router.post('/query', protect, queryChatbot);
router.post('/scan-label', protect, uploadLabel, scanLabel);

export default router;
