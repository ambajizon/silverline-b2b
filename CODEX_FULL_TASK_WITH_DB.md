# CODEX FULL TASK: Silver Rates - Database + Server Implementation

## 🎯 OBJECTIVE
Complete implementation of Silver Rates feature including database setup and server-side code.

---

## 📋 PART 1: DATABASE SETUP

### Current Situation
- ❌ All Supabase tables were accidentally deleted
- ❌ User getting "Failed to fetch" error when running large SQL file
- ✅ Split SQL into 5 smaller files for easier execution

### Files to Run (IN ORDER)
User needs to run these 5 SQL files in Supabase SQL Editor:

1. **`1_CREATE_TABLE_ONLY.sql`** - Creates silver_rates table + indexes
2. **`2_ENABLE_RLS.sql`** - Enables Row Level Security
3. **`3_CREATE_RLS_POLICIES.sql`** - Creates 5 RLS policies
4. **`4_CREATE_FUNCTION.sql`** - Creates helper function
5. **`5_INSERT_DEFAULT_RATE.sql`** - Inserts initial rate (₹0.00)

### Instructions for User
📄 See `RUN_SQL_STEP_BY_STEP.md` for detailed instructions

### What You (Codex) Need to Know
After user runs these SQL files, the database will have:
- ✅ `silver_rates` table with columns: id, rate_per_gram, updated_by, created_at, updated_at
- ✅ RLS enabled with 5 policies (read for all, write for admin only)
- ✅ Helper function `get_current_silver_rate()` that returns latest rate
- ✅ 1 default row with rate = 0.00

---

## 📋 PART 2: YOUR TASK (Server Implementation)

### Database Schema Reference
```sql
silver_rates
├── id: UUID (primary key)
├── rate_per_gram: DECIMAL(10,2) - Rate in ₹ per gram
├── updated_by: UUID - Admin who updated (FK to auth.users)
├── created_at: TIMESTAMPTZ
└── updated_at: TIMESTAMPTZ
```

### RLS Policies Summary
- ✅ Anyone can SELECT (public + authenticated)
- ✅ Only admins can INSERT/UPDATE/DELETE
- ✅ Admin check: `EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')`

---

## 🛠️ IMPLEMENTATION TASKS

### Task 1: Add Type Definition
**File**: `apps/web/types/settings.ts`

Add this interface:
```typescript
export interface SilverRate {
  id: string
  rate_per_gram: number
  updated_by: string | null
  created_at: string
  updated_at: string
  admin_name?: string // From join with profiles
}
```

---

### Task 2: Implement Server Actions
**File**: `apps/web/app/(admin)/admin/settings/actions.ts`

Add these 3 functions:

#### Function 1: Get Current Silver Rate
```typescript
export async function getCurrentSilverRate(): Promise<ActionResult<number>> {
  try {
    const { authorized, supabase } = await verifyAdmin()
    if (!authorized) {
      // Even non-admins can read, so use regular supabase
      const supabase = await supabaseServer()
    }

    const { data, error } = await supabase
      .from('silver_rates')
      .select('rate_per_gram')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) throw error

    // Return rate_per_gram, or 0 if no rate exists
    return { ok: true, data: data?.rate_per_gram || 0 }
  } catch (error: any) {
    return { ok: false, error: error.message || 'Failed to fetch silver rate' }
  }
}
```

#### Function 2: Fetch Silver Rate History
```typescript
export async function fetchSilverRateHistory(limit: number = 10): Promise<ActionResult<SilverRate[]>> {
  try {
    const { authorized, supabase } = await verifyAdmin()
    if (!authorized) return { ok: false, error: 'Unauthorized' }

    const { data, error } = await supabase
      .from('silver_rates')
      .select(`
        id,
        rate_per_gram,
        updated_by,
        created_at,
        updated_at,
        profiles:updated_by (
          id,
          email
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    // Map data to include admin_name
    const ratesWithAdmin = data?.map(rate => ({
      ...rate,
      admin_name: rate.profiles?.email || 'System',
      profiles: undefined // Remove nested object
    })) || []

    return { ok: true, data: ratesWithAdmin }
  } catch (error: any) {
    return { ok: false, error: error.message || 'Failed to fetch rate history' }
  }
}
```

#### Function 3: Update Silver Rate (Admin Only)
```typescript
export async function updateSilverRate(per10g: number): Promise<ActionResult> {
  try {
    const { authorized, supabase, userId } = await verifyAdmin()
    if (!authorized) return { ok: false, error: 'Unauthorized' }

    // Validate input
    if (per10g < 0 || per10g > 100000) {
      return { ok: false, error: 'Invalid rate value' }
    }

    // Convert per 10g to per gram
    const ratePerGram = per10g / 10

    // Insert new rate record
    const { error } = await supabase
      .from('silver_rates')
      .insert({
        rate_per_gram: ratePerGram,
        updated_by: userId,
      })

    if (error) throw error

    // Revalidate both admin and reseller pages
    revalidatePath('/admin/settings')
    revalidatePath('/reseller/dashboard')

    return { ok: true }
  } catch (error: any) {
    return { ok: false, error: error.message || 'Failed to update silver rate' }
  }
}
```

---

### Task 3: Update Admin Settings Page
**File**: `apps/web/app/(admin)/admin/settings/page.tsx`

Check if the page already fetches silver rate. If not, add to the fetch calls:

```typescript
const [silverRateResult, rateHistoryResult, settingsResult, profilesResult, supportContactResult] = await Promise.all([
  getCurrentSilverRate(),      // ← Add this
  fetchSilverRateHistory(10),  // ← Add this
  getSettings([...]),
  listProfiles(),
  getSupportContact(),
])

const currentRate = silverRateResult.ok ? silverRateResult.data || 0 : 0
const rateHistory = rateHistoryResult.ok ? rateHistoryResult.data || [] : []
```

Pass to SettingsTabs:
```typescript
<SettingsTabs
  activeTab={activeTab}
  currentRate={currentRate}         // ← Add this
  rateHistory={rateHistory}         // ← Add this
  settings={settings}
  profiles={profiles}
  supportContact={supportContact}
/>
```

---

### Task 4: Create Reseller Action
**File**: `apps/web/app/(reseller)/reseller/actions.ts` (create if doesn't exist)

Add this wrapper function:
```typescript
'use server'

import { supabaseServer } from '@/lib/supabase-server'

export async function getCurrentRate(): Promise<number> {
  try {
    const supabase = await supabaseServer()
    
    const { data } = await supabase
      .from('silver_rates')
      .select('rate_per_gram')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    return data?.rate_per_gram || 0
  } catch {
    return 0 // Return 0 on error
  }
}

export async function getCurrentRateWithTimestamp(): Promise<{ rate: number; updated: string }> {
  try {
    const supabase = await supabaseServer()
    
    const { data } = await supabase
      .from('silver_rates')
      .select('rate_per_gram, created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    return {
      rate: data?.rate_per_gram || 0,
      updated: data?.created_at || new Date().toISOString()
    }
  } catch {
    return { rate: 0, updated: new Date().toISOString() }
  }
}
```

---

### Task 5: Update Reseller Dashboard
**File**: `apps/web/app/(reseller)/reseller/dashboard/page.tsx`

Add to the page:
```typescript
import { getCurrentRateWithTimestamp } from '../actions'

export default async function DashboardPage() {
  // ... existing code ...
  
  // Fetch silver rate
  const { rate: currentRate, updated: rateUpdated } = await getCurrentRateWithTimestamp()
  
  // Pass to LiveSilverRate component
  return (
    <div>
      {/* ... other components ... */}
      <LiveSilverRate rate={currentRate} updatedAt={rateUpdated} />
    </div>
  )
}
```

---

## 🧪 TESTING REQUIREMENTS

### Test 1: Database Verification
```sql
-- Should return 1 row
SELECT * FROM silver_rates;

-- Should return 0.00 (or latest rate)
SELECT get_current_silver_rate();

-- Should return 5 policies
SELECT policyname FROM pg_policies WHERE tablename = 'silver_rates';
```

### Test 2: Admin Functions
1. Login as admin
2. Go to Settings → Silver Rate tab
3. Current rate should display (₹0.00 initially)
4. Click "Update Rate"
5. Enter rate (e.g., 850 for ₹850/10g)
6. Click Save
7. New rate should appear
8. History should show new entry

### Test 3: Reseller View
1. Login as reseller
2. Go to Dashboard
3. "Live Silver Rate" card should show current rate
4. Should display "Updated: [timestamp]"
5. Rate should match what admin set

### Test 4: Permissions
1. Try updating rate as reseller (should fail with 403)
2. Try as non-admin (should fail)
3. Only admin should successfully update

---

## 📁 FILES TO CREATE/MODIFY

### Create New Files
- [ ] `apps/web/app/(reseller)/reseller/actions.ts` (if doesn't exist)

### Modify Existing Files
- [ ] `apps/web/types/settings.ts` - Add SilverRate interface
- [ ] `apps/web/app/(admin)/admin/settings/actions.ts` - Add 3 functions
- [ ] `apps/web/app/(admin)/admin/settings/page.tsx` - Fetch and pass data
- [ ] `apps/web/app/(reseller)/reseller/dashboard/page.tsx` - Fetch and display rate

### UI Components (Already Exist)
- ✅ `apps/web/components/admin/settings/SilverRateTab.tsx`
- ✅ `apps/web/components/reseller/dashboard/LiveSilverRate.tsx`

---

## ⚠️ IMPORTANT NOTES

### Rate Conversion
- **Database**: Stores rate per GRAM (rate_per_gram)
- **Admin Input**: Enters rate per 10G (per10g)
- **Conversion**: `rate_per_gram = per10g / 10`
- **Display to Reseller**: Show per 10g: `per10g = rate_per_gram * 10`

### Error Handling
- If no rate exists, return 0
- Always validate input (positive numbers only)
- Handle network errors gracefully
- Show user-friendly messages

### Security
- Only admins can INSERT/UPDATE/DELETE
- All users can SELECT (read)
- Always verify admin role server-side
- Use verifyAdmin() helper function

---

## ✅ ACCEPTANCE CRITERIA

### Database
- [ ] silver_rates table exists
- [ ] RLS is enabled
- [ ] 5 RLS policies exist
- [ ] Helper function works
- [ ] 1 default row exists

### Server Actions
- [ ] getCurrentSilverRate() returns latest rate
- [ ] fetchSilverRateHistory() returns last N records
- [ ] updateSilverRate() inserts new record (admin only)
- [ ] All functions have error handling

### Admin Side
- [ ] Admin can view current rate
- [ ] Admin can see rate history
- [ ] Admin can update rate
- [ ] Success message shown after update
- [ ] Page refreshes with new rate

### Reseller Side
- [ ] Reseller sees current rate on dashboard
- [ ] Rate displays in ₹/10g format
- [ ] Updated timestamp is shown
- [ ] Rate updates after refresh when admin changes it

---

## 🎁 DELIVERABLES

1. ⬜ SilverRate interface in types/settings.ts
2. ⬜ 3 server actions in admin/settings/actions.ts
3. ⬜ Updated admin/settings/page.tsx
4. ⬜ Reseller actions in reseller/actions.ts
5. ⬜ Updated reseller/dashboard/page.tsx
6. ⬜ Test results confirming all criteria

---

## 🚀 START HERE

### Step 1: Verify Database Setup
Ask user to confirm they've run all 5 SQL files successfully.

### Step 2: Add Type Definition
Start with the simplest task - add SilverRate interface.

### Step 3: Implement Server Actions
Add the 3 functions to admin settings actions.

### Step 4: Update Pages
Integrate the actions into admin and reseller pages.

### Step 5: Test Everything
Follow the testing requirements above.

---

**Priority**: 🔴 HIGH
**Estimated Time**: 2-3 hours
**Complexity**: Medium
**Dependencies**: Database must be set up first

Good luck! 🚀
