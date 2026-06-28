import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { createClient } from '../config/supabase';

const router = Router();

// GET /api/auth/me — Returns the authenticated user's profile
router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', req.user!.id)
    .single();

  if (error) {
    res.status(404).json({ message: 'Profile not found' });
    return;
  }
  res.json(data);
});

// PUT /api/auth/profile — Updates user profile fields
router.put('/profile', authMiddleware, async (req: Request, res: Response) => {
  const { full_name, phone_number, saved_addresses } = req.body;
  const supabase = createClient();

  const { data, error } = await supabase
    .from('profiles')
    .update({
      full_name,
      phone_number,
      saved_addresses,
      updated_at: new Date().toISOString(),
    })
    .eq('id', req.user!.id)
    .select()
    .single();

  if (error) {
    res.status(400).json({ message: error.message });
    return;
  }
  res.json(data);
});

export default router;
