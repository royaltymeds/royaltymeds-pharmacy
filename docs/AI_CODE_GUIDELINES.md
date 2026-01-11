# AI Code Modification Guidelines for RoyaltyMeds Platform

**Last Updated:** January 10, 2026  
**Phase:** 2 - Authentication System  
**Status:** Production Ready

## Executive Summary

This document captures critical lessons learned while implementing the Phase 2 authentication system. These guidelines prevent authentication failures and ensure code consistency across the codebase.

---

## Critical Authentication Patterns

### 1. **Server-Side Auth: Always Use Supabase SSR Client**

**Pattern - DO THIS:**
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
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options as CookieOptions);
            });
          } catch {
            // Handle error
          }
        },
      },
    }
  );
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
}
```

**Anti-Pattern - DO NOT DO THIS:**
```typescript
// ❌ WRONG - Manual token extraction
const authToken = cookieStore.get("sb-auth-token");
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    global: {
      headers: {
        Authorization: `Bearer ${authToken.value}`,
      },
    },
  }
);
```

**Why:** 
- Manual token handling doesn't sync cookies properly
- Server can't validate session state
- User gets logged out when navigating between pages
- SSR client automatically manages cookie lifecycle

---

### 2. **Client-Side Auth: Use Cookie Storage**

**Pattern - DO THIS:**
```typescript
// lib/supabase-client.ts
import { createClient } from "@supabase/supabase-js";

class CookieStorage {
  getItem(key: string): string | null {
    if (typeof window === "undefined") return null;
    const value = document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${key}=`))
      ?.split("=")[1];
    return value ? decodeURIComponent(value) : null;
  }

  setItem(key: string, value: string): void {
    if (typeof window === "undefined") return;
    const expires = new Date();
    expires.setTime(expires.getTime() + 7 * 24 * 60 * 60 * 1000);
    document.cookie = `${key}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
  }

  removeItem(key: string): void {
    if (typeof window === "undefined") return;
    document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  }
}

export function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        storage: new CookieStorage(),
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    }
  );
}
```

**Why:**
- Client-side localStorage doesn't sync with server
- Server-side session checks fail
- Cookies are automatically sent with requests
- Middleware can validate sessions

---

### 3. **Middleware: Use Supabase SSR for Session Validation**

**Pattern - DO THIS:**
```typescript
// middleware.ts
import { createServerClient, type CookieOptions } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
  let response = NextResponse.next({
    request: { headers: req.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options as CookieOptions);
          });
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();
  
  // Check protected routes
  if (!session && isProtectedRoute) {
    return NextResponse.redirect(new URL("/login", req.nextUrl.origin));
  }

  return response;
}
```

**Anti-Pattern - DO NOT DO THIS:**
```typescript
// ❌ WRONG - Manual cookie checking
const authToken = req.cookies.get("sb-auth-token");
if (!authToken && isProtectedRoute) {
  return NextResponse.redirect(new URL("/login", req.nextUrl.origin));
}
```

**Why:**
- Manual cookie checking doesn't refresh expired sessions
- Server doesn't validate JWT
- Session state becomes stale
- Supabase SSR handles automatic token refresh

---

## Admin User Creation Pattern

### **Always Use Admin API for Creating Confirmed Users**

**Pattern - DO THIS:**
```typescript
// /api/auth/signup-rest/route.ts
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminUrl = `${supabaseUrl}/auth/v1/admin/users`;

const adminResponse = await fetch(adminUrl, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "apikey": serviceRoleKey,
    "Authorization": `Bearer ${serviceRoleKey}`,
  },
  body: JSON.stringify({
    email,
    password,
    email_confirm: true, // AUTO-CONFIRM
    user_metadata: {
      role: "patient",
    },
  }),
});

const adminData = await adminResponse.json();
// ✅ CORRECT: User object is at top level
const userId = adminData.id;
const userEmail = adminData.email;
```

**Critical Points:**
- **NEVER use REST `/auth/v1/signup`** - it creates unconfirmed users
- **ALWAYS set `email_confirm: true`** - user can log in immediately
- **Response structure:** User object is at TOP LEVEL, not nested in `.user`
  - ✅ `adminData.id` (correct)
  - ❌ `adminData.user?.id` (wrong - returns undefined)
- **Requires service role key** - use `SUPABASE_SERVICE_ROLE_KEY`, not anon key

---

## Three-Step Signup Flow

**All three steps MUST complete in sequence:**

```typescript
// Step 1: Create auth user (confirmed)
POST /api/auth/signup-rest
  → Auth.users record created
  → Returns userId

// Step 2: Create public.users record
POST /api/auth/create-profile (with userId)
  → public.users record created
  → Links to auth.users via UUID

// Step 3: Create user_profiles record
POST /api/auth/create-profile (same request)
  → user_profiles created
  → Stores full_name, role, etc.
```

**If any step fails, entire signup fails. All three must succeed.**

---

## Protected Page Pattern

**Apply this pattern to ALL protected pages (dashboard, profile, etc.):**

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
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options as CookieOptions);
            });
          } catch {}
        },
      },
    }
  );

  // Get authenticated user
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user data from public tables
  const { data: userProfile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  // Use user and userProfile data
  // Return JSX
}
```

**Checklist:**
- [ ] Use `createServerClient` from `@supabase/ssr`
- [ ] Create cookies helper with `getAll()` and `setAll()`
- [ ] Call `supabase.auth.getUser()`
- [ ] Redirect to `/login` if no user
- [ ] Query public tables with `user.id`

---

## Form Sizing Best Practices

**For signup/login forms:**
- Add `py-8` padding to outer container
- Use `max-w-md` for form width
- Add `max-h-[calc(100vh-4rem)] overflow-y-auto` for scrolling on small screens
- Reduce spacing between fields to `space-y-3` instead of `space-y-4`
- Use `text-xs` for labels instead of `text-sm`
- Use `py-1.5` for inputs instead of `py-2`
- Never allow form to extend beyond viewport

---

## Common Pitfalls & Solutions

| Pitfall | Solution |
|---------|----------|
| User logs out when navigating between pages | Use Supabase SSR client on all protected pages |
| Session not persisting after login | Use cookie storage, not localStorage |
| Middleware not protecting routes | Use `createServerClient` for session validation |
| Admin API returns undefined user ID | Access `adminData.id`, not `adminData.user?.id` |
| Auth user created but can't login | Use `email_confirm: true` in admin API |
| Profile creation fails | Ensure userId from signup step is passed to create-profile |
| Form doesn't fit on screen | Use smaller padding, text size, and input height |
| Session expired after page reload | Ensure middleware refreshes token automatically |

---

## Package Dependencies

**Required for authentication:**
- `@supabase/supabase-js` - Client library
- `@supabase/ssr` - Server-side auth management (CRITICAL)
- `next` - Next.js framework

**Install with:**
```bash
npm install @supabase/ssr --legacy-peer-deps
```

---

## Testing Checklist for Auth Changes

When modifying authentication code:

1. **Signup Flow:**
   - [ ] Can create new account
   - [ ] Auth user appears in Supabase Dashboard → Auth → Users
   - [ ] User marked as "Confirmed"
   - [ ] public.users record created with matching UUID
   - [ ] user_profiles record created with full_name

2. **Login Flow:**
   - [ ] Can log in with created credentials
   - [ ] Session persists in cookies
   - [ ] Dashboard loads without redirect
   - [ ] User data displays correctly

3. **Navigation:**
   - [ ] Can click "Profile" link without logout
   - [ ] Can return to dashboard from profile
   - [ ] Page refresh maintains authentication
   - [ ] Sign out works and clears session

4. **Build:**
   - [ ] `npm run build` succeeds with 0 errors
   - [ ] All pages compile (14 routes)
   - [ ] No TypeScript errors
   - [ ] Production build ready

---

## Code Review Questions

When reviewing auth-related changes, ask:

1. **Is Supabase SSR used?** - All server-side auth must use `createServerClient`
2. **Are cookies involved?** - Session management must use cookies, not localStorage
3. **Is this a protected page?** - Ensure redirect to `/login` if no user
4. **Is the flow complete?** - All three signup steps implemented?
5. **Does it match the pattern?** - Compare against patterns in this document
6. **Will it break existing pages?** - Ensure consistency across all auth pages

---

## Version History

| Date | Phase | Status | Key Changes |
|------|-------|--------|-------------|
| 2026-01-11 | 2 | Complete | Initial auth system, Supabase SSR migration |
| - | - | - | - |

