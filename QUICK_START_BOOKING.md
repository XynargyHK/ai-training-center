# Quick Start Guide - New Booking System

## 🚀 Getting Started in 3 Steps

### Step 1: Run Database Migrations (5 minutes)

1. Open **Supabase Dashboard**: https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** (left sidebar)
4. Click **+ New query**

**Migration 1 - Service Staff Assignments:**
```sql
-- Copy entire contents of sql-migrations/019_service_staff_assignments.sql
-- Paste here and click Run (or F5)
```

**Migration 2 - Approval Workflow:**
```sql
-- Copy entire contents of sql-migrations/020_appointment_workflow.sql
-- Paste here and click Run (or F5)
```

5. Verify tables created:
   - Go to **Table Editor**
   - Look for: `service_staff_assignments`, `appointment_change_requests`, `appointment_change_history`

---

### Step 2: View the New Dashboard

```bash
# Visit in your browser:
http://localhost:3000/booking
```

You should see:
- Calendar view (Day/Week/Month)
- Appointment list with filters
- Confirm/Decline/Edit/Cancel buttons
- Block Time section

---

### Step 3: Test the System

1. **Book an appointment** via the chat interface (Calendar button)
2. **View it in /booking** - it should appear in the list
3. **Click Confirm** - status changes to confirmed (when wired up)

---

## 📁 Key Files Created

### Database Migrations
- `sql-migrations/019_service_staff_assignments.sql`
- `sql-migrations/020_appointment_workflow.sql`

### Frontend
- `src/app/booking/page.tsx` - Staff dashboard

### Backend Types
- `src/lib/appointments/types.ts` - Updated with new types

### Documentation
- `BOOKING_SYSTEM_REFACTOR_STATUS.md` - Complete project status

---

## 🎯 What Works Now

✅ Database schema for complete workflow
✅ Staff dashboard UI at `/booking`
✅ Calendar view (Day/Week/Month)
✅ Appointment list with filtering
✅ Status color coding
✅ TypeScript types for all features

---

## 🚧 What Needs to Be Completed

The following features are designed but not yet implemented:

### 1. API Endpoints (High Priority)
Create these files:
- `src/app/api/appointments/change-request/route.ts`
- `src/app/api/appointments/change-request/[id]/manager-review/route.ts`
- `src/app/api/appointments/change-request/[id]/client-confirm/route.ts`

### 2. Wire Up UI Actions
In `src/app/booking/page.tsx`:
- Connect Confirm/Decline buttons to `/api/appointments/confirm`
- Connect Edit button to create change request
- Connect Cancel button to create cancel request
- Add modals for collecting notes/reasons

### 3. Service Management UI
Create:
- `src/components/admin/service-management.tsx`
- `src/app/api/services/route.ts`

### 4. Staff Assignment Interface
Create:
- `src/components/admin/staff-assignment.tsx`
- `src/app/api/services/[id]/staff/route.ts`

### 5. Block Time Modal
Create:
- `src/components/booking/block-time-modal.tsx`

### 6. Cleanup
- Delete `src/app/provider/page.tsx`

---

## 💡 Quick Tips

### Understanding the Workflow

**Normal Booking:**
```
Customer books → pending → Staff confirms → confirmed → completed
```

**Edit Request:**
```
Staff requests edit → pending_edit → Manager approves → pending_client_confirmation → Client confirms → confirmed
```

**Cancel Request:**
```
Staff requests cancel → pending_cancellation → Manager approves → pending_client_confirmation → Client confirms → cancelled
```

### Database Functions Available

All these functions are ready to use in your API endpoints:

```sql
-- Get staff for a service
SELECT * FROM get_staff_for_service('service-uuid');

-- Get services for a staff member
SELECT * FROM get_services_for_staff('staff-uuid');

-- Create change request (call from API)
SELECT create_appointment_change_request(
  p_appointment_id := 'apt-uuid',
  p_request_type := 'edit',
  p_staff_id := 'staff-uuid',
  p_reason := 'Client requested different time',
  p_proposed_date := '2025-12-01',
  p_proposed_start_time := '14:00',
  p_proposed_end_time := '15:00'
);

-- Manager review (call from API)
SELECT manager_review_change_request(
  p_request_id := 'request-uuid',
  p_approved := true,
  p_manager_identifier := 'manager@email.com',
  p_manager_notes := 'Approved - staff has availability'
);

-- Client confirm (call from API)
SELECT client_confirm_change_request(
  p_request_id := 'request-uuid',
  p_confirmed := true,
  p_client_response := 'Yes, the new time works for me'
);
```

---

## 🔍 Troubleshooting

### "Table does not exist" error
- Make sure you ran both SQL migrations in Supabase SQL Editor
- Check Table Editor to verify tables were created

### "/booking page is blank"
- Check browser console for errors
- Verify migrations ran successfully
- Check that `business_units` table has 'skincoach' entry

### "No appointments showing"
- Book a test appointment via chat interface first
- Check that appointment was created in database
- Verify business_unit_id matches in both places

---

## 📚 Additional Resources

- **Full Project Status**: See `BOOKING_SYSTEM_REFACTOR_STATUS.md`
- **Original Appointment Docs**: See `APPOINTMENT_SYSTEM_README.md`
- **Database Schema**: Review the SQL migration files
- **Type Definitions**: Check `src/lib/appointments/types.ts`

---

## 🎉 Next Steps

1. **Run the migrations** (Step 1 above)
2. **Test the /booking page** (Step 2 above)
3. **Review remaining tasks** in `BOOKING_SYSTEM_REFACTOR_STATUS.md`
4. **Implement API endpoints** for the approval workflow
5. **Wire up the UI actions** to make buttons functional

The foundation is complete and ready to build upon!
