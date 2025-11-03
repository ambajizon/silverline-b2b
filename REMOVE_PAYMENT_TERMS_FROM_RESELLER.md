# Remove Payment Terms from Reseller Profile Edit

## Overview
Removed the "Payment Terms" field from reseller's profile edit form. This field is now **admin-only** and can only be modified through the admin panel.

## Changes Made

### 1. Removed from Form Schema ✅
**File**: `apps/web/components/reseller/profile/ProfileInfoForm.tsx`

**Before**:
```typescript
const profileSchema = z.object({
  shop_name: z.string()...,
  // ... other fields
  payment_terms: z.string().optional().or(z.literal('')),  // ❌ Removed
})
```

**After**:
```typescript
const profileSchema = z.object({
  shop_name: z.string()...,
  // ... other fields
  // payment_terms removed - admin only
})
```

### 2. Removed from Form UI ✅
**File**: `apps/web/components/reseller/profile/ProfileInfoForm.tsx`

**Removed**:
- Payment Terms label and dropdown
- Select options (Net 7, Net 15, Net 30, Custom)
- Disabled input field for view mode
- Entire form field section

### 3. Removed from Form Submission ✅
**File**: `apps/web/components/reseller/profile/ProfileInfoForm.tsx`

**Before**:
```typescript
const result = await updateResellerInfo({
  shop_name: data.shop_name,
  // ... other fields
  payment_terms: data.payment_terms || null,  // ❌ Removed
})
```

**After**:
```typescript
const result = await updateResellerInfo({
  shop_name: data.shop_name,
  // ... other fields
  // payment_terms removed
})
```

### 4. Removed from Server Action ✅
**File**: `apps/web/app/(reseller)/reseller/account/actions.ts`

**Input Type - Before**:
```typescript
export async function updateResellerInfo(input: {
  shop_name: string
  // ... other fields
  payment_terms?: string | null  // ❌ Removed
})
```

**Input Type - After**:
```typescript
export async function updateResellerInfo(input: {
  shop_name: string
  // ... other fields
  // payment_terms removed from input type
})
```

**Database Update - Before**:
```typescript
await supabase.from('resellers').upsert({
  user_id: user.id,
  // ... other fields
  payment_terms: input.payment_terms ?? null,  // ❌ Removed
})
```

**Database Update - After**:
```typescript
await supabase.from('resellers').upsert({
  user_id: user.id,
  // ... other fields
  // payment_terms not included in update
})
```

## Where Payment Terms Still Appear

### Reseller Side (View Only) ✅
Payment terms are still **visible** to resellers in these locations:
- ✅ **Account Page** - Financial Card (read-only display)
- ✅ **Dashboard** - Financial Details Card (if shown)

**They can SEE their payment terms but CANNOT EDIT them.**

### Admin Side (Full Control) ✅
Admins can manage payment terms here:
- ✅ **Reseller Detail Page** - Click "Edit" on Financial Details
- ✅ **Edit Financial Modal** - Dropdown with payment term options
- ✅ **API Endpoint** - `/admin/api/resellers/update-financial`

## Payment Terms Control Flow

```
┌─────────────────────────────────────┐
│  ADMIN PANEL                        │
│                                     │
│  Reseller Detail Page               │
│  → Financial Details Card           │
│  → Click "Edit" button              │
│  → Update Payment Terms Dropdown    │
│     - Net 7 Days                    │
│     - Net 15 Days                   │
│     - Net 30 Days                   │
│     - Net 45 Days                   │
│     - Net 60 Days                   │
│     - Immediate Payment             │
│     - Custom Terms                  │
│  → Save                             │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  DATABASE                           │
│  resellers.payment_terms updated    │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  RESELLER SIDE                      │
│  Can VIEW payment terms in:         │
│  - Account page (Financial Card)    │
│  - Dashboard (if displayed)         │
│  CANNOT EDIT ❌                     │
└─────────────────────────────────────┘
```

## Why This Change Was Made

### Business Logic
- **Payment Terms** are a business decision made by management
- Should not be self-service for resellers
- Prevents unauthorized credit term changes
- Maintains financial control

### Security
- ✅ Prevents resellers from giving themselves better terms
- ✅ Ensures all payment term changes are tracked (admin-only)
- ✅ Maintains audit trail through admin actions

## Testing Checklist

### Reseller Side
- [ ] **Login as Reseller**
- [ ] **Go to Account Page**
- [ ] **Click "Edit Profile"**
- [ ] **Verify**: Payment Terms field is NOT visible
- [ ] **Try to Save**: Should work without payment_terms field
- [ ] **Check Financial Card**: Payment terms still VISIBLE but read-only

### Admin Side
- [ ] **Login as Admin**
- [ ] **Go to Reseller Detail Page**
- [ ] **Financial Details → Click "Edit"**
- [ ] **Verify**: Payment Terms dropdown IS visible
- [ ] **Update Payment Terms**: Change from "Net 30" to "Net 15"
- [ ] **Save**: Should update successfully
- [ ] **Check Reseller Side**: New payment terms should display

## Files Modified (2 files)

1. ✅ `apps/web/components/reseller/profile/ProfileInfoForm.tsx`
   - Removed payment_terms from schema
   - Removed payment_terms field from UI
   - Removed payment_terms from form submission

2. ✅ `apps/web/app/(reseller)/reseller/account/actions.ts`
   - Removed payment_terms from input type
   - Removed payment_terms from database update

## Files NOT Changed (Admin Still Works)

These files remain unchanged and continue to allow admin to manage payment terms:
- ✅ `apps/web/components/admin/resellers/EditFinancialModal.tsx`
- ✅ `apps/web/app/(admin)/admin/api/resellers/update-financial/route.ts`
- ✅ `apps/web/components/reseller/profile/FinancialDetailsCard.tsx` (view only)
- ✅ `apps/web/components/reseller/account/FinancialCard.tsx` (view only)

## Summary

**What Changed**:
- ❌ Resellers can NO LONGER edit Payment Terms
- ✅ Resellers can STILL VIEW their Payment Terms
- ✅ Admins can STILL UPDATE Payment Terms via edit modal

**Result**: Payment Terms is now an admin-controlled field, visible to resellers but only editable by admins.

---

**Implementation Date**: Oct 27, 2025  
**Status**: ✅ Complete  
**Impact**: Enhanced financial control - Payment Terms are now admin-only
