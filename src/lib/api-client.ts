// Client-side API wrapper for making secure API calls
// All database operations go through Next.js API routes which use the service role key

// ============================================
// TRAINING API
// ============================================

export async function loadAIStaff() {
  const res = await fetch('/api/training?action=load_ai_staff')
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Failed to load AI staff')
  return json.data
}

export async function saveAIStaff(staff: any) {
  const res = await fetch('/api/training', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'save_ai_staff', data: staff })
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Failed to save AI staff')
}

export async function deleteAIStaff(id: string) {
  const res = await fetch(`/api/training?action=delete_ai_staff&id=${id}`, {
    method: 'DELETE'
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Failed to delete AI staff')
}

export async function loadTrainingScenarios() {
  const res = await fetch('/api/training?action=load_scenarios')
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Failed to load scenarios')
  return json.data
}

export async function saveTrainingScenario(scenario: any) {
  const res = await fetch('/api/training', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'save_scenario', data: scenario })
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Failed to save scenario')
  return json.data
}

export async function deleteTrainingScenario(id: string) {
  const res = await fetch(`/api/training?action=delete_scenario&id=${id}`, {
    method: 'DELETE'
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Failed to delete scenario')
}

export async function loadTrainingSessions() {
  const res = await fetch('/api/training?action=load_sessions')
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Failed to load sessions')
  return json.data
}

export async function saveTrainingSession(session: any) {
  const res = await fetch('/api/training', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'save_session', data: session })
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Failed to save session')
}

export async function deleteTrainingSession(id: string) {
  const res = await fetch(`/api/training?action=delete_session&id=${id}`, {
    method: 'DELETE'
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Failed to delete session')
}

// ============================================
// KNOWLEDGE API
// ============================================

export async function loadKnowledge() {
  const res = await fetch('/api/knowledge?action=load_knowledge')
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Failed to load knowledge')
  return json.data
}

export async function saveKnowledge(entry: any) {
  const res = await fetch('/api/knowledge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'save_knowledge', data: entry })
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Failed to save knowledge')
}

export async function deleteKnowledge(id: string) {
  const res = await fetch(`/api/knowledge?action=delete_knowledge&id=${id}`, {
    method: 'DELETE'
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Failed to delete knowledge')
}

export async function loadFAQs() {
  const res = await fetch('/api/knowledge?action=load_faqs')
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Failed to load FAQs')
  return json.data
}

export async function saveFAQ(faq: any) {
  const res = await fetch('/api/knowledge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'save_faq', data: faq })
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Failed to save FAQ')
}

export async function deleteFAQ(id: string) {
  const res = await fetch(`/api/knowledge?action=delete_faq&id=${id}`, {
    method: 'DELETE'
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Failed to delete FAQ')
}

export async function loadCannedMessages() {
  const res = await fetch('/api/knowledge?action=load_canned_messages')
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Failed to load canned messages')
  return json.data
}

export async function saveCannedMessage(message: any) {
  const res = await fetch('/api/knowledge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'save_canned_message', data: message })
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Failed to save canned message')
}

export async function deleteCannedMessage(id: string) {
  const res = await fetch(`/api/knowledge?action=delete_canned_message&id=${id}`, {
    method: 'DELETE'
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Failed to delete canned message')
}

export async function loadFAQCategories() {
  const res = await fetch('/api/knowledge?action=load_faq_categories')
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Failed to load FAQ categories')
  return json.data
}

export async function loadCannedCategories() {
  const res = await fetch('/api/knowledge?action=load_canned_categories')
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Failed to load canned categories')
  return json.data
}

export async function saveCategory(name: string, type: 'faq' | 'canned') {
  const res = await fetch('/api/knowledge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'save_category', data: { name, type } })
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Failed to save category')
}

export async function deleteCategory(name: string) {
  const res = await fetch(`/api/knowledge?action=delete_category&name=${encodeURIComponent(name)}`, {
    method: 'DELETE'
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Failed to delete category')
}

export async function loadGuidelines() {
  const res = await fetch('/api/knowledge?action=load_guidelines')
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Failed to load guidelines')
  return json.data
}

export async function saveGuideline(guideline: any) {
  const res = await fetch('/api/knowledge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'save_guideline', data: guideline })
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Failed to save guideline')
}

export async function saveGuidelines(guidelines: any[]) {
  // Save guidelines one by one (or implement batch endpoint)
  for (const guideline of guidelines) {
    await saveGuideline(guideline)
  }
}

export async function deleteGuideline(id: string) {
  const res = await fetch(`/api/knowledge?action=delete_guideline&id=${id}`, {
    method: 'DELETE'
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Failed to delete guideline')
}

export async function loadTrainingData() {
  const res = await fetch('/api/knowledge?action=load_training_data')
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Failed to load training data')
  return json.data
}

export async function saveTrainingData(trainingData: any[]) {
  const res = await fetch('/api/knowledge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'save_training_data', data: trainingData })
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Failed to save training data')
}

export async function loadBusinessUnits() {
  const res = await fetch('/api/knowledge?action=load_business_units')
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Failed to load business units')
  return json.data
}

export async function saveBusinessUnit(unit: any) {
  const res = await fetch('/api/knowledge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'save_business_unit', data: unit })
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Failed to save business unit')
}

export async function deleteBusinessUnit(id: string) {
  const res = await fetch(`/api/knowledge?action=delete_business_unit&id=${id}`, {
    method: 'DELETE'
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Failed to delete business unit')
}
