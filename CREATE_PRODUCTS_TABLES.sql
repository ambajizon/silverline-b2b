-- =============================================
-- CREATE PRODUCTS DATABASE TABLES
-- Categories, Sub-Categories, and Products
-- =============================================

-- ============================================
-- 1. CREATE CATEGORIES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_categories_name ON public.categories(name);

-- Add comments
COMMENT ON TABLE public.categories IS 'Product categories (e.g., Rings, Necklaces, Bracelets)';
COMMENT ON COLUMN public.categories.name IS 'Category name - must be unique';

-- ============================================
-- 2. CREATE SUB-CATEGORIES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.sub_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(category_id, name)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_sub_categories_category_id ON public.sub_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_sub_categories_name ON public.sub_categories(name);

-- Add comments
COMMENT ON TABLE public.sub_categories IS 'Product sub-categories under main categories';
COMMENT ON COLUMN public.sub_categories.category_id IS 'Parent category ID';

-- ============================================
-- 3. CREATE PRODUCTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  sub_category_id UUID REFERENCES public.sub_categories(id) ON DELETE SET NULL,
  tunch_percentage DECIMAL(5, 2) NOT NULL DEFAULT 0 CHECK (tunch_percentage >= 0 AND tunch_percentage <= 100),
  labor_per_kg INTEGER NOT NULL DEFAULT 0 CHECK (labor_per_kg >= 0),
  weight_ranges JSONB DEFAULT '[]'::jsonb,
  images TEXT[] DEFAULT ARRAY[]::TEXT[],
  hsn_code TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  offer_enabled BOOLEAN DEFAULT FALSE,
  offer_type TEXT CHECK (offer_type IN ('percentage', 'fixed')),
  offer_value DECIMAL(10, 2) CHECK (offer_value >= 0),
  offer_text TEXT,
  offer_valid_from TIMESTAMPTZ,
  offer_valid_till TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_sub_category_id ON public.products(sub_category_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_products_offer_enabled ON public.products(offer_enabled);
CREATE INDEX IF NOT EXISTS idx_products_name ON public.products(name);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products(created_at DESC);

-- Add comments
COMMENT ON TABLE public.products IS 'Products catalog with pricing, offers, and specifications';
COMMENT ON COLUMN public.products.tunch_percentage IS 'Purity percentage (0-100)';
COMMENT ON COLUMN public.products.labor_per_kg IS 'Labor charges per kilogram in rupees';
COMMENT ON COLUMN public.products.weight_ranges IS 'JSON array of weight ranges: [{"min": 0, "max": 10}, ...]';
COMMENT ON COLUMN public.products.images IS 'Array of image URLs from product-images bucket';
COMMENT ON COLUMN public.products.hsn_code IS 'HSN code for GST compliance';
COMMENT ON COLUMN public.products.status IS 'Product status: active or inactive';
COMMENT ON COLUMN public.products.offer_enabled IS 'Whether product has an active offer';
COMMENT ON COLUMN public.products.offer_type IS 'Offer type: percentage or fixed amount';
COMMENT ON COLUMN public.products.offer_value IS 'Offer value (percentage or rupees)';

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check if tables were created
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables
WHERE tablename IN ('categories', 'sub_categories', 'products')
ORDER BY tablename;

-- Check all indexes
SELECT 
  schemaname,
  tablename,
  indexname
FROM pg_indexes
WHERE tablename IN ('categories', 'sub_categories', 'products')
ORDER BY tablename, indexname;

-- =============================================
-- SUCCESS! Tables created
-- Next: Run RLS policies file
-- =============================================
