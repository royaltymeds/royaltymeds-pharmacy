# Navigation & Authentication Implementation Guide

## Overview

This document details the complete authentication and navigation architecture for the MedAssistant telemedicine platform. It's designed to serve as a reference for implementing similar patterns in other applications.

## Table of Contents
1. [Authentication Method](#authentication-method)
2. [Authentication Implementation](#authentication-implementation)
3. [Page Navigation & Routing](#page-navigation--routing)
4. [User Data Loading from Supabase](#user-data-loading-from-supabase)
5. [Session Management](#session-management)
6. [Route Protection](#route-protection)

---

## Authentication Method

### Overview
The application uses **Supabase Authentication** with email/password credentials. This is a managed authentication service that handles:
- User registration (signup)
- User login (signin)
- Session management via JWT tokens
- Secure password handling
- User metadata storage

### Key Characteristics
- **Type**: Email & Password Authentication
- **Session Storage**: HTTP-only cookies (managed by Supabase SDK)
- **Token Type**: JWT (JSON Web Tokens)
- **Token Expiry**: 3600 seconds (1 hour) - configurable in `supabase/config.toml`
- **Refresh Token**: Available for extending sessions
- **RLS**: Row Level Security enforced on all database tables

### Architecture Diagram
```
User Application
    ↓
Sign Up/Sign In Form (Client)
    ↓
Supabase Auth API (Authentication)
    ↓
JWT Token + Refresh Token (Stored in HTTP-only Cookies)
    ↓
Authenticated API Requests to Supabase Database
```

---

## Authentication Implementation

### 1. Sign Up Process

#### File: `app/signup/page.tsx`

The signup page handles user registration and initial profile creation.

```tsx
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
      // Step 1: Create Supabase auth user
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
        // Step 2: Create clinician profile via API
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

        // Step 3: Redirect to dashboard
        router.push('/dashboard')
      }
    } catch (error: any) {
      setError(error.message || 'Failed to sign up')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">MedAssistant</h1>
          <p className="text-slate-600 mb-8">Create your account</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSignUp} className="space-y-6">
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Full Name"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-900"
            />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-900"
            />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-900"
            />
            <input
              type="text"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              placeholder="Specialty (optional)"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-900"
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'clinician' | 'admin')}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-900"
            >
              <option value="clinician">Clinician</option>
              <option value="admin">Administrator</option>
            </select>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            Already have an account?{' '}
            <Link href="/signin" className="text-blue-600 hover:text-blue-700 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
```

#### How Sign Up Works:

1. **Form Submission**: User enters email, password, full name, specialty, and role
2. **Supabase Auth Creation**: `supabase.auth.signUp()` creates an authentication user in Supabase
3. **User Metadata**: Stores `full_name` and `specialty` in user metadata (attached to auth.users)
4. **Clinician Profile Creation**: API call to `/api/ensure-clinician` creates database record
5. **Redirect**: On success, redirects to `/dashboard`

### 2. Sign In Process

#### File: `app/signin/page.tsx`

```tsx
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
      // Step 1: Authenticate with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      if (data.user) {
        // Step 2: Ensure clinician record exists (in case it was deleted)
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

        // Step 3: Redirect to dashboard
        router.push('/dashboard')
      }
    } catch (error: any) {
      setError(error.message || 'Failed to sign in')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">MedAssistant</h1>
          <p className="text-slate-600 mb-8">Sign in to your account</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSignIn} className="space-y-6">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-900"
            />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-900"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            Don't have an account?{' '}
            <Link href="/signup" className="text-blue-600 hover:text-blue-700 font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
```

#### How Sign In Works:

1. **Form Submission**: User enters email and password
2. **Supabase Authentication**: `supabase.auth.signInWithPassword()` validates credentials
3. **JWT Token**: Supabase returns JWT token (stored in HTTP-only cookie by SDK)
4. **Clinician Verification**: Ensures clinician profile exists via API call
5. **Redirect**: On success, redirects to `/dashboard`

### 3. Clinician Profile Endpoint

#### File: `app/api/ensure-clinician/route.ts`

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

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Call helper function to create/update clinician record
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

### 4. Authentication Utilities

#### File: `lib/auth.ts`

```typescript
import { createClient } from './supabaseServer'
import { redirect } from 'next/navigation'

// Get current authenticated user from Supabase
export async function getUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/signin')
  }

  return user
}

// Get clinician profile from database
export async function getClinician(userId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('clinicians')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    throw new Error(`Failed to get clinician: ${error.message}`)
  }

  return data
}

// Ensure clinician profile exists in database
export async function ensureClinicianExists(
  userId: string,
  userData?: { full_name?: string; specialty?: string; email?: string; role?: string }
) {
  const supabase = await createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error('Unable to authenticate user')
  }

  // Check if clinician record exists
  let existingClinician = await getClinician(userId)

  if (existingClinician) {
    // Update if needed
    const updates: any = {}
    let needsUpdate = false

    if (!existingClinician.email && user.email) {
      updates.email = user.email
      needsUpdate = true
    }

    // Special handling for demo doctor
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

      existingClinician = { ...existingClinician, ...updates }
    }

    return existingClinician
  }

  // Create new clinician record
  let role = userData?.role || 'clinician'
  const userEmail = userData?.email || user.email
  if (userEmail === 'demodoctor@telemed.com') {
    role = 'admin'
  }

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

// Server-side auth guard
export async function requireAuth() {
  return await getUser()
}
```

### 5. Client-Side Authentication Hook

#### File: `hooks/useAuth.ts`

```typescript
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [signingOut, setSigningOut] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      // Get current authenticated user
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }

    getUser()

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    // Cleanup subscription on unmount
    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const signOut = async () => {
    setSigningOut(true)
    await supabase.auth.signOut()
    router.push('/signin')
  }

  return { user, loading, signingOut, signOut }
}
```

**How it works:**
1. On mount, calls `supabase.auth.getUser()` to get current user
2. Subscribes to `onAuthStateChange` to listen for session changes
3. Updates state whenever auth state changes
4. Returns user, loading state, and signOut function
5. Cleans up subscription on unmount to prevent memory leaks

---

## Page Navigation & Routing

### 1. Route Structure

```
app/
├── layout.tsx                    # Root layout (metadata)
├── globals.css                   # Global styles with Tailwind
├── page.tsx                      # Home redirect
├── signin/
│   └── page.tsx                  # Public signin page
├── signup/
│   └── page.tsx                  # Public signup page
├── dashboard/
│   ├── page.tsx                  # Protected dashboard (server component)
│   └── DashboardClient.tsx       # Client component for real-time updates
├── patients/
│   ├── page.tsx                  # Patient list (protected)
│   ├── [id]/
│   │   └── page.tsx              # Patient detail
│   └── new/
│       └── page.tsx              # Create patient form
├── visits/
│   ├── page.tsx                  # Visits list
│   ├── [id]/
│   │   └── page.tsx              # Visit detail
│   └── new/
│       └── page.tsx              # Create visit form
├── appointments/
│   ├── page.tsx                  # Appointments list
│   ├── [id]/
│   │   └── page.tsx              # Appointment detail
│   └── new/
│       └── page.tsx              # Create appointment form
├── messages/
│   └── page.tsx                  # Messaging interface
├── shared-patients/
│   ├── page.tsx                  # Shared patients list
│   └── [id]/
│       └── page.tsx              # Shared patient detail
└── api/
    ├── ensure-clinician/
    │   └── route.ts              # Create/update clinician profile
    ├── patients/
    │   ├── route.ts              # Patient API endpoints
    │   └── [id]/
    │       ├── route.ts          # Patient detail endpoints
    │       └── visits/
    │           └── route.ts      # Patient visits
    ├── visits/
    │   ├── route.ts              # Visit API endpoints
    │   └── [id]/
    │       ├── route.ts          # Visit detail
    │       ├── notes/
    │       │   └── route.ts      # Visit notes
    │       └── complete/
    │           └── route.ts      # Complete visit
    └── appointments/
        └── route.ts              # Appointment API endpoints
```

### 2. Protected Routes with Layout

#### File: `components/Layout.tsx`

This wrapper component handles authentication on all protected routes:

```tsx
'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import { LoadingToast } from './LoadingToast'
import { LoadingProvider } from '@/lib/LoadingContext'
import { useSessionTimeout } from '@/lib/useSessionTimeout'

// Component that handles session timeout for authenticated users
function AuthenticatedLayout({ children, sidebarOpen, setSidebarOpen }: {
  children: React.ReactNode;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}) {
  // 30-minute inactivity timeout
  useSessionTimeout(30)

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header onMenuClick={() => setSidebarOpen(true)} />

      {/* Mobile sidebar overlay */}
      <div className={`fixed inset-y-0 left-0 z-50 lg:hidden transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="w-64 bg-white shadow-2xl min-h-screen border-r border-slate-200">
          <Sidebar onClose={() => setSidebarOpen(false)} />
        </div>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed top-0 right-0 bottom-0 left-64 z-40 lg:hidden bg-transparent"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar */}
        <div className="hidden lg:block w-64 bg-white border-r border-slate-200 overflow-y-auto">
          <Sidebar />
        </div>

        {/* Main content */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 overflow-x-auto overflow-y-auto">
          <div className="max-w-full">
            {children}
          </div>
        </main>
      </div>
      <LoadingToast />
    </div>
  )
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, loading, signingOut } = useAuth()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Redirect unauthenticated users to signin
  useEffect(() => {
    if (!loading && !user) {
      router.push('/signin')
    }
  }, [user, loading, router])

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-slate-300 border-t-blue-600"></div>
          <p className="mt-4 text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Show loading spinner while signing out
  if (signingOut) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-slate-300 border-t-blue-600"></div>
          <p className="mt-4 text-slate-600">Signing out...</p>
        </div>
      </div>
    )
  }

  // No user, don't render anything (will redirect)
  if (!user) {
    return null
  }

  // Render authenticated layout
  return (
    <LoadingProvider>
      <AuthenticatedLayout
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      >
        {children}
      </AuthenticatedLayout>
    </LoadingProvider>
  )
}
```

**Key Features:**
- Checks authentication status via `useAuth()` hook
- Shows loading spinner while checking auth
- Redirects unauthenticated users to `/signin`
- Wraps all protected routes with Header, Sidebar, and main content
- Session timeout after 30 minutes of inactivity

### 3. Navigation via Sidebar

#### File: `components/Sidebar.tsx`

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname()
  const { user, signOut } = useAuth()

  const isActive = (path: string) => pathname === path

  const handleNavClick = () => {
    onClose?.()
  }

  const navItems = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Patients', href: '/patients' },
    { label: 'Visits', href: '/visits' },
    { label: 'Appointments', href: '/appointments' },
    { label: 'Messages', href: '/messages' },
    { label: 'Shared Patients', href: '/shared-patients' },
  ]

  return (
    <div className="flex flex-col h-full">
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={handleNavClick}
            className={`block px-4 py-2 rounded-lg transition-colors ${
              isActive(item.href)
                ? 'bg-blue-600 text-white'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="border-t border-slate-200 p-4">
        <button
          onClick={() => {
            handleNavClick()
            signOut()
          }}
          className="w-full px-4 py-2 text-left text-slate-700 hover:bg-slate-100 rounded-lg"
        >
          Sign Out
        </button>
      </div>
    </div>
  )
}
```

### 4. Programmatic Navigation

Navigation is handled using Next.js `useRouter` hook:

```tsx
import { useRouter } from 'next/navigation'

function MyComponent() {
  const router = useRouter()

  const handleNavigate = () => {
    // Navigate to a new page
    router.push('/patients')
    
    // Replace history (go back to signin on logout)
    router.replace('/signin')
    
    // Refresh current page
    router.refresh()
  }
}
```

---

## User Data Loading from Supabase

### 1. Server-Side Data Loading (Next.js Server Components)

Server components fetch data on the server before rendering, ensuring data is always fresh.

#### Dashboard Data Loading

##### File: `app/dashboard/page.tsx`

```tsx
import Layout from '@/components/Layout'
import { getUser, getClinician } from '@/lib/auth'
import { createClient } from '@/lib/supabaseServer'
import DashboardClient from './DashboardClient'

async function getDashboardData() {
  try {
    const supabase = await createClient()

    // Get current authenticated user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return {
        stats: { totalPatients: 0, todayVisits: 0, pendingNotes: 0 },
        todayAppointments: [],
        recentPatients: []
      }
    }

    // Get patient stats (created by this clinician)
    const { count: totalPatients } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true })
      .eq('clinician_id', user.id)

    // Get shared patients count
    const { count: sharedPatients } = await supabase
      .from('patient_shares')
      .select('*', { count: 'exact', head: true })
      .eq('shared_with', user.id)
      .is('expires_at', null)

    // Get today's visits
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const { count: todayVisits } = await supabase
      .from('visits')
      .select('*', { count: 'exact', head: true })
      .gte('started_at', today.toISOString())
      .lt('started_at', tomorrow.toISOString())

    // Get pending notes
    const { count: pendingNotes } = await supabase
      .from('visits')
      .select('*', { count: 'exact', head: true })
      .in('visit_status', ['draft', 'in_progress', 'pending_review'])

    // Get today's appointments
    const { data: todayAppointments } = await supabase
      .from('appointments')
      .select(`
        id,
        appointment_date,
        appointment_time,
        appointment_status,
        patients (
          id,
          first_name,
          last_name
        )
      `)
      .gte('appointment_date', today.toISOString().split('T')[0])
      .lt('appointment_date', tomorrow.toISOString().split('T')[0])
      .order('appointment_time', { ascending: true })

    // Get recent patients
    const { data: recentPatients } = await supabase
      .from('patients')
      .select('id, first_name, last_name, created_at')
      .eq('clinician_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5)

    return {
      stats: {
        totalPatients: totalPatients || 0,
        todayVisits: todayVisits || 0,
        pendingNotes: pendingNotes || 0,
        sharedPatients: sharedPatients || 0,
      },
      todayAppointments: todayAppointments || [],
      recentPatients: recentPatients || [],
    }
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return {
      stats: { totalPatients: 0, todayVisits: 0, pendingNotes: 0 },
      todayAppointments: [],
      recentPatients: []
    }
  }
}

export default async function Dashboard() {
  // Data is fetched on server before page renders
  const data = await getDashboardData()

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        
        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Patients" value={data.stats.totalPatients} />
          <StatCard label="Today's Visits" value={data.stats.todayVisits} />
          <StatCard label="Pending Notes" value={data.stats.pendingNotes} />
          <StatCard label="Shared Patients" value={data.stats.sharedPatients} />
        </div>

        {/* Appointments and recent patients */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AppointmentsCard appointments={data.todayAppointments} />
          <RecentPatientsCard patients={data.recentPatients} />
        </div>

        {/* Client-side component for real-time updates */}
        <DashboardClient />
      </div>
    </Layout>
  )
}
```

**Key Concepts:**
- Function `getDashboardData()` is marked as async and runs on the server
- Uses `createClient()` from `lib/supabaseServer.ts` for server-side Supabase access
- Fetches data before the page renders (no loading states needed)
- Multiple related queries can be made efficiently
- Returns structured data to the component
- Error handling with fallback values

#### Patients List Data Loading

##### File: `app/patients/page.tsx`

```tsx
import { Suspense } from 'react'
import Layout from '@/components/Layout'
import { createClient } from '@/lib/supabaseServer'
import PatientList from './PatientList'

interface Patient {
  id: string
  first_name: string
  last_name: string
  date_of_birth: string
  phone: string
  email: string
  created_at: string
}

async function getPatients(page: number = 1, limit: number = 20) {
  const supabase = await createClient()

  const offset = (page - 1) * limit

  // Get total count for pagination
  const { count: totalCount } = await supabase
    .from('patients')
    .select('*', { count: 'exact', head: true })

  // Get paginated patients
  const { data: patients, error } = await supabase
    .from('patients')
    .select('id, first_name, last_name, date_of_birth, phone, email, created_at')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('Error fetching patients:', error)
    return { patients: [], totalCount: 0, totalPages: 0, currentPage: page }
  }

  const totalPages = Math.ceil((totalCount || 0) / limit)

  return {
    patients: patients || [],
    totalCount: totalCount || 0,
    totalPages,
    currentPage: page,
    limit
  }
}

export default async function PatientsPage() {
  const { patients, totalPages } = await getPatients()

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-slate-900">Patients</h1>
          <Link
            href="/patients/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Add Patient
          </Link>
        </div>

        {/* Suspense boundary for async component */}
        <Suspense fallback={<div>Loading patients...</div>}>
          <PatientList initialPatients={patients} totalPages={totalPages} />
        </Suspense>
      </div>
    </Layout>
  )
}
```

### 2. Client-Side Data Loading with Hooks

For real-time updates or user interactions, client components use the Supabase client:

#### Real-Time Patient List

```tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

interface Patient {
  id: string
  first_name: string
  last_name: string
  email: string
  created_at: string
}

export default function PatientListClient() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // Initial data fetch
    const fetchPatients = async () => {
      const { data, error } = await supabase
        .from('patients')
        .select('id, first_name, last_name, email, created_at')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        console.error('Error:', error)
      } else {
        setPatients(data || [])
      }
      setLoading(false)
    }

    fetchPatients()

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('patients_channel')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'patients'
      }, (payload) => {
        console.log('Change received!', payload)
        // Refetch or update state based on payload
        fetchPatients()
      })
      .subscribe()

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  if (loading) return <div>Loading...</div>

  return (
    <div className="space-y-4">
      {patients.map((patient) => (
        <div key={patient.id} className="border rounded-lg p-4">
          <h3 className="font-semibold">
            {patient.first_name} {patient.last_name}
          </h3>
          <p className="text-sm text-slate-600">{patient.email}</p>
        </div>
      ))}
    </div>
  )
}
```

**Key Concepts:**
- Component is marked with `'use client'` to run in browser
- `useEffect` with empty dependency array runs once on mount
- `createClient()` from `lib/supabase.ts` creates browser Supabase client
- Real-time subscription updates data when changes occur in database
- Proper cleanup of subscriptions prevents memory leaks

### 3. Fetching Data in API Routes

API routes handle POST/PUT/DELETE operations:

#### Create Patient API

##### File: `app/api/patients/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClientForApi } from '@/lib/supabaseServer'

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user from request
    const supabase = createClientForApi(request)
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()

    // Insert new patient
    const { data, error } = await supabase
      .from('patients')
      .insert({
        first_name: body.first_name,
        last_name: body.last_name,
        date_of_birth: body.date_of_birth,
        email: body.email,
        phone: body.phone,
        clinician_id: user.id,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
```

### 4. Data Flow Diagram

```
User Action (click, form submit)
    ↓
Client Component (React state management)
    ↓
API Route or Supabase Client Query
    ↓
Supabase Database
    ↓
Response back to Client
    ↓
UI Update (Re-render)
```

---

## Session Management

### 1. Session Timeout

#### File: `lib/useSessionTimeout.ts`

Automatically logs out users after inactivity:

```typescript
'use client'

import { useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'

export function useSessionTimeout(minutes: number) {
  const { signOut } = useAuth()

  useEffect(() => {
    let timeoutId: NodeJS.Timeout
    let activityTimeout: NodeJS.Timeout

    const resetTimer = () => {
      // Clear existing timeouts
      clearTimeout(timeoutId)
      clearTimeout(activityTimeout)

      // Set new timeout for inactivity
      timeoutId = setTimeout(() => {
        signOut()
      }, minutes * 60 * 1000)
    }

    const handleActivity = () => {
      resetTimer()
    }

    // Listen for user activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click']
    events.forEach(event => {
      document.addEventListener(event, handleActivity)
    })

    // Initialize timer
    resetTimer()

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity)
      })
      clearTimeout(timeoutId)
      clearTimeout(activityTimeout)
    }
  }, [signOut])
}
```

**Usage in Layout:**
```tsx
useSessionTimeout(30) // 30-minute timeout
```

### 2. Middleware for Session Refresh

#### File: `middleware.ts`

Ensures session is kept alive:

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
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
```

---

## Route Protection

### 1. Server-Side Protection

Using `requireAuth()` in server components:

```tsx
import { requireAuth } from '@/lib/auth'

export default async function ProtectedPage() {
  // This will redirect to /signin if user is not authenticated
  const user = await requireAuth()

  return (
    <div>
      Welcome, {user.email}
    </div>
  )
}
```

### 2. Client-Side Protection

Using `useAuth()` hook in client components:

```tsx
'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function ProtectedComponent() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/signin')
    }
  }, [user, loading, router])

  if (loading) return <div>Loading...</div>
  if (!user) return null

  return <div>Welcome, {user.email}</div>
}
```

### 3. API Route Protection

Using `createClientForApi()` in API routes:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClientForApi } from '@/lib/supabaseServer'

export async function GET(request: NextRequest) {
  const supabase = createClientForApi(request)
  
  // Get current user
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  // User is authenticated, proceed with logic
  return NextResponse.json({ message: 'Success' })
}
```

---

## Implementation Checklist for New Applications

- [ ] Set up Supabase project with email/password authentication
- [ ] Create `lib/supabase.ts` for browser client
- [ ] Create `lib/supabaseServer.ts` for server client
- [ ] Create `lib/auth.ts` with helper functions
- [ ] Create `hooks/useAuth.ts` authentication hook
- [ ] Create `signin` and `signup` pages
- [ ] Create `middleware.ts` for session refresh
- [ ] Create `components/Layout.tsx` for route protection
- [ ] Create `components/Sidebar.tsx` for navigation
- [ ] Set up API routes for data management
- [ ] Implement `useSessionTimeout()` for inactivity logout
- [ ] Test authentication flow (signup, signin, signout)
- [ ] Test protected routes redirect unauthenticated users
- [ ] Test session timeout functionality
- [ ] Test real-time data subscriptions

---

## Summary

This implementation provides:
- **Secure Authentication**: Email/password via Supabase Auth
- **Session Management**: JWT tokens in HTTP-only cookies with refresh
- **Route Protection**: Server and client-side guards
- **Data Loading**: Efficient server-side fetching with optional client-side real-time updates
- **Navigation**: Next.js routing with sidebar navigation
- **Session Timeout**: Automatic logout after inactivity
- **Scalability**: Easily extensible to other applications

The architecture separates concerns between authentication, data management, and UI, making it maintainable and testable.
