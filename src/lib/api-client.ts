// Client-side API wrapper for making secure API calls
// All database operations go through Next.js API routes which use the service role key

// Helper function to safely parse JSON responses
async function safeParseJSON(res: Response, url: string) {
  const text = await res.text()
  try {
    return JSON.parse(text)
  } catch {
    // If response starts with <!DOCTYPE or <html, it's an HTML error page
    if (text.trim().startsWith('<!') || text.trim().startsWith('<html')) {
      console.error(`API ${url} returned HTML instead of JSON (status: ${res.status})`)
      throw new Error(`API error: ${res.status} ${res.statusText}`)
    }
    throw new Error(`Invalid JSON response from ${url}: ${text.substring(0, 100)}`)
  }
}

// ============================================
// BOOKING/APPOINTMENT SERVICES API
// ============================================

export async function loadServices(businessUnitId?: string) {
  const url = businessUnitId
    ? `/api/booking/services?businessUnitId=${encodeURIComponent(businessUnitId)}`
    : '/api/booking/services'
  const res = await fetch(url)
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Failed to load services')
  return json.data
}

export async function saveService(service: any, businessUnitId?: string) {
  const res = await fetch('/api/booking/services', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...service, businessUnitId })
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Failed to save service')
  return json.data
}

export async function deleteService(id: string) {
  const res = await fetch(`/api/booking/services?id=${id}`, {
    method: 'DELETE'
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Failed to delete service')
}

export async function loadStaff(businessUnitId?: string) {
  const url = businessUnitId
    ? `/api/booking/staff?businessUnitId=${encodeURIComponent(businessUnitId)}`
    : '/api/booking/staff'
  const res = await fetch(url)
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Failed to load staff')
  return json.data
}

export async function saveStaff(staff: any, businessUnitId?: string) {
  const res = await fetch('/api/booking/staff', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...staff, businessUnitId })
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Failed to save staff')
  return json.data
}

export async function deleteStaff(id: string) {
  const res = await fetch(`/api/booking/staff?id=${id}`, {
    method: 'DELETE'
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Failed to delete staff')
}

export async function loadAssignments(businessUnitId?: string) {
  const url = businessUnitId
    ? `/api/booking/assignments?businessUnitId=${encodeURIComponent(businessUnitId)}`
    : '/api/booking/assignments'
  const res = await fetch(url)
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Failed to load assignments')
  return json.data
}

export async function saveAssignment(assignment: any, businessUnitId?: string) {
  const res = await fetch('/api/booking/assignments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...assignment, businessUnitId })
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Failed to save assignment')
  return json.data
}

export async function deleteAssignment(id: string) {
  const res = await fetch(`/api/booking/assignments?id=${id}`, {
    method: 'DELETE'
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Failed to delete assignment')
}

export async function loadOutlets(businessUnitId?: string) {
  const url = businessUnitId
    ? `/api/booking/outlets?businessUnitId=${encodeURIComponent(businessUnitId)}`
    : '/api/booking/outlets'
  const res = await fetch(url)
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Failed to load outlets')
  return json.data
}

export async function saveOutlet(outlet: any, businessUnitId?: string) {
  const res = await fetch('/api/booking/outlets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...outlet, businessUnitId })
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Failed to save outlet')
  return json.data
}

export async function deleteOutlet(id: string) {
  const res = await fetch(`/api/booking/outlets?id=${id}`, {
    method: 'DELETE'
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Failed to delete outlet')
}

export async function loadRooms(businessUnitId?: string, outletId?: string) {
  let url = '/api/booking/rooms'
  const params = new URLSearchParams()
  if (businessUnitId) params.append('businessUnitId', businessUnitId)
  if (outletId) params.append('outletId', outletId)
  if (params.toString()) url += `?${params.toString()}`

  const res = await fetch(url)
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Failed to load rooms')
  return json.data
}

export async function saveRoom(room: any, businessUnitId?: string) {
  const res = await fetch('/api/booking/rooms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...room, businessUnitId })
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Failed to save room')
  return json.data
}

export async function deleteRoom(id: string) {
  const res = await fetch(`/api/booking/rooms?id=${id}`, {
    method: 'DELETE'
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Failed to delete room')
}

// ============================================
// ROOM-SERVICE ASSIGNMENTS API
// ============================================

export async function loadRoomServices(roomId?: string) {
  const url = roomId
    ? `/api/booking/room-services?roomId=${encodeURIComponent(roomId)}`
    : '/api/booking/room-services'
  const res = await fetch(url)
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Failed to load room services')
  return json.data
}

export async function saveRoomServices(roomId: string, serviceIds: string[]) {
  const res = await fetch('/api/booking/room-services', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roomId, serviceIds })
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Failed to save room services')
  return json.data
}

export async function deleteRoomService(id: string) {
  const res = await fetch(`/api/booking/room-services?id=${id}`, {
    method: 'DELETE'
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Failed to delete room service')
}

// ============================================
// TRAINING API
// ============================================

export async function loadAIStaff(businessUnitId?: string) {
  const url = businessUnitId
    ? `/api/training?action=load_ai_staff&businessUnitId=${encodeURIComponent(businessUnitId)}`
    : '/api/training?action=load_ai_staff'
  const res = await fetch(url)
  const json = await safeParseJSON(res, url)
  if (!res.ok) throw new Error(json.error || 'Failed to load AI staff')
  return json.data
}

export async function saveAIStaff(staff: any, businessUnitId?: string) {
  const res = await fetch('/api/training', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'save_ai_staff', data: staff, businessUnitId })
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

export async function loadTrainingScenarios(businessUnitId?: string) {
  const url = businessUnitId
    ? `/api/training?action=load_scenarios&businessUnitId=${encodeURIComponent(businessUnitId)}`
    : '/api/training?action=load_scenarios'
  const res = await fetch(url)
  const json = await safeParseJSON(res, url)
  if (!res.ok) throw new Error(json.error || 'Failed to load scenarios')
  return json.data
}

export async function saveTrainingScenario(scenario: any, businessUnitId?: string) {
  const res = await fetch('/api/training', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'save_scenario', data: scenario, businessUnitId })
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

export async function loadTrainingSessions(businessUnitId?: string) {
  try {
    const url = businessUnitId
      ? `/api/training?action=load_sessions&businessUnitId=${encodeURIComponent(businessUnitId)}`
      : '/api/training?action=load_sessions'
    const res = await fetch(url)
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || 'Failed to load sessions')
    return json.data
  } catch (error) {
    // API endpoint doesn't exist yet, return empty array
    console.warn('Training sessions API not available:', error)
    return []
  }
}

export async function saveTrainingSession(session: any, businessUnitId?: string) {
  try {
    const res = await fetch('/api/training', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'save_session', data: session, businessUnitId })
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || 'Failed to save session')
  } catch (error) {
    console.warn('Training sessions API not available:', error)
  }
}

export async function deleteTrainingSession(id: string) {
  try {
    const res = await fetch(`/api/training?action=delete_session&id=${id}`, {
      method: 'DELETE'
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || 'Failed to delete session')
  } catch (error) {
    console.warn('Training sessions API not available:', error)
  }
}

// ============================================
// KNOWLEDGE API
// ============================================

export async function loadKnowledge(businessUnitId?: string, country?: string, language?: string) {
  let url = `/api/knowledge?action=load_knowledge`
  if (businessUnitId) url += `&businessUnitId=${encodeURIComponent(businessUnitId)}`
  if (country) url += `&country=${encodeURIComponent(country)}`
  if (language) url += `&language=${encodeURIComponent(language)}`
  const res = await fetch(url)
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Failed to load knowledge')
  return json.data
}

export async function saveKnowledge(entry: any, businessUnitId?: string) {
  const res = await fetch('/api/knowledge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'save_knowledge', data: entry, businessUnitId })
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

export async function loadFAQs(businessUnitId?: string, language?: string, country?: string) {
  let url = `/api/knowledge?action=load_faqs`
  if (businessUnitId) url += `&businessUnitId=${encodeURIComponent(businessUnitId)}`
  if (language) url += `&language=${encodeURIComponent(language)}`
  if (country) url += `&country=${encodeURIComponent(country)}`
  const res = await fetch(url)
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Failed to load FAQs')
  return json.data
}

export async function saveFAQ(faq: any, businessUnitId?: string) {
  const res = await fetch('/api/knowledge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'save_faq', data: faq, businessUnitId })
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

export async function loadCannedMessages(businessUnitId?: string, language?: string) {
  let url = `/api/knowledge?action=load_canned_messages`
  if (businessUnitId) url += `&businessUnitId=${encodeURIComponent(businessUnitId)}`
  if (language) url += `&language=${encodeURIComponent(language)}`
  const res = await fetch(url)
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Failed to load canned messages')
  return json.data
}

export async function saveCannedMessage(message: any, businessUnitId?: string) {
  const res = await fetch('/api/knowledge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'save_canned_message', data: message, businessUnitId })
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

export async function loadFAQCategories(businessUnitId?: string) {
  const url = businessUnitId
    ? `/api/knowledge?action=load_faq_categories&businessUnitId=${encodeURIComponent(businessUnitId)}`
    : '/api/knowledge?action=load_faq_categories'
  const res = await fetch(url)
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Failed to load FAQ categories')
  return json.data
}

export async function loadCannedCategories(businessUnitId?: string) {
  const url = businessUnitId
    ? `/api/knowledge?action=load_canned_categories&businessUnitId=${encodeURIComponent(businessUnitId)}`
    : '/api/knowledge?action=load_canned_categories'
  const res = await fetch(url)
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Failed to load canned categories')
  return json.data
}

export async function saveCategory(name: string, type: 'faq' | 'canned', businessUnitId?: string) {
  const res = await fetch('/api/knowledge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'save_category', data: { name, type }, businessUnitId })
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

export async function loadGuidelines(businessUnitId?: string, language?: string) {
  let url = `/api/knowledge?action=load_guidelines`
  if (businessUnitId) url += `&businessUnitId=${encodeURIComponent(businessUnitId)}`
  if (language) url += `&language=${encodeURIComponent(language)}`
  const res = await fetch(url)
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Failed to load guidelines')
  return json.data
}

export async function saveGuideline(guideline: any, businessUnitId?: string) {
  const res = await fetch('/api/knowledge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'save_guideline', data: guideline, businessUnitId })
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Failed to save guideline')
}

export async function saveGuidelines(guidelines: any[], businessUnitId?: string) {
  // Save guidelines one by one (or implement batch endpoint)
  for (const guideline of guidelines) {
    await saveGuideline(guideline, businessUnitId)
  }
}

export async function deleteGuideline(id: string) {
  const res = await fetch(`/api/knowledge?action=delete_guideline&id=${id}`, {
    method: 'DELETE'
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Failed to delete guideline')
}

export async function copyDefaultGuidelines(businessUnitId: string) {
  const res = await fetch('/api/knowledge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'copy_default_guidelines', businessUnitId })
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Failed to copy default guidelines')
}

export async function loadTrainingData(businessUnitId?: string) {
  const url = businessUnitId
    ? `/api/knowledge?action=load_training_data&businessUnitId=${encodeURIComponent(businessUnitId)}`
    : '/api/knowledge?action=load_training_data'
  const res = await fetch(url)
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Failed to load training data')
  return json.data
}

export async function saveTrainingData(trainingData: any[], businessUnitId?: string) {
  const res = await fetch('/api/knowledge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'save_training_data', data: trainingData, businessUnitId })
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
