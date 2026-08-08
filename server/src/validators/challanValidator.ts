import { z } from 'zod';

export const createChallanSchema = z.object({
  customerId: z.number({
    required_error: 'Customer ID is required',
  }).int().positive('Customer ID must be a positive integer'),
  
  items: z.array(
    z.object({
      productId: z.number({
        required_error: 'Product ID is required',
      }).int().positive('Product ID must be a positive integer'),
      
      quantity: z.number({
        required_error: 'Quantity is required',
      }).int().gt(0, 'Quantity must be greater than 0'),
    })
  ).min(1, 'At least one item is required in the challan'),
}).refine((data) => {
  const productIds = data.items.map((item) => item.productId);
  const uniqueIds = new Set(productIds);
  return uniqueIds.size === productIds.length;
}, {
  message: 'Duplicate product IDs within the same challan are not allowed',
  path: ['items'],
});
