# ✅ Fixed: Reseller Discount & Global Loop Calculation

## 🎯 **Issue Fixed:**

**Before:** Reseller's Discount (%) and Global Loop (%) were stored in database but **NOT used** in price calculation.

**After:** Both are now properly applied:
- **Discount (%)** → **REDUCES** the price ✅
- **Global Loop (%)** → **ADDS** to the price ✅

---

## 📊 **New Calculation Flow:**

### **Step-by-Step Calculation:**

```
1. Base Price = Weight × Silver Rate
   Example: 1 kg × ₹100/g = ₹1,00,000

2. Deduction = Base × Deduction %
   Example: ₹1,00,000 × 35.5% = -₹35,500

3. Labor Charges = Labor Rate × Weight
   Example: ₹700/kg × 1 kg = +₹700

4. Subtotal = Base - Deduction + Labor
   Example: ₹1,00,000 - ₹35,500 + ₹700 = ₹65,200

5. Reseller Discount = Subtotal × Discount %
   Example: ₹65,200 × 10% = -₹6,520

6. Global Loop = Subtotal × Global Loop %
   Example: ₹65,200 × 2% = +₹1,304

7. Price After Reseller Terms = Subtotal - Discount + Loop
   Example: ₹65,200 - ₹6,520 + ₹1,304 = ₹59,984

8. Product Offer Discount (if applicable)
   Example: ₹59,984 × 5% = -₹2,999

9. Taxable Amount = Price - Offer
   Example: ₹59,984 - ₹2,999 = ₹56,985

10. GST = Taxable × GST %
    Example: ₹56,985 × 3% = +₹1,709

11. TOTAL PRICE = Taxable + GST
    Example: ₹56,985 + ₹1,709 = ₹58,694
```

---

## 🎨 **UI Display (Product Page):**

### **Price Breakdown Card:**

```
┌────────────────────────────────────┐
│ Price Breakdown                    │
├────────────────────────────────────┤
│ Weight               1.000 kg      │
│ Silver Rate          ₹100.00/g     │
│ Base Price           ₹1,00,000.00  │
│ Deduction (35.5%)    -₹35,500.00   │ (red)
│ Labor Charges        +₹700.00      │
│ Discount (10%) 🆕    -₹6,520.00    │ (green)
│ Global Loop (2%) 🆕  +₹1,304.00    │ (blue)
│ Offer Discount       -₹2,999.00    │ (orange)
├────────────────────────────────────┤
│ Taxable Amount       ₹56,985.00    │
│ CGST (1.5%)          +₹854.77      │
│ SGST (1.5%)          +₹854.77      │
├────────────────────────────────────┤
│ TOTAL PRICE          ₹58,694.55    │ (bold)
└────────────────────────────────────┘
```

---

## 🔧 **What Changed:**

### **1. Backend (Price Calculation)**
**File:** `apps/web/app/(reseller)/reseller/products/actions.ts`

```typescript
// ✅ Fetch reseller discount and global loop
const { data: reseller } = await supabase
  .from('resellers')
  .select('state_code, discount_pct, global_loop_pct')
  .eq('user_id', user.id)
  .maybeSingle()

const resellerDiscount = parseFloat(reseller?.discount_pct ?? '0')
const globalLoop = parseFloat(reseller?.global_loop_pct ?? '0')

// ✅ Apply to calculation
const subtotal = base - deduction + labor

// SUBTRACT discount
const resellerDiscountAmount = 
  resellerDiscount > 0 ? subtotal * (resellerDiscount / 100) : 0

// ADD global loop
const globalLoopAmount = 
  globalLoop > 0 ? subtotal * (globalLoop / 100) : 0

const priceAfterResellerTerms = 
  subtotal - resellerDiscountAmount + globalLoopAmount

// Then apply product offer
const taxable = priceAfterResellerTerms - offerDiscount
```

### **2. Type Definitions**
**File:** `apps/web/types/reseller.ts`

```typescript
export type PriceBreakdown = {
  // ... existing fields
  
  // 🆕 New fields
  reseller_discount_pct?: number
  reseller_discount_amount?: number
  global_loop_pct?: number
  global_loop_amount?: number
  
  // ... rest of fields
}
```

### **3. Frontend (UI Display)**
**File:** `apps/web/components/reseller/ProductDetail.tsx`

```tsx
{/* 🆕 Reseller Discount */}
{breakdown.reseller_discount_pct > 0 && (
  <div className="flex justify-between text-sm">
    <span>Discount ({breakdown.reseller_discount_pct}%)</span>
    <span className="text-green-600">
      -{formatINR(breakdown.reseller_discount_amount)}
    </span>
  </div>
)}

{/* 🆕 Global Loop */}
{breakdown.global_loop_pct > 0 && (
  <div className="flex justify-between text-sm">
    <span>Global Loop ({breakdown.global_loop_pct}%)</span>
    <span className="text-blue-600">
      +{formatINR(breakdown.global_loop_amount)}
    </span>
  </div>
)}
```

---

## 📋 **Example Scenarios:**

### **Scenario 1: Discount 10%, Global Loop 2%**

```
Subtotal:              ₹65,200
- Discount (10%):      -₹6,520  ← Reduces price
+ Global Loop (2%):    +₹1,304  ← Adds to price
= After Reseller:      ₹59,984
```

### **Scenario 2: Only Discount 15%**

```
Subtotal:              ₹65,200
- Discount (15%):      -₹9,780  ← Reduces price
+ Global Loop (0%):    +₹0      ← Not applied
= After Reseller:      ₹55,420
```

### **Scenario 3: Only Global Loop 5%**

```
Subtotal:              ₹65,200
- Discount (0%):       -₹0      ← Not applied
+ Global Loop (5%):    +₹3,260  ← Adds to price
= After Reseller:      ₹68,460
```

### **Scenario 4: No Discount, No Loop**

```
Subtotal:              ₹65,200
- Discount (0%):       -₹0      
+ Global Loop (0%):    +₹0      
= After Reseller:      ₹65,200  ← Same as subtotal
```

---

## 🧪 **Testing:**

### **Test Case 1: With Discount & Global Loop**

1. **Admin Sets:**
   - Discount: 10%
   - Global Loop: 2%

2. **Expected in Price Breakdown:**
   ```
   Subtotal:         ₹65,200.00
   Discount (10%):   -₹6,520.00  ← Shows in green
   Global Loop (2%): +₹1,304.00  ← Shows in blue
   Taxable:          ₹59,984.00
   ```

### **Test Case 2: Edit Financial Details**

1. Go to `/admin/resellers/[id]`
2. Click "Edit" on Financial Details
3. Set:
   - Credit Limit: ₹5,00,000
   - Discount (%): 10
   - Global Loop (%): 2
   - Payment Terms: Net 7
4. Click "Save Changes"
5. **Result:** Reseller will see discount & loop in all product prices ✅

### **Test Case 3: Verify Calculation**

1. **Reseller** logs in
2. Goes to product catalog
3. Selects product, enters weight
4. **Sees Price Breakdown:**
   - Base Price: ₹1,00,000
   - Deduction: -₹35,500
   - Labor: +₹700
   - **Discount (10%)**: **-₹6,520** ← NEW!
   - **Global Loop (2%)**: **+₹1,304** ← NEW!
   - Taxable: ₹59,984
   - GST: +₹1,799
   - **Total**: ₹61,783

---

## 🎨 **Color Coding:**

| Item | Color | Meaning |
|------|-------|---------|
| Deduction | 🔴 Red | Base reduction (tunch) |
| Discount | 🟢 Green | Reseller benefit (reduces price) |
| Global Loop | 🔵 Blue | Additional charge (adds to price) |
| Offer | 🟠 Orange | Product-level discount |
| Labor, GST | ⚫ Black | Standard charges |

---

## ✅ **Summary:**

### **What Works Now:**

✅ **Discount (%)** properly **reduces** the price  
✅ **Global Loop (%)** properly **adds** to the price  
✅ Both show in **price breakdown** on product page  
✅ Calculated **after** labor, **before** product offers  
✅ Applied to **all products** for that reseller  
✅ Admin can **edit** both values per reseller  
✅ Proper **color coding** for clarity  

### **Files Modified:**

1. ✅ `apps/web/app/(reseller)/reseller/products/actions.ts`
2. ✅ `apps/web/types/reseller.ts`
3. ✅ `apps/web/components/reseller/ProductDetail.tsx`

---

## 🚀 **Test It Now:**

1. **Admin:** Edit any reseller's discount & global loop
2. **Reseller:** Login and view any product
3. **See:** Both discount & loop in price breakdown!

---

**Calculation is now correct!** 🎉
