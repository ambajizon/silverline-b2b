# 🤖 Codex Prompt: Implement Complete Orders System

## 📋 **Task Overview:**

Implement a complete **Shopping Cart and Orders System** for a B2B jewelry e-commerce platform built with Next.js 15, React, TypeScript, Supabase, and TailwindCSS.

---

## 🎯 **Requirements:**

### **What Exists:**
- ✅ Product catalog with pricing calculator
- ✅ Reseller authentication and profiles
- ✅ GST/tax calculations
- ✅ Discount and global loop per reseller
- ✅ Database: products, resellers, profiles, settings, silver_rates

### **What's Missing:**
- ❌ Shopping cart functionality
- ❌ Add to cart from product detail
- ❌ Cart page with item management
- ❌ Checkout flow
- ❌ Orders creation and management
- ❌ Order tracking and status updates
- ❌ Database tables: orders, order_items, cart_items

---

## 📦 **Deliverables:**

### **Phase 1: Database (SQL)**
1. Run `CREATE_ORDERS_TABLES.sql` to create:
   - `orders` table (with order_code, status, payment_status, pricing snapshot)
   - `order_items` table (with product snapshot, weight ranges, pricing)
   - `cart_items` table (with price snapshot)
   - RLS policies for security
   - Functions: generate_order_code(), triggers for updated_at

### **Phase 2: Type Definitions**
1. `types/cart.ts`:
   - CartItem interface
   - CartSummary interface
   - AddToCartInput type

2. `types/order.ts`:
   - Order interface
   - OrderItem interface
   - OrderStatus type
   - PaymentStatus type
   - CreateOrderInput type

### **Phase 3: Backend Actions**

1. **Cart Actions** (`app/(reseller)/reseller/cart/actions.ts`):
   ```typescript
   async function addToCart(input: AddToCartInput): Promise<ActionResult>
   async function getCart(): Promise<CartItem[]>
   async function updateCartItem(cartItemId: string, weight_kg: number): Promise<ActionResult>
   async function removeFromCart(cartItemId: string): Promise<ActionResult>
   async function clearCart(): Promise<ActionResult>
   async function getCartSummary(): Promise<CartSummary>
   ```

2. **Order Actions** (`app/(reseller)/reseller/orders/actions.ts`):
   ```typescript
   async function createOrder(notes?: string): Promise<{ success: boolean, orderId?: string, error?: string }>
   async function getOrders(filters?: OrderFilters): Promise<Order[]>
   async function getOrderDetail(orderId: string): Promise<OrderWithItems | null>
   async function cancelOrder(orderId: string, reason: string): Promise<ActionResult>
   ```

3. **Admin Order Actions** (`app/(admin)/admin/orders/actions.ts`):
   ```typescript
   async function getAllOrders(filters?: AdminOrderFilters): Promise<Order[]>
   async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<ActionResult>
   async function updatePaymentStatus(orderId: string, paymentStatus: PaymentStatus): Promise<ActionResult>
   ```

### **Phase 4: Frontend Components**

1. **Product Detail Enhancement**:
   - Add "Add to Cart" button to `components/reseller/ProductDetail.tsx`
   - Show loading state while adding
   - Show success toast on add
   - Button disabled if weight = 0

2. **Cart Icon in Header** (`components/reseller/CartIcon.tsx`):
   - Show cart item count badge
   - Click to navigate to /reseller/cart
   - Real-time updates

3. **Cart Page** (`app/(reseller)/reseller/cart/page.tsx`):
   - List all cart items with images, names, weights
   - Show individual prices and breakdown
   - Update quantity inline
   - Remove item button
   - Cart summary (subtotal, discount, GST, total)
   - "Proceed to Checkout" button
   - Empty cart state

4. **Checkout Page** (`app/(reseller)/reseller/checkout/page.tsx`):
   - Order summary (items, weights, total)
   - Delivery address (from reseller profile)
   - Optional notes textarea
   - Review pricing breakdown
   - "Place Order" button
   - Confirmation modal after order placed

5. **Orders List Page** (`app/(reseller)/reseller/orders/page.tsx`):
   - Table/cards showing all orders
   - Order code, date, items count, total, status
   - Filter by status (pending, accepted, dispatched, etc.)
   - Search by order code
   - Click to view detail

6. **Order Detail Page** (`app/(reseller)/reseller/orders/[id]/page.tsx`):
   - Order header: order code, date, status, payment status
   - Items list with images, names, weights, prices
   - Pricing breakdown
   - Order timeline/status history
   - Cancel button (if status = pending)
   - Download invoice button (future)

### **Phase 5: Admin Features**

1. **Admin Orders List** (`app/(admin)/admin/orders/page.tsx`):
   - All orders from all resellers
   - Filters: status, payment status, reseller, date range
   - Quick actions: Update status, view detail

2. **Admin Order Detail** (`app/(admin)/admin/orders/[id]/page.tsx`):
   - Complete order information
   - Reseller details
   - Update order status dropdown
   - Update payment status dropdown
   - Order history/log

---

## 🎨 **UI/UX Guidelines:**

### **Design System:**
- Use TailwindCSS for styling
- Colors: Blue (primary), Green (success), Red (danger), Amber (warning)
- Icons: Lucide React
- Toasts: sonner library
- Loading states: Spinner or skeleton loaders

### **Responsive:**
- Mobile-first design
- Cart icon always visible in header
- Tables → Cards on mobile
- Stack layout for checkout on mobile

### **States & Feedback:**
- Loading states for all async actions
- Success toasts for actions
- Error toasts for failures
- Empty states with helpful messages
- Disabled states with tooltips

---

## 🔐 **Security & Validation:**

### **Validation Rules:**
1. Weight must be > 0
2. Product must be active
3. User must be authenticated
4. Reseller must be approved
5. Cart not empty before checkout
6. Order can only be cancelled if status = 'pending'

### **RLS Policies:**
- Users can only see/modify their own cart
- Resellers can only see/create their own orders
- Resellers can only cancel pending orders
- Admins can see/update all orders

---

## 📊 **Data Flow:**

### **Add to Cart Flow:**
```
1. User enters weight on product detail page
2. Click "Add to Cart"
3. Call pricePreview() to get current pricing
4. Save to cart_items table with price_snapshot
5. Show success toast
6. Update cart badge count
```

### **Checkout Flow:**
```
1. User views cart, clicks "Proceed to Checkout"
2. Navigate to /reseller/checkout
3. Show order summary, address, notes input
4. Click "Place Order"
5. Generate order code
6. Create order record
7. Create order_items records (copy from cart)
8. Clear cart
9. Show success message
10. Navigate to order detail
```

### **Order Status Flow:**
```
pending → accepted → in_making → dispatched → delivered
                   ↘ cancelled
```

### **Payment Status Flow:**
```
unpaid → partial → paid
```

---

## 🧪 **Testing Checklist:**

### **Cart:**
- [ ] Add product to cart
- [ ] Cart badge updates
- [ ] View cart page
- [ ] Update cart item weight
- [ ] Remove cart item
- [ ] Cart persists after logout/login
- [ ] Cart shows correct prices with reseller discount/loop

### **Checkout:**
- [ ] Checkout with single item
- [ ] Checkout with multiple items
- [ ] Order code generated (ORD-YYYYMMDD-XXXX format)
- [ ] Order saved correctly
- [ ] Order items saved correctly
- [ ] Cart cleared after order
- [ ] Navigate to order detail after success

### **Orders:**
- [ ] View orders list
- [ ] Filter by status
- [ ] Search by order code
- [ ] View order detail
- [ ] Cancel pending order
- [ ] Cannot cancel non-pending order
- [ ] Admin can update order status
- [ ] Admin can update payment status

---

## 🔧 **Technical Details:**

### **Server Actions:**
- Use `supabaseServer()` for authenticated queries
- Return `{ success: boolean, error?: string }` format
- Use `revalidatePath()` after mutations
- Handle errors gracefully with try-catch

### **Pricing Snapshot:**
Store complete breakdown at cart/order time:
```typescript
price_snapshot: {
  weight_kg, silver_rate, base_price,
  deduction_amount, labor_charges,
  discount_pct, discount_amount,
  global_loop_pct, global_loop_amount,
  taxable_amount, gst_rate, gst_amount,
  cgst_amount, sgst_amount, igst_amount,
  total_price
}
```

### **Order Code Generation:**
```typescript
// Format: ORD-20250127-0001
const orderCode = await supabase.rpc('generate_order_code')
```

### **Cart Badge Count:**
```typescript
// Real-time count
const { count } = await supabase
  .from('cart_items')
  .select('*', { count: 'exact', head: true })
  .eq('user_id', userId)
```

---

## 📝 **File Structure:**

```
apps/web/
├── types/
│   ├── cart.ts
│   └── order.ts
├── app/(reseller)/reseller/
│   ├── cart/
│   │   ├── actions.ts
│   │   └── page.tsx
│   ├── checkout/
│   │   └── page.tsx
│   └── orders/
│       ├── actions.ts
│       ├── page.tsx
│       └── [id]/page.tsx
├── app/(admin)/admin/
│   └── orders/
│       ├── actions.ts
│       ├── page.tsx
│       └── [id]/page.tsx
└── components/
    ├── reseller/
    │   ├── CartIcon.tsx
    │   ├── CartItem.tsx
    │   ├── OrderCard.tsx
    │   └── OrderStatusBadge.tsx
    └── admin/
        └── orders/
            ├── OrdersTable.tsx
            └── UpdateStatusModal.tsx
```

---

## 🚀 **Implementation Steps:**

### **Step 1: Database Setup**
```bash
# Run SQL migration in Supabase SQL Editor
# File: CREATE_ORDERS_TABLES.sql
```

### **Step 2: Types & Schemas**
```bash
# Create type files
touch apps/web/types/cart.ts
touch apps/web/types/order.ts
```

### **Step 3: Cart System**
```bash
# Create cart actions
mkdir -p apps/web/app/(reseller)/reseller/cart
touch apps/web/app/(reseller)/reseller/cart/actions.ts
touch apps/web/app/(reseller)/reseller/cart/page.tsx

# Create cart components
touch apps/web/components/reseller/CartIcon.tsx
touch apps/web/components/reseller/CartItem.tsx
```

### **Step 4: Update Product Detail**
```bash
# Add "Add to Cart" button to existing ProductDetail component
# File: apps/web/components/reseller/ProductDetail.tsx
```

### **Step 5: Checkout**
```bash
mkdir -p apps/web/app/(reseller)/reseller/checkout
touch apps/web/app/(reseller)/reseller/checkout/page.tsx
```

### **Step 6: Orders**
```bash
mkdir -p apps/web/app/(reseller)/reseller/orders
touch apps/web/app/(reseller)/reseller/orders/actions.ts
touch apps/web/app/(reseller)/reseller/orders/page.tsx
mkdir -p apps/web/app/(reseller)/reseller/orders/[id]
touch apps/web/app/(reseller)/reseller/orders/[id]/page.tsx
```

### **Step 7: Admin Orders**
```bash
mkdir -p apps/web/app/(admin)/admin/orders
touch apps/web/app/(admin)/admin/orders/actions.ts
touch apps/web/app/(admin)/admin/orders/page.tsx
mkdir -p apps/web/app/(admin)/admin/orders/[id]
touch apps/web/app/(admin)/admin/orders/[id]/page.tsx
```

### **Step 8: Test & Debug**
```bash
# Test each flow thoroughly
# Fix any issues
# Deploy to staging
```

---

## ✅ **Success Criteria:**

1. ✅ Reseller can add products to cart
2. ✅ Cart badge shows item count
3. ✅ Cart page displays all items with prices
4. ✅ Reseller can update/remove cart items
5. ✅ Checkout flow works smoothly
6. ✅ Order is created with correct data
7. ✅ Order code is generated properly
8. ✅ Cart is cleared after order
9. ✅ Reseller can view orders list
10. ✅ Reseller can view order details
11. ✅ Reseller can cancel pending orders
12. ✅ Admin can view all orders
13. ✅ Admin can update order status
14. ✅ All RLS policies work correctly
15. ✅ Mobile responsive

---

## 🎯 **Start Implementation:**

**First command to run:**
```sql
-- In Supabase SQL Editor, execute:
-- File: CREATE_ORDERS_TABLES.sql
```

**Then implement in order:**
1. Types (cart.ts, order.ts)
2. Cart actions (addToCart, getCart, etc.)
3. Add to Cart button on product detail
4. Cart page UI
5. Checkout page
6. Order creation logic
7. Orders list page
8. Order detail page
9. Admin order management

---

**Ready to implement! Let's build this! 🚀**
