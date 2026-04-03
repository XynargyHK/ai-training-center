'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

type ScheduledTask = {
  id: string; tool_name: string; arguments: any;
  scheduled_at: string; recurrence: string | null;
  status: string; created_by: string; created_at: string;
}

export default function SchedulerPage() {
  const [tasks, setTasks] = useState<ScheduledTask[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)

  // Create form
  const [channel, setChannel] = useState('whatsapp')
  const [to, setTo] = useState('')
  const [message, setMessage] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [recurrence, setRecurrence] = useState('')
  const [saving, setSaving] = useState(false)

  const loadTasks = useCallback(async () => {
    const { data } = await supabase
      .from('scheduled_tasks')
      .select('*')
      .order('scheduled_at', { ascending: true })
      .limit(50)
    setTasks(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { loadTasks() }, [loadTasks])

  const createTask = async () => {
    if (!to || !message || !scheduledAt) return
    setSaving(true)
    await supabase.from('scheduled_tasks').insert({
      tool_name: 'send_message',
      arguments: { to, message, channels: [channel] },
      scheduled_at: scheduledAt,
      recurrence: recurrence || null,
      status: 'pending',
      created_by: 'admin',
    })
    setSaving(false)
    setShowCreate(false)
    setTo(''); setMessage(''); setScheduledAt(''); setRecurrence('')
    loadTasks()
  }

  const cancelTask = async (id: string) => {
    await supabase.from('scheduled_tasks').update({ status: 'cancelled' }).eq('id', id)
    loadTasks()
  }

  const statusColor = (s: string) => {
    if (s === 'pending') return '#f59e0b'
    if (s === 'completed') return '#4ade80'
    if (s === 'failed') return '#f87171'
    if (s === 'cancelled') return '#666'
    return '#888'
  }

  const inputStyle = {
    width: '100%', padding: '10px', background: '#0a0a0f',
    border: '1px solid #2a2a3a', borderRadius: '8px',
    color: '#fff', fontSize: '14px', outline: 'none',
    boxSizing: 'border-box' as const, marginBottom: '10px',
  }

  return (
    <div style={{
      minHeight: '100dvh', background: '#0a0a0f', color: '#fff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      maxWidth: '800px', margin: '0 auto', padding: '20px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>Message Scheduler</h1>
          <p style={{ color: '#666', fontSize: '12px', margin: '2px 0 0' }}>Schedule messages across all channels</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)}
          style={{ padding: '8px 16px', background: '#2563eb', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
          + New
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div style={{ background: '#12121c', border: '1px solid #1e1e2e', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#888', marginBottom: '12px' }}>SCHEDULE MESSAGE</h3>

          <label style={{ fontSize: '12px', color: '#888' }}>Channel</label>
          <select value={channel} onChange={e => setChannel(e.target.value)} style={inputStyle}>
            <option value="whatsapp">WhatsApp</option>
            <option value="email">Email</option>
            <option value="sms">SMS</option>
          </select>

          <label style={{ fontSize: '12px', color: '#888' }}>To (phone or email)</label>
          <input value={to} onChange={e => setTo(e.target.value)} placeholder="e.g. 85296099766" style={inputStyle} />

          <label style={{ fontSize: '12px', color: '#888' }}>Message</label>
          <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Type your message..."
            rows={3} style={{ ...inputStyle, resize: 'vertical' }} />

          <label style={{ fontSize: '12px', color: '#888' }}>When</label>
          <input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} style={inputStyle} />

          <label style={{ fontSize: '12px', color: '#888' }}>Repeat</label>
          <select value={recurrence} onChange={e => setRecurrence(e.target.value)} style={inputStyle}>
            <option value="">Once (no repeat)</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>

          <button onClick={createTask} disabled={saving || !to || !message || !scheduledAt}
            style={{ padding: '10px 20px', background: saving ? '#333' : '#2563eb', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
            {saving ? 'Scheduling...' : 'Schedule'}
          </button>
        </div>
      )}

      {/* Task list */}
      {loading ? (
        <div style={{ color: '#666', textAlign: 'center', padding: '40px' }}>Loading...</div>
      ) : tasks.length === 0 ? (
        <div style={{ color: '#666', textAlign: 'center', padding: '40px' }}>No scheduled messages yet</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {tasks.map(task => (
            <div key={task.id} style={{
              background: '#12121c', border: '1px solid #1e1e2e', borderRadius: '10px', padding: '12px 16px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: statusColor(task.status) + '22', color: statusColor(task.status), fontWeight: 600 }}>
                    {task.status}
                  </span>
                  <span style={{ fontSize: '12px', color: '#888' }}>
                    {(task.arguments?.channels || ['?']).join(', ')}
                  </span>
                  {task.recurrence && (
                    <span style={{ fontSize: '10px', color: '#3b82f6' }}>{task.recurrence}</span>
                  )}
                </div>
                <div style={{ fontSize: '14px', marginBottom: '2px' }}>
                  To: {task.arguments?.to} — {(task.arguments?.message || '').slice(0, 60)}...
                </div>
                <div style={{ fontSize: '11px', color: '#555' }}>
                  {new Date(task.scheduled_at).toLocaleString()}
                </div>
              </div>
              {task.status === 'pending' && (
                <button onClick={() => cancelTask(task.id)}
                  style={{ padding: '4px 10px', background: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: '6px', color: '#f87171', fontSize: '11px', cursor: 'pointer' }}>
                  Cancel
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
