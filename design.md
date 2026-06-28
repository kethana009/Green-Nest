# 🌿 Green Nest - System Design & Architectural Blueprint

This document details the software architecture, database design, user interface specifications, and backend API contracts for **Green Nest**, an AI-powered Plant E-Commerce Platform. It is structured to act as an immediate, clear execution guide for an AI development agent.

---

## 1. Executive Design Brief & Design System

Green Nest is a premium, visual-heavy application. The design concept is **"Nature through a Glass Lens"** (Glassmorphism), combining organic plant imagery, vibrant nature-themed gradients, and frosted glass interfaces to create a premium, modern, and immersive user experience.

### 1.1 Color Palette (HSL & RGB)
To create a rich aesthetic, the color palette uses carefully calibrated HSL values to ensure harmony in both light and dark modes:

| Color Token | Light Mode Value | Dark Mode Value | Tailwind Class Equivalent | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Primary (Forest)** | `hsl(164, 86%, 16%)` | `hsl(150, 76%, 35%)` | `emerald-800` / `emerald-500` | Accent elements, primary CTA states, active status. |
| **Secondary (Mint)** | `hsl(162, 76%, 41%)` | `hsl(162, 70%, 50%)` | `emerald-600` / `emerald-400` | Accent headers, focus states, interactive items. |
| **Accent (Gold)** | `hsl(38, 92%, 50%)` | `hsl(45, 93%, 47%)` | `amber-500` / `amber-400` | Warning, Care Alerts, Best Seller tags, Star ratings. |
| **Accent (Coral)** | `hsl(343, 85%, 55%)` | `hsl(343, 90%, 60%)` | `rose-500` | Heart/Wishlist icon, Low Stock alerts, errors. |
| **Base Glass BG** | `rgba(255, 255, 255, 0.45)` | `rgba(18, 30, 26, 0.65)` | `bg-white/45` / `bg-emerald-950/65` | Main container glassmorphic background card fill. |
| **Border Glass** | `rgba(255, 255, 255, 0.3)` | `rgba(255, 255, 255, 0.08)` | `border-white/30` / `border-white/8` | Frosty edge highlight. |
| **Text Primary** | `hsl(168, 44%, 10%)` | `hsl(0, 0%, 98%)` | `text-slate-900` / `text-slate-50` | Body copy, section headers. |
| **Text Secondary** | `hsl(168, 15%, 35%)` | `hsl(168, 10%, 75%)` | `text-slate-600` / `text-slate-300` | Labels, scientific names, descriptions. |

### 1.2 Glassmorphism Core Specs
All UI panels, cards, and modal components must strictly inherit these properties:
*   **Backdrop Filter:** `backdrop-filter: blur(16px) saturate(180%);`
*   **Background Blend:** Translucent color overlays matching light/dark states.
*   **Borders:** `1px solid` with slight opacity variance (`0.1` to `0.3`) and standard border radius (`rounded-2xl` / `1rem`).
*   **Shadows:** Ambient offset shadow combined with a inner white glow to emphasize height and glossiness:
    ```css
    box-shadow: 
      0 8px 32px 0 rgba(16, 185, 129, 0.08), 
      inset 0 1px 1px 0 rgba(255, 255, 255, 0.15);
    ```

### 1.3 Typography
*   **Primary Headings:** `Outfit` (sans-serif) - clean, rounded, matches natural curves.
*   **Body & Interfaces:** `Inter` (sans-serif) - highly readable, professional tabular sizing.

---

## 2. System Architecture & Folder Directory

The application splits concern into a **Next.js 15 Frontend Client** and a **Node.js/Express.js Backend Server API**, utilizing a unified **Supabase** backend for authentication, relational queries, and file storage.

### 2.1 Workspace Structure
```
green-nest/
├── client/                      # Next.js App Router Frontend
│   ├── public/                  # Static assets (logos, placeholder SVGs)
│   ├── src/
│   │   ├── app/                 # Next.js Pages & Route Handlers
│   │   │   ├── (auth)/          # Registration, Login, Forgot Password
│   │   │   ├── (customer)/      # Main customer routes
│   │   │   │   ├── page.tsx     # Hero banner, featured listings, filters
│   │   │   │   ├── match/       # Plant Match AI page
│   │   │   │   ├── product/[id]/# Product Details view
│   │   │   │   ├── cart/        # Shopping Cart summary
│   │   │   │   ├── checkout/    # Checkout, COD, dummy payment gateway
│   │   │   │   └── profile/     # Saved addresses, AI history, orders
│   │   │   ├── (admin)/         # Admin dashboard routes
│   │   │   │   ├── layout.tsx   # Sidebar Navigation & Stats banner
│   │   │   │   ├── dashboard/   # High level business analytics, charts
│   │   │   │   ├── products/    # Product inventory table, edit modals
│   │   │   │   ├── orders/      # Orders queue, invoice generators
│   │   │   │   ├── customers/   # Purchase logs, profiles, AI limits
│   │   │   │   └── logs/        # AI upload logs viewer
│   │   │   ├── layout.tsx       # Global wrappers (Auth context, Toast providers)
│   │   │   └── globals.css      # Core tailwind setup & custom glassmorphism keyframes
│   │   ├── components/          # Reusable component library
│   │   │   ├── ui/              # shadcn UI components (button, card, dialog, input)
│   │   │   ├── glass/           # Glassmorphic containers & glowing cards
│   │   │   ├── navbar.tsx       # Customer Header (glassmorphic sticky nav)
│   │   │   ├── product-card.tsx # Animated plant card with wishlist trigger
│   │   │   └── recharts-visuals.tsx # custom wrappers for Recharts components
│   │   ├── hooks/               # Custom hooks (useCart, useAuth, useTheme)
│   │   ├── lib/                 # Utilities (supabase client config, api fetch helpers)
│   │   └── types/               # Type declarations (TypeScript models)
│   ├── tailwind.config.ts       # Glass theme configurations & animation curves
│   └── package.json
│
├── server/                      # Node.js + Express Backend API
│   ├── src/
│   │   ├── config/              # Supabase server configs, environments
│   │   ├── controllers/         # Request logic handlers
│   │   │   ├── product.controller.ts
│   │   │   ├── order.controller.ts
│   │   │   ├── ai.controller.ts
│   │   │   └── admin.controller.ts
│   │   ├── middleware/          # JWT, Role authorization, multer image buffers
│   │   ├── routes/              # Express Router mapping
│   │   ├── services/            # OpenAI/Gemini Vision API integration service
│   │   └── index.ts             # Main entry point
│   ├── package.json
│   └── tsconfig.json
```

---

## 3. Database Schema (Supabase PostgreSQL DDL)

Execute the following DDL script in your Supabase SQL Editor. This includes Table creation, Foreign Key relationships, and Row Level Security (RLS) configurations.

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS PROFILE TABLE (Linked to Supabase Auth.users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    avatar_url TEXT,
    role VARCHAR(50) DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. PRODUCTS TABLE
CREATE TABLE public.products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    scientific_name VARCHAR(255),
    description TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    discount_percentage INT DEFAULT 0 CHECK (discount_percentage BETWEEN 0 AND 100),
    stock_quantity INT DEFAULT 0 CHECK (stock_quantity >= 0),
    category VARCHAR(100) NOT NULL,
    is_indoor BOOLEAN DEFAULT TRUE,
    difficulty_level VARCHAR(50) CHECK (difficulty_level IN ('beginner', 'intermediate', 'expert')),
    watering_frequency VARCHAR(100), -- e.g., "Once a week"
    sunlight_requirement VARCHAR(100), -- e.g., "Bright indirect light"
    benefits TEXT[], -- e.g., '{"Air Purifying", "Low Maintenance"}'
    images TEXT[] NOT NULL, -- URLs from Supabase Storage bucket 'product-images'
    rating DECIMAL(3, 2) DEFAULT 0.0 CHECK (rating BETWEEN 0.0 AND 5.0),
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. WISHLIST TABLE
CREATE TABLE public.wishlists (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, product_id)
);

-- 4. ORDERS TABLE
CREATE TABLE public.orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    discount_amount DECIMAL(10, 2) DEFAULT 0.00,
    shipping_fee DECIMAL(10, 2) DEFAULT 0.00,
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('cod', 'dummy_card')),
    payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed')),
    order_status VARCHAR(50) DEFAULT 'pending' CHECK (order_status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
    shipping_address JSONB NOT NULL, -- Structure: { street, city, postal_code, phone }
    invoice_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. ORDER ITEMS TABLE
CREATE TABLE public.order_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL
);

-- 6. AI RECOMMENDATIONS LOG TABLE
CREATE TABLE public.ai_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    uploaded_image_url TEXT NOT NULL, -- URL from Supabase Storage bucket 'ai-uploads'
    detected_lighting VARCHAR(100),
    detected_space VARCHAR(100),
    detected_environment VARCHAR(100),
    confidence_score DECIMAL(5, 2) CHECK (confidence_score BETWEEN 0.0 AND 100.0),
    recommended_product_ids UUID[], -- Array of matching UUIDs in the products table
    raw_ai_response JSONB,
    processing_time_ms INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Automatic Profile Creation Trigger on Sign Up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', 'Plant Lover'),
        new.raw_user_meta_data->>'avatar_url',
        'customer'
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_logs ENABLE ROW LEVEL SECURITY;

-- Products: Everyone can read, Admins can write
CREATE POLICY "Allow public read-only access to products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Admins have full access to products" ON public.products FOR ALL USING (
    (SELECT role FROM public.profiles WHERE profiles.id = auth.uid()) = 'admin'
);

-- Profiles: Users can edit their own profiles, Admins can read all
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can read their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (
    (SELECT role FROM public.profiles WHERE profiles.id = auth.uid()) = 'admin'
);

-- Orders: Customers can view and insert their own, Admins can manage all
CREATE POLICY "Customers can view their own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Customers can insert their own orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all orders" ON public.orders FOR ALL USING (
    (SELECT role FROM public.profiles WHERE profiles.id = auth.uid()) = 'admin'
);

-- AI Logs: Users can view their own history, Admins can view all logs
CREATE POLICY "Users can view their own AI logs" ON public.ai_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own AI logs" ON public.ai_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can read all AI logs" ON public.ai_logs FOR SELECT USING (
    (SELECT role FROM public.profiles WHERE profiles.id = auth.uid()) = 'admin'
);
```

---

## 4. Visual & Styling Implementation Specs

### 4.1 Tailwind Extensions (`tailwind.config.ts`)
Inject these custom values into Tailwind to implement Glassmorphism and UI animations seamlessly:
```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  theme: {
    extend: {
      colors: {
        glass: {
          light: "rgba(255, 255, 255, 0.45)",
          dark: "rgba(18, 30, 26, 0.65)",
          border: "rgba(255, 255, 255, 0.12)",
          "border-dark": "rgba(255, 255, 255, 0.05)"
        },
        brand: {
          forest: "hsl(164, 86%, 16%)",
          mint: "hsl(162, 76%, 41%)",
          gold: "hsl(38, 92%, 50%)",
          coral: "hsl(343, 85%, 55%)"
        }
      },
      backdropBlur: {
        xs: "2px",
        glass: "16px"
      },
      animation: {
        "shimmer": "shimmer 2.5s infinite linear",
        "pulse-glow": "pulseGlow 2s infinite ease-in-out",
        "float": "float 4s ease-in-out infinite",
        "fade-in-up": "fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards"
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" }
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 15px rgba(16, 185, 129, 0.2)" },
          "50%": { boxShadow: "0 0 35px rgba(16, 185, 129, 0.6)" }
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" }
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        }
      }
    }
  }
};
export default config;
```

### 4.2 Utility Classes in CSS (`globals.css`)
```css
@layer utilities {
  .glass-card {
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.45) 0%, rgba(255, 255, 255, 0.15) 100%);
    backdrop-filter: blur(16px) saturate(180%);
    -webkit-backdrop-filter: blur(16px) saturate(180%);
    border: 1px solid rgba(255, 255, 255, 0.25);
    box-shadow: 0 8px 32px 0 rgba(16, 185, 129, 0.06);
  }

  .dark .glass-card {
    background: linear-gradient(135deg, rgba(18, 30, 26, 0.75) 0%, rgba(10, 18, 15, 0.45) 100%);
    backdrop-filter: blur(16px) saturate(180%);
    border: 1px solid rgba(255, 255, 255, 0.07);
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
  }
  
  .glass-input {
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.3);
    backdrop-filter: blur(8px);
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }
  
  .dark .glass-input {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .glass-input:focus {
    outline: none;
    border-color: hsl(162, 76%, 41%);
    box-shadow: 0 0 10px rgba(16, 185, 129, 0.25);
  }
}
```

---

## 5. Component & Page Blueprint: Customer Module

### 5.1 Home / Product Catalog (`(customer)/page.tsx`)
A dynamic UI that introduces the product catalog, filtering panel, and search function.

#### Visual Layout Wireframe
```
+---------------------------------------------------------------------------------+
|  Logo [🌿 Green Nest]       Search (Plant name, benefits...)     Cart(3) Profile |
+---------------------------------------------------------------------------------+
|                                                                                 |
|   [HERO BANNER - Smooth Animated Organic SVG Blob Background in Motion]         |
|   "Discover Your Perfect Living Space Companion"                                |
|   [ Try Plant Match AI - Glowing Button ]                                       |
|                                                                                 |
+---------------------------------------------------------------------------------+
|   Filters: [Category: All V]  [Difficulty: Easy X]  [Indoor V]  Price Range: === |
+---------------------------------------------------------------------------------+
|   Product Catalog Grid                                                          |
|   +-------------------+  +-------------------+  +-------------------+           |
|   | [Glassmorphic Card|  | [Glassmorphic Card|  | [Glassmorphic Card|           |
|   |   Plant Image     |  |   Plant Image     |  |   Plant Image     |           |
|   |   Monstera Del.   |  |   Snake Plant     |  |   Calathea        |           |
|   |   $35.00   [+]Cart|  |   $22.00   [+]Cart|  |   $28.00   [+]Cart|           |
|   +-------------------+  +-------------------+  +-------------------+           |
+---------------------------------------------------------------------------------+
```

#### Framer Motion Micro-Animations
*   **Card Entry:** Cascading list animation (`staggerChildren` delay 0.05s). Each product card fades and slides upward using dynamic easing.
*   **Card Hover:** Smooth scaling up (`scale: 1.03`), glowing borders, and the "Quick View" icon overlay sliding in from the bottom.
*   **Wishlist Heart Toggle:** Bouncy pulse animation on click (`scale: [1, 1.4, 0.9, 1.1, 1]`) using Framer Motion transition config:
    ```typescript
    animate={{ scale: isLiked ? [1, 1.4, 0.9, 1.1, 1] : 1 }}
    transition={{ duration: 0.4 }}
    ```

---

### 5.2 Plant Match AI (`(customer)/match/page.tsx`)
The centerpiece of the platform, structured as an interactive multi-step wizard using glass panels.

#### Step-by-Step Interactive Form State
1.  **Dropzone Panel:** Glass container with a dotted border (`border-dashed`). File upload interaction triggers a floating upward arrow animation.
2.  **Analysis Phase:** A skeleton glass container with horizontal sliding shimmer overlays (`animate-shimmer`), representing progress:
    *   *Step 1:* Parsing light levels (lux detection mockup).
    *   *Step 2:* Calculating spatial boundaries.
    *   *Step 3:* Evaluating estimated moisture rates.
3.  **Result Layout:** Split-screen format.
    *   *Left Side:* The user's uploaded image with bounding boxes highlighting "Light Source Detected" (window) or "Indoor Setup".
    *   *Right Side:* An interactive glass recommendations dashboard.

#### UI Mockup: Recommendation Dashboard
```
+-----------------------------------------------------------------------------------+
|  [Uploaded Room Photo]              Detected Environment:                         |
|  +---------------------------+      - Light: Bright Indirect (High Confidence)    |
|  |                           |      - Available Space: Medium Floor               |
|  |   (Detected Window)       |      - Environment: Indoor Room                    |
|  |   [   Bounding Box   ]    |                                                    |
|  +---------------------------+      AI Recommendation Score: 96% Match ✅         |
+-----------------------------------------------------------------------------------+
|  Suggested Companions for Your Environment:                                       |
|                                                                                   |
|  [MONSTERA DELICIOSA] - 96% Match                                                 |
|  +-----------------------------+                                                  |
|  | Care Difficulty: Beginner   |  Watering: Once every 7-10 days                  |
|  | Placement: 3ft from Window  |  Lighting Needed: Moderate Light                 |
|  +-----------------------------+                                                  |
|  [ Add Match to Cart - $32.00 ]                                                   |
+-----------------------------------------------------------------------------------+
```

---

### 5.3 Product Details (`(customer)/product/[id]/page.tsx`)
Provides detail regarding the care instructions and scientific properties of each plant.

#### Core Design Elements
*   **Image Gallery:** Left pane containing a large glass frame with smooth swipe animations for alternate angles.
*   **Scientific Tagging:** Display scientific name in italics next to a leaf emoji badge (`🧬 Monstera deliciosa`).
*   **Visual Care Timeline:** A customized progress bar visual mapping the plant's watering schedule:
    *   `[-- Wet --|-- Damp --|-- Dry --|-- Water Now --]`
*   **Dynamic Tabs:** Modern glass tabs (Overview, Care Guidelines, Reviews) switching content pages with Framer Motion Layout animations.

---

### 5.4 Checkout & Dummy Payment Gateways (`(customer)/checkout/page.tsx`)

#### Visual Card Simulator
*   An animated glass credit card component representing card values typed in real-time.
*   Uses Framer Motion to flip the card 180 degrees (`rotateY: 180`) when the user moves focus to the CVV input field.
*   Input values overlay the card with a typing-effect transition.

```
       +---------------------------------------------+
       |  🌿 GREEN NEST CARD         [VISA Logo]     |
       |                                             |
       |  **** **** **** 1234                        |
       |                                             |
       |  VALERIE PENTHOUSE               09 / 30    |
       +---------------------------------------------+
```

*   **Cash on Delivery:** Toggle option inside the payment tabs. Selecting COD flips the credit card graphic out of view and replaces it with a package delivery cartoon path animation.

---

## 6. Component & Page Blueprint: Admin Dashboard

The Admin Dashboard is dark-themed by default to create a high-tech console feel, using translucent colors to overlay deep emerald background nodes.

### 6.1 Admin Home Overview (`(admin)/dashboard/page.tsx`)

#### Key Performance Indicator (KPI) Cards
A grid of 4 cards implementing HSL glowing border animations:
*   **Total Revenue:** (Forest outline, green line sparkline chart)
*   **Total Orders:** (Indigo glow)
*   **Total Users:** (Mint glow)
*   **AI Match Requests:** (Electric violet pulse glow)

#### Interactive Recharts Visualizations
*   **Revenue Reports:** Double-line chart graphing "Total Sales" and "Refund Rates" over time.
    *   *Styling:* Pure HSL line nodes with a gradient area underneath (`stopColor="hsl(162, 76%, 41%)"`).
    *   *Tooltip:* Custom Glassmorphic hover overlay rendering dynamic parameters, avoiding standard browser styling.
*   **Product Performance Matrix:** A scatter/bubble chart mapping "Stock Quantity" against "Product Popularity Score".
*   **AI Usage Gauge:** Circle progress ring visualizing API queries compared to monthly rate caps.

```
+-----------------------------------------------------------------------------------+
|  [ KPI: Revenue ]   [ KPI: Orders ]     [ KPI: Users ]      [ KPI: AI Matches ]   |
|   $24,530.00         1,204               892                 412                  |
+-----------------------------------------------------------------------------------+
|  SALES PERFORMANCE HISTORY (Line Area Chart)                                      |
|  $30k |                                     ..----*-..                            |
|  $20k |                               ..---*          *-..                        |
|  $10k |                         ..--**                    *--.                    |
|   $0k +-------------------------*-----------------------------*------------------ |
|       Jan                       Apr                           Dec                 |
+-----------------------------------------------------------------------------------+
|  LOW INVENTORY ALERT                                                              |
|  [⚠️ Low Stock] Fiddle Leaf Fig (2 Remaining) - [Reorder Now Button]              |
+-----------------------------------------------------------------------------------+
```

### 6.2 AI logs Viewer (`(admin)/logs/page.tsx`)
A grid displaying the image inputs and recommendation outputs generated by the AI matching system.

#### Log Row Details
*   **Thumbnail:** 40x40 pixel preview image with absolute-positioned hover zoom triggers.
*   **User info:** Linking to the customer profile.
*   **Logs Query Dialog:** Clicking a row opens a glassmorphic Popover detailing the exact JSON payloads sent to and received from the OpenAI/Gemini Vision API (confidence tags, identified objects, query latency).

---

## 7. Backend API & AI Engine Integration

The backend is built in Node.js & Express.js. All endpoints are fully typed using TypeScript interfaces.

### 7.1 Key TypeScript Interfaces

```typescript
// Product Definition
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
  is_featured: boolean;
  created_at: string;
}

// AI Match Request Response Payload
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
```

### 7.2 REST API Routes Configuration

#### Authentication & Profiles (`/api/auth`)
*   `POST /api/auth/register` - Create user profile and generate authentication tokens.
*   `POST /api/auth/login` - Verify user credentials, return JWT.
*   `GET /api/auth/me` - Fetch profile metadata matching authenticated token.

#### Products Inventory API (`/api/products`)
*   `GET /api/products` - Query plant catalog. *Parameters:* `search`, `category`, `difficulty`, `indoor`, `min_price`, `max_price`.
*   `GET /api/products/:id` - Fetch single product record.
*   `POST /api/products` - Admin only. Create product item, upload image array.
*   `PUT /api/products/:id` - Admin only. Modify parameters or replenish stock.
*   `DELETE /api/products/:id` - Admin only. Remove plant from catalog.

#### Orders & Billing API (`/api/orders`)
*   `POST /api/orders` - Process checkout cart. Validates quantities, processes transaction method, inserts order lines, decrements inventory stock.
*   `GET /api/orders/my-orders` - Fetch authenticated customer order status list.
*   `GET /api/orders/:id/invoice` - Render PDF Invoice for printing.
*   `PUT /api/orders/:id/status` - Admin only. Update shipment status (`pending` -> `processing` -> `shipped` -> `delivered`).

---

### 7.3 AI Engine Integration (Gemini / OpenAI Vision API)

The backend exposes `POST /api/ai/match`. It handles image upload buffers, executes Vision queries, matches details against database items, and saves results to the AI logs.

#### API Route: `POST /api/ai/match`
*   **Request Type:** `multipart/form-data`
*   **Payload:** `{ room_image: File }`
*   **Authorization:** Bearer JWT required.

#### Service Execution Flow
1.  Verify authentication token and query rate limits for the user.
2.  Store image payload in Supabase Storage Bucket `ai-uploads`. Get public URL.
3.  Transmit public image URL or Base64 binary to OpenAI GPT-4o-mini / Google Gemini Flash Vision API.
4.  Use System Prompts to ensure response formats comply with a strict JSON layout:

```
[SYSTEM PROMPT]
Analyze the provided room/setup image. Identify:
1. Lighting conditions (low_light, indirect_light, bright_light)
2. Spatial limits (small, medium, spacious)
3. Location type (indoor, outdoor, balcony)
Calculate a confidence percentage for your evaluation.
Provide your response strictly in the following JSON format:
{
  "detected_lighting": "indirect_light",
  "detected_space": "medium",
  "detected_environment": "indoor",
  "confidence_score": 92.5,
  "reasoning": "A clean living room setup with large windows to the left providing bright indirect light, suitable for tropical plants.",
  "recommended_criteria": {
    "watering_level": "moderate",
    "sunlight": "Bright indirect light",
    "suggested_placement": "Position on a shelf or plant stand 3-5 feet from the window."
  }
}
```

5.  Receive JSON analysis from the Vision API.
6.  **Database Query (Matching Engine):** Map recommendations against database plants:
    ```sql
    -- Matching Strategy
    SELECT id, name, price FROM products
    WHERE is_indoor = (CASE WHEN detected_environment = 'indoor' THEN true ELSE false END)
      AND (
        difficulty_level = 'beginner'
        OR sunlight_requirement ILIKE '%' || recommended_criteria->>'sunlight' || '%'
      )
      AND stock_quantity > 0
    LIMIT 4;
    ```
7.  Write analytics log parameters to `public.ai_logs`.
8.  Return matches payload to user:
    ```json
    {
      "log_id": "ai-log-uuid",
      "analysis": { "detected_lighting": "...", "confidence_score": 95.0 },
      "recommended_plants": [
        { "id": "uuid", "name": "Monstera", "price": 32.00, "match_confidence": 96 }
      ]
    }
    ```

---

## 8. Step-by-Step Implementation Guide for the Development Agent

Your development agent should build the platform in this specific order to ensure structural logic is sound:

### Step 1: Database Setup (Supabase)
*   Initialize Supabase database schema by executing the SQL in **Section 3**.
*   Setup three Storage Buckets and set their policies to Public Read:
    *   `product-images`
    *   `avatar-images`
    *   `ai-uploads`

### Step 2: Backend Node/Express Server Implementation
*   Setup Express with TypeScript, configure error middleware and multer image handling.
*   Implement JWT verification with Supabase user checks.
*   Implement the AI Service connector in `src/services/ai.service.ts` matching the Vision prompt contracts.
*   Complete endpoints: `/api/products` (CRUD), `/api/orders` (COD/payment logic), `/api/ai/match` (vision parser).

### Step 3: Frontend Client Infrastructure
*   Initialize Next.js 15 App with TypeScript and Tailwind CSS.
*   Install Shadcn UI CLI elements and Framer Motion packages.
*   Configure Custom HSL themes and animations in `tailwind.config.ts` and `globals.css` (using parameters in **Section 4**).

### Step 4: UI Development (Customer Views)
*   **Navigation:** Create the sticky glassmorphic Navigation header with notifications and cart count.
*   **Catalog:** Build `(customer)/page.tsx` displaying card animations and interactive search filters.
*   **Plant Match Wizard:** Build `(customer)/match/page.tsx` managing file selection, loading skeletons, and interactive results layout.
*   **Details & Checkout:** Construct details page tabs and the credit card flipping layout.

### Step 5: UI Development (Admin Controls)
*   Construct dashboard page displaying Recharts layouts customized with frosted tooltips.
*   Create Product CRUD forms with Drag-and-Drop photo uploaders.
*   Build AI Log row lists detailing log payloads inside Popovers.
