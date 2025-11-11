# Migration Plan: localStorage → Supabase Database

## Current State
- App uses **localStorage** for fast access
- App backs up to **JSON files** via `/api/data-sync`
- **Supabase database** has data but is **NOT being used** by the app

## Target State
- App reads/writes **directly** to **Supabase database**
- No more localStorage or JSON files for data storage
- Automatic table creation for new features
- Multi-tenant ready with business unit isolation

## Migration Strategy

### Phase 1: Create Supabase Storage Layer ✅ DONE
- Created `src/lib/supabase-storage.ts` with functions:
  - `loadKnowledge()`, `saveKnowledge()`, `deleteKnowledge()`
  - `loadFAQs()`, `saveFAQ()`, `deleteFAQ()`
  - `loadCannedMessages()`, `saveCannedMessage()`, `deleteCannedMessage()`
  - `loadFAQCategories()`, `loadCannedCategories()`, `saveCategory()`, `deleteCategory()`
  - Guidelines and Training Data (still using JSON for now)

### Phase 2: Replace AI Training Center Component
**File:** `src/components/admin/ai-training-center.tsx`

**Changes needed:**
1. Import new storage functions:
   ```typescript
   import {
     loadKnowledge, saveKnowledge, deleteKnowledge,
     loadFAQs, saveFAQ, deleteFAQ,
     loadCannedMessages, saveCannedMessage, deleteCannedMessage,
     loadFAQCategories, loadCannedCategories, saveCategory, deleteCategory
   } from '@/lib/supabase-storage'
   ```

2. Replace `loadData()` function:
   - Remove localStorage clearing
   - Remove `loadDataFromFile()` calls
   - Use Supabase storage functions instead

3. Remove all `useEffect` auto-save hooks:
   - Delete useEffect for knowledgeEntries
   - Delete useEffect for trainingData
   - Delete useEffect for faqs
   - Delete useEffect for cannedMsgs
   - Delete useEffect for guidelines
   - Delete useEffect for categories
   - Supabase auto-saves on each action instead

4. Update all CRUD operations:
   - Knowledge: `addKnowledgeEntry()`, `updateKnowledgeEntry()`, `deleteKnowledgeEntry()`
   - FAQs: `addFAQ()`, `deleteFaq()`
   - Canned Messages: Add/update/delete operations
   - Categories: Add/update/delete operations

### Phase 3: Update Other Components
- **roleplay-training.tsx**: Check if uses localStorage
- **ai-coach.tsx**: Check if uses localStorage
- **demo/page.tsx**: Check if uses localStorage
- **lead-management.tsx**: Check if uses localStorage

### Phase 4: Deprecate Old System
1. Keep `/api/data-sync` route for backward compatibility (guidelines, training data)
2. Mark `src/lib/storage.ts` as deprecated
3. Add comment: "// DEPRECATED: Use src/lib/supabase-storage.ts instead"

### Phase 5: Future Features Auto-Setup
When adding new features that need database storage:

1. Create table automatically using `exec_sql` RPC:
   ```javascript
   await supabase.rpc('exec_sql', {
     sql_query: `CREATE TABLE IF NOT EXISTS your_table (...)`
   })
   ```

2. Add CRUD functions to `supabase-storage.ts`
3. Use those functions in your components

## Benefits After Migration

✅ **No more localStorage limits** - Unlimited data storage
✅ **Multi-tenant ready** - Each business unit has isolated data
✅ **Real-time sync** - Changes reflect immediately across all users
✅ **Database queries** - Can filter, sort, search efficiently
✅ **Relationships** - FAQs linked to categories with foreign keys
✅ **Automatic schema** - Dynamic table creation for new features
✅ **Scalable** - Ready for thousands of FAQs, products, etc.

## Testing Checklist

After migration, test:
- [ ] Load knowledge base entries
- [ ] Add new knowledge entry
- [ ] Edit knowledge entry
- [ ] Delete knowledge entry
- [ ] Load FAQs
- [ ] Generate FAQs
- [ ] Edit FAQ
- [ ] Delete FAQ
- [ ] Load canned messages
- [ ] Generate canned messages
- [ ] Edit canned message
- [ ] Delete canned message
- [ ] Load categories
- [ ] Add category
- [ ] Delete category
- [ ] Switch business units (data isolation works)
- [ ] Refresh page (data persists)

## Rollback Plan

If migration fails:
1. Revert `ai-training-center.tsx` to use `loadDataFromFile()`
2. Data is still safe in both Supabase AND JSON files
3. No data loss - we have backups in 2 places
