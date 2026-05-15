# Implementation Plan: TASKS + `errors_issues.found`

## Scope Reviewed
- `TASKS`
- `errors_issues.found`

> Note: `errors_issues.found` is currently empty. This plan includes a dedicated discovery/triage phase to ensure any missing issue inventory is captured before implementation proceeds.

---

## Phase 0 — Discovery, Alignment, and Design Freeze (Single Session)

### Goals
1. Validate exact UX acceptance criteria for supplier management modal separation.
2. Validate exact UX acceptance criteria for restock/PO modal viewport behavior.
3. Confirm whether `errors_issues.found` is intentionally empty or needs issue population.
4. Produce implementation notes and no-code UI mock behavior definitions.

### Work Items
- Trace current frontend/component flow for:
  - Supplier management “bulk upload / add item” modal entry points.
  - Restock workflow modals, especially PO-related dialogs.
- Identify all shared modal wrappers/components and CSS constraints currently used (max-height, overflow, sticky headers/footers, responsive breakpoints).
- Create short acceptance checklist for each TASK item.
- If `errors_issues.found` should contain open bugs, gather and document them from logs/issue tracker into that file before execution phases.

### Deliverables
- A concise internal technical note that maps affected components/routes.
- Finalized acceptance criteria list.
- Populated `errors_issues.found` (if currently incomplete).

### Session Size
- Fits in one session because no code edits are required; primarily analysis and scoping.

---

## Phase 1 — Supplier Management Modal Separation (Single Session)

### TASK Coverage
- TASK item 1: Separate “link one item to multiple suppliers” from “bulk spreadsheet upload/linking” into two distinct buttons and modals.

### Goals
1. Introduce two explicit CTAs in supplier management:
   - **Link Item to Multiple Suppliers** (single-item linking flow)
   - **Bulk Upload/Link via Spreadsheet** (existing upload flow)
2. Reuse existing underlying logic where possible; avoid behavior regressions.
3. Ensure each CTA launches only its respective modal/workflow.

### Work Items
- Refactor UI entry point so each action has a dedicated button and dedicated modal state.
- Split combined modal into two separate modal components (or two mode-specific wrappers) with clear ownership.
- Keep existing validation/business logic intact by extracting shared form helpers (if needed) rather than duplicating logic.
- Update labels, helper text, and button placement for clarity.
- Add/adjust unit/integration tests for:
  - Correct button visibility.
  - Correct modal opens from each button.
  - No cross-triggering between flows.

### QA/Validation
- Manual test matrix:
  - Open/close each modal independently.
  - Complete one-item multi-supplier linking flow.
  - Complete bulk upload flow with valid/invalid files.
- Regression checks on supplier management page interactions.

### Session Size
- Controlled UI refactor + focused tests; can be completed in one session.

---

## Phase 2 — Restock/PO Modal Viewport Confinement (Single Session)

### TASK Coverage
- TASK item 2: Ensure restock modals (especially PO modals) never exceed viewport vertically; top and bottom must remain within screen.

### Goals
1. Enforce viewport-constrained modal layout for all restock/PO dialogs.
2. Ensure internal scrolling occurs within modal body, not at page level.
3. Preserve accessibility and usability for large item counts.

### Work Items
- Standardize modal container sizing:
  - Use viewport-based max height (e.g., `max-height: calc(100vh - <margin>)`).
  - Ensure modal is vertically centered or top-offset with safe margins.
- Configure modal content regions:
  - Header: fixed/sticky within modal.
  - Body: scrollable (`overflow-y: auto`).
  - Footer actions: fixed/sticky within modal.
- Apply same constraints to all PO/restock modal variants through shared modal wrapper where feasible.
- Handle responsive states (small laptop/tablet).
- Add test coverage (where framework allows):
  - Class/style assertions for max-height/overflow behavior.
  - Snapshot/visual checks for large data sets.

### QA/Validation
- Manual checks with high item volumes in PO modals.
- Verify no clipped header/footer on common viewport sizes.
- Confirm keyboard navigation/focus trap still works.

### Session Size
- Focused CSS/layout + targeted regression tests; one session.

---

## Phase 3 — Issue Resolution Pass from `errors_issues.found` (Single Session, Repeatable)

### Goals
1. Resolve every issue listed in `errors_issues.found`.
2. Batch fixes into one session by grouping related issues.

### Work Items
- Parse `errors_issues.found` into fix groups (UI, validation, API, data mapping, performance, etc.).
- Tackle one group per session if issue volume is high.
- For each issue:
  - Reproduce.
  - Implement minimal safe fix.
  - Add/extend automated test.
  - Validate manually.

### QA/Validation
- Confirm each issue is marked resolved with reproduction notes.
- Update issue file status after each fix batch.

### Session Size
- One session per group; repeat Phase 3 until issue file is fully cleared.

---

## Phase 4 — Final Hardening and Release Readiness (Single Session)

### Goals
1. Ensure no regressions across supplier management + restock workflows.
2. Finalize documentation and rollout confidence.

### Work Items
- Run full relevant test suites + lint/type checks.
- Perform end-to-end smoke flows:
  - Supplier link (single item).
  - Bulk upload link.
  - Restock PO modals with low/high item counts.
- Prepare release notes summarizing UX changes.
- If available, add/update internal support docs/tooltips.

### Exit Criteria
- All TASK items accepted.
- `errors_issues.found` empty or all items explicitly marked resolved.
- No critical/high regressions in impacted areas.

### Session Size
- Verification-heavy session, low implementation complexity.

---

## Suggested Execution Order
1. Phase 0 (mandatory baseline)
2. Phase 1 (supplier modal split)
3. Phase 2 (restock/PO modal confinement)
4. Phase 3 (issue-file-driven fixes; may iterate)
5. Phase 4 (hardening + release)

## Risk Controls Across Phases
- Prefer shared modal primitives to avoid inconsistent behaviors.
- Keep each phase branchable and independently reviewable.
- Add tests with each UI change to prevent modal regression drift.
