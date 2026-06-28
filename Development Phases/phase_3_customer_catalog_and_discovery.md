# 🌿 Green Nest — Phase 3: Customer Catalog & Product Discovery

## Overview

Phase 3 builds the entire customer-facing product discovery experience: the animated homepage, catalog grid, search and filter system, product detail pages, and wishlist. This is the largest customer-facing phase and the primary surface users interact with daily.

**Phase Duration Estimate:** 3–4 days  
**Depends On:** Phase 1 (design system), Phase 2 (auth — for wishlist)  
**Unlocks:** Phase 4 (cart is initiated from product cards here)

---

## 1. Customer Layout & Navbar

### 1.1 Customer Layout (`app/(customer)/layout.tsx`)

```typescript
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
```

### 1.2 Glassmorphic Sticky Navbar

**File:** `components/layout/Navbar.tsx`

The navbar sticks to the top, starts transparent, and transitions to a frosted glass background on scroll.

**Key Elements:**
- **Logo:** 🌿 Green Nest (Outfit font, emerald color)
- **Search Bar:** Center — glass input that expands on focus
- **Right Controls:** Wishlist icon (with count badge), Cart icon (with count badge), User avatar dropdown (login/logout/profile links)
- **Mobile:** Hamburger menu opening a slide-down glass drawer

**Scroll Behavior:**
```typescript
const [scrolled, setScrolled] = useState(false);
useEffect(() => {
  const handler = () => setScrolled(window.scrollY > 20);
  window.addEventListener('scroll', handler);
  return () => window.removeEventListener('scroll', handler);
}, []);

// Applied className:
className={`fixed top-0 w-full z-50 transition-all duration-300 ${
  scrolled ? 'glass-card border-b border-white/20 shadow-glass' : 'bg-transparent'
}`}
```

---

## 2. Hero Section

**File:** `app/(customer)/page.tsx` (top section)

### 2.1 Animated Background

```typescript
// Organic SVG blob that slowly morphs and shifts
<div className="absolute inset-0 -z-10 overflow-hidden">
  <motion.div
    animate={{ scale: [1, 1.05, 1], rotate: [0, 3, 0] }}
    transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
    className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full
      bg-gradient-to-br from-brand-mint/30 to-brand-forest/20 blur-3xl"
  />
  <motion.div
    animate={{ scale: [1, 1.08, 1], rotate: [0, -4, 0] }}
    transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
    className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full
      bg-gradient-to-tl from-emerald-300/20 to-brand-mint/15 blur-3xl"
  />
</div>
```

### 2.2 Hero Content

```
+------------------------------------------------------------------------+
|  [Background: Slow-moving emerald gradient blob orbs]                 |
|                                                                        |
|   🌿  Find Your Perfect                                                |
|       Plant Companion                                                  |
|                                                                        |
|   AI-powered recommendations matched to your                           |
|   living space, light, and lifestyle.                                  |
|                                                                        |
|   [ 🔍 Try Plant Match AI ]   [ Browse Plants ]                       |
|     (animate-pulse-glow)       (glass secondary)                       |
|                                                                        |
|   ─── Featured: Monstera · Snake Plant · Peace Lily ───               |
+------------------------------------------------------------------------+
```

**Hero Sections beneath:**
- **Featured Plants** strip (horizontal scroll, `is_featured = true`)
- **New Arrivals** strip (`is_new_arrival = true`)
- **Best Sellers** strip (`is_best_seller = true`)
- **Full Catalog** section with filter sidebar

---

## 3. Backend API — Products Endpoint

### 3.1 Product Controller (`server/src/controllers/product.controller.ts`)

```typescript
import { Request, Response } from 'express';
import { createClient } from '../config/supabase';

// GET /api/products — Filtered catalog query
export async function getProducts(req: Request, res: Response) {
  const {
    search, category, difficulty, indoor,
    min_price, max_price, featured, sort = 'created_at',
    page = '1', limit = '12'
  } = req.query;

  const supabase = createClient();
  let query = supabase
    .from('products')
    .select('*', { count: 'exact' })
    .order(sort as string, { ascending: false })
    .range((+page - 1) * +limit, +page * +limit - 1);

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

  const { data, error, count } = await query;
  if (error) return res.status(500).json({ message: error.message });

  return res.json({
    products: data,
    pagination: { total: count, page: +page, limit: +limit }
  });
}

// GET /api/products/:id — Single product with reviews
export async function getProductById(req: Request, res: Response) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('products')
    .select('*, reviews(*, profiles(full_name, avatar_url))')
    .eq('id', req.params.id)
    .single();

  if (error || !data) return res.status(404).json({ message: 'Product not found' });
  return res.json(data);
}
```

### 3.2 Product Routes (`server/src/routes/product.routes.ts`)

```typescript
import { Router } from 'express';
import { getProducts, getProductById, createProduct, updateProduct, deleteProduct } from '../controllers/product.controller';
import { authMiddleware, adminGuard } from '../middleware/auth.middleware';

const router = Router();

router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/', authMiddleware, adminGuard, createProduct);
router.put('/:id', authMiddleware, adminGuard, updateProduct);
router.delete('/:id', authMiddleware, adminGuard, deleteProduct);

export default router;
```

---

## 4. Filter Sidebar Component

**File:** `components/product/FilterSidebar.tsx`

### 4.1 Filter State Interface

```typescript
export interface IFilters {
  search: string;
  category: string;
  difficulty: string;
  indoor: string;           // 'all' | 'true' | 'false'
  min_price: number;
  max_price: number;
  in_stock_only: boolean;
}
```

### 4.2 Filter UI Controls

| Filter | UI Control | Query Param |
|---|---|---|
| Search | Text input with debounce (300ms) | `search` |
| Category | Radio/button group | `category` |
| Placement | Toggle chips: Indoor / Outdoor / All | `indoor` |
| Difficulty | Segmented button: Beginner / Intermediate / Expert | `difficulty` |
| Price Range | Range slider ($0 – $300) with min/max number inputs | `min_price`, `max_price` |
| Availability | Checkbox | `in_stock_only` |

The filter sidebar uses glass-card styling with smooth height-collapse animations via Framer Motion `AnimatePresence`.

---

## 5. Product Card Component

**File:** `components/product/ProductCard.tsx`

### 5.1 Card Layout

```typescript
'use client';
import { motion } from 'framer-motion';
import { Heart, ShoppingCart, Eye } from 'lucide-react';

export function ProductCard({ product }: { product: IProduct }) {
  const { toggleWishlist, isWishlisted } = useWishlist();
  const { addToCart } = useCart();

  const liked = isWishlisted(product.id);
  const discountedPrice = product.price * (1 - product.discount_percentage / 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, translateY: -4 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="glass-card p-0 overflow-hidden group cursor-pointer relative"
    >
      {/* Image Container */}
      <div className="relative h-52 overflow-hidden">
        <img
          src={product.images[0]}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500
            group-hover:scale-110"
        />

        {/* Difficulty Badge */}
        <span className={`absolute top-3 left-3 px-2 py-0.5 rounded-full text-xs font-semibold
          ${product.difficulty_level === 'beginner' ? 'bg-emerald-500/80' :
            product.difficulty_level === 'intermediate' ? 'bg-amber-500/80' :
            'bg-rose-500/80'} text-white backdrop-blur-sm`}>
          {product.difficulty_level}
        </span>

        {/* Discount Badge */}
        {product.discount_percentage > 0 && (
          <span className="absolute top-3 right-12 px-2 py-0.5 rounded-full text-xs
            font-bold bg-brand-coral text-white">
            -{product.discount_percentage}%
          </span>
        )}

        {/* Wishlist Button */}
        <motion.button
          onClick={(e) => { e.stopPropagation(); toggleWishlist(product.id); }}
          animate={{ scale: liked ? [1, 1.4, 0.9, 1.1, 1] : 1 }}
          transition={{ duration: 0.4 }}
          className="absolute top-3 right-3 p-1.5 rounded-full glass-card border border-white/20"
        >
          <Heart
            size={16}
            className={liked ? 'fill-rose-500 text-rose-500' : 'text-slate-400'}
          />
        </motion.button>

        {/* Quick-view overlay */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileHover={{ opacity: 1, y: 0 }}
          className="absolute bottom-0 inset-x-0 p-3 glass-card rounded-none
            flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100
            transition-all duration-300"
        >
          <Eye size={14} />
          <span className="text-xs font-medium">Quick View</span>
        </motion.div>
      </div>

      {/* Card Body */}
      <div className="p-4 space-y-2">
        <div>
          <h3 className="font-outfit font-semibold text-sm truncate">{product.name}</h3>
          {product.scientific_name && (
            <p className="text-xs text-slate-400 italic truncate">
              🧬 {product.scientific_name}
            </p>
          )}
        </div>

        {/* Stars */}
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i} className={`text-xs ${i < Math.round(product.rating)
              ? 'text-amber-400' : 'text-slate-300'}`}>★</span>
          ))}
          <span className="text-xs text-slate-400 ml-1">({product.review_count})</span>
        </div>

        {/* Price + Cart */}
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="font-bold text-brand-mint">
              ${discountedPrice.toFixed(2)}
            </span>
            {product.discount_percentage > 0 && (
              <span className="text-xs text-slate-400 line-through">
                ${product.price.toFixed(2)}
              </span>
            )}
          </div>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={(e) => { e.stopPropagation(); addToCart(product); }}
            className="p-2 rounded-xl bg-brand-mint/20 hover:bg-brand-mint
              text-brand-mint hover:text-white transition-all duration-300"
          >
            <ShoppingCart size={16} />
          </motion.button>
        </div>

        {/* Out of stock overlay */}
        {product.stock_quantity === 0 && (
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm rounded-2xl
            flex items-center justify-center">
            <span className="glass-card px-4 py-2 text-sm font-semibold text-rose-400">
              Out of Stock
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
```

### 5.2 Product Grid with Stagger Animation

**File:** `components/product/ProductGrid.tsx`

```typescript
const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};

<motion.div
  variants={containerVariants}
  initial="hidden"
  animate="visible"
  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
>
  {products.map((product) => (
    <ProductCard key={product.id} product={product} />
  ))}
</motion.div>
```

---

## 6. Product Details Page

**File:** `app/(customer)/product/[id]/page.tsx`

### 6.1 Page Layout

```
+---------------------------------------------------------------------+
|  ← Back to Catalog                                                  |
+---------------------------+  +--------------------------------------+
|                           |  |  Monstera Deliciosa                 |
|  [Main Product Image]     |  |  🧬 Monstera deliciosa              |
|                           |  |  ⭐⭐⭐⭐⭐ 4.8 (24 reviews)         |
|  [Thumb1][Thumb2][Thumb3] |  |  $32.00  (was $40.00) — 20% OFF     |
|                           |  |                                     |
|                           |  |  Care Overview:                     |
|                           |  |  [💧 Weekly] [☀️ Indirect] [🌱 Easy]|
|                           |  |                                     |
|                           |  |  Watering Gauge:                    |
|                           |  |  [Wet ──── Perfect ──── Dry]        |
|                           |  |                                     |
|                           |  |  Qty: [ - 1 + ]                    |
|                           |  |  [ Add to Cart ] [ Buy Now ]       |
|                           |  |  [ ♡ Add to Wishlist ]              |
+---------------------------+  +--------------------------------------+
|  [ Overview ]  [ Care Guide ]  [ Reviews (24) ]                     |
|  ─────────────────────────────────────────────                      |
|  [Tab Content with framer-motion layout animations]                 |
+---------------------------------------------------------------------+
|  Similar Plants — [Product Card Grid]                               |
+---------------------------------------------------------------------+
```

### 6.2 Image Gallery with Zoom

```typescript
const [selectedImage, setSelectedImage] = useState(0);

<div className="relative group">
  <motion.img
    key={selectedImage}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    src={product.images[selectedImage]}
    alt={product.name}
    className="w-full h-96 object-cover rounded-2xl cursor-zoom-in"
  />
  {/* Magnifying glass hover effect via CSS transform-origin */}
</div>

{/* Thumbnail strip */}
<div className="flex gap-2 mt-3">
  {product.images.map((img, i) => (
    <button key={i} onClick={() => setSelectedImage(i)}
      className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all
        ${selectedImage === i ? 'border-brand-mint' : 'border-transparent'}`}>
      <img src={img} alt="" className="w-full h-full object-cover" />
    </button>
  ))}
</div>
```

### 6.3 Reviews Section

```typescript
// Submit review form (only shown to verified buyers)
const submitReview = async (data: { rating: number; comment: string }) => {
  const supabase = createClient();
  const { error } = await supabase.from('reviews').insert({
    product_id: productId,
    user_id: user!.id,
    rating: data.rating,
    comment: data.comment,
  });
  if (!error) {
    // Recalculate product rating average on server
    await apiFetch(`/api/products/${productId}/review`, {
      method: 'POST', body: JSON.stringify(data), token: await getToken()
    });
    toast.success('Review submitted!');
  }
};
```

---

## 7. Wishlist System

**File:** `hooks/useWishlist.ts`

```typescript
'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export function useWishlist() {
  const { user } = useAuth();
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());
  const supabase = createClient();

  useEffect(() => {
    if (!user) return;
    supabase.from('wishlists')
      .select('product_id')
      .eq('user_id', user.id)
      .then(({ data }) => {
        setWishlistIds(new Set(data?.map(w => w.product_id) ?? []));
      });
  }, [user]);

  const toggleWishlist = async (productId: string) => {
    if (!user) { toast.error('Please sign in to save items'); return; }
    const isIn = wishlistIds.has(productId);

    if (isIn) {
      await supabase.from('wishlists')
        .delete().eq('user_id', user.id).eq('product_id', productId);
      setWishlistIds(prev => { const n = new Set(prev); n.delete(productId); return n; });
      toast.success('Removed from wishlist');
    } else {
      await supabase.from('wishlists')
        .insert({ user_id: user.id, product_id: productId });
      setWishlistIds(prev => new Set(prev).add(productId));
      toast.success('Added to wishlist 💚');
    }
  };

  return {
    wishlistIds,
    isWishlisted: (id: string) => wishlistIds.has(id),
    toggleWishlist,
  };
}
```

---

## 8. Categories Available

Define these plant categories in the catalog. They are used as filter options:

| Category | Description | Icon |
|---|---|---|
| Tropical | Lush, large-leaf indoor tropicals | 🌴 |
| Succulents | Low-maintenance, drought-tolerant | 🌵 |
| Flowering | Colorful blooming plants | 🌸 |
| Herbs | Edible kitchen herbs | 🌿 |
| Ferns | Shade-loving, humidity-loving | 🌱 |
| Outdoor | Garden and patio plants | 🏡 |

---

## 9. Phase 3 Completion Checklist

- [ ] Customer layout with Navbar and Footer created
- [ ] Navbar scroll-aware glassmorphism transition working
- [ ] Navbar wishlist badge and cart badge showing counts
- [ ] Hero section with animated background orbs
- [ ] Hero CTA buttons linking to `/match` and catalog
- [ ] Featured Plants horizontal scroll strip
- [ ] New Arrivals and Best Sellers strips
- [ ] `GET /api/products` endpoint with all filter query params
- [ ] `GET /api/products/:id` endpoint with joined reviews
- [ ] `FilterSidebar` component with all 6 filter controls
- [ ] URL query params synced with filter state (back button works)
- [ ] `ProductCard` with glassmorphic design, hover scale, and image zoom
- [ ] Difficulty badge color coding on product cards
- [ ] Wishlist heart button with bounce animation
- [ ] Cart add button with flying leaf indicator
- [ ] Product grid stagger fade-in animation
- [ ] Infinite scroll or pagination controls
- [ ] Product details page with image gallery
- [ ] Image thumbnail strip and selection
- [ ] Care overview icons (watering, sunlight, difficulty)
- [ ] Watering gauge visual timeline
- [ ] Animated tabs: Overview, Care Guide, Reviews
- [ ] Review list with user avatars and star ratings
- [ ] Review submit form (authenticated buyers only)
- [ ] Similar products section at page bottom
- [ ] `useWishlist()` hook wired to Supabase
- [ ] Wishlist page at `/profile` listing saved items
