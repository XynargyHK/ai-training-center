'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Member = { id: string; name: string; phone: string | null }
type Expense = {
  id: string; title: string; amount: number; currency: string;
  paid_by: string; expense_date: string; split_mode: string;
  paid_by_member?: Member;
}

export default function TripPage() {
  const { tripId } = useParams<{ tripId: string }>()
  const router = useRouter()
  const [trip, setTrip] = useState<any>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [shares, setShares] = useState<any[]>([])
  const [newName, setNewName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [showAddMember, setShowAddMember] = useState(false)
  const [loading, setLoading] = useState(true)

  const loadTrip = useCallback(async () => {
    const { data: t } = await supabase.from('split_trips').select('*').eq('slug', tripId).single()
    if (!t) { setLoading(false); return }
    setTrip(t)

    const { data: m } = await supabase.from('split_members').select('*').eq('trip_id', t.id).order('created_at')
    setMembers(m || [])

    const { data: e } = await supabase.from('split_expenses').select('*').eq('trip_id', t.id).order('expense_date', { ascending: false })
    setExpenses(e || [])

    const expenseIds = (e || []).map(x => x.id)
    if (expenseIds.length > 0) {
      const { data: s } = await supabase.from('split_shares').select('*').in('expense_id', expenseIds)
      setShares(s || [])
    }
    setLoading(false)
  }, [tripId])

  useEffect(() => { loadTrip() }, [loadTrip])

  const addMember = async () => {
    if (!newName.trim() || !trip) return
    await supabase.from('split_members').insert({
      trip_id: trip.id, name: newName, phone: newPhone || null,
    })
    setNewName(''); setNewPhone(''); setShowAddMember(false)
    loadTrip()
  }

  // Calculate settlements
  const calcSettlements = () => {
    const balances: Record<string, number> = {}
    members.forEach(m => { balances[m.id] = 0 })

    expenses.forEach(exp => {
      // Who paid — they are owed
      if (balances[exp.paid_by] !== undefined) {
        balances[exp.paid_by] += exp.amount
      }
      // Who owes — based on shares
      const expShares = shares.filter(s => s.expense_id === exp.id && s.included)
      expShares.forEach(s => {
        if (balances[s.member_id] !== undefined) {
          balances[s.member_id] -= s.share_amount
        }
      })
    })

    // Simplify debts
    const debts: { from: string; to: string; amount: number }[] = []
    const positive: { id: string; amount: number }[] = []
    const negative: { id: string; amount: number }[] = []

    Object.entries(balances).forEach(([id, bal]) => {
      if (bal > 0.01) positive.push({ id, amount: bal })
      else if (bal < -0.01) negative.push({ id, amount: -bal })
    })

    positive.sort((a, b) => b.amount - a.amount)
    negative.sort((a, b) => b.amount - a.amount)

    let i = 0, j = 0
    while (i < positive.length && j < negative.length) {
      const amount = Math.min(positive[i].amount, negative[j].amount)
      if (amount > 0.01) {
        debts.push({ from: negative[j].id, to: positive[i].id, amount: Math.round(amount * 100) / 100 })
      }
      positive[i].amount -= amount
      negative[j].amount -= amount
      if (positive[i].amount < 0.01) i++
      if (negative[j].amount < 0.01) j++
    }

    return { balances, debts }
  }

  const getMemberName = (id: string) => members.find(m => m.id === id)?.name || 'Unknown'

  if (loading) return <div style={{ minHeight: '100dvh', background: '#0a0a0f', color: '#666', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>
  if (!trip) return <div style={{ minHeight: '100dvh', background: '#0a0a0f', color: '#f66', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Trip not found</div>

  const { balances, debts } = calcSettlements()

  const cardStyle = {
    background: '#12121c', border: '1px solid #1e1e2e',
    borderRadius: '12px', padding: '16px', marginBottom: '12px',
  }

  const inputStyle = {
    width: '100%', padding: '10px', background: '#0a0a0f',
    border: '1px solid #2a2a3a', borderRadius: '8px',
    color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' as const,
    marginBottom: '10px',
  }

  return (
    <div style={{
      minHeight: '100dvh', background: '#0a0a0f', color: '#fff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      maxWidth: '500px', margin: '0 auto', padding: '20px',
    }}>
      {/* Header */}
      <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '4px' }}>{trip.name}</h1>
      <p style={{ color: '#666', fontSize: '12px', marginBottom: '20px' }}>
        {members.length} members | {expenses.length} expenses
      </p>

      {/* Members */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#888' }}>MEMBERS</h3>
          <button onClick={() => setShowAddMember(!showAddMember)}
            style={{ padding: '4px 12px', background: '#1a2a4a', border: '1px solid #3b82f6', borderRadius: '6px', color: '#3b82f6', fontSize: '12px', cursor: 'pointer' }}>
            + Add
          </button>
        </div>
        {members.map(m => (
          <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #1a1a2a' }}>
            <span style={{ fontSize: '14px' }}>{m.name}</span>
            <span style={{ fontSize: '12px', color: '#666' }}>{m.phone || ''}</span>
          </div>
        ))}
        {showAddMember && (
          <div style={{ marginTop: '12px' }}>
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Name" style={inputStyle} />
            <input value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder="Phone (optional)" style={inputStyle} />
            <button onClick={addMember} style={{ padding: '8px 16px', background: '#2563eb', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '13px', cursor: 'pointer' }}>
              Add Member
            </button>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          onClick={() => router.push(`/split/${tripId}/add-expense`)}
          style={{
            flex: 1, padding: '14px', borderRadius: '10px',
            border: 'none', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
            color: '#fff', fontSize: '15px', fontWeight: 600, cursor: 'pointer',
          }}
        >
          + Add Expense
        </button>
        <button
          onClick={() => router.push(`/split/${tripId}/map`)}
          style={{
            padding: '14px 20px', borderRadius: '10px',
            border: '1px solid #2a5a2a', background: '#1a3a1a',
            color: '#4ade80', fontSize: '15px', fontWeight: 600, cursor: 'pointer',
          }}
        >
          Map
        </button>
      </div>

      {/* Expenses */}
      {expenses.length > 0 && (
        <div style={cardStyle}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#888', marginBottom: '12px' }}>EXPENSES</h3>
          {expenses.map(exp => (
            <div key={exp.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #1a1a2a' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 500 }}>{exp.title}</div>
                <div style={{ fontSize: '11px', color: '#666' }}>
                  Paid by {getMemberName(exp.paid_by)} | {exp.expense_date}
                </div>
              </div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: '#4ade80' }}>
                {exp.currency} {exp.amount}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Settlement */}
      {expenses.length > 0 && (
        <div style={cardStyle}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#888', marginBottom: '12px' }}>SETTLEMENT</h3>

          {/* Balances */}
          {members.map(m => {
            const bal = balances[m.id] || 0
            return (
              <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                <span style={{ fontSize: '14px' }}>{m.name}</span>
                <span style={{ fontSize: '14px', fontWeight: 600, color: bal >= 0 ? '#4ade80' : '#f87171' }}>
                  {bal >= 0 ? `+${bal.toFixed(2)}` : bal.toFixed(2)}
                </span>
              </div>
            )
          })}

          {/* Simplified debts */}
          {debts.length > 0 && (
            <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #2a2a3a' }}>
              <h4 style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>WHO PAYS WHO</h4>
              {debts.map((d, i) => (
                <div key={i} style={{ fontSize: '14px', padding: '4px 0', color: '#ccf' }}>
                  {getMemberName(d.from)} pays {getMemberName(d.to)} <strong>{expenses[0]?.currency || 'HKD'} {d.amount}</strong>
                </div>
              ))}
            </div>
          )}

          {debts.length === 0 && expenses.length > 0 && (
            <div style={{ marginTop: '12px', color: '#4ade80', fontSize: '14px' }}>All settled up!</div>
          )}
        </div>
      )}
    </div>
  )
}
