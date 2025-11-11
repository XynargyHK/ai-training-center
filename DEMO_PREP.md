# Demo Preparation Checklist - AI Training Center

## ✅ Before Demo Tomorrow

### 1. Install Dependencies (5 mins)

```bash
cd C:\Users\Denny\ai-training-center
npm install
```

### 2. Add OpenAI API Key (1 min)

Edit `.env.local`:
```
OPENAI_API_KEY=your_openai_api_key_here
```

### 3. Test Locally (5 mins)

```bash
npm run dev
```

Open http://localhost:3000

Should see AI Training Center dashboard ✅

### 4. Pre-load Demo Data (10 mins)

Open the app and add:

**Knowledge Base:**
- Category: "Product Information"
- Topic: "AI Training Platform"
- Content: "Our AI Training Center helps businesses train customer service AI agents through realistic roleplay scenarios..."

**Training Data:**
- Question: "What is AI Training Center?"
- Answer: "AI Training Center is a platform for training AI agents with realistic scenarios..."
- Category: "General"
- Tone: "Professional"

**Scenario:**
- Go to "Roleplay" tab
- Create scenario: "Customer Service - Product Inquiry"
- Customer Type: "Confused"

### 5. Test AI Customer (2 mins)

- Start a training session
- Send message: "Hi, I need help"
- Should get AI customer response ✅

---

## 🎯 Demo Flow (Recommended)

### 1. Introduction (2 mins)
"This is our AI Training Center - a platform for training AI agents for customer service, sales, and support."

### 2. Knowledge Management (3 mins)
- Show "Knowledge" tab
- Demonstrate adding entries
- Show categories and search

### 3. Training Data (2 mins)
- Show "Training" tab
- Add Q&A pair
- Explain tone settings

### 4. Roleplay Training (5 mins) ⭐ **HIGHLIGHT**
- Switch to "Roleplay" tab
- Show training scenarios
- Start a session
- Demonstrate live AI customer conversation
- Show scoring and feedback

### 5. Analytics (1 min)
- Show "Analytics" tab
- Metrics and performance

### 6. Lead Management (2 mins) (Optional)
- Show lead tracking
- Email sequences

---

## 💬 Key Talking Points

### Problem:
"Training customer service teams is expensive and inconsistent."

### Solution:
"Our AI Training Center provides realistic roleplay scenarios where agents practice with AI customers that behave like real customers - confused, angry, or price-sensitive."

### Benefits:
✅ Train 24/7 without human coaches
✅ Consistent training scenarios
✅ Immediate feedback and scoring
✅ Track performance over time
✅ Works for customer service, sales, support

### Technical:
- "Currently uses browser storage for quick demo"
- "For production, we add database for team collaboration"
- "Migration takes 30 minutes"

---

## ❓ Anticipated Questions & Answers

**Q: "Can multiple team members use this?"**
A: "In this demo, it's browser-based. For production, we add Supabase database so your whole team can access shared scenarios and data. Migration takes 30 minutes."

**Q: "How does the AI customer work?"**
A: "We use OpenAI's GPT-4o-mini with custom prompts for different customer personalities - angry, confused, technical, etc. It responds naturally based on the scenario."

**Q: "Can we customize scenarios?"**
A: "Absolutely! You can create unlimited scenarios, define customer types, set objectives, and track performance."

**Q: "What about integrations?"**
A: "The system is API-first. We can integrate with WhatsApp, Slack, or your existing tools. That's phase 2 after core training is validated."

**Q: "How much does it cost?"**
A: "Development is $X. Hosting is ~$20-50/month. OpenAI API costs ~$0.01 per training conversation."

---

## 🚨 Troubleshooting

### If localhost doesn't work:
```bash
npm install --force
npm run dev
```

### If AI customer doesn't respond:
- Check .env.local has OPENAI_API_KEY
- Restart dev server

### If data disappears:
- localStorage clears when cache clears
- Explain: "This is why production needs database"

---

## 📋 Post-Demo Action Items

If client is interested:

1. ✅ Confirm requirements
2. ✅ Add Supabase for production
3. ✅ Deploy to leadgen.to
4. ✅ Custom scenarios for their business
5. ✅ (Future) WhatsApp integration

---

## 🎉 You're Ready!

The demo is straightforward and impressive. The AI customer roleplay is the killer feature - make sure to emphasize that!

Good luck! 🚀
