# Phase 1 Gap Audit — Restock Workflow Full Remediation

Date: 2026-05-16  
Plan Reference: `context/restock_workflow_full_remediation_plan/PHASED_IMPLEMENTATION_PLAN.md`

## Scope Reviewed
- `context/TASKS`
- `context/errors_issues.found`
- `components/admin/restock/restock-workflow-tabs.tsx`
- `app/actions/restock.ts`
- Supporting context docs under `context/`

## Audit Method
1. Converted each request/issue into atomic acceptance criteria IDs.
2. Mapped each criterion to current implementation evidence (file + line).
3. Tagged status as:
   - `met`: implemented and evidently aligned
   - `partial`: implemented incompletely or with reliability risk
   - `not met`: missing
4. Assigned remediation target(s) for every `partial`/`not met` item.

---

## Traceability Gap Ledger

| ID | Source | Requirement (Atomic) | Status | Evidence | Gap / Remediation Needed | Target Files |
|---|---|---|---|---|---|---|
| T1-A | TASKS #1 | Current Requests search must match requests/items, not supplier name only | met | `filterRequestGroups` applies request + item matching | Keep; regression test coverage needed in Phase 3/6 | `components/admin/restock/restock-workflow-tabs.tsx` |
| T1-B | TASKS #1 | Request History search must match requests/items, not supplier name only | met | `filterRequestGroups` used for request history supplier list | Keep; regression coverage needed | `components/admin/restock/restock-workflow-tabs.tsx` |
| T1-C | TASKS #1 | “Each tab should also have appropriate filters” (beyond free-text search) | not met | Only a single generic search input is present | Add per-tab filter controls and filter-state logic | `components/admin/restock/restock-workflow-tabs.tsx` |
| T2-A | TASKS #2 | Current requests linked to placed PO should show “Order placed” indicator | partial | Indicator exists in request detail modal | Extend indicator to supplier-card/request-list surfaces as requested (not just modal) | `components/admin/restock/restock-workflow-tabs.tsx` |
| E1-A | ERRORS #1 | Print and Download must be distinct features | met | Separate `handlePrintPurchaseOrder` and `handleDownloadPurchaseOrderPdf` handlers | Keep and validate with manual QA matrix | `components/admin/restock/restock-workflow-tabs.tsx` |
| E1-B | ERRORS #1 | Print should render correctly via print dialog | partial | Print window/HTML flow exists | Needs visual QA confirmation for no invisible/empty rendering in target browsers | `components/admin/restock/restock-workflow-tabs.tsx` |
| E1-C | ERRORS #1 | Download should generate a usable PDF file | partial | Minimal in-browser PDF string generator implemented | Validate compatibility/readability across PDF viewers; potentially replace with robust generator path if instability found | `components/admin/restock/restock-workflow-tabs.tsx` |
| E2-A | ERRORS #2 | Hold item directly from PO modal (no forced manual removal first) | met | PO modal calls `putRestockItemOnHold` directly | Keep; verify detach/orphan state correctness end-to-end | `components/admin/restock/restock-workflow-tabs.tsx`, `app/actions/restock.ts` |
| E2-B | ERRORS #2 | Item put on hold from PO should orphan from PO/request linkage | partial | Action invoked; behavior assumed | Validate action-layer semantics and post-state persistence; patch if inconsistent | `app/actions/restock.ts`, `components/admin/restock/restock-workflow-tabs.tsx` |
| E3-A | ERRORS #3 | Universal reliable below-selector dropdown behavior across restock pages | not met | `align-top` added in one file only; native select behavior not deterministic | Implement shared dropdown strategy across all restock pages/components | `components/admin/restock/*.tsx` |
| E4-A | ERRORS #4 | Upcoming scheduled reorder count must include only open linked POs | met | Count logic checks `po.status === 'open'` | Keep; add regression checks | `components/admin/restock/restock-workflow-tabs.tsx` |

---

## Key Findings Summary
- **Implemented but incomplete:** placed-PO indicator scope, print/PDF reliability proof, hold orphan verification.
- **Missing:** explicit per-tab filter controls and truly universal dropdown positioning strategy.
- **Potential fragility:** handcrafted minimal PDF output may be valid but needs compatibility validation and fallback strategy.

---

## Phase 2+ Remediation Sequencing (Derived from Gaps)
1. Phase 2: validate/fix action-layer hold orphan semantics and PO-link state outputs.
2. Phase 3: add per-tab filter controls + expand placed-PO indicator coverage across request/supplier surfaces.
3. Phase 4: harden print/PDF reliability and prove distinct functionality with QA evidence.
4. Phase 5: implement shared dropdown standardization across all restock pages.

---

## Phase 1 Exit Decision
- Requirement coverage representation: **complete** (all TASKS + errors mapped).
- Every `partial`/`not met` item has remediation targets: **yes**.
- **Phase 1 marked complete.**
