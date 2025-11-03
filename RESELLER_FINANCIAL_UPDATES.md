# Reseller Financial & Target Progress Updates

## Changes Made - October 29, 2025

### 1. Removed Current Outstanding
**Location:** Reseller Detail Page - Financial Section

**Changes:**
- ✅ Removed "Current Outstanding" display from `ResellerFinancialDetails.tsx`
- ✅ Removed calculation logic from `apps/web/app/(admin)/admin/resellers/[id]/page.tsx`
- ✅ Removed orderTotals and payments queries

**Files Modified:**
- `components/admin/resellers/ResellerFinancialDetails.tsx`
- `app/(admin)/admin/resellers/[id]/page.tsx`

### 2. Removed Credit Limit
**Location:** Throughout the application

**Changes:**
- ✅ Removed Credit Limit field from Financial Details UI
- ✅ Removed Credit Limit from Edit Financial Modal form
- ✅ Updated form schema to exclude credit_limit validation
- ✅ Removed credit_limit from API update route
- ✅ Changed grid from 4 columns to 3 columns (Discount, Global Loop, Payment Terms)

**Files Modified:**
- `components/admin/resellers/ResellerFinancialDetails.tsx`
- `components/admin/resellers/EditFinancialModal.tsx`
- `app/(admin)/admin/api/resellers/update-financial/route.ts`

### 3. Fixed Target Progress Bar
**Location:** Reseller Detail Page - Target Progress

**Problem:** Progress bar was showing 0% even when targets had progress

**Root Cause:** The relationship query `target_progress(current_value)` was not correctly fetching the latest progress value

**Solution:**
- Changed from relationship query to explicit query for each target
- Fetch latest `current_value` from `target_progress` table ordered by `updated_at`
- Use `Promise.all` to fetch progress for all targets in parallel

**Files Modified:**
- `app/(admin)/admin/resellers/[id]/page.tsx`

**Technical Details:**
```typescript
// Before (broken):
const { data: targets } = await supabase
  .from('targets')
  .select(`*, target_progress(current_value)`)
  
// After (fixed):
const { data: targets } = await supabase.from('targets').select('*')

const targetsWithProgress = await Promise.all(
  (targets || []).map(async (target) => {
    const { data: progressData } = await supabase
      .from('target_progress')
      .select('current_value')
      .eq('target_id', target.id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    
    return {
      ...target,
      current_progress: progressData?.current_value || 0,
    }
  })
)
```

### 4. Updated Default Values
**Changes:**
- Changed default payment terms from "Net 30" to "Immediate Payment"

## Testing Checklist

### Financial Details
- [ ] Verify Current Outstanding is no longer displayed
- [ ] Verify Credit Limit field is removed from edit modal
- [ ] Verify only 3 fields show: Discount (%), Global Loop (%), Payment Terms
- [ ] Test editing financial details still works correctly

### Target Progress
- [ ] Create a new target for a reseller
- [ ] Add progress to the target (use record target progress)
- [ ] Verify progress bar displays correct percentage
- [ ] Verify progress bar animates to the correct width
- [ ] Check both admin reseller detail page and reseller dashboard

### Database
Note: The following database columns still exist but are no longer used in UI:
- `resellers.credit_limit` - Can be removed in future migration if desired
- Calculation of current_outstanding - Logic removed from application

## Notes
- The reseller's own view (`getActiveTarget` in reseller actions) was already correctly fetching progress
- Only the admin's reseller detail view had the broken progress fetching
- Credit limit field still exists in database but is no longer editable or displayed
