# RoyaltyMeds - Your Trusted Online Pharmacy & Prescription Management Platform

**Status**: Production Ready ✅ | **Live**: https://royaltymedspharmacy.com

---

## What is RoyaltyMeds?

RoyaltyMeds is a **modern digital pharmacy platform** that makes managing your prescriptions simple, secure, and convenient. We connect patients, healthcare providers, and pharmacists to streamline prescription ordering, refills, and delivery right to your home.

Whether you need to **order a new prescription**, **request refills**, **track your medications**, or **communicate with your pharmacy**, RoyaltyMeds provides an easy-to-use online solution available 24/7.

### Why Choose RoyaltyMeds?

✅ **Fast & Easy** - Order prescriptions in minutes from your phone or computer  
✅ **Secure & Private** - Your health data is protected with bank-level encryption  
✅ **Always Available** - Access your account 24/7, anytime, anywhere  
✅ **Reliable** - Trusted by thousands of patients nationwide  
✅ **Free to Use** - No hidden fees or subscription charges  

---

## 🎯 Who Benefits from RoyaltyMeds?

### 👤 **Patients**
- Order prescriptions online in minutes
- Track medication status in real-time
- Request refills instantly
- View complete prescription history
- Communicate securely with pharmacists
- Upload and store personal health information
- Upload and manage your profile picture

### 👨‍⚕️ **Healthcare Providers & Doctors**
- Submit prescriptions electronically to pharmacies
- Monitor prescription fulfillment status
- Access patient medication history
- Manage multiple patient accounts
- Generate compliance reports

### 💊 **Pharmacy Administrators**
- Manage incoming prescriptions efficiently
- Track inventory and orders
- Process refill requests
- Communicate with patients and doctors
- Generate sales and compliance reports

---

## ✨ Key Features

### 📱 **Patient Dashboard**
- **Prescription Management** - View all prescriptions with detailed information and status tracking
- **Refill Requests** - Request refills with one click and track approval status
- **Order History** - Complete order history with tracking information and delivery updates
- **Medicine Orders** - Place and manage prescription and over-the-counter medicine orders
- **Message Center** - Secure messaging with pharmacists and support team
- **Profile Management** - Update personal information, store medical history, and upload profile picture
- **Account Security** - Change password, manage devices, and security settings

### 🏥 **Healthcare Provider Portal**
- **Prescription Submission** - Submit prescriptions electronically to partner pharmacies
- **Patient Management** - Access your patient list and complete medication history
- **Prescription Tracking** - Monitor prescription status from submission to fulfillment
- **Dashboard** - Overview of all submitted prescriptions and patient interactions

### 💼 **Admin & Pharmacy Dashboard**
- **Prescription Management** - View and manage all prescriptions in the system
- **Order Processing** - Handle patient orders and shipments
- **Inventory Control** - Track medication stock levels and reorder
- **Doctor Management** - Manage healthcare provider accounts and credentials
- **User Management** - Control access and manage user accounts
- **Analytics & Reports** - View platform metrics and compliance reports
- **Payment Tracking** - Monitor transactions and payment status

### 🔒 **Security & Privacy**
- **Secure Authentication** - Email/password and magic link sign-in options
- **Row-Level Security (RLS)** - Database-enforced privacy—patients only see their own data
- **Encrypted Data** - All sensitive information encrypted in transit and at rest
- **HIPAA-Ready** - Built with healthcare compliance in mind
- **Audit Logging** - Complete audit trail for regulatory compliance
- **Secure File Upload** - Encrypted storage for prescription documents and medical records

### 📲 **Mobile-First Design**
- **Responsive Interface** - Works perfectly on phones, tablets, and desktops
- **Intuitive Navigation** - Simple, clear layout anyone can understand
- **Fast Loading** - Optimized for slow connections
- **Accessible Design** - Works with screen readers and accessibility tools

---

## 🚀 Getting Started (For Developers)

### Quick Start

1. **Install Dependencies**
   ```bash
   npm install --legacy-peer-deps
   ```

2. **Configure Environment**
   - Your `.env.local` is pre-configured with Supabase credentials
   - No additional setup needed for basic development

3. **Set Up Database**
   - Follow **[docs/MIGRATION_GUIDE.md](docs/MIGRATION_GUIDE.md)** to create database schema
   - Runs automatically on first deployment

4. **Start Development**
   ```bash
   npm run dev
   ```
   - Open [http://localhost:3000](http://localhost:3000)
   - Changes auto-reload instantly

5. **Deploy to Production**
   ```bash
   npm run build
   npm start
   ```

---

## 📂 Project Structure

```
royaltymeds_prescript/
├── app/                          # Next.js App Router
│   ├── auth/                    # Authentication pages & callbacks
│   ├── admin/                   # Admin dashboard routes
│   ├── patient/                 # Patient app features
│   │   ├── home/               # Patient dashboard
│   │   ├── prescriptions/       # Prescription viewing
│   │   ├── orders/             # Order management
│   │   ├── refills/            # Refill requests
│   │   ├── messages/           # Patient messaging
│   │   ├── profile/            # Profile management
│   │   └── layout.tsx          # Patient layout
│   ├── doctor/                  # Doctor portal
│   ├── layout.tsx               # Root layout
│   └── globals.css              # Global styles
├── components/                  # Reusable React components
├── lib/                         # Utility functions
│   ├── supabase-client.ts      # Client-side Supabase
│   ├── supabase-server.ts      # Server-side Supabase
│   └── supabase-ssr.ts         # SSR helpers
├── app/actions/                # Server actions for mutations
├── types/                       # TypeScript type definitions
├── docs/                        # Documentation
├── supabase/                    # Database migrations
├── middleware.ts                # Auth middleware
├── tsconfig.json               # TypeScript config
├── tailwind.config.ts          # Tailwind config
├── next.config.js              # Next.js config
└── package.json                # Dependencies
```

---

## 🔧 Available Commands

```bash
# Development
npm run dev           # Start development server on localhost:3000
npm run build        # Create production build
npm start            # Run production server

# Code Quality
npm run lint         # Check code style with ESLint

# Database
npm run migrate      # Run database migrations
```

---

## 📄 License

MIT License - Build on this platform freely

---

## 🙋 Have Questions?

- 📧 **Email**: support@royaltymedspharmacy.com
- 🌐 **Website**: https://royaltymedspharmacy.com
- 📚 **Documentation**: See `/docs` folder for detailed guides

---

## 👤 About RoyaltyMeds

RoyaltyMeds is a production-ready prescription management platform used by thousands of patients, healthcare providers, and pharmacies. We're committed to making prescription management simple, secure, and accessible to everyone.

**Made with ❤️ by the RoyaltyMeds Development Team**
