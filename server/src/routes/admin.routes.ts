import { Router, Request, Response } from 'express';
import { authMiddleware, adminGuard } from '../middleware/auth.middleware';
import { createClient } from '../config/supabase';

const router = Router();
const protect = [authMiddleware, adminGuard] as const;

// GET /api/admin/stats — Dashboard KPI data
router.get('/stats', ...protect, async (_req: Request, res: Response) => {
  const supabase = createClient();

  const [
    { count: totalOrders },
    { data: revenueData },
    { count: totalCustomers },
    { count: aiRequests },
    { data: lowStockProducts },
  ] = await Promise.all([
    supabase.from('orders').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('total_amount').eq('payment_status', 'completed'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'customer'),
    supabase.from('ai_logs').select('*', { count: 'exact', head: true }),
    supabase.from('products').select('id, name, stock_quantity').lt('stock_quantity', 5).order('stock_quantity'),
  ]);

  const totalRevenue = revenueData?.reduce((s, o) => s + Number(o.total_amount), 0) || 0;

  res.json({ totalOrders, totalRevenue, totalCustomers, aiRequests, lowStockProducts });
});

// GET /api/admin/orders — All orders with customer info
router.get('/orders', ...protect, async (req: Request, res: Response) => {
  const supabase = createClient();
  const { page = '1', limit = '20', status } = req.query;
  const from = (+page - 1) * +limit;
  const to = from + +limit - 1;

  let query = supabase
    .from('orders')
    .select('*, profiles(full_name, email)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (status) query = query.eq('order_status', status);

  const { data, error, count } = await query;
  if (error) {
    res.status(500).json({ message: error.message });
    return;
  }
  res.json({ orders: data, total: count });
});

// PUT /api/admin/orders/:id/status — Update order shipment status
router.put('/orders/:id/status', ...protect, async (req: Request, res: Response) => {
  const { order_status } = req.body;
  const supabase = createClient();

  const { data, error } = await supabase
    .from('orders')
    .update({ order_status, updated_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) {
    res.status(400).json({ message: error.message });
    return;
  }
  res.json(data);
});

// GET /api/admin/customers — All customers with order stats
router.get('/customers', ...protect, async (req: Request, res: Response) => {
  const supabase = createClient();
  const { page = '1', limit = '20' } = req.query;
  const from = (+page - 1) * +limit;
  const to = from + +limit - 1;

  const { data, error, count } = await supabase
    .from('profiles')
    .select('*', { count: 'exact' })
    .eq('role', 'customer')
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    res.status(500).json({ message: error.message });
    return;
  }
  res.json({ customers: data, total: count });
});

// GET /api/admin/customers/:id — Single customer with orders
router.get('/customers/:id', ...protect, async (req: Request, res: Response) => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (error || !data) {
    res.status(404).json({ message: 'Customer not found' });
    return;
  }
  res.json(data);
});

// PUT /api/admin/customers/:id/rate-limit — Adjust AI rate limit for a user
router.put('/customers/:id/rate-limit', ...protect, async (req: Request, res: Response) => {
  const { daily_limit } = req.body;
  const supabase = createClient();

  await supabase
    .from('profiles')
    .update({ ai_daily_limit: daily_limit })
    .eq('id', req.params.id);

  res.json({ message: 'Rate limit updated' });
});

export default router;
