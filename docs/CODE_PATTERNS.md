# Code Pattern Reference - Server-Side Auth with Async Server Components

## Pattern 1: Protected Layout with Server-Side Auth Check

All protected layouts follow this pattern:

```typescript
import { getUser } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function LayoutName({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side auth check
  const user = await getUser();
  
  if (!user) {
    redirect("/login");
  }

  return (
    <div>
      {/* Navigation with user.email */}
      <nav>
        <span>{user.email}</span>
        <Link href="/api/auth/logout">Logout</Link>
      </nav>
      
      {/* Main content */}
      <main>{children}</main>
    </div>
  );
}
```

**Key Points:**
- `async` function keyword
- `await getUser()` call
- Redirect if `!user`
- User data available for rendering

## Pattern 2: Async Server Component with Database Query

For pages that need to fetch data:

```typescript
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

export default async function PageName() {
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
          } catch (error) {
            console.error("Cookie error:", error);
          }
        },
      },
    }
  );

  // Fetch user (protected by layout auth check)
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null; // Layout protection means this shouldn't happen

  // Fetch data for the page
  const { data: items } = await supabase
    .from("table_name")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      {/* Render items */}
    </div>
  );
}
```

**Key Points:**
- `async` function keyword
- Create server client inside component
- Use `await cookies()`
- Fetch data on server, pass to client
- No `useEffect` or `useState` needed

## Pattern 3: Client Component with API Endpoints

For interactive pages that need client-side logic:

```typescript
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PageName() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/endpoint");
        if (response.ok) {
          const json = await response.json();
          setData(json);
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {/* Render data */}
    </div>
  );
}
```

**Key Points:**
- `"use client"` directive
- Protected by parent layout's server-side auth check
- Use API endpoints (protected by middleware)
- Client-side state and effects for interactivity

## Pattern 4: Middleware Session Refresh

The middleware runs on every request to protected routes:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
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

  // Refresh session - ensures auth.users cookies stay valid
  await supabase.auth.getSession();

  return response;
}

export const config = {
  matcher: [
    "/(auth.*)",
    "/(patient.*)",
    "/(doctor.*)",
    "/(admin.*)",
    "/profile",
  ],
};
```

**Key Points:**
- Runs on every request to protected routes
- Single responsibility: refresh session
- No redirect logic (layouts handle auth checks)
- Ensures cookies fresh across function invocations

## Pattern 5: Using Server Auth Helper

For checking auth from `/lib/supabase-server.ts`:

```typescript
import { getUser } from "@/lib/supabase-server";

// In async Server Component or Layout
const user = await getUser();

if (!user) {
  redirect("/login");
}

// User is authenticated, continue rendering
```

## Why These Patterns Work on Netlify

1. **Middleware refreshes on every request** - Even though Netlify isolates function instances, middleware runs first and refreshes cookies

2. **Async Server Components have fresh context** - When a page renders, middleware has already run in that request's context

3. **Layouts enforce auth before rendering** - Page components never render if user isn't authenticated

4. **No distributed session issues** - Everything relies on Supabase's cookies, which are designed to work across stateless functions

## Migration from Old Pattern

### From (Client Component with useEffect):
```typescript
"use client";
export default function Page() {
  const [user, setUser] = useState(null);
  useEffect(() => {
    supabase.auth.getUser().then(user => setUser(user));
  }, []);
  // ...
}
```

### To (Async Server Component):
```typescript
export default async function Page() {
  const user = await getUser();
  if (!user) redirect("/login");
  // ...
}
```

Benefits:
- Simpler code (no state/effects)
- Better performance (no hydration mismatch)
- Data fetched on server (slower network not an issue)
- Works correctly on Netlify serverless

## Common Mistakes to Avoid

❌ **Don't:**
```typescript
// Using useEffect to check auth on client
export default function Page() {
  const [user, setUser] = useState(null);
  useEffect(() => {
    getUser().then(setUser);
  }, []);
  // User might be null during render = session lost feeling
}
```

✅ **Do:**
```typescript
// Check auth on server, only render if authenticated
export default async function Page() {
  const user = await getUser();
  if (!user) redirect("/login");
  // User is guaranteed to exist here
}
```

❌ **Don't:**
```typescript
// Middleware redirecting users
export async function middleware(req) {
  if (!user) return NextResponse.redirect("/login");
}
```

✅ **Do:**
```typescript
// Middleware only refreshes session
export async function middleware(req) {
  await supabase.auth.getSession();
  return response;
}
```

## Testing Auth Flow

Test that session persists across requests:

1. Load `/patient/home` → middleware refreshes session
2. Click to `/patient/orders` → middleware refreshes session (new function instance)
3. User should stay logged in

This works because:
- Each request goes through middleware
- Middleware refreshes the session
- New function instance gets fresh cookies
- Server components can read user from fresh context
