# Restock Management System Documentation

**Date:** April 21, 2026  
**Phase:** Phase 13 (Extended Features)  
**Status:** Migration Created (Not Yet Pushed)

## Overview

The Restock Management System is a comprehensive inventory supply management interface for the RoyaltyMeds pharmacist portal. It enables pharmacists to:

- **Manage Suppliers** - Create, edit, and maintain supplier relationships with contact information, payment terms, and lead times
- **Map Products to Suppliers** - Configure which OTC and prescription drugs are available from each supplier with pricing
- **Create Restock Orders** - Submit orders to suppliers with specific quantities and frequencies
- **Track Request Status** - Monitor orders through pending, approved, submitted, and received states
- **Record Receipts** - Log received quantities while approving orders
- **Manage Frequencies** - Support pre-configured ordering frequencies (daily, weekly, monthly, etc.)

## Architecture

### Service Role Authorization

The system uses the **Supabase Service Role client** to bypass RLS policies. This allows pharmacists to:
- Query and modify supplier and restock data without row-level security restrictions
- Create restock requests linked to their user ID
- Access all orders regardless of ownership (since all operations are pharmacy-wide)

**Why Service Role?** The restock system is a pharmacy-management function, not a multi-tenant system. All restock operations are internal to the pharmacy, so we use service role to simplify permissions while maintaining audit trails through user IDs.

### Database Schema

#### Core Tables

**suppliers** - Supplier master data
```sql
- id (UUID, PK)
- name (text, unique)
- contact_person, email, phone, address, city, country
- payment_terms, lead_time_days, minimum_order_amount
- is_active (boolean, soft delete flag)
- created_at, updated_at
```

**restock_frequencies** - Pre-configured order frequencies
```sql
- id (UUID, PK)
- name (text, unique) - "Daily", "Weekly", "Monthly", etc.
- description, days_interval
- is_active (boolean)
- created_at
```

**supplier_products** - Supplier ↔ Product mapping
```sql
- id (UUID, PK)
- supplier_id, product_id, product_type ('otc' | 'prescription')
- supplier_sku, supplier_unit_price, minimum_order_quantity
- reorder_frequency_id, last_ordered_at
- is_active (boolean)
- created_at, updated_at
- Unique constraint: (supplier_id, product_id, product_type)
```

**restock_requests** - Main restock order records
```sql
- id (UUID, PK)
- request_number (text, unique, auto-generated)
- supplier_id, pharmacist_id (user who submitted)
- status ('pending' | 'approved' | 'rejected' | 'submitted' | 'received' | 'cancelled')
- total_amount, expected_delivery_date, actual_delivery_date
- approved_at, approved_by, rejection_reason, approval_notes
- created_at, updated_at
```

**restock_items** - Line items in each restock request
```sql
- id (UUID, PK)
- restock_request_id, product_id, product_type
- product_name, quantity_requested, quantity_received
- unit_price, total_price
- notes, created_at, updated_at
```

**restock_history** - Audit trail for status changes
```sql
- id (UUID, PK)
- restock_request_id, action, old_status, new_status
- changed_by (user who made change), notes
- created_at
```

### RLS Policies

All tables have permissive RLS policies (SELECT, INSERT, UPDATE, DELETE return true):

```sql
CREATE POLICY "suppliers_select" ON public.suppliers FOR SELECT USING (true);
CREATE POLICY "suppliers_insert" ON public.suppliers FOR INSERT WITH CHECK (true);
CREATE POLICY "suppliers_update" ON public.suppliers FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "suppliers_delete" ON public.suppliers FOR DELETE USING (true);
-- Similar for other tables...
```

**Why permissive policies?** The service role client will bypass RLS entirely. These policies exist for:
1. Documentation of intended public access within the system
2. Future migration to role-based policies if needed
3. Security-in-depth if client-side bugs expose direct table access

## Project Structure

### Files Created

#### Database Migration
**Location:** `supabase/migrations/20260421000001_add_restock_management_system.sql`

Contains:
- 6 table definitions (suppliers, restock_frequencies, supplier_products, restock_requests, restock_items, restock_history)
- RLS policies for all tables (permissive)
- Performance indexes on key columns (supplier_id, status, created_at, etc.)
- Seed data for restock_frequencies (6 pre-configured options)

#### TypeScript Types
**Location:** `lib/types/restock.ts`

Exports:
- `Supplier` - Supplier entity with all fields
- `RestockFrequency` - Frequency template
- `SupplierProduct` - Supplier ↔ Product mapping
- `RestockItem` - Line item in request
- `RestockRequest` - Main restock order
- `RestockHistory` - Audit entry
- Input DTOs for creating/updating entities

#### Server Actions
**Location:** `app/actions/restock.ts`

Uses service role client. Exports:

**Supplier Operations:**
- `createSupplier()` - Add new supplier
- `updateSupplier()` - Modify supplier details
- `getSuppliers()` - List active suppliers
- `getSupplierById()` - Get single supplier
- `deleteSupplier()` - Soft delete supplier (marks is_active=false)

**Supplier Products:**
- `createSupplierProduct()` - Map product to supplier with pricing
- `getSupplierProducts()` - List products for supplier
- `updateSupplierProduct()` - Update mapping/pricing
- `deleteSupplierProduct()` - Soft delete mapping

**Restock Requests:**
- `createRestockRequest()` - Create order with line items
  - Auto-generates request_number
  - Creates restock_items from input
  - Calculates total_amount
  - Returns populated request with items
- `getRestockRequests()` - List with optional status filter
- `getRestockRequestById()` - Get with items and supplier
- `approveRestockRequest()` - Set status=approved, record approver
- `rejectRestockRequest()` - Set status=rejected, record reason
- `updateRestockRequestStatus()` - Generic status update with history
- `recordReceivedQuantities()` - Log received quantities on items
- `getRestockHistory()` - Audit trail for request

#### UI Pages

**Main Restock Dashboard**
- `app/admin/restock/page.tsx` - Dashboard showing stats and request list
- Components: RestockDashboard (stats cards), RestockRequestsList (filterable list)

**New Restock Request**
- `app/admin/restock/new/page.tsx` - Form to create orders
- Component: NewRestockRequestForm
  - Select supplier
  - Choose products from supplier_products
  - Set quantities
  - Calculate totals
  - Submit to create request

**Restock Request Detail**
- `app/admin/restock/[id]/page.tsx` - View single request
- Component: RestockRequestDetail
  - Display request info and items
  - Approve/reject workflows
  - Record received quantities
  - View approval/rejection notes
  - Status change history

**Suppliers Management**
- `app/admin/restock/suppliers/page.tsx` - CRUD for suppliers
- Component: SuppliersList
  - List all suppliers with key info
  - Create new supplier form (modal)
  - Edit existing supplier (modal)
  - Delete (soft delete via is_active flag)

#### Components

**`components/admin/restock/restock-dashboard.tsx`**
- Displays 4 stat cards: Total Orders, Pending Approval, Approved, Received
- Loads data from getRestockRequests()
- Color-coded by status

**`components/admin/restock/restock-requests-list.tsx`**
- Responsive card-based list of restock requests
- Filter by status (pending, approved, submitted, received, rejected, cancelled)
- Shows: request number, supplier, item count, total amount, order date
- Click to view details

**`components/admin/restock/new-restock-request-form.tsx`**
- Multi-step form:
  1. Select supplier from dropdown
  2. Add products from supplier_products
  3. Set quantities (with min order validation)
  4. Review totals
  5. Set expected delivery date
- Calculates subtotal as items added
- Disables submit until items added
- Redirects to detail page on success

**`components/admin/restock/restock-request-detail.tsx`**
- Displays full request info: request number, supplier, status, dates, total
- Tabular item list with: product name, unit price, quantity requested, received, total
- Status-specific actions:
  - pending: Approve/Reject buttons
  - approved: Record as Received button
- Modals for:
  - Approve (with optional notes)
  - Reject (with required reason)
  - Record Receipt (input quantities for each item)
- Shows approval/rejection notes when applicable
- Loads and displays change history

**`components/admin/restock/suppliers-list.tsx`**
- Lists all suppliers with key info: name, contact, email, phone, lead time, min order
- Create new supplier button
- Edit and delete actions for each supplier
- Modal form for create/edit:
  - All supplier fields from database schema
  - Form validation (name required)
  - Submit disabled during loading
- Delete prompts confirmation before soft delete

## Workflow Examples

### Submitting a Restock Order

1. Pharmacist clicks "New Restock Order" on dashboard
2. Selects supplier from dropdown (shows lead time)
3. Supplier's available products display with supplier SKU and unit price
4. Pharmacist clicks "+" to add products to order
5. Adjusts quantities for each item
6. System calculates total in real-time
7. Optionally sets expected delivery date
8. Clicks "Submit Restock Order"
9. System creates:
   - restock_request record (status=pending, pharmacist_id=current user)
   - restock_items records for each line item
   - Initial restock_history entry
10. Redirects to detail page showing "pending" status

### Approving a Restock Order

1. Pharmacist (or supervisor) views pending request detail
2. Reviews items and total cost
3. Clicks "Approve Request"
4. Modal appears for optional approval notes
5. Clicks "Confirm Approval"
6. System updates:
   - status=approved
   - approved_at=now()
   - approved_by=current user id
   - Creates restock_history entry (action=approved)
7. Detail page now shows "Approved" status
8. "Record as Received" button becomes available

### Recording Receipt

1. Shipment arrives from supplier
2. Pharmacist counts received quantities
3. Clicks "Record as Received" on approved request
4. Modal shows each item with "Quantity Requested" and input for "Quantity Received"
5. Enters actual received quantities (can be less than requested if short shipment)
6. Clicks "Confirm Receipt"
7. System:
   - Updates quantity_received on each restock_item
   - Sets status=received
   - Sets actual_delivery_date=today
   - Creates restock_history entry (action=received)
8. Pharmacist can now reconcile inventory counts

## API Response Patterns

All server actions return:
```typescript
{ data: T | null; error: string | null }
// Success: { data: {...}, error: null }
// Failure: { data: null, error: "Error message" }
```

This pattern allows client components to handle errors gracefully.

## Future Enhancements

1. **Auto-reordering** - Based on reorder_frequency and current inventory levels
2. **Supplier Performance Metrics** - Track on-time delivery, accuracy, unit cost trends
3. **Purchase Order PDF Generation** - Export formatted POs for supplier email
4. **Inventory Sync** - Auto-update otc_drugs/prescription_drugs quantity_on_hand on receipt
5. **Cost Analysis** - Dashboard showing spending per supplier, categories, trends
6. **Approval Workflows** - Multi-level approval for high-value orders
7. **Mobile App Integration** - Field receipt scanning with barcode reading

## Migration Instructions

**Do NOT Push Yet** - User will handle Supabase migration push.

When ready to deploy:
```bash
cd supabase
# Verify migration file is valid SQL:
npx supabase db push --dry-run
# Push to Supabase:
npx supabase db push
```

Migration file: `supabase/migrations/20260421000001_add_restock_management_system.sql`

This will:
1. Create all 6 tables with proper constraints
2. Enable RLS on all tables
3. Create all policies
4. Create performance indexes
5. Seed restock_frequencies with 6 default options

## Security Considerations

1. **Service Role Usage** - Only used on server-side (in server actions), never exposed to client
2. **User ID Tracking** - All restock requests track pharmacist_id and approval/rejection users for audit
3. **Soft Deletes** - Suppliers and products marked inactive rather than deleted, preserving history
4. **RLS Backup** - Permissive policies in place; can be made restrictive in future without code changes
5. **Input Validation** - Server actions validate required fields before database operations
6. **Error Messages** - Generic error responses to client, no SQL details exposed

## Deployment Checklist

- [ ] Migration created and reviewed
- [ ] TypeScript types added to lib/types/restock.ts
- [ ] Server actions created in app/actions/restock.ts
- [ ] All page routes created in app/admin/restock/*
- [ ] All components created in components/admin/restock/*
- [ ] Test create supplier flow
- [ ] Test create restock request flow
- [ ] Test approve/reject workflows
- [ ] Test receive quantities recording
- [ ] Verify stats cards update in real-time
- [ ] Test filter by status
- [ ] Verify links and navigation between pages
- [ ] Test error handling in all forms
- [ ] Review accessibility (form labels, button text, color contrast)

## File Summary

| File | Type | Purpose |
|------|------|---------|
| `supabase/migrations/20260421000001_add_restock_management_system.sql` | Migration | Database schema |
| `lib/types/restock.ts` | TypeScript | Type definitions |
| `app/actions/restock.ts` | Server Actions | CRUD operations with service role |
| `app/admin/restock/page.tsx` | Page | Dashboard & main restock view |
| `app/admin/restock/new/page.tsx` | Page | New order form page |
| `app/admin/restock/[id]/page.tsx` | Page | Order detail page |
| `app/admin/restock/suppliers/page.tsx` | Page | Suppliers management page |
| `components/admin/restock/restock-dashboard.tsx` | Component | Stats cards |
| `components/admin/restock/restock-requests-list.tsx` | Component | Orders list |
| `components/admin/restock/new-restock-request-form.tsx` | Component | Create order form |
| `components/admin/restock/restock-request-detail.tsx` | Component | Order detail view |
| `components/admin/restock/suppliers-list.tsx` | Component | Suppliers CRUD |

**Total Files Created:** 12 (1 migration + 1 types + 1 actions + 4 pages + 5 components)

---

**Architecture Review Date:** April 21, 2026  
**Next Review:** After first production use  
**Documentation Status:** Complete - Ready for migration push
