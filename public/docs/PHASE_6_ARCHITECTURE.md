---

## Technical Architecture Reference (Phase 6 Analysis - January 21, 2026)

### Core Technology Stack
- **Frontend:** Next.js 15.5.9, React 19.2.3, TypeScript 5.9.3, Tailwind CSS v4
- **Backend:** Supabase PostgreSQL, Node.js Server Runtime
- **Authentication:** Supabase Auth (JWT + HttpOnly Cookies)
- **Hosting:** Vercel (frontend), Supabase (database + auth + storage)
- **Version Control:** GitHub

### Architecture Pattern: Server-First Design
**Three-Layer Data Flow:**
1. **Server Component** (async, no 'use client')
   - Fetches data via server actions
   - Renders initial HTML on server
   - Passes data as props to client component

2. **Client Component** ('use client')
   - Receives initial data as props
   - Manages local state for interactivity
   - Calls server actions on user interactions

3. **Server Action** ('use server')
   - Encapsulates database mutations
   - Authenticated via middleware context
   - Calls `revalidatePath()` to refresh page

**Benefits:**
- Smaller JS bundles (database queries don't ship to browser)
- Faster initial page render (data fetched on server)
- Simpler state management (props from server)
- Secrets stay on server (no env var exposure)

### Authentication Flow
1. User logs in at `/login` or `/admin-login`
2. Client calls `supabase.auth.signInWithPassword()`
3. JWT stored in HttpOnly cookie
4. Middleware refreshes token on every request
5. Server components access user via `createServerSupabaseClient()`
6. RLS policies enforce row-level access control

### Multi-Role Access Control
| Role | UI Label | Login Page | Access |
|------|----------|-----------|--------|
| patient | Customer | /login | Own data only |
| doctor | Doctor | /login | Own + patient data |
| admin | Pharmacist | /admin-login | All data |

### Database Security: Row-Level Security (RLS)
- **Patient access:** `WHERE patient_id = auth.uid()`
- **Doctor access:** `WHERE doctor_id = auth.uid() OR patient.owner = auth.uid()`
- **Admin access:** No WHERE clause, full table access
- **Enforcement:** Database-level, not bypassed by client

### Key Architectural Files
| File | Purpose | Lines | Type |
|------|---------|-------|------|
| middleware.ts | Session refresh, route protection | 40+ | Edge Middleware |
| lib/supabase-server.ts | Server-side auth utilities | 50+ | Utility Module |
| lib/auth.ts | Role checking, auth guards | 150+ | Helper Functions |
| app/actions/*.ts | Server mutations (CRUD) | 200-300 | Server Actions |
| app/*/page.tsx | Page routes (server component) | 10-30 | Server Component |
| app/*-client.tsx | Interactive UI components | 200-500 | Client Component |

### Data Model: Core Tables
- **users** (12 columns) - Auth sync with roles
- **user_profiles** (5 columns) - Extended profile data
- **prescriptions** (15 columns) - Doctor submissions, status tracking
- **orders** (12 columns) - Patient orders from approved prescriptions
- **refill_requests** (10 columns) - Refill request workflow
- **otc_drugs** (79 columns) - Inventory, NEW in Phase 6
- **prescription_drugs** (79 columns) - Inventory, NEW in Phase 6
- **inventory_transactions** (10 columns) - Audit trail, NEW in Phase 6
- **audit_logs** (8 columns) - All changes logged
- And 3 more supporting tables

### Performance Optimizations
- **Database indexes:** 15+ on frequently queried columns
- **Server component data fetching:** Parallel with `Promise.all()`
- **Pagination:** 10 items per page for lists
- **Caching:** Next.js automatic page caching with manual revalidation
- **RLS optimization:** Single efficient policies vs. multiple policies

### Deployment Pipeline
```
1. Git push to GitHub
   ↓
2. Vercel webhook triggered
   ↓
3. Environment variables loaded
   ↓
4. npx next build (compiles Next.js)
   ↓
5. Database migrations auto-applied (Supabase)
   ↓
6. Edge functions deployed (Vercel)
   ↓
7. Live at: https://royaltymedspharmacy.com
```

### Identified Improvements (Future Phases)
- Add navigation link for inventory to admin sidebar
- Supplier management integration
- Stock forecasting based on usage patterns
- Advanced inventory reporting and analytics
- Batch/expiration tracking enhancements
