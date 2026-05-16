# Phase 3 — Tabs Search/Filter and Request/PO Status UX Completion

Date: 2026-05-16  
Plan Reference: `context/restock_workflow_full_remediation_plan/PHASED_IMPLEMENTATION_PLAN.md`

## Objectives Addressed
- complete tab behavior beyond free-text search by adding tab-appropriate filter controls
- ensure supplier grouping respects both search and selected filter criteria
- extend placed-PO indication visibility in request list surfaces (not only detail modal)

## Implemented Changes

### 1) Added tab-specific filter controls
In `components/admin/restock/restock-workflow-tabs.tsx`:
- Current Requests filter (`requestTabFilter`):
  - all
  - requested only
  - linked_to_po only
  - linked to placed PO only
- Request History filter (`requestHistoryTabFilter`):
  - all
  - received only
  - cancelled only
- Schedule filter (`scheduleTabFilter`):
  - all scheduled suppliers
  - with open scheduled PO
  - without open scheduled PO

### 2) Upgraded supplier group filtering to combine search + filter criteria
- Expanded `filterRequestGroups(...)` to accept tab mode and filter each group's requests by:
  - text match (request/supplier/item fields), and
  - tab filter state.
- Supplier cards are now shown only if at least one request remains after both filters are applied.

### 3) Expanded “Order placed” indicator coverage
- Existing request detail indicator retained.
- Added “Order placed” badge in supplier-request modal list rows when a request is linked to a placed PO.

### 4) Schedule tab filtering behavior
- Applied schedule filter to supplier cards based on presence/absence of open scheduled PO linkage using existing open PO lookup.

## Counts / Logic
- Existing count logic from previous phases preserved:
  - upcoming scheduled reorder count uses only open scheduled PO matches
  - purchase orders top-level count remains open + placed.

## Verification
- Lint clean after changes (`npm run lint`).
- Manual checks to run in Phase 6 matrix:
  - filter combinations in Current Requests and Request History
  - schedule filter toggles
  - placed badge visibility in request list and detail modal

## Phase 3 Status
- Phase 3 marked complete in tracker.
