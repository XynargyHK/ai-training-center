# Deployment Guide - AI Training Center

## 🚨 CRITICAL: BEFORE ANY DEPLOYMENT

### Step 0: Create `.dockerignore` (MANDATORY - DO THIS FIRST!)

**WHY THIS MATTERS:**
- Without `.dockerignore`, Railway copies EVERYTHING into Docker container
- This includes docs, backups, logs, scripts → 1GB+ image size
- Result: Deployment hangs forever on "Creating container..."
- **THIS IS NOT OPTIONAL**

**Create `.dockerignore` file in root:**

```dockerignore
# Dependencies
node_modules
npm-debug.log
yarn-error.log
package-lock.json

# Next.js
.next
out
build

# Environment files
.env
.env.local
.env*.local

# Git
.git
.gitignore

# IDE
.vscode
.idea

# Documentation and logs (DO NOT DEPLOY THESE)
*.md
log/
*.txt

# Database backups (NEVER DEPLOY THESE)
*.json
!package.json
!tsconfig.json
!next.config.js

# Scripts (not needed in production)
scripts/

# SQL migrations (run separately, not in container)
sql-migrations/

# Large files
*.pdf
*.docx
*.doc

# Test files
*.test.ts
*.test.tsx
*.spec.ts

# OS files
.DS_Store
Thumbs.db

# Claude
.claude/

# Temporary files
tmp/
temp/
nul
```

**✅ Checklist before pushing:**
- [ ] `.dockerignore` file exists in root directory
- [ ] File includes all exclusions above
- [ ] Test: `git add .dockerignore` and commit it

---

## 🚀 Quick Deploy to Railway (5 minutes)

### Step 1: Prepare Repository

```bash
cd C:\Users\Denny\ai-training-center

# Initialize git (if not done)
git init
git add .
git commit -m "Initial AI Training Center setup"
```

### Step 2: Push to GitHub

```bash
# Create new repo on GitHub first, then:
git remote add origin https://github.com/your-username/ai-training-center.git
git branch -M main
git push -u origin main
```

### Step 3: Deploy on Railway

1. Go to [railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose `ai-training-center` repository
5. Railway will auto-detect Next.js

### Step 4: Add Environment Variables

In Railway dashboard → Variables tab:

```
OPENAI_API_KEY=sk-proj-your-key-here
```

### Step 5: Get Your URL

Railway will provide a URL like: `https://ai-training-center-production.up.railway.app`

---

## 🌐 Custom Domain (leadgen.to)

### In Railway:

1. Go to Settings → Domains
2. Click "Custom Domain"
3. Add: `www.leadgen.to`

### In Your Domain Provider (Namecheap/GoDaddy):

Add CNAME record:
```
Type: CNAME
Host: www
Value: [your-railway-url].up.railway.app
TTL: Auto
```

---

## ✅ Verify Deployment

1. Visit your Railway URL
2. Should see AI Training Center dashboard
3. Test adding knowledge entries (saves to localStorage)
4. Test roleplay training (requires OPENAI_API_KEY)

---

## 🔧 Troubleshooting

### Build Failed?
- Check Node version (should be 18+)
- Verify package.json is correct
- Check Railway build logs

### API Error?
- Verify OPENAI_API_KEY is set
- Check environment variables in Railway

### Blank Page?
- Check browser console for errors
- Verify build completed successfully
- Check Railway service logs

---

## 📱 For Demo Tomorrow

### Recommended Setup:

1. **Deploy to Railway** (for professional URL)
2. **Use localStorage** (works perfectly for demo)
3. **Add OPENAI_API_KEY** (for AI customer simulation)
4. **Prepare sample data** (create 2-3 training scenarios beforehand)

### Demo Tips:

1. Pre-load some training data in localStorage
2. Have 1-2 roleplay scenarios ready
3. Explain: "Using browser storage for demo speed, will add database for team use"
4. Show the AI customer simulation in action
5. Demonstrate the knowledge management

---

## 🔮 Future: Add Supabase (30 mins)

When client approves and wants multi-user:

1. Create Supabase project
2. Run migrations (will provide SQL)
3. Add Supabase env vars
4. App automatically switches to database
5. Redeploy

No code changes needed - storage layer is abstracted!

---

## 📞 Support

Issues? Check:
- Railway logs
- Browser console
- Environment variables

Ready to demo! 🎉
