# E-Commerce Quick Deployment Guide

## ⚡ One-Command Deployment

### Step 1: Apply Database Migration
```bash
cd c:\websites\royaltymeds_prescript
npx supabase db push
```

This will:
- Create `orders`, `order_items`, `cart_items` tables
- Add 8 RLS security policies
- Create 8 performance indexes
- Enable Row-Level Security

### Step 2: Commit Changes
```bash
git add .
git commit -m "feat: add ecommerce store, cart, and order management

- Store page with OTC drug browsing
- Product search and category filtering
- Shopping cart with persistent storage
- Checkout flow with address entry
- Order creation with tax/shipping calculation
- Patient order history and tracking
- Admin order management with status updates
- RLS policies for security
- Database migrations for orders system"

git push origin main
```

Vercel will automatically deploy on push.

### Step 3: Verify Deployment
Visit these URLs to verify everything works:

1. **Store**: https://your-domain.com/store
2. **Cart**: https://your-domain.com/cart
3. **Patient Orders**: https://your-domain.com/patient/orders
4. **Admin Orders**: https://your-domain.com/admin/orders

---

## 📋 What Was Implemented

### Database (Migration 20260121000003)
```
✅ orders table (12 columns, order management)
✅ order_items table (6 columns, line items)
✅ cart_items table (6 columns, persistent cart)
✅ 8 RLS policies (security)
✅ 8 indexes (performance)
```

### Backend (Server Actions)
```
✅ Cart operations (5 functions)
✅ Order operations (4 functions)
✅ Admin operations (2 functions)
✅ Order number generation
✅ Tax/shipping calculations
```

### Frontend Components
```
✅ Store page (browse products)
✅ Store client (search, filter, cards)
✅ Cart page (manage items, checkout)
✅ Patient orders (history, tracking)
✅ Admin orders (management, status updates)
```

### Security
```
✅ Row-Level Security policies
✅ User authentication required
✅ Admin operations bypass RLS via service role key
✅ Address validation
✅ Error handling
```

---

## 🧪 Quick Test Flow

1. **Register as patient** (sign up at /signup)
2. **Go to store** (/store)
3. **Search products** (try "aspirin")
4. **Add to cart** (click Add button)
5. **View cart** (top right link)
6. **Checkout** (fill addresses)
7. **Place order** (creates order)
8. **View order history** (/patient/orders)
9. **As admin**, go to /admin/orders
10. **Update status** (pending → confirmed → shipped → delivered)

---

## 🔧 Configuration Notes

### Environment Variables (Already Configured)
- `NEXT_PUBLIC_SUPABASE_URL` - Used for client
- `SUPABASE_SERVICE_ROLE_KEY` - Used for admin operations
- Both in `.env.local`

### Next.js Configuration
- Image domains already configured for Supabase
- TypeScript strict mode enabled
- Build optimization enabled

### Database Configuration
- RLS enforced on all tables
- Proper foreign key relationships
- Cascade deletes for cleanup

---

## 📊 Data After Deployment

### After users start ordering:

**Orders Table** will contain:
- Customer orders with unique order numbers
- Order status (pending → delivered)
- Total amount, tax, shipping
- Shipping and billing addresses

**Order Items Table** will contain:
- Line items per order
- Drug name and pricing (snapshot)
- Quantities and totals

**Cart Items Table** will contain:
- Current cart contents per user
- Updated when user adds/removes items
- Cleared after order creation

---

## 🚨 Troubleshooting

### Migration Fails
```
Error: "orders" table already exists
→ Run: npx supabase db reset (DEV ONLY)
→ Or: Check if migration already applied
```

### Cart Not Persisting
```
Error: Cart items not saved
→ Check: User is authenticated
→ Check: RLS policy allows INSERT on cart_items
→ Check: Database has connectivity
```

### Orders Not Visible to Admin
```
Error: Admin doesn't see orders
→ Check: Service role key is set
→ Check: Admin role is correct in auth
→ Check: RLS policy allows admin SELECT
```

### Build Fails
```
Error: TypeScript errors
→ Run: npm run build locally
→ Check: All types imported correctly
→ Check: No unused imports
```

---

## 📞 Support

If deployment issues occur:

1. Check build logs at Vercel dashboard
2. Check Supabase dashboard for migration status
3. Verify all environment variables are set
4. Check browser console for client-side errors
5. Check Supabase logs for database errors

---

## 🎯 Next Steps (Optional Enhancements)

After deployment is verified, consider:

1. **Add "Start Ordering" button to landing page** → links to /store
2. **Email notifications** → send order confirmation emails
3. **Payment integration** → Stripe or PayPal
4. **Inventory management** → deduct items on order
5. **Shipping integration** → real tracking numbers
6. **Refund system** → handle returns

These can be added without touching the core order system.

---

## 📦 Deployment Checklist

- [ ] Database migration applied (`npx supabase db push`)
- [ ] All environment variables set
- [ ] Code committed and pushed to main
- [ ] Vercel deployment completed
- [ ] Store page loads at /store
- [ ] Cart page loads at /cart  
- [ ] Patient orders page loads at /patient/orders
- [ ] Admin orders page loads at /admin/orders
- [ ] Test add to cart flow
- [ ] Test checkout and order creation
- [ ] Test admin order management
- [ ] Verify RLS policies working (users see only own data)

---

**Last Updated**: January 21, 2026  
**Build Status**: ✅ Ready for production
