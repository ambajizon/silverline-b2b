# Rename "Extra Charges" to "Global Loop"

## Overview
Renamed the "Extra Charges" field to "Global Loop" across both reseller and admin interfaces throughout the application.

## Changes Made

### Reseller Side (2 files) ✅

#### 1. Financial Details Card
**File**: `apps/web/components/reseller/profile/FinancialDetailsCard.tsx`
- Changed label from "Extra Charges" to "Global Loop"
- Updated comment from `{/* Extra Charges */}` to `{/* Global Loop */}`

**Display**: Colored card showing Global Loop percentage

#### 2. Account Financial Card
**File**: `apps/web/components/reseller/account/FinancialCard.tsx`
- Changed label from "Extra Charges" to "Global Loop"
- Updated comment from `{/* Extra Charges */}` to `{/* Global Loop */}`

**Display**: Simple row showing "Global Loop: X%"

### Admin Side (3 files) ✅

#### 1. Reseller Financial Details Component
**File**: `apps/web/components/admin/resellers/ResellerFinancialDetails.tsx`
- Changed label from "Extra Charges (%)" to "Global Loop (%)"

**Display**: Shows Global Loop percentage on reseller detail page

#### 2. Resellers Table
**File**: `apps/web/components/admin/resellers/ResellersTable.tsx`
- Changed table header from "Extra Charges (%)" to "Global Loop (%)"

**Display**: Column header in resellers list table

#### 3. Edit Financial Modal
**File**: `apps/web/components/admin/resellers/EditFinancialModal.tsx`
- Changed label from "Extra Charges (%)" to "Global Loop (%)"
- Changed comment from `{/* Extra Charges Percentage */}` to `{/* Global Loop Percentage */}`
- Updated helper text from "Additional charges applied to all orders" to "Global loop percentage applied to all orders"

**Display**: Edit modal for updating financial details

## Display Locations

### Reseller Views
1. **Dashboard Financial Card** - Shows "Global Loop: X%"
2. **Account Page - Financial Details Card** - Shows "Global Loop" in colored card
3. **Account Page - Financial Card** - Shows "Global Loop: X%" in row

### Admin Views
1. **Resellers List Table** - Column header "Global Loop (%)"
2. **Reseller Detail Page - Financial Details** - Shows "Global Loop (%): X"
3. **Edit Financial Modal** - Form field labeled "Global Loop (%)"

## Technical Details

### Database Field
**Note**: The underlying database field name remains `extra_charges_percentage` or `extra_charges_percent`. Only the **UI labels** were changed.

### Code Variables
Variable names in code (like `extraChargesPercent`, `extra_charges_percentage`) remain unchanged. This is intentional to:
- Avoid database schema changes
- Maintain backward compatibility
- Minimize code refactoring
- Keep API contracts stable

## Before & After

### Reseller Financial Card
**Before**:
```
┌──────────────────────────┐
│ Credit Limit | ₹1,00,000 │
│ Discount | 5%            │
│ Extra Charges | 2%       │  ← Changed
│ Payment Terms | Net 30   │
└──────────────────────────┘
```

**After**:
```
┌──────────────────────────┐
│ Credit Limit | ₹1,00,000 │
│ Discount | 5%            │
│ Global Loop | 2%         │  ← New Name
│ Payment Terms | Net 30   │
└──────────────────────────┘
```

### Admin Resellers Table
**Before**:
```
| Name | Email | ... | Discount (%) | Extra Charges (%) | Actions |
```

**After**:
```
| Name | Email | ... | Discount (%) | Global Loop (%) | Actions |
```

### Admin Edit Modal
**Before**:
```
Extra Charges (%)
[Input: 2%]
Additional charges applied to all orders
```

**After**:
```
Global Loop (%)
[Input: 2%]
Global loop percentage applied to all orders
```

## Files Modified (5 files)

1. ✅ `apps/web/components/reseller/profile/FinancialDetailsCard.tsx`
2. ✅ `apps/web/components/reseller/account/FinancialCard.tsx`
3. ✅ `apps/web/components/admin/resellers/ResellerFinancialDetails.tsx`
4. ✅ `apps/web/components/admin/resellers/ResellersTable.tsx`
5. ✅ `apps/web/components/admin/resellers/EditFinancialModal.tsx`

## Testing Checklist

### Reseller Side
- [ ] **Dashboard Page** - Check financial card shows "Global Loop"
- [ ] **Account Page** - Check financial details card shows "Global Loop"
- [ ] **Account Page** - Check financial card (if visible) shows "Global Loop"

### Admin Side
- [ ] **Resellers List** - Check table header shows "Global Loop (%)"
- [ ] **Reseller Detail** - Check financial details shows "Global Loop (%)"
- [ ] **Edit Financial Modal** - Check form label shows "Global Loop (%)"
- [ ] **Edit Financial Modal** - Check helper text mentions "Global loop"

## Notes

### Why Only UI Labels Changed
- Database schema unchanged (`extra_charges_percentage`)
- API contracts unchanged
- Code variable names unchanged
- Only user-facing text updated

This approach:
- ✅ Requires no database migration
- ✅ Maintains backward compatibility
- ✅ Simplifies deployment
- ✅ Reduces risk of breaking changes

### Consistency
The term "Global Loop" now appears consistently across:
- ✅ Reseller dashboard
- ✅ Reseller account page
- ✅ Admin resellers list
- ✅ Admin reseller detail page
- ✅ Admin edit modal

## Summary

**Change**: Renamed "Extra Charges" to "Global Loop" throughout the UI

**Scope**: Both reseller and admin interfaces

**Impact**: UI labels only - no database or API changes

**Files Modified**: 5 components across reseller and admin sections

**Result**: Consistent "Global Loop" terminology across the entire application! ✅

---

**Implementation Date**: Oct 27, 2025  
**Status**: ✅ Complete  
**Impact**: UI terminology update - no breaking changes
