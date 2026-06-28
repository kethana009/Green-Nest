import { Router, Request, Response } from 'express';
import { authMiddleware, adminGuard } from '../middleware/auth.middleware';
import { createClient } from '../config/supabase';

const router = Router();

// GET /api/products — Filtered + paginated catalog
router.get('/', async (req: Request, res: Response) => {
  const {
    search,
    category,
    difficulty,
    indoor,
    min_price,
    max_price,
    featured,
    new_arrival,
    best_seller,
    sort = 'created_at',
    page = '1',
    limit = '12',
  } = req.query;

  const supabase = createClient();
  const from = (+page - 1) * +limit;
  const to = from + +limit - 1;

  let query = supabase
    .from('products')
    .select('*', { count: 'exact' })
    .order(sort as string, { ascending: false })
    .range(from, to);

  if (search) {
    query = query.or(
      `name.ilike.%${search}%,scientific_name.ilike.%${search}%,description.ilike.%${search}%`
    );
  }
  if (category) query = query.eq('category', category);
  if (difficulty) query = query.eq('difficulty_level', difficulty);
  if (indoor !== undefined) query = query.eq('is_indoor', indoor === 'true');
  if (min_price) query = query.gte('price', +min_price);
  if (max_price) query = query.lte('price', +max_price);
  if (featured === 'true') query = query.eq('is_featured', true);
  if (new_arrival === 'true') query = query.eq('is_new_arrival', true);
  if (best_seller === 'true') query = query.eq('is_best_seller', true);

  const { data, error, count } = await query;
  if (error) {
    res.status(500).json({ message: error.message });
    return;
  }

  res.json({
    products: data,
    pagination: { total: count, page: +page, limit: +limit },
  });
});

// GET /api/products/:id — Single product with reviews
router.get('/:id', async (req: Request, res: Response) => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('products')
    .select('*, reviews(*, profiles(full_name, avatar_url))')
    .eq('id', req.params.id)
    .single();

  if (error || !data) {
    res.status(404).json({ message: 'Product not found' });
    return;
  }
  res.json(data);
});

// POST /api/products — Admin: create product
router.post('/', authMiddleware, adminGuard, async (req: Request, res: Response) => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('products')
    .insert(req.body)
    .select()
    .single();

  if (error) {
    res.status(400).json({ message: error.message });
    return;
  }
  res.status(201).json(data);
});

// PUT /api/products/:id — Admin: update product
router.put('/:id', authMiddleware, adminGuard, async (req: Request, res: Response) => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('products')
    .update(req.body)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) {
    res.status(400).json({ message: error.message });
    return;
  }
  res.json(data);
});

// DELETE /api/products/:id — Admin: delete product
router.delete('/:id', authMiddleware, adminGuard, async (req: Request, res: Response) => {
  const supabase = createClient();
  const { error } = await supabase.from('products').delete().eq('id', req.params.id);

  if (error) {
    res.status(400).json({ message: error.message });
    return;
  }
  res.status(204).send();
});

export default router;
