# IMPORTANT: Run Migration 021 First!

## You're seeing this error:

```
Could not find a relationship between 'treatment_rooms' and 'outlets' in the schema cache
```

## This means:

The outlets table doesn't exist yet. You need to run the SQL migration first.

## How to Fix:

### Step 1: Go to Supabase SQL Editor

1. Open your Supabase project dashboard
2. Click "SQL Editor" in the left sidebar
3. Create a new query

### Step 2: Copy and Paste Migration

Open the file:
```
sql-migrations/021_outlets_and_room_restructure.sql
```

Copy ALL the contents and paste into the Supabase SQL Editor.

### Step 3: Run the Migration

Click "Run" button in Supabase SQL Editor.

You should see messages like:
```
✓ Outlets table created
✓ Treatment rooms linked to outlets
✓ Appointments linked to outlets
✓ Auto-assign room function created
✓ RLS policies configured
✓ Existing data migrated
```

### Step 4: Refresh the Page

After the migration runs successfully, refresh your browser.

The error should be gone and you'll see:
- A default outlet created for SkinCoach
- Existing rooms linked to that outlet
- API routes working properly

## What This Migration Does:

1. **Creates outlets table** - For managing multiple physical locations
2. **Links rooms to outlets** - Each room belongs to a specific outlet/location
3. **Adds auto-assign function** - Automatically assigns available rooms
4. **Creates default outlet** - Migrates your existing data
5. **Sets up relationships** - Proper foreign keys and indexes

## After Migration:

You can then:
- View outlets in the Booking tab
- Add more outlets for additional locations
- Assign rooms to specific outlets
- Update outlet addresses

## If You Get Errors:

If the migration fails, it's likely because:
1. You already ran it partially
2. Some tables already exist

In that case, you can:
1. Check which parts failed
2. Comment out the parts that already exist
3. Run only the missing parts

Or contact me for help!
