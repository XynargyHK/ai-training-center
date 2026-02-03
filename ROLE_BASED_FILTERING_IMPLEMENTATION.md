# Role-Based Filtering Implementation

## Overview
Implemented role-based filtering for all AI staff vector searches. Each AI staff role (coach, sales, customer-service, scientist) now only retrieves relevant knowledge, guidelines, FAQs, and training data specific to their role.

## Changes Made

### 1. Database Schema (SQL Migrations)

**File:** `sql-migrations/013_add_ai_role_to_all_tables.sql`
- Added `ai_role VARCHAR(50)` column to:
  - `knowledge_base` table
  - `training_data` table
  - `faqs` table
- Created indexes for faster role-based queries
- NULL `ai_role` = accessible to ALL roles (general knowledge)

**File:** `sql-migrations/014_update_vector_search_with_role.sql`
- Updated ALL vector search SQL functions to accept `p_ai_role` parameter:
  - `vector_search_knowledge()`
  - `hybrid_search_knowledge()`
  - `vector_search_guidelines()`
  - `vector_search_training_data()`
  - `hybrid_search_faqs()`
- Filter logic: `WHERE (ai_role = p_ai_role OR ai_role IS NULL OR p_ai_role IS NULL)`

### 2. TypeScript Functions

**File:** `src/lib/supabase-storage.ts`
- Updated vector search functions to accept optional `aiRole` parameter:
  ```typescript
  vectorSearchKnowledge(query: string, limit: number = 10, aiRole?: string)
  hybridSearchKnowledge(query: string, limit: number = 10, aiRole?: string)
  vectorSearchGuidelines(query: string, limit: number = 10, aiRole?: string)
  vectorSearchTrainingData(query: string, limit: number = 10, aiRole?: string)
  hybridSearchFAQs(query: string, limit: number = 10, aiRole?: string)
  ```
- Pass `aiRole` to SQL RPC calls as `p_ai_role: aiRole || null`

### 3. API Route Updates

**File:** `src/app/api/ai/chat/route.ts`
- Line 74: FAQ search now filters by role
  ```typescript
  hybridSearchFAQs(message, 1, staffRole)
  ```
- Line 159: Knowledge search now filters by role
  ```typescript
  hybridSearchKnowledge(message, 10, staffRole)
  ```
- Line 253: Training data search now filters by role
  ```typescript
  vectorSearchTrainingData(message, 3, staffRole)
  ```
- Line 320: Guidelines search now filters by role
  ```typescript
  vectorSearchGuidelines(message, 5, staffRole)
  ```

## How It Works

### Example Scenarios

**Coach Role** (`staffRole = 'coach'`):
- Searches knowledge base → Returns only entries where `ai_role = 'coach'` OR `ai_role IS NULL`
- Gets health/wellness guidelines, general product knowledge
- Excludes sales-specific pricing, customer service policies, scientific research details

**Sales Role** (`staffRole = 'sales'`):
- Gets product features, pricing, promotions, sales techniques
- Excludes technical research details, customer complaint procedures

**Customer Service Role** (`staffRole = 'customer-service'`):
- Gets refund policies, complaint handling, support procedures
- Excludes sales techniques, scientific research

**Scientist Role** (`staffRole = 'scientist'`):
- Gets technical details, research papers, ingredient analysis
- Excludes sales tactics, customer service procedures

### NULL Role (General Knowledge)
- Entries with `ai_role = NULL` are accessible to ALL roles
- Use for:
  - Company information
  - Basic product descriptions
  - General FAQs
  - Universal guidelines

## Benefits

1. **More Accurate**: Each role gets contextually relevant information
2. **Faster**: Smaller search space = faster vector searches
3. **Better Context**: AI doesn't get confused by irrelevant information
4. **Scalable**: Easy to add new roles or reassign content

## Next Steps

1. Run SQL migrations (see below)
2. Populate `ai_role` field for existing data
3. Test each role thoroughly
4. Add UI for assigning roles to knowledge entries

## Running Migrations

```bash
# Connect to Supabase and run:
psql postgresql://postgres:[YOUR_PASSWORD]@[YOUR_HOST]:5432/postgres

# Run migrations in order:
\i sql-migrations/013_add_ai_role_to_all_tables.sql
\i sql-migrations/014_update_vector_search_with_role.sql
```

## Testing

Test each role with a sample query:
- Coach: "What products help with dry skin?"
- Sales: "What's the price of the premium package?"
- Customer Service: "How do I process a refund?"
- Scientist: "What's the molecular structure of hyaluronic acid?"

Verify that each role only retrieves role-appropriate results.
