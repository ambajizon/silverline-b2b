# Products Database Rebuild - Complete Guide

## 📋 Overview
This guide will help you rebuild the products database and implement server-side functionality. Your UI is already perfect! Just need database tables and server actions.

---

## 🎯 What You Have vs What You Need

### ✅ What You Already Have
1. **UI Components** - All admin and reseller product pages
2. **Type Definitions** - `types/products.ts` with all interfaces
3. **Form Validation** - Zod schemas in `lib/validations/product.ts`
4. **Storage Bucket** - `product-images` bucket created (PUBLIC)
5. **Storage Policy** - Already added to bucket

### ❌ What Was Lost (Need to Rebuild)
1. **Database Tables** - categories, sub_categories, products
2. **RLS Policies** - Row Level Security on all tables
3. **Server Actions** - CRUD operations for products
4. **Additional Storage Policies** - For upload/delete by admins

---

## 🗄️ Database Structure

### Tables to Create
```
categories
  ├── id (UUID)
  ├── name (TEXT, UNIQUE)
  ├── description (TEXT)
  └── timestamps

sub_categories
  ├── id (UUID)
  ├── category_id (FK → categories)
  ├── name (TEXT)
  ├── description (TEXT)
  └── timestamps

products
  ├── id (UUID)
  ├── name (TEXT)
  ├── description (TEXT)
  ├── category_id (FK → categories)
  ├── sub_category_id (FK → sub_categories)
  ├── tunch_percentage (DECIMAL)
  ├── labor_per_kg (DECIMAL)
  ├── weight_ranges (JSONB array)
  ├── images (TEXT[] array)
  ├── hsn_code (TEXT)
  ├── status ('active'|'inactive')
  ├── offer fields (enabled, type, value, text, dates)
  └── timestamps
```

---

## 🚀 STEP-BY-STEP INSTRUCTIONS

### STEP 1: Run SQL Files in Supabase

I've created 4 SQL files for you. Run them **in order**:

#### 1.1 Create Tables
**File**: `CREATE_PRODUCTS_TABLES.sql`

1. Open **Supabase Dashboard** → **SQL Editor**
2. Click **"New Query"**
3. Copy content from `CREATE_PRODUCTS_TABLES.sql`
4. Paste and click **"Run"**
5. ✅ Should see: "Success. No rows returned"

**What this does**:
- Creates `categories` table
- Creates `sub_categories` table
- Creates `products` table
- Adds indexes for performance
- Adds helpful comments

---

#### 1.2 Create RLS Policies
**File**: `CREATE_PRODUCTS_RLS_POLICIES.sql`

1. Click **"New Query"**
2. Copy content from `CREATE_PRODUCTS_RLS_POLICIES.sql`
3. Paste and click **"Run"**
4. ✅ Should see: List of policies created

**What this does**:
- Enables RLS on all 3 tables
- Creates 5 policies per table (15 total)
- **Permissions**:
  - Anyone can READ categories/products
  - Only admins can CREATE/UPDATE/DELETE

---

#### 1.3 Create Storage Policies
**File**: `CREATE_STORAGE_POLICIES.sql`

1. Click **"New Query"**
2. Copy content from `CREATE_STORAGE_POLICIES.sql`
3. Paste and click **"Run"**
4. ✅ Should see: Success

**What this does**:
- Adds policies for `product-images` bucket
- **Permissions**:
  - Anyone can VIEW images
  - Only admins can UPLOAD/DELETE images

---

#### 1.4 Insert Sample Data (Optional)
**File**: `INSERT_SAMPLE_PRODUCTS_DATA.sql`

1. Click **"New Query"**
2. Copy content from `INSERT_SAMPLE_PRODUCTS_DATA.sql`
3. Paste and click **"Run"**
4. ✅ Should see: Sample data inserted

**What this does**:
- Adds 6 sample categories (Rings, Necklaces, etc.)
- Adds 11 sample sub-categories
- Adds 3 sample products
- Useful for testing!

---

### STEP 2: Verify Database Setup

Run these queries in SQL Editor to verify:

```sql
-- Check all tables exist
SELECT tablename FROM pg_tables 
WHERE tablename IN ('categories', 'sub_categories', 'products');

-- Check RLS enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE tablename IN ('categories', 'sub_categories', 'products');

-- Check sample data
SELECT COUNT(*) FROM categories;
SELECT COUNT(*) FROM sub_categories;
SELECT COUNT(*) FROM products;

-- View sample products
SELECT p.name, c.name as category, p.status 
FROM products p 
JOIN categories c ON p.category_id = c.id;
```

**Expected Results**:
- 3 tables found ✅
- All have RLS = true ✅
- Sample data counts: 6, 11, 3 ✅

---

### STEP 3: Give Task to Codex

Now that database is ready, Codex can implement server-side code!

1. Open the file: `CODEX_PROMPT_PRODUCTS.md`
2. **Copy the entire content**
3. **Give it to your Codex agent**

**What Codex Will Do**:
- Implement all server actions (15+ functions)
- Handle category CRUD
- Handle sub-category operations
- Handle product CRUD
- Handle image upload/delete
- Handle filtering and pagination
- Add proper error handling
- Add admin verification

**Codex Should Deliver**:
- `apps/web/app/(admin)/admin/products/actions.ts` (complete)
- All CRUD operations working
- Image upload working
- Proper security checks

---

## 🧪 TESTING AFTER CODEX COMPLETES

### Test 1: Categories
1. Login as **admin**
2. Go to **Admin → Products**
3. Should see sample categories in filters
4. Try creating new category
5. Try editing category
6. Try deleting empty category

### Test 2: Products
1. Go to **Admin → Products**
2. Should see 3 sample products
3. Click **"New Product"**
4. Fill form and upload image
5. Save → Should create successfully
6. Edit product → Should update
7. Change status to inactive → Should update

### Test 3: Reseller View
1. Login as **reseller**
2. Go to **Reseller → Products**
3. Should see **active products only**
4. Should NOT see inactive products
5. Product images should load
6. Filtering should work

### Test 4: Image Upload
1. As admin, create/edit product
2. Upload image → Should upload to `product-images/{productId}/`
3. Image should display in preview
4. Delete image → Should remove from storage
5. Public should be able to view images

---

## 📁 FILES SUMMARY

### SQL Files (You Run These)
1. ✅ `CREATE_PRODUCTS_TABLES.sql` - Creates 3 tables
2. ✅ `CREATE_PRODUCTS_RLS_POLICIES.sql` - Creates 15 RLS policies
3. ✅ `CREATE_STORAGE_POLICIES.sql` - Creates storage policies
4. ✅ `INSERT_SAMPLE_PRODUCTS_DATA.sql` - Sample data (optional)

### Documentation (Give to Codex)
5. ✅ `CODEX_PROMPT_PRODUCTS.md` - Complete task for Codex

### Guide (You're Reading This)
6. ✅ `PRODUCTS_REBUILD_GUIDE.md` - This file

---

## 🔒 SECURITY NOTES

### What's Protected
- ✅ Only admins can create/edit/delete products
- ✅ Only admins can upload/delete images
- ✅ Resellers can only view active products
- ✅ Public cannot see inactive products
- ✅ All verified server-side (not just UI)

### Database Constraints
- ✅ Category names must be unique
- ✅ Sub-category names must be unique per category
- ✅ Cannot delete category with products
- ✅ tunch_percentage must be 0-100
- ✅ labor_per_kg must be ≥ 0

---

## 💾 DATA STRUCTURE EXAMPLES

### Weight Ranges (JSONB)
```json
[
  {"min": 0, "max": 10},
  {"min": 10, "max": 20},
  {"min": 20, "max": 50}
]
```

### Images (TEXT Array)
```
[
  "https://...supabase.co/storage/v1/object/public/product-images/uuid1/image1.jpg",
  "https://...supabase.co/storage/v1/object/public/product-images/uuid1/image2.jpg"
]
```

### Product Status
```
'active' or 'inactive'
```

### Offer Types
```
'percentage' or 'fixed'
```

---

## 🎯 QUICK CHECKLIST

### Before Codex
- [ ] Run `CREATE_PRODUCTS_TABLES.sql`
- [ ] Run `CREATE_PRODUCTS_RLS_POLICIES.sql`
- [ ] Run `CREATE_STORAGE_POLICIES.sql`
- [ ] Run `INSERT_SAMPLE_PRODUCTS_DATA.sql` (optional)
- [ ] Verify all tables exist
- [ ] Verify RLS enabled
- [ ] Verify sample data inserted

### Give to Codex
- [ ] Copy content from `CODEX_PROMPT_PRODUCTS.md`
- [ ] Give to Codex agent
- [ ] Wait for implementation

### After Codex
- [ ] Test category management
- [ ] Test product CRUD
- [ ] Test image upload
- [ ] Test reseller view (active only)
- [ ] Test filtering and search
- [ ] Verify security (admin only operations)

---

## 🆘 TROUBLESHOOTING

### "Relation does not exist"
**Solution**: Run `CREATE_PRODUCTS_TABLES.sql` first

### "Row level security policy violation"
**Solution**: Run `CREATE_PRODUCTS_RLS_POLICIES.sql`

### "Failed to fetch" error in SQL Editor
**Solution**: SQL file too large - Already split into small files ✅

### Images not uploading
**Solution**: 
1. Check bucket `product-images` exists
2. Check bucket is PUBLIC
3. Run `CREATE_STORAGE_POLICIES.sql`

### Reseller sees inactive products
**Solution**: Check RLS policy - Should filter by status='active'

---

## ✅ SUCCESS INDICATORS

After completing all steps, you should have:
- ✅ 3 database tables (categories, sub_categories, products)
- ✅ 15 RLS policies (5 per table)
- ✅ 5 storage policies for product-images
- ✅ Sample data for testing
- ✅ Working CRUD operations (Codex implements)
- ✅ Image upload/delete working
- ✅ Admin can manage all
- ✅ Reseller can view active products only

---

## 📞 NEXT STEPS

1. **Now**: Run the 4 SQL files in Supabase
2. **Then**: Give `CODEX_PROMPT_PRODUCTS.md` to Codex
3. **Finally**: Test everything works!

**You're all set! Database structure is ready, just need to run SQL and let Codex implement server actions.** 🎉

---

**Created**: Oct 27, 2025
**Status**: Ready for implementation
**Estimated Time**: 
- SQL setup: 10 minutes (you)
- Server implementation: 4-6 hours (Codex)
