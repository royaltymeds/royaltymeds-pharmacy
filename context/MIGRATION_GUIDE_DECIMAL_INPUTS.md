# Migration Guide: Fixing Decimal Inputs in Restock Components

## Summary

This guide shows how to migrate from broken `type="number"` decimal inputs to the working `DecimalInput` component.

## Before & After Examples

### Example 1: Simple List Display (suppliers-list.tsx)

#### ❌ BROKEN CODE (Current)

```jsx
// supplier_unit_price is stored as NUMBER in state
const [supplierProductsMap, setSupplierProductsMap] = useState<Record<string, SupplierProduct[]>>({});

// Problem: Converting string to number on every keystroke collapses "5."
<input
  type="number"
  step="any"
  value={Number.isNaN(product.supplier_unit_price) ? '' : product.supplier_unit_price}
  onChange={(e) => updateSupplierProductDraft(
    selectedSupplierDetails.id, 
    product.id, 
    { supplier_unit_price: e.target.value === '' ? Number.NaN : parseFloat(e.target.value) }
  )}
/>
```

#### ✅ FIXED CODE (Using DecimalInput)

```jsx
import { DecimalInput } from '@/components/DecimalInput';

// No change needed to supplier_unit_price in state - it's still numeric for DB
// Just use DecimalInput component
<DecimalInput
  value={String(Number.isNaN(product.supplier_unit_price) ? '' : product.supplier_unit_price)}
  onChange={(displayValue) => {
    // Just update display during typing, don't convert to number yet
    // Store in a temporary display state
  }}
  onBlur={(numValue) => {
    // On blur, convert to number and update actual state
    if (numValue !== null) {
      updateSupplierProductDraft(selectedSupplierDetails.id, product.id, { supplier_unit_price: numValue });
    }
  }}
  precision={2}
  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
  placeholder="0.00"
/>
```

### Example 2: Complex Form with Multiple Decimal Fields

#### ❌ BROKEN CODE (Current - restock-workflow-tabs.tsx)

```jsx
const [manualPoItems, setManualPoItems] = useState<PurchaseOrderItem[]>([]);

{manualPoItems.map((item, index) => (
  <div key={item.supplier_product_id}>
    {/* BROKEN: String → parseFloat → loses "." */}
    <input
      type="number"
      step="any"
      value={Number.isNaN(item.quantity_ordered) ? '' : item.quantity_ordered}
      onChange={(event) =>
        setManualPoItems((current) =>
          current.map((currentItem, itemIndex) =>
            itemIndex === index
              ? {
                  ...currentItem,
                  quantity_ordered: event.target.value === '' 
                    ? Number.NaN 
                    : Math.max(1, parseFloat(event.target.value)),
                }
              : currentItem
          )
        )
      }
    />
    
    {/* Same problem with unit_price */}
    <input
      type="number"
      step="any"
      value={Number.isNaN(item.unit_price) ? '' : item.unit_price}
      onChange={(event) =>
        setManualPoItems((current) =>
          current.map((currentItem, itemIndex) =>
            itemIndex === index
              ? {
                  ...currentItem,
                  unit_price: event.target.value === '' ? Number.NaN : parseFloat(event.target.value),
                }
              : currentItem
          )
        )
      }
    />
  </div>
))}
```

#### ✅ FIXED CODE (Using DecimalInput with Local Display State)

```jsx
import { DecimalInput } from '@/components/DecimalInput';

const [manualPoItems, setManualPoItems] = useState<PurchaseOrderItem[]>([]);
// New state to track display values (strings) while editing
const [displayValues, setDisplayValues] = useState<Record<string, { quantity: string; price: string }>>({});

const getDisplayValue = (itemId: string, field: 'quantity' | 'price', numeric: number) => {
  const key = `${itemId}-${field}`;
  return displayValues[key] !== undefined 
    ? displayValues[key][field]
    : (Number.isNaN(numeric) ? '' : String(numeric));
};

const updateDisplayValue = (itemId: string, field: 'quantity' | 'price', value: string) => {
  setDisplayValues((prev) => ({
    ...prev,
    [itemId]: { ...prev[itemId], [field]: value },
  }));
};

const saveNumericValue = (index: number, field: 'quantity_ordered' | 'unit_price', numValue: number | null) => {
  if (numValue === null) return;
  
  setManualPoItems((current) =>
    current.map((item, idx) =>
      idx === index
        ? {
            ...item,
            [field]: field === 'quantity_ordered' ? Math.max(1, numValue) : numValue,
          }
        : item
    )
  );
};

// In JSX:
{manualPoItems.map((item, index) => (
  <div key={item.supplier_product_id} className="grid gap-2">
    <DecimalInput
      value={getDisplayValue(`${item.supplier_product_id}-qty`, 'quantity', item.quantity_ordered)}
      onChange={(value) => updateDisplayValue(`${item.supplier_product_id}-qty`, 'quantity', value)}
      onBlur={(numValue) => saveNumericValue(index, 'quantity_ordered', numValue)}
      precision={0}
      placeholder="Qty"
      className="rounded border border-gray-300 px-2 py-1"
      min="1"
    />
    
    <DecimalInput
      value={getDisplayValue(`${item.supplier_product_id}-price`, 'price', item.unit_price)}
      onChange={(value) => updateDisplayValue(`${item.supplier_product_id}-price`, 'price', value)}
      onBlur={(numValue) => saveNumericValue(index, 'unit_price', numValue)}
      precision={2}
      placeholder="Price"
      className="rounded border border-gray-300 px-2 py-1"
    />
  </div>
))}
```

### Example 3: Using the Custom Hook (For Maximum Control)

```jsx
import { useDecimalInput } from '@/lib/hooks/useDecimalInput';

function SupplierProductPriceField({ product, onSave }) {
  const priceInput = useDecimalInput(
    product.supplier_unit_price,
    (numValue) => {
      onSave(product.id, { supplier_unit_price: numValue });
    },
    2 // precision: 2 decimals
  );

  return (
    <input
      type="text"
      inputMode="decimal"
      value={priceInput.displayValue}
      onChange={priceInput.handleChange}
      onBlur={priceInput.handleBlur}
      placeholder="0.00"
      className="w-full rounded border border-gray-300 px-3 py-2"
    />
  );
}
```

## Step-by-Step Migration Instructions

### For Each Component:

1. **Import the DecimalInput component:**
   ```jsx
   import { DecimalInput } from '@/components/DecimalInput';
   ```

2. **If simple input (no array/map):**
   - Replace `type="number"` input with `DecimalInput`
   - Keep the state as is (numeric)
   - Use `onBlur` callback to save numeric value

3. **If array of items (form rows):**
   - Create a separate state for display values: `Record<string, string>`
   - Keep item state as numeric
   - In onChange: update display value only
   - In onBlur: convert to number and update item state

4. **Test the changes:**
   - Type decimal values: `12.50`, `0.99`, `.75`, `103.275`
   - Verify no characters are rejected
   - Verify values persist after blur
   - Verify mobile keyboard shows decimal

## Key Differences from type="number"

| Aspect | type="number" | DecimalInput |
|--------|---------------|-------------|
| Typing "5." | Collapses to 5 | Shows "5." |
| Decimal point | Often rejected | Always accepted |
| Mobile keyboard | Numeric (may vary) | Decimal keyboard |
| Browser validation | Yes (can block input) | Custom (JavaScript) |
| State type | Number (problematic) | String while editing |
| Conversion | Every keystroke | Only on blur |

## Integration with Form Libraries

### With React Hook Form:

```jsx
import { useController } from 'react-hook-form';
import { DecimalInput } from '@/components/DecimalInput';

function PriceField({ control, name }) {
  const { field } = useController({ control, name });

  return (
    <DecimalInput
      value={field.value ? String(field.value) : ''}
      onChange={(displayValue) => {
        // React Hook Form will see the numeric value on blur
      }}
      onBlur={(numValue) => {
        field.onChange(numValue);
      }}
      precision={2}
    />
  );
}
```

## Affected Components

Apply this migration to:

1. **`components/admin/restock/suppliers-list.tsx`**
   - `supplier_unit_price` (line 747)
   - `minimum_order_quantity` (line 756)
   - Form fields for supplier creation/edit

2. **`components/admin/restock/restock-workflow-tabs.tsx`**
   - `quantity_ordered` (line 1180)
   - `unit_price` (line 1181)
   - Other manual PO entry fields

3. **`components/admin/restock/new-restock-request-form.tsx`**
   - `quantity_requested`
   - `unit_price`

## Testing Checklist After Migration

- [ ] Type `12.50` in any price field
- [ ] Type `.75` (leading decimal)
- [ ] Type `0.99`
- [ ] Type `103.275` (multi-decimal)
- [ ] Blur the input
- [ ] Value displays rounded to precision
- [ ] Value persists in state/database
- [ ] Mobile shows decimal keyboard
- [ ] Numpad decimal key works correctly
- [ ] Clear field works (empty state)
- [ ] Form submission includes decimal values

## Common Pitfalls to Avoid

1. ❌ **Don't keep state as number while editing:**
   ```jsx
   // WRONG
   const [price, setPrice] = useState<number>(5.50);
   // Still loses "5." on keystroke
   ```

2. ❌ **Don't use type="number" in any form:**
   ```jsx
   // WRONG
   <input type="number" value={displayString} />
   // Browser will still interfere with decimals
   ```

3. ❌ **Don't forget to convert on blur:**
   ```jsx
   // WRONG - never calls onSave
   <DecimalInput value={price} onChange={setPrice} />
   // CORRECT
   <DecimalInput value={price} onChange={setPrice} onBlur={(num) => save(num)} />
   ```

4. ⚠️ **Display values must remain strings during editing:**
   ```jsx
   // If converting back to number too early, you lose the benefit
   // Wait until blur to call parseFloat
   ```

## Performance Considerations

- DecimalInput components have minimal rendering impact
- Only convert string to number on blur (not every keystroke)
- Display state for arrays is O(n) but negligible for typical form sizes
- No external dependencies required

## References

- [DecimalInput Component Source](/components/DecimalInput.tsx)
- [useDecimalInput Hook Source](/lib/hooks/useDecimalInput.ts)
- [Full Technical Solution](/context/DECIMAL_INPUT_SOLUTION.md)
- [React Input Documentation](https://react.dev/reference/react-dom/components/input)
