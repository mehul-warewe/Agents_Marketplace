import { Request, Response, NextFunction } from 'express';
import { log } from '../shared/logger.js';

export const errorMiddleware = (err: any, req: Request, res: Response, next: NextFunction) => {
  log.error('API Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
};
