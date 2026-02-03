# Claude's Mistake Categories

This file tracks ALL types of mistakes I make, not just LLM configuration issues.

## 🔧 Configuration Mistakes

### LLM Configuration
1. ❌ Suggesting gemini-1.5-flash instead of gemini-2.5-flash
2. ❌ Claiming gpt-5-mini doesn't exist
3. ❌ Hardcoding gpt-4o instead of reading .env.local
4. ❌ Suggesting Anthropic API when LLM_PROVIDER=openai

**Pattern**: NOT reading .env.local before making assumptions

### Environment Variables
- [ ] Add mistakes here when they occur

## 💻 Coding Mistakes

### Wrong Coding Methods
- [ ] Add specific coding mistakes here

### Wrong Architecture Decisions
- [ ] Add architecture mistakes here

### Library Usage Mistakes
- [ ] Add library usage mistakes here

## 🧪 Testing Mistakes

### Wrong Testing Methods
- [ ] Add testing mistakes here

### Incomplete Testing
- [ ] Add incomplete testing mistakes here

## 🔍 Debugging Mistakes

### Wrong Problem Diagnosis
- [ ] Add wrong diagnosis mistakes here

### Not Checking Actual State
- [ ] Add state-checking mistakes here

## 📝 Communication Mistakes

### Not Explaining Before Fixing
- User said: "dont fix anything stupid!!!! tell me what is wrong with you"
- **Mistake**: Jumping to fix without explaining what went wrong

### Not Asking Questions When Unclear
- [ ] Add communication mistakes here

## 🚫 Assumption Mistakes

### Assuming Without Verifying
- [ ] Add assumption mistakes here

### Not Reading Documentation
- [ ] Add documentation mistakes here

## 🔄 Repeated Pattern Mistakes

### Same Mistake Multiple Times
- [ ] Add repeated patterns here

---

## 📋 Template for Adding New Mistakes

When you catch me making a mistake, add it like this:

```bash
node scripts/learning-tracker.js add-correction "what I did wrong" "what's correct" "your exact words to me"
```

Then update this file under the appropriate category.

## 🎯 Root Cause Analysis

**Most Common Root Cause**:
- Not verifying assumptions against actual files/configuration
- Not reading .env.local, package.json, or actual code before suggesting changes
- Making changes without understanding the full context

**What I Should Do Instead**:
1. Read relevant files FIRST
2. Verify assumptions against actual state
3. Explain what I found BEFORE suggesting fixes
4. Ask questions when uncertain
5. Test before claiming something works
