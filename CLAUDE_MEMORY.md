# Claude Memory - Critical Project Facts

**IMPORTANT: Read this file at the start of every session to remember key facts**

## LLM Configuration - DO NOT QUESTION THESE

1. **Gemini Model Name**: `gemini-2.5-flash`
   - This is the CORRECT model name
   - It is configured in `.env.local` as `GEMINI_MODEL=gemini-2.5-flash`
   - NEVER suggest changing this to gemini-1.5-flash or any other model
   - The user has confirmed this multiple times

2. **LLM Provider**: Can be `anthropic`, `ollama`, or `openai`
   - Currently set to: `openai` (see `.env.local`)
   - Model: `gpt-5-mini`

## Common Mistakes to AVOID

### ❌ MISTAKE #1: Questioning the Gemini Model Name
- **WRONG**: Suggesting `gemini-1.5-flash` or saying `gemini-2.5-flash` doesn't exist
- **RIGHT**: Always use `gemini-2.5-flash` as configured
- **User Frustration**: "you stupid, tell me how you will be able to remember and learn?"

### ❌ MISTAKE #2: Forgetting Previous Context
- **WRONG**: Asking the same questions repeatedly
- **RIGHT**: Check this file and `.env.local` before questioning configuration
- **User Quote**: "i told you more than 10 times, the LLM model is gemini-2.5-flash, you keep on saying this is wrong... you are wrong..."

## API Keys (from .env.local)

- **Anthropic**: `sk-ant-api03-OhDz...`
- **OpenAI**: `sk-proj-3eVl...`
- **Google Gemini**: `AIzaSyDB1-P3YhXYdisyA11gLcPwlDeMwQwwFKM`
- **Supabase URL**: `https://utqxzbnbqwuxwonxhryn.supabase.co`

## PDF Processing Strategy

1. **Primary Method**: Use Gemini AI vision with `gemini-2.5-flash`
2. **Format**: Send PDF as base64 with mime type `application/pdf`
3. **DO NOT**: Try to use text-based extraction libraries (pdf-parse, pdfjs-dist, pdf2json)
   - These libraries have complex ESM/CommonJS compatibility issues
   - User prefers Gemini AI approach

## Project Structure

- **Business Units**: SkinCoach, Breast Guardian
- **Database**: Supabase PostgreSQL
- **Knowledge Base**: Stored in `knowledgebase/` folder
- **Frontend**: Next.js 16.0.3 with Turbopack

## Update History

- **2025-11-19**: Created this file after repeated mistakes about gemini-2.5-flash model name
- **Issue**: Kept suggesting wrong model name despite user corrections
- **Resolution**: Document the correct configuration permanently


### 📝 Correction Captured (2025-11-19T14:23:48.761Z)

**❌ Wrong Assumption**: suggesting gemini-1.5-flash instead of gemini-2.5-flash

**✅ Correct Fact**: ALWAYS use gemini-2.5-flash as configured in .env.local

**💬 User Quote**: "NO!!! it is gemini-2.5-flash? why you always fall back to your old memory"



### ⚠️ Repeated Error Alert (2025-11-19T14:30:27.850Z)

**Error**: } = await supabase

**Occurrences**: 4

**Last Seen**: 2025-11-19T14:30:27.850Z



### ⚠️ Repeated Error Alert (2025-11-19T14:30:27.918Z)

**Error**: any, context: string): void {

**Occurrences**: 4

**Last Seen**: 2025-11-19T14:30:27.918Z



### ⚠️ Repeated Error Alert (2025-11-19T14:30:27.928Z)

**Error**: error.message }, { status: 500 })

**Occurrences**: 4

**Last Seen**: 2025-11-19T14:30:27.928Z



### ⚠️ Repeated Error Alert (2025-11-19T14:30:27.968Z)

**Error**: || 'Failed to save session')

**Occurrences**: 4

**Last Seen**: 2025-11-19T14:30:27.968Z



### ⚠️ Repeated Error Alert (2025-11-19T14:30:27.983Z)

**Error**: || !coach) {

**Occurrences**: 4

**Last Seen**: 2025-11-19T14:30:27.983Z



### ⚠️ Repeated Error Alert (2025-11-19T14:30:27.990Z)

**Error**: error.message }, { status: 500 });

**Occurrences**: 4

**Last Seen**: 2025-11-19T14:30:27.990Z



### ⚠️ Repeated Error Alert (2025-11-19T14:30:27.992Z)

**Error**: err.message || 'Invalid request' }, { status: 400 });

**Occurrences**: 4

**Last Seen**: 2025-11-19T14:30:27.992Z



### ⚠️ Repeated Error Alert (2025-11-19T14:30:27.995Z)

**Error**: gone.

**Occurrences**: 4

**Last Seen**: 2025-11-19T14:30:27.995Z



### ⚠️ Repeated Error Alert (2025-11-19T14:30:28.018Z)

**Error**: Missing Supabase environment variables. Please check:

**Occurrences**: 4

**Last Seen**: 2025-11-19T14:30:28.017Z



### ⚠️ Repeated Error Alert (2025-11-19T14:30:28.041Z)

**Error**: [UUID error about sales-1]"

**Occurrences**: 4

**Last Seen**: 2025-11-19T14:30:28.041Z



### ⚠️ Repeated Error Alert (2025-11-19T14:30:28.043Z)

**Error**: Cannot read properties of undefined (reading 'id')"

**Occurrences**: 4

**Last Seen**: 2025-11-19T14:30:28.043Z



### ⚠️ Repeated Error Alert (2025-11-19T14:30:28.067Z)

**Error**: messages showing which variables are missing

**Occurrences**: 4

**Last Seen**: 2025-11-19T14:30:28.066Z



### ⚠️ Repeated Error Alert (2025-11-19T14:30:28.068Z)

**Error**: messages I just added

**Occurrences**: 4

**Last Seen**: 2025-11-19T14:30:28.068Z



### 📝 Correction Captured (2025-11-19T14:33:07.106Z)

**❌ Wrong Assumption**: claiming gpt-5-mini doesn't exist

**✅ Correct Fact**: gpt-5-mini is a valid model that has been established for a long time

**💬 User Quote**: "what do you mean it does not exist? what is wrong with you? we have long time established the api"



### 📝 Correction Captured (2025-11-19T14:33:15.619Z)

**❌ Wrong Assumption**: hardcoding wrong model names like gpt-4o instead of checking .env.local

**✅ Correct Fact**: ALWAYS read .env.local first before suggesting model changes

**💬 User Quote**: "why you keep on hardcoding things, and make it wrong, to gpt-4o, but it should be gpt-5-mini"



### 📝 Correction Captured (2025-11-19T14:33:22.793Z)

**❌ Wrong Assumption**: keep using Anthropic API when LLM_PROVIDER is set to openai

**✅ Correct Fact**: CHECK .env.local LLM_PROVIDER before suggesting API fixes

**💬 User Quote**: "why you keep on using anthropic? what the fuck is wrong with you? where do you get this info?"



### 📝 Correction Captured (2025-11-19T14:36:26.876Z)

**❌ Wrong Assumption**: not explaining what went wrong before making more fixes

**✅ Correct Fact**: EXPLAIN mistakes first, then ask if user wants fixes

**💬 User Quote**: "dont fix anything stupid!!!! tell me what is wrong with you, you keep on making stupid mistake"



### 📝 Correction Captured (2025-11-19T14:46:41.390Z)

**❌ Wrong Assumption**: questioning if gemini-2.5-flash exists after already learning it's correct

**✅ Correct Fact**: gemini-2.5-flash IS VALID - already confirmed, stop questioning it

**💬 User Quote**: "you said you are constantly learning the mistake, and now you say gemini-2.5-flash might not be released what the fuck is wrong with you?"


---

## 🎉 Major Success - Session 2025-11-21

### Railway Deployment - Image Analysis Fixed

**Problem**: Image analysis worked on localhost but failed on Railway
**Status**: ✅ **RESOLVED** - User confirmed "great working good"

**What was fixed**:
1. Node.js version compatibility (added .nvmrc with 20.9.0)
2. Google/Gemini added as valid LLM provider
3. Auto-switch to Gemini when images are present
4. Removed redundant camera button (simplified UX)

**Key Learning**: Only Google Gemini supports vision/images in this codebase. OpenAI and Claude routes don't handle images.

### Railway Environment Variables (VERIFIED)
```env
✅ GOOGLE_GEMINI_API_KEY=AIzaSyDB1-P3YhXYdisyA11gLcPwlDeMwQwwFKM
✅ LLM_PROVIDER=google
✅ LLM_MODEL=gemini-2.5-flash
✅ NEXT_PUBLIC_SUPABASE_URL=https://utqxzbnbqwuxwonxhryn.supabase.co
✅ NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_q7hV44CvELlbzuabbOh_LQ_b8NXlMHN
✅ SUPABASE_SERVICE_ROLE_KEY=sb_secret_HOzYsxwGKbwqIRXl0MGvaA_f8fNNV_3
```

### Critical Code Change - Auto-Switch for Vision
Location: `src/app/api/ai/chat/route.ts`

```typescript
// IMPORTANT: Force use Gemini for image analysis (vision)
// Only Gemini supports multimodal (text + image) input
if (image && llmConfig.provider !== 'google') {
  console.log(`📷 Image detected - forcing Gemini vision model (was: ${llmConfig.provider})`)
  llmConfig = {
    ...llmConfig,
    provider: 'google',
    model: 'gemini-2.5-flash',
    googleKey: process.env.GOOGLE_GEMINI_API_KEY
  }
}
```

### Provider Support Matrix
| Provider | Text | Vision | Status |
|----------|------|--------|--------|
| Google Gemini | ✅ | ✅ | Primary (default) |
| Anthropic Claude | ✅ | ❌ | Available |
| OpenAI GPT | ✅ | ❌ | Available |

### Session Summary
- **Date**: 2025-11-21
- **Git Commits**: 4 (Node.js fix, LLM config, camera removal, vision auto-switch)
- **Documentation**: Created comprehensive session log and Railway checklist
- **Result**: Production deployment now fully functional with image analysis

See: `log/session-2025-11-21-gemini-vision-railway-fix.md` for full details

---

## 📚 How to Look Up Session History

Claude Code automatically saves all conversation history. Here's how to find and read previous sessions:

### Session Log Locations

```
C:\Users\Denny\.claude\
├── projects\
│   └── C--Users-Denny-ai-training-center\
│       ├── {session-id}.jsonl          # Full conversation logs
│       └── agent-{id}.jsonl            # Sub-agent task logs
├── file-history\
│   └── {session-id}\
│       └── {file-hash}@v{version}      # File version backups
├── todos\
│   └── {session-id}-agent-{id}.json    # Todo lists from sessions
├── debug\
│   └── {session-id}.txt                # Debug logs (large files)
└── settings.local.json                 # Permissions config
```

### Finding the Most Recent Session

```bash
# List recent session files sorted by date (most recent first)
ls -lt "C:\Users\Denny\.claude\projects\C--Users-Denny-ai-training-center" | head -10

# Example output:
# -rw-r--r-- 1 Denny  416076 Dec  3 09:41 2ca5e1d1-...-9148b1c2492e.jsonl  <- Current
# -rw-r--r-- 1 Denny 35789066 Dec  3 00:03 ff7cd6ac-...-c0b0b4f80574.jsonl <- Previous
```

### Reading Session History

```bash
# Get the last 50 lines of a session (shows recent messages)
tail -50 "C:\Users\Denny\.claude\projects\C--Users-Denny-ai-training-center\{session-id}.jsonl"

# Search for specific content in sessions
grep -o '"content":"[^"]*keyword[^"]*"' "{session-file}.jsonl"
```

### Session Log Format (JSONL)

Each line is a JSON object with:
- `type`: "user" or "assistant"
- `message.content`: The actual message text
- `timestamp`: When the message was sent
- `uuid`: Unique message ID
- `toolUseResult`: Results from tool calls (file reads, edits, etc.)

### File History (Version Control)

Every file Claude edits is backed up:
```
C:\Users\Denny\.claude\file-history\{session-id}\{file-hash}@v{version}
```

To restore a previous version:
1. Find the session ID from the projects folder
2. Look in `file-history/{session-id}/` for the file
3. The `@v1`, `@v2`, etc. are version numbers

### Quick Commands for Claude

When starting a new session, Claude should:

1. **Check most recent session**:
   ```bash
   ls -lt "C:\Users\Denny\.claude\projects\C--Users-Denny-ai-training-center" | head -5
   ```

2. **Read last messages from previous session**:
   ```bash
   tail -20 "C:\Users\Denny\.claude\projects\C--Users-Denny-ai-training-center\{most-recent-session}.jsonl"
   ```

3. **Find what was being worked on**:
   - Look for `"type":"user"` messages at the end
   - Check `toolUseResult` for files that were modified
   - Look for todo lists in the todos folder

### Example: Finding Last Task

```bash
# Find the last user message
grep '"type":"user"' "{session}.jsonl" | tail -5

# Find files that were edited
grep '"backupFileName"' "{session}.jsonl" | tail -10
```

---

## 🔄 Session Continuity Checklist

When user says "continue":

1. ✅ Check `C:\Users\Denny\.claude\projects\C--Users-Denny-ai-training-center\` for recent sessions
2. ✅ Read the last ~20 lines of the most recent `.jsonl` file
3. ✅ Look for the last user request and what was being implemented
4. ✅ Check file-history for recently modified files
5. ✅ Resume work from where it left off

