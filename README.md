# RoyaltyMeds Prescription Platform

**Status**: Phase 1 Complete ✅

An **online prescription ordering and management platform** built with **Next.js 15**, **Supabase**, and **Tailwind CSS**.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install --legacy-peer-deps
```

### 2. Configure Environment
Your `.env.local` is already set up with Supabase credentials.

### 3. Run Database Migration
Follow **[docs/MIGRATION_GUIDE.md](docs/MIGRATION_GUIDE.md)** to set up the database schema in Supabase.

### 4. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📂 Project Structure

```
.
├── app/                      # Next.js App Router
│   ├── (auth)/              # Authentication routes
│   ├── (admin)/             # Admin dashboard routes
│   ├── (patient)/           # Patient app routes
│   ├── (doctor)/            # Doctor submission routes
│   ├── page.tsx             # Home page
│   ├── layout.tsx           # Root layout
│   └── globals.css          # Global styles
├── components/              # Reusable React components
├── lib/                     # Utility functions
│   └── supabase.ts         # Supabase client setup
├── services/                # API service functions
├── types/                   # TypeScript type definitions
│   └── database.ts         # Database schema types
├── scripts/                 # Build & migration scripts
│   ├── migration.sql       # Database schema (12 tables)
│   └── migrate-pg.js       # Migration runner
├── .env.local              # Environment variables (secrets)
├── next.config.js          # Next.js configuration
├── tsconfig.json           # TypeScript configuration
├── tailwind.config.ts      # Tailwind CSS configuration
└── package.json            # Dependencies & scripts
```

---

## 🏗️ Tech Stack

### Frontend
- **Next.js 15** (App Router, React 19)
- **TypeScript** (type-safe)
- **Tailwind CSS + PostCSS** (mobile-first styling)
- **shadcn/ui** (component library)
- **Sonner** (toast notifications)
- **Framer Motion** (animations)

### Backend
- **Supabase** (PostgreSQL + Auth + Storage)
  - **Database**: PostgreSQL with custom royaltymeds schema
  - **Authentication**: Email/password, Magic links
  - **Storage**: Prescription file uploads
  - **Row Level Security (RLS)**: Fine-grained access control
  - **Edge Functions**: Serverless (future)

### Integrations (Coming Soon)
- **Payments**: Stripe, Square, PayPal
- **Messaging**: Twilio, WhatsApp, Email
- **Delivery**: Shippo, Uber Direct, DoorDash
- **AI**: OpenAI, Replicate

---

## 📊 Database Schema

### Core Tables
| Table | Purpose |
|-------|---------|
| `users` | User accounts (patient, admin, doctor) |
| `user_profiles` | Extended user information |
| `prescriptions` | Prescription documents |
| `orders` | Patient orders |
| `prescription_items` | Individual prescription items |
| `refills` | Refill requests and tracking |
| `deliveries` | Shipping and tracking |
| `messages` | Patient-Admin messaging |
| `reviews` | Customer reviews |
| `testimonials` | Marketing testimonials |
| `payments` | Payment records |
| `audit_logs` | Security audit trail |

### Security
- ✅ **Row Level Security (RLS)** enabled on all tables
- ✅ **JWT-based access control** (patients see own data only)
- ✅ **Admin override** for operations
- ✅ **Audit logging** for compliance
- ✅ **Foreign key constraints** with cascade deletes

---

## 📋 Phases

- **✅ Phase 1**: Project Setup & Architecture
- **⏳ Phase 2**: Authentication & User Management
- **⏳ Phase 3**: Database Design & Core Models
- **⏳ Phase 4**: Patient Frontend (Mobile-First)
- **⏳ Phase 5**: Admin Dashboard
- **⏳ Phase 6**: Doctor Prescription Intake
- **⏳ Phase 7**: Refills & Reminder System
- **⏳ Phase 8**: Messaging & Notifications
- **⏳ Phase 9**: Delivery & Tracking
- **⏳ Phase 10**: Payments & Checkout
- **⏳ Phase 11**: Reviews & Testimonials
- **⏳ Phase 12**: AI Assistance
- **⏳ Phase 13**: UI Polish & Accessibility
- **⏳ Phase 14**: Security, Compliance & Testing

---

## 🔧 Available Scripts

```bash
# Development
npm run dev           # Start dev server (localhost:3000)
npm run build         # Production build
npm start            # Start production server
npm run lint         # Run ESLint

# Database
npm run migrate      # Run database migration
```

---

## 📄 License

MIT

---

## 👤 Author

RoyaltyMeds Development Team
