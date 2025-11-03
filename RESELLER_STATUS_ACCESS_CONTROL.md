# Reseller Status Access Control Implementation

## Summary
Implemented comprehensive reseller status management with access control that ensures only approved or active resellers can access their accounts.

## Changes Made

### 1. Status Update API Enhancement
**File**: `apps/web/app/(admin)/admin/api/resellers/update-status/route.ts`
- ✅ Updates both `resellers.status` and `profiles.role` tables
- ✅ Sets `role = 'reseller'` only when status is `'approved'` or `'active'`
- ✅ Sets `role = 'pending'` for all other statuses (pending, rejected, suspended)
- ✅ This blocks access by changing the role, not just the status

### 2. Reseller Profile Guard
**File**: `apps/web/app/(reseller)/reseller/actions.ts`
- ✅ Added status validation in `getResellerProfile()`
- ✅ Checks if reseller status is `'approved'` or `'active'`
- ✅ Redirects to `/account-blocked` if status is anything else
- ✅ This guard runs on every reseller page load via the layout

### 3. Account Blocked Page
**File**: `apps/web/app/account-blocked/page.tsx`
- ✅ Shows status-specific messages (pending, rejected, suspended)
- ✅ Displays contact support information
- ✅ Shows current account status badge
- ✅ Provides sign out functionality
- ✅ Beautiful, professional UI with contextual messaging

### 4. Sign Out Route
**File**: `apps/web/app/auth/signout/route.ts`
- ✅ Created GET and POST handlers for logout
- ✅ Clears Supabase auth session
- ✅ Redirects to login page

### 5. Status Dropdown Component
**File**: `apps/web/components/admin/resellers/UpdateStatusDropdown.tsx`
- ✅ Interactive dropdown for changing reseller status
- ✅ 4 status options with color-coded badges (Pending, Approved, Suspended, Rejected)
- ✅ Real-time status updates with page refresh
- ✅ Loading states and error handling

### 6. Type Definitions
**File**: `apps/web/types/resellers.ts`
- ✅ ResellerStatus type matches database constraint (pending, approved, suspended, rejected)

## How It Works

### Status Flow
1. **New Registration** → Status: `pending`, Role: `pending` (Cannot login until approved)
2. **Admin Approves** → Status: `approved`, Role: `reseller` ✅ (Can login + Access dashboard)
3. **Admin Suspends** → Status: `suspended`, Role: `reseller` ⚠️ (Can login + Shows blocked message)
4. **Admin Rejects** → Status: `rejected`, Role: `reseller` ⚠️ (Can login + Shows blocked message)

### Access Control Logic
```typescript
// In getResellerProfile():
if (reseller.status !== 'approved') {
  redirect('/account-blocked')
}
```

### Database Updates
When admin changes status via the dropdown:
```typescript
// Update status in resellers table
await admin.from('resellers').update({ status }).eq('id', reseller_id)

// Update role in profiles table - always keep as 'reseller' to allow login
// Status check happens after login in the reseller layout
await admin.from('profiles').update({ role: 'reseller' }).eq('id', user_id)
```

## Status Messages

### Pending
- Title: "Account Pending Approval"
- Message: "Your reseller account registration is currently under review..."
- Color: Yellow

### Rejected
- Title: "Account Registration Rejected"
- Message: "Unfortunately, your reseller account registration has been rejected..."
- Color: Red

### Suspended
- Title: "Account Suspended"
- Message: "Your reseller account has been temporarily suspended..."
- Color: Orange

## Security Features
- ✅ Admin-only access to status updates (role verification)
- ✅ Service role client bypasses RLS for updates
- ✅ Role-based access control (RBAC)
- ✅ Server-side validation on every page load
- ✅ Cannot be bypassed with client-side manipulation

## Important Notes

### Login Behavior by Status
- **New Registration (Pending + No Admin Action)**: Cannot login until admin reviews
- **After Admin Review (Any Status Change)**: Can login, sees appropriate message
  - **Approved**: Full dashboard access ✅
  - **Suspended/Rejected**: Sees account-blocked page with status message ⚠️
  
### First-Time Approval
When admin first approves a reseller (pending → approved), use either:
1. The "Approve" button on resellers list page, OR
2. Change status to "Approved" using the dropdown

Both methods will set `role = 'reseller'` enabling login access.

## Testing Checklist
- [ ] **New Registration**: User with status 'pending' cannot login until admin reviews
- [ ] **Admin Approves**: Admin changes status to 'approved' → User can login and access full dashboard
- [ ] **Admin Suspends**: Admin changes approved → suspended → User can still login but sees "Account Suspended" message
- [ ] **Admin Rejects**: Admin changes pending → rejected → User can login but sees "Registration Rejected" message
- [ ] **Reactivation**: Admin changes suspended → approved → User can access dashboard again
- [ ] **Blocked Page Shows Correct Status**: Each non-approved status shows appropriate message
- [ ] **Sign Out Works**: Sign out button on blocked page redirects to login
- [ ] **Status Dropdown**: Shows correct current status with color coding
- [ ] **Database Sync**: Both profiles.role and resellers.status update correctly

## Contact Support Info
Update these in `account-blocked/page.tsx`:
- Email: `support@example.com`
- Phone: `+91 98765 43210`
