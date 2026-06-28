import { Request, Response, NextFunction } from 'express';
import { createClient } from '../config/supabase';

/**
 * Validates the Bearer JWT from the Authorization header against Supabase Auth.
 * Attaches the decoded user + role to req.user on success.
 */
export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Missing or invalid Authorization header' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const supabase = createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    res.status(401).json({ message: 'Invalid or expired token' });
    return;
  }

  // Fetch role from public.profiles
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  req.user = {
    id: user.id,
    email: user.email!,
    role: (profile?.role as 'customer' | 'admin') || 'customer',
  };

  next();
}

/**
 * Blocks non-admin users from accessing the route.
 * Must be used after authMiddleware.
 */
export function adminGuard(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ message: 'Admin access required' });
    return;
  }
  next();
}
