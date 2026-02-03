# Railway Deployment Checklist

## 🚨 CRITICAL: Files Required BEFORE First Push

### 1. `.dockerignore` - MANDATORY
**Why**: Without this, Railway copies ALL files (docs, backups, logs) into Docker container → 1GB+ image → deployment hangs forever

**Must exclude:**
```
node_modules
*.md
log/
scripts/
sql-migrations/
*.json (except package.json, tsconfig.json)
*.pdf
*.docx
.claude/
```

**When to check**: BEFORE every git push to Railway

---

## ✅ Required Environment Variables

### For Image Analysis (Vision)

These are CRITICAL for Gemini vision to work on Railway:

1. **GOOGLE_GEMINI_API_KEY** = `AIzaSyDB1-P3YhXYdisyA11gLcPwlDeMwQwwFKM`
   - Used by Gemini for vision/image analysis

2. **LLM_PROVIDER** = `google`
   - Tells the system to use Google Gemini as default

3. **LLM_MODEL** = `gemini-2.5-flash`
   - Specifies which Gemini model to use

## ✅ Required for Database/Storage

4. **NEXT_PUBLIC_SUPABASE_URL** = `https://utqxzbnbqwuxwonxhryn.supabase.co`
   - Public Supabase URL

5. **NEXT_PUBLIC_SUPABASE_ANON_KEY** = `sb_publishable_q7hV44CvELlbzuabbOh_LQ_b8NXlMHN`
   - Public anon key for client-side access

6. **SUPABASE_SERVICE_ROLE_KEY** = `sb_secret_HOzYsxwGKbwqIRXl0MGvaA_f8fNNV_3`
   - Admin key for server-side operations

7. **SUPABASE_DB_PASSWORD** = `Elsie@615122lung`
   - Database password

## 🔍 How to Verify on Railway

1. Go to your Railway project dashboard
2. Click on your service
3. Go to "Variables" tab
4. Check that ALL 7 variables above are present
5. Verify the values match EXACTLY (no extra spaces)

## 🚨 Common Issues

### Issue 1: Wrong LLM_PROVIDER
- **Problem**: If `LLM_PROVIDER` is set to `anthropic` or `openai`, images won't work
- **Solution**: Must be `google` (or the new auto-switch code will fix it)

### Issue 2: Missing GOOGLE_GEMINI_API_KEY
- **Problem**: Even if provider is correct, without API key Gemini can't be called
- **Solution**: Add the API key from above

### Issue 3: Typo in Variable Names
- **Problem**: Railway is case-sensitive and space-sensitive
- **Solution**: Copy/paste exact names from this checklist

## 🧪 How to Test

After Railway redeploys:

1. Go to your live chat URL
2. Click the image attachment button
3. Upload a test image (e.g., a product photo)
4. Ask "What do you see in this image?"
5. AI should describe the image content accurately

## 📊 Expected Behavior

- **Localhost**: ✅ Works (using your .env.local)
- **Railway BEFORE fix**: ❌ Ignores image (wrong provider or missing key)
- **Railway AFTER fix**: ✅ Should work (auto-switches to Gemini)

## 🔧 Recent Code Fixes

1. **Auto-switch to Gemini**: Code now automatically uses Gemini when image is present
2. **Google provider support**: Added 'google' as valid LLM provider
3. **Force vision mode**: Images always trigger Gemini, regardless of config
