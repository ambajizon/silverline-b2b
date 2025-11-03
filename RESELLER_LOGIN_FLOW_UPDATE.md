# Reseller Login Flow Update

## Change Summary
Updated the reseller access control to allow login for all statuses, but show appropriate messages based on status.

## Previous Behavior ❌
- **Approved**: role = 'reseller' → Login ✅ → Dashboard ✅
- **Suspended/Rejected**: role = 'pending' → **Cannot Login** ❌

## New Behavior ✅
- **Approved**: role = 'reseller' → Login ✅ → Dashboard ✅
- **Suspended**: role = 'reseller' → Login ✅ → **Account Blocked Page** (shows "Account Suspended" message)
- **Rejected**: role = 'reseller' → Login ✅ → **Account Blocked Page** (shows "Registration Rejected" message)
- **Pending (New)**: role = 'pending' → Cannot login until admin reviews

## What Changed

### File: `apps/web/app/(admin)/admin/api/resellers/update-status/route.ts`

**Before:**
```typescript
// Blocked users couldn't login at all
let newRole = 'pending' // Default role for blocked access
if (status === 'approved') {
  newRole = 'reseller'
}
await admin.from('profiles').update({ role: newRole }).eq('id', user_id)
```

**After:**
```typescript
// All users can login, status check happens after
// Keep role as 'reseller' for all statuses - allows login
await admin.from('profiles').update({ role: 'reseller' }).eq('id', user_id)
```

## User Experience Flow

### Scenario 1: Suspended Account
1. Admin changes status: Approved → Suspended
2. Database updates:
   - `resellers.status` = 'suspended'
   - `profiles.role` = 'reseller' (stays as reseller)
3. User tries to login: ✅ Login succeeds
4. After login: Redirected to `/account-blocked`
5. User sees: "Account Suspended" message with support contact

### Scenario 2: Rejected Registration
1. Admin changes status: Pending → Rejected
2. Database updates:
   - `resellers.status` = 'rejected'
   - `profiles.role` = 'reseller' (set to reseller)
3. User tries to login: ✅ Login succeeds
4. After login: Redirected to `/account-blocked`
5. User sees: "Registration Rejected" message with support contact

### Scenario 3: Approved Account
1. Admin changes status: Pending/Suspended → Approved
2. Database updates:
   - `resellers.status` = 'approved'
   - `profiles.role` = 'reseller'
3. User tries to login: ✅ Login succeeds
4. After login: ✅ Full dashboard access

## Security Notes

### Why This is Safe
1. ✅ User can login (authentication succeeds)
2. ✅ But dashboard access is blocked by status check (authorization fails)
3. ✅ They only see the account-blocked page with their status
4. ✅ Cannot access any reseller features (products, orders, etc.)
5. ✅ Status check happens on EVERY page load via layout

### How Status Check Works
```typescript
// In apps/web/app/(reseller)/reseller/actions.ts
export async function getResellerProfile() {
  // 1. Check authentication
  if (!user) redirect('/login')
  
  // 2. Check role
  if (profile.role !== 'reseller') redirect('/login')
  
  // 3. Check status - THIS IS THE KEY
  if (reseller.status !== 'approved') {
    redirect('/account-blocked')  // Shows appropriate message
  }
  
  // 4. If all checks pass, allow access
  return resellerProfile
}
```

## Benefits

### For Users
- ✅ Can login to see their account status
- ✅ Clear communication about why access is blocked
- ✅ Contact support information readily available
- ✅ Can sign out and try again later

### For Business
- ✅ Better user experience (no mysterious login failures)
- ✅ Reduced support tickets ("why can't I login?")
- ✅ Clear communication of account status
- ✅ Professional handling of rejected/suspended accounts

## Edge Cases

### New Registrations (Pending, Never Reviewed)
- Status: 'pending'
- Role: 'pending' (initial state)
- **Cannot login** until admin reviews
- Once admin changes status to ANYTHING (approved/rejected/suspended), role becomes 'reseller'
- Then user can login and see appropriate message

### Reactivation
- Admin changes: Suspended → Approved
- User can immediately access dashboard
- No need for user to re-login

## Files Modified
1. ✅ `apps/web/app/(admin)/admin/api/resellers/update-status/route.ts`
2. ✅ `RESELLER_STATUS_ACCESS_CONTROL.md` (documentation)

## Testing

Test these scenarios:
1. [ ] Create new reseller → Cannot login (role='pending')
2. [ ] Admin approves → User can login and access dashboard
3. [ ] Admin suspends → User can login but sees suspended message
4. [ ] Admin rejects → User can login but sees rejected message
5. [ ] Admin re-approves → User can access dashboard again
6. [ ] Each status shows correct message on account-blocked page
7. [ ] Sign out button works on blocked page

---

**Implementation Date:** Oct 27, 2025  
**Status:** ✅ Complete  
**Impact:** Improved UX - Users can login to see their account status even if suspended/rejected
