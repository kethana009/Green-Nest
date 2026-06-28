# 🌿 Green Nest — Phase 4: Shopping Cart, Checkout & Orders

## Overview

Phase 4 builds the complete purchase funnel: a persisted shopping cart (with guest-to-auth merging), a multi-step checkout wizard, two payment simulations (interactive credit card flip + Cash on Delivery), order creation in the database, and a customer-facing order history with PDF invoice download.

**Phase Duration Estimate:** 3–4 days  
**Depends On:** Phase 1 (database), Phase 2 (auth & JWT), Phase 3 (product catalog)  
**Unlocks:** Phase 5 (AI match adds items to this cart), Phase 6 (admin order management)

---

## 1. Shopping Cart — State & Persistence

### 1.1 Cart Data Shape

```typescript
// types/cart.ts
export interface ICartItem {
  product_id: string;
  name: string;
  image: string;
  price: number;           // Original price
  discount_percentage: number;
  quantity: number;
  stock_quantity: number;  // Max allowed quantity
}

export interface ICartState {
  items: ICartItem[];
  totalItems: number;
  subtotal: number;
  discountTotal: number;
  shipping_fee: number;
  grandTotal: number;
}
```

### 1.2 `useCart` Hook — Full Implementation

**File:** `hooks/useCart.ts`

The cart uses `localStorage` for guests and syncs to a Supabase `carts` JSONB column for authenticated users. On login, it merges both.

```typescript
'use client';
import { useReducer, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from './useAuth';
import type { ICartItem } from '@/types/cart';
import { toast } from 'sonner';

type CartAction =
  | { type: 'ADD'; item: ICartItem }
  | { type: 'REMOVE'; product_id: string }
  | { type: 'UPDATE_QTY'; product_id: string; quantity: number }
  | { type: 'SET'; items: ICartItem[] }
  | { type: 'CLEAR' };

function cartReducer(state: ICartItem[], action: CartAction): ICartItem[] {
  switch (action.type) {
    case 'ADD': {
      const existing = state.find(i => i.product_id === action.item.product_id);
      if (existing) {
        return state.map(i =>
          i.product_id === action.item.product_id
            ? { ...i, quantity: Math.min(i.quantity + 1, i.stock_quantity) }
            : i
        );
      }
      return [...state, { ...action.item, quantity: 1 }];
    }
    case 'REMOVE': return state.filter(i => i.product_id !== action.product_id);
    case 'UPDATE_QTY': return state.map(i =>
      i.product_id === action.product_id ? { ...i, quantity: action.quantity } : i
    );
    case 'SET': return action.items;
    case 'CLEAR': return [];
    default: return state;
  }
}

export function useCart() {
  const [items, dispatch] = useReducer(cartReducer, []);
  const { user } = useAuth();
  const supabase = createClient();

  // Persist to localStorage on every change
  useEffect(() => {
    if (!user) {
      localStorage.setItem('green-nest-cart', JSON.stringify(items));
    }
  }, [items, user]);

  // Load cart on mount / auth change
  useEffect(() => {
    const loadCart = async () => {
      if (user) {
        // Merge localStorage cart into authenticated cart
        const local: ICartItem[] = JSON.parse(
          localStorage.getItem('green-nest-cart') || '[]'
        );
        const { data: profile } = await supabase
          .from('profiles')
          .select('cart_items')
          .eq('id', user.id)
          .single();

        const remote: ICartItem[] = profile?.cart_items || [];

        // Merge: local items take priority for quantity
        const merged = [...remote];
        local.forEach(localItem => {
          const idx = merged.findIndex(r => r.product_id === localItem.product_id);
          if (idx >= 0) merged[idx].quantity = Math.max(merged[idx].quantity, localItem.quantity);
          else merged.push(localItem);
        });

        dispatch({ type: 'SET', items: merged });
        localStorage.removeItem('green-nest-cart');
      } else {
        const local: ICartItem[] = JSON.parse(
          localStorage.getItem('green-nest-cart') || '[]'
        );
        dispatch({ type: 'SET', items: local });
      }
    };
    loadCart();
  }, [user]);

  // Sync to Supabase for authenticated users
  const syncToDb = useCallback(async (updatedItems: ICartItem[]) => {
    if (!user) return;
    await supabase
      .from('profiles')
      .update({ cart_items: updatedItems })
      .eq('id', user.id);
  }, [user]);

  const addToCart = (product: { id: string; name: string; images: string[]; price: number; discount_percentage: number; stock_quantity: number }) => {
    const item: ICartItem = {
      product_id: product.id,
      name: product.name,
      image: product.images[0],
      price: product.price,
      discount_percentage: product.discount_percentage,
      quantity: 1,
      stock_quantity: product.stock_quantity,
    };
    dispatch({ type: 'ADD', item });
    toast.success(`${product.name} added to cart 🛒`);
  };

  // Derived totals
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const discountTotal = items.reduce(
    (sum, i) => sum + (i.price * (i.discount_percentage / 100)) * i.quantity, 0
  );

  return {
    items,
    totalItems: items.reduce((s, i) => s + i.quantity, 0),
    subtotal,
    discountTotal,
    addToCart,
    removeFromCart: (id: string) => dispatch({ type: 'REMOVE', product_id: id }),
    updateQuantity: (id: string, qty: number) =>
      dispatch({ type: 'UPDATE_QTY', product_id: id, quantity: qty }),
    clearCart: () => dispatch({ type: 'CLEAR' }),
  };
}
```

> **Note:** Add `cart_items JSONB DEFAULT '[]'` column to `public.profiles` table.

---

## 2. Cart Drawer & Cart Page

### 2.1 Cart Slide-Out Drawer

A right-side sheet that opens when the cart icon is clicked.

```
+----------------------------------------+
|  🛒 Your Cart (3 items)        [✕]    |
|----------------------------------------|
|  [🪴 Img]  Monstera Deliciosa          |
|            $32.00   [ - 2 + ]  [🗑]   |
|----------------------------------------|
|  [🌵 Img]  Cactus Mix                  |
|            $18.00   [ - 1 + ]  [🗑]   |
|----------------------------------------|
|  Subtotal:           $82.00            |
|  Discount:          -$12.00            |
|  Shipping:            $5.00            |
|  ───────────────────────────           |
|  Total:              $75.00            |
|                                        |
|  [ Proceed to Checkout → ]            |
+----------------------------------------+
```

### 2.2 Cart Page (`app/(customer)/cart/page.tsx`)

Full page view of the cart with the same table layout, inventory warnings, and a prominent checkout CTA.

**Inventory Warning Logic:**
```typescript
// Before displaying cart, verify stock
const verifyStock = async () => {
  const productIds = items.map(i => i.product_id);
  const { data } = await supabase
    .from('products')
    .select('id, stock_quantity')
    .in('id', productIds);

  data?.forEach(p => {
    const cartItem = items.find(i => i.product_id === p.id);
    if (cartItem && cartItem.quantity > p.stock_quantity) {
      toast.warning(`${cartItem.name}: only ${p.stock_quantity} in stock`);
      updateQuantity(p.id, p.stock_quantity);
    }
  });
};
```

---

## 3. Checkout Wizard

**File:** `app/(customer)/checkout/page.tsx`

The checkout is a 3-step wizard with persistent state using React context or `useState` lifted to the page.

### 3.1 Step State Machine

```typescript
type CheckoutStep = 'address' | 'shipping' | 'payment';

const steps: { id: CheckoutStep; label: string }[] = [
  { id: 'address',  label: 'Shipping Address' },
  { id: 'shipping', label: 'Delivery Method' },
  { id: 'payment',  label: 'Payment'          },
];
```

**Step Indicator UI:**
```
  [ ① Shipping Address ] ──── [ ② Delivery Method ] ──── [ ③ Payment ]
       (Complete ✓)                (Active)                (Pending)
```

Each completed step shows a green check and collapses. Framer Motion `AnimatePresence` handles the cross-fade between steps.

---

### 3.2 Step 1 — Shipping Address

```typescript
// Preloaded: if user has saved addresses, show them as selectable cards.
// Otherwise show a blank form.

interface ShippingFormData {
  street: string;
  city: string;
  state: string;
  postal_code: string;
  phone: string;
}

const shippingSchema = z.object({
  street:      z.string().min(5),
  city:        z.string().min(2),
  state:       z.string().min(2),
  postal_code: z.string().min(4),
  phone:       z.string().min(10),
});
```

**Save Address Checkbox:** "Save this address to my profile" — on checkout, if checked, appends to `saved_addresses` JSONB array.

---

### 3.3 Step 2 — Delivery Method

```typescript
type ShippingMethod = { id: string; label: string; desc: string; price: number; eta: string };

const SHIPPING_OPTIONS: ShippingMethod[] = [
  { id: 'standard', label: 'Standard',  desc: '5–7 business days', price: 5.00,  eta: '~6 days' },
  { id: 'express',  label: 'Express',   desc: '1–3 business days', price: 15.00, eta: '~2 days' },
  { id: 'free',     label: 'Free',      desc: 'On orders over $75', price: 0.00, eta: '~8 days' },
];
```

Render as glassmorphic radio cards with hover glow.

---

### 3.4 Step 3 — Payment

Toggle tabs: **💳 Card** | **📦 Cash on Delivery**

#### Credit Card Simulator

```typescript
interface CardForm {
  number: string;
  name: string;
  expiry: string;
  cvv: string;
}

// Format card number as groups of 4
const formatCardNumber = (value: string) =>
  value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim().slice(0, 19);

// Flip card when CVV is focused
const [isFlipped, setIsFlipped] = useState(false);
```

**3D Flip Card UI:**
```typescript
<div className="perspective-1000">
  <motion.div
    animate={{ rotateY: isFlipped ? 180 : 0 }}
    transition={{ duration: 0.5, ease: 'easeInOut' }}
    className="relative w-80 h-48 transform-style-3d"
  >
    {/* FRONT FACE */}
    <div className="absolute inset-0 backface-hidden rounded-2xl
      bg-gradient-to-br from-brand-forest to-brand-mint p-6 text-white shadow-glass-lg">
      <div className="flex justify-between items-start">
        <span className="font-outfit text-lg font-bold">🌿 GREEN NEST</span>
        <span className="text-sm opacity-70">VISA</span>
      </div>
      <div className="mt-6 font-mono text-xl tracking-widest">
        {cardForm.number || '**** **** **** ****'}
      </div>
      <div className="mt-4 flex justify-between text-sm">
        <span>{cardForm.name || 'YOUR NAME'}</span>
        <span>{cardForm.expiry || 'MM/YY'}</span>
      </div>
    </div>

    {/* BACK FACE */}
    <div className="absolute inset-0 backface-hidden [transform:rotateY(180deg)]
      rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 text-white">
      <div className="mt-8 h-10 bg-slate-600 w-full" />
      <div className="px-6 mt-4 flex justify-end">
        <div className="bg-white text-slate-800 px-4 py-1 rounded font-mono text-sm w-24 text-center">
          {cardForm.cvv || 'CVV'}
        </div>
      </div>
    </div>
  </motion.div>
</div>
```

**Pay Now Flow:**
```typescript
const handlePayment = async () => {
  setProcessing(true);
  // Simulate a 2-second processing delay
  await new Promise(r => setTimeout(r, 2000));
  // Place order
  await placeOrder({ payment_method: 'dummy_card', payment_status: 'completed' });
};
```

#### Cash on Delivery UI

When COD is selected, the credit card animates out and a delivery illustration slides in:
```typescript
<AnimatePresence>
  {paymentMethod === 'cod' && (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      className="text-center py-8 space-y-4"
    >
      <div className="text-6xl animate-float">📦</div>
      <p className="text-sm text-slate-500">
        Pay with cash when your plants arrive at your door.
      </p>
    </motion.div>
  )}
</AnimatePresence>
```

---

## 4. Order Creation — Backend

### 4.1 Order Controller (`server/src/controllers/order.controller.ts`)

```typescript
// POST /api/orders — Create order from cart
export async function createOrder(req: Request, res: Response) {
  const { items, shipping_address, shipping_fee, payment_method, payment_status } = req.body;
  const supabase = createClient();

  // 1. Verify stock quantities are still valid
  const productIds = items.map((i: any) => i.product_id);
  const { data: products } = await supabase
    .from('products')
    .select('id, price, stock_quantity, discount_percentage')
    .in('id', productIds);

  for (const item of items) {
    const product = products?.find(p => p.id === item.product_id);
    if (!product || product.stock_quantity < item.quantity) {
      return res.status(400).json({ message: `Insufficient stock for product ${item.product_id}` });
    }
  }

  // 2. Calculate totals (always from DB price, never trust client)
  let subtotal = 0;
  let discountAmount = 0;
  const orderItems = items.map((item: any) => {
    const product = products!.find(p => p.id === item.product_id)!;
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

  const grandTotal = subtotal - discountAmount + shipping_fee;

  // 3. Insert order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: req.user!.id,
      total_amount: grandTotal,
      discount_amount: discountAmount,
      shipping_fee,
      payment_method,
      payment_status,
      order_status: 'pending',
      shipping_address,
    })
    .select()
    .single();

  if (orderError) return res.status(500).json({ message: orderError.message });

  // 4. Insert order items
  await supabase.from('order_items').insert(
    orderItems.map(oi => ({ ...oi, order_id: order.id }))
  );

  // 5. Decrement stock quantities
  for (const item of items) {
    const product = products!.find(p => p.id === item.product_id)!;
    await supabase
      .from('products')
      .update({ stock_quantity: product.stock_quantity - item.quantity })
      .eq('id', item.product_id);
  }

  // 6. Clear cart from profiles
  await supabase.from('profiles').update({ cart_items: [] }).eq('id', req.user!.id);

  return res.status(201).json({ order_id: order.id, message: 'Order placed successfully!' });
}
```

---

## 5. Order Confirmation Page

After `createOrder` succeeds, redirect to `/checkout/success?order_id=<id>`:

```
+---------------------------------------------------------------------+
|               ✅  Order Placed Successfully!                         |
|                                                                     |
|   Order ID: #GN-2026-00104                                          |
|   Estimated Delivery: June 30, 2026                                 |
|                                                                     |
|   [ Download Invoice ]   [ Track My Order ]   [ Shop More ]        |
+---------------------------------------------------------------------+
```

---

## 6. Order History & Invoice Download

**File:** `app/(customer)/profile/orders/page.tsx`

### 6.1 Order Status Timeline

```typescript
const STATUS_STEPS = ['pending', 'processing', 'shipped', 'delivered'];

<div className="flex items-center gap-2">
  {STATUS_STEPS.map((step, i) => (
    <Fragment key={step}>
      <div className={`flex flex-col items-center gap-1`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs
          ${STATUS_STEPS.indexOf(order.order_status) >= i
            ? 'bg-brand-mint text-white' : 'glass-card text-slate-400'}`}>
          {STATUS_STEPS.indexOf(order.order_status) > i ? '✓' : i + 1}
        </div>
        <span className="text-xs capitalize">{step}</span>
      </div>
      {i < STATUS_STEPS.length - 1 && (
        <div className={`flex-1 h-0.5 ${STATUS_STEPS.indexOf(order.order_status) > i
          ? 'bg-brand-mint' : 'bg-white/20'}`} />
      )}
    </Fragment>
  ))}
</div>
```

### 6.2 PDF Invoice Generation (`lib/invoice.ts`)

```typescript
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function generateInvoicePDF(order: IOrder) {
  const doc = new jsPDF();

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('🌿 Green Nest', 14, 20);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Invoice #GN-${order.id.slice(0, 8).toUpperCase()}`, 14, 30);
  doc.text(`Date: ${new Date(order.created_at).toLocaleDateString()}`, 14, 38);

  // Shipping address
  const addr = order.shipping_address;
  doc.text(`Ship To: ${addr.street}, ${addr.city}, ${addr.state} ${addr.postal_code}`, 14, 48);

  // Items table
  autoTable(doc, {
    startY: 60,
    head: [['Plant', 'Qty', 'Unit Price', 'Total']],
    body: order.order_items!.map(item => [
      (item.product_snapshot as any).name,
      item.quantity,
      `$${item.unit_price.toFixed(2)}`,
      `$${item.total_price.toFixed(2)}`,
    ]),
    foot: [
      ['', '', 'Shipping', `$${order.shipping_fee.toFixed(2)}`],
      ['', '', 'Discount', `-$${order.discount_amount.toFixed(2)}`],
      ['', '', 'TOTAL', `$${order.total_amount.toFixed(2)}`],
    ],
  });

  doc.save(`green-nest-invoice-${order.id}.pdf`);
}
```

---

## 7. Backend Order Routes

```typescript
// server/src/routes/order.routes.ts
router.post('/', authMiddleware, createOrder);
router.get('/my-orders', authMiddleware, getMyOrders);
router.get('/:id', authMiddleware, getOrderById);
router.get('/:id/invoice', authMiddleware, getOrderInvoice);
```

---

## 8. Phase 4 Completion Checklist

- [ ] `cart_items JSONB` column added to `profiles` table
- [ ] `ICartItem` type and `ICartState` types defined
- [ ] `useCart()` hook: add, remove, update quantity, clear
- [ ] Guest cart persists to `localStorage`
- [ ] Cart merges from localStorage on login
- [ ] Cart drawer (right sheet) with items list and totals
- [ ] Cart page with inventory stock verification
- [ ] Checkout step indicator with Framer Motion transitions
- [ ] Step 1: Shipping address form with `zod` validation
- [ ] Preload saved addresses from profile as selectable cards
- [ ] "Save address" checkbox writing back to profile
- [ ] Step 2: Delivery method radio cards (Standard/Express/Free)
- [ ] Step 3: Payment tab toggle (Card vs COD)
- [ ] Credit card 3D flip on CVV focus
- [ ] Card number/name/expiry rendered live on card face
- [ ] COD illustration with float animation
- [ ] "Pay Now" processing loader (2s simulation)
- [ ] `POST /api/orders` endpoint: stock validation, DB-side pricing, order insert
- [ ] `order_items` batch insert with product snapshots
- [ ] Stock decrement on successful order creation
- [ ] Cart cleared from DB on order completion
- [ ] Order confirmation success page with order ID
- [ ] `GET /api/orders/my-orders` with order items joined
- [ ] Order history page with status timeline
- [ ] PDF invoice generation and download
- [ ] Order cancellation option (if `order_status === 'pending'`)
