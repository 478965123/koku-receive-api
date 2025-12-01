import { Request, Response, NextFunction } from 'express';

export interface AuthRequest extends Request {
  supabaseKey?: string;
}

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const apiKey = req.headers['x-supabase-key'] || req.headers['authorization'];

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: 'Missing API key. Please provide x-supabase-key or Authorization header',
    });
  }

  // Extract Bearer token if present
  const key = typeof apiKey === 'string'
    ? apiKey.replace('Bearer ', '')
    : apiKey.toString().replace('Bearer ', '');

  // Verify against environment variable
  const validKey = process.env.SUPABASE_ANON_KEY;

  if (key !== validKey) {
    return res.status(403).json({
      success: false,
      error: 'Invalid API key',
    });
  }

  req.supabaseKey = key;
  next();
};
