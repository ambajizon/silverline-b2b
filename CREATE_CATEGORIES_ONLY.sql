-- =============================================
-- CREATE CATEGORIES & SUBCATEGORIES ONLY
-- Step 1: Run this file first (no products table)
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
-- VERIFICATION
-- ============================================

-- Check if tables were created
SELECT 
  tablename,
  tableowner
FROM pg_tables
WHERE tablename IN ('categories', 'subcategories')
ORDER BY tablename;

-- Check categories columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'categories'
ORDER BY ordinal_position;

-- Check subcategories columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'subcategories'
ORDER BY ordinal_position;

-- =============================================
-- SUCCESS! Categories and Subcategories created
-- Next: Run CREATE_PRODUCTS_TABLE_FIX.sql
-- =============================================
