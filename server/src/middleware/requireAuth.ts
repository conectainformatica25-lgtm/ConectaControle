import type { Request, Response, NextFunction } from 'express';
import { verifyToken, type JwtPayload } from '../jwt.js';

export type AuthedRequest = Request & { auth: JwtPayload };

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const h = req.headers.authorization;
  const token = h?.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) {
    res.status(401).json({ error: 'missing_token' });
    return;
  }
  try {
    (req as AuthedRequest).auth = verifyToken(token);
    next();
  } catch {
    res.status(401).json({ error: 'invalid_token' });
  }
}
