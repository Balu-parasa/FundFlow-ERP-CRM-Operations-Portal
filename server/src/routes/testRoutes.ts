import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleMiddleware';
import { Role } from '@prisma/client';

const router = Router();

// Test ADMIN endpoint (Only ADMIN can access)
router.get('/admin', authMiddleware, requireRole(Role.ADMIN), (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Welcome Admin! Access granted.',
    user: req.user,
  });
});

// Test SALES endpoint (ADMIN and SALES can access)
router.get('/sales', authMiddleware, requireRole(Role.ADMIN, Role.SALES), (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Welcome Sales/Admin! Access granted.',
    user: req.user,
  });
});

// Test WAREHOUSE endpoint (ADMIN and WAREHOUSE can access)
router.get('/warehouse', authMiddleware, requireRole(Role.ADMIN, Role.WAREHOUSE), (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Welcome Warehouse/Admin! Access granted.',
    user: req.user,
  });
});

// Test ACCOUNTS endpoint (ADMIN and ACCOUNTS can access)
router.get('/accounts', authMiddleware, requireRole(Role.ADMIN, Role.ACCOUNTS), (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Welcome Accounts/Admin! Access granted.',
    user: req.user,
  });
});

export default router;
