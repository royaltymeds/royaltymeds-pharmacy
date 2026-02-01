# Prescription Item Column Analysis: total_amount, quantity, quantity_filled

## Executive Summary

The prescription filling workflow has **conflicting implementations** between the documented design and actual code:

1. **Documentation says:** Update `quantity` to remaining amount during fill
2. **Actual code does:** Only updates `quantity_filled`, leaves `quantity` unchanged
3. **Patient display calculates:** Filled = `total_amount - quantity` (treating quantity as remaining)
4. **Critical Issue:** The patient display formula will break with the current fill endpoint

---

## Column Definitions (Database Schema)

### `prescription_items` table:
```sql
quantity integer NOT NULL              -- Current value in DB
quantity_filled integer DEFAULT 0      -- Amount filled so far
total_amount integer                   -- Total prescribed amount
```

### `doctor_prescriptions_items` table:
```sql
quantity integer                       -- Current value in DB
quantity_filled integer DEFAULT 0      -- Amount filled so far
total_amount numeric                   -- Total prescribed amount
```

---

## Column Creation: Where Items Are CREATED

### Patient Prescriptions (app/api/patient/upload/route.ts)
```typescript
const itemsToInsert = medications.map((med: any) => ({
  prescription_id: prescriptionId,
  medication_name: med.name,
  dosage: med.dosage,
  quantity: med.quantity,        // ← Set to prescribed amount
  brand_choice: med.brandChoice || 'generic',
  notes: med.notes,
  // total_amount is NOT set (defaults to null)
  // quantity_filled defaults to 0
}));
```

### Admin Adding Items (app/api/admin/prescriptions/[id]/items/route.ts)
```typescript
const { data, error } = await supabaseAdmin
  .from(itemsTable)
  .insert([
    {
      [source === "doctor" ? "doctor_prescription_id" : "prescription_id"]: prescriptionId,
      medication_name,
      dosage,
      quantity: parseInt(quantity),         // ← Set to prescribed amount
      total_amount: parseInt(quantity),     // ← Also set to prescribed amount
      notes: notes || null,
      // quantity_filled defaults to 0
    },
  ])
```

### Doctor Prescriptions (app/api/doctor/prescriptions/route.ts)
```typescript
const medicationItems = body.medications.map((med: any) => ({
  doctor_prescription_id: prescriptionId,
  medication_name: med.name,
  dosage: med.dosage || null,
  quantity: med.quantity || null,        // ← Set to prescribed amount
  frequency: med.frequency || null,
  duration: med.duration || null,
  notes: med.notes || null,
  brand_choice: "generic",
  // total_amount is NOT set
  // quantity_filled defaults to 0
}));
```

**Creation Pattern:** 
- `quantity` = prescribed amount
- `quantity_filled` = 0 (default)
- `total_amount` = prescribed amount (when admin adds items)

---

## Column Update: During FILLING Process

### Fill Endpoint (app/api/admin/prescriptions/[id]/fill/route.ts - Lines 144-182)

```typescript
for (const item of items) {
  const originalItem = prescriptionItems.find((pi: any) => pi.id === item.itemId);
  
  if (!originalItem) {
    return error;
  }

  const quantityFilled = parseInt(item.quantityFilled) || 0;

  // Validate quantity filled
  if (quantityFilled < 0) {
    return error;
  }

  if (quantityFilled > originalItem.quantity) {
    return error("Quantity filled cannot exceed original quantity for item");
  }

  const remainingQuantity = originalItem.quantity - quantityFilled;

  if (remainingQuantity > 0) {
    hasZeroQuantity = false;
  }

  itemUpdates.push({
    itemId: item.itemId,
    quantityFilled,
    remainingQuantity,
  });
}

// Update prescription items
for (const update of itemUpdates) {
  const { error: updateError, data: updateData } = await supabaseAdmin
    .from(itemsTable)
    .update({
      quantity_filled: update.quantityFilled,  // ← ONLY THIS IS UPDATED
      // quantity is NOT updated in the database
    })
    .eq("id", update.itemId)
    .select();
}
```

**What the Fill Endpoint Actually Does:**
- ✅ Validates `quantityFilled` against `originalItem.quantity` (original prescribed amount)
- ✅ Calculates `remainingQuantity` in memory
- ✅ Updates `quantity_filled` in database
- ❌ **Does NOT update `quantity` in database**
- ❌ **Does NOT update `total_amount` in database**

The `remainingQuantity` is calculated but never persisted to the database.

---

## Patient Display Logic (app/patient/prescriptions/[id]/page.tsx - Line 249)

```typescript
interface PrescriptionItem {
  medication_name: string;
  quantity: number;
  quantity_filled?: number;
  total_amount?: number;
  dosage: string | null;
  notes?: string | null;
}

// Display formula:
Total: {item.total_amount || item.quantity} | 
Filled: {(item.total_amount || item.quantity) - item.quantity} | 
Remaining: {item.quantity}
```

**This formula assumes:**
- `Total` = `total_amount` (or fallback to `quantity` if not set)
- `Filled` = `Total - Remaining` = `(total_amount || quantity) - quantity`
- `Remaining` = `quantity`

**This only works if:**
- `total_amount` = original prescribed amount (constant)
- `quantity` = remaining amount (updated during fill)
- `quantity_filled` = not used in display

---

## Doctor View (app/doctor/my-prescriptions/MyPrescriptionsClient.tsx - Line 410)

```typescript
{item.quantity_filled ? `${item.quantity_filled}/${item.quantity}` : item.quantity}
```

**This displays:**
- If filled: `quantity_filled / quantity` 
- If not filled: just `quantity`

**This assumes:**
- `quantity` = original prescribed amount (never changes)
- `quantity_filled` = amount filled so far

This view **directly contradicts** the patient view formula!

---

## The Conflict

| Aspect | Patient Display Expects | Doctor Display Expects | Actual Code Does |
|--------|------------------------|----------------------|-----------------|
| **quantity at creation** | original amount | original amount | ✅ Set to original |
| **quantity during fill** | should become remaining | stays original | ✅ Never changes |
| **quantity_filled at fill** | ignored in calculation | used (filled / original) | ✅ Gets updated |
| **total_amount purpose** | holds original amount | N/A | ✅ Set when admin adds |
| **Formula for "Filled"** | `total_amount - quantity` | `quantity_filled / quantity` | ❌ CONFLICTS |

---

## What Should Happen (Documentation)

From `PRESCRIPTION_FILLING_FEATURE.md` (lines 114-116):

```
- Calculate remaining: original_quantity - quantity_filled
- Update prescription_items.quantity = remaining
- Update prescription_items.quantity_filled = quantity_filled
```

**This means:**
- `total_amount` = original prescribed quantity (immutable)
- `quantity` = remaining to fill (updated during fill: original - filled)
- `quantity_filled` = amount already filled (updated during fill)

**Example:**
1. Initial: `total_amount=100, quantity=100, quantity_filled=0` (100 remaining)
2. Fill 30: `total_amount=100, quantity=70, quantity_filled=30` (70 remaining)
3. Fill 50 more: `total_amount=100, quantity=20, quantity_filled=80` (20 remaining)

---

## Current Reality vs. Expected

### Scenario: Prescribe 100 units, fill 30, then fill 50 more

**Expected (per documentation):**
| Step | total_amount | quantity | quantity_filled |
|------|-------------|----------|-----------------|
| Create | 100 | 100 | 0 |
| Fill 30 | 100 | 70 | 30 |
| Fill 50 | 100 | 20 | 80 |

**Actual (current code):**
| Step | total_amount | quantity | quantity_filled |
|------|-------------|----------|-----------------|
| Create | null/100* | 100 | 0 |
| Fill 30 | null/100* | 100 | 30 |
| Fill 50 | null/100* | 100 | 80 |

*null when created via patient upload, 100 when admin adds items

---

## Patient Display Breakage

With current code, patient display would show:
```
Total: 100 | Filled: 0 | Remaining: 100    (initial - correct by accident)
Total: 100 | Filled: 0 | Remaining: 100    (after fill 30 - WRONG, shows 0 filled!)
Total: 100 | Filled: 0 | Remaining: 100    (after fill 80 - WRONG, shows 0 filled!)
```

The formula `Filled = total_amount - quantity` produces 0 because `quantity` never changes.

---

## Recommendations

### Option A: Follow Documentation (Recommended)
Update the fill endpoint to also update `quantity`:

```typescript
const { error: updateError } = await supabaseAdmin
  .from(itemsTable)
  .update({
    quantity_filled: update.quantityFilled,
    quantity: update.remainingQuantity,  // ← ADD THIS
  })
  .eq("id", update.itemId)
  .select();
```

**Pros:**
- Matches documentation
- Patient display formula works
- `quantity` becomes "remaining to fill"
- Doctor view needs adjustment

**Cons:**
- Breaking change for doctor view
- Need to fix doctor display to use `quantity_filled` vs `total_amount`

### Option B: Don't Update Quantity, Fix Patient Display
Keep quantity unchanged, fix patient display to use `quantity_filled`:

```typescript
// Change from:
Filled: {(item.total_amount || item.quantity) - item.quantity} | 

// To:
Filled: {item.quantity_filled} |
```

**Pros:**
- Minimal code changes
- Doctor view stays correct
- Clearer semantics (quantity = original, filled = amount filled)

**Cons:**
- Contradicts documentation
- Wastes `total_amount` as redundant copy of `quantity`
- More columns than necessary

### Option C: Clarify Intent
- Rename columns to be explicit:
  - `quantity` → `original_quantity` (never changes)
  - `quantity_filled` → `amount_filled` (increments)
  - Remove `total_amount` (redundant)

But this requires schema changes.

---

## Current Code Behavior Summary

| File | What It Does | Status |
|------|-------------|--------|
| **Creation** | Sets `quantity` to prescribed, `quantity_filled` to 0, optionally `total_amount` | ✅ Correct |
| **Fill Endpoint** | Updates only `quantity_filled`, leaves `quantity` unchanged | ❌ Incomplete |
| **Patient Display** | Uses formula assuming `quantity` changes | ❌ Will fail |
| **Doctor Display** | Uses `quantity_filled / quantity` correctly | ✅ Correct |
| **Documentation** | Says to update both `quantity` and `quantity_filled` | ⚠️ Not implemented |

