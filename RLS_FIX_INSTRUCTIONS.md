# 🔐 RLS Fix for Redirect Loop

## Problem
The redirect loop occurs because:
1. Admin layout uses anon key (supabaseServer)
2. RLS blocks the profiles query
3. Layout can't verify role → redirects to login
4. Loop repeats

## Solution Options

### ✅ Option 1: Service Role (Quick Fix - IMPLEMENTED)
**Files Updated:**
- `lib/supabase-admin.ts` - Service role client with cookies
- `app/(admin)/admin/layout.tsx` - Uses supabaseAdmin for role check

**Pros:**
- ✅ Quick fix, works immediately
- ✅ No database changes needed

**Cons:**
- ⚠️ Bypasses all RLS security
- ⚠️ Service role key has full database access
- ⚠️ Must be careful where it's used

**When to Use:**
- Quick testing/development
- When RLS policies are complex
- When you need admin-level access

---

### 🔐 Option 2: Fix RLS Policy (Recommended for Production)

#### SQL to Run in Supabase SQL Editor:

\`\`\`sql
-- Enable RLS if not already enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;

-- Policy 1: Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Policy 2: Users can update their own profile (optional)
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy 3: Admins can manage all profiles
CREATE POLICY "Admins can manage all profiles"
  ON profiles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
\`\`\`

#### Then Update Admin Layout Back:

\`\`\`typescript
// app/(admin)/admin/layout.tsx
import { supabaseServer } from '@/lib/supabase-server'
import { isAdmin } from '@/lib/roles'
import { redirect } from 'next/navigation'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await supabaseServer() // ✅ Regular client works now
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  // ✅ RLS now allows this query
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (!isAdmin(profile?.role)) redirect('/admin/login')
  
  return (/* ... */)
}
\`\`\`

**Pros:**
- ✅ Proper security model
- ✅ No service role key needed
- ✅ Follows Supabase best practices
- ✅ Each user can only read their own profile

**Cons:**
- Requires database changes
- Need to understand RLS policies

---

## 🎯 Recommendation

**For Production: Use Option 2 (Fix RLS)**
- More secure
- Follows best practices
- Easier to maintain

**For Development: Option 1 is fine**
- Already implemented
- Works immediately
- Can switch to Option 2 later

---

## 🧪 Testing After Fix

1. **Clear cookies and cache**
2. **Login to admin panel**
3. **Verify no redirect loop**
4. **Check console for errors**
5. **Test these scenarios:**
   - ✅ Admin user can access /admin/dashboard
   - ✅ Non-admin redirects to /admin/login
   - ✅ Unauthenticated redirects to /admin/login
   - ✅ Profile queries work in Settings module
   - ✅ User role updates work

---

## 📊 Current Status

✅ **Option 1 Implemented**
- Service role client created
- Admin layout updated
- Should fix redirect loop immediately

⏳ **Option 2 Available**
- SQL ready to run
- Can switch anytime
- Better for production

---

## 🔒 Security Notes

### Service Role Key Safety:
- ⚠️ **Never expose in client code**
- ⚠️ **Only use in server components/actions**
- ⚠️ **Environment variable must be secure**
- ⚠️ **Limit its usage to role checks only**

### RLS Policy Benefits:
- ✅ Database-level security
- ✅ Works even if app code fails
- ✅ Consistent across all queries
- ✅ Can't accidentally bypass

---

## 📝 Environment Variable Required

Make sure you have:

\`\`\`env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # ⚠️ Keep secret!
\`\`\`

Get service role key from:
**Supabase Dashboard → Settings → API → service_role (secret)**

---

## 🚀 Next Steps

1. ✅ Test current fix (Option 1)
2. If working, consider implementing Option 2 for production
3. Remove service role usage after RLS fix
4. Document which approach your team uses

