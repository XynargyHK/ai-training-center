# SQL Migration Checklist - Booking System
**Complete Setup Guide**

---

## 📋 Required Migrations (In Order)

### ✅ Already Completed
You mentioned you've already run:
- [x] **015_create_chat_history_tables.sql** - Chat sessions & messages
- [x] **019_service_staff_assignments.sql** - Service-staff many-to-many
- [x] **020_appointment_workflow.sql** - Edit/cancel workflow

---

## 🔴 MISSING - Core Booking System Tables

### **PRIORITY 1: Foundation Tables** (Required for booking to work)

#### 1. **016_create_appointment_system.sql** 🔴 MUST RUN
**What it creates**:
- `treatment_rooms` - Physical rooms for appointments
- `appointment_services` - Services offered (facials, massage, etc.)
- `appointment_staff_availability` - Staff schedules & blocked time
- `appointments` - The actual bookings

**Why you need it**: Without this, you have NO appointments table!

**Run in Supabase SQL Editor**:
```sql
-- Copy entire contents of sql-migrations/016_create_appointment_system.sql
-- Paste and execute
```

---

#### 2. **017_add_appointment_feature_flags.sql** 🟡 RECOMMENDED
**What it creates**:
- Feature flags in `business_unit_settings`
- `enable_appointments` - Master on/off switch
- `appointments_require_confirmation` - Auto-confirm or manual
- `appointments_business_hours` - Opening hours
- `appointments_ui_config` - UI preferences

**Why you need it**: Controls booking behavior and business hours

**Run in Supabase SQL Editor**:
```sql
-- Copy entire contents of sql-migrations/017_add_appointment_feature_flags.sql
-- Paste and execute
```

---

#### 3. **018_add_real_staff_table.sql** 🔴 MUST RUN
**What it creates**:
- `real_staff` table - Actual human staff (beauticians, doctors, nurses)
- Indexes for performance
- RLS policies for security

**Why you need it**: Your appointments need to be assigned to real staff!

**Run in Supabase SQL Editor**:
```sql
-- Copy entire contents of sql-migrations/018_add_real_staff_table.sql
-- Paste and execute
```

---

### **PRIORITY 2: Sample Data** (Optional but very helpful)

#### 4. **SEED_WITH_DUMMY_STAFF_AND_ROOMS.sql** 🟢 OPTIONAL
**What it creates**:
- Sample staff members
- Sample treatment rooms
- Sample services
- Sample appointments

**Why you need it**: Makes testing much easier!

**Run in Supabase SQL Editor**:
```sql
-- Copy entire contents of sql-migrations/SEED_WITH_DUMMY_STAFF_AND_ROOMS.sql
-- Paste and execute
```

---

## 📊 Complete Migration Order

Here's the full sequence for a working booking system:

```
FOUNDATION (Already done ✅):
├── 001-014: Core system tables
├── 015: Chat history ✅
└── ...

BOOKING SYSTEM (Need to run 🔴):
├── 016: Appointment system tables 🔴 REQUIRED
├── 017: Feature flags 🟡 RECOMMENDED
├── 018: Real staff table 🔴 REQUIRED
├── 019: Service-staff assignments ✅ DONE
└── 020: Edit/cancel workflow ✅ DONE

SAMPLE DATA (Optional 🟢):
└── SEED_WITH_DUMMY_STAFF_AND_ROOMS.sql 🟢 OPTIONAL
```

---

## 🎯 What You Need to Run NOW

### **Minimum Required** (To make booking work):

1. **016_create_appointment_system.sql** 🔴
   - Creates appointments table
   - Creates services table
   - Creates rooms table
   - Creates availability table

2. **018_add_real_staff_table.sql** 🔴
   - Creates real_staff table
   - Your system references this everywhere!

### **Highly Recommended**:

3. **017_add_appointment_feature_flags.sql** 🟡
   - Enables booking features
   - Sets business hours
   - Configures UI behavior

### **Nice to Have**:

4. **SEED_WITH_DUMMY_STAFF_AND_ROOMS.sql** 🟢
   - Test data for immediate testing
   - Skip if you want to add real data

---

## 🔍 Verification Queries

After running the migrations, verify everything exists:

### Check All Tables:
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'treatment_rooms',
    'appointment_services',
    'appointment_staff_availability',
    'appointments',
    'real_staff',
    'service_staff_assignments',
    'appointment_change_requests',
    'appointment_change_history',
    'chat_sessions',
    'chat_messages'
  )
ORDER BY table_name;
```

**Expected**: 10 tables

### Check Table Structure:
```sql
-- Check appointments table
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'appointments'
ORDER BY ordinal_position;

-- Check real_staff table
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'real_staff'
ORDER BY ordinal_position;
```

### Check Foreign Keys:
```sql
-- Verify appointments references real_staff
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'appointments';
```

---

## 📝 Step-by-Step Execution

### Step 1: Run 016 (Appointment System)
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Click "+ New query"
4. Copy contents of `sql-migrations/016_create_appointment_system.sql`
5. Paste and click "Run" (or press F5)
6. Wait for "Success" message

### Step 2: Run 017 (Feature Flags)
1. Click "+ New query"
2. Copy contents of `sql-migrations/017_add_appointment_feature_flags.sql`
3. Paste and click "Run"
4. Wait for "Success"

### Step 3: Run 018 (Real Staff)
1. Click "+ New query"
2. Copy contents of `sql-migrations/018_add_real_staff_table.sql`
3. Paste and click "Run"
4. Wait for "Success"

### Step 4: (Optional) Run SEED
1. Click "+ New query"
2. Copy contents of `sql-migrations/SEED_WITH_DUMMY_STAFF_AND_ROOMS.sql`
3. Paste and click "Run"
4. Wait for "Success"

---

## ✅ Post-Migration Verification

After running migrations 016, 017, 018:

### 1. Check Table Count:
```sql
SELECT COUNT(*) as booking_tables
FROM information_schema.tables
WHERE table_name IN (
  'appointments',
  'appointment_services',
  'treatment_rooms',
  'appointment_staff_availability',
  'real_staff'
);
-- Should return: 5
```

### 2. Check Data (if you ran SEED):
```sql
-- Count staff
SELECT COUNT(*) FROM real_staff;
-- Should have at least 1

-- Count rooms
SELECT COUNT(*) FROM treatment_rooms;
-- Should have at least 1

-- Count services
SELECT COUNT(*) FROM appointment_services;
-- Should have at least 1

-- Count appointments (might be 0 if no SEED)
SELECT COUNT(*) FROM appointments;
```

### 3. Check Feature Flags:
```sql
SELECT
  enable_appointments,
  appointments_require_confirmation,
  appointments_business_hours->>'monday' as monday_hours
FROM business_unit_settings
WHERE business_unit_id = (SELECT id FROM business_units WHERE slug = 'skincoach');
```

---

## 🚨 Common Issues

### Issue: "relation already exists"
**Solution**: Table already created - safe to ignore or use `CREATE TABLE IF NOT EXISTS`

### Issue: "column does not exist"
**Solution**: Run migrations in order - 016 before 017, etc.

### Issue: Foreign key constraint fails
**Solution**: Ensure business_units table exists and has data

### Issue: RLS policy error
**Solution**: Drop existing policies first (migrations should handle this)

---

## 🎯 After Migration Checklist

Once you've run 016, 017, 018:

- [ ] All 5 tables exist (appointments, services, rooms, availability, real_staff)
- [ ] Feature flags added to business_unit_settings
- [ ] Sample data loaded (if ran SEED)
- [ ] Foreign keys working
- [ ] RLS policies active
- [ ] Ready to test `/booking` page

---

## 🚀 Next Steps After SQL

1. **Run migrations 016, 017, 018** (in that order)
2. **Verify tables exist** (run verification queries above)
3. **Optionally run SEED** for test data
4. **Test the booking dashboard**:
   ```bash
   npm run dev
   # Navigate to: http://localhost:3000/booking
   ```
5. **Create your first real appointment** through the UI or chat

---

## 💡 Pro Tips

### Backup First
Before running migrations:
```sql
-- Create backup (if you have important data)
-- Use Supabase Dashboard > Database > Backups
```

### Test in Stages
Run one migration at a time and verify:
1. Run 016 → Check tables
2. Run 017 → Check settings
3. Run 018 → Check staff table
4. Test booking page after each

### Use Transaction (Advanced)
Wrap in transaction to rollback if errors:
```sql
BEGIN;
  -- Copy migration SQL here
COMMIT; -- Only if no errors
-- Or: ROLLBACK; -- If there were errors
```

---

## 📞 Quick Reference

### Files to Run (In Order):
```
1. sql-migrations/016_create_appointment_system.sql 🔴
2. sql-migrations/017_add_appointment_feature_flags.sql 🟡
3. sql-migrations/018_add_real_staff_table.sql 🔴
4. sql-migrations/SEED_WITH_DUMMY_STAFF_AND_ROOMS.sql 🟢
```

### Verification Query:
```sql
-- One query to check everything
SELECT 'appointments' as table_name, COUNT(*) as count FROM appointments
UNION ALL
SELECT 'services', COUNT(*) FROM appointment_services
UNION ALL
SELECT 'rooms', COUNT(*) FROM treatment_rooms
UNION ALL
SELECT 'staff', COUNT(*) FROM real_staff
UNION ALL
SELECT 'assignments', COUNT(*) FROM service_staff_assignments
UNION ALL
SELECT 'change_requests', COUNT(*) FROM appointment_change_requests;
```

---

## ✨ Summary

**You MUST run these 3 migrations**:
1. ✅ 016 - Core appointment tables
2. ✅ 017 - Feature flags & settings
3. ✅ 018 - Real staff table

**Then optionally**:
4. 🟢 SEED - Test data

**Total time**: ~5 minutes to run all migrations

**After that**: Your booking system will be 100% ready to use! 🎉
