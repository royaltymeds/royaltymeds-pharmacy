# Restock & Purchase Order Improvement Plan

This plan consolidates all items from `context/TASKS` and `context/errors_issues.found` into manageable phases that can be completed in single AI sessions.

## Source Inputs
- `context/TASKS`
- `context/errors_issues.found`

---

## Phase 0 — Discovery & UI Contract Baseline

### Goal
Create a precise implementation map before code changes.

### Scope
- Identify component/file ownership for:
  - Restock management tabs.
  - Purchase order details modal.
  - New restock order flow.
  - Bulk upload/linking modal in supplies/suppliers management.
- Document current behavior for:
  - Tab count/badge logic.
  - Search/filter behavior per tab.
  - New restock order open behavior (page route).
  - Bulk linking upload status behavior.

### Exit Criteria
- Component map is documented.
- Current-state behavior checklist is complete.

---

## Phase 1 — Purchase Order Details Modal Enhancements

### Covers
- TASKS #1: On-hold ability in PO details modal.
- TASKS #5: Add print and PDF download buttons in PO details modal.

### Implementation
- Add UI and state support for **On Hold** in PO details modal.
- Add **Print Purchase Order** action.
- Add **Download PDF** action.
- Reuse existing PO data payload and modal rendering where possible.

### Exit Criteria
- Hold status is visible and actionable where required.
- Print preview correctly renders purchase order.
- PDF download works and contains complete PO details.

---

## Phase 2 — Restock Management Tab Count Logic Corrections

### Covers
- TASKS #2 (all count/badge logic updates).

### Implementation
- Remove count from **Request History** tab.
- **Upcoming Scheduled Re-orders** count only includes requests with a scheduled PO already generated.
- **Purchase Orders** parent tab count includes only **Open + Placed**.
- PO sub-tabs:
  - Show counts only on **Open**, **Placed**, **On Hold**.
  - Hide counts on **Received** and **Cancelled**.

### Exit Criteria
- Count visibility and values match requirements across all tabs/sub-tabs.

---

## Phase 3 — Add Live Search Dropdown to Each Restock Tab

### Covers
- TASKS #3.

### Implementation
- Add search input to each restock management tab.
- Show dropdown of requests from that tab matching typed term.
- Update results while typing (debounce for performance).
- Ensure keyboard accessibility (up/down/enter/escape).

### Exit Criteria
- Search dropdown appears in each tab.
- Results update live and are tab-scoped.
- Selecting result opens/highlights the matching request.

---

## Phase 4 — New Restock Order Flow: Page to Modal + Dropdown Placement Fix

### Covers
- TASKS #4 (convert new restock order page to modal replica).
- ERRORS #1 (supplier dropdown appearing above input at some zoom/sizes).

### Implementation
- Convert current “new restock order page” UI into a modal with equivalent layout/design.
- Update “New Restock Order” button to open modal instead of navigating.
- Fix supplier dropdown placement to render below selector at all times.

### Exit Criteria
- New restock order opens as modal and matches previous page design.
- Supplier dropdown is consistently below input across screen sizes/zoom levels.

---

## Phase 5 — Bulk Upload/Linking Modal UX Hardening

### Covers
- TASKS #6 (CSV format guidance section).
- ERRORS #2 (status/progress + interaction lock during link processing).

### Implementation
- Add a dedicated CSV guidance section:
  - Keep only columns intended for mapping.
  - Do not include commas in names or numbers.
- Add blocking upload/link status state after user clicks link:
  - Show progress/loading state.
  - Display message advising user to wait and not close page/modal.
  - Prevent additional interactions until updates complete.
- Show completion state (success/failure summary).

### Exit Criteria
- Users see clear CSV formatting instructions.
- Modal blocks interaction while update is in progress.
- Completion state is explicit and informative.

---

## Phase 6 — Integration QA & Regression Pass

### Goal
Validate end-to-end behavior and reduce release risk.

### Validation Areas
- Restock management tabs:
  - Count logic.
  - Search dropdown behavior.
- New restock order modal flow and supplier dropdown positioning.
- Purchase order details modal hold/print/PDF features.
- Bulk upload/linking modal status lock and messaging.

### Exit Criteria
- All phase acceptance criteria pass.
- No critical regressions in touched flows.

---

## Suggested Session Allocation
- Session 1: Phase 0 + Phase 1
- Session 2: Phase 2
- Session 3: Phase 3
- Session 4: Phase 4
- Session 5: Phase 5
- Session 6: Phase 6 + final polish

---

## Progress Tracker

Use this checklist to track execution:

- [x] Phase 0 complete
- [x] Phase 1 complete
- [x] Phase 2 complete
- [x] Phase 3 complete
- [x] Phase 4 complete
- [x] Phase 5 complete
- [x] Phase 6 complete

### Notes
- Date:
- Owner:
- Current Phase:
- Risks/Blockers:
- Next Action:
