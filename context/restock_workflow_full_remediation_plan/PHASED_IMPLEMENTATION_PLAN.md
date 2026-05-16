# Restock Workflow Full Remediation Plan (Gap-Closure)

Date: 2026-05-16  
Owner: AI implementation assistant  
Primary Inputs:
- `context/TASKS`
- `context/errors_issues.found`
- Latest commit and PR summary for prior attempt

## Purpose
You flagged that prior work likely did not fully satisfy all requirements. This plan is structured to **close every gap** and provide a deterministic path to complete all tasks/issues with proof-oriented verification.

This plan is phased so each phase is scoped to finish in **1 to 3 AI sessions** without excessive token usage.

---

## Non-Negotiable Success Criteria (Global)
1. Every item in `context/TASKS` is implemented in code, not only documented.
2. Every item in `context/errors_issues.found` is resolved in code and validated.
3. No “documentation-only” resolution is accepted where behavior was requested.
4. Each changed behavior has:
   - implementation notes,
   - concrete manual verification steps,
   - at least one automated or programmatic check where feasible.
5. `context/TASKS` and `context/errors_issues.found` are rewritten as final closure logs (what changed, where, how verified).

---

## Phase 1 — Re-Discovery, Gap Audit, and Acceptance Test Matrix
**Estimated sessions:** 1

### Objectives
- Reconcile what was requested vs what actually shipped.
- Build a precise “gap ledger” before any further edits.

### Work
1. Parse and normalize requested outcomes from both source files into atomic acceptance criteria.
2. Inspect all restock-related UI/action files and confirm current behavior against each criterion.
3. Build a traceability table:
   - Requirement ID
   - Current status (`met`, `partial`, `not met`)
   - Evidence (file/line)
   - Required remediation.
4. Define QA matrix for all tabs, modals, dropdowns, PO status transitions, and hold/release flows.

### Deliverables
- `context/restock_workflow_full_remediation_plan/PHASE_1_GAP_AUDIT.md`
- `context/restock_workflow_full_remediation_plan/ACCEPTANCE_MATRIX.md`

### Exit Criteria
- 100% of requirements are represented in acceptance matrix.
- Every “partial/not met” item has a planned remediation target file.

---

## Phase 2 — Data/Action Layer Corrections (Server/Action Contracts)
**Estimated sessions:** 1–2

### Objectives
Ensure backend/action behavior supports required UI semantics correctly (especially hold/orphaning, PO linkage, status interpretation, count correctness inputs).

### Work
1. Validate action methods used by restock workflow:
   - PO creation/update/placement/receiving/cancellation
   - request/item hold transitions
   - release from hold to PO
   - upcoming reorder fetch logic and PO status linkage assumptions.
2. Fix any domain-logic mismatch discovered in Phase 1 (e.g., incorrect status propagation, missing detach/orphan behavior, ambiguous linkage semantics).
3. Add defensive checks and explicit return payload fields needed by frontend rendering (e.g., linked PO status hints if needed).
4. Add/adjust migrations only if schema-level constraints are missing for expected workflows.

### Deliverables
- Code changes in actions/types/migrations as needed.
- `context/restock_workflow_full_remediation_plan/PHASE_2_DOMAIN_FIXES.md` with behavior contracts.

### Exit Criteria
- Action-layer behavior deterministically supports all requested UX states.
- No UI workaround needed for incorrect backend behavior.

---

## Phase 3 — Restock Tabs Search/Filter + Count Logic Completion
**Estimated sessions:** 1–2

### Objectives
Fully satisfy TASKS tab behavior requirements and eliminate partial implementations.

### Work
1. Implement/verify per-tab search behavior:
   - Current Requests: supplier + request + item-level matching.
   - Request History: same matching rules scoped to history set.
   - Ensure supplier cards are filtered by contained request/item matches.
2. Add/verify tab-specific filter controls where requested (not just free-text search).
3. Confirm “current requests linked to placed PO” indicator behavior everywhere required in tab flows and supplier cards.
4. Re-validate all displayed counts:
   - top-level tabs
   - sub-tabs
   - upcoming scheduled reorder count excludes placed and non-open POs per requirement.
5. Fix edge cases: empty results, stale modal state after status transitions, pagination + search interactions.

### Deliverables
- `components/admin/restock/restock-workflow-tabs.tsx` (and supporting files) updated.
- `context/restock_workflow_full_remediation_plan/PHASE_3_TABS_AND_COUNTS.md`.

### Exit Criteria
- All TASKS tab/search/filter/count acceptance tests pass.
- No contradictory labels between request status and linked PO status hint.

---

## Phase 4 — PO Print/PDF + Hold-from-PO UX Hardening
**Estimated sessions:** 1–2

### Objectives
Resolve all issues in `errors_issues.found` for PO document actions and hold flow quality.

### Work
1. Print:
   - Ensure print action renders a stable printable document with visible content.
2. Download PDF:
   - Implement reliable downloadable PDF generation path.
   - If external package policy blocks install, implement approved fallback path with robust output.
3. Ensure print and download are functionally distinct (not same handler/path).
4. Hold from PO modal:
   - Validate direct action does not require manual pre-removal.
   - Confirm orphaning behavior matches request-defined semantics.
   - Confirm UI messaging reflects actual action.

### Deliverables
- Updated PO modal handlers and rendering.
- `context/restock_workflow_full_remediation_plan/PHASE_4_PO_ACTIONS_AND_HOLD.md`.

### Exit Criteria
- Print works, PDF downloads, and both are independently functional.
- PO-item hold flow works directly from modal and persists correctly after refresh.

---

## Phase 5 — Universal Dropdown Placement Fix Across Restock Pages
**Estimated sessions:** 1

### Objectives
Apply a **consistent and reliable** dropdown positioning strategy across all restock screens.

### Work
1. Inventory all dropdown/select/search-menu surfaces in restock modules.
2. Apply a shared pattern/component/utility for below-trigger rendering where controllable.
3. Validate browser-native `<select>` limits vs custom dropdown behavior and align expectations.
4. Standardize z-index/layering and overflow container behavior to prevent upward flipping caused by clipping.

### Deliverables
- Shared dropdown positioning approach implemented across restock components.
- `context/restock_workflow_full_remediation_plan/PHASE_5_DROPDOWN_STANDARDIZATION.md`.

### Exit Criteria
- Dropdown behavior is consistently below trigger in all controllable custom dropdowns.
- Known native-select limitations (if any) documented with mitigations.

---

## Phase 6 — Full Regression, Evidence Capture, and Final Context Updates
**Estimated sessions:** 1

### Objectives
Produce final proof package and closure documentation.

### Work
1. Execute lint/type/build checks.
2. Execute scenario-based manual QA matrix from Phase 1.
3. Capture before/after evidence notes per requirement.
4. Rewrite:
   - `context/TASKS`
   - `context/errors_issues.found`
   into final closure format including:
   - exact implementation summary,
   - verification steps,
   - expected outputs,
   - residual risks (if any).

### Deliverables
- Finalized context files with exhaustive completion/resolution logs.
- `context/restock_workflow_full_remediation_plan/PHASE_6_VALIDATION_AND_CLOSURE.md`.

### Exit Criteria
- Every requirement is marked complete with evidence.
- No unresolved “partial” items remain.

---

## Session Budget Guidance
- Phase 1: 1 session
- Phase 2: 1–2 sessions
- Phase 3: 1–2 sessions
- Phase 4: 1–2 sessions
- Phase 5: 1 session
- Phase 6: 1 session

Total expected: **6 to 9 sessions**.

---

## Progress Tracker
- [x] Phase 1 complete
- [x] Phase 2 complete
- [x] Phase 3 complete
- [x] Phase 4 complete
- [x] Phase 5 complete
- [x] Phase 6 complete

---

## Risk Register (Initial)
1. **Package policy/network restrictions** may block adding a PDF library.
   - Mitigation: predefine fallback PDF path and verify output integrity.
2. **Native browser `<select>` behavior** cannot be fully forced across all environments.
   - Mitigation: use custom dropdown where deterministic behavior is mandatory.
3. **State synchronization complexity** in large tab/modal component may cause regressions.
   - Mitigation: isolate selectors/helpers, add targeted regression checklist.

---

## Definition of Done
This effort is done only when:
- all requested tasks/issues are behaviorally complete,
- all acceptance tests pass,
- context files provide exhaustive and truthful closure details.
