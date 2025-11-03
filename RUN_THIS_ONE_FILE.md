# 🎯 SUPER SIMPLE - RUN JUST ONE FILE!

## ⚠️ THIS WILL DELETE EXISTING PRODUCT/CATEGORY DATA

If you're okay with that, follow these 3 steps:

---

## ✅ STEP 1: Open Supabase
1. Go to **Supabase Dashboard**
2. Click **"SQL Editor"** (left sidebar)
3. Click **"New Query"**

---

## ✅ STEP 2: Run The File
1. Open file: **`RESET_AND_CREATE_CATEGORIES.sql`**
2. **Copy ALL content** (Ctrl+A, Ctrl+C)
3. **Paste** in Supabase SQL Editor (Ctrl+V)
4. Click **"RUN"** button (bottom right)
5. Wait ~5 seconds

---

## ✅ STEP 3: Check Result
You should see at bottom:
```
table_name     | row_count
categories     | 6
subcategories  | 11
products       | 3
```

✅ **SUCCESS!**

---

## 🎉 DONE! 

Now go to `/admin/categories` - Error should be gone!

---

## What This File Does (All in One):

1. ✅ Drops old tables (clean slate)
2. ✅ Creates categories table (with slug, image_url, etc.)
3. ✅ Creates subcategories table
4. ✅ Creates products table
5. ✅ Enables RLS security
6. ✅ Creates 15 policies
7. ✅ Inserts 6 sample categories
8. ✅ Inserts 11 sample subcategories
9. ✅ Inserts 3 sample products

**Everything in ONE file!** 🎉

---

## ⏱️ Time: 2 minutes

**File to use:** `RESET_AND_CREATE_CATEGORIES.sql`

**Just copy-paste-run. That's it!** 🚀
