# CODEX AGENT TASK: Silver Rates Feature - Server Side Implementation

## 🎯 TASK OBJECTIVE
Implement complete server-side functionality for the Silver Rates feature. Admin updates the live silver rate, which is displayed on all reseller dashboards and used for order amount calculations.

---

## 📋 CONTEXT

### Current Situation
- ✅ UI is already built (admin and reseller sides)
- ❌ All Supabase tables were deleted by mistake
- 🔨 Need to recreate `silver_rates` table with proper RLS policies
- 🔨 Need to implement server actions for CRUD operations
- 🔨 Need to ensure real-time updates to resellers

### Business Logic
1. **Admin** updates the silver rate via Settings page
2. **Rate** is stored in database with history
3. **All resellers** see the current live rate on their dashboard
4. **Rate** is used for calculating order amounts (per gram basis)
5. **History** is maintained for auditing and tracking

---

## 🗄️ DATABASE REQUIREMENTS

### Table: `silver_rates`

**Schema:**
```sql
CREATE TABLE public.silver_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rate_per_gram DECIMAL(10, 2) NOT NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

**Indexes:**
- `idx_silver_rates_created_at` on `created_at DESC` (for fetching latest rate)
- `idx_silver_rates_updated_by` on `updated_by` (for admin tracking)

**Comments:**
- Table: "Stores silver rate history - admins update, resellers view for order calculations"
- `rate_per_gram`: "Silver rate per gram in rupees (₹)"
- `updated_by`: "Admin user who updated this rate"

---

## 🔒 RLS POLICIES REQUIRED

### Policy 1: Public Read Access
- **Name:** "Anyone can read silver rates"
- **Type:** SELECT
- **Role:** public
- **Logic:** `true` (anyone can read, including unauthenticated)

### Policy 2: Authenticated Read Access
- **Name:** "Authenticated users can read silver rates"
- **Type:** SELECT
- **Role:** authenticated
- **Logic:** `true` (all authenticated users can read)

### Policy 3: Admin Insert Access
- **Name:** "Admins can insert silver rates"
- **Type:** INSERT
- **Role:** authenticated
- **Logic:** Check if user has admin role in profiles table
```sql
EXISTS (
  SELECT 1 FROM public.profiles
  WHERE profiles.id = auth.uid()
  AND profiles.role = 'admin'
)
```

### Policy 4: Admin Update Access
- **Name:** "Admins can update silver rates"
- **Type:** UPDATE
- **Role:** authenticated
- **Logic:** Same admin check in USING and WITH CHECK

### Policy 5: Admin Delete Access
- **Name:** "Admins can delete silver rates"
- **Type:** DELETE
- **Role:** authenticated
- **Logic:** Same admin check

---

## 🛠️ SERVER ACTIONS TO IMPLEMENT

### Location: `apps/web/app/(admin)/admin/settings/actions.ts`

### 1. Get Current Silver Rate
```typescript
export async function getCurrentSilverRate(): Promise<ActionResult<number>>
```
- Fetch the latest silver rate from database
- Order by `created_at DESC`, limit 1
- Return the `rate_per_gram` value
- Handle case where no rate exists (return 0)
- Used by: Admin settings page, Reseller dashboard

### 2. Fetch Silver Rate History
```typescript
export async function fetchSilverRateHistory(limit: number = 10): Promise<ActionResult<SilverRate[]>>
```
- Fetch last N silver rate records
- Include: id, rate_per_gram, updated_by, created_at
- Order by created_at DESC
- Join with profiles to get admin name who updated
- Used by: Admin settings page (history chart/table)

### 3. Update Silver Rate (Admin Only)
```typescript
export async function updateSilverRate(per10g: number): Promise<ActionResult>
```
- Verify user is admin (check role in profiles table)
- Calculate `rate_per_gram = per10g / 10`
- Insert new record into silver_rates table
- Set `updated_by` to current user ID
- Revalidate paths: '/admin/settings', '/reseller/dashboard'
- Return success/error

---

## 📁 FILES TO CREATE/MODIFY

### 1. Database Migration
**File:** `CREATE_SILVER_RATES_TABLE.sql` ✅ (Already created)
- Run this SQL in Supabase SQL Editor
- Creates table, indexes, RLS policies, helper function

### 2. Type Definitions
**File:** `apps/web/types/settings.ts`
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

### 3. Server Actions
**File:** `apps/web/app/(admin)/admin/settings/actions.ts`
- Add the 3 functions mentioned above
- Export them for use in components

### 4. Admin Settings Page
**File:** `apps/web/app/(admin)/admin/settings/page.tsx`
- Already fetches silver rate (check if exists)
- If not, add fetch calls:
```typescript
const [silverRateResult, rateHistoryResult] = await Promise.all([
  getCurrentSilverRate(),
  fetchSilverRateHistory(10),
])
```
- Pass data to SettingsTabs component

### 5. Reseller Actions
**File:** `apps/web/app/(reseller)/reseller/actions.ts`
- Import `getCurrentSilverRate` from admin actions or create separate
- Fetch in reseller dashboard page
```typescript
export async function getCurrentRate(): Promise<number> {
  const result = await getCurrentSilverRate()
  return result.ok ? result.data || 0 : 0
}
```

### 6. Reseller Dashboard
**File:** `apps/web/app/(reseller)/reseller/dashboard/page.tsx`
- Fetch current silver rate
- Pass to LiveSilverRate component
```typescript
const currentRate = await getCurrentRate()
```

---

## 🔄 REAL-TIME UPDATES (Optional Enhancement)

### Supabase Realtime Subscription
- Enable realtime on `silver_rates` table in Supabase dashboard
- Subscribe to INSERT events on client side
- Update rate display automatically when admin changes it

**Client-side example:**
```typescript
useEffect(() => {
  const channel = supabase
    .channel('silver-rates')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'silver_rates'
    }, (payload) => {
      setCurrentRate(payload.new.rate_per_gram)
    })
    .subscribe()

  return () => { supabase.removeChannel(channel) }
}, [])
```

---

## 🧪 TESTING REQUIREMENTS

### Database Tests
1. ✅ Table created successfully
2. ✅ RLS policies are active
3. ✅ Indexes exist and working
4. ✅ Helper function returns correct value

### Admin Side Tests
1. ✅ Admin can view current rate in settings
2. ✅ Admin can see rate history (last 10 updates)
3. ✅ Admin can update rate via "Update Rate" button
4. ✅ New rate is saved with admin's user_id
5. ✅ Rate updates immediately in UI
6. ✅ Non-admin users CANNOT update rate

### Reseller Side Tests
1. ✅ Reseller can view current rate on dashboard
2. ✅ Rate displays in ₹/10g format
3. ✅ Rate updates when admin changes it (after refresh)
4. ✅ "Updated: [timestamp]" shows correct time
5. ✅ Reseller CANNOT modify the rate

### Order Calculation Tests
1. ✅ Order amount = (weight in grams × rate_per_gram) + other charges
2. ✅ Rate is fetched correctly during order creation
3. ✅ Historical orders maintain the rate at time of creation

---

## 📊 EXISTING UI COMPONENTS

### Admin Side
**Component:** `apps/web/components/admin/settings/SilverRateTab.tsx`
- Displays current rate (₹/10g)
- Shows "Update Rate" button
- Displays rate history table/chart
- Props needed: `currentRate: number`, `rateHistory: SilverRate[]`

### Reseller Side
**Component:** `apps/web/components/reseller/dashboard/LiveSilverRate.tsx`
- Displays current rate in card
- Shows "₹X.XX /10g" format
- Shows last updated timestamp
- Has "Update Rate" button (for UI only, not functional for resellers)
- Props needed: `rate: number`, `updatedAt?: string`

---

## 🚀 IMPLEMENTATION STEPS

### Step 1: Database Setup
1. Open Supabase Dashboard → SQL Editor
2. Run `CREATE_SILVER_RATES_TABLE.sql`
3. Verify table created: Check Table Editor
4. Verify RLS policies: Check Database → Policies
5. Test helper function: Run `SELECT public.get_current_silver_rate();`

### Step 2: Type Definitions
1. Open `apps/web/types/settings.ts`
2. Add `SilverRate` interface
3. Ensure it matches the database schema

### Step 3: Server Actions (Admin)
1. Open `apps/web/app/(admin)/admin/settings/actions.ts`
2. Implement `getCurrentSilverRate()`
3. Implement `fetchSilverRateHistory(limit)`
4. Implement `updateSilverRate(per10g)`
5. Add proper error handling and return types

### Step 4: Admin Settings Page
1. Open `apps/web/app/(admin)/admin/settings/page.tsx`
2. Call server actions in parallel
3. Pass data to SettingsTabs component
4. Ensure data flows to SilverRateTab component

### Step 5: Reseller Actions
1. Open/Create `apps/web/app/(reseller)/reseller/actions.ts`
2. Create `getCurrentRate()` wrapper function
3. Handle errors gracefully (return 0 if fetch fails)

### Step 6: Reseller Dashboard
1. Open `apps/web/app/(reseller)/reseller/dashboard/page.tsx`
2. Fetch current rate using `getCurrentRate()`
3. Pass to LiveSilverRate component
4. Include updated timestamp from database

### Step 7: Testing
1. Test as admin: Update rate, view history
2. Test as reseller: View current rate on dashboard
3. Test permissions: Reseller cannot update rate
4. Test order calculations: Verify correct rate is used

---

## ⚠️ IMPORTANT NOTES

### Security
- ✅ Only admins can INSERT/UPDATE/DELETE rates
- ✅ All users (including public) can READ rates
- ✅ Always verify admin role server-side, not just client-side
- ✅ Use supabaseAdmin() for admin operations to bypass RLS if needed

### Performance
- ✅ Use indexes on created_at for fast latest rate lookup
- ✅ Limit history fetches (default 10 records)
- ✅ Cache current rate on client side (use SWR or React Query)
- ✅ Revalidate paths after rate update

### Data Integrity
- ✅ rate_per_gram must be DECIMAL(10,2) for precision
- ✅ Always store rate per gram, not per 10g
- ✅ Convert per 10g to per gram: `rate_per_gram = per10g / 10`
- ✅ Display can show per 10g: `per10g = rate_per_gram * 10`

### Error Handling
- ✅ Handle case where no rate exists (return 0 or default)
- ✅ Validate rate is positive number
- ✅ Show user-friendly error messages
- ✅ Log errors server-side for debugging

---

## 📝 ACCEPTANCE CRITERIA

### Admin Functionality
- [ ] Admin can view current silver rate in Settings
- [ ] Admin can see history of last 10 rate updates
- [ ] Admin can update rate by entering per 10g value
- [ ] Rate is saved with admin's user_id as updated_by
- [ ] Success message shown after update
- [ ] Page refreshes to show new rate
- [ ] Non-admin users get 403 Forbidden on update attempt

### Reseller Functionality
- [ ] Reseller sees live silver rate on dashboard
- [ ] Rate displays in ₹/10g format
- [ ] "Updated: [time]" shows when rate was last changed
- [ ] Rate updates after page refresh when admin changes it
- [ ] Reseller CANNOT click "Update Rate" button (disabled/hidden)

### Database
- [ ] silver_rates table exists with correct schema
- [ ] RLS is enabled on the table
- [ ] 5 RLS policies exist and work correctly
- [ ] Indexes improve query performance
- [ ] Helper function returns correct current rate

### API/Actions
- [ ] getCurrentSilverRate() returns latest rate
- [ ] fetchSilverRateHistory() returns last N records
- [ ] updateSilverRate() inserts new record (admin only)
- [ ] All functions have proper error handling
- [ ] All functions return ActionResult type

---

## 🎁 DELIVERABLES

1. ✅ SQL migration file (`CREATE_SILVER_RATES_TABLE.sql`)
2. ⬜ Type definitions in `types/settings.ts`
3. ⬜ Server actions in `app/(admin)/admin/settings/actions.ts`
4. ⬜ Updated admin settings page
5. ⬜ Reseller actions for fetching rate
6. ⬜ Updated reseller dashboard page
7. ⬜ Test results confirming all acceptance criteria

---

## 🆘 TROUBLESHOOTING

### Issue: Rate not updating on reseller side
**Solution:** Check revalidatePath is called after admin update

### Issue: "Permission denied" when admin updates rate
**Solution:** Verify RLS policies and admin role in profiles table

### Issue: Rate shows ₹0.00
**Solution:** Admin needs to update the rate first (initial value is 0)

### Issue: History is empty
**Solution:** Add initial rate record manually or wait for first admin update

---

## 📚 REFERENCE

### Database Schema
```
silver_rates
├── id (UUID, PK)
├── rate_per_gram (DECIMAL(10,2), NOT NULL)
├── updated_by (UUID, FK → auth.users)
├── created_at (TIMESTAMPTZ)
└── updated_at (TIMESTAMPTZ)
```

### Key Files
- Database: `CREATE_SILVER_RATES_TABLE.sql`
- Types: `apps/web/types/settings.ts`
- Admin Actions: `apps/web/app/(admin)/admin/settings/actions.ts`
- Admin Page: `apps/web/app/(admin)/admin/settings/page.tsx`
- Admin Component: `apps/web/components/admin/settings/SilverRateTab.tsx`
- Reseller Actions: `apps/web/app/(reseller)/reseller/actions.ts`
- Reseller Page: `apps/web/app/(reseller)/reseller/dashboard/page.tsx`
- Reseller Component: `apps/web/components/reseller/dashboard/LiveSilverRate.tsx`

---

## ✅ COMPLETION CHECKLIST

- [ ] SQL file created and reviewed
- [ ] SQL executed in Supabase successfully
- [ ] Table visible in Supabase Table Editor
- [ ] RLS policies visible in Database settings
- [ ] Type definitions added
- [ ] Admin server actions implemented
- [ ] Reseller server actions implemented
- [ ] Admin page fetches and displays rate
- [ ] Reseller page fetches and displays rate
- [ ] Admin can update rate successfully
- [ ] Reseller sees updated rate (after refresh)
- [ ] Error handling tested
- [ ] All acceptance criteria met
- [ ] Documentation updated

---

**Task Priority:** 🔴 HIGH (Required for order calculations)
**Estimated Time:** 2-3 hours
**Complexity:** Medium
**Dependencies:** Profiles table with admin role

---

Good luck! 🚀 If you encounter any issues, refer to the existing code in the settings actions file for similar patterns.
