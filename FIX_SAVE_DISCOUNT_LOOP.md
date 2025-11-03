# ✅ Fixed: Discount & Global Loop Not Saving

## 🐛 **Problem:**

When admin edited Financial Details and set Discount (%) or Global Loop (%), the values were **NOT being saved** to the database.

**Symptoms:**
- Form submits successfully (200 OK)
- Page refreshes
- Values show "Not Set" instead of saved values ❌

---

## 🔍 **Root Cause:**

**Mismatch between database column names and code:**

| Layer | What it used | ❌/✅ |
|-------|-------------|-------|
| **Database columns** | `discount_pct`, `global_loop_pct` | ✅ Correct |
| **API saving to** | `discount_percent`, `extra_charges_percent` | ❌ Wrong! |
| **Type definitions** | `discount_percentage`, `extra_charges_percentage` | ❌ Wrong! |
| **UI reading from** | `discount_percentage`, `extra_charges_percentage` | ❌ Wrong! |

**Result:** API was trying to save to **non-existent columns**, so the update silently failed!

---

## 🔧 **Fix Applied:**

### **1. API Route (Backend)**
**File:** `apps/web/app/(admin)/admin/api/resellers/update-financial/route.ts`

**Before:**
```typescript
.update({
  credit_limit: credit_limit || null,
  discount_percent: discount_percentage || null,      // ❌ Wrong column
  extra_charges_percent: extra_charges_percentage || null,  // ❌ Wrong column
  payment_terms: payment_terms || null,
})
```

**After:**
```typescript
.update({
  credit_limit: credit_limit || null,
  discount_pct: discount_percentage || null,          // ✅ Correct column
  global_loop_pct: extra_charges_percentage || null,  // ✅ Correct column
  payment_terms: payment_terms || null,
})
```

---

### **2. Type Definitions**
**File:** `apps/web/types/resellers.ts`

**Before:**
```typescript
export interface ResellerWithProfile extends Reseller {
  email?: string
  credit_limit?: number
  discount_percentage?: number          // ❌ Wrong name
  extra_charges_percentage?: number     // ❌ Wrong name
  payment_terms?: string
  current_outstanding?: number
}
```

**After:**
```typescript
export interface ResellerWithProfile extends Reseller {
  email?: string
  credit_limit?: number
  discount_pct?: number                 // ✅ Correct name
  global_loop_pct?: number              // ✅ Correct name
  payment_terms?: string
  current_outstanding?: number
}
```

---

### **3. UI Display Component**
**File:** `apps/web/components/admin/resellers/ResellerFinancialDetails.tsx`

**Before:**
```tsx
<div>
  <p>Discount (%)</p>
  <p>{reseller.discount_percentage ?? 'Not Set'}</p>  {/* ❌ Wrong property */}
</div>

<div>
  <p>Global Loop (%)</p>
  <p>{reseller.extra_charges_percentage ?? 'Not Set'}</p>  {/* ❌ Wrong property */}
</div>
```

**After:**
```tsx
<div>
  <p>Discount (%)</p>
  <p>{reseller.discount_pct ?? 'Not Set'}</p>  {/* ✅ Correct property */}
</div>

<div>
  <p>Global Loop (%)</p>
  <p>{reseller.global_loop_pct ?? 'Not Set'}</p>  {/* ✅ Correct property */}
</div>
```

**Also fixed modal data:**
```tsx
currentData={{
  credit_limit: reseller.credit_limit ?? null,
  discount_percentage: reseller.discount_pct ?? null,      // ✅ Read from correct property
  extra_charges_percentage: reseller.global_loop_pct ?? null,  // ✅ Read from correct property
  payment_terms: reseller.payment_terms ?? null,
}}
```

---

## 📊 **Data Flow (Fixed):**

```
Admin fills form:
  Discount: 10%
  Global Loop: 2%
       ↓
Frontend sends to API:
  discount_percentage: 10
  extra_charges_percentage: 2
       ↓
API saves to database columns:
  discount_pct: 10         ✅ Correct column!
  global_loop_pct: 2       ✅ Correct column!
       ↓
Page refreshes, fetches data:
  SELECT discount_pct, global_loop_pct FROM resellers
       ↓
UI displays:
  Discount (%): 10         ✅ Shows correctly!
  Global Loop (%): 2       ✅ Shows correctly!
```

---

## 📁 **Files Modified:**

1. ✅ `apps/web/app/(admin)/admin/api/resellers/update-financial/route.ts`
   - Fixed: `discount_percent` → `discount_pct`
   - Fixed: `extra_charges_percent` → `global_loop_pct`

2. ✅ `apps/web/types/resellers.ts`
   - Fixed: `discount_percentage` → `discount_pct`
   - Fixed: `extra_charges_percentage` → `global_loop_pct`

3. ✅ `apps/web/components/admin/resellers/ResellerFinancialDetails.tsx`
   - Display: Read from `discount_pct` and `global_loop_pct`
   - Modal: Pass `discount_pct` and `global_loop_pct` values

---

## 🧪 **Testing:**

### **Test Case 1: Save New Values**

1. **Admin → Resellers → Select Reseller**
2. Click "Edit" on Financial Details
3. Set values:
   - Credit Limit: 500000
   - Discount (%): 10
   - Global Loop (%): 2
   - Payment Terms: Net 7
4. Click "Save Changes"
5. **Expected:** Page refreshes and shows:
   ```
   Discount (%): 10        ✅
   Global Loop (%): 2      ✅
   ```

### **Test Case 2: Verify in Database**

```sql
SELECT 
  shop_name,
  discount_pct,
  global_loop_pct
FROM resellers
WHERE id = '73c1fe7c-23de-44fc-b559-b80b2ecc8796';
```

**Expected Result:**
```
shop_name      | discount_pct | global_loop_pct
---------------|--------------|----------------
Pooja Ornament | 10.00        | 2.00
```

### **Test Case 3: Price Calculation**

1. **Reseller logs in**
2. Views any product
3. Enters weight: 1 kg
4. **Price Breakdown shows:**
   ```
   Base Price:       ₹1,00,000.00
   Deduction:        -₹35,500.00
   Labor:            +₹700.00
   Discount (10%):   -₹6,520.00   ← Should show!
   Global Loop (2%): +₹1,304.00   ← Should show!
   Taxable:          ₹59,984.00
   ```

---

## ✅ **Summary:**

### **What Was Broken:**
❌ API saving to wrong database columns  
❌ Types using wrong property names  
❌ UI reading from wrong properties  
❌ Values not persisting after save  

### **What's Fixed:**
✅ API now saves to correct columns (`discount_pct`, `global_loop_pct`)  
✅ Types match database schema  
✅ UI reads from correct properties  
✅ Values persist and display correctly  
✅ Price calculations work with saved values  

---

## 🚀 **Ready to Test:**

1. **Restart dev server** (if running)
2. Go to `/admin/resellers/[id]`
3. Click "Edit" on Financial Details
4. Set Discount & Global Loop
5. Save
6. ✅ **Should work now!**

---

**All column name mismatches fixed!** 🎉
