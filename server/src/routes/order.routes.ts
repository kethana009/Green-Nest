import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { createClient } from '../config/supabase';

const router = Router();

// POST /api/orders — Create order from cart
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  const { items, shipping_address, shipping_fee, payment_method, payment_status } = req.body;
  const supabase = createClient();

  // 1. Verify and fetch current prices from DB (never trust client pricing)
  const productIds = items.map((i: { product_id: string }) => i.product_id);
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, price, discount_percentage, stock_quantity, name')
    .in('id', productIds);

  if (productsError) {
    res.status(500).json({ message: productsError.message });
    return;
  }

  // 2. Validate stock
  for (const item of items) {
    const product = products?.find((p) => p.id === item.product_id);
    if (!product || product.stock_quantity < item.quantity) {
      res.status(400).json({
        message: `Insufficient stock for: ${product?.name || item.product_id}`,
      });
      return;
    }
  }

  // 3. Calculate totals server-side
  let subtotal = 0;
  let discountAmount = 0;
  const orderItems = items.map((item: { product_id: string; quantity: number }) => {
    const product = products!.find((p) => p.id === item.product_id)!;
    const unitPrice = product.price * (1 - product.discount_percentage / 100);
    const totalPrice = unitPrice * item.quantity;
    subtotal += product.price * item.quantity;
    discountAmount += (product.price - unitPrice) * item.quantity;
    return {
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: unitPrice,
      total_price: totalPrice,
      product_snapshot: product,
    };
  });

  const grandTotal = subtotal - discountAmount + (shipping_fee || 0);

  // 4. Insert order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: req.user!.id,
      total_amount: grandTotal,
      discount_amount: discountAmount,
      shipping_fee: shipping_fee || 0,
      payment_method,
      payment_status: payment_status || 'pending',
      order_status: 'pending',
      shipping_address,
    })
    .select()
    .single();

  if (orderError) {
    res.status(500).json({ message: orderError.message });
    return;
  }

  // 5. Insert order items
  await supabase.from('order_items').insert(
    orderItems.map((oi: typeof orderItems[number]) => ({ ...oi, order_id: order.id }))
  );

  // 6. Decrement stock
  for (const item of items) {
    const product = products!.find((p) => p.id === item.product_id)!;
    await supabase
      .from('products')
      .update({ stock_quantity: product.stock_quantity - item.quantity })
      .eq('id', item.product_id);
  }

  // 7. Clear cart
  await supabase
    .from('profiles')
    .update({ cart_items: [] })
    .eq('id', req.user!.id);

  res.status(201).json({ order_id: order.id, message: 'Order placed successfully!' });
});

// GET /api/orders/my-orders — Authenticated customer's orders
router.get('/my-orders', authMiddleware, async (req: Request, res: Response) => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('user_id', req.user!.id)
    .order('created_at', { ascending: false });

  if (error) {
    res.status(500).json({ message: error.message });
    return;
  }
  res.json(data);
});

// GET /api/orders/:id — Single order detail
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('id', req.params.id)
    .eq('user_id', req.user!.id)
    .single();

  if (error || !data) {
    res.status(404).json({ message: 'Order not found' });
    return;
  }
  res.json(data);
});

export default router;
