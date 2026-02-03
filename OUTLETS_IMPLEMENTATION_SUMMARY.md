# Outlets & Room Restructure Implementation Summary

## What Was Done:

### 1. Database Changes (SQL Migration: 021_outlets_and_room_restructure.sql)

**Created outlets table:**
- Stores physical locations/addresses for each business unit
- Fields: name, address_line1, address_line2, city, state_province, postal_code, country, phone, email
- Each outlet belongs to a business unit
- Has display_order for customer-facing ordering

**Updated treatment_rooms table:**
- Added `outlet_id` column - rooms now belong to outlets, not just business units
- Unique constraint: one room number per outlet (not per business unit)

**Updated appointments table:**
- Added `outlet_id` column - tracks which outlet/location the appointment is at
- Customer selects outlet when booking

**Created auto_assign_room function:**
```sql
auto_assign_room(outlet_id, date, start_time, end_time, exclude_appointment_id)
```
- Finds available room at specified outlet for given time slot
- Checks for conflicts with existing appointments
- Returns first available room, ordered by room_number

**Data migration:**
- Created default outlets for existing business units
- Migrated existing rooms to default outlets

### 2. API Routes Created

**src/app/api/booking/outlets/route.ts** - Full CRUD for outlets:
- GET: Load all outlets (filtered by business unit)
- POST: Create/update outlet with full address
- DELETE: Remove outlet (prevents deletion if rooms exist)

**Updated src/app/api/booking/rooms/route.ts:**
- GET: Now includes outlet information in JOIN
- GET: Can filter by outlet_id or business_unit_id
- POST: Now requires outlet_id when creating/updating rooms
- Returns outlet details with each room

### 3. API Client Updates (src/lib/api-client.ts)

Added outlet functions:
```typescript
loadOutlets(businessUnitId?)
saveOutlet(outlet, businessUnitId?)
deleteOutlet(id)
```

Updated room functions:
```typescript
loadRooms(businessUnitId?, outletId?) // Now accepts outlet filter
```

## What Still Needs To Be Done:

### 1. Update AI Training Center UI

The Booking tab in `src/components/admin/ai-training-center.tsx` needs outlets management added.

**Add Outlets Section (before Rooms):**
```typescript
// State
const [outlets, setOutlets] = useState([])
const [showAddOutlet, setShowAddOutlet] = useState(false)
const [newOutlet, setNewOutlet] = useState({
  name: '',
  address_line1: '',
  address_line2: '',
  city: '',
  state_province: '',
  postal_code: '',
  country: 'USA',
  phone: '',
  email: ''
})

// Load outlets
useEffect(() => {
  if (selectedBusinessUnit) {
    loadOutlets(selectedBusinessUnit.slug).then(setOutlets)
  }
}, [selectedBusinessUnit])
```

**UI Layout:**
1. **Outlets/Locations Section**
   - List all outlets with full address display
   - Add/Edit/Delete buttons
   - Modal for creating/editing outlets

2. **Rooms Section Updates**
   - Group rooms by outlet
   - Show outlet name/address for each room group
   - Room form must include outlet selector dropdown
   - Update newRoom state to include outlet_id

### 2. Update Appointment Modals

**Edit Appointment Modal** (`src/components/booking/edit-appointment-modal.tsx`):
- Add room selector dropdown (staff can change assigned room)
- Load rooms for the appointment's outlet
- Allow staff to reassign to different room at same outlet

**Block Time Modal** (`src/components/booking/block-time-modal.tsx`):
- May need outlet selector if staff works at multiple outlets

### 3. Customer Booking Flow (Future)

When implementing customer-facing booking:
1. Customer selects outlet/location from list
2. System shows available services at that outlet
3. Customer picks date/time and service
4. System auto-assigns room using `auto_assign_room()` function
5. Staff can later change room assignment if needed

## Database Functions Available:

### auto_assign_room
```sql
SELECT auto_assign_room(
  'outlet-uuid',
  '2025-01-15',
  '10:00:00',
  '11:00:00',
  NULL  -- or appointment_id when editing
)
```
Returns: room_id (UUID) or NULL if no rooms available

### get_outlet_address
```sql
SELECT get_outlet_address('outlet-uuid')
```
Returns: formatted address string

## Migration Instructions:

### Step 1: Run SQL Migration
```sql
-- In Supabase SQL Editor, run:
-- sql-migrations/021_outlets_and_room_restructure.sql
```

### Step 2: Update Outlet Addresses
After migration, default outlets are created with placeholder addresses.
Update them via admin interface with real addresses.

### Step 3: Add More Outlets (if needed)
Create additional outlets for each physical location.

### Step 4: Assign Rooms to Outlets
Reassign existing rooms to correct outlets if you have multiple locations.

## Key Concepts:

### Room Assignment Flow:
1. **Customer books** → Selects outlet → System auto-assigns available room
2. **Staff views** → Can see which room was assigned
3. **Staff edits** → Can reassign to different room at same outlet
4. **Manager views** → Sees all appointments with room assignments

### Why This Design:
- Customers don't need to know room numbers (they pick location only)
- Staff has flexibility to change rooms based on availability/preferences
- System automatically handles room conflicts
- Each outlet can have its own set of rooms (Room 101 at Location A is different from Room 101 at Location B)

## Testing Checklist:

- [ ] Run 021 migration successfully
- [ ] Create test outlets via API
- [ ] Create rooms assigned to outlets
- [ ] Test auto_assign_room function
- [ ] Update AI Training Center UI for outlets
- [ ] Update room management UI to show outlets
- [ ] Test room assignment in appointments
- [ ] Test staff ability to edit room assignments
- [ ] Verify unique constraints (room numbers per outlet)
