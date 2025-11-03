# Step-by-Step Guide: Run SQL Files in Supabase

## ⚠️ Error Fix
You're getting `Failed to fetch (api.supabase.com)` because the original SQL file was too large. I've split it into 5 smaller files that are easier to run.

---

## 🚀 Run These Files IN ORDER

### **Step 1: Create Table**
**File**: `1_CREATE_TABLE_ONLY.sql`

1. Open Supabase Dashboard → SQL Editor
2. Click "New Query"
3. Copy content from `1_CREATE_TABLE_ONLY.sql`
4. Paste and click **Run**
5. ✅ Should see: "Success. No rows returned"
6. Verify: Go to Table Editor → Look for `silver_rates` table

---

### **Step 2: Enable RLS**
**File**: `2_ENABLE_RLS.sql`

1. Stay in SQL Editor
2. Click "New Query"
3. Copy content from `2_ENABLE_RLS.sql`
4. Paste and click **Run**
5. ✅ Should see: `silver_rates | true` in results

---

### **Step 3: Create RLS Policies**
**File**: `3_CREATE_RLS_POLICIES.sql`

1. Click "New Query"
2. Copy content from `3_CREATE_RLS_POLICIES.sql`
3. Paste and click **Run**
4. ✅ Should see: List of 5 policies created
5. Verify: Database → Policies → Look for `silver_rates` policies

---

### **Step 4: Create Helper Function**
**File**: `4_CREATE_FUNCTION.sql`

1. Click "New Query"
2. Copy content from `4_CREATE_FUNCTION.sql`
3. Paste and click **Run**
4. ✅ Should see: Success message

---

### **Step 5: Insert Default Rate**
**File**: `5_INSERT_DEFAULT_RATE.sql`

1. Click "New Query"
2. Copy content from `5_INSERT_DEFAULT_RATE.sql`
3. Paste and click **Run**
4. ✅ Should see: 1 row with rate_per_gram = 0.00

---

## ✅ Verification

After running all 5 files, verify:

### Check Table Exists
```sql
SELECT * FROM public.silver_rates;
```
Should show 1 row with rate 0.00

### Check RLS Enabled
```sql
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'silver_rates';
```
Should show `true`

### Check Policies
```sql
SELECT policyname FROM pg_policies WHERE tablename = 'silver_rates';
```
Should show 5 policies

### Test Function
```sql
SELECT public.get_current_silver_rate();
```
Should return `0.00`

---

## 🆘 Troubleshooting

### Still Getting "Failed to fetch" Error
**Try these:**
1. Check internet connection
2. Try different browser
3. Clear browser cache
4. Try Supabase CLI instead of web editor
5. Contact Supabase support

### "Relation does not exist" Error
**Solution**: Run Step 1 first (create table)

### "Policy already exists" Error
**Solution**: That's okay! It means the policy was created before. Continue to next step.

### "Function already exists" Error
**Solution**: That's okay! It means the function was created before. Continue to next step.

---

## 💡 Alternative: Use Supabase CLI

If web editor keeps failing, use CLI:

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Run SQL files
supabase db push --db-url "your-database-url"
```

---

## ✅ Success Indicators

After completing all steps, you should have:
- ✅ `silver_rates` table in Table Editor
- ✅ RLS enabled (green checkmark)
- ✅ 5 RLS policies visible
- ✅ 1 row with default rate 0.00
- ✅ Helper function working

**Now you're ready for Codex to build the server-side code!** 🎉

---

## 📋 Quick Checklist

- [ ] Step 1: Table created ✅
- [ ] Step 2: RLS enabled ✅
- [ ] Step 3: 5 policies created ✅
- [ ] Step 4: Function created ✅
- [ ] Step 5: Default rate inserted ✅
- [ ] Verification queries all pass ✅
- [ ] Ready for Codex implementation ✅
