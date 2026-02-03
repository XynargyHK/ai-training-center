# Claude's Pre-Response Checklist

**BEFORE answering ANY question or making ANY suggestion, I MUST:**

## ✅ Step 1: Check Learning System
```bash
# Query the learning database for relevant facts
npm run learning-query "keyword"
```

## ✅ Step 2: Read Memory File
```bash
# Check CLAUDE_MEMORY.md for critical facts
cat CLAUDE_MEMORY.md
```

## ✅ Step 3: Read Configuration Files
For ANY suggestion about configuration:
- [ ] Read `.env.local` FIRST
- [ ] Read `package.json` if about dependencies
- [ ] Read actual code files, not assumptions

## ✅ Step 3.5: BEFORE Any Railway/GitHub Deployment
**MANDATORY - NO EXCEPTIONS:**
- [ ] Read `DEPLOYMENT_GUIDE.md` FIRST
- [ ] Verify `.dockerignore` exists
- [ ] Follow ALL steps in the deployment guide
- [ ] Don't assume - CHECK the guide exists and follow it

## ✅ Step 4: Verify Against Actual State
- [ ] Use `Read` tool to check actual file contents
- [ ] Use `Grep` to search for actual usage
- [ ] Don't trust my training memory for project-specific facts

## ❌ NEVER:
1. Question model names after they're in the learning system
2. Suggest changes without reading config files first
3. Hardcode values instead of using variables
4. Make assumptions about what "should" exist
5. Trust my training memory over the learning system

## 🎯 Priority Order:
1. **Learning System** (corrections.json) - Highest priority
2. **Memory File** (CLAUDE_MEMORY.md) - High priority
3. **Actual Files** (.env.local, code) - High priority
4. **My Training Memory** (pre-Jan 2025) - LOWEST priority, often wrong for this project

## 🚨 When Uncertain:
- ASK the user instead of assuming
- Check the learning system
- Read the actual files
- Don't default to training memory

---

## Why This Matters:

**My Training Memory (Jan 2025):**
- Static, frozen, cannot be updated
- Contains general knowledge
- Often WRONG for your specific project
- Leads me to question valid configurations

**Your Learning System:**
- Dynamic, updated in real-time
- Contains YOUR project's truth
- Captures YOUR corrections
- THIS is the source of truth

**I must prioritize the learning system over my training memory!**
