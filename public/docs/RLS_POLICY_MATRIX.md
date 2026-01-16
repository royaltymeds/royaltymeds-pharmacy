# RLS Policy Matrix - Complete Reference

**Last Updated:** January 10, 2026
**Status:** ✅ PRODUCTION READY

## Policy Access Matrix by Table

### Users Table
| Operation | Owner | Patient | Doctor | Admin | Public |
|-----------|-------|---------|--------|-------|--------|
| SELECT | Own | ✅ | ✅ | ✅ | ❌ |
| INSERT | ❌ | ❌ | ❌ | ❌ | ❌ |
| UPDATE | ❌ | ❌ | ❌ | ❌ | ❌ |
| DELETE | ❌ | ❌ | ❌ | ❌ | ❌ |
**Note:** User creation via Supabase Auth, not direct table insert

### User Profiles Table
| Operation | Owner | Patient | Doctor | Admin | Public |
|-----------|-------|---------|--------|-------|--------|
| SELECT | ✅ | ✅ | ✅ | ✅ | ❌ |
| INSERT | ✅ | ✅ | ✅ | ✅ | ❌ |
| UPDATE | ✅ | ✅ | ✅ | ✅ | ❌ |
| DELETE | ❌ | ❌ | ❌ | ✅ | ❌ |

### Prescriptions Table
| Operation | Owner | Patient | Doctor | Admin | Public |
|-----------|-------|---------|--------|-------|--------|
| SELECT | ✅ (own) | ✅ (own) | ✅ (own) | ✅ | ❌ |
| INSERT | ✅ | ✅ | ✅ | ✅ | ❌ |
| UPDATE | ✅ | ✅ | ✅ | ✅ | ❌ |
| DELETE | ❌ | ❌ | ❌ | ✅ | ❌ |
**Roles:** patient_id (owner) = Patient, doctor_id (owner) = Doctor

### Orders Table
| Operation | Owner | Patient | Doctor | Admin | Public |
|-----------|-------|---------|--------|-------|--------|
| SELECT | ✅ | ✅ (own) | ❌ | ✅ | ❌ |
| INSERT | ✅ | ✅ (own) | ❌ | ✅ | ❌ |
| UPDATE | ✅ | ✅ (own) | ❌ | ✅ | ❌ |
| DELETE | ❌ | ❌ | ❌ | ✅ | ❌ |

### Prescription Items Table
| Operation | Owner | Patient | Doctor | Admin | Public |
|-----------|-------|---------|--------|-------|--------|
| SELECT | ✅ | ✅ (in own prescription) | ✅ (in own prescription) | ✅ | ❌ |
| INSERT | ✅ | ✅ (in own prescription) | ✅ (in own prescription) | ✅ | ❌ |
| UPDATE | ✅ | ✅ (in own prescription) | ✅ (in own prescription) | ✅ | ❌ |
| DELETE | ❌ | ❌ | ❌ | ✅ | ❌ |

### Refills Table
| Operation | Owner | Patient | Doctor | Admin | Public |
|-----------|-------|---------|--------|-------|--------|
| SELECT | ✅ | ✅ (own) | ✅ (for own prescriptions) | ✅ | ❌ |
| INSERT | ✅ | ✅ (own) | ❌ | ✅ | ❌ |
| UPDATE | ✅ | ✅ (own) | ✅ (for own prescriptions) | ✅ | ❌ |
| DELETE | ❌ | ❌ | ❌ | ❌ | ❌ |

### Deliveries Table
| Operation | Owner | Patient | Doctor | Admin | Public |
|-----------|-------|---------|--------|-------|--------|
| SELECT | ✅ | ✅ (for own orders) | ❌ | ✅ (if assigned) | ❌ |
| INSERT | ❌ | ❌ | ❌ | ✅ | ❌ |
| UPDATE | ✅ | ✅ (if courier) | ❌ | ✅ | ❌ |
| DELETE | ❌ | ❌ | ❌ | ✅ | ❌ |
**Roles:** courier_id (owner) = Courier

### Messages Table
| Operation | Owner | Patient | Doctor | Admin | Public |
|-----------|-------|---------|--------|-------|--------|
| SELECT | ✅ | ✅ (sent/received) | ✅ (sent/received) | ✅ (sent/received) | ❌ |
| INSERT | ✅ | ✅ (sender) | ✅ (sender) | ✅ (sender) | ❌ |
| UPDATE | ✅ | ✅ (own messages) | ✅ (own messages) | ✅ (own messages) | ❌ |
| DELETE | ✅ | ✅ (own messages) | ✅ (own messages) | ✅ (own messages) | ❌ |

### Reviews Table
| Operation | Owner | Patient | Doctor | Admin | Public |
|-----------|-------|---------|--------|-------|--------|
| SELECT | ✅ | ✅ | ✅ | ✅ | ✅ |
| INSERT | ✅ | ✅ (for own orders) | ❌ | ✅ | ❌ |
| UPDATE | ❌ | ❌ | ❌ | ❌ | ❌ |
| DELETE | ❌ | ❌ | ❌ | ❌ | ❌ |

### Testimonials Table
| Operation | Owner | Patient | Doctor | Admin | Public |
|-----------|-------|---------|--------|-------|--------|
| SELECT | ✅ (if approved) | ✅ (own + approved) | ✅ (approved only) | ✅ | ✅ (approved only) |
| INSERT | ✅ | ✅ | ✅ | ✅ | ✅ |
| UPDATE | ❌ | ❌ | ❌ | ✅ | ❌ |
| DELETE | ✅ (own) | ✅ (own) | ❌ | ✅ | ❌ |

### Payments Table
| Operation | Owner | Patient | Doctor | Admin | Public |
|-----------|-------|---------|--------|-------|--------|
| SELECT | ✅ | ✅ (own) | ❌ | ✅ | ❌ |
| INSERT | ✅ | ✅ (own) | ❌ | ✅ | ❌ |
| UPDATE | ❌ | ❌ | ❌ | ✅ | ❌ |
| DELETE | ❌ | ❌ | ❌ | ✅ | ❌ |

### Audit Logs Table
| Operation | Owner | Patient | Doctor | Admin | Public |
|-----------|-------|---------|--------|-------|--------|
| SELECT | ❌ | ❌ | ❌ | ✅ | ❌ |
| INSERT | ❌ | ❌ | ❌ | ✅ | ❌ |
| UPDATE | ❌ | ❌ | ❌ | ❌ | ❌ |
| DELETE | ❌ | ❌ | ❌ | ❌ | ❌ |

## Security Principles Applied

### 1. **Ownership Verification**
- `patient_id::text = current_user_id()` for patient-owned records
- `doctor_id::text = current_user_id()` for doctor-owned records
- `courier_id::text = current_user_id()` for courier-assigned records

### 2. **Role-Based Access**
- Admin role: `current_user_role() = 'admin'` → Full access
- Patient role: Access to own records and shared records
- Doctor role: Access to prescriptions and refills they manage
- Public: Only approved/non-sensitive data

### 3. **Relational Integrity**
- Prescription Items: Verified via prescription_id ownership
- Refills: Verified via prescription.doctor_id or patient_id
- Deliveries: Verified via order.patient_id or courier_id
- Messages: Verified via sender_id OR recipient_id

### 4. **Data Sensitivity**
- **Public:** Reviews, approved testimonials
- **User Own:** User profiles, own messages, own orders
- **Role-based:** Prescriptions (doctor/patient), refills (doctor approval)
- **Admin-only:** Audit logs, user management

## Workflow Examples

### Patient Registration & Profile Creation
1. User creates account via Supabase Auth
2. User inserts own user_profile record ✅
3. User can UPDATE own profile ✅

### Prescription Submission
1. Doctor submits prescription (patient_id + doctor_id) ✅
2. Patient views own prescriptions ✅
3. Patient can add/update prescription items ✅
4. Admin can view/update/delete as needed ✅

### Order & Delivery Flow
1. Patient creates order (patient_id) ✅
2. Patient updates order status ✅
3. Admin assigns courier (creates delivery) ✅
4. Courier updates delivery status ✅
5. Patient views delivery progress ✅

### Refill Request Flow
1. Patient requests refill ✅
2. Doctor approves/rejects refill ✅
3. Patient tracks refill status ✅
4. Admin can override if needed ✅

### Payment Processing
1. Patient initiates payment (INSERT) ✅
2. Payment record created with patient_id ✅
3. Admin updates payment status after processing ✅

## Policy Count Summary

| Table | SELECT | INSERT | UPDATE | DELETE | Total |
|-------|--------|--------|--------|--------|-------|
| users | 2 | 0 | 0 | 0 | 2 |
| user_profiles | 2 | 1 | 2 | 1 | 6 |
| prescriptions | 1 | 1 | 1 | 1 | 4 |
| orders | 2 | 2 | 2 | 1 | 7 |
| prescription_items | 2 | 1 | 1 | 1 | 5 |
| refills | 1 | 2 | 3 | 0 | 6 |
| deliveries | 2 | 0 | 2 | 1 | 5 |
| messages | 1 | 2 | 1 | 1 | 5 |
| reviews | 1 | 1 | 0 | 0 | 2 |
| testimonials | 2 | 1 | 1 | 1 | 5 |
| payments | 2 | 1 | 1 | 1 | 5 |
| audit_logs | 1 | 1 | 0 | 0 | 2 |
| **TOTAL** | **19** | **13** | **14** | **8** | **54** |

## Notes

- All policies use `current_user_id()` to get user UUID from JWT claims
- All policies use `current_user_role()` to get role from JWT claims
- Admin role = bypass most restrictions with full CRUD
- No delete on most tables (soft deletes recommended for audit trail)
- Policies enforce both vertical (role) and horizontal (record-level) access control
- All policies are optimized for query performance (no N+1 subqueries)
