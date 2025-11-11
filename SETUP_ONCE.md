# 🚀 ONE-TIME SETUP (Do This Once, Then Everything Is Automatic)

## ⏱️ Takes 2 Minutes

### Step 1: Run Complete Setup SQL (Only Once!)

1. Open: https://supabase.com/dashboard/project/utqxzbnbqwuxwonxhryn/sql/new

2. Copy the ENTIRE content from: `sql-migrations/COMPLETE_SETUP.sql`

3. Paste in SQL Editor

4. Click **"Run"**

5. ✅ Done! You'll see three checkmarks:
   - Step 1/3: RPC function created ✅
   - Step 2/3: Knowledge base upgraded ✅
   - Step 3/3: Products table created ✅

### Step 2: Import Product Data

Run this command:
```
node scripts/import-products-data.js
```

This will automatically import all 50 products from your Excel file into the database.

---

### Step 2: System Is Now Fully Automatic

After running the SQL once, the system will:

✅ **Auto-migrate your data** from localStorage → Supabase
✅ **Auto-create tables** when you upload Excel/PDF
✅ **Auto-upgrade schema** when new features are added
✅ **Auto-handle** all database operations

---

## How To Use After Setup:

### Migrate Your Existing Data:
```
Visit: http://localhost:3000/admin/migrate
Click: "Migrate to Supabase"
Done!
```

### Upload New Files:
```
Just upload Excel/PDF/Video links
System automatically:
  - Parses the file
  - Extracts data
  - Creates knowledge entries
  - Makes it searchable
```

---

## What Happens Automatically:

```
User uploads product Excel
       ↓
System reads columns
       ↓
Creates knowledge_base entries
       ↓
AI can now answer questions about products
```

**No manual work needed after initial SQL setup!**

---

## Troubleshooting:

**Q: I ran the SQL but got an error**
A: Run it again - it's safe to run multiple times (uses `IF NOT EXISTS`)

**Q: Can I skip the SQL setup?**
A: No - Supabase requires SQL execution for schema changes. But it's only once!

**Q: Will this break my existing data?**
A: No - it only ADDS columns, never deletes anything

---

## After Setup, Everything Is Automatic:

- ✅ File uploads → Auto-processed
- ✅ Data migrations → Auto-run
- ✅ Schema upgrades → Auto-applied
- ✅ New business units → Auto-created
- ✅ API keys → Auto-generated

**The system manages itself!**
