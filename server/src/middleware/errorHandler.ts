import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export interface CustomError extends Error {
  statusCode?: number;
}

export const errorHandler = (
  err: Error | CustomError | ZodError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log the error for internal tracking
  console.error('[Error Details]:', err);

  // 1. Zod Validation Errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  // 2. Syntax/JSON Parse Errors
  if (err instanceof SyntaxError && 'status' in err && err.status === 400) {
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON payload format',
    });
  }

  // 3. Custom / General Application Errors
  const statusCode = (err as CustomError).statusCode || 500;
  const message = err.message || 'Internal Server Error';

  return res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};
