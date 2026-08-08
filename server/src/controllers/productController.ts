import { Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { createProductSchema, updateProductSchema, stockMovementSchema } from '../validators/productValidator';
import { asyncHandler } from '../utils/asyncHandler';

const prisma = new PrismaClient();

export const getProducts = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 10;
  const search = req.query.search as string;
  const warehouse = req.query.warehouse as string;
  const lowStock = req.query.lowStock as string;

  const skip = (page - 1) * limit;

  // 1. If lowStock filter is enabled, use a parameterized raw query with proper parameter binding via Prisma.sql
  if (lowStock === 'true') {
    const searchPattern = search ? `%${search}%` : null;

    // Build the dynamic WHERE components using nested safe sql template snippets
    const whereConditions: Prisma.Sql[] = [Prisma.sql`currentStock <= minimumStock`];
    
    if (warehouse) {
      whereConditions.push(Prisma.sql`warehouse = ${warehouse}`);
    }
    
    if (search) {
      whereConditions.push(Prisma.sql`(name LIKE ${searchPattern} OR sku LIKE ${searchPattern} OR category LIKE ${searchPattern})`);
    }

    const whereClause = Prisma.sql`WHERE ${Prisma.join(whereConditions, ' AND ')}`;

    // Query both counts and list concurrently
    const [products, countResult] = await Promise.all([
      prisma.$queryRaw<any[]>(Prisma.sql`
        SELECT * FROM Product
        ${whereClause}
        ORDER BY createdAt DESC
        LIMIT ${limit} OFFSET ${skip}
      `),
      prisma.$queryRaw<any[]>(Prisma.sql`
        SELECT COUNT(*) as count FROM Product
        ${whereClause}
      `),
    ]);

    const total = countResult[0] ? Number(countResult[0].count) : 0;
    const totalPages = Math.ceil(total / limit);

    // Map fields to include client-calculated properties
    const mappedProducts = products.map((p) => ({
      ...p,
      isLowStock: p.currentStock <= p.minimumStock,
    }));

    return res.status(200).json({
      success: true,
      data: mappedProducts,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  }

  // 2. Standard Prisma builder for regular non-lowStock queries
  const where: any = {};
  if (warehouse) {
    where.warehouse = warehouse;
  }
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { sku: { contains: search } },
      { category: { contains: search } },
    ];
  }

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  const mappedProducts = products.map((p) => ({
    ...p,
    isLowStock: p.currentStock <= p.minimumStock,
  }));

  return res.status(200).json({
    success: true,
    data: mappedProducts,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  });
});

export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  const data = createProductSchema.parse(req.body);

  // Check SKU uniqueness
  const existingProduct = await prisma.product.findUnique({
    where: { sku: data.sku },
  });

  if (existingProduct) {
    return res.status(409).json({
      success: false,
      message: 'SKU already exists',
    });
  }

  const product = await prisma.product.create({
    data,
  });

  return res.status(201).json({
    success: true,
    data: {
      ...product,
      isLowStock: product.currentStock <= product.minimumStock,
    },
  });
});

export const getProductDetails = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  
  if (isNaN(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid product ID format',
    });
  }

  const product = await prisma.product.findUnique({
    where: { id },
  });

  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found',
    });
  }

  return res.status(200).json({
    success: true,
    data: {
      ...product,
      isLowStock: product.currentStock <= product.minimumStock,
    },
  });
});

export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  
  if (isNaN(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid product ID format',
    });
  }

  const data = updateProductSchema.parse(req.body);

  const existingProduct = await prisma.product.findUnique({
    where: { id },
  });

  if (!existingProduct) {
    return res.status(404).json({
      success: false,
      message: 'Product not found',
    });
  }

  // Ensure SKU is unique if it's being updated
  if (data.sku && data.sku !== existingProduct.sku) {
    const skuDuplicate = await prisma.product.findUnique({
      where: { sku: data.sku },
    });
    if (skuDuplicate) {
      return res.status(409).json({
        success: false,
        message: 'SKU already exists',
      });
    }
  }

  const updatedProduct = await prisma.product.update({
    where: { id },
    data,
  });

  return res.status(200).json({
    success: true,
    data: {
      ...updatedProduct,
      isLowStock: updatedProduct.currentStock <= updatedProduct.minimumStock,
    },
  });
});

export const createStockMovement = asyncHandler(async (req: Request, res: Response) => {
  const productId = parseInt(req.params.id, 10);

  if (isNaN(productId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid product ID format',
    });
  }

  const { quantity, movementType, reason } = stockMovementSchema.parse(req.body);

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Atomic decrement/increment to prevent negative stock in race conditions
      if (movementType === 'OUT') {
        const updateResult = await tx.product.updateMany({
          where: {
            id: productId,
            currentStock: { gte: quantity }, // Ensure stock >= requested quantity
          },
          data: {
            currentStock: { decrement: quantity },
          },
        });

        if (updateResult.count === 0) {
          // Identify if product is missing or has insufficient stock
          const prod = await tx.product.findUnique({ where: { id: productId } });
          if (!prod) {
            const err: any = new Error('Product not found');
            err.statusCode = 404;
            throw err;
          } else {
            const err: any = new Error('Insufficient stock');
            err.statusCode = 400;
            throw err;
          }
        }
      } else {
        // IN Movement: simple atomic increment
        const updateResult = await tx.product.updateMany({
          where: { id: productId },
          data: {
            currentStock: { increment: quantity },
          },
        });

        if (updateResult.count === 0) {
          const err: any = new Error('Product not found');
          err.statusCode = 404;
          throw err;
        }
      }

      // 2. Create the audit trail log record
      const movement = await tx.stockMovement.create({
        data: {
          productId,
          quantity,
          movementType,
          reason,
          createdBy: req.user!.userId,
        },
      });

      // 3. Fetch latest state
      const updatedProduct = await tx.product.findUnique({
        where: { id: productId },
      });

      return { movement, updatedProduct };
    });

    return res.status(201).json({
      success: true,
      message: 'Stock movement recorded successfully',
      data: {
        movement: result.movement,
        product: {
          ...result.updatedProduct,
          isLowStock: result.updatedProduct!.currentStock <= result.updatedProduct!.minimumStock,
        },
      },
    });
  } catch (err: any) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({
        success: false,
        message: err.message,
      });
    }
    throw err;
  }
});

export const getProductStockMovements = asyncHandler(async (req: Request, res: Response) => {
  const productId = parseInt(req.params.id, 10);

  if (isNaN(productId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid product ID format',
    });
  }

  // Check if product exists
  const existingProduct = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!existingProduct) {
    return res.status(404).json({
      success: false,
      message: 'Product not found',
    });
  }

  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 10;
  const skip = (page - 1) * limit;

  const [total, movements] = await Promise.all([
    prisma.stockMovement.count({ where: { productId } }),
    prisma.stockMovement.findMany({
      where: { productId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return res.status(200).json({
    success: true,
    data: movements,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  });
});
