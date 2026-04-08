'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase'

// --- Types ---

type ContentItem = {
  id: string
  content_type: string
  title: string
  hook: string | null
  body: string | null
  cta: string | null
  target_platform: string | null
  target_audience: string | null
  hook_formula: string | null
  topic: string | null
  status: string
  production_level: number | null
  video_tool: string | null
  language: string | null
  scheduled_at: string | null
  published_at: string | null
  parent_content_id: string | null
  views: number | null
  likes: number | null
  shares: number | null
  saves: number | null
  comments: number | null
  ctr: number | null
  completion_rate: number | null
  created_at: string
  updated_at: string | null
}

// --- Constants ---

const CONTENT_TYPES = [
  'video_short', 'video_long', 'video_live', 'video_course',
  'text_post', 'text_article', 'text_thread',
  'email', 'visual', 'audio', 'course', 'challenge', 'other',
] as const

const CONTENT_TYPE_LABELS: Record<string, string> = {
  video_short: 'Short Video', video_long: 'Long Video', video_live: 'Live Video',
  video_course: 'Video Course', text_post: 'Text Post', text_article: 'Article',
  text_thread: 'Thread', email: 'Email', visual: 'Visual', audio: 'Audio',
  course: 'Course', challenge: 'Challenge', other: 'Other',
}

const TYPE_FILTER_GROUPS = [
  { label: 'All', match: '' },
  { label: 'Video', match: 'video' },
  { label: 'Text', match: 'text' },
  { label: 'Email', match: 'email' },
  { label: 'Visual', match: 'visual' },
  { label: 'Audio', match: 'audio' },
  { label: 'Course', match: 'course' },
  { label: 'Challenge', match: 'challenge' },
]

const STATUSES = ['idea', 'draft', 'review', 'approved', 'rendering', 'ready', 'scheduled', 'published', 'archived'] as const

const STATUS_COLORS: Record<string, string> = {
  idea: '#666', draft: '#f59e0b', review: '#8b5cf6', approved: '#3b82f6',
  rendering: '#ec4899', ready: '#06b6d4', scheduled: '#f97316',
  published: '#4ade80', archived: '#444',
}

const PLATFORMS = ['tiktok', 'youtube', 'linkedin', 'instagram', 'twitter', 'facebook', 'email', 'whatsapp'] as const

const HOOK_FORMULAS = [
  'contrarian', 'curiosity_gap', 'specificity', 'you_attack', 'authority_stack',
  'list_promise', 'story_open', 'dont_hook', 'comparison', 'pattern_interrupt',
  'social_proof', 'if_then',
] as const

const VIDEO_TOOLS = ['heygen', 'veo', 'capcut', 'runway'] as const

const TYPE_ICONS: Record<string, string> = {
  video_short: '🎬', video_long: '🎥', video_live: '📡', video_course: '🎓',
  text_post: '📝', text_article: '📄', text_thread: '🧵',
  email: '✉️', visual: '🖼️', audio: '🎙️', course: '📚', challenge: '🏆', other: '📎',
}

// --- Styles ---

const inputStyle = {
  width: '100%', padding: '10px', background: '#0a0a0f',
  border: '1px solid #2a2a3a', borderRadius: '8px',
  color: '#fff', fontSize: '14px', outline: 'none',
  boxSizing: 'border-box' as const, marginBottom: '10px',
  fontFamily: 'inherit',
}

const labelStyle = { fontSize: '12px', color: '#888', display: 'block' as const, marginBottom: '2px' }

const btnPrimary = {
  padding: '8px 16px', background: '#2563eb', border: 'none', borderRadius: '8px',
  color: '#fff', fontSize: '14px', fontWeight: 600 as const, cursor: 'pointer',
}

const btnSecondary = {
  padding: '8px 16px', background: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: '8px',
  color: '#ccc', fontSize: '14px', fontWeight: 600 as const, cursor: 'pointer',
}

const cardStyle = {
  background: '#12121c', border: '1px solid #1e1e2e', borderRadius: '12px', padding: '16px',
}

// --- Helper ---

function statusBadge(status: string) {
  const color = STATUS_COLORS[status] || '#888'
  return {
    fontSize: '10px', padding: '2px 8px', borderRadius: '4px',
    background: color + '22', color, fontWeight: 600 as const, textTransform: 'uppercase' as const,
    display: 'inline-block',
  }
}

function platformBadge() {
  return {
    fontSize: '10px', padding: '2px 6px', borderRadius: '4px',
    background: '#2563eb22', color: '#60a5fa', fontWeight: 600 as const,
    textTransform: 'uppercase' as const, display: 'inline-block',
  }
}

function isVideoType(t: string) {
  return t.startsWith('video')
}

const STATUS_FILTER_OPTIONS = ['All', ...STATUSES] as const

// Next status transitions
const NEXT_STATUS: Record<string, { label: string; next: string }> = {
  idea: { label: 'Move to Draft', next: 'draft' },
  draft: { label: 'Move to Review', next: 'review' },
  review: { label: 'Approve', next: 'approved' },
  approved: { label: 'Mark Ready', next: 'ready' },
  ready: { label: 'Schedule', next: 'scheduled' },
  scheduled: { label: 'Publish', next: 'published' },
}

// --- Component ---

export default function ContentLibraryPage() {
  const [items, setItems] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [showCreate, setShowCreate] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [showRepurpose, setShowRepurpose] = useState(false)
  const [repurposePlatforms, setRepurposePlatforms] = useState<string[]>([])

  // Create form state
  const [form, setForm] = useState({
    content_type: 'text_post' as string,
    title: '',
    topic: '',
    target_platform: 'tiktok' as string,
    target_audience: '',
    hook_formula: '' as string,
    hook: '',
    body: '',
    cta: '',
    production_level: 3,
    video_tool: 'heygen' as string,
    language: 'en',
    scheduled_at: '',
  })

  const resetForm = () => {
    setForm({
      content_type: 'text_post', title: '', topic: '', target_platform: 'tiktok',
      target_audience: '', hook_formula: '', hook: '', body: '', cta: '',
      production_level: 3, video_tool: 'heygen', language: 'en', scheduled_at: '',
    })
  }

  // --- Data ops ---

  const loadItems = useCallback(async () => {
    let q = supabase.from('content_library').select('*').order('created_at', { ascending: false }).limit(200)
    const { data } = await q
    setItems(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { loadItems() }, [loadItems])

  const filtered = useMemo(() => {
    let list = items
    if (typeFilter) list = list.filter(i => i.content_type.includes(typeFilter))
    if (statusFilter !== 'All') list = list.filter(i => i.status === statusFilter)
    return list
  }, [items, typeFilter, statusFilter])

  const saveContent = async (status: string) => {
    if (!form.title) return
    setSaving(true)
    const payload: Record<string, unknown> = {
      content_type: form.content_type,
      title: form.title,
      topic: form.topic || null,
      target_platform: form.target_platform,
      target_audience: form.target_audience || null,
      hook_formula: form.hook_formula || null,
      hook: form.hook || null,
      body: form.body || null,
      cta: form.cta || null,
      language: form.language || 'en',
      status,
      scheduled_at: form.scheduled_at || null,
    }
    if (isVideoType(form.content_type)) {
      payload.production_level = form.production_level
      payload.video_tool = form.video_tool
    }
    await supabase.from('content_library').insert(payload)
    setSaving(false)
    setShowCreate(false)
    resetForm()
    loadItems()
  }

  const updateStatus = async (id: string, newStatus: string) => {
    const updates: Record<string, unknown> = { status: newStatus }
    if (newStatus === 'published') updates.published_at = new Date().toISOString()
    await supabase.from('content_library').update(updates).eq('id', id)
    loadItems()
  }

  const repurpose = async (sourceItem: ContentItem) => {
    if (repurposePlatforms.length === 0) return
    setSaving(true)
    const inserts = repurposePlatforms.map(plat => ({
      content_type: sourceItem.content_type,
      title: `[${plat.toUpperCase()}] ${sourceItem.title}`,
      hook: sourceItem.hook,
      body: sourceItem.body,
      cta: sourceItem.cta,
      target_platform: plat,
      target_audience: sourceItem.target_audience,
      hook_formula: sourceItem.hook_formula,
      topic: sourceItem.topic,
      language: sourceItem.language,
      status: 'draft',
      parent_content_id: sourceItem.id,
    }))
    await supabase.from('content_library').insert(inserts)
    setSaving(false)
    setShowRepurpose(false)
    setRepurposePlatforms([])
    loadItems()
  }

  const selected = selectedId ? items.find(i => i.id === selectedId) || null : null
  const children = selected ? items.filter(i => i.parent_content_id === selected.id) : []
  const parent = selected?.parent_content_id ? items.find(i => i.id === selected.parent_content_id) || null : null

  // --- Stats ---

  const totalCount = items.length
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    items.forEach(i => { counts[i.status] = (counts[i.status] || 0) + 1 })
    return counts
  }, [items])
  const thisWeekPublished = useMemo(() => {
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    return items.filter(i => i.status === 'published' && i.published_at && new Date(i.published_at) >= weekAgo).length
  }, [items])

  // ---- Render ----

  return (
    <div style={{
      minHeight: '100dvh', background: '#0a0a0f', color: '#fff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      maxWidth: '960px', margin: '0 auto', padding: '20px',
    }}>

      {/* ===== Stats Bar ===== */}
      <div style={{
        ...cardStyle, marginBottom: '16px', display: 'flex', gap: '24px',
        alignItems: 'center', flexWrap: 'wrap', padding: '12px 16px',
      }}>
        <div>
          <div style={{ fontSize: '20px', fontWeight: 700 }}>{totalCount}</div>
          <div style={{ fontSize: '11px', color: '#666' }}>Total</div>
        </div>
        <div style={{ width: '1px', height: '28px', background: '#1e1e2e' }} />
        {STATUSES.map(s => statusCounts[s] ? (
          <div key={s} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '16px', fontWeight: 600, color: STATUS_COLORS[s] }}>{statusCounts[s]}</div>
            <div style={{ fontSize: '10px', color: '#555', textTransform: 'capitalize' }}>{s}</div>
          </div>
        ) : null)}
        <div style={{ width: '1px', height: '28px', background: '#1e1e2e' }} />
        <div>
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#4ade80' }}>{thisWeekPublished}</div>
          <div style={{ fontSize: '10px', color: '#555' }}>This week</div>
        </div>
      </div>

      {/* ===== Header ===== */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>Content Library</h1>
          <p style={{ color: '#666', fontSize: '12px', margin: '2px 0 0' }}>Create, manage, and track all content</p>
        </div>
        <button onClick={() => { setShowCreate(!showCreate); setSelectedId(null) }} style={btnPrimary}>
          + Create
        </button>
      </div>

      {/* ===== Filters ===== */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
        {TYPE_FILTER_GROUPS.map(g => (
          <button key={g.label} onClick={() => setTypeFilter(g.match)}
            style={{
              padding: '4px 12px', borderRadius: '20px', border: 'none', fontSize: '12px',
              fontWeight: 600, cursor: 'pointer',
              background: typeFilter === g.match ? '#2563eb' : '#1a1a24',
              color: typeFilter === g.match ? '#fff' : '#888',
            }}>
            {g.label}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {STATUS_FILTER_OPTIONS.map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            style={{
              padding: '4px 10px', borderRadius: '20px', border: 'none', fontSize: '11px',
              fontWeight: 600, cursor: 'pointer',
              background: statusFilter === s ? (STATUS_COLORS[s] || '#2563eb') + '33' : '#1a1a24',
              color: statusFilter === s ? (STATUS_COLORS[s] || '#fff') : '#666',
            }}>
            {s === 'All' ? 'All Status' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* ===== Create Form ===== */}
      {showCreate && (
        <div style={{ ...cardStyle, marginBottom: '16px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#888', marginBottom: '12px', marginTop: 0 }}>CREATE CONTENT</h3>

          <label style={labelStyle}>Content Type</label>
          <select value={form.content_type} onChange={e => setForm({ ...form, content_type: e.target.value })} style={inputStyle}>
            {CONTENT_TYPES.map(t => <option key={t} value={t}>{CONTENT_TYPE_LABELS[t] || t}</option>)}
          </select>

          <label style={labelStyle}>Title *</label>
          <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Content title" style={inputStyle} />

          <label style={labelStyle}>Topic / Subject</label>
          <input value={form.topic} onChange={e => setForm({ ...form, topic: e.target.value })} placeholder="What is this about?" style={inputStyle} />

          <label style={labelStyle}>Target Platform</label>
          <select value={form.target_platform} onChange={e => setForm({ ...form, target_platform: e.target.value })} style={inputStyle}>
            {PLATFORMS.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
          </select>

          <label style={labelStyle}>Target Audience</label>
          <input value={form.target_audience} onChange={e => setForm({ ...form, target_audience: e.target.value })} placeholder="Who is this for?" style={inputStyle} />

          <label style={labelStyle}>Hook Formula</label>
          <select value={form.hook_formula} onChange={e => setForm({ ...form, hook_formula: e.target.value })} style={inputStyle}>
            <option value="">None</option>
            {HOOK_FORMULAS.map(h => <option key={h} value={h}>{h.replace(/_/g, ' ')}</option>)}
          </select>

          <label style={labelStyle}>Hook</label>
          <textarea value={form.hook} onChange={e => setForm({ ...form, hook: e.target.value })} placeholder="Opening hook..." rows={2} style={{ ...inputStyle, resize: 'vertical' }} />

          <label style={labelStyle}>Body / Script</label>
          <textarea value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} placeholder="Main content..." rows={5} style={{ ...inputStyle, resize: 'vertical' }} />

          <label style={labelStyle}>CTA</label>
          <textarea value={form.cta} onChange={e => setForm({ ...form, cta: e.target.value })} placeholder="Call to action..." rows={2} style={{ ...inputStyle, resize: 'vertical' }} />

          {isVideoType(form.content_type) && (
            <>
              <label style={labelStyle}>Production Level (1-5)</label>
              <select value={form.production_level} onChange={e => setForm({ ...form, production_level: Number(e.target.value) })} style={inputStyle}>
                {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>L{n}</option>)}
              </select>

              <label style={labelStyle}>Video Tool</label>
              <select value={form.video_tool} onChange={e => setForm({ ...form, video_tool: e.target.value })} style={inputStyle}>
                {VIDEO_TOOLS.map(v => <option key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</option>)}
              </select>
            </>
          )}

          <label style={labelStyle}>Language</label>
          <input value={form.language} onChange={e => setForm({ ...form, language: e.target.value })} placeholder="en" style={inputStyle} />

          <label style={labelStyle}>Schedule (optional)</label>
          <input type="datetime-local" value={form.scheduled_at} onChange={e => setForm({ ...form, scheduled_at: e.target.value })} style={inputStyle} />

          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
            <button onClick={() => saveContent('draft')} disabled={saving || !form.title} style={{ ...btnPrimary, opacity: saving || !form.title ? 0.5 : 1 }}>
              {saving ? 'Saving...' : 'Save as Draft'}
            </button>
            <button onClick={() => saveContent('idea')} disabled={saving || !form.title} style={{ ...btnSecondary, opacity: saving || !form.title ? 0.5 : 1 }}>
              Save as Idea
            </button>
            <button onClick={() => { setShowCreate(false); resetForm() }} style={btnSecondary}>Cancel</button>
          </div>
        </div>
      )}

      {/* ===== Detail View ===== */}
      {selected && !showCreate && (
        <div style={{ ...cardStyle, marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span style={{ fontSize: '20px' }}>{TYPE_ICONS[selected.content_type] || '📎'}</span>
                <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>{selected.title}</h2>
              </div>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={statusBadge(selected.status)}>{selected.status}</span>
                {selected.target_platform && <span style={platformBadge()}>{selected.target_platform}</span>}
                {isVideoType(selected.content_type) && selected.production_level && (
                  <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: '#8b5cf622', color: '#a78bfa', fontWeight: 600 }}>
                    L{selected.production_level}
                  </span>
                )}
                <span style={{ fontSize: '11px', color: '#555' }}>{CONTENT_TYPE_LABELS[selected.content_type] || selected.content_type}</span>
              </div>
            </div>
            <button onClick={() => setSelectedId(null)} style={{ ...btnSecondary, padding: '4px 10px', fontSize: '12px' }}>Close</button>
          </div>

          {/* Content sections */}
          {selected.hook && (
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', color: '#888', marginBottom: '2px' }}>HOOK {selected.hook_formula ? `(${selected.hook_formula.replace(/_/g, ' ')})` : ''}</div>
              <div style={{ fontSize: '14px', color: '#ddd', whiteSpace: 'pre-wrap', background: '#0a0a0f', borderRadius: '8px', padding: '10px', border: '1px solid #1e1e2e' }}>
                {selected.hook}
              </div>
            </div>
          )}
          {selected.body && (
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', color: '#888', marginBottom: '2px' }}>BODY</div>
              <div style={{ fontSize: '14px', color: '#ddd', whiteSpace: 'pre-wrap', background: '#0a0a0f', borderRadius: '8px', padding: '10px', border: '1px solid #1e1e2e', maxHeight: '300px', overflowY: 'auto' }}>
                {selected.body}
              </div>
            </div>
          )}
          {selected.cta && (
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', color: '#888', marginBottom: '2px' }}>CTA</div>
              <div style={{ fontSize: '14px', color: '#ddd', whiteSpace: 'pre-wrap', background: '#0a0a0f', borderRadius: '8px', padding: '10px', border: '1px solid #1e1e2e' }}>
                {selected.cta}
              </div>
            </div>
          )}

          {/* Status workflow */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
            {NEXT_STATUS[selected.status] && (
              <button onClick={() => updateStatus(selected.id, NEXT_STATUS[selected.status].next)}
                style={btnPrimary}>
                {NEXT_STATUS[selected.status].label}
              </button>
            )}
            <button onClick={() => { setShowRepurpose(!showRepurpose); setRepurposePlatforms([]) }}
              style={btnSecondary}>
              Repurpose to...
            </button>
          </div>

          {/* Repurpose panel */}
          {showRepurpose && (
            <div style={{ background: '#0a0a0f', border: '1px solid #1e1e2e', borderRadius: '8px', padding: '12px', marginBottom: '12px' }}>
              <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>Select platforms to repurpose to:</div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                {PLATFORMS.filter(p => p !== selected.target_platform).map(p => (
                  <label key={p} style={{
                    padding: '4px 10px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer',
                    background: repurposePlatforms.includes(p) ? '#2563eb33' : '#1a1a24',
                    color: repurposePlatforms.includes(p) ? '#60a5fa' : '#666',
                    border: repurposePlatforms.includes(p) ? '1px solid #2563eb' : '1px solid #2a2a3a',
                    display: 'flex', alignItems: 'center', gap: '4px',
                  }}>
                    <input type="checkbox" checked={repurposePlatforms.includes(p)}
                      onChange={e => {
                        if (e.target.checked) setRepurposePlatforms([...repurposePlatforms, p])
                        else setRepurposePlatforms(repurposePlatforms.filter(x => x !== p))
                      }}
                      style={{ display: 'none' }} />
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </label>
                ))}
              </div>
              <button onClick={() => repurpose(selected)} disabled={saving || repurposePlatforms.length === 0}
                style={{ ...btnPrimary, fontSize: '12px', opacity: repurposePlatforms.length === 0 ? 0.5 : 1 }}>
                {saving ? 'Creating...' : `Create ${repurposePlatforms.length} repurposed draft${repurposePlatforms.length !== 1 ? 's' : ''}`}
              </button>
            </div>
          )}

          {/* Performance metrics */}
          {selected.status === 'published' && (
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', color: '#888', marginBottom: '6px' }}>PERFORMANCE</div>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                {[
                  { label: 'Views', val: selected.views },
                  { label: 'Likes', val: selected.likes },
                  { label: 'Shares', val: selected.shares },
                  { label: 'Saves', val: selected.saves },
                  { label: 'Comments', val: selected.comments },
                  { label: 'CTR', val: selected.ctr != null ? `${(selected.ctr * 100).toFixed(1)}%` : null },
                  { label: 'Completion', val: selected.completion_rate != null ? `${(selected.completion_rate * 100).toFixed(1)}%` : null },
                ].map(m => (
                  <div key={m.label} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '16px', fontWeight: 600, color: '#4ade80' }}>{m.val ?? '-'}</div>
                    <div style={{ fontSize: '10px', color: '#555' }}>{m.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Parent link */}
          {parent && (
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '6px' }}>
              Repurposed from:{' '}
              <span onClick={() => setSelectedId(parent.id)} style={{ color: '#60a5fa', cursor: 'pointer', textDecoration: 'underline' }}>
                {parent.title}
              </span>
            </div>
          )}

          {/* Children */}
          {children.length > 0 && (
            <div>
              <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>REPURPOSED TO</div>
              {children.map(c => (
                <div key={c.id} onClick={() => setSelectedId(c.id)}
                  style={{ fontSize: '12px', color: '#60a5fa', cursor: 'pointer', padding: '2px 0' }}>
                  {TYPE_ICONS[c.content_type] || '📎'} {c.title} — <span style={{ color: STATUS_COLORS[c.status] || '#888' }}>{c.status}</span>
                </div>
              ))}
            </div>
          )}

          <div style={{ fontSize: '11px', color: '#444', marginTop: '10px' }}>
            Created {new Date(selected.created_at).toLocaleString()}
            {selected.published_at && ` · Published ${new Date(selected.published_at).toLocaleString()}`}
          </div>
        </div>
      )}

      {/* ===== Content Grid ===== */}
      {loading ? (
        <div style={{ color: '#666', textAlign: 'center', padding: '40px' }}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div style={{ color: '#666', textAlign: 'center', padding: '40px' }}>No content found</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '10px' }}>
          {filtered.map(item => (
            <div key={item.id} onClick={() => { setSelectedId(item.id); setShowCreate(false); setShowRepurpose(false) }}
              style={{
                ...cardStyle, cursor: 'pointer', transition: 'border-color 0.15s',
                borderColor: selectedId === item.id ? '#2563eb' : '#1e1e2e',
              }}
              onMouseEnter={e => { (e.currentTarget.style.borderColor = '#2a2a3a') }}
              onMouseLeave={e => { (e.currentTarget.style.borderColor = selectedId === item.id ? '#2563eb' : '#1e1e2e') }}>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <span style={{ fontSize: '16px' }}>{TYPE_ICONS[item.content_type] || '📎'}</span>
                <span style={{ fontSize: '14px', fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.title}
                </span>
              </div>

              {item.hook && (
                <div style={{ fontSize: '12px', color: '#888', marginBottom: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.hook.slice(0, 80)}{item.hook.length > 80 ? '...' : ''}
                </div>
              )}

              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={statusBadge(item.status)}>{item.status}</span>
                {item.target_platform && <span style={platformBadge()}>{item.target_platform}</span>}
                {isVideoType(item.content_type) && item.production_level && (
                  <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: '#8b5cf622', color: '#a78bfa', fontWeight: 600 }}>
                    L{item.production_level}
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                <span style={{ fontSize: '11px', color: '#444' }}>
                  {new Date(item.created_at).toLocaleDateString()}
                </span>
                {item.status === 'published' && (item.views != null || item.likes != null) && (
                  <div style={{ display: 'flex', gap: '8px', fontSize: '11px', color: '#555' }}>
                    {item.views != null && <span>{item.views} views</span>}
                    {item.likes != null && <span>{item.likes} likes</span>}
                    {item.shares != null && <span>{item.shares} shares</span>}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
