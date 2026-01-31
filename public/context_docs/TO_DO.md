# Implementation Roadmap - RoyaltyMeds Platform

**Last Updated:** January 31, 2026  
**Status:** Active Development - Features #2-7 COMPLETE ✅, Feature #8 (Enhanced Auth) PLANNED, Features #10-13 (Inventory Categories) PLANNED, Ready for Deployment  
**Priority:** HIGH

## 🎯 Completion Criteria

**Features are considered FULLY COMPLETE only when:**
✅ Database schema created and migrations applied
✅ API endpoints implemented and tested
✅ UI pages created and integrated with backend
✅ Deployed to production
✅ Documented in TO_DO.md

**Current Status:**
- ✅ **Features #2-7:** COMPLETE - Database + APIs + UI Pages + Deployed to Production ✅
  - Feature #2: Prescription Refills ✅
  - Feature #3: Store Sales/Clearance ✅
  - Feature #4: Audit Logs ✅
  - Feature #5: Transaction History ✅
  - Feature #6: Messaging System ✅
  - Feature #7: Email Integration ✅
- 🔨 **Feature #8:** PLANNED - Enhanced Authentication (Forgot Password, Remember Me, OTC Email Login)
- 🔨 **Feature #9:** PLANNED - Inventory-Linked Prescription Items (OTC & Rx Dropdown Selection)
- 🔨 **Features #10-13:** PLANNED - Inventory Categories (Snacks & Beverages, Fashion, Medical Disposables, Stationery)

**Latest Session Work (Jan 31):**
- ✅ Fixed infinite recursion in doctor_prescriptions RLS policy (migration 20260130000011)
- ✅ Doctor portal prescription display now working
- ✅ Deployed RLS fix to production via Vercel
- ✅ Added 4 new inventory category features to roadmap (#10-13) with full implementation plans
- ✅ All doctor prescription functionality restored and verified working

**Latest Commits:**
- `e291b7a` - Updated TO_DO.md with 4 new inventory category features (#10-13)
- `705d375` - Deploy doctor prescriptions RLS fix to production via Vercel
- `ad7fcb5` - Fix infinite recursion in doctor prescriptions RLS policy - migration 20260130000011

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
**Status:** ✅ FULLY COMPLETED  
**Priority:** 🟠 HIGH  
**Completed:** January 29, 2026
**Total Effort:** 10 hours (backend) + 4 hours (UI) = 14 hours total

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

✅ **UI Pages Implemented**
- RefillRequestModal component for prescription detail page
- Integrated modal with "Request Refill" button on prescription card
- Shows refill count/limit and last refilled date
- GET endpoint: `/api/patient/prescriptions/[id]` for fetching prescription details

**Deployment Details:**
- Database migration applied to Supabase
- All 4 API endpoints deployed and tested
- Fixed TypeScript route validation error (separated PATCH to correct [id] path)
- All UI pages built and ready for production deployment
- Deployed to production: https://royaltymedspharmacy.com

**Commits:**
- `1f404e8` - "Add prescription refills feature with database schema and 3 API endpoints"
- `2109b3c` - "Fix TypeScript validation - move PATCH refill approval to correct endpoint path"
- `b596a88` - "Add comprehensive UI implementations for all 6 backend features"

**Status:** READY FOR PRODUCTION DEPLOYMENT ✅

---

### 3. Store - Sales/Clearance Category
**Status:** ✅ FULLY COMPLETED  
**Priority:** 🟠 HIGH  
**Completed:** January 29, 2026
**Total Effort:** 6 hours (backend) + 4 hours (UI) = 10 hours total  

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

✅ **UI Features Implemented**
- Sale/Clearance filter buttons in store sidebar (All/On Sale/Clearance)
- Sale badges on product cards (✨ ON SALE, 🔥 CLEARANCE)
- Discount percentage display with color highlighting
- Original price strikethrough with sale price comparison
- Updated OTCDrug type to include sale fields
- Store filtering integrated with sale filter

**Deployment Details:**
- All 3 API endpoints deployed and tested
- Endpoints use proper Next.js route structure with correct signatures
- Sales queries optimized with proper indexes
- All UI pages built and ready for production deployment
- Deployed to production: https://royaltymedspharmacy.com

**Commit:** 
- `8d5fb1d` - "Add store sales/clearance feature - database migration and 3 API endpoints"
- `b596a88` - "Add comprehensive UI implementations for all 6 backend features"

**Status:** READY FOR PRODUCTION DEPLOYMENT ✅

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
**Status:** 🔨 IN PROGRESS (Backend ✅, UI In Progress)  
**Priority:** 🟠 HIGH  
**Started:** January 28, 2026
**Estimated Effort:** 8 hours (backend) + 6 hours (UI) = 14 hours total  

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

**Remaining Work (For This Session):**
- ✅ Create admin audit log viewer page with UI
- ✅ Add audit log detail modal showing before/after comparison
- ✅ Implement advanced filtering on admin page
- Add real-time audit log streaming (optional)
- Integration with compliance/security review workflows

---

### 5. Transaction History
**Status:** 🔨 IN PROGRESS (Backend ✅, UI In Progress)  
**Priority:** 🟠 HIGH  
**Started:** January 28, 2026
**Estimated Effort:** 6 hours (backend) + 5 hours (UI) = 11 hours total  

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

**Remaining Work (For This Session):**
- ✅ Patient transaction history UI page
- ✅ Admin transaction dashboard with charts
- Monthly summary reports
- Transaction detail modal
- Refund processing endpoint
- Payment gateway integration for creating transactions

---

### 6. Messaging System
**Status:** 🔨 IN PROGRESS (Backend ✅, UI In Progress)  
**Priority:** 🟡 MEDIUM  
**Started:** January 28, 2026
**Estimated Effort:** 14 hours (backend) + 10 hours (UI) = 24 hours total  

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

**Remaining Work (For This Session):**
- ✅ Messaging UI components (conversation list, message view)
- Real-time message notifications (Supabase Realtime)
- Message search functionality
- File upload for attachments
- Typing indicators
- Message reactions/emojis

---

### 7. Email Integration
**Status:** 🔨 IN PROGRESS (Backend ✅, UI In Progress)  
**Priority:** 🟠 HIGH  
**Started:** January 28, 2026
**Estimated Effort:** 8 hours (backend) + 5 hours (UI) = 13 hours total  

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

**Remaining Work (For This Session):**
- ✅ Email sending via SMTP (Gmail/Google Workspace - DONE)
- ✅ Admin email template manager UI
- ✅ Patient email preferences UI
- Email scheduler for automated sends (e.g., daily reminders)
- Email template preview in admin UI
- Email performance analytics (open/click rates)
- Bulk email campaigns feature
- Email unsubscribe links and management

---

## 🟡 MEDIUM PRIORITY FEATURES

### 8. Enhanced Authentication - Forgot Password, Remember Me, One-Time Code Email Login
**Status:** ⏳ Not Started  
**Priority:** 🟡 MEDIUM  
**Estimated Effort:** 10 hours (backend) + 6 hours (UI) = 16 hours total  

**Implementation Plan:**

**Database Schema**
```sql
-- Add to users table
ALTER TABLE users ADD COLUMN (
  remember_token VARCHAR(255) UNIQUE,
  remember_token_expires_at TIMESTAMP,
  last_login_at TIMESTAMP,
  failed_login_attempts INT DEFAULT 0,
  account_locked_until TIMESTAMP
);

-- Create password reset tokens table
CREATE TABLE password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  token_hash VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now()
);

-- Create one-time login codes table
CREATE TABLE one_time_login_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  code VARCHAR(6) NOT NULL, -- 6-digit code
  code_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  attempts INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_password_reset_user_id ON password_reset_tokens(user_id);
CREATE INDEX idx_password_reset_token_hash ON password_reset_tokens(token_hash);
CREATE INDEX idx_password_reset_expires ON password_reset_tokens(expires_at);
CREATE INDEX idx_otc_user_id ON one_time_login_codes(user_id);
CREATE INDEX idx_otc_code_hash ON one_time_login_codes(code_hash);
CREATE INDEX idx_otc_expires ON one_time_login_codes(expires_at);
```

**Phase 1: Forgot Password (Hours 1-4)**
- Create password reset token generation endpoint
- Store tokens with expiration (24 hours)
- Email password reset link to user
- Validate token and allow password reset
- Implement security: rate limiting, token invalidation after use, account lockout on failed attempts

**Phase 2: One-Time Code Email Login (Hours 5-8)**
- Generate 6-digit OTC codes
- Send codes via email with 10-minute expiration
- Validate code and authenticate user
- Track failed attempts and lock after 5 attempts
- Option to resend code

**Phase 3: Remember Me (Hours 9-16)**
- Generate secure remember tokens
- Store tokens with 30-day expiration
- Auto-login on subsequent visits
- Implement token refresh mechanism
- "Remember me" checkbox on login form
- Secure cookie handling (httpOnly, secure flags)

**Features by Phase:**

**Phase 1 - Forgot Password:**
- User clicks "Forgot Password?" on login
- Enter email address
- Receive password reset email with 24-hour link
- Click link, verify token still valid
- Enter new password (validation: min 8 chars, uppercase, lowercase, number)
- Confirmation email sent
- Old tokens auto-expire after 24 hours
- Tokens marked used and cannot be reused

**Phase 2 - One-Time Code Email Login:**
- User clicks "Login with Email Code" on login
- Enter email address
- Receive 6-digit code via email
- Code expires in 10 minutes
- Enter code in UI
- Max 5 failed attempts → account locked for 15 minutes
- Option to request new code (rate limited to 3 per hour)
- Auto-submit when 6 digits entered (optional UX enhancement)

**Phase 3 - Remember Me:**
- "Remember me for 30 days" checkbox on login
- After login, generate 30-day remember token
- Store in secure, httpOnly cookie
- On page load, check for valid remember token
- Auto-authenticate if token valid and not expired
- Show "You're logged in" banner if auto-authenticated
- Option to "Log out from all devices" clears all tokens for user
- Token refresh on each auto-login (extends 30-day window)

**Implementation Sequence:**

**Phase 1 (Hours 1-4):**
1. Create password_reset_tokens table
2. `POST /api/auth/forgot-password` - Request password reset token
3. `POST /api/auth/reset-password` - Validate token and reset password
4. Create forgot password UI pages
5. Add email template for password reset link
6. Implement rate limiting (5 requests per hour per email)

**Phase 2 (Hours 5-8):**
1. Create one_time_login_codes table
2. `POST /api/auth/request-login-code` - Generate and email OTC
3. `POST /api/auth/verify-login-code` - Verify code and authenticate
4. Create one-time code login UI page
5. Add email template for login code
6. Implement code generation with 6-digit format
7. Implement rate limiting (3 codes per hour per email)

**Phase 3 (Hours 9-16):**
1. Add remember_token columns to users table
2. Modify `POST /api/auth/login` to support remember-me checkbox
3. Create secure cookie handling middleware
4. Implement auto-login on page load
5. `POST /api/auth/logout-all-devices` endpoint
6. Create "Manage Sessions" UI page
7. Add "You're logged in" banner for auto-authenticated sessions
8. Implement token refresh logic

**Security Considerations:**
- ✅ Rate limiting on password reset requests
- ✅ Token hashing in database (never store plain tokens)
- ✅ Short expiration times (24h for reset, 10m for OTC)
- ✅ One-time use enforcement (mark used, prevent replay)
- ✅ Account lockout after failed attempts (5 attempts = 15min lockout)
- ✅ Secure cookies (httpOnly, secure, sameSite flags)
- ✅ Token invalidation on logout
- ✅ Email verification (send code/link to verified email only)
- ✅ CSRF protection on forms
- ✅ Audit logging of authentication attempts

**UI Components:**
- `app/auth/forgot-password/page.tsx` - Request password reset
- `app/auth/reset-password/[token]/page.tsx` - Reset password form
- `app/auth/login-with-code/page.tsx` - Email code login
- `app/auth/verify-code/page.tsx` - Enter 6-digit code
- Modified `app/auth/login/page.tsx` - Add "Remember me" checkbox
- `app/patient/settings/sessions/page.tsx` - Manage active sessions
- `components/AuthGuard.tsx` - Check remember token on app load

**API Endpoints:**
- `POST /api/auth/forgot-password` - Request password reset (public)
- `POST /api/auth/reset-password` - Reset password with token (public)
- `POST /api/auth/request-login-code` - Email login code (public)
- `POST /api/auth/verify-login-code` - Verify code and authenticate (public)
- `POST /api/auth/login` - Modified to support remember-me (public)
- `GET /api/auth/sessions` - List active sessions (authenticated)
- `POST /api/auth/logout-all-devices` - Logout from all devices (authenticated)
- `DELETE /api/auth/sessions/[token]` - Revoke specific session (authenticated)

**Testing Checklist:**
- ✅ Password reset link expires after 24 hours
- ✅ Reset token cannot be reused
- ✅ OTC code expires after 10 minutes
- ✅ OTC code locked after 5 failed attempts
- ✅ Remember me persists for 30 days
- ✅ Auto-login works with valid remember token
- ✅ "Log out all devices" revokes all tokens
- ✅ Rate limiting prevents brute force
- ✅ Email delivery tracking
- ✅ Audit logging for all authentication attempts

**Status:** PLANNED - Ready to implement in next development cycle

---

### 9. Inventory-Linked Prescription Items - OTC & Rx Dropdown Selection
**Status:** ⏳ Not Started  
**Priority:** 🟡 MEDIUM  
**Estimated Effort:** 8 hours (backend) + 6 hours (UI) = 14 hours total  

**Implementation Plan:**

**Database Schema Changes**
```sql
-- Add medication_id columns to prescription_items and doctor_prescriptions_items
ALTER TABLE public.prescription_items
ADD COLUMN IF NOT EXISTS medication_id uuid,
ADD COLUMN IF NOT EXISTS medication_type VARCHAR(20), -- 'otc' or 'prescription'
ADD CONSTRAINT prescription_items_medication_id_fkey 
  FOREIGN KEY (medication_id) REFERENCES public.otc_drugs(id) ON DELETE SET NULL;

ALTER TABLE public.doctor_prescriptions_items
ADD COLUMN IF NOT EXISTS medication_id uuid,
ADD COLUMN IF NOT EXISTS medication_type VARCHAR(20), -- 'otc' or 'prescription'
ADD CONSTRAINT doctor_prescriptions_items_medication_id_fkey 
  FOREIGN KEY (medication_id) REFERENCES public.otc_drugs(id) ON DELETE SET NULL;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_prescription_items_medication_id ON public.prescription_items(medication_id);
CREATE INDEX IF NOT EXISTS idx_doctor_prescriptions_items_medication_id ON public.doctor_prescriptions_items(medication_id);
```

**Phase 1: Inventory API Endpoints (Hours 1-3)**
- Create endpoint to fetch available OTC drugs
- Create endpoint to fetch available prescription drugs
- Filter by search term/name
- Return: id, name, dosage, strength, category

**Phase 2: Update Prescription Upload Forms (Hours 4-6)**
- Modify patient prescription upload form to support dropdown
- Modify doctor prescription upload form to support dropdown
- Show "Manual Entry" vs "Select from Inventory" toggle
- Load inventory items on form mount
- Show auto-populated dosage when item selected

**Phase 3: Database Schema Updates & Migrations (Hours 7-8)**
- Add medication_id and medication_type columns to prescription_items
- Add medication_id and medication_type columns to doctor_prescriptions_items
- Create foreign key constraints to otc_drugs/prescription_drugs tables
- Create performance indexes

**Phase 4: API Updates (Hours 9-11)**
- Modify `POST /api/patient/upload` to support medication_id
- Modify `POST /api/doctor/prescriptions` to support medication_id
- Validate medication_id exists when provided
- Fallback to manual entry if medication_id not provided
- Store both medication_id and medication_name for flexibility

**Phase 5: UI Refinements (Hours 12-14)**
- Add async dropdown component with search/filter
- Show medication details (dosage, strength, category) in dropdown
- Auto-fill dosage when inventory item selected
- Validate quantity and dosage fields
- Clear medication_id if user switches back to manual entry
- Show selected medication info below dropdown

**Implementation Sequence:**

**Phase 1 (Hours 1-3): API Endpoints**
1. `GET /api/inventory/otc-drugs` - List available OTC drugs with pagination
   - Query parameters: search (name filter), limit (20 default), offset (0 default)
   - Returns: id, name, dosage, strength, category, quantity_on_hand
   - Filter out out-of-stock items
   
2. `GET /api/inventory/prescription-drugs` - List available prescription drugs
   - Query parameters: search, limit, offset
   - Returns: id, name, dosage, strength, category, quantity_on_hand
   - Admin/doctor only access

3. `GET /api/inventory/search` - Combined search across both tables
   - Query parameter: q (search term), type (otc/prescription/all)
   - Returns unified results with type indicator

**Phase 2 (Hours 4-6): Form UI Updates**
1. Patient prescription upload form:
   - Add toggle: "Manual Entry" vs "Select from Inventory"
   - When "Select from Inventory": Show dropdown with search
   - When "Manual Entry": Show text fields (current behavior)
   - Auto-fill dosage from selected inventory item
   
2. Doctor prescription upload form:
   - Same toggle and dropdown for each medication row
   - Allow mix of manual and inventory-selected items
   - Show medication details card when inventory item selected

**Phase 3 (Hours 7-8): Database Schema**
1. Create migration: `20260130000008_add_medication_id_to_prescription_items.sql`
   - Add medication_id uuid column
   - Add medication_type varchar(20) column
   - Create FK constraint to otc_drugs table
   - Create indexes for query optimization

2. Create migration: `20260130000009_add_medication_id_to_doctor_prescriptions_items.sql`
   - Same changes as prescription_items

**Phase 4 (Hours 9-11): API Updates**
1. Update `POST /api/patient/upload` endpoint:
   ```typescript
   // Accept both manual entry and medication_id
   body.medications = [
     {
       name: "Aspirin",           // manual
       dosage: "500mg",
       quantity: 30,
       frequency: "twice daily"
     },
     {
       medication_id: "uuid-123", // from inventory
       dosage: "500mg",           // can override
       quantity: 30
     }
   ]
   ```
   - Validate medication_id if provided
   - Use medication name from inventory if not provided manually
   - Store both medication_id and medication_name

2. Update `POST /api/doctor/prescriptions` endpoint:
   - Same logic as patient upload
   - Support medication_id selection
   - Auto-fetch medication details from inventory

**Phase 5 (Hours 12-14): UI Refinements**
1. Create `MedicationSelector` component:
   - Dropdown with search/filter
   - Shows medication name, dosage, strength
   - Displays stock status
   - Auto-fill dosage on select

2. Update prescription forms:
   - Replace text input with MedicationSelector for first selection
   - Keep manual entry as fallback
   - Show medication info card (name, dosage, strength, stock)
   - Add "Edit" button to override auto-filled fields

3. Add validation:
   - Check medication_id exists
   - Verify stock available
   - Validate dosage matches inventory item (optional warning if manual override)

**Benefits**
- ✅ Standardized medication names (reduced typos)
- ✅ Easier medication selection (dropdown vs typing)
- ✅ Auto-population of dosage/strength
- ✅ Stock visibility during prescription creation
- ✅ Inventory integration for better tracking
- ✅ Backward compatible (manual entry still works)
- ✅ Flexible (support mixed manual + inventory selection)

**Tables Involved**
- `prescription_items` - Add medication_id, medication_type columns
- `doctor_prescriptions_items` - Add medication_id, medication_type columns
- `otc_drugs` - Reference via FK constraint
- `prescription_drugs` - Reference via FK constraint (future)

**RLS Considerations**
- Inventory endpoints accessible to authenticated users (doctors, patients)
- Filter out controlled substances from patient view (optional)
- Show stock info only to doctors/admins (optional security)

**Testing Checklist**
- ✅ Dropdown loads OTC items with search
- ✅ Selecting item auto-fills dosage
- ✅ Manual entry still works (backward compatible)
- ✅ Can mix manual and inventory selection
- ✅ Medication_id stored correctly
- ✅ Fallback to medication_name if no medication_id
- ✅ Out-of-stock items filtered from dropdown
- ✅ Search filters work correctly
- ✅ Pagination works for large inventories
- ✅ Medication details display correctly

**Status:** PLANNED - Ready for implementation after Enhanced Authentication feature

---

### 10. Inventory Category - Snacks & Beverages
**Status:** ⏳ Not Started  
**Priority:** 🟡 MEDIUM  
**Estimated Effort:** 4 hours (backend) + 3 hours (UI) = 7 hours total  

**Implementation Plan:**

**Database Schema Changes**
```sql
-- Create snacks_beverages table
CREATE TABLE snacks_beverages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  brand VARCHAR(100),
  category VARCHAR(50), -- juice, water, sports_drink, snack, energy_bar, protein_snack
  quantity INT NOT NULL DEFAULT 0,
  unit_price DECIMAL(10, 2) NOT NULL,
  sale_price DECIMAL(10, 2),
  category_type VARCHAR(20) DEFAULT 'regular', -- regular/sale/clearance
  is_on_sale BOOLEAN DEFAULT FALSE,
  expiry_date TIMESTAMP,
  sku VARCHAR(50) UNIQUE,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_snacks_beverages_category ON snacks_beverages(category);
CREATE INDEX idx_snacks_beverages_on_sale ON snacks_beverages(is_on_sale);
CREATE INDEX idx_snacks_beverages_sku ON snacks_beverages(sku);

-- Add RLS policies
ALTER TABLE snacks_beverages ENABLE ROW LEVEL SECURITY;
CREATE POLICY snacks_beverages_select ON snacks_beverages FOR SELECT USING (true);
CREATE POLICY snacks_beverages_insert ON snacks_beverages FOR INSERT WITH CHECK ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');
CREATE POLICY snacks_beverages_update ON snacks_beverages FOR UPDATE USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');
```

**API Endpoints (3 endpoints)**
1. `GET /api/store/snacks-beverages` - List snacks & beverages with pagination
   - Query parameters: category, search, is_on_sale, limit, offset
   - Returns items with pricing and availability
   
2. `PATCH /api/admin/inventory/snacks-beverages/[id]` - Update individual item
   - Admin only: update price, quantity, sale status
   - Returns updated item
   
3. `POST /api/admin/inventory/snacks-beverages/bulk` - Bulk import/update items
   - Support CSV import of multiple items
   - Upsert by SKU if provided

**UI Features**
- Add "Snacks & Beverages" category filter in store
- Product cards with expiry date indicator if applicable
- Category-specific filtering (Juice, Water, Sports Drink, Snacks, Energy Bars, etc.)
- Quantity and "Add to Cart" functionality

**Migration**
- Create migration: `20260131000001_create_snacks_beverages_table.sql`

**Status:** READY FOR IMPLEMENTATION

---

### 11. Inventory Category - Fashion
**Status:** ⏳ Not Started  
**Priority:** 🟡 MEDIUM  
**Estimated Effort:** 5 hours (backend) + 4 hours (UI) = 9 hours total  

**Implementation Plan:**

**Database Schema Changes**
```sql
-- Create fashion table
CREATE TABLE fashion (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  brand VARCHAR(100),
  category VARCHAR(50), -- t_shirt, pants, jacket, shoes, accessories, activewear
  size VARCHAR(20), -- XS, S, M, L, XL, XXL, One Size
  color VARCHAR(50),
  quantity INT NOT NULL DEFAULT 0,
  unit_price DECIMAL(10, 2) NOT NULL,
  sale_price DECIMAL(10, 2),
  category_type VARCHAR(20) DEFAULT 'regular', -- regular/sale/clearance
  is_on_sale BOOLEAN DEFAULT FALSE,
  size_chart_url VARCHAR(500),
  sku VARCHAR(50) UNIQUE,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_fashion_category ON fashion(category);
CREATE INDEX idx_fashion_size ON fashion(size);
CREATE INDEX idx_fashion_on_sale ON fashion(is_on_sale);
CREATE INDEX idx_fashion_sku ON fashion(sku);

-- Add RLS policies
ALTER TABLE fashion ENABLE ROW LEVEL SECURITY;
CREATE POLICY fashion_select ON fashion FOR SELECT USING (true);
CREATE POLICY fashion_insert ON fashion FOR INSERT WITH CHECK ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');
CREATE POLICY fashion_update ON fashion FOR UPDATE USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');
```

**API Endpoints (3 endpoints)**
1. `GET /api/store/fashion` - List fashion items with pagination
   - Query parameters: category, size, color, search, is_on_sale, limit, offset
   - Returns items with all attributes
   
2. `PATCH /api/admin/inventory/fashion/[id]` - Update individual item
   - Admin only: update price, size, quantity, sale status
   - Returns updated item
   
3. `POST /api/admin/inventory/fashion/bulk` - Bulk import/update items
   - Support CSV import for multiple sizes/colors of same item
   - Upsert by SKU

**UI Features**
- Add "Fashion" category filter in store
- Product cards with size and color options
- Size guide modal linked from product page
- Category-specific filtering (T-Shirts, Pants, Jackets, Shoes, Accessories, Activewear)
- Size selector with quantity for multi-size selection
- Color options display with visual indicators

**Migration**
- Create migration: `20260131000002_create_fashion_table.sql`

**Status:** READY FOR IMPLEMENTATION

---

### 12. Inventory Category - Medical Disposables
**Status:** ⏳ Not Started  
**Priority:** 🟡 MEDIUM  
**Estimated Effort:** 5 hours (backend) + 4 hours (UI) = 9 hours total  

**Implementation Plan:**

**Database Schema Changes**
```sql
-- Create medical_disposables table
CREATE TABLE medical_disposables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  brand VARCHAR(100),
  category VARCHAR(50), -- masks, gloves, bandages, syringes, needles, thermometers, pulse_oximeters
  unit_type VARCHAR(30), -- box, pack, piece, piece_per_box
  unit_quantity INT, -- number of items per unit
  quantity INT NOT NULL DEFAULT 0, -- total units available
  unit_price DECIMAL(10, 2) NOT NULL,
  sale_price DECIMAL(10, 2),
  category_type VARCHAR(20) DEFAULT 'regular', -- regular/sale/clearance
  is_on_sale BOOLEAN DEFAULT FALSE,
  expiry_date TIMESTAMP,
  certification VARCHAR(100), -- FDA, CE, ISO, etc.
  reorder_level INT DEFAULT 50,
  sku VARCHAR(50) UNIQUE,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_medical_disposables_category ON medical_disposables(category);
CREATE INDEX idx_medical_disposables_on_sale ON medical_disposables(is_on_sale);
CREATE INDEX idx_medical_disposables_reorder ON medical_disposables(quantity);
CREATE INDEX idx_medical_disposables_sku ON medical_disposables(sku);

-- Add RLS policies
ALTER TABLE medical_disposables ENABLE ROW LEVEL SECURITY;
CREATE POLICY medical_disposables_select ON medical_disposables FOR SELECT USING (true);
CREATE POLICY medical_disposables_insert ON medical_disposables FOR INSERT WITH CHECK ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');
CREATE POLICY medical_disposables_update ON medical_disposables FOR UPDATE USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');
```

**API Endpoints (3 endpoints)**
1. `GET /api/store/medical-disposables` - List medical disposables with pagination
   - Query parameters: category, search, certification, is_on_sale, limit, offset
   - Returns items with unit info and expiry dates
   
2. `PATCH /api/admin/inventory/medical-disposables/[id]` - Update individual item
   - Admin only: update price, quantity, reorder level, certification
   - Returns updated item
   
3. `POST /api/admin/inventory/medical-disposables/bulk` - Bulk import/update items
   - Support CSV import for inventory management
   - Upsert by SKU

**UI Features**
- Add "Medical Disposables" category filter in store
- Product cards with certification badges (FDA, CE, ISO)
- Category-specific filtering (Masks, Gloves, Bandages, Syringes, Needles, Thermometers, etc.)
- Unit quantity display and ordering (box of 50, pack of 10, single)
- Expiry date alerts for items close to expiration
- Low stock warnings for items below reorder level

**Migration**
- Create migration: `20260131000003_create_medical_disposables_table.sql`

**Status:** READY FOR IMPLEMENTATION

---

### 13. Inventory Category - Stationery
**Status:** ⏳ Not Started  
**Priority:** 🟡 MEDIUM  
**Estimated Effort:** 4 hours (backend) + 3 hours (UI) = 7 hours total  

**Implementation Plan:**

**Database Schema Changes**
```sql
-- Create stationery table
CREATE TABLE stationery (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  brand VARCHAR(100),
  category VARCHAR(50), -- paper, pen, notebook, binder, clipboard, organizer, desk_accessory
  size VARCHAR(50), -- A4, A3, Letter, etc.
  color VARCHAR(50),
  quantity INT NOT NULL DEFAULT 0, -- number of units
  unit_price DECIMAL(10, 2) NOT NULL,
  sale_price DECIMAL(10, 2),
  category_type VARCHAR(20) DEFAULT 'regular', -- regular/sale/clearance
  is_on_sale BOOLEAN DEFAULT FALSE,
  sku VARCHAR(50) UNIQUE,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_stationery_category ON stationery(category);
CREATE INDEX idx_stationery_size ON stationery(size);
CREATE INDEX idx_stationery_on_sale ON stationery(is_on_sale);
CREATE INDEX idx_stationery_sku ON stationery(sku);

-- Add RLS policies
ALTER TABLE stationery ENABLE ROW LEVEL SECURITY;
CREATE POLICY stationery_select ON stationery FOR SELECT USING (true);
CREATE POLICY stationery_insert ON stationery FOR INSERT WITH CHECK ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');
CREATE POLICY stationery_update ON stationery FOR UPDATE USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');
```

**API Endpoints (3 endpoints)**
1. `GET /api/store/stationery` - List stationery items with pagination
   - Query parameters: category, size, color, search, is_on_sale, limit, offset
   - Returns items with all attributes
   
2. `PATCH /api/admin/inventory/stationery/[id]` - Update individual item
   - Admin only: update price, quantity, sale status
   - Returns updated item
   
3. `POST /api/admin/inventory/stationery/bulk` - Bulk import/update items
   - Support CSV import for bulk stationery orders
   - Upsert by SKU

**UI Features**
- Add "Stationery" category filter in store
- Product cards with size and color options
- Category-specific filtering (Paper, Pens, Notebooks, Binders, Clipboards, Organizers, Desk Accessories)
- Color swatches for visual selection
- Quantity input for bulk purchases
- Bundle suggestions (e.g., "Complete Desk Set")

**Migration**
- Create migration: `20260131000004_create_stationery_table.sql`

**Status:** READY FOR IMPLEMENTATION

---

### 11. Messaging System
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

### 12. Card Payments Integration
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

### 13. Email Integration (Setup)
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

### 14. Prescription Order Type (Non-OTC Products)
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

### 13. Delivery Partner Portal
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

### 14. Add Refund Order Status
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

### 15. Add Edit User Button to Doctor/Admin Lists
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

### 16. Add Profile Page to Admin and Doctor Portals
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

