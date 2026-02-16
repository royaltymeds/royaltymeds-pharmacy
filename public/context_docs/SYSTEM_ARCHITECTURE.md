# System Architecture & Feature Matrix

**Last Updated:** February 16, 2026  
**Total Commits:** 460+  
**Latest Phase:** Phase 11 - Address Refactoring, Prescription Pricing, Dashboard Redesign, OTC Confirmation

## Application Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      RoyaltyMeds Platform                        │
│              Trusted Online Pharmacy (Jamaica)                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        Frontend Layer                             │
│                   Next.js 15 + React 19 + Tailwind               │
├─────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │   Homepage   │  │  Auth Pages   │  │   Redirect   │           │
│  │   (Public)   │  │  (Login/Signup)  │   (Portal)   │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │           Multi-Role Portal System                        │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │                                                            │   │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐     │   │
│  │  │    Admin     │ │    Doctor    │ │   Patient    │     │   │
│  │  │   Portal     │ │   Portal     │ │   Portal     │     │   │
│  │  └──────────────┘ └──────────────┘ └──────────────┘     │   │
│  │         │               │               │                 │   │
│  │  ┌──────┴───────┐   ┌───┴──────┐   ┌───┴──────┐         │   │
│  │  │   Dashboard  │   │Dashboard │   │ Dashboard│         │   │
│  │  │ Inventory    │   │  My       │   │  Orders  │         │   │
│  │  │ (Paginated)  │   │  Patients │   │  (Search)│         │   │
│  │  │ Doctors      │   │  Prescrip-│   │(Paginated)          │   │
│  │  │ Patients     │   │  tions    │   │  Store   │         │   │
│  │  │ Orders       │   │           │   │  Prescrip│         │   │
│  │  │ (Search)     │   │           │   │  tions   │         │   │
│  │  │ (Paginated)  │   │           │   │  Profile │         │   │
│  │  │ Payments     │   │           │   │  Refills │         │   │
│  │  │ Prescriptions│   │           │   │ Payments │         │   │
│  │  │ (with names) │   │           │   │  (Upload)│         │   │
│  │  │ Refills      │   │           │   │          │         │   │
│  │  └──────────────┘   └───────────┘   └──────────┘         │   │
│  │                                                            │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Shared Features                              │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │  • Authentication (Supabase Auth)                         │   │
│  │  • Duplicate user prevention (email & phone)              │   │
│  │  • Mandatory profile fields (name, phone, address, DOB)   │   │
│  │  • Server Actions (mutations)                             │   │
│  │  • Form Handling (validation, error)                      │   │
│  │  • Toast Notifications (success/error)                    │   │
│  │  • Image Display (Next.js Image optimization)             │   │
│  │  • Search & Filtering (orders, inventory, patients)       │   │
│  │  • Pagination (10 items/page for orders, 20 for inventory)│   │
│  │  • Unified loading icons (Loader animate-spin)            │   │
│  │  • Loading States (uniform icons)                         │   │
│  │  • Currency Formatting (proper display)                   │   │
│  │  • Mobile Responsive (Tailwind)                           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                        API Layer                                  │
│                     (Server Actions & Routes)                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  Auth Actions   │  │ Order Actions   │  │ Payment Actions │ │
│  │  • Login        │  │ • Create        │  │ • Verify        │ │
│  │  • Signup       │  │ • Update Status │  │ • Update Receipt│ │
│  │  • Logout       │  │ • Cancel        │  │ • Configuration │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│                                                                    │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │Inventory Actions│  │ Doctor Actions  │  │Patient Actions  │ │
│  │ • CRUD Products │  │ • Submit Rx     │  │ • Profile       │ │
│  │ • Image Upload  │  │ • View Patients │  │ • Track Orders  │ │
│  │ • Stock Mgmt    │  │ • View Status   │  │ • Request Refill│ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│                                                                    │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │        Prescription Actions                               │ │
│  │  • Submit (Doctor)  • Fill (Admin)  • Refill (Patient)   │ │
│  │  • Add Notes        • Track Status  • View Medications    │ │
│  │  • Assign Pharmacist• Update        • Archive            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                     Business Logic Layer                          │
│                   (Server-Side Processing)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  Auth Service   │  │ Payment Service │  │  Order Service  │ │
│  │  • Validate     │  │  • Calculate    │  │  • Create       │ │
│  │  • Session Mgmt │  │  • Tax/Shipping │  │  • Update Status│ │
│  │  • Role Check   │  │  • Verify Rcpt  │  │  • Calculate    │ │
│  └─────────────────┘  └─────────────────┘  │    Total        │ │
│                                             └─────────────────┘ │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │         Prescription Service                             │   │
│  │  • Submit (with medications)  • Fill (update status)     │   │
│  │  • Track status               • Manage refills           │   │
│  │  • Add notes                  • Assign pharmacist        │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │         Inventory Service                                │   │
│  │  • Stock tracking         • Low-stock warnings           │   │
│  │  • Filter active products • Duplicate prevention         │   │
│  │  • Image upload/delete    • Expiration tracking          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    Data Access Layer                              │
│                   (Supabase with RLS)                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌─────────┐ │
│  │    Auth      │ │    Users     │ │   Patients   │ │ Doctors │ │
│  │    Table     │ │    Table     │ │    Table     │ │ Table   │ │
│  └──────────────┘ └──────────────┘ └──────────────┘ └─────────┘ │
│                                                                    │
│  ┌──────────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  Prescriptions   │  │    Orders    │  │   Order Items    │  │
│  │    Table         │  │    Table     │  │    Table         │  │
│  └──────────────────┘  └──────────────┘  └──────────────────┘  │
│                                                                    │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌─────────┐ │
│  │  Inventory   │ │   Payments   │ │  Payment     │ │ Payment │ │
│  │   (Products) │ │  (History)   │ │  Config      │ │ Receipts│ │
│  └──────────────┘ └──────────────┘ └──────────────┘ └─────────┘ │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │         RLS Policies Applied to All Tables               │   │
│  │  ✓ Admin: Full access to all                             │   │
│  │  ✓ Doctor: Own submissions + assigned patients           │   │
│  │  ✓ Patient: Own data only (orders, prescriptions, etc)   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    Storage & Infrastructure                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌──────────────────────┐  ┌──────────────────────────────────┐ │
│  │  Supabase Storage    │  │  Vercel Deployment              │ │
│  │  • Product Images    │  │  • Next.js 15 Hosting           │ │
│  │  • Receipt Images    │  │  • Serverless Functions         │ │
│  │  • Profile Avatars   │  │  • Zero-downtime Deployments    │ │
│  └──────────────────────┘  └──────────────────────────────────┘ │
│                                                                    │
│  ┌──────────────────────┐  ┌──────────────────────────────────┐ │
│  │  PostgreSQL DB       │  │  CDN & Caching                   │ │
│  │  (Supabase)          │  │  • Image Optimization            │ │
│  │  • All Tables        │  │  • Cache Invalidation            │ │
│  │  • RLS Security      │  │  • Pagination Support            │ │
│  └──────────────────────┘  └──────────────────────────────────┘ │
│                                                                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagrams

### **User Registration & Authentication Flow**

```
Patient/Doctor/Admin
    │
    ↓
┌────────────────┐
│ Login/Signup   │  ← Email + Password
│ Page           │
└────────────────┘
    │
    ↓
┌────────────────────────────────────────┐
│ Supabase Auth                           │
│ • Validate credentials                  │
│ • Create session                        │
│ • Set auth cookie                       │
└────────────────────────────────────────┘
    │
    ├─────────────┬─────────────┬─────────────┐
    ↓             ↓             ↓             ↓
┌─────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ Admin   │ │ Doctor   │ │ Patient  │ │ Redirect │
│ Portal  │ │ Portal   │ │ Portal   │ │ (if auth)│
└─────────┘ └──────────┘ └──────────┘ └──────────┘
    │          │            │            │
    └──────────┴────────────┴────────────┘
               │
               ↓
        ┌──────────────────┐
        │ RLS Policies     │
        │ Check Permissons │
        │ Grant Access     │
        └──────────────────┘
```

### **Order Placement & Payment Flow**

```
Patient Browsing Store
    │
    ↓
┌──────────────────┐
│ Add to Cart      │  (Local Storage + Server State)
│ • Product        │
│ • Quantity       │
└──────────────────┘
    │
    ↓
┌──────────────────┐
│ View Cart        │
│ • Review Items   │
│ • Apply Discounts│
│ • Proceed        │
└──────────────────┘
    │
    ↓
┌──────────────────────────────────────────┐
│ Create Order                              │
│ • Fetch payment_config (tax, shipping)    │
│ • Calculate totals                        │
│ • Create order record                     │
└──────────────────────────────────────────┘
    │
    ├─────────────────────────┬──────────────────┐
    ↓                         ↓                  ↓
┌──────────────────┐  ┌─────────────────┐  ┌─────────────┐
│ Bank Transfer    │  │ Card Payment    │  │ Payment     │
│ • Upload Receipt │  │ • Enter Details │  │ Pending     │
│ • Verify Manual  │  │ • Process Card  │  │ Status      │
│ • Admin Reviews  │  │ • Auto Verify   │  │             │
└──────────────────┘  └─────────────────┘  └─────────────┘
    │
    ├─────────────┬──────────────────────┐
    ↓             ↓                      ↓
┌────────┐  ┌──────────────┐  ┌──────────────────┐
│Approved│  │ Verification │  │ Auto Verification│
│        │  │ Pending      │  │ (Card)           │
└────────┘  └──────────────┘  └──────────────────┘
    │             │                      │
    └─────────────┴──────────────────────┘
               │
               ↓
        ┌──────────────────────┐
        │ Order Status         │
        │ Processing           │
        │ (Pharmacist picks)   │
        └──────────────────────┘
               │
               ↓
        ┌──────────────────────┐
        │ Order Shipped        │
        │ (1hr Kingston or     │
        │  12-24hrs elsewhere) │
        └──────────────────────┘
               │
               ↓
        ┌──────────────────────┐
        │ Order Delivered      │
        │ Patient receives     │
        │ medications          │
        └──────────────────────┘
```

### **Prescription Submission & Fulfillment Flow**

```
Doctor
    │
    ↓
┌─────────────────────────────────────┐
│ Submit Prescription                  │
│ • Select Patient                     │
│ • Add Medications (multiple)          │
│ • Set Quantities                     │
│ • Submit Form                        │
└─────────────────────────────────────┘
    │
    ↓
┌─────────────────────────────────────┐
│ Prescription Created                 │
│ • Status: Pending                    │
│ • Doctor assigned                    │
│ • Timestamp recorded                 │
└─────────────────────────────────────┘
    │
    ↓
┌─────────────────────────────────────┐
│ Admin Dashboard                      │
│ • View pending prescriptions         │
│ • Review medications                 │
│ • Assign pharmacist                  │
└─────────────────────────────────────┘
    │
    ↓
┌─────────────────────────────────────┐
│ Fill Prescription                    │
│ • Pharmacist enters name             │
│ • Confirm quantities                 │
│ • Add admin notes                    │
│ • Mark as Filled                     │
└─────────────────────────────────────┘
    │
    ↓
┌─────────────────────────────────────┐
│ Prescription Status: Filled          │
│ • Can be picked with order           │
│ • Patient notified                   │
│ • Ready for shipment                 │
└─────────────────────────────────────┘
    │
    ↓
Patient receives medications with order
```

### **Payment Configuration & Pricing Flow**

```
Admin Settings
    │
    ↓
┌────────────────────────────────────┐
│ Payment Configuration               │
│ • Tax Type (Percentage/Fixed)       │
│ • Tax Rate (Value)                  │
│ • Kingston Delivery Cost            │
│ • Other Areas Delivery Cost         │
└────────────────────────────────────┘
    │
    ↓
┌────────────────────────────────────┐
│ Save to Database                    │
│ (payment_config table)              │
│ • RLS: Admin-only edit              │
│ • RLS: Public read                  │
└────────────────────────────────────┘
    │
    ↓
┌────────────────────────────────────┐
│ During Order Creation               │
│ 1. Fetch config values              │
│ 2. Calculate subtotal               │
│ 3. Calculate tax                    │
│ 4. Determine location → delivery    │
│ 5. Calculate total                  │
│ 6. Store in order record            │
└────────────────────────────────────┘
    │
    ↓
Patient sees final total with:
• Subtotal (items)
• Tax (config-based)
• Delivery (1hr or 12-24hrs based on location)
• Grand Total
```

---

## Feature Implementation Matrix

### **Core Features**

| Feature | Status | Complexity | Last Updated | Files Count |
|---------|--------|-----------|--------------|-------------|
| User Authentication | ✅ Live | Medium | Jan 12 | 4 |
| Multi-Role System | ✅ Live | High | Jan 12 | 8 |
| Admin Dashboard | ✅ Live | High | Jan 24 | 12 |
| Doctor Portal | ✅ Live | High | Jan 22 | 10 |
| Patient Portal | ✅ Live | High | Jan 22 | 15 |
| **TOTAL** | **✅** | **High** | **Jan 24** | **49** |

### **Inventory Management**

| Feature | Status | Complexity | Last Updated | Functionality |
|---------|--------|-----------|--------------|---------------|
| Add Product | ✅ Live | Low | Jan 23 | Form validation, image upload |
| Edit Product | ✅ Live | Low | Jan 23 | Update all fields including images |
| Delete Product | ✅ Live | Low | Jan 23 | Soft delete, active flag toggle |
| List Products | ✅ Live | Medium | Jan 24 | Pagination (20/page), search, filter |
| Image Upload | ✅ Live | Medium | Jan 21 | Supabase storage, optimization |
| Stock Tracking | ✅ Live | Medium | Jan 24 | Low-stock warnings, disable buttons |
| **TOTAL** | **✅** | **Medium** | **Jan 24** | **6 features** |

### **Orders & Payments**

| Feature | Status | Complexity | Last Updated | Functionality |
|---------|--------|-----------|--------------|---------------|
| Create Order | ✅ Live | Medium | Jan 24 | Cart → order conversion |
| Order Status Tracking | ✅ Live | Medium | Jan 24 | Pending → Processing → Shipped → Delivered |
| Order Search | ✅ Live | Medium | Jan 24 | By order#, ID, amount, date |
| Order Pagination | ✅ Live | Low | Jan 24 | 10 items/page with navigation |
| Bank Transfer | ✅ Live | High | Jan 22 | Receipt upload, admin verification |
| Card Payment | ✅ Live | High | Jan 22 | Processor integration |
| Tax Configuration | ✅ Live | Low | Jan 24 | Percentage or fixed amount |
| Delivery Configuration | ✅ Live | Low | Jan 24 | Kingston (1hr) vs Other (12-24hrs) |
| Receipt Management | ✅ Live | Medium | Jan 22 | Upload, update, view thumbnails |
| **TOTAL** | **✅** | **High** | **Jan 24** | **9 features** |

### **Prescriptions**

| Feature | Status | Complexity | Last Updated | Functionality |
|---------|--------|-----------|--------------|---------------|
| Submit Rx (Doctor) | ✅ Live | Medium | Jan 22 | Multiple medications per Rx |
| Fill Rx (Admin) | ✅ Live | Medium | Jan 20 | Pharmacist name, quantity confirm |
| Refill Requests | ✅ Live | Medium | Jan 22 | Patient-initiated refill workflow |
| Rx Status Tracking | ✅ Live | Low | Jan 22 | Pending → Filled → Completed |
| Admin Notes | ✅ Live | Low | Jan 20 | Notes on prescription |
| Doctor Details | ✅ Live | Low | Jan 22 | View doctor info on Rx |
| Medications List | ✅ Live | Medium | Jan 20 | Add/edit/delete meds per Rx |
| **TOTAL** | **✅** | **Medium** | **Jan 22** | **7 features** |

### **Store & E-Commerce**

| Feature | Status | Complexity | Last Updated | Functionality |
|---------|--------|-----------|--------------|---------------|
| Product Catalog | ✅ Live | Medium | Jan 24 | Browse, search, filter |
| Product Images | ✅ Live | Medium | Jan 21 | Upload, display, optimization |
| Shopping Cart | ✅ Live | Medium | Jan 21 | Add/remove items, persistent |
| Cart Badge | ✅ Live | Low | Jan 21 | Shows item count |
| Checkout | ✅ Live | Medium | Jan 22 | Order creation with payment |
| Product Pagination | ✅ Live | Low | Jan 23 | 20 items/page |
| Stock Warnings | ✅ Live | Low | Jan 24 | Low-stock alerts, disable actions |
| Active/Inactive Filter | ✅ Live | Low | Jan 24 | Show only active products |
| **TOTAL** | **✅** | **Medium** | **Jan 24** | **8 features** |

### **User Management**

| Feature | Status | Complexity | Last Updated | Functionality |
|---------|--------|-----------|--------------|---------------|
| Patient Profile | ✅ Live | Medium | Jan 22 | Avatar upload, data display |
| Profile Edit | ✅ Live | Low | Jan 22 | Update personal info |
| Patient List (Admin) | ✅ Live | Medium | Jan 22 | Search, view details |
| Doctor List (Admin) | ✅ Live | Medium | Jan 22 | Manage doctors |
| Patient Linking (Admin) | ✅ Live | Medium | Feb 5 | Admin selects doctor for patient |
| Link Search | ✅ Live | Low | Feb 5 | Search patients by email/name/phone |
| Create & Link Patient | ✅ Live | Medium | Feb 5 | Auto-link new patient to doctor |
| **TOTAL** | **✅** | **Medium** | **Feb 5** | **7 features** |

### **UI/UX Features**

| Feature | Status | Complexity | Last Updated | Functionality |
|---------|--------|-----------|--------------|---------------|
| Responsive Design | ✅ Live | High | Jan 24 | Mobile-first, all breakpoints |
| Loading States | ✅ Live | Low | Jan 24 | Uniform icons across platform |
| Toast Notifications | ✅ Live | Medium | Jan 24 | Success/error feedback |
| Auth Modals | ✅ Live | Medium | Jan 21 | Guest actions require login |
| Modal Dialogs | ✅ Live | Low | Jan 24 | Forms, confirmations, info |
| Currency Formatting | ✅ Live | Low | Jan 24 | Comma-separated display |
| Image Optimization | ✅ Live | Medium | Jan 21 | Next.js Image component |
| Mobile Navigation | ✅ Live | Medium | Jan 21 | Hamburger menu, sidebars |
| Number Input Validation | ✅ Live | Low | Feb 4 | Text inputs with pattern validation |
| Discount Display | ✅ Live | Low | Feb 4 | Fixed price discount calculation |
| **TOTAL** | **✅** | **Medium** | **Feb 4** | **10 features** |

### **Security & Performance**

| Feature | Status | Complexity | Last Updated | Functionality |
|---------|--------|-----------|--------------|---------------|
| RLS Policies | ✅ Live | High | Jan 24 | Multi-role data isolation |
| RLS Optimization | ✅ Live | High | Jan 24 | Auth function caching |
| Service Role | ✅ Live | High | Jan 22 | Admin operations |
| Server-Side Rendering | ✅ Live | Medium | Jan 20 | force-dynamic, revalidate=0 |
| Cache Invalidation | ✅ Live | Medium | Jan 20 | revalidatePath pattern |
| Query Optimization | ✅ Live | Medium | Jan 24 | Pagination, search indexes |
| **TOTAL** | **✅** | **High** | **Jan 24** | **6 features** |

---

## Technology Stack Summary

### **Frontend**
- Next.js 15.5.9 with TypeScript
- React 19 (latest hooks)
- Tailwind CSS (styling)
- Framer Motion v11 (animations)
- Next.js Image (optimization)

### **Backend**
- Supabase PostgreSQL
- Server Actions (mutations)
- API Routes (if needed)
- RLS Policies (security)

### **Deployment**
- Vercel (production)
- Netlify (alternative/staging)
- Supabase Hosted (database)

### **Development**
- Git (version control)
- TypeScript (type safety)
- ESLint (code quality)
- Jest (testing framework)
- Tailwind CSS (responsive)

---

## Implementation Timeline

```
Jan 8-9:    Foundation (Auth, Config)
Jan 10-12:  Portals (Admin, Doctor, Patient)
Jan 12:     Theming (RoyaltyMeds Branding)
Jan 20:     Architectural Fix (Prescription Refactor)
Jan 21:     E-Commerce (Store, Inventory, Images)
Jan 22:     Payments (System, Receipts, Config)
Jan 23:     Refinements (UI, Mobile, Inventory)
Jan 24:     Search & Orders (Pagination, Search, RLS Opt)
```

---

## Production Readiness Checklist

- ✅ Build passes (zero errors)
- ✅ All features functional
- ✅ Mobile responsive
- ✅ Security validated (RLS)
- ✅ Payment system working
- ✅ Image handling optimized
- ✅ Documentation complete
- ✅ Deployment automated (Vercel)
- ✅ Database migrations versioned
- ✅ User workflows tested

**Status:** ✅ PRODUCTION READY

---

**End of System Architecture Document**
