# 🌿 Green Nest — Development Phases

> **AI-Powered Plant E-Commerce Platform**  
> Built with Next.js 15 · Node.js/Express · Supabase · Gemini Vision AI

This folder contains the complete, phase-by-phase development blueprint for the Green Nest platform. Each phase file is a self-contained implementation guide written for a development agent — covering backend APIs, frontend components, database operations, TypeScript types, and UI specifications.

---

## 📁 Folder Structure

```
Development Phases/
├── README.md                                   ← You are here
├── phase_1_foundation_and_infrastructure.md
├── phase_2_authentication_system.md
├── phase_3_customer_catalog_and_discovery.md
├── phase_4_cart_checkout_and_orders.md
├── phase_5_plant_match_ai_engine.md
└── phase_6_admin_dashboard_and_analytics.md
```

---

## 🗺️ Phase Dependency Map

Phases must be executed in order. Each phase depends on all phases before it.

```
Phase 1 (Foundation)
    │
    └──► Phase 2 (Authentication)
              │
              └──► Phase 3 (Catalog & Discovery)
                        │
                        ├──► Phase 4 (Cart & Checkout)
                        │
                        └──► Phase 5 (Plant Match AI)
                                   │
                                   └──► Phase 6 (Admin Dashboard)
                                              │
                                              ▼
                                     ✅ Platform Complete
```

---

## 📋 Phase Summary Table

| Phase | File | What Gets Built | Est. Duration |
| :---: | :--- | :--- | :---: |
| **1** | `phase_1_foundation_and_infrastructure.md` | Monorepo setup, DB schema, Supabase config, design system tokens, TypeScript types | 2–3 days |
| **2** | `phase_2_authentication_system.md` | Register, Login, Google OAuth, JWT middleware, profile management | 2–3 days |
| **3** | `phase_3_customer_catalog_and_discovery.md` | Navbar, hero, catalog grid, search/filters, product details, wishlist | 3–4 days |
| **4** | `phase_4_cart_checkout_and_orders.md` | Shopping cart, checkout wizard, credit card simulator, order creation, invoices | 3–4 days |
| **5** | `phase_5_plant_match_ai_engine.md` | Image upload, Gemini/OpenAI Vision, plant matching, results dashboard, history | 3–4 days |
| **6** | `phase_6_admin_dashboard_and_analytics.md` | Admin layout, KPI charts, product CRUD, order management, AI log auditor | 3–4 days |

**Total Estimated Duration: 16–22 development days**

---

## 🔍 Phase-by-Phase Breakdown

---

### 🏗️ Phase 1 — Foundation & Infrastructure

**File:** [phase_1_foundation_and_infrastructure.md](./phase_1_foundation_and_infrastructure.md)

The starting point. No user-visible features are built — this phase creates the technical skeleton that every other phase depends on.

**Key deliverables:**
- Root monorepo with npm workspaces (`client/` + `server/`)
- Next.js 15 app initialized with TypeScript, Tailwind CSS, shadcn/ui, and Framer Motion
- Node.js + Express backend bootstrapped with TypeScript
- Supabase project set up with the full **6-table PostgreSQL schema** (profiles, products, reviews, wishlists, orders, order_items, ai_logs)
- Row Level Security (RLS) policies for all tables
- Three Supabase Storage buckets: `product-images`, `avatar-images`, `ai-uploads`
- Complete **Tailwind glassmorphism design system** (HSL color tokens, glass-card/glass-input utilities, keyframe animations)
- All **TypeScript interfaces** (`IProduct`, `IOrder`, `IProfile`, `IAILog`, etc.)
- Supabase browser/server client helpers and Express API fetch wrapper
- Global CSS with ambient gradient backgrounds, shimmer effects, and float animations

**Design concept:** *"Nature through a Glass Lens"* — glassmorphism combining organic emerald gradients with frosted panel interfaces.

---

### 🔐 Phase 2 — Authentication System

**File:** [phase_2_authentication_system.md](./phase_2_authentication_system.md)

Builds the complete authentication layer from UI to database, using Supabase Auth with JWT propagation to the Express backend.

**Key deliverables:**
- Full-screen auth layout with animated ambient orb background
- **Registration** form with zod schema validation (password strength, email format)
- **Login** form with `signInWithPassword()` and success redirect
- **Google OAuth** button triggering `signInWithOAuth()` with callback handler at `/auth/callback`
- **Forgot/Reset password** pages using Supabase reset email + `updateUser()`
- **Express JWT middleware** (`auth.middleware.ts`) validating Bearer tokens against Supabase
- **Admin guard** blocking non-admin users from protected endpoints
- `req.user` type augmentation in `express.d.ts`
- `useAuth()` React hook providing `user`, `profile`, `loading`, `signOut`, `isAdmin`
- **Profile page** with avatar upload to Supabase Storage, saved address CRUD

**Auth methods supported:** Email/Password · Google OAuth

---

### 🛍️ Phase 3 — Customer Catalog & Product Discovery

**File:** [phase_3_customer_catalog_and_discovery.md](./phase_3_customer_catalog_and_discovery.md)

The main customer shopping surface — from hero landing to detailed product pages. This is the largest customer-facing phase.

**Key deliverables:**
- **Glassmorphic sticky Navbar** that transitions from transparent → frosted glass on scroll, with cart + wishlist count badges
- **Hero section** with Framer Motion organic blob animations and glowing CTA buttons
- **Featured / New Arrivals / Best Sellers** horizontal scroll strips
- **Backend products API** (`GET /api/products`) with 6 query filters: `search`, `category`, `difficulty`, `indoor`, `min_price`, `max_price`
- **Filter Sidebar** with price range slider, care difficulty selector, indoor/outdoor toggles, and availability checkbox
- **ProductCard** component: glassmorphic card with hover scale, image zoom, difficulty badge, wishlist heart bounce animation, fly-to-cart indicator
- **Stagger animation grid** (`staggerChildren` 0.05s) for catalog entry
- **Product Details page** (`/product/[id]`): image gallery with thumbnail strip, care info grid, watering gauge timeline, animated tab switcher (Overview / Care / Reviews), review submission form
- `useWishlist()` hook persisting to Supabase `wishlists` table

**Categories:** Tropical · Succulents · Flowering · Herbs · Ferns · Outdoor

---

### 🛒 Phase 4 — Shopping Cart, Checkout & Orders

**File:** [phase_4_cart_checkout_and_orders.md](./phase_4_cart_checkout_and_orders.md)

The complete purchase funnel — from adding items to downloading a PDF invoice.

**Key deliverables:**
- `useCart()` hook with `useReducer` — guest cart persists in `localStorage`, authenticated cart syncs to Supabase
- **Login-merge logic** combining localStorage cart with DB cart on authentication
- **Inventory verification** before checkout (adjusts quantities if stock changed)
- **Cart slide-out drawer** (shadcn Sheet) + dedicated `/cart` page
- **3-step checkout wizard** with Framer Motion cross-fade transitions
  - Step 1: Shipping address (zod validation, preload saved addresses, optional save-back)
  - Step 2: Delivery method selection (Standard $5 / Express $15 / Free on $75+)
  - Step 3: Payment (Card or COD toggle)
- **Interactive 3D credit card**: real-time card number/name/expiry rendered on card face, CVV focus flips card 180° with `rotateY` animation
- **Cash on Delivery** slide-in animation with delivery truck illustration
- **`POST /api/orders`** controller: server-side price validation, stock decrement, order + order_items insert, cart clear
- **Order confirmation** page with order ID and delivery estimate
- **Order history** page with visual status timeline (`pending → processing → shipped → delivered`)
- **PDF invoice generation** using `jspdf` and `jspdf-autotable`

---

### 🤖 Phase 5 — Plant Match AI Engine

**File:** [phase_5_plant_match_ai_engine.md](./phase_5_plant_match_ai_engine.md)

The signature feature of Green Nest — Vision AI analyzing a room photo to recommend matching plants from the live catalog.

**Key deliverables:**
- **Drag-and-drop dropzone** (react-dropzone) with file validation (JPG/PNG/WebP, max 5MB), animated border on drag-over, image preview with clear button
- **4-stage analysis loader** with shimmer scan overlay and animated step indicators
- **`POST /api/ai/match`** endpoint:
  1. Upload image to Supabase `ai-uploads` bucket (multer memory buffer)
  2. Call **Google Gemini 1.5 Flash** Vision API with enforced JSON system prompt
  3. **OpenAI GPT-4o-mini** fallback if Gemini fails
  4. SQL catalog matching query by `is_indoor`, `watering_frequency`, `stock_quantity > 0`
  5. Write full analysis to `ai_logs` table
  6. Return up to 4 matched plants with confidence scores
- **Structured system prompt** enforcing JSON output with `detected_lighting`, `detected_space`, `detected_environment`, `confidence_score`, `reasoning`, `recommended_criteria`
- **Results dashboard**: detected environment badges, circular SVG confidence gauge ring (Framer Motion draw animation), AI reasoning panel, plant recommendation cards
- **"Add All to Cart"** button adding all matches in one click
- **PDF report download** with analysis details, detected parameters, and matched plant table
- **AI Match History** page in user profile with thumbnails and "Run Again" feature
- **Per-user rate limiter**: 5 AI runs per day, stored in `profiles.ai_runs_today`

**Vision APIs supported:** Google Gemini 1.5 Flash (primary) · OpenAI GPT-4o-mini (fallback)

---

### 📊 Phase 6 — Admin Dashboard & Analytics

**File:** [phase_6_admin_dashboard_and_analytics.md](./phase_6_admin_dashboard_and_analytics.md)

A dark-mode glassmorphic operations console giving administrators full visibility and control over the entire platform.

**Key deliverables:**
- **Dark-mode admin layout** (forced, ignoring system preference) with fixed 256px glassmorphic sidebar
- **Sidebar navigation** with active route indicator and hover glow effects
- **Dashboard KPI Cards** (4-up grid): Total Revenue, Total Orders, Total Customers, AI Requests — each with HSL neon glow border and mini sparkline chart
- **Revenue Area Chart** (Recharts `AreaChart`) with translucent emerald gradient fill and custom glassmorphic tooltip
- **AI Usage Radial Gauge** (`RadialBarChart`) color-coded: green → amber (80%) → red (95%)
- **Low stock alert strip** highlighting products with fewer than 5 units
- `get_monthly_revenue()` Supabase stored procedure for 12-month aggregated data
- **Product management table**: sortable columns, stock status badges, Add/Edit/Delete actions
- **Add/Edit product dialog** with full zod-validated form for all 13 product fields
- **Multi-image drag-and-drop uploader** with sortable thumbnail strip (first = cover photo)
- **Order queue table** with status dropdown selector (`pending → processing → shipped → delivered`)
- **Customer directory** with lifetime spend calculation, order count, AI usage
- **Customer detail drawer** with full profile, order history, AI usage stats, rate limit toggle
- **AI Log auditor table** with all analysis metadata
- **Payload viewer popover** showing raw image thumbnail + JSON response from Vision API
- **CSV export** of filtered AI logs for external analytics
- All admin routes protected by `adminGuard` middleware

---

## 🛠️ Full Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend Framework** | Next.js 15 (App Router, React 19) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS + shadcn/ui |
| **Animations** | Framer Motion |
| **Charts** | Recharts |
| **Backend** | Node.js + Express.js |
| **Database** | Supabase (PostgreSQL) |
| **Authentication** | Supabase Auth (Email + Google OAuth) |
| **File Storage** | Supabase Storage |
| **AI — Primary** | Google Gemini 1.5 Flash (Vision) |
| **AI — Fallback** | OpenAI GPT-4o-mini (Vision) |
| **Form Validation** | React Hook Form + Zod |
| **PDF Generation** | jsPDF + jsPDF-AutoTable |
| **Toast Notifications** | Sonner |

---

## 🗄️ Database Tables Overview

| Table | Purpose |
| :--- | :--- |
| `profiles` | Linked to Supabase auth users; stores role, avatar, saved addresses, cart, AI run counts |
| `products` | Full plant catalog with care metadata, images, pricing, stock |
| `reviews` | Customer product reviews (1 per user per product) |
| `wishlists` | Many-to-many user ↔ product wishlist entries |
| `orders` | Order headers with payment + shipping status |
| `order_items` | Line items per order with product snapshot at purchase time |
| `ai_logs` | Every Plant Match AI run with full Vision API response and matched product IDs |

---

## 🔑 Environment Variables Required

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Express Backend
SERVER_PORT=4000
JWT_SECRET=

# AI APIs (at least one required)
GOOGLE_GEMINI_API_KEY=
OPENAI_API_KEY=

# App URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:4000
```

---

## ✅ Platform Completion Checklist

- [ ] **Phase 1** — Foundation, DB schema, design system, TypeScript scaffold
- [ ] **Phase 2** — Registration, login, Google OAuth, JWT middleware, profile management
- [ ] **Phase 3** — Catalog, search/filter, product cards, details page, wishlist
- [ ] **Phase 4** — Cart, checkout wizard, credit card simulator, orders, invoices
- [ ] **Phase 5** — Image upload, Vision AI analysis, plant matching, history, rate limits
- [ ] **Phase 6** — Admin layout, analytics charts, product CRUD, order management, AI logs

---

## 📝 Related Documents

| Document | Location | Purpose |
| :--- | :--- | :--- |
| `PRD.md` | `/Green Nest/` | Original Product Requirements Document |
| `design.md` | `/Green Nest/` | Full system design blueprint (DB schema, API contracts, UI specs) |
| `01_overview_and_system_core.md` | `/project requirement document/` | Project vision, tech stack, RBAC |
| `02_authentication_and_profiles.md` | `/project requirement document/` | Auth flows in detail |
| `03_customer_experience_and_e_commerce.md` | `/project requirement document/` | E-commerce module detail |
| `04_plant_match_ai_engine.md` | `/project requirement document/` | AI module detail |
| `05_admin_dashboard_and_analytics.md` | `/project requirement document/` | Admin module detail |

---

*Green Nest — Where Technology Meets Nature 🌿*
