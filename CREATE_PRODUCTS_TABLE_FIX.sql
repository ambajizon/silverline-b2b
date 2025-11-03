-- =============================================
-- FIX OR CREATE PRODUCTS TABLE
-- Step 2: Run this file after categories are created
-- =============================================

-- ============================================
-- 1. CHECK IF PRODUCTS TABLE EXISTS
-- ============================================

-- If products table exists with old structure, we need to fix it
-- If it doesn't exist, we'll create it fresh

DO $$
BEGIN
  -- Check if products table exists
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'products') THEN
    
    RAISE NOTICE 'Products table exists, checking structure...';
    
    -- Add subcategory_id column if it doesn't exist
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'subcategory_id'
    ) THEN
      -- If sub_category_id exists, rename it
      IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'sub_category_id'
      ) THEN
        RAISE NOTICE 'Renaming sub_category_id to subcategory_id...';
        ALTER TABLE public.products RENAME COLUMN sub_category_id TO subcategory_id;
      ELSE
        -- Add new column
        RAISE NOTICE 'Adding subcategory_id column...';
        ALTER TABLE public.products ADD COLUMN subcategory_id UUID;
      END IF;
    END IF;
    
    -- Drop old foreign key constraints
    ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_sub_category_id_fkey;
    ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_subcategory_id_fkey;
    
    -- Add new foreign key to subcategories
    RAISE NOTICE 'Adding foreign key to subcategories...';
    ALTER TABLE public.products 
      ADD CONSTRAINT products_subcategory_id_fkey 
      FOREIGN KEY (subcategory_id) 
      REFERENCES public.subcategories(id) 
      ON DELETE SET NULL;
    
    RAISE NOTICE 'Products table structure fixed!';
    
  ELSE
    
    -- Create fresh products table
    RAISE NOTICE 'Creating new products table...';
    
    CREATE TABLE public.products (
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
    
    RAISE NOTICE 'Products table created!';
    
  END IF;
END $$;

-- ============================================
-- 2. CREATE/UPDATE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_subcategory_id ON public.products(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_products_offer_enabled ON public.products(offer_enabled);
CREATE INDEX IF NOT EXISTS idx_products_name ON public.products(name);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products(created_at DESC);

-- ============================================
-- VERIFICATION
-- ============================================

-- Check products table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'products'
ORDER BY ordinal_position;

-- Check foreign keys
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'products'
  AND tc.table_schema = 'public';

-- =============================================
-- SUCCESS! Products table ready
-- Next: Run CREATE_CATEGORIES_RLS_CORRECT.sql
-- =============================================
