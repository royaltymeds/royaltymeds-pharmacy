# RoyaltyMeds Prescription Platform - App Functionality Index

**Version:** 1.0.0  
**Stack:** Next.js 15 (App Router), React 19, TypeScript, Supabase, Tailwind CSS  
**Last Updated:** January 18, 2026

---

## Table of Contents

1. [Authentication & Authorization](#authentication--authorization)
2. [Layout & Navigation](#layout--navigation)
3. [Pages & Routes](#pages--routes)
4. [API Routes](#api-routes)
5. [Components](#components)
6. [Utility Functions & Services](#utility-functions--services)
7. [Database Operations](#database-operations)
8. [File Management](#file-management)

---

## Authentication & Authorization

### Overview
The application implements role-based authentication using Supabase with three user roles: `patient`, `doctor`, and `admin`. Session management uses cookies for server-side authentication and client-side session handling.

### Core Authentication Files

#### [lib/auth.ts](../../lib/auth.ts)
**Purpose:** Server-side authentication utilities for async Server Components and Server Actions.

**Key Functions:**

- `getUser()` - Lines 20-35
  - Retrieves current authenticated user without redirecting
  - Returns `null` if not authenticated
  - Used in protected components where graceful fallback is needed
  ```typescript
  export async function getUser() {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;
    return user;
  }
  ```

- `requireAuth()` - Lines 39+
  - Forces authentication by redirecting to login if not authenticated
  - Use at the top of protected Server Components
  - Guarantees user exists in component

#### [lib/auth-admin.ts](../../lib/auth-admin.ts)
**Purpose:** Admin API utilities for creating authentication users with elevated privileges.

**Key Functions:**

- `createAuthUser(email, password)` - Lines 8-27
  - Creates auth user directly using admin API
  - Auto-confirms email (for development)
  - Uses Supabase service role key for direct user creation
  ```typescript
  export async function createAuthUser(email: string, password: string) {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    return data.user;
  }
  ```

#### [lib/supabase-client.ts](../../lib/supabase-client.ts)
**Purpose:** Browser-side Supabase client initialization with singleton pattern.

**Implementation:**
- Lines 1-12: Singleton pattern ensures one client instance
- Uses `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Safe for use in Client Components

#### [lib/supabase-server.ts](../../lib/supabase-server.ts)
**Purpose:** Server-side Supabase client factory for server components and route handlers.

**Key Functions:**

- `createServerSupabaseClient()` - Lines 4-22
  - Creates SSR-compatible server client
  - Manages cookies for session persistence
  - Used in server components and route handlers

- `getUser()` - Lines 24-34
  - Server-side wrapper to get authenticated user

- `getUserWithRole()` - Lines 36-55
  - Gets user and their role from database
  - Joins with users table to fetch role information

### Authentication API Routes

#### [app/api/auth/login/route.ts](../../app/api/auth/login/route.ts)
**Purpose:** Email/password login endpoint.

**Functionality:**
- Lines 8-13: Validates email and password input
- Lines 17-24: Uses anon client to sign in with password
- Lines 47-63: Determines user role from metadata or database users table
- Returns: `{ success: true, role: "patient|doctor|admin" }`

#### [app/api/auth/signup/route.ts](../../app/api/auth/signup/route.ts)
**Purpose:** User registration endpoint using service role key.

**Functionality:**
- Lines 9-46: Admin API client setup with service role key
- Lines 47+: Creates auth user directly with auto-confirmed email
- Includes comprehensive logging for debugging

#### [app/api/auth/logout/route.ts](../../app/api/auth/logout/route.ts)
**Purpose:** Clears authentication session.

#### [app/api/auth/callback/route.ts](../../app/api/auth/callback/route.ts)
**Purpose:** Handles OAuth callbacks and session initialization.

### Client-Side Authentication Components

#### [components/auth/LoginForm.tsx](../../components/auth/LoginForm.tsx)
**Purpose:** Reusable login form component for authentication.

**Key Features:**
- Lines 18-28: State management (email, password, loading, error)
- Lines 31-68: Login handler with Supabase auth
- Lines 70-88: Role-based redirect logic:
  - Doctors → `/doctor/dashboard`
  - Admins → `/admin/dashboard`
  - Patients → `/patient/home`
- Lines 90-92: 200ms delay to ensure session cookies sync
- Lines 110+: Form UI with validation feedback

#### [components/auth/AuthGuard.tsx](../../components/auth/AuthGuard.tsx)
**Purpose:** Wrapper component ensuring protected routes only render for authenticated users.

**Implementation:**
- Lines 29-52: Session check with retry logic
- Lines 30: Checks for recent auth (within 10 seconds)
- Lines 37-52: Up to 3 retry attempts for StackBlitz compatibility
- Lines 54-70: Renders loading state while verifying auth
- Lines 72: Redirects to `/login` if no session found

#### [components/auth/SignupForm.tsx](../../components/auth/SignupForm.tsx)
**Purpose:** User registration form with role selection.

---

## Layout & Navigation

### Root Layout

#### [app/layout.tsx](../../app/layout.tsx)
**Purpose:** Root application layout wrapping all pages.

**Features:**
- Lines 1-4: Global CSS and Sonner toast provider
- Lines 6-9: Next.js metadata configuration
- Lines 11-24: HTML structure with Toaster component for notifications

### Admin Layout

#### [app/admin/layout.tsx](../../app/admin/layout.tsx)
**Purpose:** Wrapper layout for all admin routes with authentication and navigation.

**Features:**
- Lines 22-28: Server-side authentication check - redirects to login if unauthenticated
- Lines 30-47: Navigation sidebar with links to:
  - Dashboard
  - Prescriptions
  - Orders
  - Refills
  - Doctors
  - Pharmacists (Users)
- Lines 51+: Sticky header with brand, user email, and logout button
- Color scheme: Green (#16a34a)

### Doctor Layout

#### [app/doctor/layout.tsx](../../app/doctor/layout.tsx)
**Purpose:** Doctor portal layout with role-specific navigation.

**Features:**
- Lines 22-28: Server authentication check
- Lines 30-47: Navigation with:
  - Dashboard
  - Submit Rx (Prescription)
  - My Prescriptions
  - Patients
- Color scheme: Blue (#0284c7)

### Patient Layout

#### [app/patient/layout.tsx](../../app/patient/layout.tsx)
**Purpose:** Patient portal layout with customer-facing navigation.

**Features:**
- Lines 22-25: Server authentication check with logging
- Lines 29-40: Navigation with:
  - Dashboard/Home
  - Prescriptions
  - Orders
  - Refills
  - Messages
- Color scheme: Green (#15803d)
- Responsive design with mobile-friendly collapsing nav

---

## Pages & Routes

### Public Pages

#### [app/page.tsx](../../app/page.tsx) - Landing Page
**Purpose:** Public-facing homepage with features and call-to-action.

**Sections:**
- Header with navigation to Features, How It Works, and Portal Login
- Hero section with main value proposition
- Features section highlighting key benefits
- How it works explanatory section
- Testimonials/social proof
- Footer with contact information

### Admin Pages

#### [app/admin/page.tsx](../../app/admin/page.tsx)
**Purpose:** Redirect router page.
- Lines 3: Redirects to `/admin/dashboard`

#### [app/admin/dashboard/page.tsx](../../app/admin/dashboard/page.tsx)
**Purpose:** Admin dashboard with statistics and quick access.

**Features:**
- Lines 17-36: Loads dashboard data via `/api/admin/dashboard`
- Displays statistics cards:
  - Pending prescriptions (yellow border)
  - Approved prescriptions (green border)
  - Processing orders (blue border)
  - Pending refills (orange border)
- Lines 39+: Pending prescriptions quick-access table
- Links to detail pages for each section

#### [app/admin/prescriptions/page.tsx](../../app/admin/prescriptions/page.tsx)
**Purpose:** Prescription management for admins.

**Features:**
- Fetches all prescriptions from `/api/admin/prescriptions`
- Displays table with columns: ID, Patient, Status, Submitted Date, Actions
- Status color coding:
  - Pending (yellow)
  - Approved (green)
  - Rejected (red)
- Status icons for quick visual reference
- Responsive table for mobile devices

#### [app/admin/orders/page.tsx]
**Purpose:** Order management interface.

#### [app/admin/refills/page.tsx]
**Purpose:** Refill request management.

#### [app/admin/doctors/page.tsx]
**Purpose:** Doctor management and listing.

#### [app/admin/users/page.tsx]
**Purpose:** Pharmacist user management.

### Doctor Pages

#### [app/doctor/dashboard/page.tsx]
**Purpose:** Doctor's main dashboard showing patient list and recent prescriptions.

#### [app/doctor/submit-prescription/page.tsx](../../app/doctor/submit-prescription/page.tsx)
**Purpose:** Form for doctors to submit prescriptions to patients.

**Features:**
- Lines 12-15: Dynamic medication list (can add/remove medications)
- Lines 37-46: Patient search functionality with email autocomplete
- Lines 48-54: Select patient from search results
- Medication fields: name, dosage, quantity, frequency
- Prescription details: duration, instructions, notes
- File upload capability for prescription document
- Lines 70+: Submit handler with validation and error handling

#### [app/doctor/my-prescriptions/page.tsx]
**Purpose:** View all prescriptions submitted by the doctor.

#### [app/doctor/patients/page.tsx]
**Purpose:** View patients assigned to the doctor.

### Patient Pages

#### [app/patient/home/page.tsx](../../app/patient/home/page.tsx)
**Purpose:** Patient dashboard with prescriptions and orders overview.

**Features:**
- Server-side data fetching with `getDashboardData()` - Lines 8-46:
  - User profile
  - Active/approved prescriptions (last 3)
  - Pending prescriptions
  - Recent orders (last 3)
  - Pending refill requests (last 3)
- Passes data to client component `PatientDashboardClient`
- Dynamic import ensures data freshness

#### [app/patient/prescriptions/page.tsx]
**Purpose:** View all prescriptions with status tracking.

#### [app/patient/orders/page.tsx]
**Purpose:** View and manage prescription orders.

#### [app/patient/refills/page.tsx]
**Purpose:** Request and track prescription refills.

#### [app/patient/messages/page.tsx]
**Purpose:** Communication with doctors and pharmacy.

#### [app/profile/page.tsx]
**Purpose:** User profile management and settings.

---

## API Routes

### Authentication API Routes

Located in `app/api/auth/`

#### POST `/api/auth/login`
- **File:** [app/api/auth/login/route.ts](../../app/api/auth/login/route.ts)
- **Input:** `{ email: string, password: string }`
- **Output:** `{ success: true, role: "patient|doctor|admin" }`
- **Authentication:** Uses anon key client with password auth

#### POST `/api/auth/signup`
- **File:** [app/api/auth/signup/route.ts](../../app/api/auth/signup/route.ts)
- **Input:** `{ email: string, password: string }`
- **Output:** User object with ID and email
- **Authentication:** Uses service role key for user creation

#### POST `/api/auth/logout`
- **File:** [app/api/auth/logout/route.ts](../../app/api/auth/logout/route.ts)
- **Purpose:** Invalidates session

#### POST `/api/auth/callback`
- **File:** [app/api/auth/callback/route.ts](../../app/api/auth/callback/route.ts)
- **Purpose:** OAuth redirect handler

### Admin API Routes

Located in `app/api/admin/`

#### GET `/api/admin/dashboard`
- **File:** [app/api/admin/dashboard/route.ts](../../app/api/admin/dashboard/route.ts)
- **Purpose:** Fetch dashboard statistics and pending prescriptions
- **Output:**
  ```json
  {
    "prescriptionStats": { "pending": 5, "approved": 12, "rejected": 2, "total": 19 },
    "orderStats": { "pending": 3, "processing": 7, "delivered": 45, "total": 55 },
    "refillStats": { "pending": 2 },
    "pendingPrescriptions": []
  }
  ```

#### GET `/api/admin/prescriptions`
- **File:** [app/api/admin/prescriptions/route.ts](../../app/api/admin/prescriptions/route.ts)
- **Purpose:** Fetch all prescriptions with patient details
- **Features:**
  - Lines 23-37: Auth check and admin role verification
  - Lines 39-46: Fetches prescriptions with patient info via relations
  - Lines 49-73: Generates signed URLs for file access (1 hour expiration)
  - Uses service role key to bypass RLS

#### GET `/api/admin/orders`
- **File:** [app/api/admin/orders/route.ts](../../app/api/admin/orders/route.ts)
- **Purpose:** Fetch all orders with related information
- **Features:**
  - Admin role verification
  - Fetches orders with patient and prescription details

#### GET `/api/admin/refills`
- **File:** [app/api/admin/refills/route.ts](../../app/api/admin/refills/route.ts)
- **Purpose:** Fetch all refill requests
- **Features:**
  - Fetches refills with patient and prescription medication info

#### POST `/api/admin/create-doctor`
- **File:** [app/api/admin/create-doctor/route.ts](../../app/api/admin/create-doctor/route.ts)
- **Purpose:** Create new doctor user (admin only)

#### POST `/api/admin/create-user`
- **File:** [app/api/admin/create-user/route.ts](../../app/api/admin/create-user/route.ts)
- **Purpose:** Create pharmacist user (admin only)

### Doctor API Routes

Located in `app/api/doctor/`

#### GET `/api/doctor/prescriptions`
- **File:** [app/api/doctor/prescriptions/route.ts](../../app/api/doctor/prescriptions/route.ts)
- **Purpose:** Fetch prescriptions submitted by authenticated doctor
- **Features:**
  - Lines 8-38: Auth check and query setup
  - Lines 40-43: Optional status filtering (pending, approved, rejected, all)
  - Lines 45-70: Formats response with camelCase fields
  - Returns prescriptions with: id, patientId, medicationName, dosage, quantity, frequency, duration, instructions, notes, status, createdAt

#### POST `/api/doctor/prescriptions`
- **File:** [app/api/doctor/prescriptions/route.ts](../../app/api/doctor/prescriptions/route.ts#L70)
- **Purpose:** Create new prescription record
- **Input:** Medications array with doctor ID and patient ID

#### GET `/api/doctor/patients`
- **File:** [app/api/doctor/patients/route.ts](../../app/api/doctor/patients/route.ts)
- **Purpose:** Search and list doctor's patients
- **Query Parameters:** `search` - email search string
- **Features:** Searches patients by email for autocomplete

#### GET `/api/doctor/stats`
- **File:** [app/api/doctor/stats/route.ts](../../app/api/doctor/stats/route.ts)
- **Purpose:** Fetch doctor's statistics and metrics

### Patient API Routes

Located in `app/api/patient/`

#### GET `/api/patient/prescriptions`
- **File:** [app/api/patient/prescriptions/route.ts](../../app/api/patient/prescriptions/route.ts)
- **Purpose:** Fetch patient's prescriptions with file access
- **Features:**
  - Lines 8-33: Auth check
  - Lines 35-39: Fetches prescriptions for authenticated patient
  - Lines 42-73: Generates signed URLs for prescription file downloads (1 hour expiration)
  - Handles file path extraction from storage URLs

#### POST `/api/patient/prescriptions`
- **File:** [app/api/patient/prescriptions/route.ts](../../app/api/patient/prescriptions/route.ts#L76)
- **Purpose:** Create prescription record for patient

#### GET `/api/patient/orders`
- **File:** [app/api/patient/orders/route.ts](../../app/api/patient/orders/route.ts)
- **Purpose:** Fetch patient's orders

#### POST `/api/patient/orders`
- **File:** [app/api/patient/orders/route.ts](../../app/api/patient/orders/route.ts)
- **Purpose:** Create new order from prescription

#### GET `/api/patient/refills`
- **File:** [app/api/patient/refills/route.ts](../../app/api/patient/refills/route.ts)
- **Purpose:** Fetch patient's refill requests

#### POST `/api/patient/refills`
- **File:** [app/api/patient/refills/route.ts](../../app/api/patient/refills/route.ts)
- **Purpose:** Create refill request

#### POST `/api/patient/upload`
- **File:** [app/api/patient/upload/route.ts](../../app/api/patient/upload/route.ts)
- **Purpose:** Upload prescription files to Supabase storage

### Setup & Debug API Routes

Located in `app/api/setup/` and `app/api/debug/`

#### POST `/api/setup/auth-trigger`
- **File:** [app/api/setup/auth-trigger/route.ts](../../app/api/setup/auth-trigger/route.ts)
- **Purpose:** Set up auth trigger for automatic user profile creation

#### POST `/api/admin/setup-auth-trigger`
- **File:** [app/api/admin/setup-auth-trigger/route.ts](../../app/api/admin/setup-auth-trigger/route.ts)
- **Purpose:** Admin endpoint for setting up auth triggers

---

## Components

### Layout Components

#### [components/LogoutButton.tsx](../../components/LogoutButton.tsx)
**Purpose:** Logout button component with client-side action.

**Features:**
- Client component using Supabase client
- Clears session and redirects to login
- Accepts className prop for styling

### Authentication Components

#### [components/auth/LoginForm.tsx](../../components/auth/LoginForm.tsx) (Detailed above)

#### [components/auth/SignupForm.tsx](../../components/auth/SignupForm.tsx)
**Purpose:** Registration form with role selection.

**Features:**
- Email and password input
- Password confirmation
- Role selection (patient/doctor)
- Form validation and error handling

#### [components/auth/AuthGuard.tsx](../../components/auth/AuthGuard.tsx) (Detailed above)

### Page-Specific Components

#### [app/patient/home/PatientDashboardClient.tsx]
**Purpose:** Client-side patient dashboard with interactive elements.

**Features:**
- Displays prescription cards with status
- Shows recent orders
- Displays pending refills
- Quick action buttons for common tasks

---

## Utility Functions & Services

### Authentication Utilities

**File:** [lib/auth.ts](../../lib/auth.ts)

Functions for server-side authentication:
- `getUser()` - Get current user without redirect
- `requireAuth()` - Force authentication with redirect
- `requireAdmin()` - Require admin role
- `requireDoctor()` - Require doctor role
- `requirePatient()` - Require patient role

### Database Client Utilities

**Files:**
- [lib/supabase-client.ts](../../lib/supabase-client.ts) - Browser client
- [lib/supabase-server.ts](../../lib/supabase-server.ts) - Server client
- [lib/auth-admin.ts](../../lib/auth-admin.ts) - Admin operations

### Services

**File:** [services/auth.ts](../../services/auth.ts)
**Purpose:** Authentication business logic layer.

---

## Database Operations

### Tables & Data Models

The application uses the following Supabase tables:

#### users
**Columns:** id, email, role (patient|doctor|admin)
**Used in:** All authentication flows, role-based authorization

#### user_profiles
**Columns:** user_id, full_name, phone, address, city, state, zip, created_at, updated_at
**Used in:** Patient/doctor profile management

#### prescriptions
**Columns:** id, patient_id, doctor_id, medication_name, dosage, quantity, frequency, duration, instructions, notes, status (pending|approved|rejected), file_url, created_at, updated_at
**Used in:** Prescription submission and management

#### doctor_prescriptions
**Columns:** id, doctor_id, patient_id, medication_name, dosage, quantity, frequency, duration, instructions, notes, status, created_at
**Used in:** Doctor prescription tracking

#### orders
**Columns:** id, patient_id, prescription_id, status (pending|processing|delivered|cancelled), created_at, updated_at
**Used in:** Order management

#### refills
**Columns:** id, patient_id, prescription_id, status (pending|approved|rejected), created_at, updated_at
**Used in:** Refill request tracking

### Database Access Patterns

#### Server-Side Queries (RLS Enabled)
```typescript
const supabase = await createServerSupabaseClient();
const { data } = await supabase
  .from("prescriptions")
  .select("*")
  .eq("patient_id", user.id);
```

#### Admin Queries (RLS Bypassed)
```typescript
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const { data } = await supabaseAdmin
  .from("prescriptions")
  .select("*");
```

#### Client-Side Queries (Via API Routes)
All client-side database access goes through API routes which handle authentication and authorization.

---

## File Management

### Storage Bucket

**Bucket Name:** `royaltymeds_storage`

**Purpose:** Store prescription documents and user uploads

### File Upload API

#### POST `/api/patient/upload`
**Purpose:** Upload prescription files.

**Features:**
- File validation (type, size)
- Generates unique file path with timestamp
- Returns signed URL for access
- Used in doctor prescription submission form

### File Access

#### Signed URLs
- Generated via Supabase Storage API
- 1-hour expiration for security
- Used in prescription display components
- Automatically refreshed when accessing old prescriptions

**Implementation Example:**
```typescript
const { data: signedUrl } = await supabaseAdmin.storage
  .from("royaltymeds_storage")
  .createSignedUrl(filePath, 3600); // 1 hour expiration
```

---

## Middleware

### Request Processing

**File:** [middleware.ts](../../middleware.ts)

**Purpose:** Global request middleware for session management.

**Features:**
- Lines 4-29: Creates server Supabase client
- Lines 31-34: Gets user and refreshes session if expired
- Lines 36: Applies to all routes except static assets
- Required for server-side auth checks in components

**Middleware Configuration:**
```typescript
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
```

---

## Configuration Files

### [tsconfig.json](../../tsconfig.json)
**Key Paths:**
- `@/*` - Maps to root directory for clean imports

### [next.config.js](../../next.config.js)
**Configuration:** Next.js 15 optimization settings

### [tailwind.config.ts](../../tailwind.config.ts)
**Colors:**
- Green: #15803d, #16a34a (Patient/Admin)
- Blue: #0284c7, #06b6d4 (Doctor)
- White: #ffffff (Background)

### [postcss.config.cjs](../../postcss.config.cjs)
**Plugins:** Tailwind CSS processing

---

## Testing Configuration

### [jest.config.js](../../jest.config.js)
**Purpose:** Jest test runner configuration

### [jest.setup.js](../../jest.setup.js)
**Purpose:** Jest setup with Testing Library

---

## Environment Variables

**Required .env.local:**
```
NEXT_PUBLIC_SUPABASE_URL=<your_supabase_url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your_anon_key>
SUPABASE_SERVICE_ROLE_KEY=<your_service_role_key>
```

---

## Key Features Summary

### 1. **Role-Based Access Control**
- Three user roles with specific dashboards and permissions
- Server-side role verification in API routes
- Client-side route protection with AuthGuard

### 2. **Prescription Management**
- Doctors submit prescriptions with medications and files
- Patients receive and track prescriptions
- Admins approve/reject prescriptions

### 3. **Order Processing**
- Create orders from approved prescriptions
- Track order status through fulfillment
- Patient and admin views

### 4. **Refill Requests**
- Patients request prescription refills
- Admin approval workflow
- Automatic status tracking

### 5. **Secure File Management**
- Upload prescription documents
- Signed URL generation for secure access
- 1-hour expiration for security

### 6. **Responsive Design**
- Mobile-first approach with Tailwind CSS
- Responsive navigation bars
- Adaptive grid layouts for statistics and tables

---

## Data Flow Examples

### Patient Login Flow
1. Patient visits `/login`
2. Enters credentials in LoginForm
3. `POST /api/auth/login` validates credentials
4. Server checks role from users table
5. Redirects to `/patient/home`
6. Patient layout checks auth server-side
7. PatientDashboardClient loads data on client

### Prescription Submission Flow
1. Doctor visits `/doctor/submit-prescription`
2. Searches for patient via `/api/doctor/patients?search=email`
3. Fills in prescription details and uploads file
4. `POST /api/doctor/prescriptions` creates record
5. File uploaded via `/api/patient/upload` to storage bucket
6. Prescription appears in admin dashboard
7. Admin reviews and approves via `/admin/prescriptions`

### Patient Order Creation Flow
1. Patient views approved prescriptions via `/api/patient/prescriptions`
2. Clicks "Order" button
3. `POST /api/patient/orders` creates order record
4. Order status changes from "pending" to "processing"
5. Patient tracks order status in `/patient/orders`

---

## Development Notes

### Authentication Patterns
- Use `getUser()` when graceful null handling is needed
- Use `requireAuth()` when access must be protected
- Always check role in API routes before database operations

### Database Access
- Client components access data only through API routes
- Server components can use Supabase client directly
- Admin operations use service role key and bypass RLS

### Error Handling
- API routes return detailed error messages with status codes
- Components display user-friendly error messages
- Console logging for debugging (especially in auth flows)

### Performance Considerations
- Prescriptions paginated or limited in queries
- Signed URLs cached client-side to minimize generation
- Dashboard data loaded on demand via API calls

---

*For more information, refer to the component files and API route implementations linked throughout this index.*
