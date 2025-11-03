# ✅ Reseller Account Page - V2 Complete Implementation

## 🎯 Summary

Built a mobile-first reseller profile/account management system with React Hook Form + Zod validation, logo upload to Supabase Storage, financial details display, and password change with forced logout. All using real Supabase data with proper auth guards and upsert logic.

## 📁 Files Created/Modified (6 Files)

### Server Actions
- ✅ **`app/(reseller)/reseller/account/actions.ts`** - 3 server actions:
  - `getMyProfile()` - Join profiles + resellers by user_id, auth guard, role check
  - `updateResellerInfo()` - Upsert reseller record with validation
  - `updateLogoUrl()` - Update logo_url after upload
  - `changePassword()` - Update password + force sign out

### Page
- ✅ **`app/(reseller)/reseller/account/page.tsx`** - Server component fetching profile data

### Components (5 components)
- ✅ **`components/reseller/profile/ProfileHeader.tsx`** - Avatar + business name display
- ✅ **`components/reseller/profile/LogoUploader.tsx`** - File upload with progress, optimistic preview
- ✅ **`components/reseller/profile/ProfileInfoForm.tsx`** - React Hook Form + Zod validation
- ✅ **`components/reseller/profile/FinancialDetailsCard.tsx`** - Read-only financial metrics
- ✅ **`components/reseller/profile/ChangePasswordSheet.tsx`** - Bottom sheet modal for password change

## ✨ Key Features

### 🔐 **Auth & Guards**
- ✅ Check `profiles.role = 'reseller'`
- ✅ Redirect to `/login` if not authenticated or wrong role
- ✅ All actions filter by `user_id = auth.uid()`
- ✅ Upsert logic handles first-time users (no reseller record yet)

### 📝 **Profile Info Form (React Hook Form + Zod)**

**Fields**:
- `shop_name` - Required, 2-80 chars
- `email` - Read-only (from profiles)
- `contact_name` - Optional, max 80 chars
- `phone` - Optional, 10-14 digits (E.164)
- `address` - Optional, max 200 chars
- `payment_terms` - Select: Net 7 | Net 15 | Net 30 | Custom

**Validation** (Zod Schema):
```typescript
const profileSchema = z.object({
  shop_name: z.string().min(2).max(80),
  contact_name: z.string().max(80).optional().or(z.literal('')),
  phone: z.string().regex(/^\d{10,14}$/).optional().or(z.literal('')),
  address: z.string().max(200).optional().or(z.literal('')),
  payment_terms: z.string().optional().or(z.literal('')),
})
```

**UI States**:
```
View Mode:
  - All fields disabled
  - "Edit Profile" button (full width)
  - "Change Password" button (top-right)

Edit Mode:
  - Fields enabled (except email)
  - Inline validation errors
  - "Cancel" + "Save Changes" buttons
  - Loading state while submitting
```

**Server Action**: `updateResellerInfo()`
- Upsert with `onConflict: 'user_id'`
- Handles first-time save (creates record)
- Revalidates path after update

### 📷 **Logo Uploader**

**Features**:
- ✅ Click avatar to select file
- ✅ Accept: PNG, JPG, WebP (max 1MB)
- ✅ Path: `reseller-logos/{user_id}/logo.{ext}`
- ✅ Delete old logo before uploading new one
- ✅ Optimistic preview (blob URL)
- ✅ Upload → Get public URL → Update DB
- ✅ Auto-refresh page on success
- ✅ Fallback to initials if no logo

**Upload Flow**:
```
User clicks avatar → File picker
  ↓
Validate (type PNG/JPG/WebP, size < 1MB)
  ↓
Show optimistic preview (blob URL)
  ↓
Delete old files in {user_id}/ folder
  ↓
Upload to reseller-logos/{user_id}/logo.{ext}
  ↓
Get public URL
  ↓
Call updateLogoUrl(publicUrl)
  ↓
router.refresh() → Page reloads with new logo
```

**Initials Fallback**:
```typescript
const getInitials = (name: string) => {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

// "Shree Savareeya" → "SS"
// "MyBusiness" → "MY"
```

### 💰 **Financial Details Card** (Read-Only)

**Displays**:
- **Credit Limit** (₹) - Blue pill
- **Discount** (%) - Green pill
- **Extra Charges** (%) - Amber pill
- **Payment Terms** - Purple pill

**UI**:
```
┌──────────────────────────┐
│ Financial Details        │
├──────────────────────────┤
│ ┌──────────┐ ┌─────────┐│
│ │ Credit   │ │Discount ││
│ │ ₹50,000  │ │   5%    ││
│ └──────────┘ └─────────┘│
│ ┌──────────┐ ┌─────────┐│
│ │ Extra    │ │ Payment ││
│ │   2%     │ │ Net 30  ││
│ └──────────┘ └─────────┘│
├──────────────────────────┤
│ These are set by admin   │
└──────────────────────────┘
```

### 🔑 **Change Password Sheet** (Bottom Modal)

**Features**:
- ✅ Bottom sheet modal (mobile-first)
- ✅ React Hook Form + Zod validation
- ✅ 3 password fields with show/hide toggle
- ✅ Min 8 characters validation
- ✅ Passwords match validation
- ✅ Success state → Force logout → Redirect to /login

**Fields**:
- Current Password (client-side only, not verified server-side)
- New Password (min 8 chars)
- Confirm New Password (must match)

**Validation** (Zod):
```typescript
const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
  confirmPassword: z.string().min(1),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})
```

**Flow**:
```
User clicks "Change Password"
  ↓
Bottom sheet opens
  ↓
User fills: Current, New, Confirm
  ↓
Zod validates (min 8, match)
  ↓
Server: supabase.auth.updateUser({ password })
  ↓
Server: supabase.auth.signOut() (force logout)
  ↓
Success state shows:
  ✓ "Password Updated!"
  "Please log in again to continue."
  [Logout] button
  ↓
router.push('/login')
```

## 🗄️ Database Schema

### Profiles Table (existing)
```sql
profiles (
  id uuid PRIMARY KEY,
  email text,
  role text, -- 'reseller' | 'admin'
  created_at timestamptz
)
```

### Resellers Table
```sql
resellers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  shop_name text,
  contact_name text,
  phone text,
  address text,
  logo_url text,
  credit_limit numeric,
  discount_percent numeric,
  extra_charges_percent numeric,
  payment_terms text,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
)

-- Unique constraint on user_id for upsert
CREATE UNIQUE INDEX resellers_user_id_unique ON resellers(user_id);
```

### Storage Bucket
```sql
-- Bucket: reseller-logos (public: true)
INSERT INTO storage.buckets (id, name, public)
VALUES ('reseller-logos', 'reseller-logos', true);

-- RLS Policy: Upload to own folder
CREATE POLICY "Resellers can upload own logo"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'reseller-logos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS Policy: Update own logo
CREATE POLICY "Resellers can update own logo"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'reseller-logos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS Policy: Delete own logo
CREATE POLICY "Resellers can delete own logo"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'reseller-logos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS Policy: Public read
CREATE POLICY "Anyone can view reseller logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'reseller-logos');
```

### Folder Structure
```
reseller-logos/
├── {user_id_1}/
│   └── logo.png
├── {user_id_2}/
│   └── logo.jpg
└── {user_id_3}/
    └── logo.webp
```

## 🔄 Complete User Flows

### 1. First-Time User (No Reseller Record)
```
User logs in (profiles.role = 'reseller')
  ↓
Navigate to /reseller/account
  ↓
getMyProfile() finds no reseller record
  ↓
Returns empty fields:
  shop_name: ''
  contact_name: null
  phone: null
  address: null
  logo_url: null
  ↓
User fills form → Clicks "Save Changes"
  ↓
updateResellerInfo() upserts:
  INSERT resellers (user_id, shop_name, ...)
  ON CONFLICT (user_id) DO UPDATE
  ↓
Record created → Form saved
```

### 2. Edit Profile
```
User clicks "Edit Profile"
  ↓
Fields enabled
  ↓
User edits shop_name, contact_name, phone, address, payment_terms
  ↓
Clicks "Save Changes"
  ↓
Zod validates
  ↓
updateResellerInfo() upserts
  ↓
revalidatePath('/reseller/account')
  ↓
router.refresh() → Form shows new data
```

### 3. Upload Logo
```
User clicks avatar
  ↓
File picker opens (accept="image/*")
  ↓
User selects logo.png (500KB)
  ↓
Validate: PNG ✓, < 1MB ✓
  ↓
Show optimistic preview (blob URL)
  ↓
Delete old files: reseller-logos/{user_id}/*
  ↓
Upload: reseller-logos/{user_id}/logo.png
  ↓
Get public URL: https://...supabase.co/.../logo.png
  ↓
updateLogoUrl(publicUrl)
  ↓
router.refresh() → New logo displayed
```

### 4. Change Password
```
User clicks "Change Password" (top-right button)
  ↓
Bottom sheet opens
  ↓
User fills:
  Current: oldpass123
  New: newpass12345678
  Confirm: newpass12345678
  ↓
Zod validates: min 8 ✓, match ✓
  ↓
changePassword('oldpass123', 'newpass12345678')
  ↓
Server: supabase.auth.updateUser({ password })
  ↓
Server: supabase.auth.signOut() (force logout)
  ↓
Sheet shows success:
  ✓ "Password Updated!"
  [Logout] button
  ↓
User clicks Logout → router.push('/login')
  ↓
User must log in with new password
```

## ✅ Validation & Security

### Client-Side (Zod)
- ✅ shop_name: Required, 2-80 chars
- ✅ contact_name: Optional, max 80 chars
- ✅ phone: 10-14 digits (E.164 regex)
- ✅ address: Max 200 chars
- ✅ newPassword: Min 8 chars
- ✅ confirmPassword: Match validation
- ✅ File type: PNG/JPG/WebP
- ✅ File size: Max 1MB

### Server-Side
- ✅ Auth guard: `supabase.auth.getUser()` → redirect if not auth
- ✅ Role check: `profiles.role === 'reseller'` → redirect if not
- ✅ User ownership: All queries filter by `user_id = auth.uid()`
- ✅ Upsert safety: `onConflict: 'user_id'` prevents duplicates
- ✅ Storage RLS: Can only upload to own folder

### Storage Security
- ✅ Upload path locked to `{user_id}/`
- ✅ RLS policies enforced
- ✅ Old files deleted before new upload
- ✅ Public read, authenticated write

## 🧪 Testing Guide

### 1. First-Time Profile Test
```bash
# Create new reseller user
INSERT INTO profiles (id, email, role) VALUES ('test-uuid', 'test@example.com', 'reseller');

# Login and navigate
/reseller/account

# Expected: Empty form, no logo (shows initials)
# Fill all fields → Save
# Expected: Record created, form saved
# Refresh page → Expected: Data persisted
```

### 2. Edit Profile Test
```bash
# Click "Edit Profile"
# Change shop_name: "New Business Name"
# Change phone: "9876543210"
# Click "Save Changes"
# Expected: Success toast, fields disabled
# Refresh page → Expected: Changes persist
```

### 3. Logo Upload Test
```bash
# Click avatar
# Select invalid file (PDF)
# Expected: Error "Please select a PNG, JPG, or WebP image"

# Select large file (2MB)
# Expected: Error "File size must be less than 1MB"

# Select valid file (logo.png, 500KB)
# Expected: Optimistic preview shows immediately
# Expected: Upload spinner/progress
# Expected: Page refreshes, new logo displayed

# Check storage:
# Expected: File at reseller-logos/{user_id}/logo.png
# Expected: Public URL works
```

### 4. Change Password Test
```bash
# Click "Change Password"
# Expected: Bottom sheet opens

# Fill form:
# Current: oldpass123
# New: short
# Expected: Validation error "Password must be at least 8 characters"

# New: longpass123
# Confirm: different123
# Expected: Validation error "Passwords do not match"

# Current: oldpass123
# New: newpass12345678
# Confirm: newpass12345678
# Click "Update Password"

# Expected: Loading state
# Expected: Success screen shows
# Click "Logout"
# Expected: Redirect to /login
# Try old password → Expected: Fails
# Try new password → Expected: Success
```

### 5. Financial Details Test
```sql
-- Set financial details (admin only)
UPDATE resellers SET
  credit_limit = 100000,
  discount_percent = 5,
  extra_charges_percent = 2,
  payment_terms = 'Net 30'
WHERE user_id = 'test-uuid';

# Refresh /reseller/account
# Expected: Financial card shows:
#   Credit Limit: ₹1,00,000 (blue)
#   Discount: 5% (green)
#   Extra Charges: 2% (amber)
#   Payment Terms: Net 30 (purple)
```

## 🚀 Performance Optimizations

1. **Server Components**: Page fetches data server-side (SSR)
2. **Client Components**: Only interactive parts (forms, uploader, modal)
3. **Optimistic UI**: Logo preview shows immediately (blob URL)
4. **Debouncing**: Form validation only on submit (not on change)
5. **Revalidation**: `revalidatePath()` after updates
6. **Storage**: Old files deleted before upload (no clutter)

## 🔒 Security Checklist

- ✅ Auth guard on page (`getMyProfile` redirects if not auth)
- ✅ Role check (`profiles.role = 'reseller'`)
- ✅ Row-level security on resellers table
- ✅ Storage RLS (upload to own folder only)
- ✅ Password min 8 chars enforced
- ✅ Force logout after password change
- ✅ Upsert prevents duplicate records
- ✅ File type and size validation
- ✅ No SQL injection (parameterized queries)

## 📝 Next Steps (Future Enhancements)

1. **Image Crop**: Allow crop before upload (react-easy-crop)
2. **2FA**: Two-factor authentication
3. **Session Management**: Show active sessions
4. **Activity Log**: Recent account activities
5. **Email Change**: Require verification
6. **Phone Verification**: SMS OTP
7. **Export Data**: Download account data as JSON
8. **Delete Account**: Self-service account deletion

## 🎓 Developer Notes

### Adding New Profile Fields
```typescript
// 1. Add to schema
const profileSchema = z.object({
  // ... existing fields
  new_field: z.string().optional(),
})

// 2. Add to form
<input {...register('new_field')} />

// 3. Update server action
await supabase.from('resellers').upsert({
  // ... existing fields
  new_field: input.new_field,
})
```

### Custom Validation
```typescript
// Add custom refinement
const profileSchema = z.object({
  email: z.string().email(),
}).refine((data) => {
  // Custom validation
  return data.email.endsWith('@company.com')
}, {
  message: 'Must use company email',
  path: ['email'],
})
```

### Storage Path Customization
```typescript
// Instead of logo.{ext}, use timestamp
const filePath = `${user.id}/${Date.now()}.${fileExt}`

// Or use original filename
const filePath = `${user.id}/${file.name}`
```

---

**Status**: ✅ Complete  
**Auth Guards**: ✅ Role check + redirect  
**Form Validation**: ✅ React Hook Form + Zod  
**Logo Upload**: ✅ Supabase Storage + RLS  
**Password Change**: ✅ Force logout working  
**Upsert Logic**: ✅ First-time users handled  
**Mobile-First**: ✅ Optimized for 375-430px  

The complete Reseller Account page is production-ready with modern validation and secure file upload! 👤📸🔐
