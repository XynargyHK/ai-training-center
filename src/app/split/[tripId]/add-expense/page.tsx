'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Member = { id: string; name: string; phone: string | null }

export default function AddExpensePage() {
  const { tripId } = useParams<{ tripId: string }>()
  const router = useRouter()
  const [trip, setTrip] = useState<any>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Form fields
  const [title, setTitle] = useState('')
  const [calcDisplay, setCalcDisplay] = useState('0')
  const [currency, setCurrency] = useState('HKD')
  const [paidBy, setPaidBy] = useState('')
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0])
  const [splitMode, setSplitMode] = useState<'equal' | 'parts' | 'amount'>('equal')
  const [included, setIncluded] = useState<Record<string, boolean>>({})
  const [parts, setParts] = useState<Record<string, number>>({})
  const [amounts, setAmounts] = useState<Record<string, string>>({})

  const loadData = useCallback(async () => {
    const { data: t } = await supabase.from('split_trips').select('*').eq('slug', tripId).single()
    if (!t) { setLoading(false); return }
    setTrip(t)
    const { data: m } = await supabase.from('split_members').select('*').eq('trip_id', t.id).order('created_at')
    setMembers(m || [])
    if (m && m.length > 0) {
      setPaidBy(m[0].id)
      const inc: Record<string, boolean> = {}
      const pts: Record<string, number> = {}
      const amts: Record<string, string> = {}
      m.forEach(member => { inc[member.id] = true; pts[member.id] = 1; amts[member.id] = '' })
      setIncluded(inc)
      setParts(pts)
      setAmounts(amts)
    }
    setLoading(false)
  }, [tripId])

  useEffect(() => { loadData() }, [loadData])

  // Calculator
  const calcPress = (key: string) => {
    if (key === 'C') { setCalcDisplay('0'); return }
    if (key === '=') {
      try {
        const result = Function('"use strict"; return (' + calcDisplay + ')')()
        setCalcDisplay(String(Math.round(result * 100) / 100))
      } catch { /* invalid expression, ignore */ }
      return
    }
    if (key === 'DEL') { setCalcDisplay(d => d.length <= 1 ? '0' : d.slice(0, -1)); return }
    setCalcDisplay(d => d === '0' && key !== '.' && key !== '+' && key !== '-' && key !== '*' && key !== '/' ? key : d + key)
  }

  const amount = (() => {
    try { return parseFloat(calcDisplay) || 0 } catch { return 0 }
  })()

  // Calculate shares
  const calcShares = () => {
    const activeMembers = members.filter(m => included[m.id])
    if (activeMembers.length === 0) return {}

    const shareMap: Record<string, number> = {}

    if (splitMode === 'equal') {
      const each = Math.round((amount / activeMembers.length) * 100) / 100
      activeMembers.forEach(m => { shareMap[m.id] = each })
    } else if (splitMode === 'parts') {
      const totalParts = activeMembers.reduce((sum, m) => sum + (parts[m.id] || 1), 0)
      activeMembers.forEach(m => {
        shareMap[m.id] = Math.round((amount * (parts[m.id] || 1) / totalParts) * 100) / 100
      })
    } else {
      activeMembers.forEach(m => {
        shareMap[m.id] = parseFloat(amounts[m.id] || '0') || 0
      })
    }
    return shareMap
  }

  const shareMap = calcShares()

  const saveExpense = async () => {
    if (!title.trim() || amount <= 0 || !paidBy || !trip) return
    setSaving(true)
    try {
      const { data: exp, error: expErr } = await supabase.from('split_expenses').insert({
        trip_id: trip.id, title, amount, currency,
        paid_by: paidBy, expense_date: expenseDate, split_mode: splitMode,
      }).select().single()

      if (expErr) throw expErr

      const shareRows = members.filter(m => included[m.id]).map(m => ({
        expense_id: exp.id,
        member_id: m.id,
        share_amount: shareMap[m.id] || 0,
        parts: parts[m.id] || 1,
        included: true,
      }))

      await supabase.from('split_shares').insert(shareRows)
      router.push(`/split/${tripId}`)
    } catch (err: any) {
      alert('Error: ' + (err?.message || err))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div style={{ minHeight: '100dvh', background: '#0a0a0f', color: '#666', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>

  const labelStyle = { fontSize: '12px', color: '#888', display: 'block' as const, marginBottom: '6px', marginTop: '14px' }
  const inputStyle = {
    width: '100%', padding: '10px', background: '#0a0a0f',
    border: '1px solid #2a2a3a', borderRadius: '8px',
    color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' as const,
  }
  const calcBtnStyle = (highlight?: boolean) => ({
    flex: 1, padding: '14px 0', border: 'none', borderRadius: '8px',
    background: highlight ? '#1a2a4a' : '#1a1a24',
    color: highlight ? '#3b82f6' : '#fff', fontSize: '18px', fontWeight: 600 as const,
    cursor: 'pointer',
  })

  return (
    <div style={{
      minHeight: '100dvh', background: '#0a0a0f', color: '#fff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      maxWidth: '500px', margin: '0 auto', padding: '20px',
    }}>
      <h1 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '4px' }}>Add Expense</h1>
      <p style={{ color: '#666', fontSize: '12px', marginBottom: '16px' }}>{trip?.name}</p>

      {/* Title */}
      <label style={labelStyle}>Title</label>
      <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Dinner at Kichi Kichi" style={inputStyle} />

      {/* Amount with currency + calculator */}
      <label style={labelStyle}>Amount</label>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
        <select value={currency} onChange={e => setCurrency(e.target.value)}
          style={{ ...inputStyle, width: '80px', flex: 'none' }}>
          <option value="HKD">HKD</option>
          <option value="CNY">CNY</option>
          <option value="JPY">JPY</option>
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
          <option value="GBP">GBP</option>
          <option value="THB">THB</option>
          <option value="VND">VND</option>
        </select>
        <div style={{
          ...inputStyle, flex: 1, fontSize: '20px', fontWeight: 700,
          textAlign: 'right' as const, color: '#4ade80',
        }}>
          {calcDisplay}
        </div>
      </div>

      {/* Calculator pad */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '16px' }}>
        {[
          ['7', '8', '9', '/'],
          ['4', '5', '6', '*'],
          ['1', '2', '3', '-'],
          ['0', '.', 'DEL', '+'],
          ['C', '='],
        ].map((row, ri) => (
          <div key={ri} style={{ display: 'flex', gap: '4px' }}>
            {row.map(key => (
              <button key={key} onClick={() => calcPress(key)}
                style={calcBtnStyle(key === '=' || key === 'C' || key === 'DEL')}>
                {key}
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* Paid by */}
      <label style={labelStyle}>Paid by</label>
      <select value={paidBy} onChange={e => setPaidBy(e.target.value)} style={inputStyle}>
        {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
      </select>

      {/* Date */}
      <label style={labelStyle}>When</label>
      <input type="date" value={expenseDate} onChange={e => setExpenseDate(e.target.value)} style={inputStyle} />

      {/* Split mode */}
      <label style={labelStyle}>Split</label>
      <div style={{ display: 'flex', gap: '4px', marginBottom: '12px' }}>
        {(['equal', 'parts', 'amount'] as const).map(mode => (
          <button key={mode} onClick={() => setSplitMode(mode)}
            style={{
              flex: 1, padding: '8px', border: `1px solid ${splitMode === mode ? '#3b82f6' : '#2a2a3a'}`,
              borderRadius: '8px', background: splitMode === mode ? '#1a2a4a' : '#0a0a0f',
              color: splitMode === mode ? '#3b82f6' : '#888', fontSize: '12px', fontWeight: 600,
              cursor: 'pointer', textTransform: 'capitalize' as const,
            }}>
            {mode === 'parts' ? 'As Parts' : mode === 'amount' ? 'As Amount' : 'Equally'}
          </button>
        ))}
      </div>

      {/* Member split list */}
      <div style={{ background: '#12121c', border: '1px solid #1e1e2e', borderRadius: '10px', padding: '12px' }}>
        {members.map(m => (
          <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: '1px solid #1a1a2a' }}>
            <input type="checkbox" checked={included[m.id] || false}
              onChange={e => setIncluded({ ...included, [m.id]: e.target.checked })}
              style={{ width: '18px', height: '18px', accentColor: '#3b82f6' }} />
            <span style={{ flex: 1, fontSize: '14px', color: included[m.id] ? '#fff' : '#555' }}>{m.name}</span>

            {splitMode === 'parts' && included[m.id] && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button onClick={() => setParts({ ...parts, [m.id]: Math.max(1, (parts[m.id] || 1) - 1) })}
                  style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid #2a2a3a', background: '#0a0a0f', color: '#fff', cursor: 'pointer', fontSize: '16px' }}>-</button>
                <span style={{ fontSize: '14px', fontWeight: 600, width: '24px', textAlign: 'center' as const }}>{parts[m.id] || 1}x</span>
                <button onClick={() => setParts({ ...parts, [m.id]: (parts[m.id] || 1) + 1 })}
                  style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid #2a2a3a', background: '#0a0a0f', color: '#fff', cursor: 'pointer', fontSize: '16px' }}>+</button>
              </div>
            )}

            {splitMode === 'amount' && included[m.id] && (
              <input value={amounts[m.id] || ''} onChange={e => setAmounts({ ...amounts, [m.id]: e.target.value })}
                placeholder="0" style={{ width: '80px', padding: '6px', background: '#0a0a0f', border: '1px solid #2a2a3a', borderRadius: '6px', color: '#fff', fontSize: '14px', textAlign: 'right' as const, outline: 'none' }} />
            )}

            {included[m.id] && (
              <span style={{ fontSize: '13px', color: '#4ade80', fontWeight: 600, minWidth: '60px', textAlign: 'right' as const }}>
                {(shareMap[m.id] || 0).toFixed(2)}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Add button */}
      <button onClick={saveExpense} disabled={saving || !title.trim() || amount <= 0}
        style={{
          width: '100%', padding: '14px', borderRadius: '10px', marginTop: '20px',
          border: 'none', background: saving ? '#333' : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
          color: '#fff', fontSize: '16px', fontWeight: 600,
          cursor: saving ? 'wait' : 'pointer',
        }}>
        {saving ? 'Adding...' : 'Add'}
      </button>
    </div>
  )
}
