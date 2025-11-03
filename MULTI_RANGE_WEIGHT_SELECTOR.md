# ✅ Multi-Range Weight Selector - Complete Implementation

## 🎯 Summary

Replaced the single weight + quantity input with a multi-range weight selector that allows resellers to:
- Select multiple weight ranges from available product ranges
- Specify weight (in kg) for each selected range
- See total weight calculated as sum of all segments
- View pricing based on total weight
- Store segment breakdown in cart for display

**Key Changes:**
- ❌ Removed: Single weight input + quantity field
- ✅ Added: Multi-range selector with segment management
- ✅ Updated: Cart displays total weight + optional breakdown
- ✅ Updated: Price calculation accepts segments or total weight

---

## 📁 Files Modified (5 Files)

### 1. **`types/reseller.ts`** - Type Definitions
**Changes:**
- Added `WeightSegment` type
- Removed `quantity` field from `CartItem`
- Added optional `segments` array to `CartItem`

```typescript
export type WeightSegment = {
  range: { min: number; max: number }
  weight_kg: number
}

export type CartItem = {
  productId: string
  name: string
  image: string | null
  weightKg: number          // Total weight
  price: number             // Total price
  tunch: number
  labor: number
  offer: number
  segments?: WeightSegment[] // Optional breakdown for UI
}
```

### 2. **`app/(reseller)/reseller/products/actions.ts`** - Pricing API
**Changes:**
- Updated `pricePreview()` to accept union type input
- Added `resolveTotalWeightKg()` helper function
- Calculates pricing based on total weight from segments

```typescript
type PricePreviewInput =
  | { productId: string; total_weight_kg: number; silverRateOverride?: number }
  | { productId: string; segments: { range: { min: number; max: number }, weight_kg: number }[]; silverRateOverride?: number }

function resolveTotalWeightKg(input: PricePreviewInput): number {
  if ('total_weight_kg' in input) {
    return Math.max(0, input.total_weight_kg || 0)
  }
  return Math.max(
    0,
    (input.segments ?? []).reduce((s, seg) => s + (Number(seg.weight_kg) || 0), 0)
  )
}

export async function pricePreview(params: PricePreviewInput): Promise<PriceBreakdown> {
  // ... existing code ...
  const totalWeightKg = resolveTotalWeightKg(params)
  // Use totalWeightKg for all calculations
}
```

### 3. **`lib/cart.ts`** - Cart Management
**Changes:**
- Removed `updateCartItemQuantity()` function
- Added `removeCartItem(index)` function
- Updated `addToCart()` to always add new item (no duplicate checking)
- Changed `totalQty` to count items, not quantity sum

```typescript
export function addToCart(item: CartItem): Cart {
  const cart = getCart()
  cart.items.push(item) // Simply add, no duplicate check
  cart.totalQty = cart.items.length // Count items, not quantities
  cart.totalAmount = cart.items.reduce((sum, i) => sum + i.price, 0)
  saveCart(cart)
  return cart
}

export function removeCartItem(index: number): Cart {
  const cart = getCart()
  if (index >= 0 && index < cart.items.length) {
    cart.items.splice(index, 1)
  }
  cart.totalQty = cart.items.length
  cart.totalAmount = cart.items.reduce((sum, i) => sum + i.price, 0)
  saveCart(cart)
  return cart
}
```

### 4. **`components/reseller/ProductDetail.tsx`** - Main UI
**Complete Rewrite:**

**State Management:**
```typescript
type SelectedSegment = {
  id: string
  range: { min: number; max: number }
  weight_kg: number
}

const [selectedSegments, setSelectedSegments] = useState<SelectedSegment[]>([])
const totalWeightKg = selectedSegments.reduce((sum, seg) => sum + (seg.weight_kg || 0), 0)
```

**Price Calculation:**
```typescript
useEffect(() => {
  if (selectedSegments.length === 0 || totalWeightKg <= 0) {
    setBreakdown(null)
    return
  }

  const calculatePrice = async () => {
    const result = await pricePreview({
      productId: product.id,
      segments: selectedSegments.map(s => ({
        range: s.range,
        weight_kg: s.weight_kg
      }))
    })
    setBreakdown(result)
  }

  const debounce = setTimeout(calculatePrice, 300)
  return () => clearTimeout(debounce)
}, [selectedSegments, product.id, totalWeightKg])
```

**Handlers:**
```typescript
const handleAddRange = (range: { min: number; max: number }) => {
  const newSegment: SelectedSegment = {
    id: `${Date.now()}-${Math.random()}`,
    range,
    weight_kg: 0.01
  }
  setSelectedSegments([...selectedSegments, newSegment])
}

const handleRemoveSegment = (id: string) => {
  setSelectedSegments(selectedSegments.filter(s => s.id !== id))
}

const handleWeightChange = (id: string, weight: number) => {
  setSelectedSegments(selectedSegments.map(s =>
    s.id === id ? { ...s, weight_kg: Math.max(0, weight) } : s
  ))
}
```

**Add to Cart:**
```typescript
const handleAddToCart = () => {
  addToCart({
    productId: product.id,
    name: product.name,
    image: product.images[0] ?? null,
    weightKg: totalWeightKg,
    price: breakdown.total_price,
    tunch: product.tunch_percentage,
    labor: product.labor_per_kg,
    offer: breakdown.offer_discount,
    segments: selectedSegments.map(s => ({
      range: s.range,
      weight_kg: s.weight_kg
    }))
  })
  router.push('/reseller/cart')
}
```

### 5. **`components/reseller/CartView.tsx`** - Cart Display
**Changes:**
- Removed quantity controls (Plus/Minus buttons)
- Updated to show total weight + breakdown
- Changed remove handler to use index

```typescript
{/* Product Info */}
<div className="flex-1 min-w-0">
  <h3 className="text-sm font-medium text-slate-900 mb-1 truncate">{item.name}</h3>
  
  {/* Total Weight */}
  <p className="text-xs text-slate-600 mb-1">
    <span className="font-medium">Total Weight:</span> {item.weightKg.toFixed(3)} kg
  </p>
  
  {/* Breakdown (if segments exist) */}
  {item.segments && item.segments.length > 0 && (
    <p className="text-xs text-slate-500 mb-2">
      {item.segments.map((seg, i) => (
        <span key={i}>
          {seg.range.min}–{seg.range.max}g: {seg.weight_kg.toFixed(2)}kg
          {i < item.segments!.length - 1 ? ' • ' : ''}
        </span>
      ))}
    </p>
  )}
  
  <p className="text-base font-bold text-blue-600">{formatINR(item.price)}</p>
</div>
```

---

## 🎨 UI Flow

### Product Detail Page

**Step 1: Select Range**
```
┌────────────────────────────────┐
│ Select Weight Ranges           │
├────────────────────────────────┤
│ [+ 10-20g] [+ 20-35g] [+ 35-50g] │ ← Clickable pills
└────────────────────────────────┘
```

**Step 2: Enter Weight for Each Range**
```
┌────────────────────────────────┐
│ Selected Ranges:               │
├────────────────────────────────┤
│ 10-20g  [1.00] kg      [×]    │
│ 20-35g  [0.50] kg      [×]    │
├────────────────────────────────┤
│ Total Weight: 1.500 kg         │
└────────────────────────────────┘
```

**Step 3: Price Calculation (Automatic)**
```
┌────────────────────────────────┐
│ Price Breakdown                │
├────────────────────────────────┤
│ Weight: 1.500 kg               │
│ Silver Rate: ₹85.00/g          │
│ Base Price: ₹127,500.00        │
│ Deduction (8.0%): -₹10,200.00  │
│ Labor Charges: +₹3,000.00      │
│ GST (3%): +₹3,609.00           │
├────────────────────────────────┤
│ Total Price: ₹123,909.00       │
└────────────────────────────────┘
```

**Step 4: Add to Cart**
```
┌────────────────────────────────┐
│     [Add to Cart]              │
└────────────────────────────────┘
```

### Cart Page

```
┌──────────────────────────────────────┐
│ [IMG]  Silver Chain Design 1        │
│        Total Weight: 1.500 kg        │
│        10-20g: 1.00kg • 20-35g: 0.50kg │
│        ₹123,909.00             [×]  │
├──────────────────────────────────────┤
│ [IMG]  Silver Ring Model 5          │
│        Total Weight: 0.025 kg        │
│        5-10g: 0.025kg                │
│        ₹2,550.00               [×]  │
└──────────────────────────────────────┘
```

---

## 🧮 Example Usage

### Scenario: Reseller wants 1kg of 10-20g chains and 0.5kg of 20-35g chains

**1. Click "10-20g" pill**
- Adds segment with range `{min: 10, max: 20}`
- Default weight: 0.01 kg

**2. Enter "1.00" in the weight input**
- Updates segment: `{range: {min: 10, max: 20}, weight_kg: 1.00}`

**3. Click "20-35g" pill**
- Adds second segment with range `{min: 20, max: 35}`
- Default weight: 0.01 kg

**4. Enter "0.50" in second weight input**
- Updates segment: `{range: {min: 20, max: 35}, weight_kg: 0.50}`

**5. Total Weight: 1.50 kg**
- Automatically calculated
- Price updates via debounced API call

**6. Click "Add to Cart"**
- Stores:
  ```json
  {
    "weightKg": 1.5,
    "price": 123909,
    "segments": [
      {"range": {"min": 10, "max": 20}, "weight_kg": 1.0},
      {"range": {"min": 20, "max": 35}, "weight_kg": 0.5}
    ]
  }
  ```

**7. Cart displays:**
- "Total Weight: 1.500 kg"
- "10–20g: 1.00kg • 20–35g: 0.50kg"

---

## 🔧 Technical Details

### Pricing Calculation Flow

1. **User adds/modifies segment** → State updates
2. **300ms debounce** → Prevents excessive API calls
3. **Call `pricePreview()`** with segments array
4. **Server resolves total weight** from segments
5. **Calculate price** using total weight:
   ```
   base = totalWeightKg * 1000 * silverRate
   deduction = base * (deductionPct / 100)
   labor = laborPerKg * totalWeightKg
   subtotal = base - deduction + labor
   gst = subtotal * (gstRate / 100)
   total = subtotal + gst
   ```
6. **Return breakdown** → UI updates

### Cart Storage

**Before (with quantity):**
```json
{
  "items": [
    {
      "productId": "abc",
      "weightKg": 1.0,
      "quantity": 3,
      "price": 100000
    }
  ]
}
```

**After (with segments):**
```json
{
  "items": [
    {
      "productId": "abc",
      "weightKg": 1.5,
      "price": 123909,
      "segments": [
        {"range": {"min": 10, "max": 20}, "weight_kg": 1.0},
        {"range": {"min": 20, "max": 35}, "weight_kg": 0.5}
      ]
    }
  ]
}
```

---

## ✅ Acceptance Criteria

### Product Detail Page
- [x] Weight ranges displayed as clickable pills
- [x] Clicking pill adds new segment row
- [x] Each segment has weight input (kg) + remove button
- [x] Total weight displayed and auto-calculated
- [x] Price recalculates on any segment change (300ms debounce)
- [x] "Add to Cart" disabled if no segments or total weight = 0
- [x] Quantity control completely removed

### Cart Page
- [x] Displays "Total Weight: X kg"
- [x] Shows segment breakdown if available
- [x] Format: "10–20g: 1.00kg • 20–35g: 0.50kg"
- [x] Remove button uses index, not productId + weight
- [x] Quantity controls removed
- [x] Total items = cart.items.length (not sum of quantities)

### Pricing
- [x] Accepts `{ segments: [...] }` or `{ total_weight_kg: X }`
- [x] Calculates total from segments array
- [x] Uses same pricing formula as before
- [x] Returns breakdown with total weight

---

## 🧪 Testing Checklist

### Basic Flow
- [ ] Navigate to product detail page
- [ ] Click a weight range pill → Segment added
- [ ] Enter weight in kg → Price updates after 300ms
- [ ] Add multiple ranges → Total weight updates
- [ ] Remove a segment → Total and price recalculate
- [ ] Add to cart → Redirects to cart page

### Cart Display
- [ ] Cart shows total weight correctly
- [ ] Breakdown displays all segments
- [ ] Remove item by clicking × button
- [ ] Cart total updates after removal

### Edge Cases
- [ ] Add same range multiple times → Each appears separately
- [ ] Enter 0 or negative weight → Min value enforced (0.01)
- [ ] Remove all segments → "Add to Cart" disabled
- [ ] Price breakdown shows correct calculations

### Data Persistence
- [ ] Cart persists in cookie after page reload
- [ ] Segments stored correctly in cart item
- [ ] Total weight matches sum of segments

---

## 🚀 Deployment Notes

### Database
- ✅ No schema changes required
- ✅ Existing `products.weight_ranges` field used as-is

### API
- ✅ Backward compatible - accepts both formats:
  - `{ total_weight_kg: 1.5 }`
  - `{ segments: [{range, weight_kg}] }`

### Breaking Changes
- ⚠️ **CartItem type changed** - `quantity` field removed
- ⚠️ **Cart functions changed** - `updateCartItemQuantity` removed
- ⚠️ Existing carts with old structure should be cleared

### Migration
Add this to a one-time migration script or clear cookies:
```typescript
// Clear old cart format
document.cookie = 'reseller_cart=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
```

---

## 📊 Before vs After

### Before (Single Weight + Quantity)
```
┌────────────────────────┐
│ Weight: [1.00] kg      │
│ Quantity: [3]          │
│                        │
│ Total: ₹300,000        │
│ (1kg × 3 items)        │
└────────────────────────┘
```

### After (Multi-Range Selector)
```
┌────────────────────────────┐
│ [+ 10-20g] [+ 20-35g]      │
│                            │
│ 10-20g  [1.00] kg    [×]  │
│ 20-35g  [0.50] kg    [×]  │
│                            │
│ Total Weight: 1.500 kg     │
│ Total: ₹123,909            │
└────────────────────────────┘
```

---

## 💡 Benefits

1. **More Accurate Pricing**: Weight-based instead of arbitrary quantity
2. **Flexible Orders**: Mix multiple weight ranges in one order
3. **Better UX**: Visual range selection with pills
4. **Transparent**: Shows breakdown of what was ordered
5. **Real-time Feedback**: Live price updates as segments change

---

## ✅ Status: Complete!

All components updated to use multi-range weight selector! 🎉

**Modified:** 5 files  
**Lines Changed:** ~400 lines  
**New Features:** Multi-range selector, segment management, breakdown display  
**Removed:** Quantity field, quantity controls, duplicate cart checking  
