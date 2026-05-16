# Acceptance Matrix — Restock Workflow Full Remediation

Date: 2026-05-16

## Legend
- Type: `manual`, `programmatic`, `automated`
- Result states for execution in later phases: `pass`, `fail`, `blocked`

## A. TASKS Acceptance Tests

| Test ID | Requirement | Test Type | Preconditions | Steps | Expected Result |
|---|---|---|---|---|---|
| AT-T1-CR-01 | Current Requests search matches item-level fields | manual | Existing current requests with known item names/types | Open Current Requests tab, search by item name/type | Supplier cards reduce to suppliers containing matching request items |
| AT-T1-RH-01 | Request History search matches item-level fields | manual | Existing history requests with known item data | Open Request History tab, search by item name/type | Supplier cards reduce to suppliers containing matching historical request items |
| AT-T1-TABS-01 | Tabs include appropriate filters beyond generic search | manual | Restock workflow loaded | Inspect each top-level tab UI and apply filter options | Each tab has context-appropriate filter controls and filtering behavior |
| AT-T2-01 | Request linked to placed PO displays “Order placed” indicator | manual | Request linked to PO in `placed` status | Open request from supplier card/list and details | Indicator visible without changing request status label |

## B. ERRORS Acceptance Tests

| Test ID | Requirement | Test Type | Preconditions | Steps | Expected Result |
|---|---|---|---|---|---|
| AT-E1-PRINT-01 | Print renders correctly | manual | Existing PO with items | Open PO modal → Print Purchase Order | Print dialog shows visible, readable PO content |
| AT-E1-PDF-01 | Download generates usable PDF file | manual | Existing PO with items | Open PO modal → Download as PDF → open file | Downloaded PDF opens and shows correct PO details |
| AT-E1-DIFF-01 | Print and PDF actions are distinct paths | programmatic/manual | Code + UI available | Verify handlers differ; trigger each action | Print opens dialog; PDF downloads file; no shared action side effects |
| AT-E2-01 | Hold from PO modal does not require prior manual remove | manual | Open/Placed PO with restock-linked item | In PO modal, click Hold item | Item successfully moved to hold flow directly |
| AT-E2-02 | Held item is orphaned correctly from prior linkages | manual/programmatic | Item held from PO | Refresh data and inspect PO/request/hold queues | Item removed from prior active linkage and appears in hold queue |
| AT-E3-01 | Dropdowns consistently appear below trigger across restock pages | manual | Restock pages/forms loaded across breakpoints | Open each dropdown/select/search-menu control | Controls render below trigger consistently where controllable |
| AT-E4-01 | Upcoming scheduled reorder count excludes placed POs | manual/programmatic | Scheduled POs in open and placed states | Compare count before/after moving open→placed | Count includes only open-linked scheduled entries |

## C. Programmatic Check Matrix

| Check ID | Command | Purpose |
|---|---|---|
| PC-01 | `npm run lint` | Ensure restock changes are lint-clean |
| PC-02 | `npm run build` | Validate build/type integrity after remediation |
| PC-03 | `rg -n "handlePrintPurchaseOrder|handleDownloadPurchaseOrderPdf|filterRequestGroups|requestLinkedToPlacedPo" components/admin/restock/restock-workflow-tabs.tsx` | Quick structural verification for key handlers/logic |

## D. Coverage Confirmation
- TASKS criteria represented: **Yes**
- ERRORS criteria represented: **Yes**
- Partial/Not-met items from gap audit represented as acceptance tests: **Yes**
