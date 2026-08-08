import { z } from 'zod';
import { CustomerType, CustomerStatus } from '@prisma/client';

// Helper to validate and convert followUpDate string to Date object
const dateSchema = z.string()
  .nullable()
  .optional()
  .refine((val) => {
    if (!val) return true;
    return !isNaN(Date.parse(val));
  }, {
    message: 'Invalid follow-up date format. Must be a valid date string.',
  })
  .transform((val) => (val ? new Date(val) : undefined));

export const createCustomerSchema = z.object({
  name: z.string({
    required_error: 'Name is required',
  }).min(1, 'Name cannot be empty'),
  
  mobile: z.string({
    required_error: 'Mobile number is required',
  }).regex(/^(?:\+91|0)?[6-9]\d{9}$/, 'Invalid Indian mobile number format'),
  
  email: z.string({
    required_error: 'Email is required',
  }).email('Invalid email format'),
  
  businessName: z.string({
    required_error: 'Business name is required',
  }).min(1, 'Business name cannot be empty'),
  
  gstNumber: z.string().nullable().optional(),
  
  customerType: z.nativeEnum(CustomerType, {
    errorMap: () => ({ message: 'Invalid customer type. Must be RETAIL, WHOLESALE, or DISTRIBUTOR' }),
  }),
  
  address: z.string({
    required_error: 'Address is required',
  }).min(1, 'Address cannot be empty'),
  
  status: z.nativeEnum(CustomerStatus, {
    errorMap: () => ({ message: 'Invalid status. Must be LEAD, ACTIVE, or INACTIVE' }),
  }),
  
  followUpDate: dateSchema,
  notes: z.string().nullable().optional(),
});

export const updateCustomerSchema = createCustomerSchema.partial();
