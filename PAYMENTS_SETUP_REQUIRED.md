# 🚨 REQUIRED: Database Migration for Payments System

## Status: ⚠️ **MUST RUN SQL BEFORE USING PAYMENTS**

The payments and ledger system is implemented in the code, but **requires a database migration** to add the `kind` column to the `payments` table.

---

## ❌ Current Issue

**Error when accessing `/admin/payments`:**
```
ERROR: column "kind" does not exist (42703)
```

**Root Cause:**
The `public.payments` table is missing the `kind` column which is required to distinguish between:
- `'invoice'` - Amounts owed by reseller
- `'payment'` - Amounts paid by reseller
- `'adjustment'` - Manual adjustments

---

## ✅ Solution: Run the Migration

### **Step 1: Open Supabase SQL Editor**
1. Go to your Supabase Dashboard
2. Click "SQL Editor" in the left sidebar
3. Click "New query"

### **Step 2: Copy & Paste Migration**
Open the file: **`DATABASE_MIGRATION_PAYMENTS_KIND.sql`**

Copy the ENTIRE contents and paste into the Supabase SQL Editor.

### **Step 3: Execute**
Click "RUN" button

### **Step 4: Verify**
Check the output - you should see:
```
✅ PASS - kind column exists
✅ PASS - v_reseller_outstanding exists
✅ PASS - Trigger exists
```

---

## 📋 What the Migration Does

### 1. Creates ENUM Type
```sql
CREATE TYPE public.payment_kind AS ENUM ('invoice','payment','adjustment');
```

### 2. Adds `kind` Column
```sql
ALTER TABLE public.payments
  ADD COLUMN kind public.payment_kind;
```

### 3. Sets Default for Existing Rows
```sql
UPDATE public.payments 
SET kind = 'payment' 
WHERE kind IS NULL;
```

### 4. Makes Column Required
```sql
ALTER TABLE public.payments 
  ALTER COLUMN kind SET NOT NULL;
```

### 5. Creates the View
```sql
CREATE VIEW v_reseller_outstanding AS
SELECT 
  r.id as reseller_id,
  r.shop_name,
  SUM(CASE WHEN p.kind = 'invoice' THEN p.amount ELSE 0 END) as invoiced,
  SUM(CASE WHEN p.kind = 'payment' THEN p.amount ELSE 0 END) as received,
  SUM(CASE WHEN p.kind = 'invoice' THEN p.amount ELSE -p.amount END) as outstanding
FROM resellers r
LEFT JOIN payments p ON p.reseller_id = r.id
GROUP BY r.id, r.shop_name;
```

### 6. Creates the Trigger
```sql
CREATE TRIGGER orders_create_invoice_on_delivery
  AFTER UPDATE OF status ON orders
  FOR EACH ROW
  WHEN (NEW.status = 'delivered')
  EXECUTE FUNCTION create_invoice_on_delivery();
```

**What it does:**
- Automatically creates an invoice entry when order status → 'delivered'
- Inserts: `kind='invoice'`, `amount=order.total_price`

### 7. Sets Up RLS Policies
- Admin can view all balances
- Reseller can view own balance
- Admin can record payments
- Admin can view all payments
- Reseller can view own payments

---

## 🧪 After Migration: Test It

### Test 1: View Payments Page
1. Login as admin
2. Navigate to `/admin/payments`
3. **Expected:** Page loads without errors
4. **Expected:** Shows reseller balances from view

### Test 2: Record a Payment
1. Click "Record Payment" button
2. Select a reseller
3. Enter amount (e.g., 50000)
4. Enter note (e.g., "Test payment")
5. Submit
6. **Expected:** Success message
7. **Expected:** Balance updates immediately

### Test 3: Trigger Test (Auto-Invoice)
1. Go to any order detail page
2. Change status to "Delivered"
3. **Expected:** Order status updates
4. Go to `/admin/payments`
5. **Expected:** Outstanding increased by order amount
6. **Expected:** Invoiced increased by order amount

### Test 4: View the Ledger
Run this query in SQL Editor:
```sql
SELECT 
  reseller_id,
  kind,
  amount,
  note,
  created_at
FROM payments
ORDER BY created_at DESC
LIMIT 10;
```

**Expected:** See entries with `kind` showing as 'invoice' or 'payment'

---

## 📊 How the System Works (After Migration)

### Automatic Flow

```
1. Reseller places order
   ↓
2. Order created (status: 'pending')
   ↓
3. Admin changes status to 'delivered'
   ↓
4. 🔥 TRIGGER FIRES 🔥
   ↓
5. Auto-creates invoice entry:
   INSERT INTO payments (
     reseller_id,
     kind: 'invoice',
     amount: order.total_price,
     note: 'Invoice for Order #XYZ'
   )
   ↓
6. View updates automatically:
   invoiced ↑
   outstanding ↑
```

### Manual Payment Recording

```
1. Admin clicks "Record Payment"
   ↓
2. Fills form:
   - Reseller: Select
   - Amount: 100000
   - Note: "Cash payment"
   ↓
3. Submits
   ↓
4. Server action inserts:
   INSERT INTO payments (
     reseller_id,
     kind: 'payment',
     amount: 100000,
     note: 'Cash payment'
   )
   ↓
5. View updates automatically:
   received ↑
   outstanding ↓
```

---

## 🔍 Troubleshooting

### Issue: "Column kind does not exist"
**Solution:** Run the migration SQL

### Issue: "View v_reseller_outstanding does not exist"
**Solution:** Run the migration SQL (it creates the view)

### Issue: "Trigger not firing when order delivered"
**Solution:** Run the migration SQL (it creates the trigger)

### Issue: Payments page shows no data
**Possible causes:**
1. Migration not run → Run it
2. No orders marked as delivered → Mark one as delivered
3. RLS blocking access → Check policies in migration

### Issue: Can't record payments
**Possible causes:**
1. Not logged in as admin → Check auth
2. Reseller doesn't exist → Check reseller ID
3. RLS blocking insert → Check admin policy

---

## 📁 Files Updated (Code)

### 1. `app/(admin)/admin/payments/actions.ts` ✅

**Fixed `getPaymentsDashboardStats()` return shape:**
```typescript
return {
  ok: true,
  data: {
    total_received,
    total_outstanding,
    total_invoiced,
    payment_breakdown: {
      paid: total_received,
      unpaid_overdue: total_outstanding,
      partial: 0,
    },
  }
}
```

**Updated `getPaymentsTable()`:**
```typescript
// Queries v_reseller_outstanding view
const { data } = await supabase
  .from('v_reseller_outstanding')
  .select('*')
  .order('outstanding', { ascending: false })
```

**Updated `recordPayment()`:**
```typescript
// Inserts with kind='payment'
await supabase.from('payments').insert({
  reseller_id,
  kind: 'payment',  // ✅
  amount: Number(amount),
  note
})
```

---

## ⚡ Quick Start Checklist

- [ ] 1. Open Supabase SQL Editor
- [ ] 2. Copy entire `DATABASE_MIGRATION_PAYMENTS_KIND.sql`
- [ ] 3. Paste and RUN
- [ ] 4. Verify output shows all ✅ PASS
- [ ] 5. Test `/admin/payments` page loads
- [ ] 6. Test recording a payment
- [ ] 7. Mark an order as delivered
- [ ] 8. Verify invoice auto-created
- [ ] 9. Check balances update correctly

---

## 🎉 After Migration Complete

You'll have:
- ✅ Automatic invoice creation when orders delivered
- ✅ Manual payment recording by admin
- ✅ Real-time balance calculations via view
- ✅ Complete audit trail in payments table
- ✅ RLS security policies in place
- ✅ No manual calculations needed

---

## 📞 Support

If you encounter issues:
1. Check Supabase logs for errors
2. Verify migration ran successfully
3. Check RLS policies are active
4. Verify user has admin role

---

**IMPORTANT:** 
🚨 **You MUST run the migration before the payments system will work!** 🚨

The code is ready, but the database needs the `kind` column.

---

**Migration File:** `DATABASE_MIGRATION_PAYMENTS_KIND.sql`  
**Status:** ⚠️ Pending execution  
**Priority:** 🔴 CRITICAL - Required for payments to work
