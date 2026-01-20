# Prescription Filling Feature - Implementation Plan

**Date Created:** January 20, 2026  
**Priority:** High  
**Status:** Not Started  

## Overview

Add a prescription filling feature that allows admins (pharmacists) to track and manage medication fulfillment for prescriptions. This includes recording quantities filled, updating prescription status, and tracking who filled the prescription and when.

## Feature Requirements

### 1. Prescription Status Updates
- New statuses: `processing`, `partially_filled`, `filled`
- Updated constraint on `prescriptions` and `doctor_prescriptions` tables
- Status flow: `pending` → `approved` → `processing` → (`partially_filled` | `filled`)

### 2. Prescription Items Tracking
- Track `quantity_filled` for each medication item
- Formula: `remaining_quantity = original_quantity - quantity_filled`
- Update database with remaining quantity after filling

### 3. Pharmacist Information
- Record pharmacist name (admin user who performed the fill)
- Record timestamp of when prescription was filled or partially filled
- Add columns: `pharmacist_name`, `filled_at` to prescriptions table

### 4. Admin UI Interactions
- "Fill Prescription" button on medications card (visible when status = `processing` or `partially_filled`)
- Edit mode for medications with quantity filled input
- "Done Filling" button to complete the operation
- Automatic status determination:
  - All quantities = 0 → `filled`
  - Any quantity > 0 → `partially_filled`

## Database Changes

### Migration: 20260120000004_add_prescription_filling_feature.sql

**Prescriptions Table:**
```sql
ALTER TABLE prescriptions
  ADD COLUMN filled_at timestamp with time zone,
  ADD COLUMN pharmacist_name text;
  
-- Update status constraint
ALTER TABLE prescriptions
  ADD CONSTRAINT prescriptions_status_check 
  CHECK (status = ANY(ARRAY['pending', 'approved', 'rejected', 'processing', 'partially_filled', 'filled']));
```

**Prescription Items Table:**
```sql
ALTER TABLE prescription_items
  ADD COLUMN quantity_filled integer DEFAULT 0;
```

**Doctor Prescriptions Table:**
```sql
ALTER TABLE doctor_prescriptions
  ADD COLUMN filled_at timestamp with time zone,
  ADD COLUMN pharmacist_name text;
  
-- Update status constraint
ALTER TABLE doctor_prescriptions
  ADD CONSTRAINT doctor_prescriptions_status_check 
  CHECK (status = ANY(ARRAY['pending', 'approved', 'rejected', 'processing', 'partially_filled', 'filled']));
```

**Indexes:**
- `idx_prescriptions_status` - For faster status queries
- `idx_prescriptions_patient_status` - For patient/status queries

## API Endpoints

### New Endpoint: PATCH /api/admin/prescriptions/[id]/fill

**Responsibility:** Handle prescription filling operation

**Request Body:**
```typescript
{
  items: Array<{
    itemId: string;
    quantityFilled: number;
  }>;
}
```

**Response:**
```typescript
{
  success: boolean;
  data: {
    prescription: {
      id: string;
      status: 'processing' | 'partially_filled' | 'filled';
      filled_at: string;
      pharmacist_name: string;
    };
    items: Array<{
      id: string;
      quantity_filled: number;
      remaining_quantity: number;
    }>;
  };
  error?: string;
}
```

**Logic:**
1. Verify admin role
2. For each item:
   - Calculate remaining: original_quantity - quantity_filled
   - Update prescription_items.quantity = remaining
   - Update prescription_items.quantity_filled = quantity_filled
3. Determine new prescription status:
   - If all items have quantity = 0 → status = 'filled'
   - Else → status = 'partially_filled'
4. Update prescription:
   - Set status
   - Set filled_at = now()
   - Set pharmacist_name = authenticated user's name
5. Return updated data

## UI Components

### Admin Prescription Details Page Changes

#### 1. Medications Card - Fill Button
**Location:** Bottom of medications section
**Visibility:** When status = `processing` or `partially_filled`
**Style:** Inline button, blue background
**Text:** "Fill Prescription"
**Action:** Toggle `isFillingPrescription` state

#### 2. Fill Mode - Edit Quantities
**Display When:** `isFillingPrescription === true`
**For Each Medication:**
- Show original quantity (disabled/read-only)
- Show input box: "Quantity to Fill"
- Show calculated remaining quantity in real-time

**Form Inputs:**
```tsx
- medication_name (read-only display)
- dosage (read-only display)  
- quantity (original, read-only)
- quantity_filled (input, number)
- remaining = quantity - quantity_filled (calculated display)
```

#### 3. Done Filling Button
**Visibility:** When in fill mode
**Style:** Green button (primary action)
**Text:** "Done Filling"
**Action:** 
1. Validate all quantity_filled values are non-negative
2. Call PATCH /api/admin/prescriptions/[id]/fill
3. Show success/error message
4. Update local prescription state
5. Exit fill mode

#### 4. Cancel Filling Button
**Visibility:** When in fill mode
**Style:** Gray button
**Text:** "Cancel"
**Action:** Exit fill mode without saving

## State Management

### New State Variables
```typescript
const [isFillingPrescription, setIsFillingPrescription] = useState(false);
const [quantitiesBeingFilled, setQuantitiesBeingFilled] = useState<Record<string, number>>({});
```

### Handlers
```typescript
const handleFillPrescription = () => {
  // Initialize quantities being filled
  setQuantitiesBeingFilled(
    prescription.prescription_items.reduce((acc, item) => ({
      ...acc,
      [item.id]: 0
    }), {})
  );
  setIsFillingPrescription(true);
};

const handleDoneFilling = async () => {
  // Validate quantities
  // API call
  // Update state
  // Show message
};

const handleCancelFilling = () => {
  setIsFillingPrescription(false);
  setQuantitiesBeingFilled({});
};

const handleQuantityFilledChange = (itemId: string, value: number) => {
  setQuantitiesBeingFilled({
    ...quantitiesBeingFilled,
    [itemId]: value
  });
};
```

## Data Flow

```
Admin clicks "Fill Prescription"
    ↓
isFillingPrescription = true (show edit mode)
    ↓
Admin enters quantity filled for each medication
    ↓
Real-time calculation: remaining = quantity - quantity_filled
    ↓
Admin clicks "Done Filling"
    ↓
API call: PATCH /api/admin/prescriptions/[id]/fill
    ↓
Server validates and updates:
  - prescription_items.quantity = remaining
  - prescription_items.quantity_filled = value
  - prescriptions.status = (all 0 ? 'filled' : 'partially_filled')
  - prescriptions.filled_at = now()
  - prescriptions.pharmacist_name = user.name
    ↓
Response returns updated data
    ↓
Update local state
    ↓
Show success message
    ↓
Exit fill mode
```

## Security Considerations

1. **Authentication:** Admin/pharmacist role required
2. **Authorization:** Can only fill prescriptions in `processing` or `partially_filled` status
3. **Validation:**
   - quantity_filled must be non-negative integer
   - quantity_filled cannot exceed original quantity
   - Only process valid prescription IDs
4. **RLS Policies:** Admin can only modify prescriptions in their scope
5. **Audit Trail:** pharmacist_name and filled_at recorded for accountability

## Implementation Checklist

- [ ] Push migration to Supabase
- [ ] Create PATCH /api/admin/prescriptions/[id]/fill endpoint
- [ ] Add state variables to prescription-detail-client.tsx
- [ ] Create handlers: handleFillPrescription, handleDoneFilling, handleCancelFilling
- [ ] Update medications card UI:
  - [ ] Add "Fill Prescription" button (visible when processing/partially_filled)
  - [ ] Add fill mode with quantity inputs
  - [ ] Add "Done Filling" and "Cancel" buttons
  - [ ] Add real-time calculation display
- [ ] Test functionality:
  - [ ] Fill entire prescription (all quantities = 0)
  - [ ] Partially fill prescription (some quantities remain)
  - [ ] Verify status updates correctly
  - [ ] Verify pharmacist name recorded
  - [ ] Verify timestamp recorded
- [ ] Test edge cases:
  - [ ] Invalid input validation
  - [ ] Negative quantities
  - [ ] Quantities exceeding original amount
  - [ ] Concurrent fills (prevent race conditions)
- [ ] Update admin prescription list to show fill status
- [ ] Deploy to production

## Testing Scenarios

### Scenario 1: Complete Fill
1. Prescription has 2 medications (30 qty, 60 qty)
2. Fill 30 and 60 respectively
3. Expected: Status = `filled`, remaining = (0, 0)

### Scenario 2: Partial Fill
1. Prescription has 2 medications (30 qty, 60 qty)
2. Fill 20 and 30 respectively
3. Expected: Status = `partially_filled`, remaining = (10, 30)

### Scenario 3: Multiple Fills
1. First fill: 20 from 30, 30 from 60
2. Status = `partially_filled`
3. Second fill: 10 from 10, 30 from 30
4. Expected: Status = `filled`, remaining = (0, 0)

## Future Enhancements

- Barcode scanning for medications
- Inventory tracking integration
- Batch filling for multiple prescriptions
- Fill history/audit log view
- Print labels with fill information
- Automated low-stock alerts

## Notes

- Pharmacist name comes from authenticated user's profile
- All timestamps use UTC/server timezone
- Quantities are numeric integers
- Cannot "undo" a fill (create separate API for adjustments if needed)
