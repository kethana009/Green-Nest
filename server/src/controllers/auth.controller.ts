import { Request, Response } from 'express';
import { createClient } from '../config/supabase';

/**
 * GET /api/auth/me
 * Returns the authenticated user's profile from the public.profiles table.
 */
export async function getMe(req: Request, res: Response): Promise<void> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', req.user!.id)
      .single();

    if (error || !data) {
      res.status(404).json({ message: 'Profile not found' });
      return;
    }

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
}

/**
 * PUT /api/auth/profile
 * Updates the profile fields (full_name, phone_number, saved_addresses) for the user.
 */
export async function updateProfile(req: Request, res: Response): Promise<void> {
  try {
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
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
}
