# Phase 5 — Dropdown Standardization Across Restock Pages

Date: 2026-05-16  
Plan Reference: `context/restock_workflow_full_remediation_plan/PHASED_IMPLEMENTATION_PLAN.md`

## Objective
Apply a consistent, cross-page dropdown positioning strategy in restock interfaces and document native limitations.

## What Was Standardized

### 1) Native select/input alignment pattern
Applied `align-top` consistently to restock page select controls so browser dropdown anchor behavior is biased downward where controllable, across:
- `components/admin/restock/restock-workflow-tabs.tsx`
- `components/admin/restock/suppliers-list.tsx`
- `components/admin/restock/new-restock-request-form.tsx`
- `components/admin/restock/restock-requests-list.tsx`

### 2) Custom search dropdown anchoring
Retained below-trigger anchoring (`top-full`) for custom search suggestion overlays in restock workflow tabs.

## Implementation Notes
- For native `<select>`, browser/OS controls are not fully deterministic and cannot be absolutely forced in all environments.
- This phase standardizes the strongest practical bias approach in current architecture without replacing native selects with fully custom listbox components.

## Verification
- `npm run lint` passed after the class standardization updates.
- Manual QA for Phase 6 should verify behavior at common breakpoints and zoom levels.

## Residual Risk / Mitigation
- Residual: native select popup positioning is still partially platform-controlled.
- Mitigation: if strict deterministic below-trigger behavior is required in all environments, migrate targeted controls to shared custom listbox/popover components in a future hardening pass.

## Phase 5 Status
- Phase 5 marked complete in tracker.
