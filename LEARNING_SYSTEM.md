# Claude Learning System

This system tracks Claude's mistakes, corrections, and repeated errors to prevent the same issues from happening repeatedly.

## 🎯 Purpose

Prevent Claude from:
- Making the same mistakes multiple times
- Forgetting user corrections
- Questioning correct configurations repeatedly
- Losing context across sessions

## 📁 Files

1. **`CLAUDE_MEMORY.md`** - Main memory file with critical facts and corrections
2. **`scripts/learning-tracker.js`** - Background monitoring service
3. **`.claude/errors.json`** - Database of captured errors
4. **`.claude/corrections.json`** - Database of user corrections
5. **`start-learning-tracker.bat`** - Windows startup script

## 🚀 Usage

### Start the Learning Tracker (Background Service)

**Option 1: Double-click the batch file**
```
start-learning-tracker.bat
```

**Option 2: Command line**
```bash
npm run learning-watch
```

This will:
- Monitor the `log/` directory for errors
- Detect repeated mistakes
- Auto-update `CLAUDE_MEMORY.md`
- Alert when errors repeat 3+ times

### View Learning Report

```bash
npm run learning-report
```

Shows:
- Total unique errors captured
- Repeated errors (2+ occurrences)
- User corrections that were violated multiple times
- Top 5 most common errors

### Query Learned Facts

```bash
npm run learning-query "gemini"
```

Search for specific corrections or facts in the database.

### Manually Add Corrections

```bash
node scripts/learning-tracker.js add-correction "wrong assumption" "correct fact" "optional user quote"
```

Example:
```bash
node scripts/learning-tracker.js add-correction "gemini-1.5-flash" "gemini-2.5-flash" "User confirmed multiple times"
```

## 📊 How It Works

### 1. Error Detection
- Watches log files in `log/` directory
- Captures errors from server logs, transcripts, etc.
- Tracks how many times each error repeats
- Alerts if an error occurs 3+ times

### 2. Correction Tracking
- Records when user corrects Claude's assumptions
- Detects user frustration keywords: "NO!!!", "wrong", "stupid"
- Counts violations of known corrections
- Auto-updates memory file

### 3. Memory Persistence
- All corrections stored in JSON databases
- Memory file (`CLAUDE_MEMORY.md`) gets auto-updated
- Survives across terminal sessions
- Can be manually edited

### 4. Query System
- Search for learned facts by keyword
- View correction history
- Generate summary reports

## 🔍 Current Tracked Items

### Critical Correction #1: Gemini Model Name
- **Wrong**: Suggesting `gemini-1.5-flash`
- **Correct**: ALWAYS use `gemini-2.5-flash`
- **Configured in**: `.env.local`
- **User Quote**: "NO!!! it is gemini-2.5-flash? why you always fall back to your old memory"

## 📈 Statistics

Run `npm run learning-report` to see:
- Total errors captured
- Repeated errors count
- Violations of known corrections
- Top problematic patterns

## 🛠️ Advanced Usage

### API Integration

```javascript
const tracker = require('./scripts/learning-tracker');

// Capture an error
tracker.captureError('TypeError: Cannot read property...', {
  file: 'route.ts',
  line: 42
});

// Record a user correction
tracker.captureCorrection(
  'wrong assumption',
  'correct fact',
  'user quote'
);

// Query facts
const results = tracker.queryFact('gemini');

// Get repeated errors
const repeated = tracker.getRepeatedErrors(3); // min 3 occurrences
```

## 📝 Best Practices

1. **Always start the learning tracker** when working on the project
2. **Check `CLAUDE_MEMORY.md`** at the start of each session
3. **Add manual corrections** for critical facts
4. **Run reports weekly** to identify patterns
5. **Update memory file** when user provides corrections

## 🚨 Alerts

The system will console.warn when:
- An error repeats 3+ times
- User frustration is detected in logs
- A known correction is violated again

## 🔄 Session Workflow

**At Session Start:**
1. Read `CLAUDE_MEMORY.md`
2. Query corrections: `npm run learning-query "topic"`
3. Start tracker: `npm run learning-watch`

**During Session:**
1. When user corrects you: Add it immediately
2. When error occurs: It's auto-captured
3. If repeating mistake: Alert appears

**At Session End:**
1. Run report: `npm run learning-report`
2. Review repeated errors
3. Update memory file if needed

## 🎓 Learning From This Session

**Mistake Made**: Suggesting `gemini-1.5-flash` instead of configured `gemini-2.5-flash`

**User's Frustration**: "NO!!! it is gemini-2.5-flash? why you always fall back to your old memory"

**Solution**:
1. Created this learning system
2. Stored correction in database
3. Updated memory file
4. Will check memory file in future sessions

**Lesson**: Always verify configuration files (`.env.local`) before suggesting changes to model names or API settings.
