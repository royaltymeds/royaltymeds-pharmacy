# Implementation Roadmap - RoyaltyMeds Platform

**Last Updated:** January 28, 2026  
**Status:** Active Development  
**Priority:** HIGH

---

## 🔴 CRITICAL ISSUES (Blocking Features)

### 1. Doctor Portal - Patient Linking & Prescription Uploads
**Status:** ❌ In Progress (Currently Facing Errors)  
**Priority:** 🔴 CRITICAL  
**Estimated Effort:** 8 hours  

**Current Issue:**
- Patient linking mechanism experiencing errors during doctor-patient association
- Prescription upload form validation/submission failures
- RLS policy conflicts similar to those fixed in prescription endpoints (Jan 28)

**Implementation Plan:**

**Step 1: Diagnose Patient Linking Errors**
- Review doctor-patient relationship table queries
- Check if doctor account creation properly sets up doctor_patient_links
- Audit RLS policies on doctor_patient_links table (similar to prescription items fix)
- Verify service role client is used for role checks in `/api/doctor/[resource]` endpoints

**Step 2: Fix RLS in Doctor Endpoints**
- File: `app/api/doctor/patients/route.ts` - ensure service role used for role verification
- File: `app/api/doctor/prescriptions/route.ts` - apply same RLS bypass pattern
- Pattern: Move `createClient(SERVICE_ROLE_KEY)` before role checks
- Test: Verify doctor can see assigned patients and upload prescriptions

**Step 3: Validate Prescription Upload Form**
- Check required field validation (medication details, prescription file)
- Ensure prescription_items table receives data correctly
- Add error logging to diagnose form submission issues
- Implement proper error messages to UI

**Step 4: Test Complete Workflow**
- Doctor login → patient linking
- Patient linking → prescription visibility
- Prescription upload → file storage in Supabase bucket
- Prescription viewing in patient portal

**Database Tables Affected:**
- `doctor_patient_links` (relationship table)
- `prescriptions` (prescription records)
- `prescription_items` (medication details)
- `storage.prescriptions` (file bucket)

**API Endpoints to Review:**
- `/api/doctor/patients` - GET (list), POST (link patient)
- `/api/doctor/prescriptions` - POST (upload), GET (list)
- `/api/doctor/patients/[patient-id]/prescriptions` - GET (patient-specific)

**UI Components:**
- `app/doctor/patients/page.tsx` - patient list with link modal
- `app/doctor/prescriptions/page.tsx` - upload form and list
- `app/doctor/patients/[patient-id]/page.tsx` - patient detail with history

---

## 🟠 HIGH PRIORITY FEATURES

### 2. Prescription Refills
**Status:** ⏳ Not Started  
**Priority:** 🟠 HIGH  
**Estimated Effort:** 10 hours  
**Dependencies:** Doctor Portal working

**Implementation Plan:**

**Database Schema**
```sql
-- Add to prescriptions table
ALTER TABLE prescriptions ADD COLUMN (
  refill_count INT DEFAULT 0,
  refill_limit INT DEFAULT 5,
  last_refilled_at TIMESTAMP
);

-- Create refill_requests table
CREATE TABLE refill_requests (
  id UUID PRIMARY KEY,
  prescription_id UUID REFERENCES prescriptions(id),
  patient_id UUID REFERENCES users(id),
  requested_at TIMESTAMP DEFAULT now(),
  approved_at TIMESTAMP,
  approved_by UUID REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected, fulfilled
  notes TEXT
);
```

**API Endpoints**
- `POST /api/patient/prescriptions/[id]/request-refill` - Patient requests refill
- `GET /api/admin/refill-requests` - List pending refill requests
- `PATCH /api/admin/refill-requests/[id]` - Approve/reject refill
- `POST /api/admin/prescriptions/[id]/process-refill` - Pharmacist fulfills refill

**Implementation Sequence**
1. Add refill columns and table to database migrations
2. Create RLS policies for refill_requests (patient can view own, admin can manage all)
3. Implement refill request UI in patient prescription detail
4. Add refill management to admin prescriptions page
5. Update prescription status workflow to include "refill_pending" and "refilled"
6. Add refill history to prescription detail views
7. Email notification when refill approved/rejected

**UI Components**
- Patient: "Request Refill" button in prescription detail
- Patient: Refill request status in prescription list
- Admin: Refill requests queue/dashboard
- Admin: Approve/reject refill modal with notes

---

### 3. Store - Sales/Clearance Category
**Status:** ⏳ Not Started  
**Priority:** 🟠 HIGH  
**Estimated Effort:** 6 hours  
**Dependencies:** Inventory system (completed)

**Implementation Plan:**

**Database Schema**
```sql
-- Add to inventory table
ALTER TABLE inventory ADD COLUMN (
  category VARCHAR(50) DEFAULT 'regular', -- regular, sale, clearance
  sale_price DECIMAL(10,2),
  sale_discount_percent INT,
  sale_start_date TIMESTAMP,
  sale_end_date TIMESTAMP,
  is_on_sale BOOLEAN GENERATED ALWAYS AS (
    category = 'sale' AND sale_start_date <= now() AND now() <= sale_end_date
  ) STORED
);
```

**Admin Features**
- Edit inventory modal: Add "Sale/Clearance" dropdown selector
- Set sale price and discount percentage
- Set sale date range with calendar picker
- Filter inventory by sale status
- Auto-expire sales after end date
- Bulk actions: "Mark as Clearance", "Apply Sale", "Clear Sale"

**Store Features**
- Filter/sort products by "Sale/Clearance" category
- Badge on product cards showing discount percentage
- Highlight sale items with visual styling (border, background)
- Filter sidebar: "Sale Items", "Clearance"
- Sale countdown timer for limited-time offers

**Implementation Sequence**
1. Add inventory columns and auto-calculation trigger
2. Create admin inventory edit UI for sale management
3. Update store query to fetch and filter sale items
4. Add sale badge and visual styling to product cards
5. Implement sale filter/sort in store sidebar
6. Add auto-expiration logic (scheduled job or realtime check)

**API Endpoints**
- `PATCH /api/admin/inventory/[id]` - Update sale status (already exists)
- Add `sale_category`, `sale_price`, `sale_discount_percent`, `sale_date_range` to body

---

### 4. Audit Logs
**Status:** ⏳ Not Started  
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

**Admin Features**
- Audit log viewer page with pagination (20 items/page)
- Filters: User, Resource Type, Date Range, Action
- Detail modal: Before/after JSON view, user info, timestamp
- Search by resource ID or user email
- Export selected logs as CSV

**API Endpoints**
- `GET /api/admin/audit-logs` - List audit logs with filters
- `GET /api/admin/audit-logs/[id]` - Get audit log detail
- `POST /api/admin/audit-logs/export` - Export filtered logs

---

### 5. Transaction History
**Status:** ⏳ Not Started  
**Priority:** 🟠 HIGH  
**Estimated Effort:** 6 hours  

**Implementation Plan:**

**Database Schema**
```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id),
  user_id UUID REFERENCES users(id),
  type VARCHAR(20), -- 'payment', 'refund', 'adjustment'
  method VARCHAR(50), -- 'card', 'bank_transfer', 'cash', 'insurance'
  amount DECIMAL(10,2),
  status VARCHAR(20), -- 'pending', 'completed', 'failed'
  reference_id VARCHAR(100), -- External payment gateway reference
  description TEXT,
  created_at TIMESTAMP DEFAULT now(),
  completed_at TIMESTAMP
);

-- Add to orders table
ALTER TABLE orders ADD COLUMN transaction_id UUID REFERENCES transactions(id);
```

**Patient Features**
- Transaction history page in patient portal
- List view: Date, Description, Amount, Status (with badge colors)
- Filters: Date range, Transaction type, Status
- Sort: Newest/oldest, Amount (high/low)
- Detail modal: Full transaction details, receipt if available

**Admin Features**
- View all transactions dashboard
- Filter by user, date range, type, status
- Refund action for completed transactions
- Export transaction report (CSV)
- Monthly transaction summary

**Implementation Sequence**
1. Create transactions table
2. Update order payment endpoints to log transactions
3. Create patient transaction history page
4. Add transaction detail modal
5. Create admin transaction dashboard
6. Implement transaction filtering and export

**UI Components**
- `app/patient/transactions/page.tsx` - Transaction list
- `app/admin/transactions/page.tsx` - Transaction dashboard
- `components/TransactionDetail.tsx` - Detail modal
- `components/TransactionFilters.tsx` - Filter sidebar

**API Endpoints**
- `GET /api/patient/transactions` - Patient's transaction history
- `GET /api/admin/transactions` - All transactions (with filters)
- `GET /api/admin/transactions/[id]` - Transaction detail
- `POST /api/admin/transactions/[id]/refund` - Process refund

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

