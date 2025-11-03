-- =============================================
-- INSERT SAMPLE CATEGORIES & SUBCATEGORIES
-- ⚠️ USE THIS FILE - Includes all required fields
-- =============================================

-- ============================================
-- 1. INSERT SAMPLE CATEGORIES
-- ============================================

INSERT INTO public.categories (name, slug, description, display_order, is_active)
VALUES
  ('Rings', 'rings', 'Gold and silver rings', 1, true),
  ('Necklaces', 'necklaces', 'Gold and silver necklaces', 2, true),
  ('Bracelets', 'bracelets', 'Gold and silver bracelets', 3, true),
  ('Earrings', 'earrings', 'Gold and silver earrings', 4, true),
  ('Chains', 'chains', 'Gold and silver chains', 5, true),
  ('Pendants', 'pendants', 'Gold and silver pendants', 6, true)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- 2. INSERT SAMPLE SUBCATEGORIES
-- ============================================

DO $$
DECLARE
  rings_id UUID;
  necklaces_id UUID;
  bracelets_id UUID;
  earrings_id UUID;
BEGIN
  -- Get category IDs
  SELECT id INTO rings_id FROM public.categories WHERE slug = 'rings';
  SELECT id INTO necklaces_id FROM public.categories WHERE slug = 'necklaces';
  SELECT id INTO bracelets_id FROM public.categories WHERE slug = 'bracelets';
  SELECT id INTO earrings_id FROM public.categories WHERE slug = 'earrings';

  -- Insert subcategories for Rings
  INSERT INTO public.subcategories (category_id, name, slug, description, display_order, is_active)
  VALUES
    (rings_id, 'Wedding Rings', 'wedding-rings', 'Traditional wedding rings', 1, true),
    (rings_id, 'Engagement Rings', 'engagement-rings', 'Engagement and proposal rings', 2, true),
    (rings_id, 'Fashion Rings', 'fashion-rings', 'Modern fashion rings', 3, true)
  ON CONFLICT (category_id, slug) DO NOTHING;

  -- Insert subcategories for Necklaces
  INSERT INTO public.subcategories (category_id, name, slug, description, display_order, is_active)
  VALUES
    (necklaces_id, 'Long Necklaces', 'long-necklaces', 'Long traditional necklaces', 1, true),
    (necklaces_id, 'Short Necklaces', 'short-necklaces', 'Short modern necklaces', 2, true),
    (necklaces_id, 'Chokers', 'chokers', 'Choker style necklaces', 3, true)
  ON CONFLICT (category_id, slug) DO NOTHING;

  -- Insert subcategories for Bracelets
  INSERT INTO public.subcategories (category_id, name, slug, description, display_order, is_active)
  VALUES
    (bracelets_id, 'Bangles', 'bangles', 'Traditional bangles', 1, true),
    (bracelets_id, 'Chain Bracelets', 'chain-bracelets', 'Modern chain bracelets', 2, true)
  ON CONFLICT (category_id, slug) DO NOTHING;

  -- Insert subcategories for Earrings
  INSERT INTO public.subcategories (category_id, name, slug, description, display_order, is_active)
  VALUES
    (earrings_id, 'Studs', 'studs', 'Small stud earrings', 1, true),
    (earrings_id, 'Hoops', 'hoops', 'Hoop earrings', 2, true),
    (earrings_id, 'Danglers', 'danglers', 'Dangling earrings', 3, true)
  ON CONFLICT (category_id, slug) DO NOTHING;
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
  -- Get category and subcategory IDs
  SELECT id INTO rings_id FROM public.categories WHERE slug = 'rings';
  SELECT id INTO necklaces_id FROM public.categories WHERE slug = 'necklaces';
  SELECT id INTO wedding_rings_id FROM public.subcategories WHERE slug = 'wedding-rings';
  SELECT id INTO long_necklaces_id FROM public.subcategories WHERE slug = 'long-necklaces';

  -- Insert sample products
  INSERT INTO public.products (
    name,
    description,
    category_id,
    subcategory_id,
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
      5000,
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
      8000,
      '[{"min": 0, "max": 20}, {"min": 20, "max": 50}, {"min": 50, "max": 100}]'::jsonb,
      ARRAY[]::TEXT[],
      '7113',
      'active',
      false,
      NULL,
      NULL,
      NULL
    ),
    
    -- Product 3: Simple Ring
    (
      'Simple Daily Wear Ring',
      'Elegant ring for everyday use',
      rings_id,
      NULL,
      91.60,
      3000,
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

-- Check categories count
SELECT COUNT(*) as category_count FROM public.categories;

-- Check subcategories count
SELECT COUNT(*) as subcategory_count FROM public.subcategories;

-- Check products count
SELECT COUNT(*) as product_count FROM public.products;

-- View categories with subcategory count
SELECT 
  c.name as category_name,
  c.slug,
  c.display_order,
  c.is_active,
  COUNT(s.id) as subcategory_count
FROM public.categories c
LEFT JOIN public.subcategories s ON s.category_id = c.id
GROUP BY c.id, c.name, c.slug, c.display_order, c.is_active
ORDER BY c.display_order;

-- View all subcategories with their categories
SELECT 
  c.name as category_name,
  s.name as subcategory_name,
  s.slug,
  s.display_order,
  s.is_active
FROM public.subcategories s
JOIN public.categories c ON s.category_id = c.id
ORDER BY c.display_order, s.display_order;

-- View products with categories
SELECT 
  p.name as product_name,
  c.name as category_name,
  s.name as subcategory_name,
  p.status,
  p.offer_enabled
FROM public.products p
JOIN public.categories c ON p.category_id = c.id
LEFT JOIN public.subcategories s ON p.subcategory_id = s.id
ORDER BY p.created_at DESC;

-- =============================================
-- SUCCESS! Sample data inserted
-- 6 categories, 11 subcategories, 3 products
-- =============================================
