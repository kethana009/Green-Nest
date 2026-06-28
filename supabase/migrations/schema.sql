-- =============================================
-- GREEN NEST — Complete Database Schema DDL
-- Execute this block in the Supabase SQL Editor
-- =============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- PROFILES (linked to Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    phone_number VARCHAR(20),
    avatar_url TEXT,
    role VARCHAR(50) DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
    saved_addresses JSONB DEFAULT '[]',
    cart_items JSONB DEFAULT '[]',
    ai_runs_today INT DEFAULT 0,
    ai_runs_date DATE DEFAULT CURRENT_DATE,
    ai_daily_limit INT DEFAULT 5,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- PRODUCTS
CREATE TABLE IF NOT EXISTS public.products (
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
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(product_id, user_id)
);

-- WISHLISTS
CREATE TABLE IF NOT EXISTS public.wishlists (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(user_id, product_id)
);

-- ORDERS
CREATE TABLE IF NOT EXISTS public.orders (
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
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_snapshot JSONB NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL
);

-- AI LOGS
CREATE TABLE IF NOT EXISTS public.ai_logs (
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

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
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

-- Reviews: public read, authenticated insert (own), admin all
CREATE POLICY "Allow public read-only access to reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Customers can insert their own reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins have full access to reviews" ON public.reviews FOR ALL USING (
    (SELECT role FROM public.profiles WHERE profiles.id = auth.uid()) = 'admin'
);

-- Wishlists: Users can manage their own wishlist items
CREATE POLICY "Users can manage their own wishlist" ON public.wishlists FOR ALL USING (auth.uid() = user_id);

-- Orders: Customers can view and insert their own, Admins can manage all
CREATE POLICY "Customers can view their own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Customers can insert their own orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all orders" ON public.orders FOR ALL USING (
    (SELECT role FROM public.profiles WHERE profiles.id = auth.uid()) = 'admin'
);

-- Order Items: Customers can view their own order line items via order link, Admins can manage all
CREATE POLICY "Customers can view their own order items" ON public.order_items FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_id AND orders.user_id = auth.uid())
);
CREATE POLICY "Admins can manage all order items" ON public.order_items FOR ALL USING (
    (SELECT role FROM public.profiles WHERE profiles.id = auth.uid()) = 'admin'
);

-- AI Logs: Users can view their own history, Admins can view all logs
CREATE POLICY "Users can view their own AI logs" ON public.ai_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own AI logs" ON public.ai_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can read all AI logs" ON public.ai_logs FOR SELECT USING (
    (SELECT role FROM public.profiles WHERE profiles.id = auth.uid()) = 'admin'
);

-- =============================================
-- STORED PROCEDURES
-- =============================================
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
