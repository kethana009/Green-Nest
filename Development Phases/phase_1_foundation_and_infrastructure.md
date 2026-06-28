# 🌿 Green Nest — Phase 1: Project Foundation & Infrastructure

## Overview

Phase 1 lays the entire technical foundation that every subsequent phase depends on. No user-visible features are built here — the goal is to establish a rock-solid base: monorepo structure, database schema, design system tokens, and shared utilities. Every developer working on any phase must complete this phase first.

**Phase Duration Estimate:** 2–3 days  
**Depends On:** Nothing (starting point)  
**Unlocks:** All other phases

---

## 1. Monorepo Workspace Setup

### 1.1 Root Workspace Structure

Create the top-level project folder `green-nest/` and initialize it as an npm workspace so both `client` and `server` packages share a single `node_modules` root.

```
green-nest/
├── client/             # Next.js 15 Frontend
├── server/             # Node.js + Express Backend
├── package.json        # Root workspace config
├── .gitignore
├── .env.example        # Environment variable template
└── README.md
```

**Root `package.json`:**
```json
{
  "name": "green-nest",
  "private": true,
  "workspaces": ["client", "server"],
  "scripts": {
    "dev:client": "npm run dev --workspace=client",
    "dev:server": "npm run dev --workspace=server",
    "dev": "concurrently \"npm run dev:client\" \"npm run dev:server\""
  },
  "devDependencies": {
    "concurrently": "^8.2.0"
  }
}
```

### 1.2 Environment Variable Template (`.env.example`)

Create this file at the root. Developers copy it to `.env.local` for both `client/` and `server/`.

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Backend Server
SERVER_PORT=4000
JWT_SECRET=your-supabase-jwt-secret

# AI APIs (use ONE of the two below)
OPENAI_API_KEY=sk-...
GOOGLE_GEMINI_API_KEY=AIza...

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:4000
```

---

## 2. Client Setup — Next.js 15

### 2.1 Initialize Next.js App

```bash
cd green-nest/
npx create-next-app@latest client \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"
```

### 2.2 Install All Client Dependencies

```bash
cd client/

# shadcn/ui (component library)
npx shadcn@latest init

# Framer Motion (animations)
npm install framer-motion

# Supabase client
npm install @supabase/supabase-js @supabase/ssr

# Charts
npm install recharts

# Form handling & validation
npm install react-hook-form zod @hookform/resolvers

# PDF generation (for invoices)
npm install jspdf jspdf-autotable

# Toast notifications
npm install sonner

# Additional utilities
npm install clsx tailwind-merge lucide-react date-fns
```

### 2.3 Install Key shadcn/ui Components

```bash
npx shadcn@latest add button card dialog input label
npx shadcn@latest add select slider badge avatar
npx shadcn@latest add tabs sheet popover tooltip
npx shadcn@latest add form dropdown-menu separator
```

### 2.4 Full Client Directory Structure

```
client/src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   ├── reset-password/page.tsx
│   │   └── callback/page.tsx          # Google OAuth callback
│   ├── (customer)/
│   │   ├── layout.tsx                 # Customer layout with Navbar
│   │   ├── page.tsx                   # Home / Catalog
│   │   ├── match/page.tsx             # Plant Match AI
│   │   ├── product/[id]/page.tsx      # Product Details
│   │   ├── cart/page.tsx              # Shopping Cart
│   │   ├── checkout/page.tsx          # Checkout Wizard
│   │   └── profile/
│   │       ├── page.tsx               # Profile Overview
│   │       ├── orders/page.tsx        # Order History
│   │       └── ai-history/page.tsx    # AI Match History
│   ├── (admin)/
│   │   ├── layout.tsx                 # Admin layout with Sidebar
│   │   ├── dashboard/page.tsx
│   │   ├── products/page.tsx
│   │   ├── orders/page.tsx
│   │   ├── customers/page.tsx
│   │   └── logs/page.tsx
│   ├── globals.css
│   └── layout.tsx                     # Root layout (fonts, providers)
├── components/
│   ├── ui/                            # shadcn components (auto-generated)
│   ├── glass/
│   │   ├── GlassCard.tsx
│   │   ├── GlassInput.tsx
│   │   └── GlassModal.tsx
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   ├── AdminSidebar.tsx
│   │   └── Footer.tsx
│   ├── product/
│   │   ├── ProductCard.tsx
│   │   ├── ProductGrid.tsx
│   │   └── FilterSidebar.tsx
│   └── shared/
│       ├── LoadingSpinner.tsx
│       └── EmptyState.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useCart.ts
│   └── useWishlist.ts
├── lib/
│   ├── supabase/
│   │   ├── client.ts                  # Browser client
│   │   └── server.ts                  # Server-side client (RSC)
│   ├── api.ts                         # Fetch wrapper for Express API
│   └── utils.ts                       # clsx + tailwind-merge helpers
└── types/
    ├── product.ts
    ├── order.ts
    ├── user.ts
    └── ai.ts
```

---

## 3. Server Setup — Node.js + Express

### 3.1 Initialize Server Package

```bash
cd server/
npm init -y
npm install express cors helmet morgan dotenv multer
npm install @supabase/supabase-js
npm install openai @google/generative-ai

# TypeScript tooling
npm install -D typescript ts-node-dev @types/node @types/express
npm install -D @types/cors @types/morgan @types/multer

# Initialize tsconfig
npx tsc --init
```

### 3.2 Server Directory Structure

```
server/src/
├── config/
│   ├── supabase.ts        # Supabase admin client (service role)
│   └── env.ts             # Validated environment config
├── middleware/
│   ├── auth.middleware.ts  # JWT verification & role check
│   ├── admin.guard.ts      # Admin-only route guard
│   └── error.handler.ts    # Global Express error handler
├── controllers/
│   ├── auth.controller.ts
│   ├── product.controller.ts
│   ├── order.controller.ts
│   ├── ai.controller.ts
│   └── admin.controller.ts
├── routes/
│   ├── auth.routes.ts
│   ├── product.routes.ts
│   ├── order.routes.ts
│   ├── ai.routes.ts
│   └── admin.routes.ts
├── services/
│   ├── ai.service.ts       # OpenAI / Gemini Vision integration
│   ├── storage.service.ts  # Supabase Storage uploads
│   └── pdf.service.ts      # Invoice PDF generation
├── types/
│   └── express.d.ts        # Augment req.user type
└── index.ts                # Entry point, app bootstrap
```

### 3.3 `tsconfig.json` for Server

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 3.4 Express Entry Point (`server/src/index.ts`)

```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import 'dotenv/config';

import authRoutes from './routes/auth.routes';
import productRoutes from './routes/product.routes';
import orderRoutes from './routes/order.routes';
import aiRoutes from './routes/ai.routes';
import adminRoutes from './routes/admin.routes';
import { errorHandler } from './middleware/error.handler';

const app = express();
const PORT = process.env.SERVER_PORT || 4000;

// Core Middleware
app.use(helmet());
app.use(cors({ origin: process.env.NEXT_PUBLIC_APP_URL, credentials: true }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes);

// Global error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🌿 Green Nest API running on http://localhost:${PORT}`);
});
```

---

## 4. Supabase Database Setup

### 4.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project named **green-nest**.
2. Copy the **Project URL**, **anon key**, and **service_role key** into your `.env` files.
3. Navigate to **SQL Editor** and run the full DDL script below.

### 4.2 Full Database DDL Script

```sql
-- =============================================
-- GREEN NEST — Complete Database Schema
-- Run this entire block in Supabase SQL Editor
-- =============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- PROFILES (linked to Supabase auth.users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    phone_number VARCHAR(20),
    avatar_url TEXT,
    role VARCHAR(50) DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
    saved_addresses JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- PRODUCTS
CREATE TABLE public.products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    scientific_name VARCHAR(255),
    description TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    discount_percentage INT DEFAULT 0 CHECK (discount_percentage BETWEEN 0 AND 100),
    stock_quantity INT DEFAULT 0 CHECK (stock_quantity >= 0),
    category VARCHAR(100) NOT NULL,
    is_indoor BOOLEAN DEFAULT TRUE,
    difficulty_level VARCHAR(50) CHECK (difficulty_level IN ('beginner','intermediate','expert')),
    watering_frequency VARCHAR(100),
    sunlight_requirement VARCHAR(100),
    benefits TEXT[] DEFAULT '{}',
    images TEXT[] NOT NULL DEFAULT '{}',
    rating DECIMAL(3,2) DEFAULT 0.0 CHECK (rating BETWEEN 0.0 AND 5.0),
    review_count INT DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    is_new_arrival BOOLEAN DEFAULT FALSE,
    is_best_seller BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- REVIEWS
CREATE TABLE public.reviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(product_id, user_id)
);

-- WISHLISTS
CREATE TABLE public.wishlists (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(user_id, product_id)
);

-- ORDERS
CREATE TABLE public.orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    shipping_fee DECIMAL(10,2) DEFAULT 0.00,
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('cod','dummy_card')),
    payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending','completed','failed')),
    order_status VARCHAR(50) DEFAULT 'pending' CHECK (
        order_status IN ('pending','processing','shipped','delivered','cancelled')
    ),
    shipping_address JSONB NOT NULL,
    invoice_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ORDER ITEMS
CREATE TABLE public.order_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_snapshot JSONB NOT NULL,  -- Snapshot of product at time of purchase
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL
);

-- AI LOGS
CREATE TABLE public.ai_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    uploaded_image_url TEXT NOT NULL,
    detected_lighting VARCHAR(50),
    detected_space VARCHAR(50),
    detected_environment VARCHAR(50),
    confidence_score DECIMAL(5,2) CHECK (confidence_score BETWEEN 0.0 AND 100.0),
    recommended_product_ids UUID[] DEFAULT '{}',
    raw_ai_response JSONB,
    processing_time_ms INT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- =============================================
-- TRIGGER: Auto-create profile on sign up
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', 'Plant Lover'),
        new.raw_user_meta_data->>'avatar_url'
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_logs ENABLE ROW LEVEL SECURITY;

-- Products: public read, admin write
CREATE POLICY "products_public_read" ON public.products FOR SELECT USING (true);
CREATE POLICY "products_admin_all" ON public.products FOR ALL
    USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Profiles: own read/write, admin read-all
CREATE POLICY "profiles_own_read" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_own_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_admin_read_all" ON public.profiles FOR SELECT
    USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Reviews: public read, authenticated insert (own), admin all
CREATE POLICY "reviews_public_read" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "reviews_auth_insert" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reviews_admin_all" ON public.reviews FOR ALL
    USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Wishlists: own all
CREATE POLICY "wishlists_own_all" ON public.wishlists FOR ALL USING (auth.uid() = user_id);

-- Orders: own read/insert, admin all
CREATE POLICY "orders_own_read" ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "orders_own_insert" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "orders_admin_all" ON public.orders FOR ALL
    USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Order Items: own read via orders, admin all
CREATE POLICY "order_items_own_read" ON public.order_items FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_id AND orders.user_id = auth.uid()));
CREATE POLICY "order_items_admin_all" ON public.order_items FOR ALL
    USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- AI Logs: own read/insert, admin read-all
CREATE POLICY "ai_logs_own_read" ON public.ai_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "ai_logs_own_insert" ON public.ai_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ai_logs_admin_read" ON public.ai_logs FOR SELECT
    USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
```

### 4.3 Supabase Storage Buckets

Create three buckets in **Supabase Dashboard → Storage**:

| Bucket Name | Public Access | File Size Limit | Allowed MIME Types |
|---|---|---|---|
| `product-images` | Public | 5 MB | `image/*` |
| `avatar-images` | Public | 2 MB | `image/*` |
| `ai-uploads` | Private | 5 MB | `image/*` |

---

## 5. Design System Foundation (Client)

### 5.1 Google Fonts (`app/layout.tsx`)

```typescript
import { Outfit, Inter } from 'next/font/google';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${outfit.variable} ${inter.variable}`}>
      <body className="font-inter antialiased">{children}</body>
    </html>
  );
}
```

### 5.2 Tailwind Config (`tailwind.config.ts`)

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        outfit: ["var(--font-outfit)", "sans-serif"],
        inter: ["var(--font-inter)", "sans-serif"],
      },
      colors: {
        brand: {
          forest: "hsl(164, 86%, 16%)",
          mint:   "hsl(162, 76%, 41%)",
          gold:   "hsl(38,  92%, 50%)",
          coral:  "hsl(343, 85%, 55%)",
        },
        glass: {
          light:       "rgba(255,255,255,0.45)",
          dark:        "rgba(18,30,26,0.65)",
          border:      "rgba(255,255,255,0.18)",
          "border-dk": "rgba(255,255,255,0.07)",
        },
      },
      backdropBlur: { glass: "16px" },
      animation: {
        shimmer:      "shimmer 2.5s infinite linear",
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
        float:        "float 4s ease-in-out infinite",
        "fade-up":    "fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) forwards",
      },
      keyframes: {
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition:  "200% 0" },
        },
        pulseGlow: {
          "0%,100%": { boxShadow: "0 0 15px rgba(16,185,129,0.2)" },
          "50%":     { boxShadow: "0 0 35px rgba(16,185,129,0.6)" },
        },
        float: {
          "0%,100%": { transform: "translateY(0)"    },
          "50%":     { transform: "translateY(-10px)" },
        },
        fadeUp: {
          "0%":   { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)"    },
        },
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(16,185,129,0.08), inset 0 1px 1px 0 rgba(255,255,255,0.15)",
        "glass-lg": "0 16px 48px 0 rgba(16,185,129,0.12)",
      },
    },
  },
  plugins: [],
};
export default config;
```

### 5.3 Global CSS (`globals.css`)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --bg-page: hsl(150, 40%, 97%);
  }
  .dark {
    --bg-page: hsl(164, 30%, 6%);
  }
  body {
    background-color: var(--bg-page);
    background-image:
      radial-gradient(ellipse at 20% 50%, hsl(162,60%,90%,0.35) 0%, transparent 50%),
      radial-gradient(ellipse at 80% 20%, hsl(164,60%,88%,0.25) 0%, transparent 50%);
    min-height: 100vh;
  }
  .dark body {
    background-image:
      radial-gradient(ellipse at 20% 50%, hsl(162,60%,10%,0.5) 0%, transparent 50%),
      radial-gradient(ellipse at 80% 20%, hsl(164,80%,8%,0.4)  0%, transparent 50%);
  }
}

@layer utilities {
  .glass-card {
    background: linear-gradient(135deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.15) 100%);
    backdrop-filter: blur(16px) saturate(180%);
    -webkit-backdrop-filter: blur(16px) saturate(180%);
    border: 1px solid rgba(255,255,255,0.25);
    box-shadow: 0 8px 32px 0 rgba(16,185,129,0.06);
    border-radius: 1rem;
  }
  .dark .glass-card {
    background: linear-gradient(135deg, rgba(18,30,26,0.75) 0%, rgba(10,18,15,0.45) 100%);
    border: 1px solid rgba(255,255,255,0.07);
    box-shadow: 0 8px 32px 0 rgba(0,0,0,0.37);
  }
  .glass-input {
    background: rgba(255,255,255,0.2);
    border: 1px solid rgba(255,255,255,0.3);
    backdrop-filter: blur(8px);
    transition: all 0.3s cubic-bezier(0.16,1,0.3,1);
  }
  .glass-input:focus {
    outline: none;
    border-color: hsl(162,76%,41%);
    box-shadow: 0 0 0 3px rgba(16,185,129,0.15);
  }
  .shimmer-bg {
    background: linear-gradient(90deg,
      rgba(255,255,255,0) 0%,
      rgba(255,255,255,0.4) 50%,
      rgba(255,255,255,0) 100%
    );
    background-size: 200% 100%;
  }
}
```

---

## 6. TypeScript Type Definitions

### `types/product.ts`
```typescript
export interface IProduct {
  id: string;
  name: string;
  scientific_name?: string;
  description: string;
  price: number;
  discount_percentage: number;
  stock_quantity: number;
  category: string;
  is_indoor: boolean;
  difficulty_level: 'beginner' | 'intermediate' | 'expert';
  watering_frequency: string;
  sunlight_requirement: string;
  benefits: string[];
  images: string[];
  rating: number;
  review_count: number;
  is_featured: boolean;
  is_new_arrival: boolean;
  is_best_seller: boolean;
  created_at: string;
}
```

### `types/user.ts`
```typescript
export interface IProfile {
  id: string;
  email: string;
  full_name: string;
  phone_number?: string;
  avatar_url?: string;
  role: 'customer' | 'admin';
  saved_addresses: IAddress[];
  created_at: string;
}

export interface IAddress {
  id: string;
  street_address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
}
```

### `types/order.ts`
```typescript
export interface IOrder {
  id: string;
  user_id: string;
  total_amount: number;
  discount_amount: number;
  shipping_fee: number;
  payment_method: 'cod' | 'dummy_card';
  payment_status: 'pending' | 'completed' | 'failed';
  order_status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shipping_address: IShippingAddress;
  invoice_url?: string;
  created_at: string;
  order_items?: IOrderItem[];
}

export interface IOrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_snapshot: Record<string, unknown>;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface IShippingAddress {
  street: string;
  city: string;
  state: string;
  postal_code: string;
  phone: string;
}
```

### `types/ai.ts`
```typescript
export interface IAIMatchResponse {
  detected_lighting: 'low_light' | 'indirect_light' | 'bright_light';
  detected_space: 'small' | 'medium' | 'spacious';
  detected_environment: 'indoor' | 'outdoor' | 'balcony';
  confidence_score: number;
  reasoning: string;
  recommended_criteria: {
    watering_level: 'low' | 'moderate' | 'high';
    sunlight: string;
    suggested_placement: string;
  };
}

export interface IAILog {
  id: string;
  user_id: string;
  uploaded_image_url: string;
  detected_lighting: string;
  detected_space: string;
  detected_environment: string;
  confidence_score: number;
  recommended_product_ids: string[];
  raw_ai_response: IAIMatchResponse;
  processing_time_ms: number;
  created_at: string;
}
```

---

## 7. Supabase Client Configuration

### `lib/supabase/client.ts` (Browser)
```typescript
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

### `lib/supabase/server.ts` (Server Components / Route Handlers)
```typescript
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
}
```

### `lib/api.ts` (Express API Fetch Wrapper)
```typescript
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { token?: string } = {}
): Promise<T> {
  const { token, ...init } = options;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...init.headers,
  };
  const res = await fetch(`${BASE_URL}${path}`, { ...init, headers });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || 'API request failed');
  }
  return res.json();
}
```

---

## 8. Phase 1 Completion Checklist

- [ ] Root monorepo `package.json` with workspaces configured
- [ ] `.env.example` created with all required variable keys
- [ ] `client/` Next.js 15 app initialized with TypeScript + Tailwind
- [ ] All client npm dependencies installed
- [ ] `shadcn/ui` initialized and core components added
- [ ] `server/` Express app initialized with TypeScript
- [ ] All server npm dependencies installed
- [ ] `tsconfig.json` configured for server
- [ ] Supabase project created and credentials noted
- [ ] Full database DDL executed in Supabase SQL Editor
- [ ] Three storage buckets created with correct access policies
- [ ] RLS policies verified in Supabase Dashboard
- [ ] Tailwind config written with glass design tokens
- [ ] `globals.css` written with glassmorphism utility classes
- [ ] All TypeScript interfaces created in `types/`
- [ ] Supabase browser and server clients configured
- [ ] Express API fetch wrapper created
- [ ] Express entry point boots without errors on `npm run dev:server`
- [ ] Next.js client boots without errors on `npm run dev:client`
