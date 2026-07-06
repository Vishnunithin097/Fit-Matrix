import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  createSquad,
  joinSquadByCode,
  getSquadMatrix,
  inviteFriend,
  listInvitations,
  resolveInvitation,
  leaveSquad
} from '../controllers/squadController.js';

const router = Router();

router.post('/create', protect, createSquad);
router.post('/join', protect, joinSquadByCode);
router.get('/matrix', protect, getSquadMatrix);
router.post('/invite', protect, inviteFriend);
router.get('/invites', protect, listInvitations);
router.post('/resolve', protect, resolveInvitation);
router.post('/leave', protect, leaveSquad);

export default router;
