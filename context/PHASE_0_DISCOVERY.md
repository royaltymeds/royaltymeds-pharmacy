# Phase 0 Discovery Baseline

Date: 2026-05-15
Scope: `app/admin/restock/*`, `components/admin/restock/*`, and related restock types.

## 1) Component / File Ownership Map

### Restock management entry points
- `app/admin/restock/page.tsx`
  - Renders top-level Restock Management page.
  - Hosts **New Restock Order** button and mounts `RestockWorkflowTabs`.
- `components/admin/restock/restock-workflow-tabs.tsx`
  - Main workflow UI for tabbed restock management.
  - Owns tab state, counts, purchase order status sub-tabs, and most purchase-order workflow modals/details.

### Purchase order detail surfaces
- `components/admin/restock/restock-workflow-tabs.tsx`
  - Contains view/edit/receive PO flows and PO-status segment navigation.
  - Current location for PO detail interactions that Phase 1/2/5 will modify.

### New restock order flow
- `app/admin/restock/new/page.tsx`
  - Separate route/page currently used for creating a new restock order.
- `components/admin/restock/new-restock-request-form.tsx`
  - Core form UI and submission behavior for new restock requests.

### Supplies / suppliers management and bulk linking
- `app/admin/restock/suppliers/page.tsx`
  - Suppliers management page entry.
- `components/admin/restock/suppliers-list.tsx`
  - Manages suppliers, supplier products, item linking, and **bulk import/linking modal** logic.
  - Handles column mapping, parsed rows, and `createSupplierProductsBulk` execution.

### Shared type contract
- `lib/types/restock.ts`
  - Defines key statuses including `on_hold` and hold-specific type fields used by workflow screens.

---

## 2) Current Behavior Baseline (Pre-change)

### 2.1 Restock tab count/badge behavior
Current top-level tab definitions are in `restock-workflow-tabs.tsx`:
- **Current Requests**: count shown (`currentRequests.length`).
- **Request History**: count shown (`requestHistory.length`).
- **Upcoming Scheduled Re-orders**: count shown using entries with `next_reorder_date`.
- **Purchase Orders**: count shown as total purchase orders plus held requests/items.

Current PO status sub-tabs render counts for every status tab label using `statusCount` formatting, including statuses that should eventually hide counts per requirements.

### 2.2 Search/filter behavior in restock tabs
- There is currently supplier-product search for manual/add-item PO flows.
- There is **not** a dedicated search box per each restock management top-level tab (Current Requests, Request History, Upcoming Scheduled Re-orders, Purchase Orders) that offers live dropdown suggestions from tab-local requests.

### 2.3 New restock order open behavior
- The **New Restock Order** CTA on `/admin/restock` is a `Link` to `/admin/restock/new`.
- The new restock order experience is currently a full page, not a modal overlay.

### 2.4 Bulk upload/linking status behavior
- In suppliers bulk import, submit (`handleBulkSupplierItemImport`) sets `actionLoading` and runs `createSupplierProductsBulk`.
- There is no explicit, dedicated blocking progress UX contract described in code for “do not close / wait for updates” while linking completes.
- Existing async state is functional but does not yet meet the required strong in-modal status messaging/interaction lock expectation.

---

## 3) Key Risks / Notes Captured in Discovery

- Count logic is currently centralized in `tabs` and PO status rendering in `restock-workflow-tabs.tsx`, making it a single high-impact edit point for Phase 2.
- New restock order conversion to modal should reuse `NewRestockRequestForm` to avoid duplicate form logic.
- Bulk import parser currently uses simple delimiter splitting (comma/tab), so CSV guidance text in Phase 5 is important to reduce malformed import data.

---

## 4) Phase 0 Exit Checklist

- [x] Component/file ownership map documented.
- [x] Current-state behavior checklist documented for:
  - [x] Tab count logic.
  - [x] Search behavior per tab.
  - [x] New restock open behavior.
  - [x] Bulk linking upload status behavior.

