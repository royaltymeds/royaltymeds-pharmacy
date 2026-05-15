# RoyaltyMeds AI Code Modification Pretext
# =====================================================
# CRITICAL GUIDANCE FOR ALL CODE MODIFICATIONS & FEATURES
# 
# This file contains ALL architectural principles, design decisions, solved problems,
# and proven patterns. Consult this BEFORE executing any code changes.
#
# This is your "context anchor" - it frames what the application is, how it works,
# and what rules govern all modifications. Apply these rules consistently.
#
# Generated: February 1, 2026 | Updated: March 5, 2026 (460+ commits, Phase 12 in progress)
# Last Revised: Custom shipping rates, payment collection, dual-flag COD system implemented
# Reference Docs: /public/context_docs/ (8+ comprehensive analysis files)
#
# 📚 DOCUMENTATION GUIDELINES:
# All new documentation files MUST be created in: /public/new_docs/
# Existing context docs are in: /public/context_docs/
# Analysis & reference docs stay organized in their respective folders

---

## 🎯 EXECUTIVE SUMMARY

**Project Name:** RoyaltyMeds Prescription Platform  
**Type:** Healthcare E-Commerce + Prescription Management System  
**Purpose:** Trusted online pharmacy (Jamaica) connecting doctors, patients, and pharmacists  
**Status:** ✅ PRODUCTION LIVE (Continuous updates through March 5, 2026)  
**Maturity:** Phase 11 complete + Phase 12 in progress, 460+ commits delivered

**Build Stats:**
- 50+ routes (0 TypeScript errors, 0 ESLint warnings)
- 155+ features across 15+ categories
- Deployment: Vercel (https://royaltymedsprescript.vercel.app)
- Database: Supabase PostgreSQL with optimized RLS (triggers, migrations)
- Architecture: Next.js 15 + React 19 + Tailwind CSS

---

## 🏗️ CORE ARCHITECTURE

### Multi-Role System (Three Distinct Portals)

The application serves **three distinct user types** with completely separate workflows, UIs, and permissions:

#### 1. **PATIENT / CUSTOMER** (`/patient/*`)
**Backend role:** `patient` | **UI term:** "Customer"  
**Primary workflows:**
- Browse and purchase medications from online store
- Upload prescription files for pharmacist processing
- Track order status and payment history
- Request prescription refills
- Manage personal profile and shipping address
- Duplicate prevention: Email + phone validation at signup

**Key Portal Components:**
- Dashboard: Orders, prescriptions, refills overview
- Store: Browse inventory (20 items/page), search/filter
- Orders: Track purchases with search and pagination (10/page)
- Prescriptions: Upload files + view status
- Profile: Name, phone, address, DOB (mandatory)
- Payments: View transaction history

#### 2. **DOCTOR** (`/doctor/*`)
**Backend role:** `doctor` | **UI term:** "Doctor"  
**Primary workflows:**
- Submit prescriptions to pharmacy for patient processing
- Track prescription status in real-time (pending → approved → dispensing → completed)
- Search patient records by name/phone
- Receive pharmacist feedback and modification requests
- Communicate with pharmacy about urgent cases
- Manage patient medical history

**Doctor ↔ Pharmacist Workflow (Core Business Logic):**
1. Doctor submits prescription with patient details and medications
2. Pharmacist reviews for interactions, dosage, coverage, allergies
3. Pharmacist approves (dispensing starts) or rejects (with reason)
4. Doctor receives notification, can resubmit with modifications
5. Doctor tracks filling progress and completion status

**Key Portal Components:**
- Dashboard: Prescription status metrics (pending, approved, dispensed, rejected, completed)
- My Prescriptions: Submitted prescriptions with filter/search
- Patients: Search by name/phone, view patient medical history
- Communication: Message pharmacy about urgent cases or questions

#### 3. **PHARMACIST / ADMIN** (`/admin/*`)
**Backend role:** `admin` | **UI term:** "Pharmacist"  
**Primary workflows:**
- Full system management (inventory, orders, payments, prescriptions)
- Review and approve/reject doctor prescriptions
- Process prescription fills (convert to orders)
- Manage pharmacy inventory with image uploads
- Configure payment methods (bank transfer, cards)
- Create doctor accounts
- View all orders and track fulfillment

**Key Portal Components:**
- Dashboard: Total prescriptions, orders, inventory, revenue
- Inventory: CRUD products with image upload (20/page pagination)
- Doctors: Create/manage doctor accounts
- Patients: Search and manage patient records
- Orders: Search by order ID, status, customer (10/page pagination)
- Prescriptions: Review submitted prescriptions (both doctor and patient submitted)
- Payments: Configure payment methods and view receipts

---

## 🔐 SECURITY-FIRST ARCHITECTURE

### Authentication Foundation

**Rule 1: ALL external database access respects Supabase RLS policies**
- Never bypass RLS with service role in public-facing queries
- Service role is ONLY for trusted server operations (admin actions, internal workflows)
- Client queries always use anon key + RLS enforcement

**Rule 2: Authentication hierarchy**
```
Server-Side Page                Client Component              API Route
  ↓                              ↓                            ↓
createServerClient()         getSupabaseClient()        createServerClient()
  ↓                              ↓                        (server-side only)
Auth via cookies          Auth via signInWithPassword      Bearer token
RLS enforcement           Session management              RLS + role check
```

**Rule 3: Never manually extract tokens**
❌ `const token = cookieStore.get("sb-auth-token")`
❌ Manual auth header construction
✅ Always use Supabase client libraries which handle token management

### Role Synchronization with Triggers

**How it works:**
1. Admin creates auth user via `createUser()` with `user_metadata: { role: "admin" }`
2. Database trigger `handle_new_user()` fires on auth.users INSERT
3. Trigger reads role from metadata and syncs to public.users table
4. RLS policies check public.users table for role verification
5. All subsequent auth checks reference public.users (not auth.users directly)

**Critical:** Role MUST be set during account creation. Trigger cannot update role after user exists.

```sql
-- The trigger (immutable, don't modify):
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Role source is always metadata:
NEW.raw_user_meta_data->>'role' (defaults to 'patient' if missing)
```

### RLS Policies: Optimization Rules

**Rule 1: Cache auth.uid() to prevent re-evaluation**
```sql
-- ❌ BAD: Evaluates auth.uid() for every row
USING (user_id = auth.uid());

-- ✅ GOOD: Single evaluation
USING (user_id = (SELECT auth.uid()));
```

**Rule 2: CRITICAL - Never reference tables with overlapping RLS policies**
RLS policies must NEVER check other tables that have their own RLS policies. This creates infinite recursion (error code 42P17).

```sql
-- ❌ DEADLY: Creates circular recursion
-- In user_profiles SELECT policy:
USING (
  user_id = (SELECT auth.uid())
  OR EXISTS (
    SELECT 1 FROM doctor_patient_links 
    WHERE ... -- doctor_patient_links has its own RLS → RECURSION
  )
);

-- ❌ DEADLY: Also creates recursion
-- In user_profiles SELECT policy:
USING (
  user_id = (SELECT auth.uid())
  OR role = (
    SELECT role FROM users WHERE id = (SELECT auth.uid()) -- users table has RLS → RECURSION
  )
);

-- ✅ SAFE: Pure self-read with zero cross-table dependencies
USING (user_id = (SELECT auth.uid()))
```

**When you need role-based access:**
- Do NOT check role in table RLS policies (causes recursion if users table has RLS)
- Instead: Enforce role-based access at the API endpoint level using server-side auth verification
- Pattern: API verifies `user.role` from session, then queries table with pure RLS policy

```typescript
// ✅ CORRECT: Role check in API layer, pure RLS on table
const { data: { user } } = await supabase.auth.getUser();
const userData = await supabase
  .from("users")
  .select("role")
  .eq("id", user.id)
  .single();

if (userData.role !== "admin") {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

// Now query with table that has pure self-read RLS:
const { data } = await supabase
  .from("admin_data")
  .select("*")
  // RLS policy is ONLY: USING (user_id = (SELECT auth.uid()))
  // No role checks in the policy itself
```

**Rule 3: Combine permission levels into single policy ONLY when safe**
```sql
-- ✅ SAFE: Combining checks on SAME table (no cross-table lookups)
CREATE POLICY "select_own_or_admin_view" ON orders FOR SELECT USING (
  user_id = (SELECT auth.uid()) 
  OR (SELECT auth.uid())::text = 'admin-user-id'
);
```

**Rule 4: Storage bucket policies are SEPARATE from table policies**
- Storage bucket RLS must be configured explicitly in `storage.objects`
- Apply by bucket_id, not by file ownership (unless specific to that feature)
- Current policy: All authenticated users can read/write royaltymeds_storage bucket

---

## 🔑 AUTHENTICATION PATTERNS (COPY-PASTE READY)

### Server-Side Protected Page (Async Server Component)
```typescript
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function ProtectedPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options as CookieOptions);
          });
        },
      },
    }
  );
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  
  // Now safely query with user context
  const { data } = await supabase
    .from("user_data")
    .select("*");
  
  return <PageContent data={data} />;
}
```

### Client-Side Login (In Client Component)
```typescript
"use client";
import { getSupabaseClient } from "@/lib/supabase-client";

export function LoginForm() {
  const supabase = getSupabaseClient();
  
  async function handleLogin(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      // Handle error
      return;
    }
    
    // Session automatically set in cookies, redirect based on role
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", data.user.id)
      .single();
    
    // Redirect logic in next step...
  }
}
```

### API Route with Auth Check
```typescript
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options as CookieOptions);
            });
          },
        },
      }
    );
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Optional: Verify role
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();
    
    if (userData?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    // Safe to process request
    const body = await req.json();
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
```

### Fetch Calls with Credentials (Critical for Cookie Transmission)
```typescript
// ❌ WRONG: Credentials not included, cookies not sent
const response = await fetch("/api/prescriptions");

// ✅ CORRECT: Credentials included, auth cookies transmitted
const response = await fetch("/api/prescriptions", {
  credentials: "include",
});

// For POST/PUT with body:
const response = await fetch("/api/prescriptions", {
  method: "POST",
  credentials: "include",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ ... }),
});
```

---

## 🛣️ ROUTING & MIDDLEWARE ARCHITECTURE

### Route Protection Rules

**Protected Routes by Role:**
- `/admin/*` → Admin only (service role required in migrations)
- `/doctor/*` → Doctor or higher
- `/patient/*` → Patient or higher
- `/` → Public (homepage)
- `/login`, `/signup` → Public (auth pages)
- `/admin-login` → Public (admin-specific auth page)

**Middleware Redirect Logic:**
```
Unauthenticated + accessing /admin/* → redirect to /admin-login
Unauthenticated + accessing other protected → redirect to /login
Authenticated + accessing /login or /signup → redirect to / (homepage)
Authenticated + invalid role for route → redirect to appropriate portal
```

### Login Flow by Role

1. User submits email + password at `/login` or `/admin-login`
2. Authentication endpoint verifies credentials
3. Role fetched from user.user_metadata or users table
4. Frontend redirects based on role:
   - `patient` → `/patient/home`
   - `doctor` → `/doctor/dashboard`
   - `admin` → `/admin/dashboard`

---

## 💾 DATABASE SCHEMA & COLUMN PATTERNS

### Prescription Management (Dual System)

The system supports TWO independent prescription workflows:

#### Patient Prescriptions (Traditional)
**Tables:** `prescriptions` + `prescription_items`

Patient uploads file → Creates prescription record → Admin manually adds medications

**prescription_items columns:**
- `id` UUID
- `prescription_id` UUID (foreign key)
- `medication_name` text
- `dosage` text
- `quantity` integer (prescribed amount)
- `quantity_filled` integer (amount filled in operations)
- `total_amount` integer (original prescribed, immutable) ← KEY COLUMN
- `brand_choice` text
- `notes` text
- `created_at` timestamp

**Display Formula:** `Filled = total_amount - quantity` (quantity stores remaining)

#### Doctor Prescriptions (Workflow-Driven)
**Tables:** `doctor_prescriptions` + `doctor_prescriptions_items`

Doctor submits prescription directly → Pharmacist approves/rejects → Converts to order

**doctor_prescriptions_items columns:**
- `id` UUID
- `doctor_prescription_id` UUID (foreign key)
- `medication_name` text
- `dosage` text
- `quantity` integer (prescribed amount)
- `quantity_filled` integer (amount filled in operations)
- `total_amount` numeric (original prescribed, immutable) ← KEY COLUMN
- `frequency` text
- `duration` text
- `notes` text
- `created_at` timestamp

**Display Formula:** Same as patient `Filled = total_amount - quantity`

### Critical Column Rules

**Rule 1: total_amount is IMMUTABLE**
- Set ONCE when item created (never updated)
- Represents the original prescribed quantity
- Used in display calculations to show filled amounts

**Rule 2: quantity stores REMAINING amount**
- Decreases as items are filled
- Updated by fill endpoint: `quantity = quantity - quantityFilled`
- After all filled, quantity = 0

**Rule 3: quantity_filled stores CURRENT OPERATION amount**
- Tracks how much was filled in this particular operation
- Not cumulative, just current transaction

**Example Fill Operation:**
```
BEFORE: total_amount=60, quantity=60, quantity_filled=0
FILL with 20 units:
  quantity_filled = 20
  quantity = 60 - 20 = 40
AFTER: total_amount=60, quantity=40, quantity_filled=20
Display: Filled 20/60, Remaining 40
```

### Standard Table Patterns

**Every table should include:**
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
```

**Ownership/Reference fields:**
- User data: `user_id UUID REFERENCES auth.users(id)`
- Patient data: `patient_id UUID REFERENCES users(id)` (user_id + role='patient')
- Doctor data: `doctor_id UUID REFERENCES users(id)` (user_id + role='doctor')
- Admin data: Only admin can access via RLS

**Status fields:**
- Use CHECK constraints for allowed values
- Example: `status CHECK (status IN ('pending', 'approved', 'dispensing', 'completed', 'rejected'))`

### Custom Shipping Rates & COD Management (Phase 12)

**Feature Overview:**
Admin can set custom shipping rates for orders without standard rates, with optional Cash-on-Delivery (COD) collection. Two independent COD flags allow flexible payment collection strategies.

**Database Columns (orders table):**
```sql
shipping_custom_rate numeric(10, 2)                    -- Amount admin sets
shipping_custom_rate_collect_on_delivery boolean       -- COD checkbox (admin toggles)
collect_shipping_after_payment boolean                 -- Auto-set by trigger/backup logic
```

**Business Rules:**

1. **Setting Custom Rates:**
   - Admin can only set custom rates for orders without standard rates OR when editing existing custom rates
   - Uses `updateCustomShippingRate()` function
   - Function automatically sets `collect_shipping_after_payment = true` if `payment_status = 'payment_verified'`

2. **Two COD Scenarios:**
   - `shipping_collect_on_delivery` — Standard delivery COD (from shipping config)
   - `shipping_custom_rate_collect_on_delivery` — Custom rate COD (admin checkbox)
   - **Logic:** When EITHER is true, shipping NOT added to order total

3. **Payment Collection After Verification:**
   - When order payment is verified AND admin sets custom rate:
     - Database trigger auto-sets `collect_shipping_after_payment = true`
     - Backup: `updateCustomShippingRate()` function also sets flag
   - Patient sees "Pay Delivery Online Now" button on order details
   - Button conditions: `collect_shipping_after_payment && !shipping_collect_on_delivery && !shipping_custom_rate_collect_on_delivery`

4. **Total Calculation Formula:**
   ```
   If shipping_collect_on_delivery OR shipping_custom_rate_collect_on_delivery:
     total = subtotal + tax
   Else:
     total = subtotal + tax + shipping_amount (or shipping_custom_rate if set)
   ```

**Key Functions in app/actions/orders.ts:**
- `updateCustomShippingRate(orderId, customRate)` — Sets custom rate + collect_shipping_after_payment flag
- `updateCustomRateCOD(orderId, isChecked)` — Toggles COD checkbox + recalculates total
- `updateOrderShipping(orderId, amount)` — Updated to set collect_shipping_after_payment flag

**Supabase Trigger:**
- **File:** `supabase/migrations/20260219213000_add_trigger_set_collect_shipping_after_payment.sql`
- **Behavior:** Automatically sets `collect_shipping_after_payment = true` when `shipping_custom_rate` is set/changed on `payment_verified` orders
- **Backup Logic:** Application-level functions also set flag to ensure it works regardless of trigger behavior

---

## 🎨 STYLING & THEME SYSTEM

### Color Palette (Enforce Strictly)

**Primary Green** (`green-600`, `#16a34a`)
- Use for: Customer portal main actions, primary buttons, success states
- Customer/Pharmacist portal theme
- Example: "Add to Cart", "Submit", "Confirm"

**Secondary Blue** (`blue-600`, `#0284c7`)
- Use for: Doctor portal theme, processing states, secondary actions
- Doctor-specific UI elements
- Example: "Submit Prescription", doctor dashboard navigation

**White** (`#ffffff`)
- Use for: Main background, light sections, text on dark backgrounds

**Gray Scale** (`gray-50` to `gray-900`)
- Neutral text, borders, dividers
- Light: `gray-50`, `gray-100` (backgrounds)
- Medium: `gray-500`, `gray-600` (text, borders)
- Dark: `gray-700`, `gray-800`, `gray-900` (strong text, dark UI)

### Portal-Specific Theming Rules

**Customer Portal** (`/patient/*`)
- Navigation: White background, green primary buttons
- Links: Green text
- Main background: White
- Section dividers: Light gray

**Doctor Portal** (`/doctor/*`)
- Navigation: Blue background (`bg-blue-600`)
- Links: Blue text
- Main background: White
- Dashboard title: White text on blue background
- Stat cards: Blue accents for status badges

**Pharmacist Portal** (`/admin/*`)
- Navigation: Green background (matches brand)
- Links: Green text
- Main background: White
- Dashboard title: Green accents
- Action buttons: Green primary

**Stat Cards Color Scheme (All Portals)**
- Pending/Alert: Yellow border + icon (`border-yellow-500`, `text-yellow-500`)
- Processing: Blue border + icon (`border-blue-500`, `text-blue-500`)
- Success/Approved: Green border + icon (`border-green-500`, `text-green-500`)
- Rejected/Error: Red border + icon (`border-red-500`, `text-red-500`)
- Neutral: Gray border + icon (`border-gray-300`, `text-gray-600`)

### Colors to NEVER Use
❌ Indigo, Slate, Amber, Purple (legacy theme)
❌ Dark backgrounds on main portals (white standard)
❌ Rainbow gradients (only green-to-blue for CTAs)

### Modal Design Guidelines (Standardized)

**Modal Structure (Top-Level Container):**
```tsx
<div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
  <div className="bg-white rounded-lg shadow-2xl max-w-[WIDTH] w-full [max-h-[90vh] overflow-y-auto]">
    {/* Header */}
    {/* Content */}
  </div>
</div>
```

**Critical Styling Rules:**

1. **Overlay & Backdrop:**
   - `fixed inset-0` — Full viewport coverage
   - `bg-black/20` — 20% opacity black (NOT 50%, NOT fully opaque)
   - `backdrop-blur-sm` — Slight blur effect on content beneath (standard since commit e954e4e)
   - `z-50` — Ensures modals layer above all content
   - `p-4` — Padding for responsive mobile (margin around modal on small screens)

2. **Modal Container:**
   - `bg-white` — Always white background
   - `rounded-lg` — Consistent rounded corners
   - `shadow-2xl` — Deep shadow for elevation
   - `max-w-[WIDTH]` — Set appropriate max-width based on content type:
     - Simple dialogs (auth, confirmation): `max-w-md` (448px)
     - Medium forms: `max-w-lg` (512px)
     - Complex forms with images: `max-w-2xl` (672px)
   - `w-full` — Responsive on small screens
   - `[max-h-[90vh] overflow-y-auto]` — Only if content may exceed viewport height

3. **Modal Header (Always Present):**
   ```tsx
   <div className="sticky top-0 flex items-center justify-between p-4 md:p-6 border-b border-gray-200 bg-white">
     <h2 className="text-xl md:text-2xl font-bold text-gray-900">[Title]</h2>
     <button
       onClick={onClose}
       className="text-gray-400 hover:text-gray-600 transition"
       disabled={uploading || loading}
     >
       <X className="w-6 h-6" />
     </button>
   </div>
   ```
   - `sticky top-0 bg-white` — Header stays visible when scrolling
   - `flex items-center justify-between` — Title left, close button right
   - `border-b border-gray-200` — Light gray divider
   - `p-4 md:p-6` — Responsive padding
   - `text-gray-900` — Dark title text
   - X icon from lucide-react for close button
   - Close button disabled during async operations

4. **Modal Content:**
   ```tsx
   <div className="p-4 md:p-6 space-y-6">
     {/* Main content goes here */}
   </div>
   ```
   - `p-4 md:p-6` — Responsive padding matching header
   - `space-y-6` — Consistent spacing between sections

5. **Error States (Always use this pattern):**
   ```tsx
   {error && (
     <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
       <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
       <p className="text-sm text-red-700">{error}</p>
     </div>
   )}
   ```
   - Red background with border
   - AlertCircle icon on left
   - Error message on right
   - Small text size

6. **Success States (Always use this pattern):**
   ```tsx
   <div className="text-center py-8">
     <div className="flex justify-center mb-4">
       <Check className="w-16 h-16 text-green-600" />
     </div>
     <h3 className="text-xl font-bold text-gray-900 mb-2">[Success Title]</h3>
     <p className="text-gray-600">[Success Message]</p>
   </div>
   ```
   - Centered layout
   - Large Check icon (green)
   - Bold success title
   - Gray descriptive text

7. **Button Patterns:**
   - **Single Action:** `w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700`
   - **Multiple Actions (flex):** Use `flex gap-3` with `flex-1` on buttons for equal width
   - **Cancel Button:** `border border-gray-300 text-gray-700 hover:bg-gray-50`
   - **Loading State:** Add spinner: `{loading && <Loader className="w-5 h-5 animate-spin" />}`
   - **Disabled State:** `disabled:bg-gray-400 disabled:cursor-not-allowed` and always set `disabled` prop during async

8. **File Upload Sections (If applicable):**
   ```tsx
   <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition">
     <input type="file" className="hidden" id="file-input" />
     <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
     <p className="text-gray-700 font-medium">[Label text]</p>
     <p className="text-sm text-gray-500 mt-1">[Helper text]</p>
   </div>
   ```
   - Dashed border (not solid)
   - Gray by default, blue on hover
   - Upload icon
   - Two-line text (main + helper)

9. **Info/Summary Sections:**
   ```tsx
   <div className="bg-gray-50 rounded-lg p-4">
     <p className="text-sm font-medium text-gray-700 mb-3">[Label]</p>
     {/* Content */}
   </div>
   ```
   - Gray background (`bg-gray-50`)
   - Light padding
   - Small label text above content

**Implementation Example (Complete Modal):**
```tsx
'use client';
import { useState } from 'react';
import { X, Check, AlertCircle, Loader } from 'lucide-react';

export function ExampleModal({ isOpen, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      // Your async operation
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
        setSuccess(false);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-4 md:p-6 border-b border-gray-200 bg-white">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Modal Title</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6 space-y-6">
          {success ? (
            <div className="text-center py-8">
              <div className="flex justify-center mb-4">
                <Check className="w-16 h-16 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Success!</h3>
              <p className="text-gray-600">Operation completed successfully.</p>
            </div>
          ) : (
            <>
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <p className="text-gray-600">Modal content goes here.</p>

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading && <Loader className="w-5 h-5 animate-spin" />}
                {loading ? 'Processing...' : 'Submit'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
```

**Why This Pattern:**
- Commit `e954e4e`: Changed from dark backgrounds to `bg-black/20 backdrop-blur-sm` for better visibility of content beneath
- Commit `ec4ccee`: Standardized modal container structure across all portals (doctor, patient, admin)
- Consistent header design with title + close button (always sticky and visible)
- Proven error/success state handling (used in BankTransferModal, UpdateReceiptModal)
- Responsive padding (`p-4 md:p-6`) works on all screen sizes
- Full accessibility with proper button states and disabled handling

---

## ⚙️ TECHNICAL PATTERNS & BEST PRACTICES

### Pagination Pattern (Used Consistently)

**Customer/Patient portal:**
- Orders list: 10 items per page
- Orders search: 10 items per page
- Store inventory: 20 items per page

**Pharmacist portal:**
- Inventory: 20 items per page (with image upload)
- Orders: 10 items per page
- Doctors: 20 items per page (if many)

**Implementation:**
```typescript
const ITEMS_PER_PAGE = 10;
const page = searchParams.get("page") ? parseInt(searchParams.get("page")!) : 1;
const offset = (page - 1) * ITEMS_PER_PAGE;

const { data, count } = await supabase
  .from("table")
  .select("*", { count: "exact" })
  .range(offset, offset + ITEMS_PER_PAGE - 1);

const totalPages = Math.ceil((count || 0) / ITEMS_PER_PAGE);
```

### Search & Filter Pattern

**Applied to:**
- Orders search (by order ID)
- Doctor patient search (by name/phone)
- Store inventory search (by medication name)
- Prescription search (by patient name)

**Pattern:**
```typescript
let query = supabase.from("table").select("*");

if (searchTerm) {
  query = query.or(
    `column1.ilike.%${searchTerm}%,column2.ilike.%${searchTerm}%`
  );
}

if (filterStatus) {
  query = query.eq("status", filterStatus);
}

const { data } = await query;
```

### Image Upload Pattern (Admin Inventory)

**Implementation:**
1. Form accepts image file
2. Convert to base64 or read as blob
3. POST to `/api/admin/inventory/upload` with file data
4. Backend saves to Supabase Storage
5. Store image URL in database record
6. Display via `<Image>` component with optimization

### Error Handling Pattern

**Never expose internal details:**
```typescript
// ❌ BAD
catch (error) {
  return NextResponse.json({ 
    error: error.message // Exposes SQL, auth details
  }, { status: 500 });
}

// ✅ GOOD
catch (error) {
  console.error("[API]:", error); // Log internally
  return NextResponse.json({ 
    error: "Failed to process request" // Generic message
  }, { status: 500 });
}
```

### Duplicate Prevention Pattern

**At signup, validate:**
- Email uniqueness (via Supabase Auth)
- Phone uniqueness (via custom query)
- Email + phone combination uniqueness (if needed)

**Query pattern:**
```typescript
const { data: existing } = await supabase
  .from("user_profiles")
  .select("id")
  .eq("phone", phone);

if (existing && existing.length > 0) {
  return NextResponse.json(
    { error: "Phone number already registered" },
    { status: 400 }
  );
}
```

---

## 🚀 DEPLOYMENT & ENVIRONMENT VARIABLES

### Vercel Deployment Checklist

**Environment Variables (Set in Vercel Dashboard):**

Public keys (safe in build):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
- `STORAGE_BUCKET`

Private keys (ONLY in Vercel environment UI, NEVER in code):
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_DB_URL`
- `SUPABASE_REF`

**API Routes Requirement:**
```typescript
// MUST include this in any route that initializes Supabase at module level
export const dynamic = "force-dynamic";
```

This prevents pre-rendering at build time when environment variables aren't available.

**Session Persistence on Vercel:**
- Auth callback uses `createServerClient()` with cookie management
- Layout files provide `CookieStorage` class
- All fetch calls include `credentials: "include"`

---

## ✅ PRE-MODIFICATION CHECKLIST

**Before implementing ANY change, verify:**

1. ☑ **Role Compatibility**: Does this feature apply to patient, doctor, or pharmacist?
2. ☑ **Authentication**: Using correct Supabase client pattern (server vs client)?
3. ☑ **RLS Enforcement**: Will this respect row-level security policies?
4. ☑ **RLS Safety**: RLS policies do NOT reference other RLS-protected tables (prevents 42P17 recursion)?
5. ☑ **Terminology**: UI terms match approved vocabulary (customer, pharmacist, doctor)?
6. ☑ **Database Schema**: Required columns verified in migrations?
7. ☑ **Security**: No secrets exposed, no service role in client queries?
8. ☑ **Folder Structure**: Follows established `/app/` organization?
9. ☑ **Error Handling**: Generic messages (no SQL/auth details)?
10. ☑ **Edge Cases**: Handles missing data, auth failures, role mismatches?
11. ☑ **Build**: Runs `npm run build` successfully with 0 errors?

---

## 🐛 COMMON PROBLEMS & SOLUTIONS

### Problem: Error Code 42P17 (Infinite Recursion in RLS Policy)
**Symptom:** API returns `Error: code '42P17' infinite recursion detected in policy for relation "table_name"`
**Root Cause:** RLS policy on table A references table B, which has its own RLS that references table A or another RLS-protected table
**Example:** user_profiles SELECT policy checks doctor_patient_links table, which has RLS that references users table
**Solution:** Remove ALL cross-table references from RLS policies
```sql
-- ❌ Current broken policy
CREATE POLICY "user_profiles_select" ON user_profiles FOR SELECT USING (
  user_id = (SELECT auth.uid())
  OR EXISTS (
    SELECT 1 FROM doctor_patient_links WHERE ... -- ← BAD: causes recursion
  )
);

-- ✅ Fixed policy (zero cross-table dependencies)
CREATE POLICY "user_profiles_select_self" ON user_profiles FOR SELECT USING (
  user_id = (SELECT auth.uid())
);

-- Role checks moved to API layer instead:
// In route.ts
const userData = await supabase
  .from("users")
  .select("role")
  .eq("id", user.id)
  .single();
if (userData.role !== "admin") return Forbidden;
```
**Prevention:** When designing RLS policies, ask: "Does this policy query another table that also has RLS?" If yes, find a different approach or move the check to the API layer.

### Problem: 401 Unauthorized on API Calls
**Symptom:** Fetch returns 401 even though user is logged in
**Root Cause:** Missing `credentials: "include"` on fetch call
**Solution:**
```typescript
const response = await fetch("/api/endpoint", {
  credentials: "include", // ← Required for cookie transmission
});
```

### Problem: Session Lost on Page Navigation
**Symptom:** User logged in, but navigating to different page logs them out
**Root Cause:** Supabase client not configured with CookieStorage
**Solution:** Layout must provide CookieStorage class and configure client:
```typescript
const supabase = createBrowserClient(url, key, {
  auth: {
    storage: new CookieStorage(),
    persistSession: true,
    autoRefreshToken: true,
  },
});
```

### Problem: Role Not Syncing to Database
**Symptom:** Admin account created but role shows as 'patient'
**Root Cause:** Role not set in user_metadata during account creation
**Solution:**
```typescript
await supabase.auth.admin.createUser({
  email,
  password,
  user_metadata: {
    role: "admin", // ← MUST be set here
  },
});
```

### Problem: Private Keys Exposed in Build Output
**Symptom:** Vercel secrets scanner detects SUPABASE_SERVICE_ROLE_KEY in build
**Root Cause:** Private keys in .env file or netlify.toml
**Solution:** Private keys ONLY in Vercel dashboard UI under Environment Variables

### Problem: Build Fails with "supabaseUrl is required"
**Symptom:** Netlify/Vercel build fails during page collection
**Root Cause:** API route initializes Supabase at module level
**Solution:**
```typescript
export const dynamic = "force-dynamic";
```

### Problem: Silent Logout After Login
**Symptom:** User logs in, portal appears, then redirects to login
**Root Cause:** Link component auto-prefetches logout endpoint
**Solution:** Use button with onClick instead of Link for logout:
```typescript
// ❌ Bad
<Link href="/api/auth/logout">Logout</Link>

// ✅ Good
<LogoutButton />
```

### Problem: Doctor Patient List Shows All Users
**Symptom:** Doctor sees both doctors and patients in patient search
**Root Cause:** API query doesn't filter by role
**Solution:**
```typescript
const { data } = await supabase
  .from("users")
  .select("*")
  .eq("role", "patient"); // ← Filter by role
```

### Problem: Prescription Files Return 404
**Symptom:** User clicks "View File", gets 404 "Bucket not found"
**Root Cause:** Private storage bucket needs signed URLs
**Solution:** Generate server-side signed URL:
```typescript
const { data: signedUrl } = await supabase.storage
  .from("royaltymeds_storage")
  .createSignedUrl(filePath, 3600); // 1-hour expiration
```

---

## 📊 PROJECT PHASES & FEATURES MATRIX

### Completed Phases (1-11) & In Progress (12)

**Phase 1:** Core Architecture & Setup (Routes, auth foundation)
**Phase 2:** Multi-Role Portal System (Patient, Doctor, Admin separation)
**Phase 3:** Database Design (Dual prescription tables, RLS policies)
**Phase 4:** Patient Portal (Home, orders, store, profiles)
**Phase 5:** Doctor Portal (Dashboard, prescriptions, patient search)
**Phase 6:** Pharmacist Portal (Inventory, doctors, patients management)
**Phase 7:** Prescription Management (Submit, fill, status tracking)
**Phase 8:** E-Commerce (Store, inventory, images, pagination)
**Phase 9:** Payment System (Bank transfer, cards, Fygaro receipts)
**Phase 10:** Order Management (Search, pagination, RLS optimization)
**Phase 11:** Signup Validation & Confirmation (Duplicate prevention, OTC pharmacist confirmation)
**Phase 12:** Custom Shipping Rates & Payment Collection (Admin sets rates, trigger-based COD, patient online payment)

### Feature Categories (130+)

**Core Features:**
- ✅ Authentication (3 portals, role-based)
- ✅ User Profiles (mandatory fields, duplicate prevention)
- ✅ Prescription Management (dual system: patient + doctor)
- ✅ Inventory Management (products, categories, images)
- ✅ Order Management (track, search, pagination, custom rates)
- ✅ Payment Processing (bank transfer, cards, Fygaro gateway)
- ✅ Doctor ↔ Pharmacist Workflow (submit, approve, reject)
- ✅ Custom Shipping Rates & COD Management (admin sets, patient pays post-delivery)

**UI/UX:**
- ✅ Responsive Design (mobile-first)
- ✅ Loading States (spinner animations)
- ✅ Toast Notifications (success, error)
- ✅ Search & Filter (all major lists)
- ✅ Pagination (10/20 items per page)
- ✅ Form Validation (client + server)
- ✅ Error Messages (generic, non-exposing)

**Security:**
- ✅ RLS Policies (optimized with caching)
- ✅ Role-Based Access (middleware enforcement)
- ✅ Session Management (persistent across navigation)
- ✅ API Authentication (bearer token pattern)
- ✅ File Security (signed URLs for private storage)
- ✅ Duplicate Prevention (email + phone validation)

---

## 📚 DOCUMENTATION SYSTEM

### Existing Reference Documents
**Location:** `/public/context_docs/` (comprehensive analysis & architecture)
- `SYSTEM_ARCHITECTURE.md` — Visual diagrams, data flows, tech stack
- `GIT_HISTORY_ANALYSIS.md` — Complete phase-by-phase breakdown
- `QUICK_REFERENCE.md` — Fast lookup for features and patterns
- `ANALYSIS_SUMMARY.md` — High-level overview of all development
- `DOCUMENTATION_INDEX.md` — How to navigate these docs
- `TO_DO.md` — Roadmap for future phases

### New Documentation Guidelines
**All NEW documentation files MUST go to:** `/public/new_docs/`

When you create documentation for:
- New features being built
- Architecture decisions made during development
- Bug fixes and their root causes
- API specifications or workflow updates
- Database migration explanations
- Integration patterns or examples
- Performance optimizations
- Security implementations

**Save the file as:** `/public/new_docs/FEATURE_NAME_YYYYMMDD.md`

Example filenames:
- `/public/new_docs/INVENTORY_CATEGORIES_20260201.md`
- `/public/new_docs/PAYMENT_GATEWAY_INTEGRATION_20260205.md`
- `/public/new_docs/RLS_PERFORMANCE_TUNING_20260203.md`

This keeps the documentation system organized with:
- **Existing analysis** in `/public/context_docs/` (permanent reference)
- **Development work** in `/public/new_docs/` (feature-specific documentation)
- **Inline code** documented in source files (via comments)

**On Every Modification:**
1. Reference this pretext for architectural rules
2. Check `/public/context_docs/` for existing patterns
3. Add new feature docs to `/public/new_docs/` as you build
4. Search git history for similar implementations
5. Test locally before pushing
6. Run `npm run build` to verify no TypeScript errors

---

## 🎯 APPROVED TERMINOLOGY

**Always use these terms consistently:**

| Concept | UI Term | Backend Role | Context |
|---------|---------|--------------|---------|
| Pharmacy owner/staff | Pharmacist | `admin` | `/admin/*` portal |
| Patient/Customer | Customer | `patient` | `/patient/*` portal |
| Medical doctor | Doctor | `doctor` | `/doctor/*` portal |
| Patient file upload | Prescription | — | Patient submits PDF |
| Doctor submission | Prescription | — | Doctor submits form |
| Medication line item | Medication Item | — | Single medicine in prescription |
| Medicine purchase | Order | — | Customer cart → checkout |
| Physical location | Pharmacy/Store | — | Business location (if applicable) |

---

## ⚡ QUICK COMMANDS

```bash
# Development
npm run dev                 # Start local dev server
npm run build              # Build production bundle
npm run lint               # ESLint check (should be 0 errors)

# Database
npx supabase db push       # Apply migrations
npx supabase db pull       # Pull schema from production

# Deployment
git push origin main       # Push to GitHub
# Vercel auto-deploys on GitHub push

# Type checking
npm run type-check         # (if available)

# Testing
npm test                   # Run test suite (if available)
```

---

## 📌 FINAL RULES (CRITICAL)

**DO:**
- ✅ Check this file before EVERY code change
- ✅ Use established patterns from context docs
- ✅ Test locally (especially auth flows)
- ✅ Build successfully before pushing (`npm run build`)
- ✅ Include proper error handling
- ✅ Respect role-based access for all features
- ✅ Keep environment variables secure
- ✅ Document complex business logic
- ✅ **KEEP FILES IN GITIGNORE** - Don't remove entries from `.gitignore`

**DON'T:**
- ❌ Bypass RLS with manual SQL or service role in client code
- ❌ Mix UI terminology (patient vs customer, admin vs pharmacist)
- ❌ Expose secrets in logs, error messages, or documentation
- ❌ Create new authentication patterns (use established ones)
- ❌ Modify trigger logic without testing role sync
- ❌ Use deprecated color scheme (indigo, slate, amber)
- ❌ Commit .env files or private keys
- ❌ Skip TypeScript checks before deployment
- ❌ **REMOVE FILES FROM GITIGNORE** - Respect the ignore rules for:
  - `supabase/migrations/` - Restore via `npx supabase db pull --linked`
  - `.env*` files - Never commit secrets
  - `node_modules/`, `.next/`, build artifacts
  - Local configuration and generated files

### Gitignored Files Recovery Guidelines

**If you accidentally delete a gitignored folder:**

| Folder | Recovery Command | Why Ignored |
|--------|------------------|------------|
| `supabase/migrations/` | `npx supabase db pull --linked` | Server source of truth, don't track |
| `.env.local` | Recreate manually | Contains secrets, local-only |
| `.next/`, `build/` | `npm run build` | Regenerate from source |
| `node_modules/` | `npm install` | Regenerate from package.json |

**Key Rule:** Gitignore entries exist for a reason. Always restore via their source of truth, never by removing from `.gitignore`.

---

**Last Updated:** February 1, 2026  
**Author:** AI Assistant (RoyaltyMeds Development)  
**Commits Analyzed:** 385+  
**Phases Completed:** 11  
**Status:** ✅ Production Ready  

**Next Actions:**
- Phase 12: Enhanced Inventory Categorization
- Phase 13: Advanced Doctor-Pharmacy Communication
- Phase 14: Analytics & Reporting
- Phase 15: Mobile App (React Native)

---

## ? ANALYSIS CONFIRMATION

**Document Analyzed:** February 16, 2026 at 06:40:30.847 UTC (2026-02-16T06:40:30.847Z)
**Timestamp (Unix ms):** 1771206030847
**Analysis Scope:** Complete codebase review + git history (460+ commits) + migration analysis + schema validation
**Status:** ? VERIFIED & COMPLETE
**Next Analysis Date:** Recommended 1 week (February 23, 2026)
