# Supplier Item Search Implementation Plan

Date: 2026-06-22  
Source task: `context/TASKS`  
Guidance reviewed: `context/ai_prompt_pretext.command`  
Schema reference reviewed: `public/current_schemaReference.sql`

## Task Summary

Add an item-first search feature to the Manage Suppliers page in Restock Management. Pharmacists should be able to search across linked supplier items by item name and other item attributes/fields. Matching results should appear in a dropdown. If the same item or matching text exists across multiple suppliers, the dropdown must show each supplier-specific item result with the supplier name. Selecting a result should open an edit modal for that supplier item, reusing the same editable fields and save behavior currently available in the supplier-specific “View linked items” modal.

## Existing Context and Constraints

- Primary UI target: `components/admin/restock/suppliers-list.tsx`.
- Existing supplier item data is already loaded into `supplierProductsMap` for each active supplier on initial page load.
- Existing linked-item edit behavior is inline inside the supplier details modal and updates drafts through `updateSupplierProductDraft(...)`, then persists through `handleSaveSupplierProduct(...)`.
- Existing server mutation `updateSupplierProduct(...)` updates `supplier_products` by row id.
- Relevant schema fields available for search and editing:
  - `suppliers`: `id`, `name`, `contact_person`, `email`, `phone`, `city`, `notes`, `is_active`.
  - `supplier_products`: `id`, `supplier_id`, `product_id`, `product_type`, `supplier_sku`, `supplier_unit_price`, `minimum_order_quantity`, `notes`, `product_name`, `is_inventory_item`, `is_active`.
- Follow the app’s established patterns from `ai_prompt_pretext.command`:
  - Keep role/security checks in server/API/action layers where needed.
  - Avoid RLS recursion patterns and do not add database policy complexity for this UI-only feature.
  - Preserve existing DecimalInput behavior for numeric supplier item fields.
  - Keep restock dropdown overlays anchored below their trigger where controllable.

## Phase 1: Discovery and Reusable Edit Surface Extraction

### Goal
Prepare the supplier linked-item editing UI so it can be reused by both the existing supplier-specific modal and the new global item-search selection modal.

### Implementation Steps
1. Review `suppliers-list.tsx` state dependencies around:
   - `supplierProductsMap`
   - `selectedSupplierDetails`
   - `expandedSupplierProductId`
   - `updateSupplierProductDraft(...)`
   - `handleSaveSupplierProduct(...)`
   - `confirmDeleteSupplierProduct(...)`
2. Extract the repeated expanded linked-item edit controls into a small internal render helper or local component, for example `SupplierProductEditor`.
3. Keep the editor props explicit:
   - `supplier`
   - `product`
   - `actionLoading`
   - `onDraftChange(updates)`
   - `onSave()`
   - `onUnlink()` if deletion remains available in that context
   - `description`
4. Use the extracted editor in the existing “View linked items” modal without changing its user-visible behavior.

### Acceptance Criteria
- Existing supplier-specific “View linked items” modal still supports search, expand/collapse, editing, saving, and unlinking.
- No changes to database schema or restock action contracts are introduced in this phase.
- Numeric fields still use `DecimalInput` and preserve decimal typing/blur semantics.

### Suggested Checks
- `npm run lint -- --file components/admin/restock/suppliers-list.tsx`
- Manual UI check: open Admin → Restock → Suppliers → View linked items → expand item → edit/save.

## Phase 2: Global Supplier Item Search State and Matching Logic

### Goal
Add local search state and deterministic matching across all loaded active supplier products.

### Implementation Steps
1. Add state for the global item search:
   - `globalItemSearch`
   - focused/open dropdown state such as `isGlobalItemSearchOpen`
   - selected result state such as `selectedGlobalSupplierProduct` containing `{ supplier, product }`.
2. Build a normalized flattening helper from `suppliers` plus `supplierProductsMap`:
   - Include only active suppliers and active supplier products.
   - Attach the supplier object to each product result.
3. Search across item and supplier attributes, including at minimum:
   - `product.product_name`
   - `product.product_id`
   - `product.product_type`
   - `product.supplier_sku`
   - `product.supplier_unit_price`
   - `product.minimum_order_quantity`
   - `product.notes`
   - `product.is_inventory_item` label (`inventory`, `non-inventory`)
   - `supplier.name`
   - optional supplier context fields such as `supplier.city`, `supplier.contact_person`, and `supplier.notes`.
4. Use memoized derived data so filtering is stable and readable.
5. Limit dropdown results to a practical count, for example 10–20 visible matches, and show a short “refine your search” hint if more matches exist.
6. Require a minimum query length, for example 2 characters, to avoid rendering a noisy full inventory dropdown.

### Acceptance Criteria
- Searching by item name returns linked supplier products from any supplier.
- Searching by SKU, type, notes, numeric price/min quantity, or supplier name can return matching rows.
- If multiple suppliers match the same item text, each result appears separately and includes the supplier name.
- Empty and no-match states are clear.

### Suggested Checks
- `npm run lint -- --file components/admin/restock/suppliers-list.tsx`
- Manual UI check with the same item linked to two suppliers.

## Phase 3: Search UI and Dropdown Interaction

### Goal
Expose the global item search on the Manage Suppliers page in a way that matches existing restock UI conventions.

### Implementation Steps
1. Add a search panel near the top of the suppliers page, close to the existing “Add Supplier”, “Link Item to Suppliers”, and “Bulk Import/Link” actions.
2. Use a `relative` wrapper and an absolutely positioned dropdown with `top-full`, `left-0`, `right-0`, and high z-index so the suggestions appear below the input.
3. Each dropdown row should display:
   - Item name as the primary label.
   - Supplier name prominently.
   - Product type and inventory/non-inventory label.
   - Supplier SKU if set.
   - Unit cost and minimum order quantity.
   - A notes snippet when present.
4. Add keyboard and focus-friendly behavior where feasible in one pass:
   - Open on focus when the query meets minimum length.
   - Close on Escape or after selection.
   - Keep click selection reliable by using mouse/pointer down handlers or controlled blur delay.
5. On result selection:
   - Set selected supplier/product state.
   - Clear or retain the query based on best UX; prefer retaining the selected item text for context.
   - Open the edit modal from Phase 4.

### Acceptance Criteria
- Dropdown appears under the global search input and is not hidden behind cards/modals.
- Results clearly distinguish supplier-specific matches.
- Selecting a result consistently opens the edit flow for that exact supplier product row.

### Suggested Checks
- `npm run lint -- --file components/admin/restock/suppliers-list.tsx`
- Manual UI check at desktop and narrower responsive widths.

## Phase 4: Global Selected Item Edit Modal

### Goal
Create a modal that allows editing the selected supplier item, matching the fields and behavior from the supplier-specific linked-items modal.

### Implementation Steps
1. Add a modal rendered when `selectedGlobalSupplierProduct` is set.
2. Modal header should show:
   - Item name.
   - Supplier name.
   - Product type and inventory/non-inventory context.
3. Reuse the editor extracted in Phase 1 for fields:
   - Item Name
   - SKU
   - Unit Cost
   - Min Qty
   - Notes
   - Inventory description when available.
4. Save should call the existing `handleSaveSupplierProduct(supplier.id, product)` path so the `supplierProductsMap` refreshes after update.
5. Consider whether unlink should be exposed in this global modal:
   - Preferred: include Unlink only if the same confirmation flow is clearly labeled with both item and supplier.
   - Alternative: omit Unlink in this first pass to keep the new global modal focused on editing, while retaining unlink in the supplier-specific modal.
6. Close behavior should reset only selected global item modal state, not the search query unless the UX intentionally clears after save.
7. If the selected product is updated, ensure the modal reads the latest product object from `supplierProductsMap` by id so draft edits and post-save refresh stay in sync.

### Acceptance Criteria
- Selecting any search result opens a modal with that exact supplier item.
- Editing and saving updates the underlying `supplier_products` row.
- After save, the global search results and existing supplier-specific modal reflect refreshed values.
- Modal close does not disrupt the existing supplier details modal if both flows were opened during the same session.

### Suggested Checks
- `npm run lint -- --file components/admin/restock/suppliers-list.tsx`
- Manual UI check: search → select → edit SKU/price/min qty/notes → save → reopen via supplier details and confirm values.

## Phase 5: Data Freshness, Edge Cases, and Regression Hardening

### Goal
Handle stale state and edge cases without expanding scope into schema or server rewrites.

### Implementation Steps
1. Ensure global result generation tolerates missing product names by falling back to `product_id`, consistent with existing linked-item UI.
2. Ensure inactive suppliers/products are not shown if loaded in state.
3. When a selected product is unlinked or becomes unavailable, close the global modal and show a non-blocking error or empty-state message.
4. Ensure save errors from `updateSupplierProduct(...)` appear in the existing page-level error area or an inline modal message.
5. Confirm supplier details modal pagination/search still works after extraction.
6. Add any small helper functions needed for consistent formatting:
   - `formatSupplierProductSearchText(...)`
   - `formatCurrency(...)` if not already local
   - `getSupplierProductDescription(...)` wrapping existing product description lookup.

### Acceptance Criteria
- Missing optional fields do not crash search or modal rendering.
- Search results remain accurate after edit/save reloads supplier products.
- Existing supplier management actions remain unchanged.

### Suggested Checks
- `npm run lint -- --file components/admin/restock/suppliers-list.tsx`
- Manual UI check: no query, one-character query, no matches, matching optional SKU/notes, inactive/unlinked item after refresh.

## Phase 6: Final Validation and Documentation

### Goal
Validate the complete task and record any implementation notes needed for future restock work.

### Implementation Steps
1. Run targeted lint for the modified suppliers list component.
2. If the implementation touches shared restock types/actions, run lint on those files too.
3. Run broader checks if time permits:
   - `npm run lint`
   - existing restock utility tests if related code changes occurred.
4. Perform manual acceptance testing in the Manage Suppliers page:
   - Search by item name.
   - Search by SKU.
   - Search by product type.
   - Search by notes/supplier name.
   - Select duplicate item matches from different suppliers and verify supplier-specific edit.
   - Save edits and verify refreshed display.
5. If the UI change is perceptible in the running web app, capture a screenshot after implementation according to repository guidelines.
6. Document completion notes in `context/` only if implementation reveals follow-up tasks or constraints.

### Acceptance Criteria
- The TASKS requirement is fully satisfied.
- The implementation is lint-clean or any environment limitation is documented.
- A pharmacist can use one global search to locate and edit any linked supplier item across all suppliers.

## Implementation Risks and Mitigations

- **Large `supplierProductsMap` rendering cost:** Keep filtering memoized and cap dropdown results.
- **Duplicate item ambiguity:** Always show supplier name and supplier-specific SKU/price/min quantity in each result.
- **State drift after save:** Refresh the selected supplier’s products through the existing loader and derive modal product by id from `supplierProductsMap`.
- **Dropdown positioning regressions:** Use custom anchored dropdown markup instead of native select behavior.
- **Accidental behavior changes in existing modal:** Extract the editor first and verify existing linked-item workflows before adding the global modal.

## Files Expected to Change During Implementation

- `components/admin/restock/suppliers-list.tsx` — primary UI, search, dropdown, modal, and editor extraction.
- Optional only if needed: `lib/types/restock.ts` — only for a local type export if the implementation benefits from a reusable selected-result type. Prefer keeping UI-only types local to `suppliers-list.tsx`.

No database migration is expected because the required searchable/editable fields already exist in `supplier_products` and `suppliers`.
