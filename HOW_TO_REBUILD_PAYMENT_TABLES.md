# 🔧 How to Rebuild Payment Tables

## ⚠️ **Problem:**
You deleted all table data by mistake and now getting error:
```
Error loading payment stats: Could not find the table 'public.reseller_outstanding' in the schema cache
```

---

## ✅ **Solution: Run the SQL Script**

### **Step 1: Open Supabase SQL Editor**

1. Go to **Supabase Dashboard**: https://supabase.com/dashboard
2. Select your project: **SilverLine B2B**
3. Click **SQL Editor** in the left sidebar
4. Click **+ New query**

---

### **Step 2: Copy and Paste SQL**

1. Open file: `REBUILD_PAYMENT_TABLES.sql`
2. Copy **ALL content** from the file
3. Paste into Supabase SQL Editor
4. Click **Run** button (or press Ctrl+Enter)

---

### **Step 3: Verify Success**

You should see output like:

```
✅ payments table exists
✅ v_reseller_outstanding view exists
✅ Trigger orders_create_invoice_on_delivery exists
✅ RLS enabled on payments
```

Plus a list of policies created.

---

## 📋 **What This Script Does:**

### **Creates:**

1. **`payments` table** - Stores all financial transactions
   - Invoices (when orders delivered)
   - Payments (when reseller pays)
   - Adjustments (manual corrections)

2. **`v_reseller_outstanding` view** - Shows balances
   - Total invoiced
   - Total received
   - Outstanding balance per reseller

3. **Trigger** - Auto-creates invoices
   - When order status → `delivered`
   - Creates invoice entry automatically

4. **RLS Policies** - Security
   - Admin: can view/edit all payments
   - Reseller: can view own payments only

---

## 🧪 **Test the System:**

### **Test 1: Check if tables exist**
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('payments', 'v_reseller_outstanding');
```

**Expected:** 2 rows

---

### **Test 2: View empty balances**
```sql
SELECT * FROM v_reseller_outstanding;
```

**Expected:** List of resellers with `0.00` balances

---

### **Test 3: Manually add a payment**
```sql
-- Replace <reseller-id> with actual UUID from resellers table
INSERT INTO payments (
  reseller_id,
  kind,
  amount,
  payment_method,
  note
)
VALUES (
  '<reseller-id>',
  'payment',
  10000.00,
  'cash',
  'Test payment'
);

-- Check balance updated
SELECT * FROM v_reseller_outstanding 
WHERE reseller_id = '<reseller-id>';
```

---

### **Test 4: Test auto-invoice on delivery**

1. **Create an order** (or use existing)
2. **Mark as delivered** in admin panel
3. **Check payments table:**

```sql
SELECT * FROM payments 
WHERE kind = 'invoice' 
ORDER BY created_at DESC 
LIMIT 5;
```

**Expected:** New invoice entry created automatically

---

## 🗂️ **Table Schema:**

### **payments table:**
```sql
Column          | Type              | Description
----------------|-------------------|----------------------------------
id              | UUID              | Primary key
reseller_id     | UUID              | FK to resellers
kind            | payment_kind      | 'invoice', 'payment', 'adjustment'
amount          | NUMERIC(12,2)     | Always positive
payment_date    | DATE              | Date of transaction
payment_method  | TEXT              | cash, upi, bank_transfer, etc.
transaction_id  | TEXT              | UPI ID, cheque no., etc.
note            | TEXT              | Description/reference
created_at      | TIMESTAMPTZ       | When record created
updated_at      | TIMESTAMPTZ       | When record updated
```

---

### **v_reseller_outstanding view:**
```sql
Column              | Type         | Description
--------------------|--------------|----------------------------------
reseller_id         | UUID         | Reseller ID
shop_name           | TEXT         | Shop name
contact_name        | TEXT         | Contact person
phone               | TEXT         | Phone number
invoiced            | NUMERIC      | Total invoices (orders delivered)
received            | NUMERIC      | Total payments received
adjustments         | NUMERIC      | Total adjustments
outstanding         | NUMERIC      | Balance (invoiced - received + adj)
last_payment_date   | DATE         | Date of last payment
last_payment_amount | NUMERIC      | Amount of last payment
invoice_count       | INTEGER      | Number of invoices
payment_count       | INTEGER      | Number of payments
```

---

## 🔐 **RLS Policies Created:**

| Policy | Table | Access | Users |
|--------|-------|--------|-------|
| Admin can view all payments | payments | SELECT | admin |
| Admin can insert payments | payments | INSERT | admin |
| Admin can update payments | payments | UPDATE | admin |
| Admin can delete payments | payments | DELETE | admin |
| Reseller can view own payments | payments | SELECT | reseller |

---

## 🔄 **How Auto-Invoice Works:**

```
1. Admin marks order as "Delivered"
        ↓
2. Trigger fires: orders_create_invoice_on_delivery
        ↓
3. Function: create_invoice_on_delivery()
        ↓
4. Inserts into payments table:
   - kind: 'invoice'
   - amount: order.total_price
   - note: 'Invoice for Order #ORD-...'
        ↓
5. View v_reseller_outstanding updates automatically
        ↓
6. Admin sees updated balance in Payments page
```

---

## 📊 **Payment Workflow:**

### **Scenario: Reseller Orders ₹50,000 worth**

1. **Order placed** → Status: `pending`
2. **Order accepted** → Status: `accepted`
3. **Order in making** → Status: `in_making`
4. **Order dispatched** → Status: `dispatched`
5. **Order delivered** → Status: `delivered`
   - ✅ **Auto-creates invoice**: ₹50,000 (owed)
   - Outstanding balance: **₹50,000**

6. **Reseller pays ₹30,000**
   - Admin adds payment: ₹30,000
   - Outstanding balance: **₹20,000**

7. **Reseller pays remaining ₹20,000**
   - Admin adds payment: ₹20,000
   - Outstanding balance: **₹0**

---

## 💡 **Common Queries:**

### **Get resellers with outstanding balance:**
```sql
SELECT 
  shop_name,
  outstanding
FROM v_reseller_outstanding
WHERE outstanding > 0
ORDER BY outstanding DESC;
```

---

### **Get payment history for a reseller:**
```sql
SELECT 
  payment_date,
  kind,
  amount,
  payment_method,
  note
FROM payments
WHERE reseller_id = '<reseller-id>'
ORDER BY payment_date DESC, created_at DESC;
```

---

### **Get total receivables:**
```sql
SELECT SUM(outstanding) as total_outstanding
FROM v_reseller_outstanding
WHERE outstanding > 0;
```

---

### **Get monthly payment summary:**
```sql
SELECT 
  DATE_TRUNC('month', payment_date) as month,
  kind,
  SUM(amount) as total
FROM payments
GROUP BY month, kind
ORDER BY month DESC;
```

---

## ⚠️ **Important Notes:**

### **1. Do NOT delete the view:**
The view `v_reseller_outstanding` is used by the admin Payments page.
If deleted, you'll get the error you're seeing now.

### **2. Invoices auto-create:**
When you mark orders as "delivered", invoices will auto-create.
Don't manually create invoices for orders - the trigger handles it!

### **3. Payments are manual:**
Admin must manually record payments when reseller pays.
Go to: **Admin → Payments → Record Payment**

### **4. Outstanding can be negative:**
If you record payment before delivery, outstanding will be negative.
This means reseller has advance payment (credit balance).

---

## 🐛 **Troubleshooting:**

### **Error: "table payments does not exist"**
**Fix:** Run `REBUILD_PAYMENT_TABLES.sql`

---

### **Error: "view v_reseller_outstanding does not exist"**
**Fix:** Run `REBUILD_PAYMENT_TABLES.sql`

---

### **Error: "type payment_kind does not exist"**
**Fix:** Run `REBUILD_PAYMENT_TABLES.sql` (it creates the enum)

---

### **Invoice not auto-created on delivery**
**Check:**
1. Is trigger installed? Query:
   ```sql
   SELECT * FROM information_schema.triggers
   WHERE trigger_name = 'orders_create_invoice_on_delivery';
   ```
2. Check Supabase logs for errors
3. Verify order status changed to 'delivered' (not just updated)

---

### **RLS error: "permission denied for table payments"**
**Check:**
1. Are you logged in?
2. Is your role correct in `profiles` table?
3. Run the RLS policy creation part again

---

## ✅ **Final Checklist:**

- [ ] Run `REBUILD_PAYMENT_TABLES.sql` in Supabase SQL Editor
- [ ] Verify tables exist (Test 1)
- [ ] Check view returns data (Test 2)
- [ ] Test manual payment (Test 3)
- [ ] Test auto-invoice (Test 4)
- [ ] Visit Admin → Payments page
- [ ] Should see list of resellers with balances
- [ ] No errors!

---

## 🎉 **Done!**

Your payment system is now rebuilt and ready to use!

Go to: **http://localhost:3000/admin/payments**

You should see the payments dashboard without errors! 🚀
