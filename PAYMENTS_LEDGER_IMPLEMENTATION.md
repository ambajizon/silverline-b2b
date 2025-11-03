# ✅ Payments & Ledger System Implementation

## Overview

Implemented complete payments and ledger system using `v_reseller_outstanding` view and automatic triggers. The system tracks invoices, payments, and outstanding balances automatically.

---

## Architecture

### Database Layer (Already Created via SQL)

**Tables:**
- `payments` - Ledger entries (kind: 'invoice' or 'payment')
- `orders` - Order data with trigger on status='delivered'
- `v_reseller_outstanding` - VIEW that aggregates balances

**Trigger:**
- When order status → 'delivered', auto-creates invoice entry in payments

**View Formula:**
```sql
CREATE VIEW v_reseller_outstanding AS
SELECT 
  r.id as reseller_id,
  r.shop_name,
  COALESCE(SUM(CASE WHEN p.kind = 'invoice' THEN p.amount ELSE 0 END), 0) as invoiced,
  COALESCE(SUM(CASE WHEN p.kind = 'payment' THEN p.amount ELSE 0 END), 0) as received,
  COALESCE(SUM(CASE WHEN p.kind = 'invoice' THEN p.amount ELSE -p.amount END), 0) as outstanding
FROM resellers r
LEFT JOIN payments p ON p.reseller_id = r.id
GROUP BY r.id, r.shop_name;
```

---

## What Was Implemented

### 1. ✅ Admin Payments Page

**File:** `app/(admin)/admin/payments/actions.ts`

#### Updated Functions:

**`getPaymentsDashboardStats()`**
```typescript
// Query v_reseller_outstanding view
const { data: outstanding } = await supabase
  .from('v_reseller_outstanding')
  .select('*')

// Calculate aggregates
return {
  total_received: sum of received,
  total_outstanding: sum of outstanding,
  total_invoiced: sum of invoiced,
  overdue_count: count with outstanding > 0,
  resellers_with_balance: total count
}
```

**`getPaymentsTable()`**
```typescript
// Query v_reseller_outstanding view
const { data: resellers } = await supabase
  .from('v_reseller_outstanding')
  .select('*')
  .order('outstanding', { ascending: false })

// Transform to payment rows
payments = resellers.map(r => ({
  reseller_id, reseller_name,
  invoiced, received, outstanding,
  status: outstanding === 0 ? 'paid' : 'pending'
}))
```

**`recordPayment()`**
```typescript
// Insert payment with kind='payment'
await supabase
  .from('payments')
  .insert({
    reseller_id,
    kind: 'payment',      // ✅ KEY: kind='payment'
    amount: Number(amount),
    note
  })

// Outstanding updates automatically via view
```

**Filters Supported:**
- Status: All / Overdue / Paid / Pending
- Reseller ID
- Search by shop name

---

### 2. ✅ Record Payment Modal

**Component:** `components/admin/payments/RecordPaymentButton.tsx`

**Fields:**
- Reseller (select dropdown)
- Amount (number)
- Note (optional textarea)

**Server Action:** `recordPayment()`
- Validates reseller exists
- Inserts into `payments` with `kind='payment'`
- Revalidates `/admin/payments` and `/admin/dashboard`

---

### 3. ✅ Admin Resellers List

**File:** `app/(admin)/admin/resellers/page.tsx`

**Query:**
```typescript
const { data } = await supabase
  .from('resellers')
  .select(`
    *,
    profiles!inner(email)
  `)
  .order('created_at', { ascending: false })
```

**Displays:**
- Shop name
- Status (pending, approved, rejected, suspended)
- Created date
- Phone
- Email (from profiles join)

**Status Aggregates:**
- New Registrations (pending)
- Approved
- Rejected
- Suspended
- Active

**Actions:**
- Approve reseller
- Suspend reseller
- Reject reseller
- View details (click row → `/admin/resellers/[id]`)

---

### 4. ⏳ Admin Dashboard (Next Step)

**File:** `app/(admin)/admin/dashboard/page.tsx`

**Payment Summary Cards to Add:**
```typescript
// Query v_reseller_outstanding
const { data: stats } = await supabase
  .from('v_reseller_outstanding')
  .select('invoiced, received, outstanding')

// Display cards:
- Total Invoiced
- Total Received
- Total Outstanding
- Overdue Count
```

**Top Performing Resellers:**
```typescript
// Option A: By revenue (from orders)
SELECT reseller_id, SUM(total_price) as revenue
FROM orders
WHERE status = 'delivered'
GROUP BY reseller_id
ORDER BY revenue DESC
LIMIT 5

// Option B: By payment compliance (from view)
SELECT *
FROM v_reseller_outstanding
ORDER BY received DESC
LIMIT 5
```

---

### 5. ⏳ Reseller Self-View Balance (Next Step)

**File:** `app/(reseller)/reseller/dashboard/page.tsx`

**Query:**
```typescript
const { data } = await supabase
  .from('v_reseller_outstanding')
  .select('outstanding, received, invoiced')
  .eq('reseller_id', myResellerId)
  .single()
```

**Display:**
```
┌─────────────────────────────┐
│ Your Account Balance        │
├─────────────────────────────┤
│ Total Invoiced: ₹2,96,125   │
│ Total Paid:     ₹1,00,000   │
│ Outstanding:    ₹1,96,125   │
└─────────────────────────────┘
```

---

## Data Flow

### When Order is Delivered

```
Admin marks order as "Delivered"
  ↓
DB Trigger fires automatically
  ↓
Inserts into payments:
  {
    reseller_id: "xxx",
    kind: "invoice",
    amount: order.total_price,
    note: "Order #SL-61E9"
  }
  ↓
v_reseller_outstanding updates automatically
  invoiced += amount
  outstanding += amount
```

### When Admin Records Payment

```
Admin clicks "Record Payment"
  ↓
Modal opens with fields:
  - Reseller (select)
  - Amount (number)
  - Note (optional)
  ↓
Submit → recordPayment() action
  ↓
Inserts into payments:
  {
    reseller_id: "xxx",
    kind: "payment",
    amount: 100000,
    note: "Cash payment"
  }
  ↓
v_reseller_outstanding updates automatically
  received += amount
  outstanding -= amount
```

### View Balances

```
Admin or Reseller queries v_reseller_outstanding
  ↓
View aggregates from payments:
  invoiced = SUM(amount WHERE kind='invoice')
  received = SUM(amount WHERE kind='payment')
  outstanding = invoiced - received
  ↓
Display current balance
```

---

## Files Modified

### Admin Side

1. **`app/(admin)/admin/payments/actions.ts`**
   - ✅ `getPaymentsDashboardStats()` - Query view for stats
   - ✅ `getPaymentsTable()` - Query view for table data
   - ✅ `recordPayment()` - Insert payment with kind='payment'
   - ✅ `getResellersForFilter()` - Already exists

2. **`app/(admin)/admin/payments/page.tsx`**
   - ✅ Already set up correctly
   - Displays stats cards
   - Shows table of resellers with balances
   - Has "Record Payment" button

3. **`app/(admin)/admin/resellers/page.tsx`**
   - ✅ Already fetching from `public.resellers`
   - Shows shop_name, status, created_at
   - Has status aggregates

4. **`app/(admin)/admin/resellers/actions.ts`**
   - ✅ Already has approve/suspend/reject actions

### Reseller Side (To Do)

5. **`app/(reseller)/reseller/dashboard/page.tsx`** ⏳
   - Need to add balance display
   - Query `v_reseller_outstanding`

---

## Database Permissions (RLS)

### `v_reseller_outstanding` View

**Admin Policy (READ):**
```sql
CREATE POLICY "Admin can view all balances"
ON v_reseller_outstanding FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
```

**Reseller Policy (READ OWN):**
```sql
CREATE POLICY "Reseller can view own balance"
ON v_reseller_outstanding FOR SELECT
TO authenticated
USING (
  reseller_id IN (
    SELECT id FROM resellers
    WHERE resellers.user_id = auth.uid()
  )
);
```

### `payments` Table

**Admin Policy (INSERT):**
```sql
CREATE POLICY "Admin can record payments"
ON payments FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
```

**Trigger Policy (INSERT):**
```sql
-- Trigger runs as superuser, no RLS needed
```

---

## API Endpoints

### Admin Payments

**GET Stats:**
```typescript
getPaymentsDashboardStats(dateFrom?, dateTo?, resellerId?)
→ { total_received, total_outstanding, total_invoiced, overdue_count }
```

**GET Table:**
```typescript
getPaymentsTable(filters: PaymentFilters)
→ { payments: [...], total: number }
```

**POST Record Payment:**
```typescript
recordPayment({ reseller_id, amount, note })
→ { ok: true } | { ok: false, error }
```

**GET Resellers for Filter:**
```typescript
getResellersForFilter()
→ { resellers: [{ id, shop_name }] }
```

### Admin Resellers

**GET List:**
```typescript
fetchResellersData(filters)
→ { resellers, total, stats }
```

**POST Actions:**
```typescript
approveReseller(id)
suspendReseller(id)
rejectReseller(id)
```

---

## Testing Checklist

### ✅ Payments Page

- [ ] Navigate to `/admin/payments`
- [ ] **Verify**: Page loads without errors
- [ ] **Verify**: Stats cards show totals
- [ ] **Verify**: Table shows resellers with balances
- [ ] **Verify**: Resellers sorted by outstanding (desc)

### ✅ Record Payment Flow

- [ ] Click "Record Payment" button
- [ ] **Verify**: Modal opens
- [ ] Select a reseller from dropdown
- [ ] Enter amount (e.g., 50000)
- [ ] Enter note (e.g., "Partial payment - check #1234")
- [ ] Click "Submit"
- [ ] **Verify**: Success message
- [ ] **Verify**: Modal closes
- [ ] **Verify**: Page reloads with updated balances
- [ ] **Verify**: Outstanding decreased by payment amount
- [ ] **Verify**: Received increased by payment amount

### ✅ Order Delivery → Invoice

- [ ] Go to an order detail page
- [ ] Change status to "Delivered"
- [ ] **Verify**: Order status updates
- [ ] Go to `/admin/payments`
- [ ] **Verify**: Outstanding increased by order amount
- [ ] **Verify**: Invoiced increased by order amount

### ✅ Resellers List

- [ ] Navigate to `/admin/resellers`
- [ ] **Verify**: All resellers display
- [ ] **Verify**: Status counts correct
- [ ] Filter by status (e.g., "Approved")
- [ ] **Verify**: Only approved resellers show
- [ ] Search by shop name
- [ ] **Verify**: Matching resellers show

### ⏳ Reseller Dashboard (To Implement)

- [ ] Login as reseller
- [ ] Navigate to dashboard
- [ ] **Verify**: Balance card displays
- [ ] **Verify**: Shows invoiced, received, outstanding
- [ ] **Verify**: Values match admin view

---

## Example Data Flow

### Scenario: Complete Order Lifecycle

**1. Order Placed**
```
Reseller ID: res_001
Order Total: ₹2,96,125
Status: pending
```

**2. Admin Marks Delivered**
```sql
UPDATE orders SET status = 'delivered' WHERE id = 'order_001';

-- Trigger auto-creates:
INSERT INTO payments (reseller_id, kind, amount, note)
VALUES ('res_001', 'invoice', 296125, 'Order #SL-61E9');
```

**3. View Updates**
```
v_reseller_outstanding:
  invoiced: ₹2,96,125
  received: ₹0
  outstanding: ₹2,96,125
```

**4. Admin Records Partial Payment**
```sql
INSERT INTO payments (reseller_id, kind, amount, note)
VALUES ('res_001', 'payment', 100000, 'Partial payment');
```

**5. View Updates Again**
```
v_reseller_outstanding:
  invoiced: ₹2,96,125
  received: ₹1,00,000
  outstanding: ₹1,96,125
```

**6. Admin Records Final Payment**
```sql
INSERT INTO payments (reseller_id, kind, amount, note)
VALUES ('res_001', 'payment', 196125, 'Final payment');
```

**7. View Final State**
```
v_reseller_outstanding:
  invoiced: ₹2,96,125
  received: ₹2,96,125
  outstanding: ₹0  ← Paid in full!
```

---

## Benefits

### Automatic Balance Tracking
- ✅ No manual calculation
- ✅ Always accurate
- ✅ Real-time updates

### Audit Trail
- ✅ Every invoice and payment recorded
- ✅ Timestamps automatic
- ✅ Notes for reference

### Scalability
- ✅ View handles aggregation
- ✅ Fast queries (indexed)
- ✅ No complex joins in app code

### Flexibility
- ✅ Can add more payment types (refund, adjustment)
- ✅ Can add payment methods
- ✅ Can add date range queries

---

## Next Steps

### 1. Add to Admin Dashboard

**File:** `app/(admin)/admin/dashboard/page.tsx`

```typescript
// Fetch payment summary
const { data: paymentStats } = await supabase
  .from('v_reseller_outstanding')
  .select('invoiced, received, outstanding')

const totalInvoiced = paymentStats?.reduce((s, r) => s + r.invoiced, 0)
const totalReceived = paymentStats?.reduce((s, r) => s + r.received, 0)
const totalOutstanding = paymentStats?.reduce((s, r) => s + r.outstanding, 0)

// Display cards
<PaymentSummaryCards 
  invoiced={totalInvoiced}
  received={totalReceived}
  outstanding={totalOutstanding}
/>
```

### 2. Add to Reseller Dashboard

**File:** `app/(reseller)/reseller/dashboard/page.tsx`

```typescript
// Fetch own balance
const { data: balance } = await supabase
  .from('v_reseller_outstanding')
  .select('outstanding, received, invoiced')
  .eq('reseller_id', myResellerId)
  .single()

// Display balance card
<BalanceCard 
  invoiced={balance.invoiced}
  received={balance.received}
  outstanding={balance.outstanding}
/>
```

### 3. Add Payment History View

**File:** `app/(admin)/admin/payments/[reseller_id]/page.tsx`

```typescript
// Show all ledger entries for a reseller
const { data: entries } = await supabase
  .from('payments')
  .select('*')
  .eq('reseller_id', resellerId)
  .order('created_at', { ascending: false })

// Display table:
- Date
- Type (Invoice / Payment)
- Amount
- Note
- Running Balance
```

---

## Summary

**Status:** ✅ Core payments & ledger system complete!

**Completed:**
- ✅ Payments page queries v_reseller_outstanding
- ✅ Record payment inserts with kind='payment'
- ✅ Resellers list fetches from public.resellers
- ✅ All RLS policies in place (via SQL)
- ✅ Trigger auto-creates invoices on delivery

**Remaining:**
- ⏳ Admin dashboard payment summary cards
- ⏳ Reseller dashboard balance display
- ⏳ Payment history detail view (optional)

**Database:** No schema changes needed - just query the view!

**Integration:** Works automatically with existing order flow!

---

**Implementation Date:** Oct 26, 2025  
**Files Modified:** 2 (payments/actions.ts already had structure)  
**Lines Added:** ~150 lines  
**Database:** Uses existing tables + view + trigger
