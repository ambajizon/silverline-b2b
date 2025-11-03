# 🎯 Complete Orders System Implementation Plan

## 📊 **Current Status:**
- ✅ Products catalog exists
- ✅ Resellers can view products and see pricing
- ❌ **No cart functionality**
- ❌ **No orders table in database**
- ❌ **No checkout flow**

---

## 🗄️ **Step 1: Database Schema**

### **Tables Needed:**

#### **1. `orders` table**
```sql
- id (uuid, primary key)
- reseller_id (uuid, foreign key → resellers.id)
- order_code (text, unique) -- e.g., ORD-20250127-0001
- status (text) -- 'pending', 'accepted', 'in_making', 'dispatched', 'delivered', 'cancelled'
- payment_status (text) -- 'unpaid', 'partial', 'paid'
- total_weight_kg (numeric)
- subtotal (numeric)
- discount_amount (numeric)
- global_loop_amount (numeric)
- taxable_amount (numeric)
- gst_amount (numeric)
- total_price (numeric)
- notes (text, nullable)
- created_at (timestamp)
- updated_at (timestamp)
```

#### **2. `order_items` table**
```sql
- id (uuid, primary key)
- order_id (uuid, foreign key → orders.id)
- product_id (uuid, foreign key → products.id)
- product_name (text) -- Snapshot at order time
- weight_kg (numeric)
- silver_rate (numeric) -- Snapshot at order time
- base_price (numeric)
- labor_charges (numeric)
- gst_rate (numeric)
- gst_amount (numeric)
- item_total (numeric)
- weight_ranges (jsonb) -- Store selected ranges
- created_at (timestamp)
```

#### **3. `cart_items` table** (Session cart)
```sql
- id (uuid, primary key)
- user_id (uuid, foreign key → profiles.id)
- product_id (uuid, foreign key → products.id)
- weight_kg (numeric)
- weight_ranges (jsonb) -- Store selected ranges
- price_snapshot (jsonb) -- Complete PriceBreakdown
- created_at (timestamp)
- updated_at (timestamp)
```

---

## 🛒 **Step 2: Cart Flow**

### **User Journey:**
1. **Browse Products** → Reseller views catalog
2. **Select Product** → Views product detail, enters weight
3. **Add to Cart** → Saves to `cart_items` table
4. **View Cart** → See all cart items, total price
5. **Update Cart** → Change quantities, remove items
6. **Checkout** → Review and place order
7. **Order Placed** → Creates `orders` and `order_items` records

---

## 🔧 **Step 3: Implementation Files**

### **Backend (Server Actions):**
1. `app/(reseller)/reseller/cart/actions.ts`
   - `addToCart()`
   - `getCart()`
   - `updateCartItem()`
   - `removeFromCart()`
   - `clearCart()`

2. `app/(reseller)/reseller/orders/actions.ts`
   - `createOrder()`
   - `getOrders()`
   - `getOrderDetail()`
   - `cancelOrder()`

### **Frontend (UI Components):**
1. `components/reseller/AddToCartButton.tsx`
2. `components/reseller/CartIcon.tsx` (Header badge)
3. `app/(reseller)/reseller/cart/page.tsx` (Cart page)
4. `app/(reseller)/reseller/checkout/page.tsx` (Checkout page)
5. `app/(reseller)/reseller/orders/page.tsx` (Orders list)
6. `app/(reseller)/reseller/orders/[id]/page.tsx` (Order detail)

### **Types:**
1. `types/cart.ts`
2. `types/order.ts`

---

## 📝 **Step 4: Order Code Generation**

Format: `ORD-YYYYMMDD-XXXX`
Example: `ORD-20250127-0001`

```typescript
async function generateOrderCode() {
  const today = new Date().toISOString().split('T')[0].replace(/-/g, '')
  const prefix = `ORD-${today}`
  
  // Get last order code for today
  const { data: lastOrder } = await supabase
    .from('orders')
    .select('order_code')
    .like('order_code', `${prefix}%`)
    .order('order_code', { ascending: false })
    .limit(1)
    .single()
  
  let sequence = 1
  if (lastOrder) {
    const lastSeq = parseInt(lastOrder.order_code.split('-')[2])
    sequence = lastSeq + 1
  }
  
  return `${prefix}-${sequence.toString().padStart(4, '0')}`
}
```

---

## 🎨 **Step 5: UI/UX Flow**

### **Product Detail Page:**
```
┌─────────────────────────────────────┐
│ Silver Puja Kamandal Set            │
│ [Image]                             │
│                                     │
│ Select Weight: [1.000 kg]          │
│                                     │
│ Price Breakdown:                    │
│ - Base: ₹1,00,000                   │
│ - Discount (10%): -₹6,520           │
│ - GST (3%): +₹1,799                 │
│ Total: ₹61,783                      │
│                                     │
│ [🛒 Add to Cart]  [💰 Buy Now]     │
└─────────────────────────────────────┘
```

### **Cart Page:**
```
┌─────────────────────────────────────┐
│ 🛒 Shopping Cart (3 items)          │
├─────────────────────────────────────┤
│ [Image] Silver Puja Set             │
│         1.000 kg × ₹61,783          │
│         [Update] [Remove]           │
│                                     │
│ [Image] Gold Chain                  │
│         0.500 kg × ₹45,000          │
│         [Update] [Remove]           │
├─────────────────────────────────────┤
│ Subtotal:           ₹1,06,783       │
│ Discount (10%):     -₹10,678        │
│ Global Loop (2%):   +₹2,136         │
│ Taxable:            ₹98,241         │
│ GST (3%):           +₹2,947         │
│ ═══════════════════════════════     │
│ TOTAL:              ₹1,01,188       │
│                                     │
│         [Proceed to Checkout]       │
└─────────────────────────────────────┘
```

### **Checkout Page:**
```
┌─────────────────────────────────────┐
│ 📋 Review Order                     │
├─────────────────────────────────────┤
│ Order Summary:                      │
│ - 3 items                           │
│ - Total Weight: 1.5 kg              │
│ - Total Price: ₹1,01,188            │
│                                     │
│ Delivery Address:                   │
│ Pooja Ornament                      │
│ mansarovar road, ambaji             │
│                                     │
│ Notes (Optional):                   │
│ [Text area for special requests]    │
│                                     │
│         [Place Order]               │
└─────────────────────────────────────┘
```

---

## 🔐 **Step 6: Security & Validation**

### **RLS Policies:**
```sql
-- cart_items: Users can only see their own cart
CREATE POLICY "Users can view own cart"
  ON cart_items FOR SELECT
  USING (auth.uid() = user_id);

-- orders: Resellers can view their own orders
CREATE POLICY "Resellers can view own orders"
  ON orders FOR SELECT
  USING (
    reseller_id IN (
      SELECT id FROM resellers WHERE user_id = auth.uid()
    )
  );
```

### **Validation:**
- ✅ Product must be active
- ✅ Weight must be > 0
- ✅ Silver rate must be valid
- ✅ Cart not empty before checkout
- ✅ Reseller approved before ordering

---

## 🧪 **Step 7: Testing Checklist**

### **Cart Functionality:**
- [ ] Add product to cart
- [ ] Cart badge updates
- [ ] View cart page
- [ ] Update cart item quantity
- [ ] Remove cart item
- [ ] Cart persists across sessions
- [ ] Cart shows correct prices

### **Checkout Flow:**
- [ ] Checkout with single item
- [ ] Checkout with multiple items
- [ ] Order code generated correctly
- [ ] Order saved to database
- [ ] Cart cleared after order
- [ ] Order appears in orders list

### **Orders Management:**
- [ ] View orders list
- [ ] Filter by status
- [ ] View order detail
- [ ] Cancel pending order
- [ ] Admin can update order status

---

## 📦 **Step 8: Admin Order Management**

Admin needs ability to:
1. **View all orders** from all resellers
2. **Update order status** (pending → accepted → in_making → dispatched → delivered)
3. **Update payment status** (unpaid → partial → paid)
4. **View order details** with all items
5. **Generate invoice** (PDF)
6. **Track orders** by reseller, date, status

---

## 🚀 **Implementation Priority:**

### **Phase 1: Core Cart (Day 1)**
1. Create database tables (SQL)
2. Cart types and schemas
3. Cart actions (add, view, remove)
4. Product detail: Add to Cart button
5. Cart page UI

### **Phase 2: Checkout (Day 2)**
6. Order types and schemas
7. Order actions (create, view)
8. Checkout page UI
9. Order confirmation

### **Phase 3: Orders Management (Day 3)**
10. Orders list page (reseller)
11. Order detail page (reseller)
12. Cancel order functionality
13. Order status badges

### **Phase 4: Admin Features (Day 4)**
14. Admin orders list
15. Admin order detail
16. Update order status
17. Payment tracking

### **Phase 5: Enhancements (Day 5)**
18. Order search & filters
19. Invoice generation (PDF)
20. Email notifications
21. Order analytics

---

## 💡 **Key Decisions:**

1. **Cart Storage:** Database (not localStorage) for persistence
2. **Price Snapshot:** Store at order time to preserve historical pricing
3. **Order Code:** Auto-generated, date-based
4. **Payment:** Track status, but payment gateway integration later
5. **Inventory:** No inventory tracking yet (jewelry business model)

---

## 📋 **Next Steps:**

1. ✅ Review this plan
2. ✅ Approve database schema
3. ✅ Run SQL migrations
4. ✅ Implement Phase 1 (Cart)
5. ✅ Test cart flow
6. ✅ Implement Phase 2 (Checkout)
7. ✅ Test complete flow
8. ✅ Deploy to production

---

**Ready to start implementation!** 🚀
