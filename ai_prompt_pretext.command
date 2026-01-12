# RoyaltyMeds AI Code Modification Pretext
# =========================================
# This file contains all architectural principles, design decisions, and solved problems.
# It should be consulted BEFORE executing any code modifications from user prompts.
# Treat this as a "loaded context file" that applies to every interaction.

## PROJECT OVERVIEW
- **Name:** RoyaltyMeds Prescription Platform
- **Stack:** Next.js 15 (App Router) + Supabase + Tailwind CSS
- **Status:** Phase 5.5 Complete, Landing Page & Theme Complete (62.5% of 8 phases)
- **Build:** 43 routes, 0 TypeScript errors, 0 ESLint warnings
- **Database:** PostgreSQL 14+ with Row-Level Security (RLS)
- **Theme:** Green (primary), Blue (secondary), White background - January 12, 2026

---

## CORE DESIGN PRINCIPLES

### 1. SECURITY-FIRST ARCHITECTURE
- **Rule**: All database access goes through Supabase RLS, never bypass with service role in production queries
- **Rule**: Never expose session tokens or auth details in logs or error messages
- **Rule**: Use auth metadata (user_metadata) for role assignment during account creation
- **Rule**: All database queries must respect role-based access via RLS policies
- **Pattern**: Database trigger (`handle_new_user()`) syncs auth.users to public.users on signup
- **Pattern**: User role stored in user_metadata during auth user creation, triggering sync to database

### 2. MULTI-ROLE ARCHITECTURE
**Three Core Roles:**
- **Customers** (formerly "patients" - backend still uses `role: 'patient'`)
  - UI terminology: "Customer", "Customer Portal", "customer"
  - Backend role: `patient`
  - Access: Own data only (prescriptions, orders, refills)
  - Login route: `/login` with "For Customers & Doctors" indicator

- **Doctors**
  - UI terminology: "Doctor"
  - Backend role: `doctor`
  - Access: Own prescriptions, patient searches, dashboard stats
  - Login route: `/login` (shared with customers)
  - Distinct portal: `/doctor/dashboard`

- **Pharmacists** (formerly "admins" - backend still uses `role: 'admin'`)
  - UI terminology: "Pharmacist", "Pharmacy", "Pharmacy Dashboard"
  - Backend role: `admin`
  - Access: All data, full management capabilities
  - Login route: `/admin-login` (SEPARATE from customer login)
  - Distinct portal: `/admin/dashboard` with dark slate-950 theme

**Critical Rule**: Always distinguish UI terminology from backend roles:
- UI says "Customer" → Backend checks `role === 'patient'`
- UI says "Pharmacist" → Backend checks `role === 'admin'`
- Doctors remain "Doctor" in both UI and backend

### 3. AUTHENTICATION PATTERNS

#### Server-Side Authentication (ALWAYS USE THIS FOR PROTECTED PAGES)
```typescript
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

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
}
```

#### Client-Side Authentication (CLIENT COMPONENTS ONLY)
```typescript
const supabase = getSupabaseClient();
const { data, error } = await supabase.auth.signInWithPassword({ email, password });
// Always call signInWithPassword() which sets session cookies
```

#### ANTI-PATTERN TO AVOID
❌ Manual token extraction: `const token = cookieStore.get("sb-auth-token")`
❌ Direct auth header: `Authorization: Bearer ${manualToken}`
❌ Using anon key for admin operations (use service role for server-only operations)
❌ Trying to read from users table with anon key when RLS policies prevent it

### 4. ROLE-BASED ACCESS AT LOGIN

**Login Endpoint** (`/api/auth/login`)
1. Sign in with Supabase Auth
2. Get role from user's auth metadata (set during account creation)
3. Fall back to database (service role) if metadata missing
4. Return role to frontend: `{ success: true, role: "patient" | "doctor" | "admin" }`

**Login Pages**
- `/login` (customers + doctors): Shows "For Customers & Doctors"
- `/admin-login` (pharmacists): Shows "Pharmacist Only" badge, dark slate-950 theme
- After login, redirect based on role:
  - `patient` → `/patient/home`
  - `doctor` → `/doctor/dashboard`
  - `admin` → `/admin/dashboard`

### 5. MIDDLEWARE ROUTING LOGIC

**Pattern:**
```typescript
const isAdminRoute = req.nextUrl.pathname.startsWith("/admin") && 
                    req.nextUrl.pathname !== "/admin-login";
const isProtectedRoute = ["/dashboard", "/profile", "/patient", "/doctor"]
  .some(route => req.nextUrl.pathname.startsWith(route));

if (!session && isAdminRoute) {
  return NextResponse.redirect(new URL("/admin-login", req.nextUrl.origin));
}
if (!session && isProtectedRoute) {
  return NextResponse.redirect(new URL("/login", req.nextUrl.origin));
}
```

**Key Rules:**
- Unauthenticated users accessing `/admin/*` → redirect to `/admin-login`
- Unauthenticated users accessing other protected routes → redirect to `/login`
- Authenticated users accessing `/login` or `/signup` → redirect to `/dashboard`
- `/admin-login` is NOT protected (it's an auth page)

### 6. DATABASE TRIGGER FOR ROLE SYNC

**Pattern:**
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.users (id, email, role, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role'), 'patient'),
    true
  ) ON CONFLICT (id) DO UPDATE SET email = NEW.email;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

**Critical Rule**: When creating auth users (signup, admin account creation), MUST set role in user_metadata:
```typescript
await adminClient.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: {
    role: "admin",  // ← REQUIRED for trigger to work
  },
});
```

Without this, trigger will default to `role: 'patient'`.

### 7. RLS POLICY OPTIMIZATION

**Problem Solved**: Supabase Advisor warnings about:
- Auth function re-evaluation per row
- Multiple permissive policies causing performance degradation

**Solution Pattern**:
```sql
-- ❌ BAD: Re-evaluates auth.uid() for every row
CREATE POLICY "access" ON table FOR SELECT
  USING (user_id = auth.uid());

-- ✅ GOOD: Caches auth.uid() value
CREATE POLICY "access" ON table FOR SELECT
  USING (user_id = (SELECT auth.uid()));

-- ❌ BAD: Multiple permissive policies
CREATE POLICY "doctor_access" ON table FOR SELECT USING (doctor_id = auth.uid());
CREATE POLICY "admin_access" ON table FOR SELECT USING (EXISTS (
  SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
));

-- ✅ GOOD: Single policy with OR conditions
CREATE POLICY "select_access" ON table FOR SELECT USING (
  doctor_id = (SELECT auth.uid()) OR
  EXISTS (SELECT 1 FROM users WHERE id = (SELECT auth.uid()) AND role = 'admin')
);
```

**Applied To**: doctor_prescriptions table has optimized single policy per operation (SELECT, INSERT, UPDATE, DELETE)

---

## PROBLEMS SOLVED & LESSONS LEARNED

### Problem 1: Authentication Failures on Page Navigation
**Symptom**: Users logged out when navigating between pages
**Root Cause**: Manual token extraction doesn't sync Supabase session cookies
**Solution**: ALWAYS use `createServerClient()` on server-side pages, it auto-manages cookies
**Lesson**: Never manually extract auth tokens; let Supabase handle session lifecycle

### Problem 2: Role Not Syncing to Database
**Symptom**: Admin account created but role shows as 'patient'
**Root Cause**: Role wasn't set in user_metadata during auth user creation
**Solution**: Pass `user_metadata: { role: "admin" }` to `createUser()`, trigger syncs it
**Lesson**: Database role depends on metadata at account creation time

### Problem 3: User Profiles Insert Failing
**Symptom**: Duplicate key error when creating admin accounts
**Root Cause**: Manually inserting into users table when trigger already does it
**Solution**: Remove manual users table insert, let trigger handle it, only insert profiles
**Lesson**: Understand trigger side effects before duplicating operations

### Problem 4: Can't Read Users Table After Login
**Symptom**: Login API returns 500 error trying to fetch user role
**Root Cause**: Using anon key to query users table that has RLS
**Solution**: Use service role key in server-side APIs for user verification
**Lesson**: Server endpoints need higher privileges than client-side queries

### Problem 5: Admin Login Redirects to Regular Login
**Symptom**: `/admin-login` page shows `/login` after accessing
**Root Cause**: Middleware treated `/admin-login` as protected route
**Solution**: Exclude `/admin-login` from protected routes, treat as auth page
**Lesson**: Login pages must never redirect to themselves

### Problem 6: Admin Dashboard Doesn't Load After Login
**Symptom**: After login succeeds, still shows login page with query param loop
**Root Cause**: Session not properly set before redirect
**Solution**: Use Supabase client's `signInWithPassword()` which sets cookies properly
**Lesson**: Always sign in with Supabase client, not custom API endpoints

### Problem 7: Route Group Hot-Reload Issues
**Symptom**: Windows dev server fails to reload routes with `(groupName)/` syntax
**Root Cause**: Next.js route groups don't work reliably in Windows development
**Solution**: Use regular folders instead: `/patient/` instead of `/(patient)/`
**Lesson**: Test folder structure on actual dev OS; route groups work better on Unix

### Problem 8: RLS Advisor Performance Warnings
**Symptom**: Supabase shows warnings about auth function re-evaluation
**Root Cause**: Policies use `auth.uid()` directly instead of caching
**Solution**: Wrap all auth calls with `(SELECT auth.uid())`
**Lesson**: Database performance matters even with RLS; optimize policies

### Problem 9: Multiple Permissive Policies Performance
**Symptom**: Table with 3 SELECT policies for doctor/admin/patient access
**Root Cause**: PostgreSQL evaluates each policy in sequence
**Solution**: Combine policies using OR conditions in single policy
**Lesson**: One smart policy beats three separate policies

### Problem 10: Logout GET Request Returns 302
**Symptom**: Some integrations expect 200, get 302
**Root Cause**: Logout endpoint redirects to `/login`
**Solution**: This is correct behavior; 302 is standard for logout redirects
**Lesson**: Logout should redirect; 302 is expected HTTP response code

### Problem 11: Terminology Confusion in UI
**Symptom**: Mixed use of "Admin", "Patient", "Pharmacist" in code
**Root Cause**: Business terminology differs from technical roles
**Solution**: Standardize UI terms while keeping backend roles:
  - UI: "Customer" / Backend: `role: 'patient'`
  - UI: "Pharmacist" / Backend: `role: 'admin'`
  - UI: "Doctor" / Backend: `role: 'doctor'`
**Lesson**: Separate UI terminology from database schema

### Problem 12: Admin Account Creation Endpoint Errors
**Symptom**: Trying to insert into non-existent columns
**Root Cause**: user_profiles table doesn't have `email` or `role` columns
**Solution**: Only insert existing columns: `user_id`, `full_name`, `specialty`
**Lesson**: Know your schema; verify column names before inserting

---

## DATABASE ARCHITECTURE RULES

### Table Design Principles
1. **Always Use UUID Primary Keys**: `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
2. **Always Timestamp**: `created_at`, `updated_at` with timezone
3. **Foreign Key Cascades**: Usually `ON DELETE CASCADE` for data integrity
4. **Ownership Fields**: Every user-data table has `user_id`, `patient_id`, `doctor_id`, etc.
5. **Status Enums**: Use CHECK constraints for allowed values

### RLS Policy Template
```sql
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

CREATE POLICY "policy_name" ON table_name
  FOR SELECT
  USING (
    user_id = (SELECT auth.uid()) OR
    EXISTS (SELECT 1 FROM users WHERE id = (SELECT auth.uid()) AND role = 'admin')
  );
```

### Never Do This
- ❌ Direct SQL without RLS checks
- ❌ Hardcoded user IDs in queries
- ❌ Trust client-side role verification
- ❌ Skip audit logs for sensitive operations
- ❌ Use `SECURITY INVOKER` on functions (use `SECURITY DEFINER`)

---

## FRONTEND ARCHITECTURE RULES

### Component Organization
- **Pages**: Route-specific logic, protected by middleware
- **Components**: Reusable UI, no business logic
- **Services**: API calls via Next.js route handlers
- **Lib**: Utilities (supabase-client, helpers)

### Client vs Server Components
```typescript
// ✅ Server Component (for protected pages)
export default async function Page() {
  const user = await getUser(); // Uses server client
  if (!user) redirect("/login");
}

// ✅ Client Component (for interactive forms)
"use client";
export default function LoginForm() {
  const { data } = await supabase.auth.signInWithPassword(...);
}
```

### Never Do This
- ❌ Mix "use client" with server-only imports (cookies, redirect)
- ❌ Call APIs with incorrect HTTP methods (GET for mutations)
- ❌ Fetch user data from users table without service role in servers
- ❌ Redirect before session is established
- ❌ Store auth tokens in localStorage (Supabase handles cookies)

---

## API ENDPOINT PATTERNS

### Protected Endpoints
```typescript
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const supabase = createClient(..., {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Verify role if needed
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userData?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
```

### Public Endpoints
- Minimal validation
- Use anon key only
- Enforce rate limiting in production
- Log all requests

---

## STYLING CONVENTIONS

### Color Palette
RoyaltyMeds uses a professional green, blue, and white theme:
- **Primary Green**: `#15803d` (green-600), `#16a34a` (green-700) - Main actions and brand
- **Secondary Blue**: `#0284c7` (blue-600), `#06b6d4` (cyan) - Secondary actions and doctor portal
- **White**: `#ffffff` - Backgrounds and text on dark backgrounds
- **Gray**: `gray-50` to `gray-900` - Neutral elements and text

### Tailwind CSS Rules
- Use Tailwind v4.0 with green primary, blue secondary
- Mobile-first approach: `mobile → sm: → md: → lg:`
- Consistent spacing: Use `gap-`, `px-`, `py-` consistently
- All interactive elements (buttons, links) use green primary or blue secondary
- Never use indigo, slate, or amber colors (legacy theme)

### Component Themes

**Landing Page (Public)**
- Background: `bg-white` with section alternates (`bg-gray-50`)
- Header: `bg-white border-b border-gray-200`
- Logo: Green R (`bg-green-600`)
- Buttons: `bg-green-600 hover:bg-green-700`
- CTAs: Green or blue gradients (`from-green-600 to-blue-600`)
- Footer: `bg-gray-900 text-gray-300`

**Customer Portal** (`/patient/*`)
- Navigation: `bg-white border-b border-gray-200`
- Portal title: `text-green-600` ("RoyaltyMeds Customer Portal")
- Main background: `bg-white`
- Buttons: `bg-green-600 hover:bg-green-700`

**Doctor Portal** (`/doctor/*`)
- Navigation: `bg-blue-600 border-b border-blue-700` (darker than customer)
- Portal title: `text-white` ("RoyaltyMeds Doctor Portal")
- Main background: `bg-white`
- Buttons: `bg-blue-600 hover:bg-blue-700`
- Active links: `hover:bg-blue-700`

**Pharmacist Portal** (`/admin/*`)
- Navigation: Green or dark theme for pharmacy branding
- Portal title: "Pharmacy" terminology
- Login page: White background with green accents
- Buttons: `bg-green-600 hover:bg-green-700`

**Authentication Pages**
- `/login`: White background, green primary buttons
- `/admin-login`: White background, green primary buttons
- `/signup`: White background, green primary buttons
- Focus states: `focus:ring-green-500` (green) or `focus:ring-blue-500` (blue)

### Never Do This
- ❌ Use indigo, slate, or amber colors
- ❌ Use gradient backgrounds on main pages (except CTA sections)
- ❌ Mix green and blue in the same component
- ❌ Use dark themes for main portals (white background standard)
- ❌ Change logo color from green
- ❌ Use HIPAA compliance in UI footer

---

## ENVIRONMENT VARIABLES REQUIRED

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyxxx...
SUPABASE_SERVICE_ROLE_KEY=eyxxx... # Server-side only

# Not needed for current phase
# STRIPE_SECRET_KEY=sk_xxx
# TWILIO_ACCOUNT_SID=ACxxx
# OPENAI_API_KEY=sk-xxx
```

---

## CURRENT PROJECT STATE

### Completed Phases
- ✅ Phase 1: Project Setup & Architecture
- ✅ Phase 2: Authentication & User Management
- ✅ Phase 3: Database Design & Core Models
- ✅ Phase 4: Patient Portal
- ✅ Phase 5: Doctor Interface (Dashboard, prescriptions, patient search)
- ✅ Phase 5.5: Pharmacist Authentication & Account Management

### Build Status
- Routes: 44 total
- TypeScript: 0 errors
- ESLint: 0 errors
- Build time: 6-7 seconds
- Bundle size: 106 kB (first load JS)

### Default Credentials
- **Pharmacist Login**: `/admin-login`
  - Email: `royaltymedsadmin@royaltymeds.com`
  - Password: `Options123$`
- **Test Customer**: Create via `/signup`
- **Test Doctor**: Create via `/admin/doctors`

### Remaining Phases (37.5%)
- Phase 6: Payment Integration (Stripe)
- Phase 7: Notifications (Email, SMS, In-app)
- Phase 8: Analytics & Reporting

---

## BEFORE EXECUTING ANY CODE CHANGE

**CHECKLIST FOR AI:**

1. ☑ Is this change consistent with the three roles (customer/doctor/pharmacist)?
2. ☑ Does this use proper authentication (server client vs client library)?
3. ☑ Does this respect RLS policies and role-based access?
4. ☑ Are terminology and UI labels consistent with design (customer, pharmacist)?
5. ☑ Is the database schema understood and columns verified?
6. ☑ Will this introduce new security vulnerabilities?
7. ☑ Does this follow the established folder/component structure?
8. ☑ Are proper error messages logged (not exposing sensitive data)?
9. ☑ Have edge cases been considered (missing data, auth failures)?
10. ☑ Will this build without errors?

---

## QUICK REFERENCE

| Component | Location | Key Pattern |
|-----------|----------|------------|
| Middleware | `middleware.ts` | Route protection, role-based redirect |
| Supabase Client | `lib/supabase-client.ts` | Client-side auth wrapper |
| Auth Pages | `app/(auth)/login`, `signup`, `admin-login` | Session management |
| Customer Portal | `app/patient/*` | Own data access via RLS |
| Doctor Portal | `app/doctor/*` | Prescription management |
| Pharmacist Portal | `app/admin/*` | Full admin capabilities |
| API Routes | `app/api/*` | Server-side business logic |
| Database | `supabase/migrations/*.sql` | Schema + RLS policies |

---

**Last Updated:** January 12, 2026
**Maintained By:** AI Assistant (RoyaltyMeds Development Team)
**Next Review:** After Phase 6 completion
