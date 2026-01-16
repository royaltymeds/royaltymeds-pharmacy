# GitHub Royalty Meds Telehealth Authentication Analysis

## Executive Summary

The Royalty Meds Telehealth repository (https://github.com/royaltymeds/royaltymeds-telehealth) implements a **Supabase-based authentication system using Next.js 15 with SSR (Server-Side Rendering)** that successfully handles sessions on Netlify and other edge environments. Their key success factors are:

1. **@supabase/ssr package** - Uses the SSR-optimized Supabase client
2. **Middleware-based session refresh** - Proactively refreshes sessions in middleware
3. **Server Components for auth checks** - Uses async Server Components to fetch user data
4. **Client-side Supabase client** - Uses browser client for mutations in client components
5. **Separate server and client utilities** - Clear separation between server and client Supabase instances
6. **No external session storage** - Relies entirely on Supabase auth cookies

---

## File-by-File Analysis

### 1. **middleware.ts** - Session Management Layer

**File Path:** `middleware.ts`

**Complete Contents:**
```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Refresh session if expired - required for Server Components
  await supabase.auth.getUser()

  return response
}

export const config = {
  matcher:
    ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
```

**Key Implementation Details:**

- **Middleware runs on every request** - This is critical for Netlify compatibility
- **createServerClient from @supabase/ssr** - Not the regular `createClient`, but SSR-specific
- **Cookie handling** - Middleware intercepts both request and response cookies
- **Session refresh via `getUser()`** - Calling `getUser()` in middleware ensures tokens are refreshed before Server Components execute
- **Matcher pattern** - Excludes static assets, images, and favicon to avoid unnecessary middleware runs
- **Response wrapping** - Returns a `NextResponse` with cookies set on both request and response objects

**Why This Works on Netlify:**
- Netlify Edge Functions can run middleware
- The explicit cookie synchronization between request/response prevents session loss in edge environments
- Regular session refresh prevents token expiration issues

---

### 2. **app/layout.tsx** - Root Layout (NO AUTH PROVIDER)

**File Path:** `app/layout.tsx`

**Complete Contents:**
```typescript
import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Royalty Meds Telehealth - Healthcare Platform',
  description: 'Secure telemedicine platform for healthcare professionals and patients.',
  icons: {
    icon: '/favicon.svg',
  },
  openGraph: {
    title: 'Royalty Meds Telehealth - Healthcare Platform',
    description: 'Secure telemedicine platform for healthcare professionals and patients.',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Royalty Meds Telehealth - Healthcare Platform',
    description: 'Secure telemedicine platform for healthcare professionals and patients.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="apple-touch-icon" sizes="180x180" href="/favicon.svg" />
        <meta name="theme-color" content="#10b981" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
```

**Key Implementation Details:**

- **NO ClientAuthProvider or Context Providers** - Unlike typical auth implementations, they don't wrap their app in context providers
- **Metadata only** - The root layout is purely for SEO, fonts, and basic HTML structure
- **Children passed through directly** - No middleware wrapping

**Why This Approach Works:**
- Avoids context provider overhead and potential hydration issues
- Server Components naturally have access to Supabase via async operations
- Reduces JavaScript bundle size - no client-side auth state management
- Simpler to deploy on edge platforms like Netlify

---

### 3. **app/page.tsx** - Home/Redirect Page

**File Path:** `app/page.tsx`

**Complete Contents:**
```typescript
import { redirect } from 'next/navigation'

export default function Home() {
  redirect('/dashboard')
}
```

**Key Implementation Details:**

- **Simple redirect** - The home page immediately redirects to `/dashboard`
- **No auth check here** - The auth check happens at the dashboard level (Server Component)
- **Redirect from static page** - Uses Next.js's built-in `redirect()` function

---

### 4. **lib/auth.ts** - Authentication Utilities

**File Path:** `lib/auth.ts`

**Complete Contents:**
```typescript
import { createClient } from './supabaseServer'
import { redirect } from 'next/navigation'

export async function getUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/signin')
  }

  return user
}

export async function getClinician(userId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('clinicians')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    // If no clinician record exists, return null instead of throwing
    if (error.code === 'PGRST116') {
      return null
    }
    throw new Error(`Failed to get clinician: ${error.message}`)
  }

  return data
}

export async function ensureClinicianExists(
  userId: string,
  userData?: { full_name?: string; specialty?: string; email?: string; role?: string }
) {
  const supabase = await createClient()

  // Get current user data (this works in server context)
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error('Unable to authenticate user')
  }

  // Check if clinician record exists
  let existingClinician = await getClinician(userId)

  if (existingClinician) {
    // Update email if it's missing and we have user data
    const updates: any = {}
    let needsUpdate = false

    if (!existingClinician.email && user.email) {
      updates.email = user.email
      needsUpdate = true
    }

    // Ensure demodoctor@telemed.com has admin role
    const userEmail = userData?.email || user.email
    if (userEmail === 'demodoctor@telemed.com' && existingClinician.role !== 'admin') {
      updates.role = 'admin'
      needsUpdate = true
    }

    if (needsUpdate) {
      updates.updated_at = new Date().toISOString()
      await supabase
        .from('clinicians')
        .update(updates)
        .eq('id', userId)

      // Update the returned object
      existingClinician = { ...existingClinician, ...updates }
    }

    return existingClinician
  }

  // Determine role based on userData, email, or default
  let role = userData?.role || 'clinician'
  const userEmail = userData?.email || user.email
  if (userEmail === 'demodoctor@telemed.com') {
    role = 'admin' // Override for demo doctor
  }

  // If not, create one with available data
  const { data, error } = await supabase
    .from('clinicians')
    .insert({
      id: userId,
      full_name: userData?.full_name || user.user_metadata?.full_name || 'Unknown Clinician',
      specialty: userData?.specialty || user.user_metadata?.specialty || null,
      role: role,
      email: user.email,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create clinician record: ${error.message}`)
  }

  return data
}

export async function requireAuth() {
  return await getUser()
}
```

**Key Implementation Details:**

- **getUser() - Protection Function** - Automatically redirects to `/signin` if no authenticated user
- **Server-side only** - Uses `createClient()` from supabaseServer
- **Database profile sync** - `ensureClinicianExists()` creates/updates user profiles in the database
- **Role-based logic** - Handles role assignment and special cases (demo doctor)
- **Error handling** - Graceful handling of missing profiles vs auth errors

**Why This Works:**
- Server Components can call `getUser()` directly
- Automatic redirects prevent accidental exposure of protected content
- Profile creation happens server-side with proper error handling
- Uses Supabase's built-in auth metadata for extended user data

---

### 5. **lib/supabaseServer.ts** - Server-Side Supabase Client

**File Path:** `lib/supabaseServer.ts`

**Complete Contents:**
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch (error) {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
      },
    }
  )
}

export function createClientForApi(request: NextRequest) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          // Can't set cookies in API routes during request handling
          // Cookies are set via response headers
        },
        remove(name: string, options: any) {
          // Can't remove cookies in API routes during request handling
        },
      },
    }
  )
}
```

**Key Implementation Details:**

- **createClient() for Server Components** - Uses `cookies()` from Next.js (async)
- **createClientForApi() for Route Handlers** - Takes a NextRequest for API route context
- **createServerClient from @supabase/ssr** - Handles cookie management server-side
- **Cookie setAll error handling** - Gracefully ignores errors if middleware already handles it
- **No service role key** - Uses anon key only, with RLS for security

**Why This Works:**
- Separate factories for different contexts (Server Components vs Route Handlers)
- Proper cookie handling for edge environments
- Middleware handles the heavy lifting of session refresh

---

### 6. **lib/supabase.ts** - Client-Side Supabase Client

**File Path:** `lib/supabase.ts`

**Complete Contents:**
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**Key Implementation Details:**

- **Minimal browser client factory** - Simple wrapper around `createBrowserClient`
- **createBrowserClient from @supabase/ssr** - Not the old `createClient`, but SSR-aware
- **Public keys only** - Environment variables are public (safe)
- **Used in 'use client' components** - For sign-in, sign-up, mutations

**Why This Works:**
- Very lightweight
- Works with browser's native cookie handling
- No middleware needed for browser-initiated requests (middleware still refreshes)

---

### 7. **app/signin/page.tsx** - Sign-In Page (Client Component)

**File Path:** `app/signin/page.tsx`

**Complete Contents:**
```typescript
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      if (data.user) {
        // Ensure clinician record exists via server action
        const formData = new FormData()
        formData.append('userId', data.user.id)
        formData.append('fullName', data.user.user_metadata?.full_name || '')
        formData.append('specialty', data.user.user_metadata?.specialty || '')

        const response = await fetch('/api/ensure-clinician', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          throw new Error('Failed to create clinician profile')
        }

        router.push('/dashboard')
      }
    } catch (error: any) {
      setError(error.message || 'Failed to sign in')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-lg shadow-lg p-8 border-t-4 border-green-600">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              <span className="text-green-600">R</span>oyalty Meds Telehealth
            </h1>
            <p className="text-slate-600">Sign in to your account</p>
          </div>

          <form onSubmit={handleSignIn} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-800 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent text-slate-900"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-800 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent text-slate-900"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600">
              Don't have an account?{' '}
              <Link href="/signup" className="text-green-600 hover:text-green-700 font-medium">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
```

**Key Implementation Details:**

- **'use client' directive** - This is a client component
- **Browser Supabase client** - Uses `createClient()` from `@/lib/supabase`
- **signInWithPassword()** - Direct Supabase auth method
- **Profile creation via API** - After successful auth, calls `/api/ensure-clinician`
- **Router redirect** - Uses `useRouter().push()` to navigate to dashboard
- **Error states** - Displays error messages from Supabase

**Why This Works:**
- Client components handle interactive forms
- Server API endpoint ensures profile creation happens securely
- Combines client-side auth with server-side profile management

---

### 8. **app/signup/page.tsx** - Sign-Up Page (Client Component)

**File Path:** `app/signup/page.tsx`

**Complete Contents:**
```typescript
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SignUp() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [role, setRole] = useState<'clinician' | 'admin'>('clinician')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            specialty: specialty,
          },
        },
      })

      if (authError) throw authError

      if (authData.user) {
        // Ensure clinician record exists via server action
        const formData = new FormData()
        formData.append('userId', authData.user.id)
        formData.append('fullName', fullName)
        formData.append('specialty', specialty)
        formData.append('role', role)

        const response = await fetch('/api/ensure-clinician', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          throw new Error('Failed to create clinician profile')
        }

        router.push('/dashboard')
      }
    } catch (error: any) {
      setError(error.message || 'Failed to sign up')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-lg shadow-lg p-8 border-t-4 border-green-600">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              <span className="text-green-600">R</span>oyalty Meds Telehealth
            </h1>
            <p className="text-slate-600">Create your account</p>
          </div>

          <form onSubmit={handleSignUp} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-slate-800 mb-2">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent text-slate-900"
                placeholder="Dr. Jane Smith"
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-slate-800 mb-2">
                Role
              </label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value as 'clinician' | 'admin')}
                className="w-full px-4 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent text-slate-900"
              >
                <option value="clinician">Nurse</option>
                <option value="admin">Doctor (Admin)</option>
              </select>
              <p className="text-xs text-slate-500 mt-1">
                Doctors have admin privileges to manage patient records and duplicates
              </p>
            </div>

            <div>
              <label htmlFor="specialty" className="block text-sm font-medium text-slate-800 mb-2">
                Specialty
              </label>
              <input
                id="specialty"
                type="text"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                className="w-full px-4 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent text-slate-900"
                placeholder="Family Medicine"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-800 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent text-slate-900"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-800 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent text-slate-900"
                placeholder="••••••••"
              />
              <p className="text-xs text-slate-500 mt-1">Must be at least 6 characters</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600">
              Already have an account?{' '}
              <Link href="/signin" className="text-green-600 hover:text-green-700 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
```

**Key Implementation Details:**

- **Similar to signin** but calls `signUp()` instead of `signInWithPassword()`
- **User metadata** - Passes full_name and specialty as options
- **Role selection** - Allows users to select their role (clinician or admin/doctor)
- **Server profile creation** - Also calls `/api/ensure-clinician` after signup

---

### 9. **app/api/ensure-clinician/route.ts** - Profile Creation Endpoint

**File Path:** `app/api/ensure-clinician/route.ts`

**Complete Contents:**
```typescript
import { ensureClinicianExists } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const userId = formData.get('userId') as string
    const fullName = formData.get('fullName') as string
    const specialty = formData.get('specialty') as string
    const role = formData.get('role') as string
    const email = formData.get('email') as string

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const clinician = await ensureClinicianExists(userId, {
      full_name: fullName || undefined,
      specialty: specialty || undefined,
      role: role || undefined,
    })

    return NextResponse.json({ success: true, clinician })
  } catch (error: any) {
    console.error('Error ensuring clinician exists:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create clinician profile' },
      { status: 500 }
    )
  }
}
```

**Key Implementation Details:**

- **Route Handler** - Uses Next.js App Router Route Handler
- **POST method** - Accepts form data from client
- **ensureClinicianExists()** - Calls the server auth utility
- **Error handling** - Validates userId and catches errors
- **Server-side profile creation** - Ensures DB profile exists after auth

---

### 10. **app/dashboard/page.tsx** - Protected Page (Server Component)

**File Path:** `app/dashboard/page.tsx`

**Key Implementation Details (excerpt):**
```typescript
import Layout from '@/components/Layout'
import { getUser, getClinician, ensureClinicianExists } from '@/lib/auth'
import { createClient } from '@/lib/supabaseServer'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import DashboardClient from './DashboardClient'

async function getDashboardData() {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user)
      return { stats: {...}, todayAppointments: [], ... }
    
    // Query database with user context
    const { count: totalPatients } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true })
      .eq('clinician_id', user.id)
    
    // ... more queries ...
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return { stats: {...}, ... }
  }
}

export default async function Dashboard() {
  const user = await getUser()  // ← Automatically redirects if not authenticated

  // Ensure clinician record exists
  const clinician = await ensureClinicianExists(user.id, {
    full_name: user.user_metadata?.full_name,
    specialty: user.user_metadata?.specialty,
  })

  if (!clinician) {
    throw new Error('Unable to create clinician profile. Please contact support.')
  }

  const dashboardData = await getDashboardData()

  return (
    <Layout>
      <div className="max-w-full">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          Welcome, {clinician?.full_name || user.email}
        </h1>
        <DashboardClient initialData={dashboardData} />
      </div>
    </Layout>
  )
}
```

**Key Implementation Details:**

- **Async Server Component** - The entire component is async
- **getUser() protection** - Automatically redirects unauthenticated users
- **ensureClinicianExists()** - Ensures profile is synced
- **Direct DB queries** - Uses `createClient()` to query Supabase directly
- **No context providers needed** - Data flows from server to client component

**Why This Works:**
- Server Component runs on the server, so sessions are always fresh
- `getUser()` handles authentication protection
- DB queries execute server-side with the user's auth context
- Client component (DashboardClient) receives pre-fetched data

---

## Package.json - Key Dependencies

**File Path:** `package.json`

**Key Dependencies:**
```json
{
  "dependencies": {
    "@supabase/ssr": "^0.8.0",      // ← Critical for Netlify/Edge compatibility
    "@supabase/supabase-js": "^2.89.0",
    "next": "^15.1.6",              // ← Latest Next.js with improved SSR
    "react": "^19.2.3",
    "react-dom": "^19.2.3",
    "typescript": "^5.9.3"
  }
}
```

**Why @supabase/ssr is Critical:**
- Provides `createServerClient` and `createBrowserClient`
- Handles cookie management in edge and server contexts
- SSR-optimized session refresh
- Works seamlessly with Next.js middleware

---

## Architecture Diagram

```
Request Flow on Netlify:
┌─────────────────────────────────────────────────────────────────┐
│                      BROWSER REQUEST                             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│            NEXT.JS MIDDLEWARE (middleware.ts)                    │
│ • Intercepts every request                                       │
│ • createServerClient reads cookies from request                  │
│ • Calls supabase.auth.getUser() to refresh session             │
│ • Sets updated cookies on response                               │
│ • Passes through all requests (nothing blocked here)             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
        ┌────────────────────────────────┐
        │   Protected Server Component?  │
        │   (e.g., /dashboard)           │
        └───────────────┬────────────────┘
                        │
          ┌─────────────┴──────────────┐
          │                            │
          ▼                            ▼
    ┌──────────────┐          ┌──────────────┐
    │ getUser()    │          │ createClient │
    │ redirects    │          │ queries DB   │
    │ to /signin   │          │ with user    │
    │ if no auth   │          │ context      │
    └──────────────┘          └──────────────┘
```

---

## Key Success Factors for Netlify Compatibility

### 1. **@supabase/ssr Package**
- Provides SSR-specific clients that handle cookies correctly
- Works with Netlify Edge Functions and serverless functions

### 2. **Middleware-Driven Session Refresh**
- Every request triggers session refresh in middleware
- Prevents token expiration issues
- Cookies updated on every request, preventing stale sessions

### 3. **Server Components for Protected Content**
- Auth checks happen server-side via `getUser()`
- No client-side session state management needed
- Automatic redirects for unauthenticated users

### 4. **Explicit Cookie Management**
- Middleware explicitly sets cookies on both request and response
- Critical for edge environments where context is ephemeral

### 5. **Separation of Concerns**
- **Server context** (`supabaseServer.ts`): Server Components and Route Handlers
- **Browser context** (`supabase.ts`): Client components and forms
- Clear, predictable flow of data and sessions

### 6. **No External Session Storage**
- Relies entirely on Supabase auth cookies
- No Redis, database sessions, or JWT storage needed
- Simpler infrastructure, fewer points of failure

---

## What's Missing from Their Implementation

Unlike typical auth implementations, they do NOT have:
- ❌ Context providers wrapping the app
- ❌ Custom session hooks (`useSession`, `useAuth`)
- ❌ External session storage (Redis, DB sessions)
- ❌ OAuth/callback handlers (or they're minimal)
- ❌ Protected route wrappers
- ❌ TypeScript types for auth context

**Why this is actually an advantage:**
- Lighter JavaScript bundle
- Fewer hydration issues
- Simpler deployment
- Better edge environment compatibility

---

## How to Replicate This in Your Project

### Step 1: Install Dependencies
```bash
npm install @supabase/ssr @supabase/supabase-js
```

### Step 2: Create Middleware
Copy their `middleware.ts` exactly

### Step 3: Create Server Utilities
- `lib/supabaseServer.ts` - createClient() for Server Components
- `lib/supabase.ts` - createClient() for Client Components

### Step 4: Create Auth Utilities
- `lib/auth.ts` - getUser(), getClinician(), ensureClinicianExists()

### Step 5: Create Root Layout
Simple layout with no context providers

### Step 6: Create Protected Pages
Use async Server Components and call `getUser()` at the start

### Step 7: Create Auth Forms
Client components that use `createClient()` for mutations

### Step 8: Create Profile API
Route handler to ensure profile exists after signup

---

## Configuration Files

**Environment Variables (.env.local):**
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # Server-side only
```

**next.config.js:**
```javascript
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'localhost' },
    ],
  },
};
module.exports = nextConfig;
```

**tsconfig.json:**
```json
{
  "paths": {
    "@/*": ["./*"]
  }
}
```

---

## Summary

The Royalty Meds Telehealth repository demonstrates a **modern, edge-friendly authentication pattern** that:

1. **Uses @supabase/ssr** for edge-compatible session management
2. **Leverages middleware** for automatic session refresh
3. **Employs Server Components** for protected content
4. **Avoids context providers** for simpler code and smaller bundles
5. **Separates server and client** Supabase instances clearly
6. **Manages profiles server-side** after auth signup

This approach **eliminates the session loss issues** that plague traditional Netlify deployments because:
- Sessions are refreshed on every request (middleware)
- Cookies are explicitly managed in edge-compatible ways
- No reliance on client-side state or external storage
- Server Components have guaranteed access to fresh auth context

This is the **pattern you should replicate** in your current project to fix the Netlify authentication issues.
