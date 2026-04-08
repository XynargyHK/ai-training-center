# GEMINI.md - Project Context & Rules

## ⚠️ MANDATORY STARTUP DIRECTIVE
**At the start of every session, you MUST:**
1. Check the latest entries in `C:\Users\Denny\.gemini\tmp\ai-training-center\logs.json` and `CLAUDE_INTERACTION_LOG.md`.
2. **Restart the AI Training Center**: Run `npm run dev` in the background.
3. **Open the browser**: Navigate to `http://localhost:3000`.
**Resume work from the most recent timestamp found in the logs.**

## 🚀 Project Overview
**AI Staffs App** (formerly AI Training Center): A multi-tenant SaaS platform for deploying autonomous AI employees.
- **Vision**: Businesses harness AI for B2B lead generation, automated sales outreach, and expert customer support.
- **Key Capability**: "One AI Brain" (Gemini 2.5-flash) powered by **OpenClaw** (agentic execution) and **NotebookLM-style grounding** (document-based truth).

## 🛠 Tech Stack (STRICT)
- **Framework**: Next.js 16 (App Router), React 19, TypeScript.
- **LLM**: **Google Gemini 2.5-flash ONLY**.
  - *Note*: Always use `gemini-2.5-flash` as configured in `.env.local`. Never suggest 1.5-flash or other models.
- **Database**: Supabase (PostgreSQL + pgvector).
- **Styling**: Tailwind CSS + Lucide Icons.

## 📍 Current Status
- **Vision Pivot**: Moving from training to active "AI Employee" engine.
- **Agentic Integration**: Exploring OpenClaw for autonomous browser/terminal tasks.
- **Grounding Layer**: Ensuring AI Staff strictly uses uploaded Knowledge Base PDFs to prevent hallucinations.
- **Master Domain**: Project branding centered at `aistaffs.app`.

## ⚠️ Critical Rules & Knowledge
1. **No Fallbacks**: Do not use OpenAI or Anthropic for core chat features; use Gemini.
2. **Vision Support**: Only Gemini supports image/PDF analysis in this codebase.
3. **Multi-tenancy**: Always filter queries by `business_unit_id` to respect RLS.
4. **Environment**: `.env.local` contains all active keys. Check it before assuming config.
5. **GIT CONTROL (STRICT)**: NEVER use git commands (`git add`, `git commit`, `git push`) without an explicit Directive from the user. Only modify local files. Do not assume a task is finished until the user explicitly says to deploy.

## 📂 Key File Locations
- `/src/lib/supabase-storage.ts`: Database CRUD functions.
- `/src/lib/translations.ts`: Multi-language support (EN, ZH-CN, ZH-TW, VI).
- `/sql-migrations/`: Database schema and RLS policies.
- `/src/app/api/ai/`: AI service endpoints.

---
*This file is foundational. Read it at the start of every session.*
