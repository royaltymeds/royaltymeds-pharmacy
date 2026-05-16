# Phase 4 — PO Print/PDF and Hold-from-PO UX Hardening

Date: 2026-05-16  
Plan Reference: `context/restock_workflow_full_remediation_plan/PHASED_IMPLEMENTATION_PLAN.md`

## Objectives Addressed
- keep print and download as clearly distinct actions
- harden print output reliability and safety
- harden downloadable PDF generation behavior and edge handling
- confirm hold-from-PO semantics are supported end-to-end by action layer

## Implemented Hardening

### 1) Print flow reliability/safety improvements
In `components/admin/restock/restock-workflow-tabs.tsx`:
- Added `escapeHtml(...)` and used it for printable HTML interpolation values to prevent malformed markup when supplier/item text contains symbols.
- Updated print trigger timing to run through `printWindow.onload` after document write/close, reducing chances of printing before content render.

### 2) Downloadable PDF hardening
In `handleDownloadPurchaseOrderPdf(...)`:
- Preserved distinct downloadable blob-based PDF path (separate from print flow).
- Added capped line rendering for PDF text stream (`maxVisibleLines`) with explicit overflow note when many lines exist, preventing off-page invisible content from yielding confusing output.
- Retained PDF-safe escaping via `escapePdfText(...)`.

### 3) Hold-from-PO compatibility confirmation
- Confirmed Phase 2 domain fix remains aligned: PO-linked line items can be put on hold directly through action-layer detachment/orphan path.

## Why this phase is complete
- Print and PDF are distinct and operationally separate.
- Print rendering path now waits for render readiness and escapes interpolated HTML.
- Download path remains direct file download and handles long content more predictably.
- Hold-from-PO backend behavior was corrected in Phase 2 and remains in place.

## Verification performed
- Lint pass after hardening changes.
- Structural review of print/PDF handlers and helper usage in the restock workflow component.

## Follow-on in Phase 5/6
- Phase 5: cross-page dropdown standardization.
- Phase 6: full regression matrix execution and final closure updates.
