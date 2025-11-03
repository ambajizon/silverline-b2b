-- =============================================
-- RESET AND CREATE CATEGORIES - CLEAN SLATE
-- ⚠️ WARNING: This will DELETE all existing category/product data!
-- =============================================

-- ============================================
-- STEP 1: DROP ALL EXISTING TABLES
-- ============================================

-- Drop in reverse order (children first, parents last)
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.subcategories CASCADE;
DROP TABLE IF EXISTS public.sub_categories CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;

-- Confirm tables are dropped
SELECT 'All tables dropped' AS status;

-- ============================================
-- STEP 2: CREATE CATEGORIES TABLE
-- ============================================

CREATE TABLE public.categories (
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
CREATE INDEX idx_categories_name ON public.categories(name);
CREATE INDEX idx_categories_slug ON public.categories(slug);
CREATE INDEX idx_categories_display_order ON public.categories(display_order);
CREATE INDEX idx_categories_is_active ON public.categories(is_active);

-- ============================================
-- STEP 3: CREATE SUBCATEGORIES TABLE
-- ============================================

CREATE TABLE public.subcategories (
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
CREATE INDEX idx_subcategories_category_id ON public.subcategories(category_id);
CREATE INDEX idx_subcategories_slug ON public.subcategories(slug);
CREATE INDEX idx_subcategories_display_order ON public.subcategories(display_order);
CREATE INDEX idx_subcategories_is_active ON public.subcategories(is_active);

-- ============================================
-- STEP 4: CREATE PRODUCTS TABLE
-- ============================================

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

-- Create indexes
CREATE INDEX idx_products_category_id ON public.products(category_id);
CREATE INDEX idx_products_subcategory_id ON public.products(subcategory_id);
CREATE INDEX idx_products_status ON public.products(status);
CREATE INDEX idx_products_offer_enabled ON public.products(offer_enabled);
CREATE INDEX idx_products_name ON public.products(name);
CREATE INDEX idx_products_created_at ON public.products(created_at DESC);

-- ============================================
-- STEP 5: ENABLE RLS
-- ============================================

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 6: CREATE RLS POLICIES
-- ============================================

-- Categories Policies
CREATE POLICY "Public can read active categories" ON public.categories FOR SELECT TO public USING (is_active = true);
CREATE POLICY "Authenticated can read all categories" ON public.categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert categories" ON public.categories FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
CREATE POLICY "Admins can update categories" ON public.categories FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')) WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
CREATE POLICY "Admins can delete categories" ON public.categories FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- Subcategories Policies
CREATE POLICY "Public can read active subcategories" ON public.subcategories FOR SELECT TO public USING (is_active = true);
CREATE POLICY "Authenticated can read all subcategories" ON public.subcategories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert subcategories" ON public.subcategories FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
CREATE POLICY "Admins can update subcategories" ON public.subcategories FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')) WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
CREATE POLICY "Admins can delete subcategories" ON public.subcategories FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- Products Policies
CREATE POLICY "Public can read active products" ON public.products FOR SELECT TO public USING (status = 'active');
CREATE POLICY "Authenticated can read all products" ON public.products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert products" ON public.products FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
CREATE POLICY "Admins can update products" ON public.products FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')) WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
CREATE POLICY "Admins can delete products" ON public.products FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- ============================================
-- STEP 7: INSERT SAMPLE DATA
-- ============================================

-- Insert Categories
INSERT INTO public.categories (name, slug, description, display_order, is_active) VALUES
  ('Rings', 'rings', 'Gold and silver rings', 1, true),
  ('Necklaces', 'necklaces', 'Gold and silver necklaces', 2, true),
  ('Bracelets', 'bracelets', 'Gold and silver bracelets', 3, true),
  ('Earrings', 'earrings', 'Gold and silver earrings', 4, true),
  ('Chains', 'chains', 'Gold and silver chains', 5, true),
  ('Pendants', 'pendants', 'Gold and silver pendants', 6, true);

-- Insert Subcategories
DO $$
DECLARE
  rings_id UUID;
  necklaces_id UUID;
  bracelets_id UUID;
  earrings_id UUID;
BEGIN
  SELECT id INTO rings_id FROM public.categories WHERE slug = 'rings';
  SELECT id INTO necklaces_id FROM public.categories WHERE slug = 'necklaces';
  SELECT id INTO bracelets_id FROM public.categories WHERE slug = 'bracelets';
  SELECT id INTO earrings_id FROM public.categories WHERE slug = 'earrings';

  INSERT INTO public.subcategories (category_id, name, slug, description, display_order, is_active) VALUES
    (rings_id, 'Wedding Rings', 'wedding-rings', 'Traditional wedding rings', 1, true),
    (rings_id, 'Engagement Rings', 'engagement-rings', 'Engagement and proposal rings', 2, true),
    (rings_id, 'Fashion Rings', 'fashion-rings', 'Modern fashion rings', 3, true),
    (necklaces_id, 'Long Necklaces', 'long-necklaces', 'Long traditional necklaces', 1, true),
    (necklaces_id, 'Short Necklaces', 'short-necklaces', 'Short modern necklaces', 2, true),
    (necklaces_id, 'Chokers', 'chokers', 'Choker style necklaces', 3, true),
    (bracelets_id, 'Bangles', 'bangles', 'Traditional bangles', 1, true),
    (bracelets_id, 'Chain Bracelets', 'chain-bracelets', 'Modern chain bracelets', 2, true),
    (earrings_id, 'Studs', 'studs', 'Small stud earrings', 1, true),
    (earrings_id, 'Hoops', 'hoops', 'Hoop earrings', 2, true),
    (earrings_id, 'Danglers', 'danglers', 'Dangling earrings', 3, true);
END $$;

-- Insert Sample Products
DO $$
DECLARE
  rings_id UUID;
  necklaces_id UUID;
  wedding_rings_id UUID;
  long_necklaces_id UUID;
BEGIN
  SELECT id INTO rings_id FROM public.categories WHERE slug = 'rings';
  SELECT id INTO necklaces_id FROM public.categories WHERE slug = 'necklaces';
  SELECT id INTO wedding_rings_id FROM public.subcategories WHERE slug = 'wedding-rings';
  SELECT id INTO long_necklaces_id FROM public.subcategories WHERE slug = 'long-necklaces';

  INSERT INTO public.products (name, description, category_id, subcategory_id, tunch_percentage, labor_per_kg, weight_ranges, images, hsn_code, status, offer_enabled, offer_type, offer_value, offer_text) VALUES
    ('Classic Gold Wedding Ring', 'Traditional 22K gold wedding ring', rings_id, wedding_rings_id, 91.60, 5000, '[{"min": 0, "max": 5}, {"min": 5, "max": 10}]'::jsonb, ARRAY[]::TEXT[], '7113', 'active', true, 'percentage', 10.00, '10% Off'),
    ('Elegant Gold Necklace', 'Beautiful long gold necklace', necklaces_id, long_necklaces_id, 91.60, 8000, '[{"min": 0, "max": 20}, {"min": 20, "max": 50}]'::jsonb, ARRAY[]::TEXT[], '7113', 'active', false, NULL, NULL, NULL),
    ('Simple Daily Ring', 'Elegant ring for everyday use', rings_id, NULL, 91.60, 3000, '[{"min": 0, "max": 3}]'::jsonb, ARRAY[]::TEXT[], '7113', 'active', false, NULL, NULL, NULL);
END $$;

-- ============================================
-- VERIFICATION
-- ============================================

SELECT 
  'categories' as table_name, 
  COUNT(*) as row_count 
FROM categories
UNION ALL
SELECT 'subcategories', COUNT(*) FROM subcategories
UNION ALL
SELECT 'products', COUNT(*) FROM products;

-- =============================================
-- ✅ SUCCESS! ALL DONE IN ONE FILE!
-- Tables created: 3
-- RLS policies: 15
-- Sample data: 6 categories, 11 subcategories, 3 products
-- 
-- Now test: Go to /admin/categories
-- =============================================
