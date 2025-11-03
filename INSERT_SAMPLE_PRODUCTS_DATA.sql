-- =============================================
-- INSERT SAMPLE DATA FOR TESTING
-- Categories, Sub-Categories, and Products
-- =============================================

-- ============================================
-- 1. INSERT SAMPLE CATEGORIES
-- ============================================

INSERT INTO public.categories (name, description)
VALUES
  ('Rings', 'Gold and silver rings'),
  ('Necklaces', 'Gold and silver necklaces'),
  ('Bracelets', 'Gold and silver bracelets'),
  ('Earrings', 'Gold and silver earrings'),
  ('Chains', 'Gold and silver chains'),
  ('Pendants', 'Gold and silver pendants')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 2. INSERT SAMPLE SUB-CATEGORIES
-- ============================================

-- Get category IDs
DO $$
DECLARE
  rings_id UUID;
  necklaces_id UUID;
  bracelets_id UUID;
  earrings_id UUID;
BEGIN
  -- Get category IDs
  SELECT id INTO rings_id FROM public.categories WHERE name = 'Rings';
  SELECT id INTO necklaces_id FROM public.categories WHERE name = 'Necklaces';
  SELECT id INTO bracelets_id FROM public.categories WHERE name = 'Bracelets';
  SELECT id INTO earrings_id FROM public.categories WHERE name = 'Earrings';

  -- Insert sub-categories
  INSERT INTO public.sub_categories (category_id, name, description)
  VALUES
    -- Rings
    (rings_id, 'Wedding Rings', 'Traditional wedding rings'),
    (rings_id, 'Engagement Rings', 'Engagement and proposal rings'),
    (rings_id, 'Fashion Rings', 'Modern fashion rings'),
    
    -- Necklaces
    (necklaces_id, 'Long Necklaces', 'Long traditional necklaces'),
    (necklaces_id, 'Short Necklaces', 'Short modern necklaces'),
    (necklaces_id, 'Chokers', 'Choker style necklaces'),
    
    -- Bracelets
    (bracelets_id, 'Bangles', 'Traditional bangles'),
    (bracelets_id, 'Chain Bracelets', 'Modern chain bracelets'),
    
    -- Earrings
    (earrings_id, 'Studs', 'Small stud earrings'),
    (earrings_id, 'Hoops', 'Hoop earrings'),
    (earrings_id, 'Danglers', 'Dangling earrings')
  ON CONFLICT (category_id, name) DO NOTHING;
END $$;

-- ============================================
-- 3. INSERT SAMPLE PRODUCTS
-- ============================================

DO $$
DECLARE
  rings_id UUID;
  necklaces_id UUID;
  wedding_rings_id UUID;
  long_necklaces_id UUID;
BEGIN
  -- Get IDs
  SELECT id INTO rings_id FROM public.categories WHERE name = 'Rings';
  SELECT id INTO necklaces_id FROM public.categories WHERE name = 'Necklaces';
  SELECT id INTO wedding_rings_id FROM public.sub_categories WHERE name = 'Wedding Rings';
  SELECT id INTO long_necklaces_id FROM public.sub_categories WHERE name = 'Long Necklaces';

  -- Insert sample products
  INSERT INTO public.products (
    name,
    description,
    category_id,
    sub_category_id,
    tunch_percentage,
    labor_per_kg,
    weight_ranges,
    images,
    hsn_code,
    status,
    offer_enabled,
    offer_type,
    offer_value,
    offer_text
  )
  VALUES
    -- Product 1: Gold Wedding Ring
    (
      'Classic Gold Wedding Ring',
      'Traditional 22K gold wedding ring with intricate design',
      rings_id,
      wedding_rings_id,
      91.60,
      5000.00,
      '[{"min": 0, "max": 5}, {"min": 5, "max": 10}, {"min": 10, "max": 20}]'::jsonb,
      ARRAY[]::TEXT[],
      '7113',
      'active',
      true,
      'percentage',
      10.00,
      'Festive Season Offer - 10% Off'
    ),
    
    -- Product 2: Gold Necklace
    (
      'Elegant Gold Necklace',
      'Beautiful long gold necklace perfect for weddings',
      necklaces_id,
      long_necklaces_id,
      91.60,
      8000.00,
      '[{"min": 0, "max": 20}, {"min": 20, "max": 50}, {"min": 50, "max": 100}]'::jsonb,
      ARRAY[]::TEXT[],
      '7113',
      'active',
      false,
      NULL,
      NULL,
      NULL
    ),
    
    -- Product 3: Simple Ring (No offer)
    (
      'Simple Daily Wear Ring',
      'Elegant ring for everyday use',
      rings_id,
      NULL,
      91.60,
      3000.00,
      '[{"min": 0, "max": 3}, {"min": 3, "max": 6}]'::jsonb,
      ARRAY[]::TEXT[],
      '7113',
      'active',
      false,
      NULL,
      NULL,
      NULL
    );
END $$;

-- ============================================
-- VERIFICATION
-- ============================================

-- Check categories
SELECT COUNT(*) as category_count FROM public.categories;

-- Check sub-categories
SELECT COUNT(*) as sub_category_count FROM public.sub_categories;

-- Check products
SELECT COUNT(*) as product_count FROM public.products;

-- View sample data
SELECT 
  p.name as product_name,
  c.name as category_name,
  sc.name as sub_category_name,
  p.status,
  p.offer_enabled
FROM public.products p
JOIN public.categories c ON p.category_id = c.id
LEFT JOIN public.sub_categories sc ON p.sub_category_id = sc.id
ORDER BY p.created_at DESC;

-- =============================================
-- SUCCESS! Sample data inserted
-- =============================================
