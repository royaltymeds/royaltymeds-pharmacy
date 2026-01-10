# RLS Policy Review & Permissiveness Analysis

**Date:** January 10, 2026
**Status:** Policy review for UX optimization

## Current Policy Assessment

### ✅ GOOD - Already Permissive
1. **Reviews Table**
   - `Anyone can view reviews` - FULLY PERMISSIVE ✅
   - Patients can create their own - GOOD ✅

2. **Testimonials Table** 
   - `Public can view approved testimonials` - FULLY PERMISSIVE ✅
   - Admins can view all - GOOD ✅

3. **Messages Table**
   - Users can view messages they're part of - GOOD ✅
   - Users can send messages - GOOD ✅

### ⚠️ POTENTIALLY TOO RESTRICTIVE - Recommendations

#### 1. **User Profiles - UPDATE Operations**
**Current:** Only UPDATE own profile
**Issue:** Users cannot view/edit others' profiles, even admins only have SELECT
**Recommendation:**
- ✅ Add: `Admins can update any user profile`
- ✅ Add: `Admins can delete user profiles`
- ✅ Add: `Users can insert their own profile (for signup)`

#### 2. **Prescriptions - UPDATE/DELETE Operations**
**Current:** Only admins can UPDATE, no DELETE policies
**Issue:** Patients/doctors cannot update their own prescriptions; no deletion allowed
**Recommendation:**
- ✅ Add: `Patients can update their own prescriptions (status-dependent)`
- ✅ Add: `Doctors can update prescriptions they submitted`
- ✅ Add: `Admins can delete prescriptions`

#### 3. **Orders - UPDATE/DELETE Operations**
**Current:** Only admins can UPDATE, no DELETE policies
**Issue:** Patients cannot update their own orders; no deletion
**Recommendation:**
- ✅ Add: `Patients can update their own orders (specific fields)`
- ✅ Add: `Admins can delete orders`

#### 4. **Prescription Items - INSERT/UPDATE/DELETE**
**Current:** Only SELECT allowed
**Issue:** Cannot create, update, or delete prescription items
**Recommendation:**
- ✅ Add: `Users can insert items for their prescriptions`
- ✅ Add: `Users can update items in their prescriptions`
- ✅ Add: `Admins can delete items`

#### 5. **Refills - UPDATE Operations**
**Current:** Only INSERT and SELECT, no UPDATE
**Issue:** Cannot update refill status/information
**Recommendation:**
- ✅ Add: `Doctors can update refill status for their prescriptions`
- ✅ Add: `Admins can update any refill`

#### 6. **Deliveries - UPDATE/DELETE Operations**
**Current:** Only admins can UPDATE, no DELETE
**Issue:** Couriers cannot update their own deliveries
**Recommendation:**
- ✅ Add: `Couriers can update their assigned deliveries`
- ✅ Add: `Admins can delete deliveries`

#### 7. **Payments - INSERT/UPDATE/DELETE**
**Current:** Only SELECT allowed
**Issue:** Cannot create or update payment records
**Recommendation:**
- ✅ Add: `Patients can insert their own payments`
- ✅ Add: `Admins can update any payment`

#### 8. **Messages - UPDATE/DELETE**
**Current:** No UPDATE/DELETE policies
**Issue:** Messages cannot be edited or deleted
**Recommendation:**
- ✅ Add: `Users can delete their own messages`
- ✅ Mark messages read via UPDATE

#### 9. **Testimonials - INSERT/UPDATE/DELETE**
**Current:** Only SELECT allowed
**Issue:** Cannot submit testimonials or manage them
**Recommendation:**
- ✅ Add: `Authenticated users can insert testimonials`
- ✅ Add: `Admins can update/delete testimonials`

## Priority Implementation Order

### HIGH PRIORITY (Blocks Core UX)
1. Prescription Items - INSERT/UPDATE
2. Orders - UPDATE  
3. User Profiles - INSERT/UPDATE
4. Payments - INSERT

### MEDIUM PRIORITY (Enhances UX)
1. Refills - UPDATE
2. Prescriptions - UPDATE
3. Deliveries - UPDATE
4. Messages - UPDATE/DELETE

### LOW PRIORITY (Polish)
1. Delete operations (generally discouraged in medical apps)
2. Testimonials - INSERT

## Security Considerations

**SAFE to enable:**
- Users updating their own records
- Couriers updating assigned deliveries
- Doctors updating refills for their prescriptions
- Patients inserting/updating items for their orders

**REQUIRE CAREFUL VALIDATION:**
- Payment updates (should be admin-only typically)
- Prescription status updates (may have business logic)
- Order updates (validate allowed fields)

**SHOULD STAY ADMIN-ONLY:**
- User account deletion
- Cascade deletes that affect other records
- Changing roles/permissions
