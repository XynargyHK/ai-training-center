# Business Calendar Module - Implementation Plan

## Executive Summary

This document outlines the plan to add an appointment booking system for facial treatments to the AI Training Center. The system will allow:
- **Admin/Beauticians**: Block time slots when unavailable
- **Users**: Book available time slots via the chat dialog
- **Visual Interface**: Weekly calendar with hour-based grid (one box = one hour)

---

## 1. Technology Stack Recommendation

### Recommended: `react-big-calendar` with Custom Booking Logic

**Why react-big-calendar?**
- ✅ MIT License (free, open-source)
- ✅ 6,800+ GitHub stars, battle-tested
- ✅ Multiple views (month, week, day, agenda)
- ✅ Drag-and-drop support for admin blocking
- ✅ Event overlap handling
- ✅ Google Calendar-like interface (familiar UX)
- ✅ Works seamlessly with Next.js and React 19
- ✅ Easy to customize for booking use cases

**Alternative Options Considered:**
1. **FullCalendar** - More features but requires paid license for commercial use
2. **@demark-pro/react-booking-calendar** - Specialized for bookings but less flexible
3. **react-day-picker** - Too basic, requires building calendar view from scratch
4. **Mobiscroll** - Commercial license required

**Installation:**
```bash
npm install react-big-calendar moment
```

---

## 2. Database Schema

### New Tables Required

#### Table 1: `appointment_services`
Defines the types of services available for booking (e.g., "Facial", "Massage", etc.)

```sql
CREATE TABLE appointment_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_unit_id UUID NOT NULL REFERENCES business_units(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- e.g., "Deep Cleansing Facial", "Anti-Aging Treatment"
  description TEXT,
  duration_minutes INT NOT NULL DEFAULT 60, -- How long the service takes
  price DECIMAL(10,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_appointment_services_business_unit ON appointment_services(business_unit_id);
CREATE INDEX idx_appointment_services_active ON appointment_services(is_active);
```

#### Table 2: `appointment_staff_availability`
Defines when beauticians/staff are available or blocked

```sql
CREATE TABLE appointment_staff_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_unit_id UUID NOT NULL REFERENCES business_units(id) ON DELETE CASCADE,
  ai_staff_id UUID REFERENCES ai_staff(id) ON DELETE CASCADE, -- Which staff member

  -- Time slot definition
  day_of_week INT NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 6=Saturday
  start_time TIME NOT NULL, -- e.g., '09:00:00'
  end_time TIME NOT NULL,   -- e.g., '17:00:00'

  -- OR specific date blocking (overrides day_of_week)
  specific_date DATE, -- For one-time blocks (holidays, etc.)

  -- Status
  is_available BOOLEAN DEFAULT true, -- false = blocked
  reason TEXT, -- Why blocked: "Lunch", "Holiday", "Personal", etc.

  -- Recurrence
  is_recurring BOOLEAN DEFAULT true, -- Does this repeat weekly?
  effective_from DATE, -- When does this schedule start
  effective_until DATE, -- When does it end (NULL = indefinite)

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_staff_availability_business_unit ON appointment_staff_availability(business_unit_id);
CREATE INDEX idx_staff_availability_staff ON appointment_staff_availability(ai_staff_id);
CREATE INDEX idx_staff_availability_dow ON appointment_staff_availability(day_of_week);
CREATE INDEX idx_staff_availability_date ON appointment_staff_availability(specific_date);
```

#### Table 3: `appointments`
Stores actual booked appointments

```sql
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_unit_id UUID NOT NULL REFERENCES business_units(id) ON DELETE CASCADE,
  ai_staff_id UUID REFERENCES ai_staff(id) ON DELETE SET NULL, -- Which staff performs service
  service_id UUID REFERENCES appointment_services(id) ON DELETE SET NULL,

  -- Customer info (linked to chat session)
  chat_session_id UUID REFERENCES chat_sessions(id) ON DELETE SET NULL,
  user_identifier TEXT NOT NULL, -- Email or name from chat
  user_name TEXT,
  user_email TEXT,
  user_phone TEXT,

  -- Appointment timing
  appointment_date DATE NOT NULL,
  start_time TIME NOT NULL, -- e.g., '14:00:00'
  end_time TIME NOT NULL,   -- e.g., '15:00:00'
  duration_minutes INT NOT NULL,

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending', -- pending, confirmed, completed, cancelled, no_show
  booking_source TEXT DEFAULT 'chat', -- chat, admin, api

  -- Communication
  confirmation_sent BOOLEAN DEFAULT false,
  reminder_sent BOOLEAN DEFAULT false,

  -- Notes
  customer_notes TEXT, -- Special requests from customer
  staff_notes TEXT,    -- Internal notes

  -- Timestamps
  booked_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_appointments_business_unit ON appointments(business_unit_id);
CREATE INDEX idx_appointments_staff ON appointments(ai_staff_id);
CREATE INDEX idx_appointments_session ON appointments(chat_session_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_user ON appointments(user_identifier);
```

---

## 3. Architecture Overview

### Component Structure

```
src/components/
├── appointments/
│   ├── appointment-calendar.tsx      # Main calendar component (react-big-calendar)
│   ├── appointment-booking-modal.tsx # User booking interface
│   ├── appointment-admin-panel.tsx   # Admin interface for blocking slots
│   ├── appointment-slot-picker.tsx   # Hour-based grid for selecting time
│   └── appointment-list.tsx          # List view of appointments
├── ui/
│   └── ai-coach.tsx                  # Updated to include booking button
```

### API Routes

```
src/app/api/
├── appointments/
│   ├── route.ts                      # GET (list), POST (create booking)
│   ├── availability/route.ts         # GET available slots
│   ├── services/route.ts             # GET services list
│   └── admin/
│       ├── block-slots/route.ts      # POST/DELETE block time slots
│       └── manage/route.ts           # PUT (update), DELETE (cancel)
```

---

## 4. User Interface Design

### 4.1 User View (Chat Dialog)

When user mentions "book appointment" or "schedule facial" in chat:

1. **AI Response**: "I'd be happy to help you book a facial appointment! Let me show you our available times."

2. **Calendar Widget Appears** (inline in chat):
   ```
   ┌─────────────────────────────────────────────┐
   │  📅 Book Your Facial Appointment            │
   ├─────────────────────────────────────────────┤
   │  Week of Nov 18-24, 2025        [<] [>]     │
   ├─────────────────────────────────────────────┤
   │      Mon   Tue   Wed   Thu   Fri   Sat      │
   │ 9am  [ ]   [X]   [ ]   [ ]   [ ]   [X]      │
   │ 10am [ ]   [X]   [✓]   [ ]   [ ]   [X]      │
   │ 11am [X]   [X]   [ ]   [ ]   [ ]   [X]      │
   │ 12pm [X]   [X]   [X]   [X]   [X]   [X]      │ (Lunch - blocked)
   │ 1pm  [ ]   [X]   [ ]   [ ]   [ ]   [X]      │
   │ 2pm  [ ]   [X]   [✓]   [ ]   [ ]   [X]      │
   │ 3pm  [ ]   [X]   [ ]   [✓]   [ ]   [X]      │
   │ 4pm  [ ]   [X]   [ ]   [ ]   [ ]   [X]      │
   │ 5pm  [X]   [X]   [X]   [X]   [X]   [X]      │ (Closed)
   └─────────────────────────────────────────────┘

   Legend:
   [ ] = Available    [✓] = Already booked    [X] = Blocked
   ```

3. **User Interaction**:
   - Click any available slot (green)
   - Disabled slots are greyed out
   - Confirmation dialog appears

4. **Booking Confirmation**:
   ```
   You selected: Wednesday, Nov 20, 2025 at 10:00 AM
   Service: Deep Cleansing Facial (60 min)

   Your contact info:
   Name: [Pre-filled from chat]
   Phone: [Input field]
   Special requests: [Optional textarea]

   [Confirm Booking] [Cancel]
   ```

### 4.2 Admin View (Dashboard)

For beauticians/admins to manage their schedule:

1. **Full Calendar View** (react-big-calendar week view):
   - Drag to block time slots
   - Click on appointment to see details
   - Color coding: Green (booked), Red (blocked), White (available)

2. **Quick Actions**:
   - "Block Today" button
   - "Block This Week" button
   - "Add Holiday" button
   - "View All Appointments" list

3. **Appointment Management**:
   - List of upcoming appointments
   - Confirm/Cancel/Reschedule options
   - Customer contact info
   - Notes field

---

## 5. Implementation Phases

### Phase 1: Database Setup (Day 1)
- [ ] Create database migration file
- [ ] Add 3 new tables: services, staff_availability, appointments
- [ ] Add indexes for performance
- [ ] Enable RLS policies
- [ ] Test with sample data

### Phase 2: Backend API (Days 2-3)
- [ ] `/api/appointments/services` - List available services
- [ ] `/api/appointments/availability` - Calculate available slots
- [ ] `/api/appointments` - Create/list appointments
- [ ] `/api/appointments/admin/block-slots` - Block time slots
- [ ] Add timezone handling (UTC storage, local display)

### Phase 3: UI Components (Days 4-6)
- [ ] Install react-big-calendar
- [ ] Create `appointment-calendar.tsx` component
- [ ] Create `appointment-slot-picker.tsx` (hour grid)
- [ ] Create `appointment-booking-modal.tsx`
- [ ] Style with Tailwind CSS to match existing UI

### Phase 4: Chat Integration (Day 7)
- [ ] Update `ai-coach.tsx` to detect booking intent
- [ ] Add "Book Appointment" button to chat interface
- [ ] Show calendar widget in chat dialog
- [ ] Handle booking confirmation flow

### Phase 5: Admin Interface (Days 8-9)
- [ ] Create admin dashboard page
- [ ] Add calendar view for staff
- [ ] Implement drag-to-block functionality
- [ ] Add appointment list view
- [ ] Add bulk blocking (holidays, etc.)

### Phase 6: Notifications & Polish (Day 10)
- [ ] Email confirmation (optional)
- [ ] SMS reminder (optional)
- [ ] Add loading states
- [ ] Error handling
- [ ] Mobile responsive design
- [ ] Testing on Railway deployment

---

## 6. Key Features

### User Side:
✅ Visual weekly calendar with hour slots
✅ Real-time availability checking
✅ One-click booking
✅ Pre-filled contact info from chat
✅ Booking confirmation in chat
✅ Mobile-friendly interface

### Admin Side:
✅ Drag-and-drop schedule blocking
✅ Recurring availability rules (e.g., "Closed every Sunday")
✅ One-time blocks (holidays, personal days)
✅ Appointment management (confirm, cancel, reschedule)
✅ Customer notes and history
✅ Quick block shortcuts

### System Features:
✅ Overbooking prevention (one slot = one booking)
✅ Multi-staff support (different beauticians)
✅ Multi-service support (different treatments)
✅ Timezone handling
✅ Integration with existing chat history
✅ Business unit isolation (multi-tenant safe)

---

## 7. Technical Considerations

### Timezone Handling
- Store all times in UTC in database
- Convert to user's local timezone for display
- Allow admin to set business timezone in settings

### Availability Calculation Logic
1. Get staff's recurring weekly schedule
2. Apply specific date blocks (holidays)
3. Subtract existing appointments
4. Return available slots

### Overbooking Prevention
- Check availability before confirming booking
- Use database transaction to prevent race conditions
- Add unique constraint on (ai_staff_id, appointment_date, start_time)

### Performance Optimization
- Cache availability calculations (15-min TTL)
- Use database indexes on date/time queries
- Lazy load calendar data (fetch only visible week)

---

## 8. Sample Code Snippets

### Calculate Available Slots (Backend Logic)

```typescript
// src/app/api/appointments/availability/route.ts
export async function POST(req: Request) {
  const { staffId, date, serviceId } = await req.json()

  // 1. Get service duration
  const service = await supabase
    .from('appointment_services')
    .select('duration_minutes')
    .eq('id', serviceId)
    .single()

  // 2. Get staff availability for that day
  const dayOfWeek = new Date(date).getDay()
  const availability = await supabase
    .from('appointment_staff_availability')
    .select('*')
    .eq('ai_staff_id', staffId)
    .or(`day_of_week.eq.${dayOfWeek},specific_date.eq.${date}`)
    .eq('is_available', true)

  // 3. Get existing bookings
  const bookings = await supabase
    .from('appointments')
    .select('start_time, end_time')
    .eq('ai_staff_id', staffId)
    .eq('appointment_date', date)
    .not('status', 'in', ['cancelled'])

  // 4. Calculate free slots (every hour from 9am-5pm)
  const slots = []
  for (let hour = 9; hour < 17; hour++) {
    const slotStart = `${hour.toString().padStart(2, '0')}:00:00`
    const slotEnd = `${(hour + 1).toString().padStart(2, '0')}:00:00`

    // Check if slot is within staff availability
    const isAvailable = availability.some(a =>
      slotStart >= a.start_time && slotEnd <= a.end_time
    )

    // Check if slot is not already booked
    const isBooked = bookings.some(b =>
      slotStart < b.end_time && slotEnd > b.start_time
    )

    if (isAvailable && !isBooked) {
      slots.push({ time: slotStart, available: true })
    } else {
      slots.push({ time: slotStart, available: false })
    }
  }

  return Response.json({ slots })
}
```

### Calendar Component (Frontend)

```typescript
// src/components/appointments/appointment-calendar.tsx
import { Calendar, momentLocalizer } from 'react-big-calendar'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'

const localizer = momentLocalizer(moment)

export function AppointmentCalendar({
  businessUnitId,
  staffId,
  onSelectSlot
}: Props) {
  const [events, setEvents] = useState([])

  // Fetch appointments and blocked slots
  useEffect(() => {
    fetchAvailability()
  }, [businessUnitId, staffId])

  const handleSelectSlot = (slotInfo: any) => {
    // User clicked on a time slot
    onSelectSlot({
      date: slotInfo.start,
      staffId
    })
  }

  return (
    <Calendar
      localizer={localizer}
      events={events}
      startAccessor="start"
      endAccessor="end"
      style={{ height: 500 }}
      views={['week', 'day']}
      defaultView="week"
      step={60} // 1-hour slots
      timeslots={1}
      selectable
      onSelectSlot={handleSelectSlot}
      eventPropGetter={(event) => ({
        style: {
          backgroundColor: event.isBlocked ? '#ef4444' : '#10b981',
          borderColor: event.isBlocked ? '#dc2626' : '#059669'
        }
      })}
    />
  )
}
```

---

## 9. Mobile Responsiveness

- Calendar switches to day view on mobile (<768px)
- Slot picker uses vertical list instead of grid
- Touch-friendly button sizes (min 44x44px)
- Bottom sheet for booking confirmation

---

## 10. Future Enhancements (Post-MVP)

1. **Email/SMS Notifications**
   - Booking confirmation
   - 24-hour reminder
   - Cancellation notice

2. **Payment Integration**
   - Require deposit for booking
   - Full payment option
   - Stripe/PayPal integration

3. **Waitlist System**
   - Allow users to join waitlist for blocked slots
   - Notify when slots open up

4. **Multi-location Support**
   - Different addresses/branches
   - Staff assigned to specific locations

5. **Recurring Appointments**
   - Weekly/monthly facial subscriptions
   - Auto-rebooking

6. **Analytics Dashboard**
   - Booking conversion rate
   - Popular time slots
   - Revenue by service

---

## 11. Security Considerations

- ✅ Validate user can only book future dates (not past)
- ✅ Rate limit booking API to prevent spam
- ✅ Verify staff_id belongs to same business_unit
- ✅ RLS policies to prevent cross-tenant data access
- ✅ Sanitize user input (name, notes, phone)
- ✅ Require confirmation before finalizing booking

---

## 12. Testing Strategy

1. **Unit Tests**: Availability calculation logic
2. **Integration Tests**: API endpoints
3. **E2E Tests**: Full booking flow via chat
4. **Load Tests**: Concurrent bookings (prevent double-booking)
5. **Mobile Testing**: iOS Safari, Android Chrome
6. **Timezone Testing**: Different user timezones

---

## Next Steps

1. **Get User Approval** on this plan
2. **Clarify Requirements**:
   - Operating hours (e.g., 9am-6pm?)
   - Services offered (just "Facial" or multiple types?)
   - Single staff or multiple beauticians?
   - Timezone of business
3. **Start Phase 1** - Database setup

---

## Estimated Timeline

- **Total Development Time**: 10 working days
- **MVP Features Only**: 7 days
- **With Admin Panel**: 10 days
- **With Notifications**: 12 days

## Resources Required

- react-big-calendar (free, MIT)
- moment.js (for date handling)
- No additional paid services required for MVP

---

**Document Version**: 1.0
**Last Updated**: 2025-11-21
**Status**: Awaiting User Approval
