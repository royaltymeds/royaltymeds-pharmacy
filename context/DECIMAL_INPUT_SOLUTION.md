# SOLUTION: Decimal Input Issue - Root Cause & True Fix

## Problem Analysis

The issue reported was that decimal inputs (like `.50`, `.75`) were being **rejected while typing** and the Delete key on the numpad was acting like Enter/Tab instead of entering a decimal point.

### Root Cause (Not a Next.js Bug)

This is a **React controlled input behavior**, not a Next.js issue. Here's what was happening:

**The Broken Pattern (Previous Attempt):**
```jsx
const [price, setPrice] = useState<number>(5.50); // State is a NUMBER

<input
  type="number"
  step="any"
  value={price}  // Pass number to value prop
  onChange={(e) => setPrice(parseFloat(e.target.value))}  // Convert string → number
/>
```

**What happens when typing "5.":**
1. User types: "5."
2. Event fires with `e.target.value = "5."`
3. Code does: `parseFloat("5.")` → `5` (decimal point is lost!)
4. React updates state: `price = 5`
5. Input re-renders with `value={5}` → displays "5"
6. User sees the dot disappear - it appears "rejected"

**Why the numpad `.` acts like Enter:**
- HTML5's `type="number"` input has special handling on numeric keypads
- When validation fails, the browser's number input can misinterpret the decimal key
- The browser's native handlers interfere with the typing flow

## The True Solution

**Store the value as a STRING while editing, only convert to NUMBER when saving.**

This is the industry-standard pattern because:
1. ✅ Preserves all intermediate typing states ("5.", ".5", "5.1")
2. ✅ No artificial keystroke blocking
3. ✅ Works reliably across all browsers and devices
4. ✅ Provides clear validation on blur
5. ✅ Matches user expectations for decimal input

### Implementation Options

#### Option 1: Use the New `DecimalInput` Component (Recommended)

```jsx
import { DecimalInput } from '@/components/DecimalInput';

export function MyForm() {
  const [price, setPrice] = useState('5.50');

  return (
    <DecimalInput
      value={price}
      onChange={setPrice}
      onBlur={(num) => {
        console.log('Saved number:', num); // num is 5.5
        // Persist to database
      }}
      placeholder="0.00"
      precision={2}
      className="rounded border border-gray-300 px-3 py-2"
    />
  );
}
```

**Advantages:**
- Drop-in replacement for broken number inputs
- Handles all edge cases (empty, invalid, precision)
- Uses `inputMode="decimal"` for proper mobile keyboard
- Fully accessible and semantic
- TypeScript support

#### Option 2: Use the Custom Hook (For Complex Forms)

```jsx
import { useDecimalInput } from '@/lib/hooks/useDecimalInput';

export function MyForm() {
  const [formData, setFormData] = useState({ price: null });
  
  const priceInput = useDecimalInput(
    formData.price || '',
    (num) => setFormData({ ...formData, price: num }),
    2 // precision: 2 decimal places
  );

  return (
    <input
      type="text"
      inputMode="decimal"
      value={priceInput.displayValue}
      onChange={priceInput.handleChange}
      onBlur={priceInput.handleBlur}
    />
  );
}
```

**Advantages:**
- Full control over validation logic
- Can integrate with form libraries (React Hook Form, Formik)
- Reusable across multiple inputs

#### Option 3: Inline Implementation (Quick Fix for One-Off Inputs)

For a simple, inline approach without creating new files:

```jsx
const [price, setPrice] = useState('5.50'); // String state!

const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const value = e.target.value;
  
  // Allow empty or valid decimal patterns
  if (value === '' || /^-?(\d+\.?\d*|\.\d+)$/.test(value)) {
    setPrice(value);
  }
};

const handlePriceBlur = () => {
  const num = parseFloat(price);
  if (!Number.isNaN(num)) {
    // Persist to database
    saveToDB(num);
  }
};

return (
  <input
    type="text"
    inputMode="decimal"
    value={price}
    onChange={handlePriceChange}
    onBlur={handlePriceBlur}
    placeholder="0.00"
  />
);
```

## Why This Works

1. **State is a String**: Keeps typing state intact (no conversion losses)
2. **inputMode="decimal"**: Phones show decimal keyboard automatically
3. **Regex Validation**: Only allows valid decimal patterns
4. **Blur Conversion**: Converts to number only when needed
5. **No type="number"**: Avoids browser's problematic number input behavior

## Testing Checklist

After applying the solution, test these scenarios:

- [ ] Type `12.50` - decimal accepted immediately
- [ ] Type `0.99` - works as expected
- [ ] Type `.75` - leading decimal works
- [ ] Type `103.275` - multi-digit decimals work
- [ ] Blur input - value is formatted and saved
- [ ] Clear field - properly handles empty state
- [ ] Paste decimal - handles clipboard paste
- [ ] Mobile numpad - decimal key works correctly
- [ ] Tab/Enter - submission works normally

## Files Created

1. **`/lib/hooks/useDecimalInput.ts`** - Custom React hook for decimal state management
2. **`/components/DecimalInput.tsx`** - Reusable component (recommended for new code)

## Files That Need Updates

The following components should be migrated to use `DecimalInput`:

1. `components/admin/restock/new-restock-request-form.tsx` - quantity_requested, unit_price
2. `components/admin/restock/suppliers-list.tsx` - supplier_unit_price, minimum_order_quantity
3. `components/admin/restock/restock-workflow-tabs.tsx` - quantity_ordered, unit_price

## References

- [React Input Documentation](https://react.dev/reference/react-dom/components/input)
- [MDN: HTML Input type="text"](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/text)
- [Web Standards: inputMode](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/inputmode)
- Industry pattern: Keep display value as string, convert to number only on persist

## Summary

**The "true solution" is not using `type="number"` for decimal input.** The HTML5 `type="number"` input was designed for whole numbers and has limitations with decimals in controlled components. By using:

- `type="text"` with `inputMode="decimal"`
- String state during editing
- Number conversion only on blur/submit

You get the best UX for decimal input that works reliably across all platforms and devices. This is what professional financial and scientific applications use.
