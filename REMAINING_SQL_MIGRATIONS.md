# Remaining SQL Migrations - MUST RUN

## ✅ Already Completed (You told me):
1. ✅ COMBINED_APPOINTMENT_SETUP.sql
2. ✅ 018_add_real_staff_table.sql
3. ✅ SEED_APPOINTMENT_DATA.sql
4. ✅ 019_service_staff_assignments.sql

---

## 🔴 STILL NEED TO RUN (2-3 migrations):

### **1. 015_create_chat_history_tables.sql** 🔴 REQUIRED
**File**: `sql-migrations/015_create_chat_history_tables.sql`

**Creates**:
- `chat_sessions` - Track user chat sessions
- `chat_messages` - Store messages with image support
- Indexes for performance
- RLS policies
- Triggers for auto-update

**Why needed**:
- The appointment system links to chat sessions (`appointments.chat_session_id`)
- Without this, you'll get foreign key errors

**Run now**: Copy entire file to Supabase SQL Editor and execute

---

### **2. 020_appointment_workflow.sql** 🔴 REQUIRED
**File**: `sql-migrations/020_appointment_workflow.sql`

**Creates**:
- `appointment_change_requests` - Edit/cancel workflow
- `appointment_change_history` - Complete audit trail
- Updates appointment status constraint (adds 'pending_edit', 'pending_cancellation')
- Workflow functions:
  - `create_appointment_change_request()`
  - `manager_review_change_request()`
  - `client_confirm_change_request()`
- RLS policies
- Triggers

**Why needed**:
- Your API endpoints call these functions!
- Without this, edit/cancel workflow won't work
- The /booking page needs these statuses

**Run now**: Copy entire file to Supabase SQL Editor and execute

---

### **3. 017_add_appointment_feature_flags.sql** 🟡 OPTIONAL
**File**: `sql-migrations/017_add_appointment_feature_flags.sql`

**Creates**:
- Feature flags in `business_unit_settings`:
  - `enable_appointments` - Master on/off switch
  - `appointments_require_confirmation`
  - `appointments_business_hours` - Business hours config
  - `appointments_ui_config` - UI preferences

**Why optional**:
- System works without it
- But gives you control over booking features

**If you want to run it**: Copy to Supabase SQL Editor and execute

---

## 📋 Execution Order:

```
1. 015_create_chat_history_tables.sql       🔴 RUN FIRST
2. 020_appointment_workflow.sql             🔴 RUN SECOND
3. 017_add_appointment_feature_flags.sql    🟡 OPTIONAL (run third if you want)
```

---

## ⚡ Quick Execute Instructions:

### Step 1: Run 015
1. Open Supabase Dashboard → SQL Editor
2. New Query
3. Copy all of `sql-migrations/015_create_chat_history_tables.sql`
4. Paste and Run (F5)
5. Wait for success message

### Step 2: Run 020
1. New Query
2. Copy all of `sql-migrations/020_appointment_workflow.sql`
3. Paste and Run (F5)
4. Wait for success message

### Step 3 (Optional): Run 017
1. New Query
2. Copy all of `sql-migrations/017_add_appointment_feature_flags.sql`
3. Paste and Run (F5)
4. Wait for success message

---

## ✅ After Running These:

### You'll Have:
- ✅ 10 total tables
- ✅ 5 workflow functions
- ✅ Complete edit/cancel workflow
- ✅ Chat history tracking
- ✅ Full audit trail
- ✅ All API endpoints will work

### Verify with:
```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'chat_sessions',
  'chat_messages',
  'appointment_change_requests',
  'appointment_change_history'
)
ORDER BY table_name;
```

Expected: 4 tables

---

## 🎯 Why You Need These:

### Without 015:
- ❌ `appointments.chat_session_id` foreign key fails
- ❌ Can't track chat conversations
- ❌ No link between chat and booking

### Without 020:
- ❌ Edit/Cancel buttons won't work
- ❌ API endpoints will fail
- ❌ No approval workflow
- ❌ No change history

---

## Summary:

**You said**: "I still have 3-4 SQL to migrate"

**You're RIGHT**: You need to run:
1. 🔴 **015** - Chat history (REQUIRED)
2. 🔴 **020** - Edit/cancel workflow (REQUIRED)
3. 🟡 **017** - Feature flags (OPTIONAL)

**Time needed**: ~3 minutes total

**Then**: Your booking system will be 100% complete! 🎉
