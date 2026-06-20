# Partial Purchase Order Receiving Implementation Plan — 2026-06-20

## Source Task
`context/TASKS` requests support for partially received purchase orders. When a placed PO is received with fewer units than originally ordered, the UI must ask whether to save the receipt as partial. If the user selects **No**, the existing full-receive behavior should continue. If the user selects **Yes**, the PO must remain `placed`, already received quantities must be visible, and remaining quantities must be shown by line item until the PO is fully received.

## Current-State Findings
- Coding/development preferences are documented in `context/ai_prompt_pretext.command`; relevant constraints include using existing Supabase/client patterns, keeping role checks out of RLS where possible, and making database changes through explicit migrations.
- The schema reference is `public/current_schemaReference.sql`.
- `purchase_orders.status` currently allows only `open`, `placed`, `received`, and `cancelled`; the task explicitly says partially received POs should remain `placed`, so a new PO status is not required.
- `purchase_order_items.quantity_received` already exists and can persist cumulative received quantities.
- `restock_items.quantity_received` already exists and can mirror allocated received quantities back to linked restock items.
- `updatePurchaseOrderStatus` currently marks the PO `received` whenever receiving is saved and then updates linked restock requests to `received` if any quantity was received, or `cancelled` if none was received.
- The receive modal currently defaults every line to full quantity and submits directly to `updatePurchaseOrderStatus(..., 'received', itemUpdates)`.
- Type coverage is in `lib/types/restock.ts`; purchase-order UI behavior is mostly in `components/admin/restock/restock-workflow-tabs.tsx`; server mutations are in `app/actions/restock.ts`.

## Implementation Principles
- Treat `purchase_order_items.quantity_received` as cumulative quantity received for each line.
- Do not add a new `partial_received` PO status unless later product requirements explicitly request it; use `status = 'placed'` plus quantity comparisons to derive partial state.
- Keep restock request status truthfully aligned with fulfillment:
  - Fully fulfilled linked restock requests can become `received`.
  - Partially fulfilled linked restock requests should remain linked/active while any requested quantity remains outstanding.
  - Requests with zero received quantity should not be cancelled during a partial receipt.
- Make full receiving possible after one or more partial receiving passes by initializing receive inputs to remaining quantities, not original total quantities.
- Preserve existing behavior when the user declines partial receiving: submit as a full receipt and mark all lines complete.

---

## Phase 1 — Domain Model and Server Mutation Contract

### Goal
Create a safe server-side receiving contract that can distinguish partial receipt from final receipt while preserving existing PO statuses.

### Tasks
1. Add a receiving mode to the PO receiving mutation, for example `receivingMode: 'partial' | 'complete'` or `keepPlacedWhenIncomplete: boolean`.
2. Validate all incoming line quantities:
   - Quantity must be finite and non-negative.
   - Quantity cannot exceed the ordered line quantity when treated cumulatively.
   - Existing previously received quantities must not be accidentally reduced unless the UI intentionally supports corrections.
3. Update `purchase_order_items.quantity_received` cumulatively.
4. Allocate cumulative `purchase_order_items.quantity_received` back to linked `restock_items.quantity_received` in stable order.
5. If the receipt is partial:
   - Keep `purchase_orders.status = 'placed'`.
   - Do not set `purchase_orders.received_at`.
   - Keep incomplete linked `restock_requests` active/linked to the PO.
   - Insert or update history entries/notes if existing history patterns support it.
6. If the receipt is complete:
   - Set `purchase_orders.status = 'received'` and `received_at`.
   - Mark linked restock requests `received` only when all their requested quantities are fulfilled.

### Files Likely Touched
- `app/actions/restock.ts`
- `lib/types/restock.ts`

### Verification
- Unit/integration-level inspection or tests confirm a partial receipt leaves the PO `placed`.
- Data verification confirms `purchase_order_items.quantity_received` stores cumulative received quantities.
- Data verification confirms linked restock item quantities match allocated PO receipt quantities.

---

## Phase 2 — Receive Modal Partial-Receipt UX

### Goal
Update the receiving UI so users can intentionally save a partial receipt only after confirming the incomplete receipt.

### Tasks
1. Initialize each receive line with remaining quantity:
   - `remaining = quantity_ordered - quantity_received`.
   - If a line is already fully received, disable further input for that line.
2. Display line-level receipt progress:
   - Ordered quantity.
   - Previously received quantity.
   - Remaining quantity.
   - Quantity being received in this pass.
3. Detect incomplete receipt before submit:
   - A receipt is incomplete if any cumulative line quantity remains below ordered quantity.
4. Show a confirmation modal when incomplete quantities are submitted:
   - **Yes, save partial receipt**: submit partial mode and keep PO placed.
   - **No, complete receiving**: submit complete mode with all remaining quantities filled/received and mark PO received.
   - **Cancel/back**: return to the receive modal without saving.
5. Update toast messages so partial and complete receiving are clearly distinct.

### Files Likely Touched
- `components/admin/restock/restock-workflow-tabs.tsx`
- Potentially `components/admin/restock/confirmation-modal.tsx` if the existing confirmation modal can be reused cleanly.

### Verification
- Incomplete receipt opens the partial-receipt confirmation modal instead of immediately saving.
- Choosing **Yes** leaves the PO in `placed` and persists received quantities.
- Choosing **No** fills remaining quantities and marks the PO `received`.
- Previously received quantities and remaining quantities are shown on subsequent receive attempts.

---

## Phase 3 — PO List and Detail Visibility

### Goal
Make partial receiving visible anywhere staff review purchase orders.

### Tasks
1. Derive a PO-level partial receipt flag from item quantities:
   - `hasReceivedQuantity = any quantity_received > 0`.
   - `hasRemainingQuantity = any quantity_received < quantity_ordered`.
   - `isPartiallyReceived = status === 'placed' && hasReceivedQuantity && hasRemainingQuantity`.
2. Add a visible badge such as `Partially received` on PO cards/details.
3. Show remaining quantities for each line in PO details:
   - Ordered.
   - Received.
   - Remaining.
4. Ensure the Receive action remains available for `placed` POs that are partially received.

### Files Likely Touched
- `components/admin/restock/restock-workflow-tabs.tsx`
- `components/admin/restock/restock-request-detail.tsx` if linked request detail should expose remaining receipt information.

### Verification
- A partially received PO remains under the `Placed` PO tab.
- A partially received PO shows clear line-level remaining quantities.
- The Receive button is still available until every line is fully received.

---

## Phase 4 — Schema/Migration Decision and Documentation Sync

### Goal
Keep database documentation truthful and add migrations only if the code path needs additional audit metadata.

### Tasks
1. Confirm no new schema is required for the core feature because existing `quantity_received` columns can represent partial receipt.
2. If audit requirements demand extra state, add a migration for optional receipt metadata, such as:
   - `purchase_orders.last_partial_received_at`.
   - A receipt events table for per-pass receiving history.
3. Update `public/current_schemaReference.sql` only if an actual migration changes schema.
4. Update comments/docs to describe that `placed` + partial quantities means partially received.

### Files Likely Touched
- `supabase/migrations/*` only if a schema change is truly needed.
- `public/current_schemaReference.sql` only if a schema change is added.
- `context/TASKS` after implementation and verification are complete.

### Verification
- If no migration is added, document the no-schema-change decision in the implementation notes.
- If migration is added, verify migration syntax and schema reference updates.

---

## Phase 5 — End-to-End Validation and TASKS Closure

### Goal
Verify the complete workflow and update `context/TASKS` with truthful completion evidence.

### Tasks
1. Run static checks used by this repository, such as linting and TypeScript checks/build if available.
2. Exercise the PO receiving workflow with at least these cases:
   - Full receipt from a placed PO.
   - Partial receipt from a placed PO.
   - Subsequent receipt that completes a partially received PO.
   - Zero-quantity or unchecked line behavior.
3. Confirm data after each case:
   - PO status.
   - PO item received quantities.
   - Restock item received quantities.
   - Restock request statuses.
4. Update `context/TASKS` with:
   - What was implemented.
   - What was not changed and why.
   - Exact verification commands and manual verification steps.

### Files Likely Touched
- `context/TASKS`
- Test files if the project has suitable coverage points.

### Verification
- `context/TASKS` no longer reads as an uncompleted task list; it truthfully documents completion status and verification evidence.
- The final implementation is committed with the plan and TASKS updates.

---

## Phase Execution Status — 2026-06-20

### Phase 1 — Completed
- Implemented `receivingMode: 'partial' | 'complete'` in `updatePurchaseOrderStatus`.
- Added cumulative quantity validation for PO receiving.
- Kept partial receipts in `purchase_orders.status = 'placed'` and only set `received_at` for complete receipts.
- Allocated received PO quantities back to linked `restock_items.quantity_received`.
- Kept incomplete linked `restock_requests` in `linked_to_po` and moved fully fulfilled requests to `received`.

### Phase 2 — Completed
- Updated the receive modal to initialize receive quantities from remaining quantities.
- Added ordered, previously received, and remaining quantity context for each receive line.
- Added an incomplete-receipt prompt with explicit actions for saving partial receipts, completing receiving, or cancelling.
- Added distinct success messaging for partial and complete receipt paths.

### Phase 3 — Completed
- Added derived PO receiving summaries from line quantities.
- Added `Partially received` badges in PO list/detail views.
- Added received/ordered/remaining totals to PO list/detail views.
- Added line-level remaining quantities in the PO detail modal.
- Confirmed the Receive action remains available for `placed` POs, including partially received POs.

### Phase 4 — Completed: No Schema Migration Required
- No schema migration was created because the existing schema already includes the required persistent fields:
  - `purchase_order_items.quantity_received` stores cumulative received quantity per PO line.
  - `restock_items.quantity_received` stores cumulative received quantity per linked restock item.
  - `purchase_orders.status = 'placed'` plus incomplete line quantities derives the partial state without adding an enum/status value.
- A Supabase migration should be added only if future requirements need audit-grade per-receipt event history, such as a `purchase_order_receipts` table or `purchase_order_receipt_items` table.

### Phase 5 — Completed
- Updated `context/TASKS` with completed implementation details, no-schema-change rationale, and verification steps.
- Ran application validation commands documented in TASKS.
