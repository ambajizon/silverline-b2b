# 🇮🇳 Indian GST Compliance Implementation

## ✅ Complete Implementation of CGST/SGST/IGST

This implements **proper Indian GST compliance** with automatic CGST/SGST/IGST calculation based on state codes.

---

## 📋 What Was Built

### **Features:**
✅ **State Code Management** - Auto-extract from GST numbers  
✅ **CGST/SGST Split** - When company & reseller in same state (50/50)  
✅ **IGST** - When company & reseller in different states  
✅ **Tax Invoice vs Estimate** - Title changes based on GST enabled/disabled  
✅ **Admin GST Configuration** - Collect company GST number & state code  
✅ **Reseller State Code** - Auto-extracted from reseller's GST number  
✅ **38 Indian States** - Complete state code reference table  

---

## 🎯 Indian GST Rules Implemented

### **Same State Transaction:**
```
Company: Gujarat (State Code: 24)
Reseller: Gujarat (State Code: 24)
GST Rate: 3%

Result:
├─ CGST: 1.5% (Central GST)
├─ SGST: 1.5% (State GST)  
└─ IGST: 0%
```

### **Different State Transaction:**
```
Company: Gujarat (State Code: 24)
Reseller: Maharashtra (State Code: 27)
GST Rate: 3%

Result:
├─ CGST: 0%
├─ SGST: 0%
└─ IGST: 3% (Integrated GST)
```

---

## 🚀 Implementation Steps

### **Step 1: Run SQL Files** ⏱️ 5 minutes

#### **1.1 Create Settings Table** (if not done)
```sql
-- Run: CREATE_SETTINGS_TABLE.sql
```

#### **1.2 Add State Code Support**
```sql
-- Run: ADD_GST_STATE_CODE.sql
```

#### **1.3 Add Tax Settings** (if not done)
```sql
-- Run: ADD_TAX_SETTINGS_RESELLER.sql
```

**What this creates:**
- ✅ `company_state_code` in settings
- ✅ `company_gst_number` in settings
- ✅ `state_code` column in resellers table
- ✅ Auto-extract trigger for state codes
- ✅ Indian states reference table (38 states)
- ✅ Validation functions

---

### **Step 2: Configure Company GST** ⏱️ 2 minutes

1. Go to **Admin → Settings → GST Configuration**
2. Toggle **GST Enabled** ON
3. Enter **GST Rate:** `3`
4. Enter **Company GST Number:** `27AAAAA0000A1Z5` (example)
5. State code `27` will be auto-extracted
6. Click **Save Changes**

---

### **Step 3: Configure Reseller Tax Info** ⏱️ 3 minutes

1. Go to **Reseller → Account → Tax Information**
2. Check **"I have GST Registration"** (if applicable)
3. Enter **GST Number:** `24BBBBB1111B1Z6` (example)
4. State code `24` will be auto-extracted
5. OR enter **PAN Number** if no GST
6. Fill other details
7. Check **"Self Declaration"**
8. Click **Save Tax Information**

---

### **Step 4: Test CGST/SGST/IGST** ⏱️ 5 minutes

#### **Test Case 1: Same State (CGST + SGST)**
**Setup:**
- Admin GST: `27AAAAA0000A1Z5` (Maharashtra - 27)
- Reseller GST: `27BBBBB1111B1Z6` (Maharashtra - 27)
- GST Rate: 3%

**Expected Result:**
```
Product Details Page:
├─ Taxable Amount: ₹65,700.00
├─ CGST (1.5%): +₹985.50
├─ SGST (1.5%): +₹985.50
└─ Total Price: ₹67,671.00
```

#### **Test Case 2: Different State (IGST)**
**Setup:**
- Admin GST: `27AAAAA0000A1Z5` (Maharashtra - 27)
- Reseller GST: `24BBBBB1111B1Z6` (Gujarat - 24)
- GST Rate: 3%

**Expected Result:**
```
Product Details Page:
├─ Taxable Amount: ₹65,700.00
├─ IGST (3%): +₹1,971.00
└─ Total Price: ₹67,671.00
```

#### **Test Case 3: GST Disabled (No Tax)**
**Setup:**
- Admin GST: Disabled (gst_rate = 0)

**Expected Result:**
```
Product Details Page:
├─ Taxable Amount: ₹65,700.00
└─ Total Price: ₹65,700.00

(No GST line shown)
Invoice Title: "Estimate"
```

---

## 📁 Files Created/Modified

### **Created Files:**

1. **`ADD_GST_STATE_CODE.sql`**
   - State code columns
   - Auto-extract function
   - Trigger
   - 38 Indian states reference

2. **`apps/web/lib/gst-utils.ts`**
   - `calculateGSTBreakdown()` - Main logic
   - `extractStateCodeFromGST()` - Extract from GST number
   - `getInvoiceTitle()` - Tax Invoice vs Estimate
   - `formatGSTForDisplay()` - Format for display
   - `getStateName()` - Get state name from code

3. **`GST_CGST_SGST_IGST_IMPLEMENTATION.md`**
   - This guide!

### **Modified Files:**

4. **`apps/web/types/reseller.ts`**
   - Added GST breakdown fields to `PriceBreakdown`
   - `is_same_state`, `cgst_rate`, `sgst_rate`, `igst_rate`, etc.

5. **`apps/web/app/(reseller)/reseller/products/actions.ts`**
   - Updated `pricePreview()` to fetch state codes
   - Calculate CGST/SGST or IGST based on state match
   - Return GST breakdown in response

6. **`apps/web/components/reseller/ProductDetail.tsx`**
   - Updated GST display section
   - Show CGST + SGST for same state
   - Show IGST for different state

7. **`apps/web/lib/validations/settings.ts`**
   - Added `company_gst_number` field
   - Added `company_state_code` field
   - GST format validation

8. **`apps/web/components/admin/settings/GstConfigTab.tsx`**
   - Added Company GST Number input
   - Auto-extract and display state code
   - Save to settings

---

## 🔍 How It Works

### **State Code Extraction:**
```typescript
// From GST Number
GST: "27AAAAA0000A1Z5"
      ↓↓
State Code: "27" (Maharashtra)
```

### **Same State Check:**
```typescript
if (companyStateCode === resellerStateCode) {
  // Same state
  CGST = gstRate / 2  // 1.5%
  SGST = gstRate / 2  // 1.5%
  IGST = 0
} else {
  // Different state
  CGST = 0
  SGST = 0
  IGST = gstRate      // 3%
}
```

### **Invoice Title Logic:**
```typescript
if (gst_rate > 0) {
  title = "Tax Invoice"
} else {
  title = "Estimate"
}
```

---

## 📊 Database Schema

### **New in `settings` Table:**
| Key | Value | Description |
|-----|-------|-------------|
| `company_gst_number` | `27AAAAA0000A1Z5` | Company GST number |
| `company_state_code` | `27` | Auto-extracted state code |

### **New in `resellers` Table:**
| Column | Type | Description |
|--------|------|-------------|
| `state_code` | text | State code from GST (2 digits) |

### **New Table: `indian_states`**
| Column | Type | Description |
|--------|------|-------------|
| `state_code` | text PK | 01-38 |
| `state_name` | text | Gujarat, Maharashtra, etc. |
| `union_territory` | boolean | Is UT? |

---

## 🎨 UI Changes

### **Admin → Settings → GST Configuration:**
```
┌─────────────────────────────────────┐
│ GST Configuration                   │
├─────────────────────────────────────┤
│ Current Status: GST is ENABLED at 3%│
│                                     │
│ ☑ GST Enabled                       │
│                                     │
│ GST Rate (%)*                       │
│ ┌─────────────┐                     │
│ │ 3          %│                     │
│ └─────────────┘                     │
│                                     │
│ Company GST Number (Optional)       │
│ ┌─────────────────────────────────┐ │
│ │ 27AAAAA0000A1Z5                 │ │
│ └─────────────────────────────────┘ │
│ State code will be auto-extracted   │
│                                     │
│ ✅ State Code: 27                   │
│                                     │
│ [Save Changes]  [Reset]             │
└─────────────────────────────────────┘
```

### **Reseller → Product Detail:**
```
┌─────────────────────────────────────┐
│ Price Breakdown                     │
├─────────────────────────────────────┤
│ Weight          1.000 kg            │
│ Silver Rate     ₹100.00/g           │
│ Base Price      ₹1,00,000.00        │
│ Deduction (35%) -₹35,000.00         │
│ Labor Charges   +₹700.00            │
│ ───────────────────────────────────

│
│ Taxable Amount  ₹65,700.00          │
│ CGST (1.5%)     +₹985.50            │  ← Same State
│ SGST (1.5%)     +₹985.50            │  ← Same State
│ ═══════════════════════════════════ │
│ Total Price     ₹67,671.00          │
└─────────────────────────────────────┘

OR (Different State):

┌─────────────────────────────────────┐
│ Taxable Amount  ₹65,700.00          │
│ IGST (3%)       +₹1,971.00          │  ← Different State
│ ═══════════════════════════════════ │
│ Total Price     ₹67,671.00          │
└─────────────────────────────────────┘
```

---

## ✅ Testing Checklist

### **Admin Side:**
- [ ] Run all 3 SQL files
- [ ] Go to Settings → GST Configuration
- [ ] Toggle GST ON
- [ ] Enter GST rate: 3
- [ ] Enter company GST number
- [ ] See state code auto-extracted
- [ ] Save successfully

### **Reseller Side:**
- [ ] Go to Account → Tax Information
- [ ] Enter reseller GST number
- [ ] See state code auto-extracted
- [ ] Save successfully

### **Product Page:**
- [ ] Go to any product
- [ ] Select weight
- [ ] **Same State:** See CGST + SGST
- [ ] **Different State:** See IGST
- [ ] **GST Disabled:** No tax line

### **Calculations:**
- [ ] Same state: CGST = SGST = rate/2
- [ ] Different state: IGST = full rate
- [ ] GST disabled: No tax
- [ ] Total = Taxable + Tax

---

## 🔒 Security & Validation

✅ **GST Number Format:** 15 chars, format validated  
✅ **State Code:** Auto-extracted, cannot be manually tampered  
✅ **RLS Policies:** State codes protected by existing policies  
✅ **Validation Functions:** Database-level format checks  

---

## 📈 Future Enhancements

1. **Invoice Generation**
   - Show company GST on invoice
   - Show reseller GST/PAN on invoice
   - CGST/SGST/IGST breakdown
   - "Tax Invoice" vs "Estimate" title

2. **Reports for CA**
   - GSTR-1 format export
   - CGST/SGST/IGST summary
   - State-wise breakdown
   - HSN-wise summary

3. **Validation**
   - Verify GST number via GSTN API
   - Auto-fill company details from GST
   - E-Way bill integration

---

## 🎉 Summary

✅ **Database:** State codes + auto-extract + 38 states reference  
✅ **Backend:** CGST/SGST/IGST calculation logic  
✅ **Frontend:** Dynamic tax display based on state match  
✅ **Admin:** Company GST collection  
✅ **Reseller:** State code auto-extraction  
✅ **Validation:** GST format + state code checks  

**Total Files:** 3 SQL + 1 utility + 5 modified  
**Total Time:** ~15 minutes to implement + test  

---

## 🚀 Next Steps

1. ✅ Run `ADD_GST_STATE_CODE.sql`
2. ✅ Configure admin GST in settings
3. ✅ Test with same-state reseller (CGST+SGST)
4. ✅ Test with different-state reseller (IGST)
5. ✅ Test with GST disabled (no tax)

**Everything is ready for Indian GST compliance!** 🇮🇳
