# Fix Categories - SIMPLE 3-STEP GUIDE

## 🔴 Problem
Error: "column slug does not exist"

## ✅ Solution
Run SQL files **in this exact order**

---

## 📝 STEP 1: Create Categories Tables

### File: `CREATE_CATEGORIES_ONLY.sql`

1. Open **Supabase → SQL Editor**
2. Click **"New Query"**
3. Copy content from `CREATE_CATEGORIES_ONLY.sql`
4. Paste and click **"Run"**
5. ✅ Should see: "SUCCESS! Categories and Subcategories created"

**What this does:**
- Creates `categories` table
- Creates `subcategories` table
- NO products table (to avoid conflicts)

---

## 📝 STEP 2: Fix Products Table

### File: `CREATE_PRODUCTS_TABLE_FIX.sql`

1. Click **"New Query"**
2. Copy content from `CREATE_PRODUCTS_TABLE_FIX.sql`
3. Paste and click **"Run"**
4. ✅ Should see: "Products table ready"

**What this does:**
- If products exists: Fixes column names (sub_category_id → subcategory_id)
- If products doesn't exist: Creates fresh table
- Adds correct foreign keys

---

## 📝 STEP 3: Add Security (RLS)

### File: `CREATE_CATEGORIES_RLS_CORRECT.sql`

1. Click **"New Query"**
2. Copy content from `CREATE_CATEGORIES_RLS_CORRECT.sql`
3. Paste and click **"Run"**
4. ✅ Should see: "SUCCESS! RLS Policies created"

**What this does:**
- Enables Row Level Security
- Adds 15 policies
- Admins can edit, everyone can read

---

## 📝 STEP 4: Add Sample Data (OPTIONAL)

### File: `INSERT_SAMPLE_CATEGORIES.sql`

1. Click **"New Query"**
2. Copy content from `INSERT_SAMPLE_CATEGORIES.sql`
3. Paste and click **"Run"**
4. ✅ Should see: "SUCCESS! Sample data inserted"

**What this adds:**
- 6 categories
- 11 subcategories  
- 3 sample products

---

## ✅ VERIFY IT WORKS

Run this in SQL Editor:

```sql
-- Check everything
SELECT tablename FROM pg_tables 
WHERE tablename IN ('categories', 'subcategories', 'products');

SELECT COUNT(*) FROM categories;
SELECT COUNT(*) FROM subcategories;
```

**Expected:**
- 3 tables ✅
- 6 categories ✅
- 11 subcategories ✅

---

## 🎯 TEST IN YOUR APP

1. Go to `/admin/categories`
2. Should see 6 categories
3. No more errors!
4. Can create new categories

---

## 🆘 STILL GETTING ERRORS?

### Error: "relation already exists"
✅ **Good!** That table already exists, skip that file.

### Error: "column does not exist"  
Run these queries first:

```sql
-- Check what columns products has
SELECT column_name FROM information_schema.columns
WHERE table_name = 'products' AND table_schema = 'public';

-- If you see 'sub_category_id' instead of 'subcategory_id', 
-- the fix file will rename it automatically
```

### Error: "foreign key violation"
Old products reference old sub_categories table. Fix:

```sql
-- Remove old products (if you don't need them)
TRUNCATE TABLE products CASCADE;

-- Then run CREATE_PRODUCTS_TABLE_FIX.sql again
```

### Still broken? Nuclear option:

```sql
-- WARNING: This deletes ALL product data!
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS subcategories CASCADE;
DROP TABLE IF EXISTS sub_categories CASCADE;
DROP TABLE IF EXISTS categories CASCADE;

-- Then start from Step 1 again
```

---

## 📁 FILES TO USE (IN ORDER)

1. ✅ `CREATE_CATEGORIES_ONLY.sql` - Categories & Subcategories
2. ✅ `CREATE_PRODUCTS_TABLE_FIX.sql` - Products table fix
3. ✅ `CREATE_CATEGORIES_RLS_CORRECT.sql` - Security policies
4. ✅ `INSERT_SAMPLE_CATEGORIES.sql` - Sample data (optional)

---

## ⏱️ TOTAL TIME: 5 minutes

**Ready? Open Supabase SQL Editor and start with Step 1!** 🚀
