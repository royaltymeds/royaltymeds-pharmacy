# Prescription Details Page Refactoring Plan

**Date Created:** January 19, 2026  
**Priority:** Medium  
**Status:** Not Started  

## Overview

Refactor the prescription details page to follow the server component/client component architecture principle: the page should be a server component that displays data, with small client components used only for interactive elements (forms, edits, deletions).

## Current Architecture (Problem)

```
page.tsx (Server Component)
  └─ PrescriptionDetailClient (Client Component - ENTIRE PAGE)
      ├─ Status display (read-only)
      ├─ Prescription number (read-only)
      ├─ Patient info (read-only)
      ├─ Prescription details (read-only)
      ├─ Medications section (interactive + display)
      ├─ Admin notes (interactive)
      ├─ Doctor details (interactive)
      ├─ File section (read-only)
      ├─ Timeline (read-only)
      ├─ Source badge (read-only)
      └─ Actions section (interactive)
```

**Issues:**
- Entire page rendered client-side (no server-side rendering benefits)
- Page hydration includes unnecessary read-only data
- Bundle size larger than needed
- No server-side optimization for static content

## Proposed Architecture (Solution)

```
page.tsx (Server Component)
  ├─ Status Card (server-rendered, read-only)
  ├─ Prescription Number Card (server-rendered, read-only)
  ├─ Patient Information Card (server-rendered, read-only)
  ├─ Prescription Details Card (server-rendered, read-only)
  ├─ MedicationsEditor (Client Component)
  ├─ NotesEditor (Client Component)
  ├─ DoctorDetailsEditor (Client Component)
  ├─ File Card (server-rendered, read-only)
  ├─ Timeline Card (server-rendered, read-only)
  ├─ Source Badge Card (server-rendered, read-only)
  └─ ActionsSection (Client Component)
```

**Benefits:**
- Read-only content server-side rendered (faster first paint)
- Smaller client-side bundle (only interactive components)
- Better SEO for static content
- Improved performance on slower connections
- Easier to cache static sections

## Implementation Plan

### Phase 1: Create New Client Components

#### 1.1 Create `MedicationsEditor` Client Component
**File:** `app/admin/prescriptions/[id]/medications-editor.tsx`

**Props:**
```typescript
interface MedicationsEditorProps {
  prescriptionId: string;
  initialItems: PrescriptionItem[];
  status: "pending" | "approved" | "rejected" | "processing";
}
```

**Responsibility:**
- Display list of medications
- Handle add/edit/delete operations
- Show edit forms when in edit mode
- Manage loading and error states

**Current Source:**
- Extract medications section from `prescription-detail-client.tsx` (lines ~500-800)
- Extract handlers: `handleAddMedication`, `handleUpdateMedication`, `handleDeleteMedication`

---

#### 1.2 Create `NotesEditor` Client Component
**File:** `app/admin/prescriptions/[id]/notes-editor.tsx`

**Props:**
```typescript
interface NotesEditorProps {
  prescriptionId: string;
  initialNotes: string | null;
}
```

**Responsibility:**
- Display admin notes
- Toggle edit mode with Edit button
- Handle save/cancel operations
- Manage loading and error states

**Current Source:**
- Extract admin notes section from `prescription-detail-client.tsx` (lines ~805-850)
- Extract handler: `handleSaveNotes`

---

#### 1.3 Create `DoctorDetailsEditor` Client Component
**File:** `app/admin/prescriptions/[id]/doctor-details-editor.tsx`

**Props:**
```typescript
interface DoctorDetailsEditorProps {
  prescriptionId: string;
  initialDetails: {
    doctor_name: string | null;
    doctor_phone: string | null;
    doctor_email: string | null;
    practice_name: string | null;
    practice_address: string | null;
  };
}
```

**Responsibility:**
- Display doctor details
- Toggle edit mode with Edit button
- Handle save/cancel operations
- Manage loading and error states

**Current Source:**
- Extract doctor details section from `prescription-detail-client.tsx` (lines ~855-1000)
- Extract handler: `handleSaveDoctorDetails`

---

#### 1.4 Create `ActionsSection` Client Component
**File:** `app/admin/prescriptions/[id]/actions-section.tsx`

**Props:**
```typescript
interface ActionsSectionProps {
  prescriptionId: string;
  status: "pending" | "approved" | "rejected" | "processing";
}
```

**Responsibility:**
- Display status-specific action buttons
- Handle status updates
- Show confirmation messages

**Current Source:**
- Extract actions section from `prescription-detail-client.tsx` (lines ~900-1000)
- Extract handler: `handleUpdateStatus`

---

### Phase 2: Refactor Server Component

#### 2.1 Convert `page.tsx` to Display Read-Only Content
**File:** `app/admin/prescriptions/[id]/page.tsx`

**Changes:**
1. Keep all existing data fetching
2. Create card/display components for read-only sections:
   - Status Card (display status with color coding)
   - Prescription Number Card (display number)
   - Patient Information Card (display patient name/ID)
   - Prescription Details Card (display quantity, frequency, etc.)
   - File Card (keep as-is, just render directly)
   - Timeline Card (keep as-is, just render directly)
   - Source Badge Card (keep as-is, just render directly)
3. Replace client component with:
   ```tsx
   <MedicationsEditor 
     prescriptionId={prescription.id}
     initialItems={prescription.prescription_items}
     status={prescription.status}
   />
   <NotesEditor 
     prescriptionId={prescription.id}
     initialNotes={prescription.admin_notes}
   />
   <DoctorDetailsEditor 
     prescriptionId={prescription.id}
     initialDetails={{
       doctor_name: prescription.doctor_name,
       doctor_phone: prescription.doctor_phone,
       doctor_email: prescription.doctor_email,
       practice_name: prescription.practice_name,
       practice_address: prescription.practice_address,
     }}
   />
   <ActionsSection 
     prescriptionId={prescription.id}
     status={prescription.status}
   />
   ```

#### 2.2 Update `prescription-detail-client.tsx`
**Action:** Delete this file entirely once refactoring is complete
- This file will no longer be needed

### Phase 3: Testing & Verification

1. **Functional Testing:**
   - Verify medications add/edit/delete work
   - Verify notes add/edit work
   - Verify doctor details add/edit work
   - Verify status updates work

2. **Performance Testing:**
   - Measure page load time before/after
   - Check bundle size reduction
   - Verify no hydration errors

3. **Visual Testing:**
   - Ensure all UI renders correctly
   - Check responsive design on mobile
   - Verify all error messages display properly

## File Changes Summary

### New Files to Create
- `app/admin/prescriptions/[id]/medications-editor.tsx` (~300 lines)
- `app/admin/prescriptions/[id]/notes-editor.tsx` (~150 lines)
- `app/admin/prescriptions/[id]/doctor-details-editor.tsx` (~200 lines)
- `app/admin/prescriptions/[id]/actions-section.tsx` (~200 lines)

### Files to Modify
- `app/admin/prescriptions/[id]/page.tsx` (refactor to server component, add read-only card components)

### Files to Delete
- `app/admin/prescriptions/[id]/prescription-detail-client.tsx`

## Estimated Effort

- **Planning:** 1 hour (already done)
- **Implementation:** 3-4 hours
- **Testing:** 1-2 hours
- **Total:** 5-7 hours

## Dependencies

- All existing APIs remain unchanged:
  - `/api/admin/prescriptions/[id]`
  - `/api/admin/prescriptions/[id]/items`
  - `/api/admin/prescriptions/[id]/details`

## Notes

- The refactoring is purely architectural; no functional changes
- All APIs already support the required operations
- Client components will have similar state management to current implementation
- Server component will continue to use `force-dynamic` export (due to fresh data requirement)

## Future Optimization

After refactoring, consider:
- ISR (Incremental Static Regeneration) for specific prescription statuses if applicable
- Streaming of non-critical sections using React Suspense
- Lazy loading of doctor details and notes editors if they're below the fold
