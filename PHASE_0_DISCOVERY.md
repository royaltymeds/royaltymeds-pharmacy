# Phase 0 Completion: Discovery, Alignment, and Design Freeze

This document completes **Phase 0** from `IMPLEMENTATION_PLAN.md` by mapping impacted UI areas, defining implementation boundaries, and freezing acceptance criteria for Phases 1–2.

## Inputs Reviewed
- `TASKS`
- `errors_issues.found` (currently empty)
- Restock/Supplier UI components under `components/admin/restock/*`

## Task-to-Code Mapping

### TASK 1 — Separate supplier item-linking vs spreadsheet bulk upload
**Current state discovered**
- The supplier-item linking modal currently combines:
  - Manual single-item linking controls.
  - Spreadsheet bulk upload controls.
- Both flows live in the same modal surface in `suppliers-list.tsx`, with spreadsheet upload content embedded in that modal.

**Primary impact area**
- `components/admin/restock/suppliers-list.tsx`
  - Existing supplier action button: “Link item”.
  - Modal content area currently includes both:
    - Manual link form.
    - “Spreadsheet bulk upload” section.

**Implementation boundary for Phase 1**
- Keep existing backend actions/business logic unchanged.
- Refactor front-end state and modal rendering so there are two distinct entry points:
  1. **Link item to multiple suppliers** (manual flow modal)
  2. **Bulk upload/link from spreadsheet** (upload flow modal)
- Preserve support for multi-supplier linking behavior in both flows.

---

### TASK 2 — Ensure restock/PO modals stay within viewport vertically
**Current state discovered**
- Multiple restock/PO modals in `restock-workflow-tabs.tsx` use `max-h-[90vh]` + `overflow-y-auto` directly on the form/container.
- This pattern is repeated for many modal variants (generate PO, place PO, edit PO, receive PO, hold/release dialogs, detail dialogs).
- The current approach allows large modal bodies, but repeated per-modal styling and container-level scrolling may still produce clipping in constrained viewports.

**Primary impact area**
- `components/admin/restock/restock-workflow-tabs.tsx`

**Secondary impact areas (consistency pass candidates)**
- `components/admin/restock/suppliers-list.tsx` (similar modal pattern)
- `components/admin/restock/confirmation-modal.tsx` (shared confirmation dialog)

**Implementation boundary for Phase 2**
- Introduce/standardize a reusable viewport-safe modal layout pattern:
  - viewport-confined shell,
  - non-scrolling header/footer,
  - scrollable body region.
- Apply to all PO/restock workflow modals first (priority), then harmonize other restock modals where low-risk.

---

## Shared Modal Pattern Inventory (for refactor planning)
1. Overlay container pattern: `fixed inset-0 ... p-4 backdrop-blur-sm`
2. Modal container pattern: `max-h-[90vh] ... overflow-y-auto ...`
3. Some modals already use internal scroll regions (`max-h-[60vh] overflow-y-auto`) for line-item sections.

**Phase 2 design direction**
- Keep overlay full-screen.
- Move primary scrolling from whole modal container to modal body panel.
- Use consistent spacing tokens for top/bottom safe area and predictable body max-height.

---

## Acceptance Criteria Freeze

### Acceptance Criteria — TASK 1 (Supplier modal split)
1. Supplier management shows **two separate actions** for manual linking and spreadsheet bulk linking.
2. Clicking each action opens only its corresponding modal/workflow.
3. Manual-link modal contains no spreadsheet upload section.
4. Spreadsheet bulk-upload modal contains no manual-link form controls unrelated to upload flow.
5. Existing validations and submit behavior remain intact for both flows.
6. No regression in linking one item to one or many suppliers.

### Acceptance Criteria — TASK 2 (Restock/PO modal confinement)
1. For all restock/PO modals, top and bottom edges remain within viewport on common desktop/laptop heights.
2. Overflow content scrolls inside the modal body instead of pushing modal off-screen.
3. Modal action buttons remain reachable without page-level scroll jumps.
4. Keyboard/focus behavior remains functional (focus trap/close behavior unchanged).
5. No regression in PO create/edit/place/receive/release flows.

---

## `errors_issues.found` Triage Outcome
- File currently has no listed issues.
- No additional issue inventory was provided in-repo during this phase.
- Phase 3 remains valid as a repeatable issue-resolution pass when entries are added.

---

## Deliverables Produced for Phase 0
- Component-level impact mapping for TASK 1 and TASK 2.
- Frozen acceptance criteria for downstream implementation phases.
- Modal architecture direction for Phase 2.
- Issue-file status confirmation for `errors_issues.found`.
