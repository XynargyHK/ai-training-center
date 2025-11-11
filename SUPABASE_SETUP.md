# 🚀 Supabase Setup Guide for AI Training Center

## ✅ What We've Built So Far

The foundation for a **multi-tenant SaaS platform** with:
- ✅ Supabase client configured
- ✅ Authentication context ready
- ✅ Complete database schema designed
- ✅ Business units API routes created
- ✅ Multi-tenancy architecture in place

---

## 📋 Next Steps to Complete Setup

### **Step 1: Create Supabase Project**

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Fill in:
   - **Name:** `ai-training-center` (or your preferred name)
   - **Database Password:** Create a strong password (save it!)
   - **Region:** Choose closest to you
   - **Pricing Plan:** Free tier is fine to start
4. Click "Create new project"
5. Wait 2-3 minutes for project to be ready

---

### **Step 2: Apply Database Schema**

1. In your Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click "New Query"
3. Open the file `supabase-schema.sql` in your project root
4. Copy the entire content
5. Paste it into the SQL Editor
6. Click "Run" (or press Ctrl+Enter)
7. You should see success messages for all table creations

**Result:** Your database now has:
- `business_units` table
- `users` table
- `business_unit_settings` table
- `knowledge_base` table
- `ai_staff` table
- `training_guidelines` table
- `training_scenarios` table
- `training_sessions` table
- `conversations` table
- `messages` table
- All indexes, triggers, and RLS policies

---

### **Step 3: Get API Keys**

1. In Supabase dashboard, go to **Settings** > **API** (left sidebar)
2. You'll see:
   - **Project URL:** Something like `https://xxxxx.supabase.co`
   - **anon/public key:** A long string starting with `eyJ...`
   - **service_role key:** A long string (keep this secret!)

3. Copy these values

---

### **Step 4: Configure Environment Variables**

1. Open `.env.local` in your project
2. Replace the placeholder values:

```bash
# Replace these with your actual Supabase values
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...your_service_role_key_here
```

3. Save the file
4. **IMPORTANT:** Never commit `.env.local` to Git (it's already in `.gitignore`)

---

### **Step 5: Test the Connection**

1. Restart your dev server:
```bash
npm run dev
```

2. Test the Business Units API:
```bash
# Create a test business unit
curl -X POST http://localhost:3000/api/business-units \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Company",
    "slug": "test-company",
    "email": "test@example.com"
  }'
```

3. You should get a response with the created business unit and an auto-generated API key!

---

## 🎯 What You Can Do Now

### **1. Create Your First Business Unit**

You can either use the API or create directly in Supabase:

**Via Supabase Dashboard:**
1. Go to **Table Editor** > `business_units`
2. Click "Insert Row"
3. Fill in:
   - `name`: Your company name
   - `slug`: A unique identifier (e.g., "my-company")
   - `email`: Your email
4. Click "Save"
5. The system will auto-generate `api_key` and `webhook_secret`

**Via API:**
```bash
POST /api/business-units
{
  "name": "My Company",
  "slug": "my-company",
  "email": "me@example.com",
  "subscription_tier": "pro"
}
```

### **2. View Your API Key**

1. Go to **Table Editor** > `business_units`
2. Find your business unit row
3. Copy the `api_key` value (starts with `bu_live_...`)
4. This key is used to authenticate API calls from your chatbot

---

## 🔧 Current Architecture

```
┌─────────────────────────────────────────┐
│     AI Training Center (Frontend)       │
│  - Admin UI for training AI             │
│  - Knowledge base management            │
│  - Training scenarios                   │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│        Next.js API Routes               │
│  /api/business-units                    │
│  /api/ai/chat (existing)                │
│  /api/ai/coach-training (existing)      │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│         Supabase Database               │
│  - business_units (multi-tenancy)       │
│  - users (auth)                         │
│  - knowledge_base                       │
│  - ai_staff                             │
│  - conversations                        │
│  - messages                             │
└─────────────────────────────────────────┘
```

---

## 📝 Next Development Steps

### **Phase 2: Migrate Existing Features to Supabase**

Currently, your app uses localStorage. Next steps:

1. **Migrate Knowledge Base**
   - Create API route `/api/knowledge-base`
   - Update admin UI to use Supabase instead of localStorage
   - Implement CRUD operations

2. **Migrate AI Staff**
   - Create API route `/api/ai-staff`
   - Store trained AI profiles in Supabase
   - Enable multi-tenant access

3. **Migrate Training Data**
   - Move training scenarios to Supabase
   - Store training sessions history
   - Enable analytics on training performance

4. **Add Authentication**
   - Create login/signup pages
   - Protect admin routes
   - Implement role-based access

### **Phase 3: Unified Chat API**

Create `/api/v1/chat` that:
- Accepts API key authentication
- Loads business unit specific knowledge base
- Returns AI responses
- Tracks conversations in database

### **Phase 4: Web Widget**

Build embeddable JavaScript widget:
- Clients embed on their website
- Connects to your AI via API key
- Works with any business unit

---

## 🔐 Security Features Already Implemented

✅ **Row Level Security (RLS):**
- Users can only see data from their business unit
- Automatic data isolation per tenant

✅ **API Key Authentication:**
- Each business unit gets unique API key
- Keys auto-generated securely
- Webhook secrets for channel integrations

✅ **Encrypted Secrets:**
- LLM API keys stored encrypted
- Service role key never exposed to client

---

## 🐛 Troubleshooting

### **"Failed to fetch business units"**
- Check that database schema was applied successfully
- Verify `.env.local` has correct Supabase URL and keys
- Check Supabase dashboard for any errors

### **"Cannot read properties of undefined"**
- Make sure dev server was restarted after adding .env.local values
- Check browser console for specific errors

### **"Row Level Security policy violation"**
- RLS policies are enabled
- For testing, you may need to use `supabaseAdmin` instead of `supabase`
- Make sure user is authenticated when using RLS-protected tables

---

## 📚 Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js + Supabase Guide](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

---

## ✅ Summary

You now have:
1. ✅ Multi-tenant database structure
2. ✅ Business units with auto-generated API keys
3. ✅ Authentication system ready
4. ✅ Foundation for scaling to multiple clients
5. ✅ Row-level security for data isolation

**Next:** Apply the database schema and start testing! 🚀
