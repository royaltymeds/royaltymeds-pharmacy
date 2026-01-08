# Prescription Platform Build Plan (Next.js 15 + Supabase)

## Overview
This document outlines a **phased, AI-session-friendly plan** to build a full-featured **online prescription ordering and management platform** using **Next.js 15**, **Supabase**, **Tailwind CSS/PostCSS**, and modern supporting tools. Each phase is intentionally scoped so it can be completed in **one focused AI session** without excessive token usage.

The platform includes:
- **Admin portal** (pharmacy + operations)
- **Patient-facing web app (mobile-first)**
- **Doctor prescription intake**
- **Payments, delivery, messaging, and AI assistance**

---

## Core Tech Stack

### Frontend
- **Next.js 15 (App Router)**
- **TypeScript**
- **Tailwind CSS + PostCSS** (mobile-first, modern UI)
- **shadcn/ui** (base components)
- **Sonner** (toast notifications)
- **Framer Motion** (micro-animations)

### Backend / Infrastructure
- **Supabase**
  - Auth (patients, admins, doctors)
  - PostgreSQL database
  - Row Level Security (RLS)
  - Storage (prescription uploads)
  - Edge Functions (notifications, reminders)

### Integrations (Pluggable)
- Payment gateways (Stripe, Square, PayPal)
- Messaging (Twilio, WhatsApp, Email, Push)
- Delivery tracking (Shippo, Uber Direct, DoorDash Drive)
- AI (OpenAI-compatible API)

---

## User Roles

- **Patient** – order, upload prescriptions, refill, pay
- **Admin** – approve prescriptions, manage orders, reminders
- **Doctor** – submit prescriptions
- **Courier (optional)** – delivery updates

---

# Phase 1: Project Setup & Architecture
**Goal:** Establish a clean, scalable foundation.

### Tasks
- Initialize Next.js 15 project with App Router
- Configure TypeScript
- Install Tailwind CSS + PostCSS
- Set up shadcn/ui
- Install Sonner and Framer Motion
- Create Supabase project
- Configure environment variables

### Folder Structure
```
/app
  /(auth)
  /(admin)
  /(patient)
  /(doctor)
/components
/lib
/services
/types
```

### Deliverables
- Running app
- Connected Supabase client
- Global layout + theme

---

# Phase 2: Authentication & User Management
**Goal:** Secure multi-role authentication.

### Features
- Supabase Auth (email/password, magic link)
- Role-based access control (patient/admin/doctor)
- Protected routes
- Session persistence

### Database Tables
- users
- roles
- user_profiles

### RLS Highlights
- Patients see only their own data
- Admins see all
- Doctors can only submit prescriptions

---

# Phase 3: Database Design & Core Models
**Goal:** Define all core data models.

### Key Tables
- prescriptions
- prescription_items
- orders
- refills
- deliveries
- messages
- reviews
- testimonials
- payments

### Prescription Model
- Uploaded file (Supabase Storage)
- Status (pending, approved, rejected)
- Doctor or patient origin
- Brand vs Generic choice

---

# Phase 4: Patient Frontend (Mobile-First)
**Goal:** Build the main user experience.

### Pages
- Home (e-commerce style)
- Upload Prescription
- AI Assistance Chat
- Orders & Refills
- Reviews & Testimonials
- Contact Info

### Upload Flow
1. Upload prescription
2. AI prompt:
   - "Would you like **brand** or **generic**?"
   - Explanation: same drug, lower cost
3. Confirmation toast (Sonner)

---

# Phase 5: Admin Dashboard
**Goal:** Enable pharmacy operations.

### Features
- Prescription approval (patient + doctor submissions)
- Refill reminders
- Chronic patient alerts
- Order management
- Delivery status updates

### UI
- Data tables
- Status badges
- Action drawers
- Real-time updates via Supabase subscriptions

---

# Phase 6: Doctor Prescription Intake
**Goal:** Allow doctors to submit prescriptions.

### Features
- Doctor auth
- Prescription submission form
- Attach files
- Patient lookup
- Admin notification

---

# Phase 7: Refills & Reminder System
**Goal:** Automate chronic care.

### Logic
- Identify chronic patients
- Track refill intervals
- Edge Functions for reminders

### Channels
- Email
- SMS
- In-app notifications

---

# Phase 8: Messaging & Notifications
**Goal:** Enable patient communication.

### Messaging
- Admin ↔ Patient
- Order-specific threads

### Notifications
- Sonner (frontend)
- Supabase triggers
- Twilio / Email

---

# Phase 9: Delivery & Tracking
**Goal:** Support pickup or delivery.

### Features
- Pickup vs delivery selection
- Address management
- Delivery partner integration
- Live tracking links

---

# Phase 10: Payments & Checkout
**Goal:** Monetize the platform.

### Integrations
- Stripe (primary)
- Square / PayPal (optional)

### Flow
- Order summary
- Insurance vs cash
- Secure checkout
- Payment confirmation

---

# Phase 11: Reviews & Testimonials
**Goal:** Build trust and social proof.

### Features
- Verified reviews
- Admin moderation
- Public testimonials page

---

# Phase 12: AI Assistance
**Goal:** Improve user experience.

### AI Use Cases
- Prescription explanation
- Brand vs generic education
- Refill reminders
- Customer support

### Architecture
- Server actions
- Rate limiting
- Safe medical disclaimers

---

# Phase 13: UI Polish & Accessibility
**Goal:** Professional, modern experience.

### Enhancements
- Animations
- Skeleton loaders
- Dark mode
- WCAG compliance

---

# Phase 14: Security, Compliance & Testing
**Goal:** Prepare for production.

### Focus Areas
- HIPAA-aware architecture
- Audit logs
- Encryption
- E2E testing

---

## Final Notes
- Each phase is **independently buildable**
- Designed for **incremental AI-assisted development**
- Highly scalable and extensible

---

**End of Document**

