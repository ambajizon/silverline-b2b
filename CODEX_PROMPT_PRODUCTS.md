## CODEX TASK: Products Feature - Server Side Implementation

## 🎯 OBJECTIVE
Implement complete server-side functionality for the Products management system. The UI is already built. Database tables need to be created first, then implement server actions for CRUD operations on categories, sub-categories, and products, including image upload handling.

---

## 📋 CONTEXT

### Current Situation
- ✅ UI components are already built (admin and reseller sides)
- ✅ Type definitions exist in `types/products.ts`
- ✅ Form validation schemas exist in `lib/validations/product.ts`
- ❌ Database tables were deleted - need to recreate
- ✅ Storage bucket `product-images` exists with PUBLIC access
- ❌ Need to implement server actions for CRUD operations

### Business Logic
1. **Admin** manages products (create, edit, delete, activate/deactivate)
2. **Admin** manages categories and sub-categories
3. **Admin** uploads product images to `product-images` bucket
4. **Resellers** can view active products only
5. **Public** can view product images (for catalog display)
6. Products have pricing based on: silver rate + labor + tunch + offers

---

## 🗄️ DATABASE SCHEMA

### 1. Categories Table
```sql
categories
├── id: UUID (PK)
├── name: TEXT (UNIQUE, NOT NULL)
├── description: TEXT
├── created_at: TIMESTAMPTZ
└── updated_at: TIMESTAMPTZ
```

### 2. Sub-Categories Table
```sql
sub_categories
├── id: UUID (PK)
├── category_id: UUID (FK → categories.id)
├── name: TEXT (NOT NULL)
├── description: TEXT
├── created_at: TIMESTAMPTZ
├── updated_at: TIMESTAMPTZ
└── UNIQUE(category_id, name)
```

### 3. Products Table
```sql
products
├── id: UUID (PK)
├── name: TEXT (NOT NULL)
├── description: TEXT
├── category_id: UUID (FK → categories.id)
├── sub_category_id: UUID (FK → sub_categories.id, nullable)
├── tunch_percentage: DECIMAL(5,2) (0-100)
├── labor_per_kg: INTEGER (≥ 0, whole number only)
├── weight_ranges: JSONB (array of {min, max})
├── images: TEXT[] (array of image URLs)
├── hsn_code: TEXT
├── status: TEXT ('active' | 'inactive')
├── offer_enabled: BOOLEAN
├── offer_type: TEXT ('percentage' | 'fixed')
├── offer_value: DECIMAL(10,2)
├── offer_text: TEXT
├── offer_valid_from: TIMESTAMPTZ
├── offer_valid_till: TIMESTAMPTZ
├── created_at: TIMESTAMPTZ
└── updated_at: TIMESTAMPTZ
```

---

## 🔒 RLS POLICIES

### Categories & Sub-Categories
- ✅ **Public/Authenticated**: Can READ all
- ✅ **Admins only**: Can INSERT, UPDATE, DELETE

### Products
- ✅ **Public**: Can READ active products only
- ✅ **Authenticated**: Can READ all products
- ✅ **Admins only**: Can INSERT, UPDATE, DELETE

### Storage (product-images bucket)
- ✅ **Public**: Can view images (SELECT)
- ✅ **Admins only**: Can upload, update, delete images

---

## 🛠️ SERVER ACTIONS TO IMPLEMENT

### Location: `apps/web/app/(admin)/admin/products/actions.ts`

### 1. Category Actions

#### Get All Categories
```typescript
export async function getCategories(): Promise<ActionResult<Category[]>>
```
- Fetch all categories ordered by name
- Return array of categories

#### Create Category
```typescript
export async function createCategory(name: string, description?: string): Promise<ActionResult<Category>>
```
- Verify user is admin
- Insert new category
- Return created category

#### Update Category
```typescript
export async function updateCategory(id: string, name: string, description?: string): Promise<ActionResult>
```
- Verify user is admin
- Update category
- Return success/error

#### Delete Category
```typescript
export async function deleteCategory(id: string): Promise<ActionResult>
```
- Verify user is admin
- Check if category has products (prevent delete if yes)
- Delete category
- Return success/error

---

### 2. Sub-Category Actions

#### Get Sub-Categories by Category
```typescript
export async function getSubCategories(categoryId: string): Promise<ActionResult<SubCategory[]>>
```
- Fetch sub-categories for given category
- Return array

#### Create Sub-Category
```typescript
export async function createSubCategory(categoryId: string, name: string, description?: string): Promise<ActionResult<SubCategory>>
```
- Verify user is admin
- Insert new sub-category
- Return created sub-category

---

### 3. Product Actions

#### Get Products with Filters
```typescript
export async function getProducts(filters: ProductFilters): Promise<ActionResult<{ products: ProductWithCategory[], total: number }>>
```
- Apply filters: status, category, sub-category, search
- Join with categories table to get category_name
- Support pagination (page, limit)
- Return products array + total count

#### Get Product by ID
```typescript
export async function getProductById(id: string): Promise<ActionResult<Product>>
```
- Fetch single product
- Return product or error

#### Create Product
```typescript
export async function createProduct(data: ProductFormData): Promise<ActionResult<{ id: string }>>
```
- Verify user is admin
- Validate all fields
- Insert product into database
- Revalidate product pages
- Return product ID

#### Update Product
```typescript
export async function updateProduct(id: string, data: ProductFormData): Promise<ActionResult>
```
- Verify user is admin
- Validate all fields
- Update product
- Revalidate product pages
- Return success/error

#### Update Product Status
```typescript
export async function updateProductStatus(id: string, status: 'active' | 'inactive'): Promise<ActionResult>
```
- Verify user is admin
- Update only status field
- Revalidate pages
- Return success/error

#### Delete Product
```typescript
export async function deleteProduct(id: string): Promise<ActionResult>
```
- Verify user is admin
- Check if product is in any orders (warn if yes)
- Delete product
- Delete associated images from storage
- Revalidate pages
- Return success/error

#### Get Product Stats
```typescript
export async function getProductStats(): Promise<ActionResult<ProductStats>>
```
- Count active products
- Count products with offers
- Return stats object

---

### 4. Image Upload Actions

#### Upload Product Image
```typescript
export async function uploadProductImage(productId: string, file: File): Promise<ActionResult<string>>
```
- Verify user is admin
- Generate unique filename: `${productId}/${Date.now()}.jpg`
- Upload to `product-images` bucket
- Get public URL
- Return image URL

#### Delete Product Image
```typescript
export async function deleteProductImage(path: string): Promise<ActionResult>
```
- Verify user is admin
- Remove from storage bucket
- Return success/error

---

## 📁 FILES TO MODIFY/CREATE

### Create New File
- `apps/web/app/(admin)/admin/products/actions.ts` (if doesn't exist)
  - Implement all actions above

### Modify Existing Files (If Needed)
- `apps/web/app/(admin)/admin/products/page.tsx`
  - Already uses `getProducts()` and `getProductStats()`
  - Verify it works after implementing actions

- `apps/web/app/(admin)/admin/products/new/page.tsx`
  - Already uses `getCategories()` and `getSubCategories()`
  - Verify it works

- `apps/web/app/(admin)/admin/products/[id]/edit/page.tsx`
  - Already uses `getProductById()`, `getCategories()`, `getSubCategories()`
  - Verify it works

### UI Components (Already Built)
- ✅ `components/admin/products/ProductForm.tsx` - Form for create/edit
- ✅ `components/admin/products/ProductsTable.tsx` - Products list
- ✅ `components/admin/products/ProductsStats.tsx` - Stats display
- ✅ `components/admin/products/ProductsFilters.tsx` - Filter controls

---

## 🧪 TESTING REQUIREMENTS

### Category Tests
1. ✅ Admin can view all categories
2. ✅ Admin can create new category
3. ✅ Admin can update category name/description
4. ✅ Admin can delete empty category
5. ✅ Cannot delete category with products
6. ✅ Reseller can view categories (read-only)

### Product Tests
1. ✅ Admin can view all products (active + inactive)
2. ✅ Admin can create product with all fields
3. ✅ Admin can upload multiple images
4. ✅ Admin can update product
5. ✅ Admin can activate/deactivate product
6. ✅ Admin can delete product
7. ✅ Reseller can view active products only
8. ✅ Public cannot see inactive products

### Image Upload Tests
1. ✅ Admin can upload images
2. ✅ Images stored in `product-images/{productId}/` folder
3. ✅ Public can view images (bucket is PUBLIC)
4. ✅ Admin can delete images
5. ✅ Images deleted when product is deleted

---

## ⚠️ IMPORTANT NOTES

### Data Integrity
- ✅ Prevent deleting category if it has products
- ✅ Set sub_category_id to NULL if sub-category is deleted
- ✅ weight_ranges must be valid JSONB array
- ✅ images must be TEXT[] array
- ✅ tunch_percentage must be 0-100
- ✅ labor_per_kg must be ≥ 0

### Image Handling
- ✅ Store images in: `product-images/{productId}/{timestamp}.{ext}`
- ✅ Use `supabase.storage.from('product-images')`
- ✅ Get public URL after upload
- ✅ Store only URLs in database (not base64)
- ✅ Delete images from storage when product is deleted

### Security
- ✅ Only admins can create/edit/delete products
- ✅ Only admins can upload images
- ✅ All users can view active products
- ✅ Always verify admin role server-side
- ✅ Use `verifyAdmin()` helper function

### Performance
- ✅ Use indexes on category_id, status, name
- ✅ Pagination for product lists (default 20 per page)
- ✅ Join categories table for listing
- ✅ Cache product stats

---

## 📊 EXAMPLE DATA FLOW

### Creating a Product
1. Admin fills product form
2. Uploads images → Gets URLs
3. Submits form with image URLs
4. `createProduct()` validates data
5. Inserts into database
6. Revalidates `/admin/products` and `/reseller/products`
7. Success message shown

### Viewing Products (Reseller)
1. Reseller goes to `/reseller/products`
2. Page calls `getProducts({ status: 'active' })`
3. Fetches only active products
4. Joins with categories for display
5. Shows products with pricing
6. Silver rate + labor + tunch = final price

---

## ✅ ACCEPTANCE CRITERIA

### Database
- [ ] categories table exists
- [ ] sub_categories table exists
- [ ] products table exists
- [ ] RLS enabled on all tables
- [ ] 15 RLS policies exist (5 per table)
- [ ] Storage policies exist for product-images

### Server Actions
- [ ] All 15+ actions implemented
- [ ] Proper error handling
- [ ] Admin verification on all mutations
- [ ] Revalidation after mutations
- [ ] ActionResult type used consistently

### Admin Functionality
- [ ] Admin can manage categories
- [ ] Admin can manage sub-categories
- [ ] Admin can create products
- [ ] Admin can edit products
- [ ] Admin can upload/delete images
- [ ] Admin can activate/deactivate products
- [ ] Admin can delete products
- [ ] Stats display correctly

### Reseller Functionality
- [ ] Reseller sees active products only
- [ ] Products display with correct pricing
- [ ] Images load from storage
- [ ] Filtering works (category, sub-category, search)
- [ ] Product detail page shows all info

---

## 🎁 DELIVERABLES

1. ⬜ `apps/web/app/(admin)/admin/products/actions.ts` - All server actions
2. ⬜ Verified admin pages work with actions
3. ⬜ Image upload/delete functionality
4. ⬜ Test results confirming all criteria

---

## 🚀 IMPLEMENTATION STEPS

### Step 1: Database Setup (User will do this)
User will run these SQL files in Supabase:
1. `CREATE_PRODUCTS_TABLES.sql` - Creates tables
2. `CREATE_PRODUCTS_RLS_POLICIES.sql` - Creates RLS policies
3. `CREATE_STORAGE_POLICIES.sql` - Creates storage policies
4. `INSERT_SAMPLE_PRODUCTS_DATA.sql` - Adds sample data

### Step 2: Implement Server Actions (Your task)
1. Create/open `apps/web/app/(admin)/admin/products/actions.ts`
2. Implement category actions (get, create, update, delete)
3. Implement sub-category actions (get, create)
4. Implement product actions (get, create, update, delete, updateStatus)
5. Implement stats action
6. Implement image upload/delete actions

### Step 3: Test Everything
1. Test category CRUD
2. Test product CRUD
3. Test image upload
4. Test filtering
5. Test permissions (admin vs reseller)

---

## 📚 REFERENCE

### Type Definitions
File: `apps/web/types/products.ts`
- Category
- SubCategory
- Product
- ProductWithCategory
- ProductFilters
- ProductStats
- ProductFormData

### Validation Schemas
File: `apps/web/lib/validations/product.ts`
- weightRangeSchema
- productFormSchema

### Existing Components
- `ProductForm` - Create/edit form
- `ProductsTable` - Products list
- `ProductsStats` - Stats cards
- `ProductsFilters` - Filter controls

---

## 💡 HELPFUL TIPS

### Working with JSONB
```typescript
// weight_ranges is JSONB in database
const weightRanges = [{ min: 0, max: 10 }, { min: 10, max: 20 }]
// Store as: JSON.stringify(weightRanges) or pass directly
```

### Working with TEXT[]
```typescript
// images is TEXT[] in database
const images = ['url1', 'url2', 'url3']
// Store as: images (Supabase handles array conversion)
```

### Image Upload Example
```typescript
const { data, error } = await supabase.storage
  .from('product-images')
  .upload(`${productId}/${Date.now()}.jpg`, file)

if (!error) {
  const { data: urlData } = supabase.storage
    .from('product-images')
    .getPublicUrl(data.path)
  return urlData.publicUrl
}
```

---

**Priority**: 🔴 HIGH (Core feature)
**Estimated Time**: 4-6 hours
**Complexity**: Medium-High
**Dependencies**: Database tables must exist first

Good luck! 🚀
