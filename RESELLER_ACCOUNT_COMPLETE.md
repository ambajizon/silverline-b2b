# ✅ Reseller Account Page - Complete Implementation

## 🎯 Summary

Built a complete account management page for resellers with profile editing, financial details display, address management, logo upload with progress, and password change flow with forced logout. All powered by real Supabase data.

## 📁 Files Created (7 Files)

### Server Actions
- ✅ **`app/(reseller)/reseller/account/actions.ts`** - 5 server actions:
  - `getAccountData()` - Fetch profile, reseller, financials
  - `updateProfile()` - Update shop name, contact name, phone
  - `updateAddress()` - Update business address
  - `updateLogoUrl()` - Update logo URL after upload
  - `changePassword()` - Update password + force sign out

### Page
- ✅ **`app/(reseller)/reseller/account/page.tsx`** - Server component page

### Components (5 components)
- ✅ **`components/reseller/account/ProfileCard.tsx`** - Profile info with edit mode + change password button
- ✅ **`components/reseller/account/FinancialCard.tsx`** - Read-only financial metrics (server component)
- ✅ **`components/reseller/account/AddressForm.tsx`** - Editable address textarea
- ✅ **`components/reseller/account/AvatarUploader.tsx`** - Logo upload with progress indicator
- ✅ **`components/reseller/account/ChangePasswordModal.tsx`** - Modal with password change + success state

## ✨ Key Features

### 👤 **Profile Card**

**Features**:
- ✅ Avatar/Logo uploader (click to upload)
- ✅ Business name (editable)
- ✅ Email address (read-only)
- ✅ Contact name (editable)
- ✅ Phone number (editable, 10 digits)
- ✅ Edit mode toggle
- ✅ "Change Password" button
- ✅ Inline validation
- ✅ Success/error messages

**UI States**:
```
View Mode:
  - All fields disabled
  - "Edit Profile" button
  - "Change Password" button

Edit Mode:
  - Fields enabled (except email)
  - "Cancel" button
  - "Save Changes" button
  - Shows loading state while saving
```

**Avatar/Logo**:
- Shows uploaded logo or initials
- Hover overlay with camera icon
- Click to select file
- Progress indicator during upload
- Auto-refresh on success

### 💰 **Financial Card** (Read-Only)

**Displays**:
- ✅ Credit Limit (₹)
- ✅ Discount (%)
- ✅ Extra Charges (%)
- ✅ Payment Terms (text)
- ✅ **Current Outstanding** (₹, red if > 0)

**Outstanding Balance**:
- Green if zero
- Red if non-zero
- Warning message if outstanding > 0

**Data Source**:
```typescript
// Try RPC first
const { data } = await supabase.rpc('get_reseller_financials', { reseller_id })

// Fallback: compute from orders
financials = {
  outstanding: sum of unpaid orders,
  paid_this_month: sum of paid orders this month,
  overdue: unpaid orders > 30 days old,
  aging_90: unpaid orders > 90 days old
}
```

### 📍 **Address Form**

**Features**:
- ✅ Single textarea for full address
- ✅ Edit mode toggle
- ✅ Save/Cancel buttons
- ✅ Success toast on save
- ✅ Inline errors

**UI**:
```
View Mode:
  - Textarea disabled
  - "Edit Address" button

Edit Mode:
  - Textarea enabled
  - "Cancel" + "Save Address" buttons
```

### 📷 **Logo Uploader**

**Features**:
- ✅ Upload to Supabase Storage bucket: `reseller-logos`
- ✅ Path: `{user_id}/{timestamp}.{ext}`
- ✅ Accept: PNG, JPG (max 2MB)
- ✅ Progress indicator (0% → 50% → 75% → 100%)
- ✅ Shows initials if no logo
- ✅ Hover overlay with camera icon
- ✅ Auto-refresh page on success
- ✅ Error handling (file type, size)

**Upload Flow**:
```
User clicks avatar → Select file
  ↓
Validate (type, size)
  ↓
Upload to Supabase Storage (progress 0-50%)
  ↓
Get public URL (progress 75%)
  ↓
Update resellers.logo_url (progress 100%)
  ↓
Refresh page
```

**Storage Structure**:
```
Bucket: reseller-logos
├── {user_id_1}/
│   ├── 1234567890.jpg
│   └── 1234567891.png
└── {user_id_2}/
    └── 1234567892.jpg
```

### 🔑 **Change Password Modal**

**Features**:
- ✅ 3 password fields:
  - Current Password (client-side only, not sent to server)
  - New Password (min 6 chars)
  - Confirm New Password
- ✅ Show/hide password toggles (eye icons)
- ✅ Client-side validation:
  - Min 6 characters
  - Passwords match
  - New ≠ Current
- ✅ Server-side password update
- ✅ **Force logout** after success
- ✅ Success state in modal
- ✅ "Logout" button to redirect to /login

**Flow**:
```
User clicks "Change Password"
  ↓
Modal opens with form
  ↓
User fills all 3 fields
  ↓
Client validates (length, match, different)
  ↓
Submit → Server: supabase.auth.updateUser({ password })
  ↓
Success → Server: supabase.auth.signOut()
  ↓
Modal shows success state:
  "Password updated! Please log in again."
  [Logout] button
  ↓
User clicks Logout → Redirect to /login
```

**Success State**:
```tsx
<div className="text-center">
  <CheckCircle icon (green) />
  <h2>Success</h2>
  <p>Your password has been changed successfully...</p>
  <button>Logout</button>
</div>
```

## 🗄️ Database Schema

### Resellers Table
```sql
resellers (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES profiles(id),
  shop_name text,
  contact_name text,
  phone text,
  address text,
  logo_url text,
  credit_limit numeric DEFAULT 0,
  discount_pct numeric DEFAULT 0,
  extra_charges_pct numeric DEFAULT 0,
  payment_terms text,
  created_at timestamptz DEFAULT NOW()
)
```

### Storage Bucket
```sql
-- Create bucket (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('reseller-logos', 'reseller-logos', true);

-- RLS policy for upload
CREATE POLICY "Resellers can upload their own logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'reseller-logos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- RLS policy for read
CREATE POLICY "Anyone can view reseller logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'reseller-logos');
```

### Optional RPC Function
```sql
CREATE OR REPLACE FUNCTION get_reseller_financials(reseller_id uuid)
RETURNS TABLE (
  outstanding numeric,
  paid_this_month numeric,
  overdue numeric,
  aging_90 numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(CASE WHEN payment_status = 'unpaid' OR payment_status IS NULL THEN total_amount ELSE 0 END), 0) as outstanding,
    COALESCE(SUM(CASE WHEN payment_status = 'paid' AND created_at >= date_trunc('month', CURRENT_DATE) THEN total_amount ELSE 0 END), 0) as paid_this_month,
    COALESCE(SUM(CASE WHEN (payment_status = 'unpaid' OR payment_status IS NULL) AND created_at < CURRENT_DATE - INTERVAL '30 days' THEN total_amount ELSE 0 END), 0) as overdue,
    COALESCE(SUM(CASE WHEN (payment_status = 'unpaid' OR payment_status IS NULL) AND created_at < CURRENT_DATE - INTERVAL '90 days' THEN total_amount ELSE 0 END), 0) as aging_90
  FROM orders
  WHERE orders.reseller_id = get_reseller_financials.reseller_id;
END;
$$ LANGUAGE plpgsql;
```

## 🎨 UI Design

### Mobile-First Layout
- ✅ Max width: 420px
- ✅ White cards with rounded corners
- ✅ Subtle shadows and borders
- ✅ Consistent spacing (space-y-4)

### Component Styling

**Profile Card**:
```tsx
<div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
  <h2 className="text-sm font-semibold text-slate-900 mb-4">Profile Info</h2>
  
  {/* Avatar + Name */}
  <div className="flex items-center gap-4 mb-4 pb-4 border-b border-slate-200">
    <AvatarUploader />
    <div>
      <p className="text-sm font-semibold">{shopName}</p>
      <p className="text-xs text-slate-500">{email}</p>
    </div>
  </div>
  
  {/* Form fields */}
  ...
</div>
```

**Financial Card**:
```tsx
<div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
  <h2 className="text-sm font-semibold text-slate-900 mb-4">Financial Details</h2>
  
  {/* Metrics */}
  <div className="space-y-3">
    <div className="flex justify-between">
      <span className="text-sm text-slate-600">Credit Limit</span>
      <span className="text-sm font-semibold text-slate-900">₹50,000</span>
    </div>
    ...
    {/* Outstanding */}
    <div className="flex justify-between">
      <span>Current Outstanding</span>
      <span className={outstanding > 0 ? 'text-red-600' : 'text-green-600'}>
        ₹{outstanding}
      </span>
    </div>
  </div>
</div>
```

**Avatar Uploader**:
```tsx
<button className="relative group">
  {/* Avatar */}
  <div className="w-16 h-16 rounded-full overflow-hidden bg-blue-100">
    {logoUrl ? <Image src={logoUrl} /> : <Initials />}
  </div>
  
  {/* Hover Overlay */}
  <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100">
    {uploading ? <Progress /> : <CameraIcon />}
  </div>
  
  {/* Upload spinner */}
  {uploading && <div className="animate-spin border-4 border-blue-600" />}
</button>
```

**Password Modal**:
```tsx
{/* Modal Backdrop */}
<div className="fixed inset-0 bg-black bg-opacity-50 z-50">
  {/* Modal Card */}
  <div className="bg-white rounded-lg max-w-md">
    {success ? (
      <SuccessState />
    ) : (
      <FormState />
    )}
  </div>
</div>
```

## 🔄 Complete User Flows

### 1. Edit Profile
```
/reseller/account
  ↓
Click "Edit Profile"
  ↓
Fields enabled (except email)
  ↓
User edits shop_name, contact_name, phone
  ↓
Click "Save Changes"
  ↓
Server: updateProfile({ shop_name, contact_name, phone })
  ↓
Success toast → Edit mode disabled
```

### 2. Upload Logo
```
Click avatar/logo
  ↓
File picker opens (PNG/JPG only)
  ↓
Select file (max 2MB)
  ↓
Validate → Upload to Supabase Storage
  ↓
Progress: 0% → 50% → 75%
  ↓
Update resellers.logo_url
  ↓
Progress: 100% → Refresh page
  ↓
New logo displayed
```

### 3. Change Password
```
Click "Change Password"
  ↓
Modal opens
  ↓
Enter: Current, New, Confirm
  ↓
Client validates (length, match, different)
  ↓
Submit → Server: updateUser({ password })
  ↓
Server: signOut()
  ↓
Modal shows success:
  "Password updated! Please log in again."
  [Logout] button
  ↓
Click Logout → /login
  ↓
User must log in with new password
```

### 4. Update Address
```
Click "Edit Address"
  ↓
Textarea enabled
  ↓
User edits address
  ↓
Click "Save Address"
  ↓
Server: updateAddress({ address })
  ↓
Success toast → Edit mode disabled
```

## ✅ Validation & Security

### Client-Side Validation
- ✅ Required fields: shop_name, new password
- ✅ Phone: 10 digits pattern
- ✅ Password: Min 6 characters
- ✅ Passwords match
- ✅ New password ≠ current password
- ✅ File type: PNG/JPG only
- ✅ File size: Max 2MB

### Server-Side Validation
- ✅ Auth guard: Only authenticated resellers
- ✅ User ownership: Can only edit own profile
- ✅ Data sanitization: Updates filtered by user_id
- ✅ Storage security: Upload to own folder only

### Security Features
- ✅ **Force logout** after password change
- ✅ **Row-level security** on resellers table
- ✅ **Storage policies** (upload to own folder only)
- ✅ Current password not sent to server (UX only)
- ✅ Password hashed by Supabase Auth

## 🧪 Testing Guide

### 1. View Account Test
```bash
# Navigate to account
/reseller/account

Expected: Profile card with avatar, name, email
Expected: Financial card with credit limit, discount, etc.
Expected: Address form with current address
Expected: All fields disabled (view mode)
```

### 2. Edit Profile Test
```bash
# Click "Edit Profile"
Expected: Fields enabled (except email)

# Edit fields
Change shop_name: "New Shop Name"
Change contact_name: "John Doe"
Change phone: "9876543210"

# Click "Save Changes"
Expected: Loading state
Expected: Success toast "Profile updated successfully!"
Expected: Fields disabled again
Expected: Data persisted (refresh page to verify)
```

### 3. Logo Upload Test
```bash
# Click avatar
Expected: File picker opens

# Select invalid file (PDF)
Expected: Error "Please select an image file (PNG or JPG)"

# Select large file (> 2MB)
Expected: Error "File size must be less than 2MB"

# Select valid file (logo.png, < 2MB)
Expected: Upload starts
Expected: Progress indicator (spinner)
Expected: Progress 0% → 50% → 75% → 100%
Expected: Page refreshes
Expected: New logo displayed
```

### 4. Change Password Test
```bash
# Click "Change Password"
Expected: Modal opens

# Enter passwords
Current: "oldpass123"
New: "newpass123"
Confirm: "newpass123"

# Click "Update Password"
Expected: Loading state
Expected: Success screen in modal
Expected: "Password updated! Please log in again."
Expected: [Logout] button

# Click Logout
Expected: Redirect to /login
Expected: Old password doesn't work
Expected: New password works
```

### 5. Financial Display Test
```sql
-- Set credit limit and discount
UPDATE resellers SET credit_limit = 100000, discount_pct = 5, extra_charges_pct = 2, payment_terms = 'Net 30' WHERE id = 'reseller-id';

-- Create unpaid order (outstanding)
INSERT INTO orders (reseller_id, total_amount, payment_status) VALUES ('reseller-id', 5000, 'unpaid');

# Refresh account page
Expected: Credit Limit: ₹1,00,000
Expected: Discount: 5%
Expected: Extra Charges: 2%
Expected: Payment Terms: Net 30
Expected: Current Outstanding: ₹5,000 (in red)
Expected: Warning message about outstanding balance
```

### 6. Address Update Test
```bash
# Click "Edit Address"
Expected: Textarea enabled

# Edit address
Change to: "123 New Street, New City, State - 123456"

# Click "Save Address"
Expected: Loading state
Expected: Success toast "Address updated successfully!"
Expected: Textarea disabled
Expected: New address displayed
```

## 🚀 Performance Optimizations

1. **Server Components**: Page is server component (SSR)
2. **Client Components**: Only interactive parts (forms, uploader, modal)
3. **Image Optimization**: Next/Image for avatars
4. **Optimistic Updates**: Logo refresh after upload
5. **Form Validation**: Client-side first (fast feedback)
6. **Storage CDN**: Public URLs cached by Supabase

## 🔒 Security Checklist

- ✅ Auth guard on page
- ✅ Row-level security on resellers table
- ✅ Storage bucket policies (upload to own folder)
- ✅ File type validation
- ✅ File size limits
- ✅ Password strength (min 6 chars)
- ✅ Force logout after password change
- ✅ No password sent in plain text (Supabase Auth handles)
- ✅ User can only edit own data

## 📝 Next Steps (Future Enhancements)

1. **Two-Factor Authentication**: Add 2FA support
2. **Profile Picture Crop**: Allow crop before upload
3. **Activity Log**: Show recent account activities
4. **Email Verification**: Require verification for email changes
5. **Password Strength Meter**: Visual indicator
6. **Session Management**: Show active sessions, allow logout all
7. **Notification Preferences**: Email/SMS settings
8. **API Keys**: Generate API keys for integrations

## 🎓 Developer Notes

### Adding New Profile Fields
```typescript
// 1. Add to database
ALTER TABLE resellers ADD COLUMN new_field text;

// 2. Update getAccountData() return type
reseller: {
  // ... existing fields
  new_field: string | null
}

// 3. Add to ProfileCard form
<input
  value={formData.new_field}
  onChange={(e) => setFormData({ ...formData, new_field: e.target.value })}
/>

// 4. Update updateProfile() action
await supabase.from('resellers').update({
  // ... existing fields
  new_field: form.new_field
})
```

### Storage Bucket Setup
```bash
# 1. Create bucket in Supabase dashboard
Bucket name: reseller-logos
Public: Yes

# 2. Set up policies (see Database Schema section)

# 3. Configure CORS (if needed)
Allowed origins: *
```

### Custom Financials Calculation
```typescript
// Override in getAccountData()
const customFinancials = {
  outstanding: await calculateCustomOutstanding(reseller.id),
  credit_available: reseller.credit_limit - outstanding,
  utilization_pct: (outstanding / reseller.credit_limit) * 100,
}
```

---

**Status**: ✅ Complete  
**Auth**: ✅ Secured  
**Upload**: ✅ Working with progress  
**Password Change**: ✅ Force logout  
**Mobile**: ✅ Optimized  
**No Mocks**: ✅ All real data  

The complete Reseller Account page is production-ready with full profile management! 👤💼🔐
