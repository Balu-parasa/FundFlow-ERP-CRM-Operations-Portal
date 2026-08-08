import { Router } from 'express';
import {
  getChallans,
  createChallan,
  getChallanDetails,
  confirmChallan,
  cancelChallan,
} from '../controllers/challanController';
import { authMiddleware } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleMiddleware';
import { Role } from '@prisma/client';

const router = Router();

// Enforce auth check globally
router.use(authMiddleware);

// Read permissions open to all roles
router.get('/', requireRole(Role.ADMIN, Role.SALES, Role.WAREHOUSE, Role.ACCOUNTS), getChallans);
router.get('/:id', requireRole(Role.ADMIN, Role.SALES, Role.WAREHOUSE, Role.ACCOUNTS), getChallanDetails);

// Write/State operations restricted to ADMIN and SALES
router.post('/', requireRole(Role.ADMIN, Role.SALES), createChallan);
router.post('/:id/confirm', requireRole(Role.ADMIN, Role.SALES), confirmChallan);
router.post('/:id/cancel', requireRole(Role.ADMIN, Role.SALES), cancelChallan);

export default router;
