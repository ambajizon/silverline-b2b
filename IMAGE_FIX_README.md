# Product Images Fix - Implementation Summary

## ✅ What Was Fixed

Product thumbnails weren't rendering from Supabase storage because:
1. Images were stored as relative paths (e.g., `/storage/v1/object/public/product-images/ring-1.jpg`)
2. Next.js Image component requires absolute URLs
3. Supabase storage domain wasn't allowed in Next.js remote patterns

## 📝 Changes Made

### 1. Created Image Helper (`apps/web/lib/images.ts`)

```typescript
export function toPublicUrl(pathOrUrl: string): string {
  if (!pathOrUrl) return ''
  
  // Already absolute URL
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    return pathOrUrl
  }
  
  // Convert stored path to absolute URL
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}${pathOrUrl}`
}
```

**Usage**: Converts relative storage paths to absolute URLs that Next.js Image can use.

### 2. Updated Next.js Config (`apps/web/next.config.ts`)

Added Supabase storage domain to allowed remote patterns:

```typescript
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
}
```

**Important**: After changing `next.config.ts`, you must **restart the dev server** completely.

### 3. Updated Components

#### `components/admin/products/ProductsTable.tsx`
- Added `import { toPublicUrl } from '@/lib/images'`
- Changed: `src={product.images[0]}` → `src={toPublicUrl(product.images[0])}`

#### `components/admin/products/ImageUploader.tsx`
- Added `import { toPublicUrl } from '@/lib/images'`
- Changed: `src={url}` → `src={toPublicUrl(url)}`

## 🔧 Required Configuration

### Environment Variables

Ensure your `apps/web/.env.local` contains:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

**Example**:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xyzabcdef123456.supabase.co
```

**How to find your project ref**:
1. Go to your Supabase dashboard
2. Click on your project
3. Go to Settings → API
4. Copy the "Project URL" (it's your NEXT_PUBLIC_SUPABASE_URL)

### Restart Dev Server

After making these changes, **you must restart your dev server**:

```bash
# Stop the current dev server (Ctrl+C)
# Then restart
npm run dev
```

## 🧪 Testing Checklist

### 1. Verify Environment Variable
```bash
# In your terminal (from apps/web)
echo $NEXT_PUBLIC_SUPABASE_URL
# Should output: https://<your-project-ref>.supabase.co
```

### 2. Test Direct Image URL
Open in browser:
```
https://<your-project-ref>.supabase.co/storage/v1/object/public/product-images/<image-filename>
```

Should return 200 and display the image.

### 3. Test in Application
- [ ] Navigate to `/admin/products`
- [ ] Verify product thumbnails display in the table
- [ ] Click "Add Product" and upload an image
- [ ] Verify uploaded image preview shows correctly
- [ ] Edit an existing product
- [ ] Verify all existing images display in the form

### 4. Debugging Steps

**If images still don't show**:

1. **Check browser console** for errors:
   - Open DevTools (F12)
   - Look for image load errors
   - Check the actual src URL being used

2. **Verify Next.js config was applied**:
   - Stop dev server completely
   - Delete `.next` folder: `rm -rf .next`
   - Restart: `npm run dev`

3. **Test with regular img tag**:
   ```tsx
   <img src={toPublicUrl(product.images?.[0] ?? '')} width={48} height={48} />
   ```
   If this works but `<Image>` doesn't, it's a Next.js config issue.

4. **Check environment variable in browser**:
   ```tsx
   console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
   ```
   Should output your Supabase URL, not `undefined`.

## 📊 How It Works

### Before Fix
```
Database: "/storage/v1/object/public/product-images/ring-1.jpg"
         ↓
Component: <Image src="/storage/v1/object/public/..." />
         ↓
Browser: Tries to load from localhost/storage/... ❌ 404
```

### After Fix
```
Database: "/storage/v1/object/public/product-images/ring-1.jpg"
         ↓
toPublicUrl(): "https://xyz.supabase.co/storage/v1/object/public/..."
         ↓
Component: <Image src="https://xyz.supabase.co/storage/..." />
         ↓
Browser: Loads from Supabase storage ✅ 200
```

## 🔒 Storage Bucket Configuration

Your `product-images` bucket should have:

**Bucket Settings**:
- Public: ✅ Yes
- Allowed MIME types: image/* (or leave empty for all)

**RLS Policies**:
```sql
-- Public read access
create policy "Public can view product images"
on storage.objects for select
to public
using (bucket_id = 'product-images');

-- Authenticated write access
create policy "Authenticated users can upload product images"
on storage.objects for insert
to authenticated
with check (bucket_id = 'product-images');
```

## 🎯 What Changed in Each Component

### ProductsTable.tsx
**Before**:
```tsx
<Image src={product.images[0]} ... />
```

**After**:
```tsx
import { toPublicUrl } from '@/lib/images'
<Image src={toPublicUrl(product.images[0])} ... />
```

### ImageUploader.tsx
**Before**:
```tsx
<Image src={url} ... />
```

**After**:
```tsx
import { toPublicUrl } from '@/lib/images'
<Image src={toPublicUrl(url)} ... />
```

## 🚀 Future Considerations

### Image Storage Strategy

Currently, images are stored with absolute URLs from `getPublicUrl()`. You could also:

1. **Store relative paths only** (current approach after upload):
   - DB: `/storage/v1/object/public/product-images/uuid.jpg`
   - Rendered: `toPublicUrl()` converts to absolute
   - ✅ Portable across environments

2. **Store absolute URLs**:
   - DB: `https://xyz.supabase.co/storage/v1/object/public/...`
   - Rendered: Already absolute, but still use `toPublicUrl()` for safety
   - ❌ Hard to migrate between projects

**Recommendation**: Continue using relative paths + `toPublicUrl()` helper for flexibility.

## 📋 Quick Reference

### Helper Function Location
```
apps/web/lib/images.ts
```

### Components Updated
```
apps/web/components/admin/products/ProductsTable.tsx
apps/web/components/admin/products/ImageUploader.tsx
```

### Config File
```
apps/web/next.config.ts
```

### Required Environment Variable
```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
```

---

**Fix Date**: 2025-01-26  
**Status**: ✅ Complete  
**Next Step**: Restart dev server and test product images
