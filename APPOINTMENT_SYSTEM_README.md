# Appointment Booking System

Complete appointment booking system with dual-resource availability checking (staff + rooms) and provider confirmation workflow.

## Features

### Customer Side (Chat Integration)
- **Calendar button** in chat interface
- **Hour-based grid** showing available/blocked slots
- **Service selection** with descriptions and pricing
- **Date & time picker** with real-time availability
- **Customer details** form (phone, special requests)
- **Booking confirmation** with appointment summary

### Provider Side (Dashboard)
- **Provider dashboard** at `/provider`
- **Pending/Confirmed/All** appointment tabs
- **Appointment details** with customer information
- **Confirm/Decline** actions with notes
- **Real-time updates** when appointments change

### Smart Availability System
- **Dual resource checking**: Staff + Room availability simultaneously
- **Auto-assignment**: System finds available staff+room if not specified
- **Double-booking prevention**: Database constraints prevent conflicts
- **Recurring schedules**: Weekly schedules with specific date overrides
- **Lunch breaks & blocks**: Staff can block time for breaks, holidays, etc.
- **Business hours**: Configurable hours per day of week

## Architecture

### Database Tables
1. **treatment_rooms** - Physical rooms (VIP Suite, Treatment Room 1, etc.)
2. **appointment_services** - Services offered (Deep Cleansing Facial, Massage, etc.)
3. **appointment_staff_availability** - Staff schedules, blocks, recurring availability
4. **appointments** - Actual bookings with confirmation workflow

### API Endpoints
- `POST /api/appointments/availability` - Get available slots for a service/date
- `POST /api/appointments` - Create new appointment booking
- `GET /api/appointments` - List appointments (filtered by business unit, staff, status)
- `POST /api/appointments/confirm` - Confirm or decline appointment (provider)

### Components
- `<BookingModal>` - Complete booking flow (service → date → time → details → confirm)
- `<SlotPicker>` - Hour-based grid showing available/blocked slots
- `<ProviderDashboard>` - Provider interface for managing appointments

### Utilities
- `src/lib/appointments/types.ts` - TypeScript definitions
- `src/lib/appointments/availability.ts` - Availability calculation logic

## Setup Instructions

### 1. Run Database Migrations

Open Supabase SQL Editor and run:

```sql
-- File: sql-migrations/COMBINED_APPOINTMENT_SETUP.sql
-- This creates all 4 tables, indexes, RLS policies, triggers, and feature flags
```

### 2. Seed Sample Data

Get your business_unit_id:
```sql
SELECT id, name FROM business_units LIMIT 5;
```

Get your ai_staff IDs:
```sql
SELECT id, name FROM ai_staff WHERE business_unit_id = 'YOUR_BUSINESS_UNIT_ID';
```

Edit `sql-migrations/SEED_APPOINTMENT_DATA.sql` and replace:
- `YOUR_BUSINESS_UNIT_ID` with your actual business unit ID
- `YOUR_STAFF_ID_1`, `YOUR_STAFF_ID_2` with actual staff IDs

Then run the seed file in Supabase SQL Editor.

This will create:
- **4 treatment rooms** (VIP, Standard, Massage, Consultation)
- **4 appointment services** (2 facials, 1 massage, 1 consultation)
- **Staff availability** (Mon-Fri, 9am-5pm with lunch breaks)
- **Enable appointment features** for your business unit

### 3. Test the Booking Flow

1. Start dev server: `npm run dev`
2. Open chat interface: `http://localhost:3000`
3. Enter pre-chat form (name/email)
4. Click the **Calendar button** (blue calendar icon)
5. Select service → date → time → enter details
6. Submit booking
7. Visit `/provider` to see the appointment in pending state
8. Confirm or decline the appointment

## Configuration

### Feature Flags

Control appointment features in `business_unit_settings`:

```sql
UPDATE business_unit_settings
SET
  enable_appointments = true,               -- Master switch
  appointments_require_confirmation = true, -- Require provider confirmation (vs auto-confirm)
  appointments_allow_room_selection = false,-- Allow users to choose room (vs auto-assign)
  appointments_send_reminders = true,       -- Send reminder notifications
  appointments_booking_window_days = 30     -- How many days ahead users can book
WHERE business_unit_id = 'YOUR_ID';
```

### Business Hours

Configure weekly business hours:

```sql
UPDATE business_unit_settings
SET appointments_business_hours = '{
  "monday": {"open": "09:00", "close": "18:00", "enabled": true},
  "tuesday": {"open": "09:00", "close": "18:00", "enabled": true},
  "wednesday": {"open": "09:00", "close": "18:00", "enabled": true},
  "thursday": {"open": "09:00", "close": "18:00", "enabled": true},
  "friday": {"open": "09:00", "close": "18:00", "enabled": true},
  "saturday": {"open": "10:00", "close": "16:00", "enabled": true},
  "sunday": {"open": "10:00", "close": "16:00", "enabled": false}
}'
WHERE business_unit_id = 'YOUR_ID';
```

## How It Works

### Booking Flow

1. **User clicks Calendar button** in chat
2. **Select Service** - User chooses from available services
3. **Select Date** - User picks a date (within booking window)
4. **API checks availability** - POST to `/api/appointments/availability`
   - Gets business hours
   - Gets service details (duration, room requirements)
   - Gets available staff (with schedules)
   - Gets available rooms (matching service requirements)
   - For each hour slot:
     - Find ANY staff+room combination that's free
     - Return slot as available:true if found
5. **Select Time** - User sees hour grid with available/blocked slots
6. **Enter Details** - User adds phone and special requests (optional)
7. **Submit Booking** - POST to `/api/appointments`
   - Auto-assigns staff+room if not specified
   - Final availability check
   - Creates appointment with status='pending'
8. **Confirmation** - Success message shown

### Provider Confirmation Flow

1. **Provider visits dashboard** at `/provider`
2. **Views pending appointments** in dedicated tab
3. **Reviews appointment details**:
   - Customer information (name, email, phone)
   - Service requested
   - Date and time
   - Special requests
4. **Takes action**:
   - **Confirm** - Status changes to 'confirmed', `confirmed_at` timestamp set
   - **Decline** - Status changes to 'cancelled', can add reason
5. **Customer notified** (future enhancement)

### Availability Algorithm

```typescript
// For each hour slot (e.g., 09:00, 10:00, 11:00)
for (hour from businessHours.open to businessHours.close) {
  // 1. Get all staff with schedules covering this hour
  availableStaff = getStaffWithSchedule(hour, dayOfWeek)

  // 2. Filter out staff with conflicts (existing appointments, blocks)
  availableStaff = filterOutConflicts(availableStaff, date, hour, duration)

  // 3. Get all rooms matching service requirements
  availableRooms = getRoomsForService(serviceId)

  // 4. Filter out rooms with conflicts
  availableRooms = filterOutConflicts(availableRooms, date, hour, duration)

  // 5. If BOTH staff AND room available, slot is available
  if (availableStaff.length > 0 && availableRooms.length > 0) {
    slots.push({
      time: hour,
      available: true,
      staffId: availableStaff[0].id,
      staffName: availableStaff[0].name,
      roomId: availableRooms[0].id,
      roomName: availableRooms[0].room_name
    })
  } else {
    slots.push({
      time: hour,
      available: false,
      reason: 'No staff or room available'
    })
  }
}
```

### Double-Booking Prevention

Database unique indexes prevent conflicts:

```sql
-- Prevents same staff being booked twice at same time
CREATE UNIQUE INDEX unique_staff_booking
  ON appointments(ai_staff_id, appointment_date, start_time)
  WHERE status NOT IN ('cancelled', 'rescheduled');

-- Prevents same room being booked twice at same time
CREATE UNIQUE INDEX unique_room_booking
  ON appointments(room_id, appointment_date, start_time)
  WHERE status NOT IN ('cancelled', 'rescheduled');
```

## Appointment Statuses

- **pending** - Awaiting provider confirmation
- **confirmed** - Provider accepted the appointment
- **completed** - Service was finished
- **cancelled** - Cancelled by user or provider
- **no_show** - Customer didn't show up
- **rescheduled** - Moved to different time

## Future Enhancements

### Phase 3 (Not Yet Implemented)
- Email/SMS notifications
- Calendar view for providers (react-big-calendar integration)
- Rescheduling workflow
- No-show tracking
- Payment integration
- Customer appointment history
- Review & rating system
- Recurring appointments
- Group bookings
- Waitlist functionality

## Modular Architecture

The appointment system is designed to be independent:
- **Separate folder structure** under `src/lib/appointments/` and `src/components/appointments/`
- **No dependencies on chat system** (except integration point in `ai-coach.tsx`)
- **Feature flags** allow enabling/disabling per business unit
- **Can be used standalone** or integrated with chat
- **Can be deployed separately** if needed (future microservice)

## Files Created

### Database
- `sql-migrations/016_create_appointment_system.sql`
- `sql-migrations/017_add_appointment_feature_flags.sql`
- `sql-migrations/COMBINED_APPOINTMENT_SETUP.sql` (combined version)
- `sql-migrations/SEED_APPOINTMENT_DATA.sql` (sample data)

### Backend
- `src/lib/appointments/types.ts` (TypeScript definitions)
- `src/lib/appointments/availability.ts` (availability logic)
- `src/app/api/appointments/route.ts` (create & list appointments)
- `src/app/api/appointments/availability/route.ts` (check availability)
- `src/app/api/appointments/confirm/route.ts` (provider confirmation)

### Frontend
- `src/components/appointments/booking-modal.tsx` (booking flow)
- `src/components/appointments/slot-picker.tsx` (hour grid)
- `src/app/provider/page.tsx` (provider dashboard)
- `src/components/ui/ai-coach.tsx` (booking button integration)

### Scripts
- `scripts/run-appointment-migrations.js` (migration runner)

## Support

For issues or questions about the appointment system, check:
1. Database migrations ran successfully
2. Feature flags are enabled for your business unit
3. Sample data was seeded correctly
4. Staff availability schedules are set up
5. Browser console for API errors
