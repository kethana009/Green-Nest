# 🌿 Green Nest — Phase 6: Admin Dashboard & Analytics

## Overview

Phase 6 builds the entire admin-facing module — a dark-mode, glassmorphic operations console. It covers the analytics overview with Recharts visualizations, product CRUD with image uploading, order fulfillment queue, customer profile auditing, and the AI log viewer with raw payload inspection. Admins access this at `/admin/*`, protected by the `adminGuard` middleware.

**Phase Duration Estimate:** 3–4 days  
**Depends On:** Phases 1–5 (all data exists, all APIs are live)  
**Unlocks:** Full platform is complete

---

## 1. Admin Layout & Sidebar Navigation

**File:** `app/(admin)/layout.tsx`

The admin module uses a dark-mode layout permanently (ignores system preference). A fixed left sidebar provides navigation; the content area scrolls independently.

### 1.1 Admin Layout

```typescript
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    // Force dark mode for admin area
    <div className="dark min-h-screen flex bg-[hsl(164,30%,5%)]">
      <AdminSidebar />
      <main className="flex-1 ml-64 p-8 overflow-auto">
        {children}
      </main>
    </div>
  );
}
```

### 1.2 Admin Sidebar (`components/layout/AdminSidebar.tsx`)

```typescript
const NAV_ITEMS = [
  { href: '/admin/dashboard', icon: BarChart2,  label: 'Dashboard'  },
  { href: '/admin/products',  icon: Package,    label: 'Products'   },
  { href: '/admin/orders',    icon: ShoppingBag, label: 'Orders'    },
  { href: '/admin/customers', icon: Users,       label: 'Customers' },
  { href: '/admin/logs',      icon: Bot,         label: 'AI Logs'   },
];
```

**Visual Spec:**
- Width: `16rem` (256px), fixed position
- Background: dark glass — `rgba(10, 18, 14, 0.85)` with `backdrop-blur-glass`
- Border-right: `1px solid rgba(255,255,255,0.07)`
- Active item: left accent bar `4px solid hsl(162,76%,41%)` + mint text
- Hover: subtle emerald background `rgba(16,185,129,0.08)`

---

## 2. Dashboard Overview — KPI Cards & Charts

**File:** `app/(admin)/dashboard/page.tsx`

### 2.1 Analytics Data Query (Server Component)

The dashboard page is a React Server Component fetching all KPI data before render:

```typescript
async function getAdminStats(supabase: SupabaseClient) {
  const [
    { count: totalOrders },
    { data: revenueData },
    { count: totalCustomers },
    { count: aiRequests },
    { data: lowStockProducts },
    { data: monthlyRevenue },
  ] = await Promise.all([
    supabase.from('orders').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('total_amount').eq('payment_status', 'completed'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'customer'),
    supabase.from('ai_logs').select('*', { count: 'exact', head: true }),
    supabase.from('products').select('id, name, stock_quantity')
      .lt('stock_quantity', 5).order('stock_quantity'),
    supabase.rpc('get_monthly_revenue'),   // Stored procedure (see below)
  ]);

  const totalRevenue = revenueData?.reduce((s, o) => s + o.total_amount, 0) || 0;
  return { totalOrders, totalRevenue, totalCustomers, aiRequests, lowStockProducts, monthlyRevenue };
}
```

**Monthly Revenue Stored Procedure:**
```sql
CREATE OR REPLACE FUNCTION get_monthly_revenue()
RETURNS TABLE (month TEXT, revenue NUMERIC, order_count BIGINT) AS $$
  SELECT
    TO_CHAR(created_at, 'Mon YYYY') AS month,
    SUM(total_amount) AS revenue,
    COUNT(*) AS order_count
  FROM public.orders
  WHERE payment_status = 'completed'
    AND created_at >= NOW() - INTERVAL '12 months'
  GROUP BY TO_CHAR(created_at, 'Mon YYYY'), DATE_TRUNC('month', created_at)
  ORDER BY DATE_TRUNC('month', created_at);
$$ LANGUAGE sql;
```

### 2.2 KPI Cards Component

**File:** `components/admin/KPICard.tsx`

```typescript
interface KPICardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  change?: string;        // e.g. "+12.4% vs last month"
  glowColor: string;      // e.g. 'rgba(16,185,129,0.4)'
  sparklineData?: number[];
}

export function KPICard({ title, value, icon: Icon, change, glowColor, sparklineData }: KPICardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="glass-card p-6 space-y-4 relative overflow-hidden"
      style={{ boxShadow: `0 0 30px -5px ${glowColor}` }}
    >
      {/* Background glow disc */}
      <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-20"
        style={{ background: glowColor, filter: 'blur(20px)' }} />

      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">{title}</p>
          <p className="font-outfit text-2xl font-bold text-white">{value}</p>
          {change && (
            <p className="text-xs text-brand-mint">{change}</p>
          )}
        </div>
        <div className="p-2.5 rounded-xl" style={{ background: `${glowColor}20` }}>
          <Icon size={20} style={{ color: glowColor.replace('0.4)', '1)') }} />
        </div>
      </div>

      {/* Mini Sparkline */}
      {sparklineData && (
        <div className="h-10">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparklineData.map((v, i) => ({ v, i }))}>
              <Line type="monotone" dataKey="v" dot={false} strokeWidth={2}
                stroke={glowColor.replace('0.4)', '1)')} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );
}
```

**KPI Grid:**
```typescript
<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
  <KPICard title="Total Revenue" value={`$${totalRevenue.toLocaleString()}`}
    icon={DollarSign} glowColor="rgba(16,185,129,0.4)"
    change="+18.2% vs last month" sparklineData={weeklyRevenue} />

  <KPICard title="Total Orders"   value={totalOrders.toString()}
    icon={ShoppingBag} glowColor="rgba(99,102,241,0.4)" change="+8.1%" />

  <KPICard title="Customers"      value={totalCustomers.toString()}
    icon={Users} glowColor="rgba(20,184,166,0.4)" change="+24 this week" />

  <KPICard title="AI Requests"    value={aiRequests.toString()}
    icon={Bot} glowColor="rgba(168,85,247,0.4)"
    change="412 this month" />
</div>
```

---

### 2.3 Revenue Area Chart

**File:** `components/admin/charts/RevenueChart.tsx`

```typescript
'use client';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// Custom glassmorphic tooltip
function GlassTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card p-3 space-y-1 text-sm">
      <p className="font-medium text-slate-300">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: ${p.value.toLocaleString()}
        </p>
      ))}
    </div>
  );
}

export function RevenueChart({ data }: { data: MonthlyRevenueRow[] }) {
  return (
    <div className="glass-card p-6 space-y-4">
      <h2 className="font-outfit font-semibold text-white">Sales Performance</h2>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="hsl(162,76%,41%)" stopOpacity={0.4} />
              <stop offset="95%" stopColor="hsl(162,76%,41%)" stopOpacity={0}   />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 12 }}
            axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }}
            axisLine={false} tickLine={false}
            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
          <Tooltip content={<GlassTooltip />} />
          <Area type="monotone" dataKey="revenue" name="Revenue"
            stroke="hsl(162,76%,41%)" fill="url(#revenueGrad)" strokeWidth={2.5} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
```

### 2.4 AI Usage Radial Gauge

```typescript
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts';

export function AIUsageGauge({ used, limit }: { used: number; limit: number }) {
  const pct = (used / limit) * 100;
  const color = pct > 95 ? 'hsl(343,85%,55%)' : pct > 80 ? 'hsl(38,92%,50%)' : 'hsl(162,76%,41%)';

  return (
    <div className="glass-card p-6 text-center">
      <h3 className="font-outfit font-semibold text-white mb-4">AI API Usage</h3>
      <ResponsiveContainer width="100%" height={160}>
        <RadialBarChart innerRadius="60%" outerRadius="100%"
          data={[{ value: pct, fill: color }]} startAngle={90} endAngle={-270}>
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar background dataKey="value" cornerRadius={6} />
        </RadialBarChart>
      </ResponsiveContainer>
      <p className="font-outfit text-2xl font-bold text-white -mt-4">{pct.toFixed(1)}%</p>
      <p className="text-xs text-slate-400">{used.toLocaleString()} / {limit.toLocaleString()} requests</p>
    </div>
  );
}
```

---

## 3. Product Management

**File:** `app/(admin)/products/page.tsx`

### 3.1 Products Data Table

A sortable table using `@tanstack/react-table` (optional) or a custom table:

| Column | Source Field | Sortable |
|---|---|---|
| Thumbnail | `images[0]` | No |
| Name + Scientific | `name`, `scientific_name` | Yes |
| Category | `category` | Yes |
| Price (with discount) | `price`, `discount_percentage` | Yes |
| Stock | `stock_quantity` | Yes |
| Rating | `rating` | Yes |
| Status | `stock_quantity` → badge | No |
| Actions | Edit / Delete buttons | No |

**Stock Status Badges:**
```typescript
const stockBadge = (qty: number) =>
  qty === 0  ? <Badge className="bg-rose-500/20 text-rose-400">Out of Stock</Badge> :
  qty < 5    ? <Badge className="bg-amber-500/20 text-amber-400">Low — {qty} left</Badge> :
               <Badge className="bg-emerald-500/20 text-emerald-400">In Stock</Badge>;
```

### 3.2 Add / Edit Product Dialog

A `shadcn/ui Dialog` (or Sheet) containing a rich form:

```typescript
const productSchema = z.object({
  name:               z.string().min(2),
  scientific_name:    z.string().optional(),
  description:        z.string().min(20),
  price:              z.number().positive(),
  discount_percentage:z.number().min(0).max(100),
  stock_quantity:     z.number().int().min(0),
  category:           z.enum(['Tropical','Succulents','Flowering','Herbs','Ferns','Outdoor']),
  is_indoor:          z.boolean(),
  difficulty_level:   z.enum(['beginner','intermediate','expert']),
  watering_frequency: z.string(),
  sunlight_requirement:z.string(),
  benefits:           z.array(z.string()),
  is_featured:        z.boolean(),
  is_new_arrival:     z.boolean(),
  is_best_seller:     z.boolean(),
});
```

### 3.3 Image Multi-Upload

```typescript
const handleImageUpload = async (files: File[]) => {
  const urls: string[] = [];
  for (const file of files) {
    const path = `products/${Date.now()}-${file.name}`;
    await supabase.storage.from('product-images').upload(path, file);
    const { data: { publicUrl } } = supabase.storage
      .from('product-images').getPublicUrl(path);
    urls.push(publicUrl);
  }
  setValue('images', [...watch('images'), ...urls]);
};
```

Uploaded images show as a drag-sortable thumbnail strip. Dragging reorders the array (first image is the cover).

---

## 4. Order Management

**File:** `app/(admin)/orders/page.tsx`

### 4.1 Order Queue Table

| Column | Detail |
|---|---|
| Order ID | Short ID `#GN-{id.slice(0,8)}` |
| Customer | Linked name (→ customer profile) |
| Date | Formatted date |
| Items Count | `order_items.length` |
| Total | `total_amount` |
| Payment Status | Colored badge |
| Order Status | Dropdown selector |
| Actions | View / Invoice |

### 4.2 Status Update Dropdown

```typescript
const updateOrderStatus = async (orderId: string, newStatus: string) => {
  await apiFetch(`/api/admin/orders/${orderId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ order_status: newStatus }),
    token: await getToken(),
  });
  toast.success(`Order status updated to ${newStatus}`);
  refetchOrders();
};
```

**Status Flow with visual indicator:**
```
[ pending ] ──→ [ processing ] ──→ [ shipped ] ──→ [ delivered ]
                                        ↕
                                  [ cancelled ]
```

### 4.3 Admin Order Controller Additions

```typescript
// server/src/controllers/admin.controller.ts

// PUT /api/admin/orders/:id/status
export async function updateOrderStatus(req: Request, res: Response) {
  const { order_status } = req.body;
  const supabase = createClient();

  const { data, error } = await supabase
    .from('orders')
    .update({ order_status, updated_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .select('*, profiles(email, full_name)')
    .single();

  if (error) return res.status(400).json({ message: error.message });

  // TODO Phase 6+: Send email notification via Resend/SendGrid when status = 'shipped'

  return res.json(data);
}

// GET /api/admin/orders — All orders with customer info
export async function getAllOrders(req: Request, res: Response) {
  const supabase = createClient();
  const { page = '1', limit = '20', status } = req.query;

  let query = supabase
    .from('orders')
    .select('*, profiles(full_name, email), order_items(count)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((+page - 1) * +limit, +page * +limit - 1);

  if (status) query = query.eq('order_status', status);

  const { data, error, count } = await query;
  if (error) return res.status(500).json({ message: error.message });
  return res.json({ orders: data, total: count });
}
```

---

## 5. Customer Management

**File:** `app/(admin)/customers/page.tsx`

### 5.1 Customer Directory

Each row in the customer table shows:
- Avatar + full name
- Email
- Member Since date
- Total Orders count
- Lifetime Spend (sum of `total_amount` from their orders)
- AI Runs today
- Actions: View Profile / Adjust Rate Limit

### 5.2 Customer Detail Drawer

Clicking a customer opens a right-side sheet with:
- Full profile card (avatar, contact info, address)
- Order history summary table
- AI usage log (runs count, last run date)
- Rate limit toggle (set custom daily limit or block entirely)

```typescript
// PUT /api/admin/customers/:id/rate-limit
export async function adjustRateLimit(req: Request, res: Response) {
  const { daily_limit } = req.body;
  const supabase = createClient();
  await supabase.from('profiles')
    .update({ ai_daily_limit: daily_limit })
    .eq('id', req.params.id);
  return res.json({ message: 'Rate limit updated' });
}
```

> **Note:** Add `ai_daily_limit INT DEFAULT 5` column to `public.profiles`.

---

## 6. AI Log Auditor

**File:** `app/(admin)/logs/page.tsx`

### 6.1 Log Table

| Column | Field |
|---|---|
| Thumbnail | `uploaded_image_url` (40×40 hover-zoom) |
| User | `profiles.full_name` |
| Date | `created_at` |
| Environment | `detected_environment` badge |
| Lighting | `detected_lighting` badge |
| Confidence | Colored percentage |
| Matches | Count of `recommended_product_ids` |
| Processing | `processing_time_ms` ms |
| Actions | View Payload |

### 6.2 Payload Viewer Popover

Clicking **"View Payload"** opens a glassmorphic popover:

```typescript
<Popover>
  <PopoverTrigger asChild>
    <Button variant="ghost" size="sm">View Payload</Button>
  </PopoverTrigger>
  <PopoverContent className="glass-card w-[480px] p-0 border-white/10">
    <div className="p-4 border-b border-white/10 flex items-center gap-3">
      <img src={log.uploaded_image_url} alt=""
        className="w-16 h-16 rounded-lg object-cover" />
      <div>
        <p className="font-medium text-sm">{log.profiles?.full_name}</p>
        <p className="text-xs text-slate-400">{new Date(log.created_at).toLocaleString()}</p>
        <p className="text-xs text-brand-mint mt-1">
          {log.processing_time_ms}ms · Confidence: {log.confidence_score}%
        </p>
      </div>
    </div>
    <div className="p-4 max-h-64 overflow-auto">
      <pre className="text-xs text-slate-300 whitespace-pre-wrap">
        {JSON.stringify(log.raw_ai_response, null, 2)}
      </pre>
    </div>
  </PopoverContent>
</Popover>
```

### 6.3 CSV Export

```typescript
const exportToCSV = (logs: IAILog[]) => {
  const headers = ['ID', 'User', 'Date', 'Environment', 'Lighting', 'Space', 'Confidence', 'Matches', 'Processing (ms)'];
  const rows = logs.map(l => [
    l.id, l.user_id, l.created_at,
    l.detected_environment, l.detected_lighting, l.detected_space,
    l.confidence_score, l.recommended_product_ids.length, l.processing_time_ms
  ]);
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ai-logs-${Date.now()}.csv`;
  a.click();
};
```

---

## 7. Admin API Routes Summary

```typescript
// server/src/routes/admin.routes.ts
import { authMiddleware, adminGuard } from '../middleware/auth.middleware';

const protect = [authMiddleware, adminGuard];

router.get('/stats',                ...protect, getAdminStats);
router.get('/orders',               ...protect, getAllOrders);
router.put('/orders/:id/status',    ...protect, updateOrderStatus);
router.get('/customers',            ...protect, getAllCustomers);
router.get('/customers/:id',        ...protect, getCustomerById);
router.put('/customers/:id/rate-limit', ...protect, adjustRateLimit);
router.get('/logs',                 ...protect, getAllAILogs);
router.get('/logs/export',          ...protect, exportLogs);
```

---

## 8. Phase 6 Completion Checklist

- [ ] Admin layout with dark-mode forced and fixed sidebar
- [ ] Admin sidebar with active route highlighting
- [ ] Admin guard middleware applied to all `/api/admin/*` routes
- [ ] `get_monthly_revenue()` stored procedure created in Supabase
- [ ] Dashboard KPI cards: Revenue, Orders, Customers, AI Requests
- [ ] KPI cards with HSL glow shadows and sparkline charts
- [ ] Revenue area chart with glassmorphic tooltip
- [ ] Low stock product alert strip below charts
- [ ] AI usage radial gauge with color-coded warning states
- [ ] Products data table with sortable columns
- [ ] Stock status badges (green/amber/red)
- [ ] Add Product dialog with full zod-validated form
- [ ] Edit Product dialog pre-populated with existing data
- [ ] Delete product with confirmation dialog
- [ ] Multi-image drag-and-drop uploader to Supabase Storage
- [ ] Image sortable thumbnail strip (first = cover)
- [ ] Orders queue table with all columns
- [ ] Order status dropdown updating via API
- [ ] Order detail slide-out sheet with items and address
- [ ] Customer directory table with lifetime spend
- [ ] Customer detail drawer with order history
- [ ] AI rate limit toggle per customer
- [ ] AI Logs table with all metadata columns
- [ ] Payload viewer popover with JSON display and image thumbnail
- [ ] CSV export downloading all filtered logs
- [ ] All admin pages redirect non-admins to homepage
- [ ] Responsive admin layout on tablet (sidebar collapses to icon-only)
