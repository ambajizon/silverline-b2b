-- =============================================
-- CREATE CATEGORIES & SUBCATEGORIES TABLES
-- ⚠️ USE THIS FILE - Matches your existing UI code
-- =============================================

-- ============================================
-- 1. CREATE CATEGORIES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_categories_name ON public.categories(name);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_display_order ON public.categories(display_order);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON public.categories(is_active);

-- Add comments
COMMENT ON TABLE public.categories IS 'Product categories with ordering and active status';
COMMENT ON COLUMN public.categories.slug IS 'URL-friendly identifier';
COMMENT ON COLUMN public.categories.display_order IS 'Order to display categories (lower = first)';
COMMENT ON COLUMN public.categories.is_active IS 'Whether category is active/visible';

-- ============================================
-- 2. CREATE SUBCATEGORIES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(category_id, slug)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_subcategories_category_id ON public.subcategories(category_id);
CREATE INDEX IF NOT EXISTS idx_subcategories_slug ON public.subcategories(slug);
CREATE INDEX IF NOT EXISTS idx_subcategories_display_order ON public.subcategories(display_order);
CREATE INDEX IF NOT EXISTS idx_subcategories_is_active ON public.subcategories(is_active);

-- Add comments
COMMENT ON TABLE public.subcategories IS 'Subcategories under main categories';
COMMENT ON COLUMN public.subcategories.category_id IS 'Parent category ID';
COMMENT ON COLUMN public.subcategories.slug IS 'URL-friendly identifier';

-- ============================================
-- 3. UPDATE PRODUCTS TABLE (if exists)
-- ============================================

-- If products table exists, update the foreign key to reference subcategories (not sub_categories)
DO $$
BEGIN
  -- Check if products table exists
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'products') THEN
    -- Drop old constraint if it exists
    ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_sub_category_id_fkey;
    
    -- Add new constraint to subcategories
    ALTER TABLE public.products 
      ADD CONSTRAINT products_subcategory_id_fkey 
      FOREIGN KEY (subcategory_id) 
      REFERENCES public.subcategories(id) 
      ON DELETE SET NULL;
      
    -- Rename column if needed (from sub_category_id to subcategory_id)
    IF EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_name = 'products' AND column_name = 'sub_category_id'
    ) THEN
      ALTER TABLE public.products RENAME COLUMN sub_category_id TO subcategory_id;
    END IF;
  END IF;
END $$;

-- ============================================
-- 4. CREATE PRODUCTS TABLE (if doesn't exist)
-- ============================================

CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  subcategory_id UUID REFERENCES public.subcategories(id) ON DELETE SET NULL,
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

-- Create indexes for products (if table was just created)
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_subcategory_id ON public.products(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_products_offer_enabled ON public.products(offer_enabled);
CREATE INDEX IF NOT EXISTS idx_products_name ON public.products(name);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products(created_at DESC);

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check if tables were created
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables
WHERE tablename IN ('categories', 'subcategories', 'products')
ORDER BY tablename;

-- Check all columns in categories
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'categories'
ORDER BY ordinal_position;

-- Check all columns in subcategories
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'subcategories'
ORDER BY ordinal_position;

-- =============================================
-- SUCCESS! Tables created with correct schema
-- Next: Run RLS policies file
-- =============================================
