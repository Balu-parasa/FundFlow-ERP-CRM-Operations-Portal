import { Router } from 'express';
import {
  getCustomers,
  createCustomer,
  getCustomerDetails,
  updateCustomer,
} from '../controllers/customerController';
import { authMiddleware } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleMiddleware';
import { Role } from '@prisma/client';

const router = Router();

// Apply authentication middleware to all customer endpoints
router.use(authMiddleware);

// Read-only operations allowed for ADMIN, SALES, and ACCOUNTS
router.get('/', requireRole(Role.ADMIN, Role.SALES, Role.ACCOUNTS), getCustomers);
router.get('/:id', requireRole(Role.ADMIN, Role.SALES, Role.ACCOUNTS), getCustomerDetails);

// Write operations (Create and Update) restricted to ADMIN and SALES only
router.post('/', requireRole(Role.ADMIN, Role.SALES), createCustomer);
router.put('/:id', requireRole(Role.ADMIN, Role.SALES), updateCustomer);

export default router;
