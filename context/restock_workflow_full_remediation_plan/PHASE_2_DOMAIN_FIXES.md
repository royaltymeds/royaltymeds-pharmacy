# Phase 2 Domain / Action-Layer Fixes

Date: 2026-05-16  
Plan Reference: `context/restock_workflow_full_remediation_plan/PHASED_IMPLEMENTATION_PLAN.md`

## Objective
Validate and correct restock action-layer behavior to ensure UI workflows are backed by deterministic server-side logic, with emphasis on hold/orphan transitions from PO modal actions.

## What Was Validated
- `putRestockRequestOnHold(...)` behavior
- `putRestockItemOnHold(...)` behavior
- held request/item release flows:
  - `releaseHeldRestockRequestToPurchaseOrder(...)`
  - `releaseHeldRestockItemToPurchaseOrder(...)`
- upcoming reorder and purchase-order retrieval functions as data providers.

## Gap Confirmed During Phase 2
From Phase 1 audit, `E2-B` was marked partial:
- holding an item directly from PO modal depended on whether item had `purchase_order_item_id`
- prior logic rejected this path with: "Remove the item from its purchase order before putting it on hold."

That contradicted required behavior for direct PO-modal hold operations.

## Implemented Fix (Action Layer)
Updated `putRestockItemOnHold(...)` to support direct hold for PO-linked items:
1. If `purchase_order_item_id` exists, action now fetches the PO item.
2. Validates parent PO status is `open` or `placed` before mutation.
3. Deletes the PO line item record.
4. Recalculates/updates PO `total_amount` by subtracting removed line total (bounded at zero).
5. Continues existing orphan/hold workflow:
   - `restock_request_id` cleared
   - `held_from_request_id` set
   - `hold_status = on_hold`
   - request total recalculated and status adjusted if emptied.

## Why This Belongs in Phase 2
This is a domain contract correction in server action behavior, not just UI logic. It prevents UI from having to instruct users to do manual pre-removal and aligns action semantics with requested workflow rules.

## Verification Notes
- Lint check confirms updated action file compiles cleanly.
- Structural inspection confirms direct error gate was removed and replacement PO detachment logic is in place.

## Residual/Follow-on
- Phase 3 will handle UI-surface consistency for placed-PO indicators and tab filter control completion.
- Phase 4 will complete print/PDF reliability hardening and validation matrix execution.
