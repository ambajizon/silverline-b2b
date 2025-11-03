# Fix Categories Error - Quick Guide

## 🔴 Problem
Your categories page shows error because the database tables don't exist yet.

## ✅ Solution
Run these 3 SQL files in Supabase **in this order**:

---

## 📝 STEP-BY-STEP INSTRUCTIONS

### Step 1: Open Supabase SQL Editor
1. Go to **Supabase Dashboard**
2. Click **SQL Editor** in left sidebar
3. Click **"New Query"**

---

### Step 2: Run SQL File #1 - Create Tables
1. Open file: `CREATE_CATEGORIES_TABLES_CORRECT.sql`
2. Copy **entire content**
3. Paste in SQL Editor
4. Click **"Run"** button
5. ✅ Should see: "Success. No rows returned"

**What this does:**
- Creates `categories` table (with slug, image_url, display_order, is_active)
- Creates `subcategories` table  
- Creates/updates `products` table with correct foreign keys

---

### Step 3: Run SQL File #2 - Create RLS Policies
1. Click **"New Query"** again
2. Open file: `CREATE_CATEGORIES_RLS_CORRECT.sql`
3. Copy **entire content**
4. Paste in SQL Editor
5. Click **"Run"**
6. ✅ Should see: Policies created successfully

**What this does:**
- Enables Row Level Security
- Creates 15 policies (5 per table)
- Public can read active items
- Only admins can create/edit/delete

---

### Step 4: Run SQL File #3 - Insert Sample Data (Optional)
1. Click **"New Query"** again
2. Open file: `INSERT_SAMPLE_CATEGORIES.sql`
3. Copy **entire content**
4. Paste in SQL Editor
5. Click **"Run"**
6. ✅ Should see: Data inserted

**What this does:**
- Adds 6 categories (Rings, Necklaces, Bracelets, Earrings, Chains, Pendants)
- Adds 11 subcategories
- Adds 3 sample products
- Good for testing!

---

### Step 5: Verify Setup
Run this query to check everything:

```sql
-- Check tables exist
SELECT tablename FROM pg_tables 
WHERE tablename IN ('categories', 'subcategories', 'products');

-- Check data
SELECT COUNT(*) FROM categories;
SELECT COUNT(*) FROM subcategories;
```

**Expected output:**
- 3 tables found ✅
- 6 categories ✅
- 11 subcategories ✅

---

### Step 6: Test in Your App
1. Refresh your categories page: `/admin/categories`
2. Should see 6 categories listed
3. Should show subcategory counts
4. Error should be gone! ✅

---

## 🎯 What Each Table Has

### Categories Table
```
- id (UUID)
- name (TEXT)
- slug (TEXT) ← URL-friendly
- description (TEXT)
- image_url (TEXT) ← Category image
- display_order (INTEGER) ← Sorting
- is_active (BOOLEAN) ← Active/Inactive
- created_at, updated_at
```

### Subcategories Table
```
- id (UUID)
- category_id (FK)
- name (TEXT)
- slug (TEXT)
- description (TEXT)
- image_url (TEXT)
- display_order (INTEGER)
- is_active (BOOLEAN)
- created_at, updated_at
```

### Products Table
```
- Uses subcategory_id (not sub_category_id)
- All pricing fields
- Weight ranges (JSONB)
- Images (TEXT[])
- Offers
```

---

## 🆘 If You Get Errors

### "Table already exists"
✅ **Good!** Skip that file, it's already created.

### "Column does not exist"
❌ **Problem:** Old table structure. **Solution:**
```sql
-- Drop old tables first
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS subcategories CASCADE;
DROP TABLE IF EXISTS sub_categories CASCADE;
DROP TABLE IF EXISTS categories CASCADE;

-- Then run CREATE_CATEGORIES_TABLES_CORRECT.sql again
```

### "Permission denied"
❌ **Problem:** RLS not set. **Solution:**
- Run `CREATE_CATEGORIES_RLS_CORRECT.sql`

---

## ✅ Success Checklist

After running all 3 files:

- [x] Tables created (categories, subcategories, products)
- [x] All columns present (slug, image_url, display_order, is_active)
- [x] RLS enabled on all tables
- [x] 15 policies created
- [x] Sample data inserted (6+11+3)
- [x] Categories page works
- [x] No errors in console

---

## 📚 Files Summary

**Use These 3 Files (IN ORDER):**
1. ✅ `CREATE_CATEGORIES_TABLES_CORRECT.sql` - Tables
2. ✅ `CREATE_CATEGORIES_RLS_CORRECT.sql` - Security
3. ✅ `INSERT_SAMPLE_CATEGORIES.sql` - Sample data

**Old Files (Don't Use):**
- ❌ `CREATE_PRODUCTS_TABLES.sql` - Wrong schema
- ❌ `CREATE_PRODUCTS_RLS_POLICIES.sql` - Wrong table names

---

## 🚀 After Setup Works

Once categories work, you can:
1. ✅ Create new categories
2. ✅ Add subcategories
3. ✅ Create products
4. ✅ Upload product images
5. ✅ Enable/disable items
6. ✅ Reorder display

---

**Total Time:** 5 minutes
**Difficulty:** Easy (just copy-paste SQL)

**Start now! Open the first file and let's fix this!** 🎉
