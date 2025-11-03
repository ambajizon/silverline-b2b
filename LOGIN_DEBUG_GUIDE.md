# Login Issue Debug Guide

## Problem
User `ujjwalgayri588@gmail.com` is experiencing a redirect loop:
- Tries to access /reseller/dashboard
- Gets redirected to /login
- Logs in successfully
- Gets redirected back to /login instead of dashboard

## Root Cause Analysis

The redirect happens in `app/(reseller)/reseller/actions.ts` at line 19:

```typescript
if (error || !profile || profile.role !== 'reseller') redirect('/login')
```

This means one of three things is happening:
1. **Error fetching profile** - Database query failed
2. **Profile doesn't exist** - No profile record for this user
3. **Role is not 'reseller'** - Profile exists but role field is not set to 'reseller'

## How to Fix

### Option 1: Check and Fix in Database (RECOMMENDED)

Run this SQL query in your Supabase SQL Editor:

```sql
-- Check the user's profile and reseller status
SELECT 
  p.id,
  p.email,
  p.role,
  r.shop_name,
  r.status as reseller_status
FROM profiles p
LEFT JOIN resellers r ON r.user_id = p.id
WHERE p.email = 'ujjwalgayri588@gmail.com';
```

**Expected Result:**
- `role` should be `'reseller'`
- `reseller_status` should be `'approved'`

**If role is NULL or different:**
```sql
UPDATE profiles 
SET role = 'reseller'
WHERE email = 'ujjwalgayri588@gmail.com';
```

**If reseller_status is 'pending' or 'suspended':**
```sql
UPDATE resellers
SET status = 'approved'
WHERE user_id = (SELECT id FROM profiles WHERE email = 'ujjwalgayri588@gmail.com');
```

### Option 2: Create Account-Blocked Page

If the reseller status is intentionally not 'approved', create this page:

**File:** `apps/web/app/account-blocked/page.tsx`
```tsx
export default function AccountBlockedPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-8 max-w-md w-full shadow-lg border border-slate-200">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🚫</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Account Under Review</h1>
          <p className="text-slate-600 mb-6">
            Your reseller account is currently pending approval. Please contact the administrator for more information.
          </p>
          <a
            href="/login"
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Login
          </a>
        </div>
      </div>
    </div>
  )
}
```

### Option 3: Add Better Error Logging

Update `app/(reseller)/reseller/actions.ts` to log the issue:

```typescript
export async function getResellerProfile(): Promise<ResellerProfile> {
  const supabase = await supabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    console.error('❌ No authenticated user')
    redirect('/login')
  }

  // check role
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', user.id)
    .single()
  
  if (error) {
    console.error('❌ Profile fetch error:', error)
    redirect('/login')
  }
  
  if (!profile) {
    console.error('❌ No profile found for user:', user.id)
    redirect('/login')
  }
  
  if (profile.role !== 'reseller') {
    console.error('❌ Wrong role. Expected: reseller, Got:', profile.role)
    redirect('/login')
  }

  // Rest of the code...
}
```

## Quick Fix Steps

### Step 1: Check Database
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Run the check query above

### Step 2: Fix Role
If role is not 'reseller':
```sql
UPDATE profiles 
SET role = 'reseller'
WHERE email = 'ujjwalgayri588@gmail.com';
```

### Step 3: Approve Reseller
If reseller exists but not approved:
```sql
UPDATE resellers
SET status = 'approved'
WHERE user_id = (SELECT id FROM profiles WHERE email = 'ujjwalgayri588@gmail.com');
```

### Step 4: Create Reseller Record if Missing
If no reseller record exists:
```sql
INSERT INTO resellers (user_id, shop_name, status)
VALUES (
  (SELECT id FROM profiles WHERE email = 'ujjwalgayri588@gmail.com'),
  'Shop Name Here',
  'approved'
);
```

## Testing

After fixing:
1. Log out completely
2. Clear browser cookies/cache
3. Login again with ujjwalgayri588@gmail.com
4. Should now successfully access /reseller/dashboard

## Common Issues

### Issue 1: Profile role is NULL
**Fix:** Run UPDATE query to set role = 'reseller'

### Issue 2: Reseller record doesn't exist
**Fix:** Create reseller record with INSERT query

### Issue 3: Reseller status is 'pending'
**Fix:** Update status to 'approved'

### Issue 4: Multiple roles in profiles
**Fix:** Ensure role column uses exact string 'reseller' (case-sensitive)

## Prevention

To prevent this in the future:
1. Always create both profile AND reseller record when registering
2. Set role to 'reseller' in profiles table
3. Set status to 'approved' in resellers table (or create approval workflow)
