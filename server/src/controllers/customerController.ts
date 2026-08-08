import { Request, Response } from 'express';
import { PrismaClient, CustomerType, CustomerStatus } from '@prisma/client';
import { createCustomerSchema, updateCustomerSchema } from '../validators/customerValidator';
import { asyncHandler } from '../utils/asyncHandler';

const prisma = new PrismaClient();

export const getCustomers = asyncHandler(async (req: Request, res: Response) => {
  // Extract and parse query parameters
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 10;
  const search = req.query.search as string;
  const status = req.query.status as string;
  const customerType = req.query.customerType as string;

  const where: any = {};

  // Status Filter
  if (status) {
    where.status = status as CustomerStatus;
  }

  // Customer Type Filter
  if (customerType) {
    where.customerType = customerType as CustomerType;
  }

  // Search Filter: Compatible with MySQL default case-insensitive collation without "mode: insensitive"
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { mobile: { contains: search } },
      { email: { contains: search } },
      { businessName: { contains: search } },
    ];
  }

  const skip = (page - 1) * limit;

  // Retrieve count and paginated list concurrently
  const [total, customers] = await Promise.all([
    prisma.customer.count({ where }),
    prisma.customer.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return res.status(200).json({
    success: true,
    data: customers,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  });
});

export const createCustomer = asyncHandler(async (req: Request, res: Response) => {
  const data = createCustomerSchema.parse(req.body);

  const customer = await prisma.customer.create({
    data,
  });

  return res.status(201).json({
    success: true,
    data: customer,
  });
});

export const getCustomerDetails = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  
  if (isNaN(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid customer ID format',
    });
  }

  const customer = await prisma.customer.findUnique({
    where: { id },
  });

  if (!customer) {
    return res.status(404).json({
      success: false,
      message: 'Customer not found',
    });
  }

  return res.status(200).json({
    success: true,
    data: customer,
  });
});

export const updateCustomer = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  
  if (isNaN(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid customer ID format',
    });
  }

  // Validate request body
  const data = updateCustomerSchema.parse(req.body);

  // Check if customer exists
  const existing = await prisma.customer.findUnique({
    where: { id },
  });

  if (!existing) {
    return res.status(404).json({
      success: false,
      message: 'Customer not found',
    });
  }

  // Update in DB
  const updatedCustomer = await prisma.customer.update({
    where: { id },
    data,
  });

  return res.status(200).json({
    success: true,
    data: updatedCustomer,
  });
});
