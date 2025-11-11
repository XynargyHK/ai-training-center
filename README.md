# AI Training Center

A comprehensive AI-powered training platform for customer service representatives, featuring roleplay simulations, knowledge management, and real-time AI coaching with Supabase backend.

## Features

### 🎭 Roleplay Training
- **AI Customer Simulations**: Practice with AI-powered customers exhibiting different personalities (confused, angry, price-sensitive, tech-savvy, enthusiastic)
- **Dynamic Scenarios**: Multiple difficulty levels (Beginner, Intermediate, Advanced)
- **Real-time Feedback**: Get instant feedback on your responses
- **Session Recording**: All training sessions saved to Supabase with detailed analytics
- **Performance Scoring**: Track your progress with automated scoring

### 📚 Knowledge Management
- **Knowledge Base**: Centralized repository with vector search
- **FAQ Library**: Searchable FAQ database with semantic search
- **Canned Messages**: Quick response templates
- **Guidelines**: Training guidelines with category-based organization
- **Smart Search**: Hybrid search combining vector similarity and keyword matching

### 🤖 AI-Powered Features
- **Multiple AI Providers**: Support for OpenAI, Anthropic Claude, and Ollama
- **Semantic Search**: Vector embeddings powered by pgvector
- **Context-Aware Responses**: AI learns from your knowledge base
- **Training Memory**: AI coaches remember lessons from training sessions

### 🔒 Enterprise-Ready
- **Multi-tenant Architecture**: Business unit isolation with RLS
- **Supabase Backend**: Secure, scalable PostgreSQL database
- **API-First Design**: All database operations through authenticated API routes
- **Type-Safe**: Built with TypeScript

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set up Environment Variables

Create `.env.local` file:

```bash
# LLM Configuration
LLM_PROVIDER=openai              # Options: openai, anthropic, ollama
LLM_MODEL=gpt-4o                 # Model name (provider-specific)

# OpenAI (if using OpenAI)
OPENAI_API_KEY=your_openai_api_key_here

# Anthropic (if using Claude)
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Ollama (if using local models)
OLLAMA_BASE_URL=http://localhost:11434

# Supabase Configuration (Required)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the AI Training Center.

### 4. Set Up Supabase Database

1. Create a new Supabase project at [supabase.com](https://supabase.com)

2. Enable the pgvector extension:
   - Go to SQL Editor in your Supabase dashboard
   - Run: `CREATE EXTENSION IF NOT EXISTS vector;`

3. Run the database migrations:
   - Navigate to `sql-migrations/` folder
   - Execute each migration file in order (001 through 009) in the SQL Editor
   - This will create all necessary tables, RLS policies, and indexes

## Deployment

### Railway Deployment

1. Push your code to GitHub (see instructions below)
2. Go to [railway.app](https://railway.app) and create a new project
3. Connect your GitHub repository
4. Add all environment variables from `.env.local` in Railway dashboard
5. Railway will auto-detect Next.js and deploy automatically

### Vercel Deployment

```bash
npm install -g vercel
vercel
```

Add environment variables in Vercel dashboard under Project Settings → Environment Variables.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL + pgvector)
- **AI/LLM**: OpenAI GPT, Anthropic Claude, Ollama
- **Styling**: Tailwind CSS
- **Vector Search**: pgvector for semantic search
- **Embeddings**: OpenAI text-embedding-3-small
- **Deployment**: Railway / Vercel

## Project Structure

```
ai-training-center/
├── src/
│   ├── app/
│   │   ├── page.tsx                      # Main dashboard
│   │   ├── layout.tsx
│   │   └── api/
│   │       ├── training/                 # Training data API
│   │       ├── knowledge/                # Knowledge base API
│   │       ├── ai/
│   │       │   ├── chat/                 # AI coach chat
│   │       │   ├── customer-brain/       # AI customer simulation
│   │       │   └── coach-training/       # Coach training API
│   │       └── llm-config/               # LLM provider config
│   ├── components/admin/
│   │   ├── ai-training-center.tsx        # Main training dashboard
│   │   └── roleplay-training.tsx         # Roleplay scenarios
│   └── lib/
│       ├── supabase-storage.ts           # Supabase database operations
│       ├── api-client.ts                 # Client-side API wrapper
│       ├── llm-service.ts                # Multi-provider LLM service
│       └── embeddings.ts                 # Vector embeddings
├── sql-migrations/                       # Database migrations (001-009)
├── .env.local                            # Environment variables (not in git)
├── .gitignore
└── package.json
```

## Architecture

### Security Model

```
Browser (anon key)
    ↓ SELECT only
Supabase RLS
    ↓
Next.js API Routes (service key)
    ↓ All writes
PostgreSQL Database
```

- **Client**: Uses anon key for read-only access
- **Server**: API routes use service role key for all mutations
- **RLS**: Ensures data isolation between business units

## Database Schema

Main tables:

- `business_units`: Multi-tenant organization structure
- `training_scenarios`: Roleplay training scenarios
- `training_sessions`: Recorded training sessions
- `ai_staff`: AI coach profiles
- `knowledge_base`: Product documentation (with vector embeddings)
- `faq_library`: FAQs (with vector embeddings)
- `canned_messages`: Quick response templates
- `guidelines`: Training guidelines
- `training_data`: AI training examples

All tables use Row Level Security (RLS) for data isolation.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details
