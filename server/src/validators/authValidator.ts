import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string({
    required_error: 'Email is required',
  })
  .email('Invalid email format'),
  password: z.string({
    required_error: 'Password is required',
  })
  .min(1, 'Password cannot be empty'),
});

export const signupSchema = z.object({
  name: z.string({
    required_error: 'Name is required',
  }).min(2, 'Name must be at least 2 characters'),
  email: z.string({
    required_error: 'Email is required',
  }).email('Invalid email format'),
  password: z.string({
    required_error: 'Password is required',
  }).min(6, 'Password must be at least 6 characters'),
  role: z.enum(['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'], {
    required_error: 'Role is required',
  }),
});
