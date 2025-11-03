# ✅ QUICK FIX - Categories Error

## Run These 3 SQL Files In Order:

### ☐ STEP 1: Categories
**File:** `CREATE_CATEGORIES_ONLY.sql`
- Creates categories table
- Creates subcategories table
- **Status:** [ ] Not Done / [ ] Done

---

### ☐ STEP 2: Products
**File:** `CREATE_PRODUCTS_TABLE_FIX.sql`
- Fixes products table structure
- Renames sub_category_id → subcategory_id
- **Status:** [ ] Not Done / [ ] Done

---

### ☐ STEP 3: Security
**File:** `CREATE_CATEGORIES_RLS_CORRECT.sql`
- Adds security policies
- 15 policies total
- **Status:** [ ] Not Done / [ ] Done

---

### ☐ STEP 4: Sample Data (Optional)
**File:** `INSERT_SAMPLE_CATEGORIES.sql`
- Adds 6 categories + 11 subcategories
- **Status:** [ ] Not Done / [ ] Done

---

## After All Steps:

### ☐ Test Categories Page
- Go to `/admin/categories`
- Should show categories
- No errors

### ☐ Test Create Category
- Click "Add Category"
- Fill form and save
- Should work

---

## Quick Verify Query:

```sql
-- Run this to check everything:
SELECT 
  'categories' as table_name, 
  COUNT(*) as row_count 
FROM categories
UNION ALL
SELECT 
  'subcategories', 
  COUNT(*) 
FROM subcategories
UNION ALL
SELECT 
  'products', 
  COUNT(*) 
FROM products;
```

**Expected Result:**
```
categories     | 6
subcategories  | 11
products       | 3
```

---

## 🎉 All Done!
- [ ] All SQL files run
- [ ] No errors in console
- [ ] Categories page works
- [ ] Can create categories

**Total Time:** ~5 minutes ⏱️
