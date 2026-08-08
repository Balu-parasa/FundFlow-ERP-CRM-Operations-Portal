import { z } from 'zod';
import { MovementType } from '@prisma/client';

export const createProductSchema = z.object({
  name: z.string({
    required_error: 'Name is required',
  }).min(1, 'Name cannot be empty'),
  
  sku: z.string({
    required_error: 'SKU is required',
  }).min(1, 'SKU cannot be empty'),
  
  category: z.string({
    required_error: 'Category is required',
  }).min(1, 'Category cannot be empty'),
  
  unitPrice: z.number({
    required_error: 'Unit price is required',
  }).min(0, 'Unit price must be >= 0'),
  
  currentStock: z.number({
    required_error: 'Current stock is required',
  }).int('Current stock must be an integer').min(0, 'Current stock must be >= 0'),
  
  minimumStock: z.number({
    required_error: 'Minimum stock is required',
  }).int('Minimum stock must be an integer').min(0, 'Minimum stock must be >= 0'),
  
  warehouse: z.string({
    required_error: 'Warehouse is required',
  }).min(1, 'Warehouse cannot be empty'),
});

export const updateProductSchema = z.object({
  name: z.string().min(1, 'Name cannot be empty').optional(),
  sku: z.string().min(1, 'SKU cannot be empty').optional(),
  category: z.string().min(1, 'Category cannot be empty').optional(),
  unitPrice: z.number().min(0, 'Unit price must be >= 0').optional(),
  minimumStock: z.number().int('Minimum stock must be an integer').min(0, 'Minimum stock must be >= 0').optional(),
  warehouse: z.string().min(1, 'Warehouse cannot be empty').optional(),
});

export const stockMovementSchema = z.object({
  quantity: z.number({
    required_error: 'Quantity is required',
  })
  .int('Quantity must be an integer')
  .gt(0, 'Quantity must be greater than 0'),
  
  movementType: z.nativeEnum(MovementType, {
    errorMap: () => ({ message: 'Invalid movement type. Must be IN or OUT' }),
  }),
  
  reason: z.string({
    required_error: 'Reason is required',
  })
  .min(1, 'Reason cannot be empty')
  .max(255, 'Reason must not exceed 255 characters'),
});
