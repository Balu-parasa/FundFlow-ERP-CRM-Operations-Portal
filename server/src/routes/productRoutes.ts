import { Router } from 'express';
import {
  getProducts,
  createProduct,
  getProductDetails,
  updateProduct,
  createStockMovement,
  getProductStockMovements,
} from '../controllers/productController';
import { authMiddleware } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleMiddleware';
import { Role } from '@prisma/client';

const router = Router();

// Require authentication for all product endpoints
router.use(authMiddleware);

// Read-only access to products list and details is open to all roles
router.get('/', requireRole(Role.ADMIN, Role.SALES, Role.WAREHOUSE, Role.ACCOUNTS), getProducts);
router.get('/:id', requireRole(Role.ADMIN, Role.SALES, Role.WAREHOUSE, Role.ACCOUNTS), getProductDetails);

// Product details creation and modification restricted to ADMIN
router.post('/', requireRole(Role.ADMIN), createProduct);
router.put('/:id', requireRole(Role.ADMIN), updateProduct);

// Stock updates (manual movements IN/OUT) restricted to ADMIN and WAREHOUSE
router.post('/:id/stock-movements', requireRole(Role.ADMIN, Role.WAREHOUSE), createStockMovement);

// Viewing stock movements log restricted to ADMIN, WAREHOUSE, and ACCOUNTS
router.get('/:id/stock-movements', requireRole(Role.ADMIN, Role.WAREHOUSE, Role.ACCOUNTS), getProductStockMovements);

export default router;
