import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/jwt';

export interface AuthRequest extends Request {
  user?: TokenPayload;
  supabaseKey?: string;
}

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const supabaseKey = req.headers['x-supabase-key'];

  // 1. Try JWT Auth (Bearer Token)
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (decoded) {
      req.user = decoded;
      return next();
    }
  }

  // 2. Try Legacy API Key Auth (if needed for system calls)
  // This helps if you still want to allow scripts with just the API key
  if (supabaseKey) {
    const key = typeof supabaseKey === 'string'
      ? supabaseKey
      : supabaseKey.toString();

    const validKey = process.env.SUPABASE_ANON_KEY;
    if (key === validKey) {
      req.supabaseKey = key;
      return next();
    }
  }

  return res.status(401).json({
    success: false,
    error: 'Unauthorized. Please provide a valid Bearer token.',
  });
};
