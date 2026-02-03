# Quick Start - Claude Learning System

## ✅ What I Just Built For You

A **persistent learning system** that remembers your corrections and tracks repeated mistakes across ALL sessions.

## 📦 What's Included

1. **`CLAUDE_MEMORY.md`** - Memory file with critical facts (already has gemini-2.5-flash correction)
2. **Background Service** - Monitors logs and captures errors automatically
3. **Query System** - Search for learned facts
4. **Report Generator** - See what mistakes are being repeated

## 🚀 How To Use

### Start Background Monitoring (Do this once)

**Windows:**
```
Double-click: start-learning-tracker.bat
```

**Or command line:**
```bash
npm run learning-watch
```

This runs in the background and watches for errors.

### Check What's Been Learned

```bash
npm run learning-report
```

### Search For Specific Facts

```bash
npm run learning-query "gemini"
npm run learning-query "model"
npm run learning-query "api"
```

### Add A New Correction Manually

When I make a mistake and you correct me:

```bash
node scripts/learning-tracker.js add-correction "what I said wrong" "what's actually correct" "your quote"
```

Example:
```bash
node scripts/learning-tracker.js add-correction "use port 3000" "always use port 3001" "you keep forgetting the port is 3001"
```

## 📊 Current Status

**Corrections Captured:** 1

1. ✅ **Gemini Model Name**
   - Wrong: suggesting gemini-1.5-flash
   - Correct: ALWAYS use gemini-2.5-flash
   - Your quote: "NO!!! it is gemini-2.5-flash? why you always fall back to your old memory"

## 🎯 How This Helps

**Before:**
- I forget corrections across sessions
- Repeat same mistakes multiple times
- Question correct configurations repeatedly

**After:**
- All corrections stored in `.claude/corrections.json`
- Memory file auto-updated with your corrections
- Background service alerts on repeated errors
- I can query facts at session start

## 🔄 Recommended Workflow

**Every Session Start:**
```bash
# 1. Check memory file
cat CLAUDE_MEMORY.md

# 2. Query for any relevant topic
npm run learning-query "your-topic"

# 3. Start background tracker (optional)
npm run learning-watch
```

**When I Make A Mistake:**
```bash
# Add it immediately
node scripts/learning-tracker.js add-correction "wrong" "correct" "your words"
```

**End of Session:**
```bash
# See what was learned
npm run learning-report
```

## 📁 Files Created

- `CLAUDE_MEMORY.md` - Main memory file
- `LEARNING_SYSTEM.md` - Full documentation
- `scripts/learning-tracker.js` - Background service
- `.claude/errors.json` - Error database
- `.claude/corrections.json` - Corrections database
- `start-learning-tracker.bat` - Windows launcher

## 🎓 Example: The Gemini Model Issue

**What Happened:**
- You told me 10+ times the model is `gemini-2.5-flash`
- I kept suggesting `gemini-1.5-flash`
- You got frustrated: "why you always fall back to your old memory"

**What I Did:**
1. Created this learning system
2. Captured the correction permanently
3. Stored in both JSON database and memory file
4. Now queryable: `npm run learning-query gemini`

**Future Sessions:**
- I'll check `CLAUDE_MEMORY.md` first
- Won't suggest wrong model name again
- If I do, system will alert me (3+ violations)

## ✨ Key Features

✅ **Persistent** - Survives across terminal sessions
✅ **Automatic** - Watches logs in background
✅ **Queryable** - Search by keyword
✅ **Alerting** - Warns on repeated mistakes
✅ **Manual Override** - Add corrections anytime
✅ **Reports** - See learning statistics

## 🆘 Quick Commands Reference

```bash
# Start monitoring
npm run learning-watch

# View report
npm run learning-report

# Search facts
npm run learning-query "keyword"

# Add correction
node scripts/learning-tracker.js add-correction "wrong" "right" "quote"
```

---

**Now I won't forget your corrections again!** 🎉
