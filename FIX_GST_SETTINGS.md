# 🔧 FIX GST Settings - Settings Table Missing

## ❌ Problem
The `settings` table doesn't exist in your database, so GST configuration cannot be saved.

---

## ✅ Solution (2 minutes)

### **Step 1: Create Settings Table**

1. Open **Supabase Dashboard**
2. Go to **SQL Editor**
3. Click **"New Query"**
4. Copy content from **`CREATE_SETTINGS_TABLE.sql`**
5. Paste and click **"Run"**

**Expected Result:**
```
✓ Table created
✓ 7 default settings inserted
✓ RLS enabled
✓ 4 policies created
```

---

### **Step 2: Verify Settings Table**

Run this query:

```sql
SELECT * FROM settings ORDER BY key;
```

**Expected Output:**
```
key              | value
-----------------|------------------
company_address  | (empty)
company_email    | (empty)
company_gstin    | (empty)
company_name     | SilverLine B2B
company_phone    | (empty)
extra_charges    | 0
gst_rate         | 0
```

---

### **Step 3: Enable GST**

1. Go to `/admin/settings?tab=gst-config`
2. Toggle **GST Enabled** ON
3. Enter rate: **3**
4. Click **"Save Changes"**
5. **Refresh page** (Ctrl+Shift+R)
6. Toggle should stay **ON** ✅

---

### **Step 4: Verify GST in Database**

```sql
SELECT * FROM settings WHERE key = 'gst_rate';
```

**Should show:**
```
key      | value | updated_at
---------|-------|-------------------
gst_rate | 3     | 2025-10-27 11:55:00
```

---

### **Step 5: Test in Product Page**

1. Go to any product (e.g., `/reseller/products/[id]`)
2. Select weight
3. Price breakdown should show:
   ```
   Taxable Amount: ₹65,700.00
   GST (3%): +₹1,971.00  ✅
   ────────────────────────
   Total Price: ₹67,671.00
   ```

---

## 📋 What This Table Stores

The `settings` table stores all system-wide configuration:

- **`gst_rate`** - GST percentage (0 = disabled)
- **`extra_charges`** - Additional deduction %
- **`company_name`** - Your company name
- **`company_address`** - Company address
- **`company_gstin`** - GST registration number
- **`company_phone`** - Contact phone
- **`company_email`** - Contact email

All these can be edited in **Settings** page.

---

## 🔒 Security

**RLS Policies:**
- ✅ Anyone can **read** settings (public)
- ✅ Only **admins** can create/update/delete settings

---

## ⏱️ Total Time: 2 minutes

**Run the SQL file now to fix GST persistence!** 🚀
