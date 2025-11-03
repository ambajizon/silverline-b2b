-- ============================================
-- Categories and Subcategories Tables
-- ============================================

-- 1. Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create subcategories table
CREATE TABLE IF NOT EXISTS public.subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(category_id, slug)
);

-- 3. Add category_id and subcategory_id to products table (if not exists)
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL;

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS subcategory_id UUID REFERENCES public.subcategories(id) ON DELETE SET NULL;

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_active ON public.categories(is_active);
CREATE INDEX IF NOT EXISTS idx_subcategories_category_id ON public.subcategories(category_id);
CREATE INDEX IF NOT EXISTS idx_subcategories_slug ON public.subcategories(slug);
CREATE INDEX IF NOT EXISTS idx_subcategories_active ON public.subcategories(is_active);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_subcategory_id ON public.products(subcategory_id);

-- 5. Enable Row Level Security
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for categories
DROP POLICY IF EXISTS "Anyone can view active categories" ON public.categories;
CREATE POLICY "Anyone can view active categories"
ON public.categories FOR SELECT
TO public
USING (is_active = true);

DROP POLICY IF EXISTS "Authenticated users can view all categories" ON public.categories;
CREATE POLICY "Authenticated users can view all categories"
ON public.categories FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Admins can insert categories" ON public.categories;
CREATE POLICY "Admins can insert categories"
ON public.categories FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

DROP POLICY IF EXISTS "Admins can update categories" ON public.categories;
CREATE POLICY "Admins can update categories"
ON public.categories FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

DROP POLICY IF EXISTS "Admins can delete categories" ON public.categories;
CREATE POLICY "Admins can delete categories"
ON public.categories FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- 7. RLS Policies for subcategories
DROP POLICY IF EXISTS "Anyone can view active subcategories" ON public.subcategories;
CREATE POLICY "Anyone can view active subcategories"
ON public.subcategories FOR SELECT
TO public
USING (is_active = true);

DROP POLICY IF EXISTS "Authenticated users can view all subcategories" ON public.subcategories;
CREATE POLICY "Authenticated users can view all subcategories"
ON public.subcategories FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Admins can insert subcategories" ON public.subcategories;
CREATE POLICY "Admins can insert subcategories"
ON public.subcategories FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

DROP POLICY IF EXISTS "Admins can update subcategories" ON public.subcategories;
CREATE POLICY "Admins can update subcategories"
ON public.subcategories FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

DROP POLICY IF EXISTS "Admins can delete subcategories" ON public.subcategories;
CREATE POLICY "Admins can delete subcategories"
ON public.subcategories FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- 8. Insert sample data (optional)
INSERT INTO public.categories (name, slug, description, display_order) VALUES
('Chains', 'chains', 'Silver chains and necklaces', 1),
('Rings', 'rings', 'Silver rings and bands', 2),
('Bracelets', 'bracelets', 'Silver bracelets and bangles', 3),
('Earrings', 'earrings', 'Silver earrings', 4),
('Pendants', 'pendants', 'Silver pendants and lockets', 5)
ON CONFLICT (slug) DO NOTHING;

-- Get category IDs for subcategories
DO $$
DECLARE
  chains_id UUID;
  rings_id UUID;
  bracelets_id UUID;
BEGIN
  SELECT id INTO chains_id FROM public.categories WHERE slug = 'chains';
  SELECT id INTO rings_id FROM public.categories WHERE slug = 'rings';
  SELECT id INTO bracelets_id FROM public.categories WHERE slug = 'bracelets';

  -- Chains subcategories
  INSERT INTO public.subcategories (category_id, name, slug, display_order) VALUES
  (chains_id, 'Plain Chains', 'plain-chains', 1),
  (chains_id, 'Designer Chains', 'designer-chains', 2),
  (chains_id, 'Box Chains', 'box-chains', 3)
  ON CONFLICT (category_id, slug) DO NOTHING;

  -- Rings subcategories
  INSERT INTO public.subcategories (category_id, name, slug, display_order) VALUES
  (rings_id, 'Wedding Bands', 'wedding-bands', 1),
  (rings_id, 'Fashion Rings', 'fashion-rings', 2),
  (rings_id, 'Stone Rings', 'stone-rings', 3)
  ON CONFLICT (category_id, slug) DO NOTHING;

  -- Bracelets subcategories
  INSERT INTO public.subcategories (category_id, name, slug, display_order) VALUES
  (bracelets_id, 'Chain Bracelets', 'chain-bracelets', 1),
  (bracelets_id, 'Bangles', 'bangles', 2),
  (bracelets_id, 'Charm Bracelets', 'charm-bracelets', 3)
  ON CONFLICT (category_id, slug) DO NOTHING;
END $$;

-- 9. Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Create triggers
DROP TRIGGER IF EXISTS update_categories_updated_at ON public.categories;
CREATE TRIGGER update_categories_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subcategories_updated_at ON public.subcategories;
CREATE TRIGGER update_subcategories_updated_at
BEFORE UPDATE ON public.subcategories
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Verification Queries
-- ============================================

-- Check categories
-- SELECT * FROM public.categories ORDER BY display_order;

-- Check subcategories
-- SELECT 
--   c.name as category,
--   s.name as subcategory,
--   s.is_active
-- FROM public.subcategories s
-- JOIN public.categories c ON s.category_id = c.id
-- ORDER BY c.display_order, s.display_order;

-- Check products with categories
-- SELECT 
--   p.name,
--   c.name as category,
--   s.name as subcategory
-- FROM public.products p
-- LEFT JOIN public.categories c ON p.category_id = c.id
-- LEFT JOIN public.subcategories s ON p.subcategory_id = s.id;
