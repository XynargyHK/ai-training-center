# CRUD Operations to Update

Due to the size of the ai-training-center.tsx file, here are the key CRUD operations that need to be updated:

## Knowledge Base Operations

### addKnowledgeEntry() - Line ~579
**BEFORE:**
```typescript
const addKnowledgeEntry = () => {
  const newEntry: KnowledgeEntry = {
    id: Date.now().toString(),
    category: categories[0],
    topic: '',
    content: '',
    keywords: [],
    confidence: 0.8,
    createdAt: new Date(),
    updatedAt: new Date()
  }
  const updated = [...knowledgeEntries, newEntry]
  setKnowledgeEntries(updated)
  saveByKey('ai_training_knowledge', updated)
  setEditingEntry(newEntry)
}
```

**AFTER:**
```typescript
const addKnowledgeEntry = async () => {
  const newEntry: KnowledgeEntry = {
    id: `kb-temp-${Date.now()}`, // Temporary ID
    category: categories[0],
    topic: '',
    content: '',
    keywords: [],
    confidence: 0.8,
    createdAt: new Date(),
    updatedAt: new Date()
  }
  // Add to local state immediately for UI responsiveness
  setKnowledgeEntries([...knowledgeEntries, newEntry])
  setEditingEntry(newEntry)

  // Save to Supabase will happen when user fills in and saves the entry
}
```

### updateKnowledgeEntry() - Find this function
**Pattern:** Look for where editingEntry is saved
**AFTER:**
```typescript
const saveEditedEntry = async () => {
  if (!editingEntry) return

  try {
    // Save to Supabase
    const saved = await saveKnowledge(editingEntry)

    // Update local state with saved data
    setKnowledgeEntries(knowledgeEntries.map(e =>
      e.id === editingEntry.id ? { ...editingEntry, id: saved.id } : e
    ))

    setEditingEntry(null)
    console.log('✅ Knowledge entry saved')
  } catch (error) {
    console.error('Error saving knowledge entry:', error)
    alert('Failed to save entry')
  }
}
```

### deleteKnowledgeEntry() - Find this function
**AFTER:**
```typescript
const deleteKnowledgeEntry = async (id: string) => {
  if (!confirm('Delete this entry?')) return

  try {
    await deleteKnowledge(id)
    setKnowledgeEntries(knowledgeEntries.filter(e => e.id !== id))
    console.log('✅ Knowledge entry deleted')
  } catch (error) {
    console.error('Error deleting knowledge entry:', error)
    alert('Failed to delete entry')
  }
}
```

## FAQ Operations

### deleteFaq()
**BEFORE:**
```typescript
const deleteFaq = (id: string) => {
  const updated = faqs.filter(f => f.id !== id)
  setFaqs(updated)
  saveDataWithSync(`${selectedBusinessUnit}_ai_training_faqs`, updated)
}
```

**AFTER:**
```typescript
const deleteFaq = async (id: string) => {
  if (!confirm('Delete this FAQ?')) return

  try {
    await deleteFAQ(id)
    setFaqs(faqs.filter(f => f.id !== id))
    console.log('✅ FAQ deleted')
  } catch (error) {
    console.error('Error deleting FAQ:', error)
    alert('Failed to delete FAQ')
  }
}
```

### saveFaqEdit() or updateFAQ()
**AFTER:**
```typescript
const saveFaqEdit = async (faq: FAQ) => {
  try {
    const saved = await saveFAQ(faq)
    setFaqs(faqs.map(f => f.id === faq.id ? { ...faq, id: saved.id } : f))
    setEditingEntry(null)
    console.log('✅ FAQ saved')
  } catch (error) {
    console.error('Error saving FAQ:', error)
    alert('Failed to save FAQ')
  }
}
```

## Canned Message Operations

### deleteCannedMessage()
**AFTER:**
```typescript
const deleteCannedMsg = async (id: string) => {
  if (!confirm('Delete this canned message?')) return

  try {
    await deleteCannedMessage(id)
    setCannedMsgs(cannedMsgs.filter(m => m.id !== id))
    console.log('✅ Canned message deleted')
  } catch (error) {
    console.error('Error deleting canned message:', error)
    alert('Failed to delete canned message')
  }
}
```

### saveCannedMessageEdit()
**AFTER:**
```typescript
const saveCannedMsgEdit = async (msg: CannedMessage) => {
  try {
    const saved = await saveCannedMessage(msg)
    setCannedMsgs(cannedMsgs.map(m => m.id === msg.id ? { ...msg, id: saved.id } : m))
    setEditingEntry(null)
    console.log('✅ Canned message saved')
  } catch (error) {
    console.error('Error saving canned message:', error)
    alert('Failed to save canned message')
  }
}
```

## Category Operations

### addCategory()
**AFTER:**
```typescript
const addFaqCategory = async () => {
  if (!newCategoryName.trim()) return

  try {
    await saveCategory(newCategoryName.trim(), 'faq')
    const updated = await loadFAQCategories()
    setFaqCategories(updated)
    setNewCategoryName('')
    setShowAddCategory(false)
    console.log('✅ Category added')
  } catch (error) {
    console.error('Error adding category:', error)
    alert('Failed to add category')
  }
}
```

### deleteCategory()
**AFTER:**
```typescript
const deleteFaqCategory = async (name: string) => {
  if (!confirm(`Delete category "${name}"?`)) return

  try {
    await deleteCategory(name)
    const updated = await loadFAQCategories()
    setFaqCategories(updated)
    console.log('✅ Category deleted')
  } catch (error) {
    console.error('Error deleting category:', error)
    alert('Failed to delete category')
  }
}
```

## Pattern for Generated Data (FAQs, Canned Messages)

When data is generated (like generating FAQs), instead of just adding to state, save to Supabase:

**BEFORE:**
```typescript
// After AI generates FAQs
const generatedFaqs = response.faqs
setFaqs([...faqs, ...generatedFaqs])
```

**AFTER:**
```typescript
// After AI generates FAQs
const generatedFaqs = response.faqs

// Save each FAQ to Supabase
for (const faq of generatedFaqs) {
  try {
    const saved = await saveFAQ(faq)
    setFaqs(prev => [...prev, saved])
  } catch (error) {
    console.error('Error saving generated FAQ:', error)
  }
}
```

## Key Principles

1. **Always use try/catch** for Supabase operations
2. **Update UI optimistically** - update state immediately, then save to Supabase
3. **Handle errors gracefully** - show alerts to user if save fails
4. **Replace temp IDs** - When creating new items, replace temporary IDs with Supabase-generated UUIDs
5. **Remove saveByKey/saveDataWithSync calls** - No longer needed

## Files to Update

1. `src/components/admin/ai-training-center.tsx` - Main component (THIS FILE)
2. Check if these use localStorage:
   - `src/components/admin/roleplay-training.tsx`
   - `src/components/ui/ai-coach.tsx`
   - `src/app/demo/page.tsx`
