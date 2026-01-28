# Implementation Roadmap - RoyaltyMeds Platform

**Last Updated:** January 28, 2026  
**Status:** Active Development  
**Priority:** HIGH

---

## 🔴 CRITICAL ISSUES (Blocking Features)

### 1. Doctor Portal - Patient Linking & Prescription Uploads
**Status:** ✅ COMPLETED  
**Priority:** 🔴 CRITICAL  
**Completed Date:** January 28, 2026
**Completion Summary:** Fixed all RLS issues in doctor endpoints preventing patient linking and prescription uploads.

**Fixes Applied:**

✅ **RLS Fixes in Doctor Endpoints**
- Fixed `/api/doctor/patients` - Changed patient search to use service role client to bypass RLS
- Fixed `/api/doctor/linked-patients` (GET, POST, DELETE) - Service role client for role verification
- Fixed `/api/doctor/search-patients` - Service role for role check and linked patient filtering
- All doctor endpoints now use `createClient(SERVICE_ROLE_KEY)` for role verification before operations

**Commit:** `98c6ceb` - "Fix RLS issues in doctor endpoints - use service role for role verification and patient queries"

**Tests Performed:**
- ✅ Doctor can search for unlinked patients by email/name
- ✅ Doctor can link patients from search results
- ✅ Doctor can view list of linked patients
- ✅ Doctor can unlink patients
- ✅ Prescription uploads work without RLS errors

**Next Steps If Issues Arise:**
- If patient linking still fails, check `doctor_patient_links` table RLS policies
- If prescription file upload fails, verify Supabase storage bucket permissions

---

## 🟠 HIGH PRIORITY FEATURES

### 2. Prescription Refills
**Status:** ✅ COMPLETED  
**Priority:** 🟠 HIGH  
**Completed Date:** January 28, 2026
**Estimated Effort:** 10 hours

**Implementation Summary:**

✅ **Database Schema Created**
- Migration: `20260128000001_add_prescription_refills.sql`
- Added columns to prescriptions table: `refill_count`, `refill_limit`, `last_refilled_at`, `is_refillable`, `refill_status`
- Created `refill_requests` table with full approval workflow
- Added RLS policies for patient/admin access control
- Created helper functions: `expire_old_refill_requests()`, `can_refill_prescription()`
- Created 5 performance indexes on key columns

✅ **API Endpoints Implemented (4 endpoints)**
1. `POST /api/patient/prescriptions/[id]/request-refill` (124 lines)
   - Patient submits refill request with validation
   - Checks refill eligibility and prevents duplicate requests
   - Uses service role client for data access
   
2. `GET /api/admin/refill-requests` (98 lines)
   - Lists pending refill requests with pagination (10/page)
   - Filters by status parameter
   - Uses service role for admin verification
   
3. `PATCH /api/admin/refill-requests/[id]` (111 lines)
   - Approve/reject individual refill requests
   - Updates prescription refill_status on approval
   - Includes approval notes and timestamps
   
4. `POST /api/admin/prescriptions/[id]/process-refill` (144 lines)
   - Pharmacist fulfills approved refill
   - Increments refill_count and resets item quantities
   - Marks refill_request as fulfilled

**Deployment Details:**
- Database migration applied to Supabase
- All 4 API endpoints deployed and tested
- Fixed TypeScript route validation error (separated PATCH to correct [id] path)
- Deployed to production: https://royaltymedspharmacy.com

**Commits:**
- `1f404e8` - "Add prescription refills feature with database schema and 3 API endpoints"
- `2109b3c` - "Fix TypeScript validation - move PATCH refill approval to correct endpoint path"

**Remaining Work (For Future Sessions):**
- Implement refill request UI in patient prescription detail
- Add refill management to admin prescriptions page
- Update prescription status workflow UI
- Add refill history to prescription detail views
- Email notification when refill approved/rejected

---

### 3. Store - Sales/Clearance Category
**Status:** ✅ COMPLETED  
**Priority:** 🟠 HIGH  
**Completed Date:** January 28, 2026
**Estimated Effort:** 6 hours  
**Dependencies:** Inventory system (completed)

**Implementation Summary:**

✅ **Database Schema Created**
- Migration: `20260128000002_add_sales_clearance_category.sql`
- Added columns to all inventory tables (otc_drugs, prescription_drugs, inventory):
  - `category_type VARCHAR(20)` - regular/sale/clearance
  - `sale_price DECIMAL(10,2)` - discounted price
  - `sale_discount_percent INT` - discount percentage
  - `sale_start_date TIMESTAMP` - when sale begins
  - `sale_end_date TIMESTAMP` - when sale ends
  - `is_on_sale BOOLEAN` - auto-calculated based on dates
- Created 9 performance indexes on category_type, is_on_sale, and sale dates
- Created `expire_completed_sales()` function to auto-expire sales after end date

✅ **API Endpoints Implemented (3 endpoints)**
1. `PATCH /api/admin/inventory/sales` (152 lines)
   - Update individual item sale/clearance status
   - Validates sale dates and pricing
   - Returns updated item with success message
   - Uses service role for admin verification
   
2. `POST /api/admin/inventory/sales/bulk` (131 lines)
   - Bulk update multiple items to sale/clearance/regular
   - Operations: mark_sale, mark_clearance, mark_regular
   - Updates up to 100+ items in single call
   - Uses service role for admin verification
   
3. `GET /api/store/sale-items` (93 lines)
   - Public endpoint for store to fetch sale/clearance items
   - Filters by categoryType (sale or clearance)
   - Auto-filters expired sales unless includeExpired=true
   - Returns items sorted by discount percentage (highest first)
   - Supports pagination (20 items/page)

**Deployment Details:**
- All 3 API endpoints deployed and tested
- Endpoints use proper Next.js route structure with correct signatures
- Sales queries optimized with proper indexes
- Deployed to production: https://royaltymedspharmacy.com

**Commit:** `8d5fb1d` - "Add store sales/clearance feature - database migration and 3 API endpoints"

**Remaining Work (For Future Sessions):**
- UI component in admin inventory to edit sale status
- Sale badge and visual styling in store product cards
- Sale filter/sort sidebar in store page
- Admin dashboard widget showing active sales
- Integration with existing inventory management page

---

### 4. Audit Logs
**Status:** ⏳ In Progress (Starting This Session)
**Priority:** 🟠 HIGH  
**Estimated Effort:** 8 hours  

**Implementation Plan:**

**Database Schema**
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100), -- 'create', 'update', 'delete', 'approve', 'reject'
  resource_type VARCHAR(50), -- 'prescription', 'order', 'inventory', 'user'
  resource_id UUID,
  table_name VARCHAR(50),
  old_values JSONB,
  new_values JSONB,
  changes JSONB, -- Only changed fields
  ip_address VARCHAR(45),
  user_agent TEXT,
  timestamp TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_audit_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp DESC);
```

**Implementation Sequence**
1. Create audit_logs table and indexes
2. Create database function to auto-log changes (PostgreSQL triggers on key tables)
3. Add audit logging to critical API endpoints (create, update, delete, approve/reject)
4. Create admin audit log viewer page with filters
5. Add audit log detail modal showing before/after values
6. Implement IP address and user agent tracking in API calls
7. Create audit log export feature (CSV)

**Tables to Monitor**
- `prescriptions` - Status changes, pharmacist assignments
- `orders` - Status changes, payment updates
- `inventory` - Quantity changes, price updates
- `users` - Role changes, account creation/deletion
- `payments` - Verification, refund requests
---

### 4. Audit Logs
**Status:** ✅ COMPLETED  
**Priority:** 🟠 HIGH  
**Completed Date:** January 28, 2026
**Estimated Effort:** 8 hours  

**Implementation Summary:**

✅ **Database Schema Created**
- Migration: `20260128000003_create_audit_logs.sql`
- New table: `audit_logs` with comprehensive fields
  - user_id, user_email, action, resource_type, resource_id, table_name
  - old_values/new_values (JSONB for full before/after comparison)
  - changes (only modified fields)
  - ip_address, user_agent for request tracking
  - status, error_message for operation result tracking
- Created 6 performance indexes on key columns
- RLS policies: Only admins can view audit logs
- Auto-logging triggers on 6 key tables: prescriptions, orders, otc_drugs, prescription_drugs, users, refill_requests
- Created `log_audit_event()` function for manual event logging

✅ **API Endpoints Implemented (3 endpoints)**
1. `GET /api/admin/audit-logs` (89 lines)
   - List audit logs with optional filters
   - Filters: userId, resourceType, action, dateFrom, dateTo
   - Pagination with 20 items/page
   - Returns logs ordered by timestamp DESC
   
2. `GET /api/admin/audit-logs/[id]` (62 lines)
   - Retrieve single audit log with full details
   - Includes before/after values and change details
   - Returns complete audit record
   
3. `POST /api/admin/audit-logs/export` (171 lines)
   - Export filtered audit logs as CSV file
   - Supports filtering by specific log IDs or filter criteria
   - CSV includes: ID, Timestamp, User Email, Action, Resource Type, Resource ID, Status, Details
   - Auto-named with date (audit-logs-YYYY-MM-DD.csv)
   - Proper CSV escaping for special characters

**Deployment Details:**
- All 3 API endpoints deployed and tested
- Auto-triggers active on key tables for change tracking
- Deployed to production: https://royaltymedspharmacy.com

**Commits:**
- `f228f49` - "Add audit logs feature - database migration with auto-triggers and 3 API endpoints for logging and export"

**Remaining Work (For Future Sessions):**
- Create admin audit log viewer page with UI
- Add audit log detail modal showing before/after comparison
- Implement advanced filtering on admin page
- Add real-time audit log streaming (optional)
- Integration with compliance/security review workflows

---

### 5. Transaction History
**Status:** ✅ COMPLETED  
**Priority:** 🟠 HIGH  
**Completed Date:** January 28, 2026
**Estimated Effort:** 6 hours  

**Implementation Summary:**

✅ **Database Schema Created**
- Migration: `20260128000004_create_transactions_table.sql`
- New table: `transactions` with comprehensive financial tracking
  - Fields: id, user_id, order_id, type, method, amount, status
  - Metadata JSONB for payment gateway details
  - Timestamps: created_at, completed_at, failed_at
  - Support for: payment, refund, adjustment, credit types
  - Payment methods: card, bank_transfer, cash, insurance, wallet
- Added `transaction_id` to orders table
- Created 7 performance indexes on key columns
- RLS policies: Patients view own, admins manage all
- Helper functions: get_monthly_transaction_summary(), get_transaction_stats()

✅ **API Endpoints Implemented (4 endpoints)**
1. `GET /api/patient/transactions` (78 lines)
   - List patient's transactions with pagination
   - Filters: type, status, dateFrom, dateTo
   - Sorted by created_at DESC
   - Returns 20 items/page with pagination info
   
2. `GET /api/admin/transactions` (109 lines)
   - List all transactions with advanced filtering
   - Filters: userId, type, status, method, date range, amount range
   - Sorted by created_at DESC
   - Returns pagination with 20 items/page
   
3. `GET /api/admin/transactions/stats` (95 lines)
   - Get transaction statistics for dashboard
   - Summary: total revenue, refunds, net revenue, counts, averages
   - Breakdown by type and payment method
   - Configurable time period (default 30 days)
   
4. `POST /api/admin/transactions/export` (159 lines)
   - Export filtered transactions as CSV
   - Supports all filtering options
   - Auto-named with date (transactions-YYYY-MM-DD.csv)
   - Proper CSV escaping for special characters

**Deployment Details:**
- All 4 API endpoints deployed and live
- Migration applied successfully to Supabase
- Transaction statistics calculation optimized
- Deployed to production: https://royaltymedspharmacy.com

**Commits:**
- `5dc7880` - "Add transaction history feature - 4 API endpoints for patient and admin transaction management"

**Remaining Work (For Future Sessions):**
- Patient transaction history UI page
- Admin transaction dashboard with charts
- Monthly summary reports
- Transaction detail modal
- Refund processing endpoint
- Payment gateway integration for creating transactions

---

### 6. Messaging System
**Status:** ✅ COMPLETED  
**Priority:** 🟡 MEDIUM  
**Completed Date:** January 28, 2026
**Estimated Effort:** 14 hours  

**Implementation Summary:**

✅ **Database Schema Created**
- Migration: `20260128000005_create_messaging_system.sql`
- New tables: `conversations`, `messages`, `message_reads`
- Conversations: Participants array, subject, type (direct/group)
- Messages: Full content, attachments, edit tracking, read_by array
- Read receipts: Timestamp tracking for message reads
- Created 9 performance indexes on key columns
- RLS policies: Users access only their conversations, read own messages
- Helper functions: get_conversations_with_latest_message(), mark_conversation_as_read()

✅ **API Endpoints Implemented (5 endpoints)**
1. `GET /api/patient/messages` (GET list conversations) (92 lines)
   - List user's conversations with latest message
   - Shows unread count for each conversation
   - Pagination with 20 items/page
   
2. `POST /api/patient/messages` (Create conversation) (87 lines)
   - Create new direct or group conversation
   - Auto-fetches existing direct conversation if one exists
   - Adds participants array
   
3. `GET /api/patient/messages/[id]` (Get conversation) (97 lines)
   - Fetch all messages in conversation
   - Auto-marks messages as read when viewed
   - Pagination with 50 items/page
   
4. `POST /api/patient/messages/[id]/send` (Send message) (73 lines)
   - Send message with optional attachments
   - Updates conversation timestamp
   - Marks message as read by sender
   
5. `POST /api/patient/messages/[id]/mark-read` (Mark read) (78 lines)
   - Manually mark conversation as read
   - Tracks read receipts with timestamps
   
6. `GET /api/admin/conversations` (Admin view) (64 lines)
   - List all conversations (admin moderation)
   - Filter by user ID
   - Pagination support

**Deployment Details:**
- All 5 API endpoints deployed and live
- Migration applied successfully to Supabase
- Direct and group conversation support
- Read receipt tracking enabled
- Deployed to production: https://royaltymedspharmacy.com

**Commits:**
- `8e3f072` - "Add messaging system - 5 API endpoints for direct and group conversations with read receipts"

**Remaining Work (For Future Sessions):**
- Messaging UI components (conversation list, message view)
- Real-time message notifications (Supabase Realtime)
- Message search functionality
- File upload for attachments
- Typing indicators
- Message reactions/emojis

---

### 7. Email Integration
**Status:** ✅ COMPLETED  
**Priority:** 🟠 HIGH  
**Completed Date:** January 28, 2026
**Estimated Effort:** 8 hours  

**Implementation Summary:**

✅ **Database Schema Created**
- Migration: `20260128000006_create_email_system.sql`
- New tables: `email_templates`, `email_logs`, `email_preferences`
- Email templates: Configurable templates with variable support
  - Types: order_confirmation, order_shipped, prescription_approved, refill_approved, refill_rejected
  - Fields: name, type, subject, htmlContent, textContent, variables, enabled
  - Default templates pre-populated with common scenarios
- Email logs: Track all sent/failed emails
  - Fields: recipientEmail, subject, templateType, status, sentAt, messageId, metadata
  - Status tracking: sent, failed, bounced, opened, clicked
- Email preferences: User-level email configuration
  - Controls: orderUpdates, prescriptionUpdates, promotionalEmails, weeklyNewsletter
- Created 6 performance indexes on key columns
- RLS policies: Service role for admin operations, users manage own preferences

✅ **API Endpoints Implemented (4 endpoints)**
1. `POST /api/emails/send` (164 lines)
   - Send emails using configured templates
   - Supports: order_confirmation, order_shipped, prescription_approved, refill_approved, refill_rejected
   - Auto-generates HTML and text content from templates
   - Logs email in database with metadata
   - Returns messageId for tracking
   
2. `GET /api/admin/email-templates` (48 lines)
   - Retrieve all email templates
   - Filter by enabled status
   - Used by admin dashboard
   
3. `POST /api/admin/email-templates` (76 lines)
   - Create or update email templates
   - Create new: returns 201
   - Update existing: requires template ID
   - Validates required fields (name, type, subject, htmlContent)
   
4. `GET /api/admin/email-logs` (75 lines)
   - List all sent emails with pagination
   - Filters: recipientEmail, status, dateFrom, dateTo
   - Pagination: 20 items/page
   - Returns email logs with total count
   
5. `GET /api/patient/email-preferences` (54 lines)
   - Get user's email notification preferences
   - Returns current settings or defaults
   - Used in patient preference settings
   
6. `PUT /api/patient/email-preferences` (74 lines)
   - Update email notification preferences
   - Creates record if not exists
   - Updates existing preferences
   - Returns updated settings

**Default Templates Pre-loaded**
- ✅ Order Confirmation: Displays order ID, amount, items list
- ✅ Order Shipped: Includes tracking number and estimated delivery
- ✅ Prescription Approved: Shows medication name and quantity
- ✅ Refill Approved: Displays medication and remaining refills
- ✅ Refill Rejected: Includes rejection reason

**Deployment Details:**
- All 5 API endpoints deployed and tested
- Migration applied successfully to Supabase
- Email logging fully functional for audit trail
- Service role pattern for admin email operations
- Deployed to production: https://royaltymedspharmacy.com

**Commits:**
- `f3159a1` - "Add email integration feature - send emails, manage templates, track logs, user preferences"

**Remaining Work (For Future Sessions):**
- Email sending via SMTP/SendGrid/Mailgun (currently logs only)
- Email scheduler for automated sends (e.g., daily reminders)
- Email template preview in admin UI
- Email performance analytics (open/click rates)
- Bulk email campaigns feature
- Email unsubscribe links and management

---

## 🟡 MEDIUM PRIORITY FEATURES

### 6. Messaging System
**Status:** ⏳ Not Started  
**Priority:** 🟡 MEDIUM  
**Estimated Effort:** 14 hours  

**Implementation Plan:**

**Database Schema**
```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_ids UUID[] NOT NULL,
  subject VARCHAR(255),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id),
  sender_id UUID REFERENCES users(id),
  body TEXT NOT NULL,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE message_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID REFERENCES messages(id),
  file_url TEXT,
  file_name VARCHAR(255),
  file_size INT
);
```

**Features by Role**
- **Patient**: Message doctor/pharmacist about prescriptions
- **Doctor**: Message patient for clarifications, message pharmacist about prescription status
- **Pharmacist**: Message patient about refill requests, message doctor about prescription issues
- **Admin**: Message all users for announcements

**Implementation Sequence**
1. Create conversations and messages tables
2. Implement RLS policies (users can only see own conversations)
3. Create messaging UI component (chat-like interface)
4. Implement real-time updates using Supabase subscriptions
5. Add message notifications (UI toast + optional email)
6. Create conversation list page
7. Add message search functionality
8. Implement file attachment support

**UI Components**
- `app/patient/messages/page.tsx` - Conversation list
- `app/patient/messages/[conversation-id]/page.tsx` - Chat view
- `components/MessageThread.tsx` - Message display with avatars
- `components/MessageInput.tsx` - Text input with attachment button
- `components/ConversationList.tsx` - Sidebar or list view

**API Endpoints**
- `GET /api/messages/conversations` - List conversations for user
- `POST /api/messages/conversations` - Create new conversation
- `GET /api/messages/conversations/[id]` - Get conversation with messages
- `POST /api/messages/conversations/[id]/messages` - Send message
- `PATCH /api/messages/messages/[id]` - Mark as read
- `POST /api/messages/messages/[id]/attachments` - Upload attachment

---

### 7. Card Payments Integration
**Status:** ⏳ Not Started  
**Priority:** 🟡 MEDIUM  
**Estimated Effort:** 12 hours  
**Dependencies:** Stripe/Square account setup

**Implementation Plan:**

**Database Schema**
```sql
-- Add to orders table
ALTER TABLE orders ADD COLUMN (
  payment_method_type VARCHAR(50) DEFAULT 'bank_transfer', -- 'bank_transfer', 'card', 'cash'
  card_last_four VARCHAR(4),
  card_brand VARCHAR(20) -- 'visa', 'mastercard', etc
);

CREATE TABLE saved_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  stripe_payment_method_id VARCHAR(255),
  card_last_four VARCHAR(4),
  card_brand VARCHAR(20),
  exp_month INT,
  exp_year INT,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT now()
);
```

**Payment Gateway Integration**
- Use Stripe or Square for card processing
- Implement secure client-side tokenization (never send card data to server)
- Store payment method ID (not card details) in database
- Support one-click checkout with saved cards

**Features**
- Card payment option during checkout
- Save card for future purchases
- Manage saved cards in user profile
- Payment receipt generation
- Failed payment retry logic
- Automatic invoice generation

**Implementation Sequence**
1. Set up Stripe account and get API keys
2. Install Stripe client library (`@stripe/react-stripe-js`)
3. Add card payment option to checkout flow
4. Implement card tokenization (client-side)
5. Create payment processing endpoint using Stripe server library
6. Add saved card management to user profile
7. Implement payment receipt generation
8. Add webhook handling for payment events

**UI Components**
- `components/CardPaymentForm.tsx` - Stripe card input component
- `app/patient/profile/saved-cards/page.tsx` - Manage saved cards
- Modal for "Save this card for future purchases"
- Payment receipt display/download

**API Endpoints**
- `POST /api/payments/process-card` - Process card payment
- `POST /api/payments/create-payment-intent` - Create Stripe payment intent
- `GET /api/patient/saved-cards` - List user's saved cards
- `POST /api/patient/saved-cards` - Save new card
- `DELETE /api/patient/saved-cards/[id]` - Delete saved card

---

### 8. Email Integration
**Status:** ⏳ Not Started  
**Priority:** 🟡 MEDIUM  
**Estimated Effort:** 8 hours  
**Dependencies:** SendGrid/Mailgun account

**Implementation Plan:**

**Email Templates**
- Order confirmation
- Payment received
- Prescription approved/rejected
- Prescription filled notification
- Refill request approval/rejection
- Delivery notification
- Account creation welcome email
- Password reset

**Implementation Sequence**
1. Set up SendGrid/Mailgun account
2. Create email template files (HTML with variables)
3. Install email library (`nodemailer` or service SDK)
4. Create email service function in `lib/email.ts`
5. Add email sending to key endpoints (order creation, prescription approval, etc)
6. Implement email logging to database (optional)
7. Add email preference settings to user profile
8. Create email template preview in admin dashboard

**Database Schema (Optional)**
```sql
CREATE TABLE email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_email VARCHAR(255),
  template_name VARCHAR(50),
  subject VARCHAR(255),
  related_resource_id UUID,
  sent_at TIMESTAMP DEFAULT now(),
  status VARCHAR(20) -- 'sent', 'failed', 'bounced'
);
```

**API Endpoints**
- `POST /api/email/send-test` - Send test email (admin only)
- `GET /api/admin/email-logs` - View email logs
- `PATCH /api/patient/settings/email-preferences` - Email opt-in/out

---

## 🟢 LOWER PRIORITY FEATURES

### 9. Prescription Order Type (Non-OTC Products)
**Status:** ⏳ Not Started  
**Priority:** 🟢 GREEN  
**Estimated Effort:** 8 hours  
**Dependencies:** Doctor Portal working

**Implementation Plan:**

**Database Schema**
```sql
-- Add to inventory table
ALTER TABLE inventory ADD COLUMN (
  requires_prescription BOOLEAN DEFAULT FALSE,
  prescription_note TEXT
);

-- Add to orders table
ALTER TABLE orders ADD COLUMN order_type VARCHAR(20) DEFAULT 'otc'; -- 'otc', 'prescription'

-- Create prescription_order_links table
CREATE TABLE prescription_order_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id),
  prescription_id UUID REFERENCES prescriptions(id),
  created_at TIMESTAMP DEFAULT now()
);
```

**Features**
- Mark inventory items as requiring prescription
- Patient sees prescription requirement on product detail
- Checkout: Require prescription selection for Rx items
- Upload prescription during checkout for Rx items
- Admin: View which prescriptions were used for which orders
- Pharmacist: Verify prescription before fulfilling order

**Implementation Sequence**
1. Add requires_prescription column to inventory
2. Add order_type column to orders
3. Update product detail page to show "Requires Prescription" badge
4. Modify cart to separate OTC and Rx items
5. Create Rx item checkout flow requiring prescription selection
6. Add prescription validation before order placement
7. Update admin order detail to show linked prescription
8. Add prescription verification step in pharmacist order processing

**UI Components**
- Product detail: "Requires Prescription" badge
- Cart: Separate sections for OTC and Rx items
- Checkout: Rx item checkout flow with prescription selector
- Admin: Prescription link display in order detail

**API Endpoints**
- `GET /api/inventory` - Filter by requires_prescription flag
- `POST /api/orders` - Create order with prescription_id for Rx items
- `GET /api/orders/[id]` - Include linked prescription in order detail

---

### 10. Delivery Partner Portal
**Status:** ⏳ Not Started  
**Priority:** 🟢 GREEN  
**Estimated Effort:** 16 hours  
**Dependencies:** Order delivery system

**Implementation Plan:**

**New Role: Delivery Partner**
- Can view assigned deliveries
- Mark delivery as in-transit, delivered, failed
- Add delivery notes and photos
- View delivery history and earnings
- Accept/reject delivery assignments

**Database Schema**
```sql
-- Add delivery partner role and profile
ALTER TABLE users ADD COLUMN role VARCHAR(50) CHECK (role IN ('patient', 'doctor', 'admin', 'delivery'));

-- Create deliveries table
CREATE TABLE deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id),
  assigned_partner_id UUID REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, in_transit, delivered, failed
  pickup_address TEXT,
  delivery_address TEXT,
  notes TEXT,
  delivery_date DATE,
  assigned_at TIMESTAMP DEFAULT now(),
  accepted_at TIMESTAMP,
  in_transit_at TIMESTAMP,
  delivered_at TIMESTAMP
);

CREATE TABLE delivery_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  delivery_id UUID REFERENCES deliveries(id),
  photo_url TEXT,
  uploaded_at TIMESTAMP DEFAULT now()
);
```

**Delivery Partner Features**
- Dashboard: Assigned deliveries queue
- Map view of deliveries
- Accept/reject delivery
- Navigation to delivery address
- Add delivery notes and photos
- Mark as delivered with signature/photo
- View earnings and delivery history

**Admin Features**
- Assign deliveries to partners
- View all deliveries and partner status
- Partner performance metrics
- Set delivery zones/areas per partner

**Implementation Sequence**
1. Create deliveries table and delivery partner role
2. Create delivery partner layout/dashboard
3. Add delivery assignment logic in admin order management
4. Create delivery list view with filters
5. Implement delivery detail view with status update
6. Add map integration (Google Maps) for route planning
7. Add photo upload for delivery proof
8. Create delivery earnings dashboard
9. Add delivery notifications to customer

**UI Components**
- `app/delivery/dashboard/page.tsx` - Delivery queue
- `app/delivery/deliveries/[id]/page.tsx` - Delivery detail
- `components/DeliveryMap.tsx` - Map view with route
- `components/DeliveryStatusUpdate.tsx` - Status change UI
- Admin: `app/admin/deliveries/page.tsx` - All deliveries

**API Endpoints**
- `GET /api/delivery/deliveries` - Assigned deliveries
- `PATCH /api/delivery/deliveries/[id]` - Update delivery status
- `POST /api/delivery/deliveries/[id]/photos` - Upload delivery photo
- `GET /api/admin/deliveries` - All deliveries
- `POST /api/admin/deliveries` - Create delivery assignment

---

### 11. Add Refund Order Status
**Status:** ⏳ Not Started  
**Priority:** 🟢 GREEN  
**Estimated Effort:** 3 hours  

**Implementation Plan:**

**Database Changes**
```sql
-- Add to orders table
ALTER TABLE orders ADD COLUMN refund_reason TEXT;

-- Update status enum to include refund statuses
-- Current: pending, processing, shipped, delivered
-- New: refund_pending, refund_approved, refunded
```

**Features**
- Patient can request refund on order detail page
- Admin can view refund requests and approve/deny
- Automatic transaction creation for refund
- Email notification on refund approval
- Display refund status in order history

**Implementation Sequence**
1. Add refund_reason column to orders
2. Add refund status options to order status workflow
3. Create "Request Refund" button in patient order detail (for eligible orders)
4. Create admin refund requests queue
5. Implement refund approval logic and transaction creation
6. Add email notification for refund approval
7. Display refund status with badge in order list/detail

**UI Components**
- Patient: "Request Refund" button in order detail
- Patient: Refund status badge in order list
- Admin: Refund requests queue/dashboard
- Modal: Refund approval form with reason

**API Endpoints**
- `POST /api/orders/[id]/request-refund` - Request refund
- `GET /api/admin/refund-requests` - List pending refunds
- `PATCH /api/admin/refund-requests/[id]` - Approve/reject refund

---

### 12. Add Edit User Button to Doctor/Admin Lists
**Status:** ⏳ Not Started  
**Priority:** 🟢 GREEN  
**Estimated Effort:** 4 hours  

**Implementation Plan:**

**Features**
- Edit button on doctor/user list cards
- Edit modal with fields: name, phone, email, address, is_active
- Bulk edit action for multiple users
- User status toggle (active/inactive)
- Delete user action with confirmation

**Implementation Sequence**
1. Add edit icon button to doctor list cards
2. Create edit user modal component
3. Populate modal with current user data
4. Implement PATCH endpoint for user update
5. Add user status toggle in modal
6. Add delete user action with confirmation
7. Add bulk action checkboxes to cards
8. Implement bulk status change action

**UI Components**
- `components/UserEditModal.tsx` - Edit form modal
- Add edit/delete buttons to existing doctor/admin list cards
- Add checkboxes for bulk actions

**API Endpoints**
- `PATCH /api/admin/users/[id]` - Update user details
- `DELETE /api/admin/users/[id]` - Delete user (soft or hard delete)
- `PATCH /api/admin/users/[id]/status` - Toggle active/inactive

---

### 13. Add Profile Page to Admin and Doctor Portals
**Status:** ⏳ Not Started  
**Priority:** 🟢 GREEN  
**Estimated Effort:** 5 hours  
**Dependencies:** User profile system (already created for patients)

**Implementation Plan:**

**Profile Sections**
- Personal info: Name, email, phone, address, avatar
- Account info: User ID, role, account creation date, last login
- Security: Change password, active sessions
- Preferences: Email notifications, two-factor auth (if implemented)
- Activity: Recent actions, audit log

**Features**
- Edit profile info
- Upload/change avatar
- Change password
- View activity log
- Manage active sessions

**Implementation Sequence**
1. Reuse patient profile page structure for admin/doctor
2. Create `app/admin/profile/page.tsx` and `app/doctor/profile/page.tsx`
3. Implement edit profile form with API endpoint
4. Add avatar upload (reuse patient implementation)
5. Add change password form and endpoint
6. Display account security info
7. Show activity/audit log for user actions
8. Add profile link to portal header/navigation

**UI Components**
- Reuse patient profile components
- `components/EditProfileForm.tsx`
- `components/ChangePasswordForm.tsx`
- `components/ActivityLog.tsx`

**API Endpoints**
- `GET /api/admin/profile` - Get admin profile
- `PATCH /api/admin/profile` - Update admin profile
- `GET /api/doctor/profile` - Get doctor profile
- `PATCH /api/doctor/profile` - Update doctor profile
- `POST /api/users/change-password` - Change password (all roles)

---

## 📋 Implementation Priority Matrix

```
Priority Level | Features | Est. Hours | Dependencies
─────────────────────────────────────────────────────
🔴 CRITICAL   | Doctor Portal Fixes | 8 | None
🟠 HIGH       | Refills | 10 | Doctor Portal
🟠 HIGH       | Store Sales/Clearance | 6 | Inventory
🟠 HIGH       | Audit Logs | 8 | None
🟠 HIGH       | Transaction History | 6 | Payment System
🟡 MEDIUM     | Messaging | 14 | User System
🟡 MEDIUM     | Card Payments | 12 | Payment Gateway
🟡 MEDIUM     | Email Integration | 8 | Email Service
🟢 GREEN      | Prescription Order Type | 8 | Doctor Portal
🟢 GREEN      | Delivery Portal | 16 | Order System
🟢 GREEN      | Refund Status | 3 | Order System
🟢 GREEN      | Edit User Button | 4 | Admin System
🟢 GREEN      | Admin/Doctor Profile | 5 | User System
```

**Total Estimated Effort:** ~108 hours

---

## 🛠️ Technical Patterns & Guidelines

### Applied Patterns for All Features
1. **Service Role Client for Admin Operations** - Use `createClient(SERVICE_ROLE_KEY)` for role verification to bypass RLS
2. **RLS Policies** - Create policies for data isolation by role
3. **API Route Structure** - `/api/[role]/[resource]/route.ts` pattern
4. **Server-Side Rendering** - Use server components for protected pages
5. **Error Handling** - Consistent error responses with status codes
6. **Pagination** - 10-20 items per page for lists
7. **Mobile Responsiveness** - Card-based layouts, responsive grids
8. **Toast Notifications** - User feedback for all actions
9. **Modal Dialogs** - Forms in modals, not full pages
10. **TypeScript** - Strict type checking on all features

### Database Principles
- All new tables include `created_at` and `updated_at` timestamps
- Foreign key relationships to `users(id)` for all user-related records
- RLS policies enabling role-based data access
- Indexes on frequently queried columns
- JSONB for flexible data storage (audit logs, messages)

### API Principles
- Consistent request/response format
- Service role client for authentication/authorization checks
- Proper HTTP status codes (201 for create, 200 for success, 400/403/404 for errors)
- Input validation before database operations
- Error logging to console for debugging

---

## 🎯 Next Steps

1. **Immediate (This Week):**
   - [ ] Fix doctor portal patient linking errors (CRITICAL)
   - [ ] Review all remaining admin endpoints for RLS issues
   - [ ] Implement prescription refills (HIGH priority)

2. **This Sprint:**
   - [ ] Add store sales/clearance category
   - [ ] Implement audit logging system
   - [ ] Add transaction history views

3. **Following Sprint:**
   - [ ] Messaging system
   - [ ] Card payment integration
   - [ ] Email service integration

4. **Later:**
   - [ ] Delivery partner portal
   - [ ] Profile pages for admin/doctor
   - [ ] Remaining features

