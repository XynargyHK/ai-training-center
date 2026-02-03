# Booking System Testing Guide

## ✅ Database Verification

You've successfully run these SQL migrations:
- ✅ `015_create_chat_history_tables.sql`
- ✅ `019_service_staff_assignments.sql`
- ✅ `020_appointment_workflow.sql`

### Quick Database Check

Run this in Supabase SQL Editor to verify all tables exist:

```sql
-- Check all booking system tables
SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_name IN (
  'chat_sessions',
  'chat_messages',
  'service_staff_assignments',
  'appointment_change_requests',
  'appointment_change_history'
)
ORDER BY table_name;
```

Expected output: 5 tables

### Verify Functions

```sql
-- Check database functions
SELECT
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_name IN (
  'get_staff_for_service',
  'get_services_for_staff',
  'create_appointment_change_request',
  'manager_review_change_request',
  'client_confirm_change_request'
)
ORDER BY routine_name;
```

Expected output: 5 functions

---

## 🧪 Local Testing Steps

### 1. Start Development Server

```bash
npm run dev
```

### 2. Navigate to Booking Dashboard

Open: http://localhost:3000/booking

**Expected**:
- ✅ Page loads without errors
- ✅ Calendar with Day/Week/Month views
- ✅ Date navigation works
- ✅ Status filter dropdown
- ✅ "Add Blocked Time" button visible

### 3. Test Appointment Confirmation

**Prerequisites**: Need at least one pending appointment in database

**Steps**:
1. Create a test appointment (through chat or admin)
2. Go to `/booking`
3. Find pending appointment
4. Click "Confirm" button

**Expected**:
- ✅ Alert: "Appointment confirmed successfully!"
- ✅ Appointment status changes to "confirmed"
- ✅ Appointment refreshes in list

### 4. Test Edit Request Workflow

**Prerequisites**: Need at least one confirmed appointment

**Steps**:
1. Find confirmed appointment
2. Click "Edit" button
3. Modal opens with current details
4. Change date/time/staff/room
5. Enter reason: "Customer requested different time"
6. Click "Submit Edit Request"

**Expected**:
- ✅ Alert: "Edit request submitted successfully! Awaiting manager approval."
- ✅ Appointment status changes to "pending_edit"
- ✅ Modal closes
- ✅ Appointment list refreshes

**Database Verification**:
```sql
-- Check change request was created
SELECT * FROM appointment_change_requests
ORDER BY created_at DESC
LIMIT 1;

-- Should show:
-- - request_type: 'edit'
-- - status: 'pending_manager_approval'
-- - proposed changes in columns
-- - reason field populated
```

### 5. Test Cancel Request Workflow

**Prerequisites**: Need at least one confirmed appointment

**Steps**:
1. Find confirmed appointment
2. Click "Cancel" button
3. Modal opens
4. Enter reason: "Staff member is sick"
5. Click "Submit Cancellation Request"

**Expected**:
- ✅ Alert: "Cancellation request submitted successfully! Awaiting manager approval."
- ✅ Appointment status changes to "pending_cancellation"
- ✅ Modal closes
- ✅ Appointment list refreshes

**Database Verification**:
```sql
-- Check cancellation request
SELECT * FROM appointment_change_requests
WHERE request_type = 'cancel'
ORDER BY created_at DESC
LIMIT 1;
```

### 6. Test Block Time

**Prerequisites**: None (can test immediately)

**Steps**:
1. Click "Add Blocked Time" button
2. Select start date (e.g., tomorrow)
3. Select end date (e.g., 3 days from now)
4. Set time range (e.g., 09:00 - 17:00)
5. Enter reason: "Annual leave"
6. Click "Block Time"

**Expected**:
- ✅ Alert: "Successfully blocked X day(s)"
- ✅ Modal closes
- ✅ Time slots marked as unavailable

**Database Verification**:
```sql
-- Check blocked time was created
SELECT
  specific_date,
  start_time,
  end_time,
  is_available,
  block_reason
FROM appointment_staff_availability
WHERE is_available = false
ORDER BY created_at DESC
LIMIT 5;
```

### 7. Test Manager Review (API)

**Using Postman or curl**:

```bash
# Approve edit request
curl -X POST http://localhost:3000/api/appointments/change-request/[REQUEST_ID]/manager-review \
  -H "Content-Type: application/json" \
  -d '{
    "approved": true,
    "managerIdentifier": "manager@example.com",
    "managerNotes": "Approved - customer request"
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Change request approved. Awaiting client confirmation.",
  "nextStep": "client_confirmation"
}
```

**Database Check**:
```sql
SELECT
  status,
  manager_approved_at,
  manager_approved_by,
  manager_notes
FROM appointment_change_requests
WHERE id = '[REQUEST_ID]';

-- Should show status: 'pending_client_confirmation'
```

### 8. Test Client Confirmation (API)

```bash
# Client confirms change
curl -X POST http://localhost:3000/api/appointments/change-request/[REQUEST_ID]/client-confirm \
  -H "Content-Type: application/json" \
  -d '{
    "confirmed": true,
    "clientResponse": "Yes, the new time works for me"
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Appointment successfully updated.",
  "appointmentStatus": "confirmed"
}
```

**Database Check**:
```sql
-- Check request completed
SELECT status FROM appointment_change_requests
WHERE id = '[REQUEST_ID]';
-- Should be: 'completed'

-- Check appointment was updated
SELECT
  appointment_date,
  start_time,
  status
FROM appointments
WHERE id = '[APPOINTMENT_ID]';
-- Should show new date/time and status: 'confirmed'

-- Check history was logged
SELECT * FROM appointment_change_history
WHERE change_request_id = '[REQUEST_ID]'
ORDER BY changed_at DESC;
```

---

## 🐛 Common Issues & Solutions

### Issue: "Module not found: '@/lib/supabase/client'"
**Solution**: Already fixed - Supabase client files created ✅

### Issue: Build fails
**Solution**:
```bash
npm install @supabase/ssr
npm run build
```

### Issue: No appointments showing
**Solution**: Create test data:
```sql
-- Create test appointment
INSERT INTO appointments (
  business_unit_id,
  service_id,
  user_identifier,
  user_name,
  user_email,
  appointment_date,
  start_time,
  end_time,
  duration_minutes,
  status
) VALUES (
  (SELECT id FROM business_units WHERE slug = 'skincoach'),
  (SELECT id FROM appointment_services LIMIT 1),
  'test@example.com',
  'Test User',
  'test@example.com',
  CURRENT_DATE + 1,
  '10:00:00',
  '11:00:00',
  60,
  'pending'
);
```

### Issue: "No staff assigned to this appointment"
**Solution**: Assign staff:
```sql
UPDATE appointments
SET real_staff_id = (SELECT id FROM real_staff WHERE is_active = true LIMIT 1)
WHERE real_staff_id IS NULL;
```

### Issue: Modal doesn't open
**Solution**: Check browser console for errors. Ensure appointment has required data.

---

## ✅ Success Criteria

### Core Workflow Works:
- [ ] Staff can confirm/decline pending appointments
- [ ] Staff can request appointment edits
- [ ] Staff can request appointment cancellations
- [ ] Staff can block time for unavailability
- [ ] Manager can approve/reject requests (via API)
- [ ] Client can confirm/reject changes (via API)
- [ ] Appointment updates apply correctly
- [ ] Change history is logged

### UI/UX Works:
- [ ] All modals open and close properly
- [ ] Forms validate required fields
- [ ] Success/error messages display
- [ ] Appointment list refreshes after actions
- [ ] Date navigation works smoothly
- [ ] Status filter works
- [ ] Mobile responsive (test on phone)

### Data Integrity:
- [ ] No orphaned change requests
- [ ] History logged for all changes
- [ ] Status transitions are valid
- [ ] Timestamps are accurate
- [ ] No data loss during workflow

---

## 📊 Test Data Setup

### Minimal Test Data

```sql
-- 1. Ensure business unit exists
SELECT id, name FROM business_units WHERE slug = 'skincoach';

-- 2. Ensure service exists
SELECT id, name FROM appointment_services LIMIT 1;

-- 3. Ensure staff exists
SELECT id, name FROM real_staff WHERE is_active = true LIMIT 1;

-- 4. Create test appointment
INSERT INTO appointments (
  business_unit_id,
  service_id,
  real_staff_id,
  user_identifier,
  user_name,
  user_email,
  appointment_date,
  start_time,
  end_time,
  duration_minutes,
  status,
  booking_source
) VALUES (
  (SELECT id FROM business_units WHERE slug = 'skincoach'),
  (SELECT id FROM appointment_services LIMIT 1),
  (SELECT id FROM real_staff WHERE is_active = true LIMIT 1),
  'john.doe@example.com',
  'John Doe',
  'john.doe@example.com',
  CURRENT_DATE + 2, -- Day after tomorrow
  '14:00:00',
  '15:00:00',
  60,
  'confirmed',
  'chat'
) RETURNING id;
```

---

## 🚀 Next Testing Phase

After confirming core workflow works:

1. **Test Service Management** (when implemented):
   - Create new service
   - Edit service details
   - Delete service
   - Assign staff to service

2. **Test Staff Assignment** (when implemented):
   - View staff assignments
   - Assign multiple staff to service
   - Unassign staff from service

3. **Load Testing**:
   - Multiple appointments in same time slot
   - Concurrent edit requests
   - Block time overlapping appointments

4. **Edge Cases**:
   - Edit request for cancelled appointment
   - Cancel already cancelled appointment
   - Double-booking prevention
   - Past appointment modifications

---

## 📝 Test Checklist for Today

Quick checklist to verify everything works:

```
Database:
[ ] All 5 tables exist
[ ] All 5 functions exist
[ ] Test data created

Build:
[ ] npm run build succeeds
[ ] No TypeScript errors
[ ] No module not found errors

UI:
[ ] /booking page loads
[ ] Calendar renders
[ ] Can navigate dates
[ ] Can filter by status

Actions:
[ ] Confirm button works
[ ] Decline button works
[ ] Edit modal opens
[ ] Edit request submits
[ ] Cancel modal opens
[ ] Cancel request submits
[ ] Block time modal opens
[ ] Block time creates availability records

API (via Postman/curl):
[ ] Manager can approve request
[ ] Manager can reject request
[ ] Client can confirm change
[ ] Client can reject change

Verification:
[ ] Database records created correctly
[ ] Status transitions work
[ ] History logged properly
```

---

## 🎉 When Everything Works

You'll know the booking system is working when:

1. Staff can manage their appointments through `/booking`
2. Edit/cancel requests flow through the approval process
3. Changes apply to appointments correctly
4. Complete audit trail in change_history
5. Block time prevents new bookings

**Congratulations!** You'll have a fully functional appointment workflow system! 🎊
