import type { Request, Response, NextFunction } from 'express';

// JWT verification middleware (simplified — expects Authorization header)
// In production, this would verify against Supabase Auth
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Missing or invalid authorization header' });
  }
  // Extract org context from token (simplified)
  const token = auth.slice(7);
  (req as any).actorId = 'user-001'; // would come from verified JWT
  (req as any).organizationId = 'org-001';
  next();
}
