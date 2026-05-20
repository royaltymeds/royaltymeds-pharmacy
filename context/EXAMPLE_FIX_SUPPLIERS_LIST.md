# EXAMPLE: Fixing suppliers-list.tsx - Step by Step

## Current Problem (Lines 744-765)

```jsx
// Current BROKEN code in suppliers-list.tsx around line 744
<label className="text-xs font-medium uppercase tracking-wide text-gray-500">Unit Cost
  <input
    type="number"
    step="any"
    value={Number.isNaN(product.supplier_unit_price) ? '' : product.supplier_unit_price}
    onChange={(e) => updateSupplierProductDraft(selectedSupplierDetails.id, product.id, { supplier_unit_price: e.target.value === '' ? Number.NaN : parseFloat(e.target.value) })}
    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-normal normal-case tracking-normal text-gray-900 focus:outline-none align-top focus:ring-2 focus:ring-blue-600"
  />
</label>
<label className="text-xs font-medium uppercase tracking-wide text-gray-500">Min Qty
  <input
    type="number"
    step="any"
    value={Number.isNaN(product.minimum_order_quantity) ? '' : product.minimum_order_quantity}
    onChange={(e) => updateSupplierProductDraft(selectedSupplierDetails.id, product.id, { minimum_order_quantity: e.target.value === '' ? Number.NaN : parseFloat(e.target.value) })}
    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-normal normal-case tracking-normal text-gray-900 focus:outline-none align-top focus:ring-2 focus:ring-blue-600"
  />
</label>
```

## Solution: Use DecimalInput Component

### Step 1: Add Import
```jsx
import { DecimalInput } from '@/components/DecimalInput';
```

### Step 2: Replace the Inputs

```jsx
// FIXED code
<label className="text-xs font-medium uppercase tracking-wide text-gray-500">Unit Cost
  <DecimalInput
    value={String(Number.isNaN(product.supplier_unit_price) ? '' : product.supplier_unit_price)}
    onChange={() => {}} // No update during typing - only on blur
    onBlur={(numValue) => {
      if (numValue !== null) {
        updateSupplierProductDraft(selectedSupplierDetails.id, product.id, { supplier_unit_price: numValue });
      }
    }}
    precision={2}
    placeholder="0.00"
    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-normal normal-case tracking-normal text-gray-900 focus:outline-none align-top focus:ring-2 focus:ring-blue-600"
  />
</label>
<label className="text-xs font-medium uppercase tracking-wide text-gray-500">Min Qty
  <DecimalInput
    value={String(Number.isNaN(product.minimum_order_quantity) ? '' : product.minimum_order_quantity)}
    onChange={() => {}} // No update during typing - only on blur
    onBlur={(numValue) => {
      if (numValue !== null) {
        updateSupplierProductDraft(selectedSupplierDetails.id, product.id, { minimum_order_quantity: numValue });
      }
    }}
    precision={0}  // Whole numbers only for quantity
    placeholder="1"
    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-normal normal-case tracking-normal text-gray-900 focus:outline-none align-top focus:ring-2 focus:ring-blue-600"
  />
</label>
```

## What Changed

| Aspect | Before | After |
|--------|--------|-------|
| Element | `<input type="number">` | `<DecimalInput>` |
| onChange | Updates state on every keystroke | Not used |
| onBlur | Nothing | Updates state when user leaves field |
| State Type | Number | String during edit (internal) |
| Decimal Behavior | Rejected | Accepted immediately |

## Why This Works

1. **DecimalInput uses `type="text"`** - Doesn't have browser's number input limitations
2. **inputMode="decimal"** - Mobile still shows decimal keyboard
3. **String state internally** - Preserves "5." while typing
4. **Converts to number on blur** - Only then calls your callback with the numeric value
5. **All existing code unchanged** - Your updateSupplierProductDraft still receives numeric values

## Testing This Change

1. In suppliers-list.tsx, make the changes above
2. Go to Admin → Restock → Suppliers → click a supplier
3. In the supplier products section, click Edit on a product
4. Try typing these values in Unit Cost field:
   - `12.50` ✓ Should accept immediately
   - `.75` ✓ Should accept immediately  
   - `0.99` ✓ Should work
   - `103.275` ✓ Should work
5. Click elsewhere to blur - value should round to 2 decimals and save
6. Refresh page - verify the value persisted

## Bonus: Use the Hook for Even More Control

If you need more control (e.g., validation, dependent fields), use the hook:

```jsx
import { useDecimalInput } from '@/lib/hooks/useDecimalInput';

// At the top of the component or in a helper
const createPriceInputHandler = (productId: string, currentValue: number) => {
  return useDecimalInput(
    currentValue,
    (numValue) => {
      // Can add custom validation here
      if (numValue < 0) {
        console.error('Price cannot be negative');
        return;
      }
      updateSupplierProductDraft(selectedSupplierDetails.id, productId, { supplier_unit_price: numValue });
    },
    2
  );
};

// Then in JSX:
const priceInput = createPriceInputHandler(product.id, product.supplier_unit_price);

<input
  type="text"
  inputMode="decimal"
  value={priceInput.displayValue}
  onChange={priceInput.handleChange}
  onBlur={priceInput.handleBlur}
  className="..."
/>
```

## Files That Have the Same Issue

Apply the same fix to:

1. **suppliers-list.tsx** (currently broken)
   - Line ~744: Unit Cost input
   - Line ~753: Min Qty input
   - Any other form fields for supplier/product creation

2. **restock-workflow-tabs.tsx** (currently broken)
   - Line 1180: quantity_ordered in manual PO
   - Line 1181: unit_price in manual PO
   - Lines 1267, 1278: Other numeric fields

3. **new-restock-request-form.tsx** (currently broken)
   - Any quantity_requested or unit_price inputs

## Complete Working Example

Here's a minimal example showing the complete pattern:

```jsx
'use client';

import { DecimalInput } from '@/components/DecimalInput';
import { useState } from 'react';

export function SupplierProductEditor({ product, onSave }) {
  const [formData, setFormData] = useState(product);

  const handleSave = async () => {
    const result = await onSave(formData);
    if (!result.error) {
      // Success feedback
    }
  };

  return (
    <div className="space-y-4 rounded-lg border border-gray-300 p-4">
      <h3 className="font-bold">{product.product_name}</h3>

      <div>
        <label className="block text-sm font-medium text-gray-700">Unit Cost ($)</label>
        <DecimalInput
          value={String(formData.supplier_unit_price || '')}
          onChange={() => {}} // Only update on blur
          onBlur={(num) => {
            if (num !== null) {
              setFormData({ ...formData, supplier_unit_price: num });
            }
          }}
          precision={2}
          placeholder="0.00"
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Minimum Quantity</label>
        <DecimalInput
          value={String(formData.minimum_order_quantity || '')}
          onChange={() => {}}
          onBlur={(num) => {
            if (num !== null && num > 0) {
              setFormData({ ...formData, minimum_order_quantity: Math.floor(num) });
            }
          }}
          precision={0}
          placeholder="1"
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
        />
      </div>

      <button
        onClick={handleSave}
        className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
      >
        Save Product
      </button>
    </div>
  );
}
```

## Summary

The fix is simple:
1. Replace `type="number"` with `<DecimalInput>`
2. Don't update state during `onChange`
3. Update state in `onBlur` with the numeric value
4. Test decimal input works: `12.50`, `.75`, etc.

That's it! The rest of your code stays the same.
