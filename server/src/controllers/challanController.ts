import { Request, Response } from 'express';
import { PrismaClient, ChallanStatus } from '@prisma/client';
import { createChallanSchema } from '../validators/challanValidator';
import { asyncHandler } from '../utils/asyncHandler';

const prisma = new PrismaClient();

// Helper to generate a unique challan number CH-YYYYMMDD-XXXX


  let nextSequence = 1;
  if (lastChallan) {
    const parts = lastChallan.challanNumber.split('-');
    if (parts.length === 3) {
      const lastSeq = parseInt(parts[2], 10);
      if (!isNaN(lastSeq)) {
        nextSequence = lastSeq + 1;
      }
    }
  }

  const sequenceStr = String(nextSequence).padStart(4, '0');
  return `CH-${dateStr}-${sequenceStr}`;
}

export const getChallans = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 10;
  const search = req.query.search as string;
  const status = req.query.status as string;

  const skip = (page - 1) * limit;
  const where: any = {};

  if (status) {
    where.status = status as ChallanStatus;
  }

  // MySQL case-insensitive search by default
  if (search) {
    where.challanNumber = { contains: search };
  }

  const [total, challans] = await Promise.all([
    prisma.challan.count({ where }),
    prisma.challan.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            businessName: true,
            email: true,
          },
        },
      },
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return res.status(200).json({
    success: true,
    data: challans,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  });
});

export const createChallan = asyncHandler(async (req: Request, res: Response) => {
  // 1. Zod Validation
  const { customerId, items } = createChallanSchema.parse(req.body);

  // 2. Verify Customer Exists
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
  });

  if (!customer) {
    return res.status(404).json({
      success: false,
      message: 'Customer not found',
    });
  }

  // 3. Verify all Products exist and map snapshot info
  const productIds = items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
  });

  if (products.length !== productIds.length) {
    return res.status(404).json({
      success: false,
      message: 'One or more products in the challan items list were not found',
    });
  }

  const productMap = new Map(products.map((p) => [p.id, p]));

  // Calculate totals and copy snapshot properties
  let totalQuantity = 0;
  const challanItemsData = items.map((item) => {
    const product = productMap.get(item.productId)!;
    totalQuantity += item.quantity;
    return {
      productId: item.productId,
      productName: product.name,
      sku: product.sku,
      unitPrice: product.unitPrice,
      quantity: item.quantity,
      total: product.unitPrice * item.quantity,
    };
  });

  // 4. Atomic Challan creation
  const challan = await prisma.$transaction(async (tx) => {
    const challanNumber = await generateChallanNumber(tx);
    return tx.challan.create({
      data: {
        challanNumber,
        customerId,
        status: ChallanStatus.DRAFT,
        totalQuantity,
        createdBy: req.user!.userId,
        items: {
          create: challanItemsData,
        },
      },
      include: {
        items: true,
      },
    });
  });

  return res.status(201).json({
    success: true,
    data: challan,
  });
});

export const getChallanDetails = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid challan ID format',
    });
  }

  const challan = await prisma.challan.findUnique({
    where: { id },
    include: {
      customer: true,
      items: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!challan) {
    return res.status(404).json({
      success: false,
      message: 'Challan not found',
    });
  }

  return res.status(200).json({
    success: true,
    data: challan,
  });
});

export const confirmChallan = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid challan ID format',
    });
  }

  // 1. Fetch draft challan and its items
  const challan = await prisma.challan.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!challan) {
    return res.status(404).json({
      success: false,
      message: 'Challan not found',
    });
  }

  if (challan.status === ChallanStatus.CONFIRMED) {
    return res.status(400).json({
      success: false,
      message: 'Challan is already confirmed',
    });
  }

  if (challan.status === ChallanStatus.CANCELLED) {
    return res.status(400).json({
      success: false,
      message: 'Cancelled challans cannot be confirmed',
    });
  }

  // 2. Perform atomic operations inside a transaction
  try {
    await prisma.$transaction(async (tx) => {
      // Re-fetch challan inside transaction to lock and verify status
      const freshChallan = await tx.challan.findUnique({
        where: { id },
      });

      if (!freshChallan || freshChallan.status !== ChallanStatus.DRAFT) {
        throw new Error('Challan is no longer in DRAFT status');
      }

      // Check and update stocks atomically for each item
      for (const item of challan.items) {
        const updateResult = await tx.product.updateMany({
          where: {
            id: item.productId,
            currentStock: { gte: item.quantity },
          },
          data: {
            currentStock: { decrement: item.quantity },
          },
        });

        // If updated rows count is zero, it means insufficient stock
        if (updateResult.count === 0) {
          const prod = await tx.product.findUnique({
            where: { id: item.productId },
            select: { name: true },
          });
          const name = prod ? prod.name : 'Unknown Product';
          throw new Error(`Insufficient stock for product: ${name}`);
        }

        // Write OUT stock audit log
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            quantity: item.quantity,
            movementType: 'OUT',
            reason: `Sales Challan ${challan.challanNumber}`,
            createdBy: req.user!.userId,
          },
        });
      }

      // Update status to CONFIRMED
      await tx.challan.update({
        where: { id },
        data: { status: ChallanStatus.CONFIRMED },
      });
    });

    return res.status(200).json({
      success: true,
      message: 'Challan confirmed successfully and stock reduced',
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
});

export const cancelChallan = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid challan ID format',
    });
  }

  const challan = await prisma.challan.findUnique({
    where: { id },
  });

  if (!challan) {
    return res.status(404).json({
      success: false,
      message: 'Challan not found',
    });
  }

  if (challan.status === ChallanStatus.CONFIRMED) {
    return res.status(400).json({
      success: false,
      message: 'Confirmed challans cannot be cancelled',
    });
  }

  if (challan.status === ChallanStatus.CANCELLED) {
    return res.status(400).json({
      success: false,
      message: 'Challan is already cancelled',
    });
  }

  // Update status to CANCELLED (no stock change occurs)
  const cancelledChallan = await prisma.challan.update({
    where: { id },
    data: { status: ChallanStatus.CANCELLED },
  });

  return res.status(200).json({
    success: true,
    message: 'Challan cancelled successfully',
    data: cancelledChallan,
  });
});
