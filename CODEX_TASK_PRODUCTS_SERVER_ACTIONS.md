# CODEX TASK: Implement Products Server Actions

## ✅ COMPLETED (You Already Did This)
- [x] Database tables created (categories, subcategories, products)
- [x] RLS policies enabled (15 policies)
- [x] Sample data inserted (6 categories, 11 subcategories, 3 products)
- [x] UI components exist (all admin/reseller pages)
- [x] Type definitions exist (`types/products.ts`)
- [x] Form validation exists (`lib/validations/product.ts`)

---

## 🎯 YOUR TASK: Implement Missing Server Actions

### **Location:** `apps/web/app/(admin)/admin/products/actions.ts`

This file already exists but needs these functions implemented or verified:

---

## 📝 FUNCTIONS TO IMPLEMENT/VERIFY

### **1. Product CRUD Operations**

#### ✅ Check if these exist and work:

```typescript
export async function getProducts(filters: ProductFilters): Promise<ActionResult<{ products: ProductWithCategory[], total: number }>>
```
- Fetch products with pagination
- Join with categories and subcategories
- Apply filters (status, category, subcategory, search)
- Return products array + total count

#### ✅ Check if these exist and work:

```typescript
export async function getProductById(id: string): Promise<ActionResult<Product>>
```
- Fetch single product by ID
- Return product or error

```typescript
export async function createProduct(data: ProductFormData): Promise<ActionResult<{ id: string }>>
```
- Verify user is admin
- Validate all fields (use Zod schema)
- Insert product into database
- Revalidate paths: `/admin/products`, `/reseller/products`
- Return product ID

```typescript
export async function updateProduct(id: string, data: ProductFormData): Promise<ActionResult>
```
- Verify user is admin
- Validate all fields
- Update product
- Revalidate paths
- Return success/error

```typescript
export async function updateProductStatus(id: string, status: 'active' | 'inactive'): Promise<ActionResult>
```
- Verify user is admin
- Update only status field
- Revalidate paths
- Return success/error

```typescript
export async function deleteProduct(id: string): Promise<ActionResult>
```
- Verify user is admin
- Check if product is in any orders (warn if yes)
- Delete product
- Optionally delete associated images from storage
- Revalidate paths
- Return success/error

```typescript
export async function getProductStats(): Promise<ActionResult<ProductStats>>
```
- Count active products
- Count products with offers
- Return stats object: `{ active: number, with_offers: number, low_stock: number }`

---

### **2. Category & Subcategory Operations**

#### ✅ These already exist in `apps/web/app/(admin)/admin/categories/actions.ts`

Check if these work correctly:
- `getAllCategories()`
- `createCategory()`
- `updateCategory()`
- `deleteCategory()`
- `createSubcategory()`
- `updateSubcategory()`
- `deleteSubcategory()`

**If they don't work, fix them!**

---

### **3. Image Upload (If Not Implemented)**

**Location:** `apps/web/app/(admin)/admin/products/actions.ts`

```typescript
export async function uploadProductImage(productId: string, file: File): Promise<ActionResult<string>>
```
- Verify user is admin
- Generate unique filename: `${productId}/${Date.now()}.${ext}`
- Upload to `product-images` bucket
- Get public URL
- Return image URL

```typescript
export async function deleteProductImage(path: string): Promise<ActionResult>
```
- Verify user is admin
- Remove from storage bucket
- Return success/error

---

## 🔧 IMPLEMENTATION NOTES

### **Database Schema Reference**

#### **Products Table:**
```typescript
{
  id: UUID
  name: TEXT
  description: TEXT
  category_id: UUID (FK → categories.id)
  subcategory_id: UUID (FK → subcategories.id, nullable)
  tunch_percentage: DECIMAL(5,2) // 0-100
  labor_per_kg: INTEGER // whole number only
  weight_ranges: JSONB // array of {min, max}
  images: TEXT[] // array of URLs
  hsn_code: TEXT
  status: TEXT // 'active' | 'inactive'
  offer_enabled: BOOLEAN
  offer_type: TEXT // 'percentage' | 'fixed'
  offer_value: DECIMAL(10,2)
  offer_text: TEXT
  offer_valid_from: TIMESTAMPTZ
  offer_valid_till: TIMESTAMPTZ
  created_at: TIMESTAMPTZ
  updated_at: TIMESTAMPTZ
}
```

#### **Categories Table:**
```typescript
{
  id: UUID
  name: TEXT (UNIQUE)
  slug: TEXT (UNIQUE)
  description: TEXT
  image_url: TEXT
  display_order: INTEGER
  is_active: BOOLEAN
  created_at: TIMESTAMPTZ
  updated_at: TIMESTAMPTZ
}
```

#### **Subcategories Table:**
```typescript
{
  id: UUID
  category_id: UUID (FK)
  name: TEXT
  slug: TEXT
  description: TEXT
  image_url: TEXT
  display_order: INTEGER
  is_active: BOOLEAN
  created_at: TIMESTAMPTZ
  updated_at: TIMESTAMPTZ
}
```

---

### **Admin Verification Helper**

Use this pattern in all mutations:

```typescript
import { supabaseServer } from '@/lib/supabase-server'

async function verifyAdmin(): Promise<boolean> {
  const supabase = await supabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return false
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  return profile?.role === 'admin'
}
```

Or check if there's already an `isAdmin()` helper in your codebase.

---

### **Revalidation**

After any mutation (create/update/delete), revalidate these paths:

```typescript
import { revalidatePath } from 'next/cache'

revalidatePath('/admin/products')
revalidatePath('/admin/categories')
revalidatePath('/reseller/products')
```

---

### **Image Upload Example**

```typescript
export async function uploadProductImage(productId: string, file: File): Promise<ActionResult<string>> {
  const authorized = await verifyAdmin()
  if (!authorized) return { ok: false, error: 'Unauthorized' }

  try {
    const supabase = await supabaseServer()
    
    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${productId}/${Date.now()}.${fileExt}`
    
    // Upload to storage
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(fileName, file)
    
    if (error) throw error
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(data.path)
    
    return { ok: true, data: urlData.publicUrl }
  } catch (error: any) {
    return { ok: false, error: error.message }
  }
}
```

---

## 🧪 TESTING REQUIREMENTS

### **Test Each Function:**

#### **Products:**
1. ✅ Admin can view all products (active + inactive)
2. ✅ Admin can create product with all fields
3. ✅ Admin can upload images (array of URLs)
4. ✅ Admin can update product
5. ✅ Admin can activate/deactivate product
6. ✅ Admin can delete product
7. ✅ Reseller can view active products only
8. ✅ Filtering works (category, subcategory, search, status)
9. ✅ Pagination works (page, limit)

#### **Categories:**
1. ✅ Admin can create category
2. ✅ Admin can create subcategory under category
3. ✅ Admin can update category/subcategory
4. ✅ Admin can delete empty category
5. ✅ Cannot delete category with products
6. ✅ Reseller can view active categories

#### **Validation:**
1. ✅ labor_per_kg must be whole number (integer)
2. ✅ tunch_percentage must be 0-100
3. ✅ weight_ranges must be valid JSONB array
4. ✅ images must be TEXT[] array
5. ✅ Offer fields required when offer_enabled=true

---

## ✅ ACCEPTANCE CRITERIA

### **Server Actions:**
- [ ] All product CRUD operations work
- [ ] Image upload/delete works
- [ ] Category/subcategory operations work
- [ ] Admin verification on all mutations
- [ ] Proper error handling
- [ ] Revalidation after mutations
- [ ] ActionResult type used consistently

### **Security:**
- [ ] Only admins can create/edit/delete
- [ ] Resellers can only view active items
- [ ] All mutations verify admin role server-side
- [ ] RLS policies protect database

### **Data Integrity:**
- [ ] Cannot delete category with products
- [ ] labor_per_kg is integer only
- [ ] tunch_percentage is 0-100
- [ ] Foreign keys enforced

---

## 📚 REFERENCE FILES

### **Already Exist (Use These):**
- `apps/web/types/products.ts` - Type definitions
- `apps/web/lib/validations/product.ts` - Zod schemas
- `apps/web/app/(admin)/admin/categories/actions.ts` - Category actions (check if working)
- `apps/web/app/(admin)/admin/products/page.tsx` - Uses getProducts, getProductStats
- `apps/web/app/(admin)/admin/products/new/page.tsx` - Uses createProduct
- `apps/web/app/(admin)/admin/products/[id]/edit/page.tsx` - Uses updateProduct, getProductById
- `apps/web/components/admin/products/ProductForm.tsx` - Form component

---

## 🎯 PRIORITY

**HIGH** - Core feature needed for business operations

---

## ⏱️ ESTIMATED TIME

**3-4 hours** to implement and test all functions

---

## 🚀 DELIVERABLES

1. ✅ Complete `apps/web/app/(admin)/admin/products/actions.ts` file
2. ✅ All functions implemented and tested
3. ✅ Image upload/delete working
4. ✅ Admin pages work (create, edit, list, delete)
5. ✅ Reseller pages work (view active products)
6. ✅ All validation working
7. ✅ Error handling working

---

## 💡 GETTING STARTED

### **Step 1: Check What Exists**
```bash
# Check if actions.ts exists
cat apps/web/app/(admin)/admin/products/actions.ts
```

### **Step 2: Implement Missing Functions**
Start with basic CRUD, then add image upload.

### **Step 3: Test Each Function**
Test in the UI:
1. Go to `/admin/products`
2. Click "New Product"
3. Fill form, upload image, save
4. Edit product
5. Delete product
6. Test filtering

### **Step 4: Test as Reseller**
1. Login as reseller
2. Go to `/reseller/products`
3. Should see active products only
4. Should not be able to edit

---

## 🆘 HELP

If stuck, check:
- Sample data already in database (3 products)
- Use `supabaseServer()` for server actions
- Use `verifyAdmin()` before mutations
- Check RLS policies if access denied

---

**Good luck! Let me know when done.** 🎉
