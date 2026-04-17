'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Plus, Trash2, ChevronRight, ChevronDown, Save, Phone, MessageCircle, Image, Link2, Mic, Users, RotateCcw, Sparkles, Loader2 } from 'lucide-react'

interface IvrNode {
  id: string
  business_unit_id: string
  parent_id: string | null
  sort_order: number
  label: string
  description: string | null
  action: string
  payload: any
  active: boolean
  children?: IvrNode[]
}

function buildTree(flat: IvrNode[]): IvrNode[] {
  const map = new Map<string, IvrNode>()
  const roots: IvrNode[] = []
  for (const row of flat) map.set(row.id, { ...row, children: [] })
  for (const node of map.values()) {
    if (node.parent_id && map.has(node.parent_id)) {
      map.get(node.parent_id)!.children!.push(node)
      map.get(node.parent_id)!.children!.sort((a, b) => a.sort_order - b.sort_order)
    } else if (!node.parent_id) {
      roots.push(node)
    }
  }
  return roots
}

const DIGITS = ['', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣']

// ─── Option Editor (recursive) ──────────────────────────────
function OptionEditor({ node, depth, number, allNodes, onUpdate, onDelete, onAddChild, menuPath, businessName }: {
  node: IvrNode; depth: number; number: string; allNodes: IvrNode[]
  onUpdate: (id: string, field: string, value: any) => void
  onDelete: (id: string) => void
  onAddChild: (parentId: string) => void
  menuPath: string; businessName: string
}) {
  const [expanded, setExpanded] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const children = (node.children || []).sort((a, b) => a.sort_order - b.sort_order)
  const hasChildren = children.length > 0
  const isEnd = !hasChildren
  const fullPath = menuPath ? `${menuPath} → ${node.label}` : node.label

  const generateOptions = async () => {
    setGenerating(true)
    setSuggestions([])
    try {
      const res = await fetch('/api/ivr-menus/generate-response', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ menuPath: fullPath, businessName, count: 3 })
      })
      const data = await res.json()
      if (data.options) setSuggestions(data.options)
    } catch (e) { console.error(e) }
    setGenerating(false)
  }

  return (
    <div className={depth > 0 ? 'ml-8 border-l-2 border-gray-200 pl-4 mt-2' : 'mt-2'}>
      <div className={`rounded-lg border ${isEnd ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-white'} p-3`}>
        {/* Option header */}
        <div className="flex items-center gap-2">
          {hasChildren && (
            <button onClick={() => setExpanded(!expanded)} className="text-gray-400 hover:text-gray-600">
              {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          )}
          <span className="text-sm font-bold text-gray-400 w-8">{number}</span>
          <input
            type="text"
            value={node.label}
            onChange={e => onUpdate(node.id, 'label', e.target.value)}
            className="flex-1 px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-400 font-medium"
            placeholder="Option name"
          />
          <button onClick={() => onDelete(node.id)} className="text-red-400 hover:text-red-600 p-1">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* End node = THE ANSWER */}
        {isEnd && (
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs text-green-700 font-medium">↳ When customer picks this, respond with:</p>
              <button onClick={generateOptions} disabled={generating}
                className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 disabled:opacity-50">
                {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                {generating ? 'Generating...' : 'Generate with AI'}
              </button>
            </div>
            {suggestions.length > 0 && (
              <div className="space-y-1">
                {suggestions.map((s, i) => (
                  <button key={i} onClick={() => { onUpdate(node.id, 'payload', { ...node.payload, response: s }); setSuggestions([]) }}
                    className="w-full text-left px-2 py-1.5 text-xs border border-purple-200 bg-purple-50 rounded hover:bg-purple-100 transition-colors">
                    {s}
                  </button>
                ))}
                <button onClick={() => setSuggestions([])} className="text-xs text-gray-400 hover:text-gray-600">Dismiss</button>
              </div>
            )}
            <textarea
              value={node.payload?.response || ''}
              onChange={e => onUpdate(node.id, 'payload', { ...node.payload, response: e.target.value })}
              className="w-full px-2 py-1.5 text-sm border border-green-200 rounded bg-white resize-none focus:outline-none focus:ring-1 focus:ring-green-400"
              rows={2}
              placeholder="Type the answer... or click 'Generate with AI' above"
            />
            <div className="flex items-center gap-3 text-xs">
              <label className="flex items-center gap-1 text-gray-500 cursor-pointer hover:text-gray-700">
                <Link2 className="w-3.5 h-3.5" />
                <input
                  type="text"
                  value={node.payload?.link || ''}
                  onChange={e => onUpdate(node.id, 'payload', { ...node.payload, link: e.target.value })}
                  className="px-1.5 py-0.5 border border-gray-200 rounded text-xs w-40"
                  placeholder="Add link (optional)"
                />
              </label>
              <label className="flex items-center gap-1 text-gray-500 cursor-pointer hover:text-gray-700">
                <Image className="w-3.5 h-3.5" />
                <input
                  type="text"
                  value={node.payload?.image || ''}
                  onChange={e => onUpdate(node.id, 'payload', { ...node.payload, image: e.target.value })}
                  className="px-1.5 py-0.5 border border-gray-200 rounded text-xs w-40"
                  placeholder="Image URL (optional)"
                />
              </label>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-400">Then:</span>
              <select
                value={node.payload?.then || 'end'}
                onChange={e => onUpdate(node.id, 'payload', { ...node.payload, then: e.target.value })}
                className="px-2 py-0.5 border border-gray-200 rounded text-xs bg-white"
              >
                <option value="end">End conversation</option>
                <option value="ai">Hand to AI for follow-up</option>
                <option value="phone">Call customer back</option>
                <option value="human">Transfer to human staff</option>
                <option value="voice">Send voice AI link</option>
              </select>
            </div>
          </div>
        )}

        {/* Add sub-option button */}
        <div className="mt-2">
          <button
            onClick={() => onAddChild(node.id)}
            className="text-xs flex items-center gap-1 text-blue-500 hover:text-blue-700"
          >
            <Plus className="w-3 h-3" /> Add sub-option
          </button>
        </div>
      </div>

      {/* Children */}
      {expanded && children.map((child, i) => (
        <OptionEditor
          key={child.id}
          node={child}
          depth={depth + 1}
          number={`${number}.${i + 1}`}
          allNodes={allNodes}
          onUpdate={onUpdate}
          onDelete={onDelete}
          onAddChild={onAddChild}
          menuPath={fullPath}
          businessName={businessName}
        />
      ))}
    </div>
  )
}

// ─── WhatsApp Simulator ──────────────────────────────────────
function WhatsAppSim({ tree, allNodes }: { tree: IvrNode[]; allNodes: IvrNode[] }) {
  const [messages, setMessages] = useState<{ from: 'bot' | 'user'; text: string }[]>([])
  const [parentStack, setParentStack] = useState<string[]>([])
  const [input, setInput] = useState('')
  const [ended, setEnded] = useState(false)
  const chatRef = useRef<HTMLDivElement>(null)

  useEffect(() => { restart() }, [tree])
  useEffect(() => { chatRef.current?.scrollTo(0, chatRef.current.scrollHeight) }, [messages])

  const showMenu = (parentId: string) => {
    const parent = allNodes.find(n => n.id === parentId)
    const children = allNodes.filter(n => n.parent_id === parentId).sort((a, b) => a.sort_order - b.sort_order)
    const greeting = parent?.payload?.greeting || ''
    const lines = children.map((c, i) => `${DIGITS[i + 1]} ${c.label}`)
    return [greeting, '', ...lines, '', 'Type a number or tell me what you need.'].filter(Boolean).join('\n')
  }

  const restart = () => {
    const root = tree[0]
    if (!root) { setMessages([]); return }
    setParentStack([root.id])
    setEnded(false)
    setMessages([{ from: 'bot', text: showMenu(root.id) }])
  }

  const handleSend = () => {
    if (!input.trim() || ended) return
    const text = input.trim()
    setInput('')
    setMessages(prev => [...prev, { from: 'user', text }])

    const currentParent = parentStack[parentStack.length - 1]
    const digit = parseInt(text)
    const children = allNodes.filter(n => n.parent_id === currentParent).sort((a, b) => a.sort_order - b.sort_order)

    if (isNaN(digit) || digit < 1 || digit > children.length) {
      setMessages(prev => [...prev, { from: 'bot', text: '💬 [AI would respond here]' }])
      return
    }

    const picked = children[digit - 1]
    const subChildren = allNodes.filter(n => n.parent_id === picked.id)

    if (subChildren.length > 0) {
      setParentStack(prev => [...prev, picked.id])
      setMessages(prev => [...prev, { from: 'bot', text: showMenu(picked.id) }])
    } else {
      let response = picked.payload?.response || picked.label
      if (picked.payload?.link) response += `\n🔗 ${picked.payload.link}`
      if (picked.payload?.image) response += `\n🖼️ [Image]`
      const thenLabel: Record<string, string> = {
        ai: '\n\n💬 [AI takes over from here]',
        phone: '\n\n📞 Calling you now...',
        human: '\n\n👤 Transferring to staff...',
        voice: '\n\n🎤 Tap to start voice call',
      }
      if (picked.payload?.then && picked.payload.then !== 'end') {
        response += thenLabel[picked.payload.then] || ''
      }
      setMessages(prev => [...prev, { from: 'bot', text: response }])
      setEnded(true)
    }
  }

  return (
    <div className="bg-[#0b141a] rounded-2xl overflow-hidden flex flex-col" style={{ height: 460 }}>
      <div className="bg-[#1f2c34] px-3 py-2 flex items-center gap-2">
        <div className="w-7 h-7 bg-[#00a884] rounded-full flex items-center justify-center text-white text-xs font-bold">AI</div>
        <span className="text-white text-sm flex-1">WhatsApp Preview</span>
        <button onClick={restart} className="text-[#8696a0] hover:text-white"><RotateCcw className="w-3.5 h-3.5" /></button>
      </div>
      <div ref={chatRef} className="flex-1 overflow-y-auto p-3 space-y-2 bg-[#111b21]">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
              m.from === 'user' ? 'bg-[#005c4b] text-white' : 'bg-[#1f2c34] text-[#e9edef]'
            }`}>{m.text}</div>
          </div>
        ))}
      </div>
      <div className="bg-[#1f2c34] p-2 flex gap-2">
        <input
          value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          disabled={ended}
          placeholder={ended ? 'Done. Press ↻ to restart' : 'Type a number...'}
          className="flex-1 bg-[#2a3942] text-white text-sm rounded-full px-4 py-2 outline-none placeholder-[#8696a0] disabled:opacity-50"
        />
        <button onClick={handleSend} disabled={ended} className="bg-[#00a884] text-white w-8 h-8 rounded-full flex items-center justify-center disabled:opacity-50">→</button>
      </div>
    </div>
  )
}

// ─── Phone Simulator ──────────────────────────────────────────
function PhoneSim({ tree, allNodes }: { tree: IvrNode[]; allNodes: IvrNode[] }) {
  const [log, setLog] = useState<{ type: 'system' | 'press' | 'speak'; text: string }[]>([])
  const [parentStack, setParentStack] = useState<string[]>([])
  const [ended, setEnded] = useState(false)
  const logRef = useRef<HTMLDivElement>(null)

  useEffect(() => { restart() }, [tree])
  useEffect(() => { logRef.current?.scrollTo(0, logRef.current.scrollHeight) }, [log])

  const speakMenu = (parentId: string) => {
    const parent = allNodes.find(n => n.id === parentId)
    const children = allNodes.filter(n => n.parent_id === parentId).sort((a, b) => a.sort_order - b.sort_order)
    const greeting = parent?.payload?.greeting || parent?.label || ''
    const opts = children.map((c, i) => `Press ${i + 1} for ${c.label.replace(/[^\w\s&]/g, '')}.`).join(' ')
    return `${greeting} ${opts}`
  }

  const restart = () => {
    const root = tree[0]
    if (!root) { setLog([]); return }
    setParentStack([root.id])
    setEnded(false)
    setLog([
      { type: 'system', text: '📞 Call connected' },
      { type: 'speak', text: speakMenu(root.id) }
    ])
  }

  const press = (digit: number) => {
    if (ended) return
    const currentParent = parentStack[parentStack.length - 1]
    const children = allNodes.filter(n => n.parent_id === currentParent).sort((a, b) => a.sort_order - b.sort_order)
    setLog(prev => [...prev, { type: 'press', text: `Pressed ${digit}` }])

    const picked = children[digit - 1]
    if (!picked) {
      setLog(prev => [...prev, { type: 'speak', text: 'Invalid option. Please try again.' }])
      return
    }
    const subChildren = allNodes.filter(n => n.parent_id === picked.id)
    if (subChildren.length > 0) {
      setParentStack(prev => [...prev, picked.id])
      setLog(prev => [...prev, { type: 'speak', text: speakMenu(picked.id) }])
    } else {
      const response = picked.payload?.response || picked.label
      setLog(prev => [...prev, { type: 'speak', text: `"${response}"` }])
      setEnded(true)
    }
  }

  return (
    <div className="bg-gray-900 rounded-2xl overflow-hidden flex flex-col" style={{ height: 460 }}>
      <div className="bg-gray-800 px-3 py-2 flex items-center justify-between">
        <span className="text-white text-sm">📞 Phone Preview</span>
        <button onClick={restart} className="text-gray-400 hover:text-white"><RotateCcw className="w-3.5 h-3.5" /></button>
      </div>
      <div ref={logRef} className="flex-1 overflow-y-auto p-3 space-y-1">
        {log.map((l, i) => (
          <p key={i} className={`text-xs ${
            l.type === 'press' ? 'text-blue-400' : l.type === 'system' ? 'text-yellow-400' : 'text-green-400'
          }`}>{l.type === 'speak' ? `🗣️ ${l.text}` : l.type === 'press' ? `👆 ${l.text}` : l.text}</p>
        ))}
        {ended && <p className="text-xs text-red-400 mt-1">📵 Call ended</p>}
      </div>
      <div className="bg-gray-800 p-2">
        <div className="grid grid-cols-3 gap-1.5">
          {[1,2,3,4,5,6,7,8,9].map(d => (
            <button key={d} onClick={() => press(d)} disabled={ended}
              className="bg-gray-700 hover:bg-gray-600 disabled:opacity-30 text-white text-base font-medium rounded-lg py-1.5 transition-colors"
            >{d}</button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────
export default function IvrMenuPage() {
  const [nodes, setNodes] = useState<IvrNode[]>([])
  const [tree, setTree] = useState<IvrNode[]>([])
  const [businessUnits, setBusinessUnits] = useState<{ id: string; name: string }[]>([])
  const [selectedBU, setSelectedBU] = useState('')
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [simTab, setSimTab] = useState<'whatsapp' | 'phone'>('whatsapp')
  const [templates, setTemplates] = useState<any[]>([])
  const [showTemplates, setShowTemplates] = useState(false)
  const [optionSuggestions, setOptionSuggestions] = useState<string[]>([])
  const [suggestingOptions, setSuggestingOptions] = useState(false)

  useEffect(() => {
    fetch('/api/business-units').then(r => r.json()).then(d => setBusinessUnits(d.business_units || []))
    fetch('/api/ivr-menus/import-template').then(r => r.json()).then(d => setTemplates(d.templates || []))
  }, [])

  useEffect(() => { if (selectedBU) loadMenu() }, [selectedBU])

  const loadMenu = async () => {
    const res = await fetch(`/api/ivr-menus?businessUnit=${selectedBU}`)
    const data = await res.json()
    setNodes(data.nodes || [])
    setTree(buildTree(data.nodes || []))
    setDirty(false)
    setShowTemplates(false)
  }

  const createRoot = async () => {
    await fetch('/api/ivr-menus', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessUnitId: selectedBU, label: 'Main Menu', action: 'sub_menu', payload: { greeting: 'Hi! Welcome. How can I help you today?' } }),
    })
    loadMenu()
  }

  const addChild = async (parentId: string) => {
    const siblings = nodes.filter(n => n.parent_id === parentId)
    await fetch('/api/ivr-menus', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessUnitId: selectedBU, parentId, label: 'New option', action: 'sub_menu', sortOrder: siblings.length + 1 }),
    })
    loadMenu()
  }

  const deleteNode = async (id: string) => {
    await fetch(`/api/ivr-menus?id=${id}`, { method: 'DELETE' })
    loadMenu()
  }

  const updateNode = useCallback((id: string, field: string, value: any) => {
    const updated = nodes.map(n => n.id === id ? { ...n, [field]: value } : n)
    setNodes(updated)
    setTree(buildTree(updated))
    setDirty(true)
  }, [nodes])

  const saveAll = async () => {
    setSaving(true)
    for (const node of nodes) {
      await fetch('/api/ivr-menus', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: node.id, label: node.label, description: node.description, action: node.action, payload: node.payload, sortOrder: node.sort_order, active: node.active }),
      })
    }
    setSaving(false)
    setDirty(false)
  }

  const importTemplate = async (templateId: string) => {
    await fetch('/api/ivr-menus/import-template', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ templateId, businessUnitId: selectedBU }),
    })
    loadMenu()
  }

  const root = tree[0]
  const rootChildren = root ? nodes.filter(n => n.parent_id === root.id).sort((a, b) => a.sort_order - b.sort_order) : []

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">IVR Menu Builder</h1>
            <p className="text-sm text-gray-500">Build your phone & WhatsApp menu. Customers navigate by pressing numbers.</p>
          </div>
          <div className="flex items-center gap-3">
            <select value={selectedBU} onChange={e => setSelectedBU(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
              <option value="">Select Business</option>
              {businessUnits.map(bu => <option key={bu.id} value={bu.id}>{bu.name}</option>)}
            </select>
            {dirty && (
              <button onClick={saveAll} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg text-sm hover:bg-gray-800 disabled:opacity-50">
                <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save'}
              </button>
            )}
          </div>
        </div>

        {!selectedBU ? (
          <div className="text-center py-20 text-gray-400">Select a business to start.</div>
        ) : (
          <div className="grid grid-cols-5 gap-6">
            {/* Editor (3 cols) */}
            <div className="col-span-3 space-y-4">
              {/* Greeting */}
              {root ? (
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <label className="text-sm font-semibold text-gray-700 block mb-2">Greeting</label>
                  <textarea
                    value={root.payload?.greeting || ''}
                    onChange={e => updateNode(root.id, 'payload', { ...root.payload, greeting: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-1 focus:ring-blue-400"
                    rows={2}
                    placeholder="Hi! Welcome to [your business]. How can I help you today?"
                  />
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                  <p className="text-gray-400 mb-4">No menu yet. Start from scratch or pick a template.</p>
                  <div className="flex justify-center gap-3">
                    <button onClick={createRoot} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                      <Plus className="w-4 h-4 inline mr-1" /> Create Blank Menu
                    </button>
                    <button onClick={() => setShowTemplates(true)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200">
                      Use Template
                    </button>
                  </div>
                </div>
              )}

              {/* Template picker */}
              {(showTemplates || (!root && templates.length > 0)) && (
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-gray-700">Industry Templates</p>
                    {root && <button onClick={() => setShowTemplates(false)} className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {templates.map(t => (
                      <button key={t.id} onClick={() => importTemplate(t.id)}
                        className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors text-left">
                        <span className="text-2xl">{t.icon}</span>
                        <div>
                          <div className="text-sm font-medium text-gray-800">{t.name}</div>
                          <div className="text-xs text-gray-400">{t.industry} · {t.optionCount} options</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Options */}
              {root && (
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-semibold text-gray-700">Menu Options</label>
                    {root && (
                      <button onClick={() => setShowTemplates(true)} className="text-xs text-gray-400 hover:text-gray-600">
                        Replace with template
                      </button>
                    )}
                  </div>
                  {rootChildren.map((child, i) => (
                    <OptionEditor
                      key={child.id}
                      node={child}
                      depth={0}
                      number={`${i + 1}`}
                      allNodes={nodes}
                      onUpdate={updateNode}
                      onDelete={deleteNode}
                      onAddChild={addChild}
                      menuPath={root?.payload?.greeting || 'Main Menu'}
                      businessName={businessUnits.find(b => b.id === selectedBU)?.name || ''}
                    />
                  ))}
                  {/* Add option: blank, quick-pick, or AI suggest */}
                  <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => addChild(root.id)}
                        className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800">
                        <Plus className="w-4 h-4" /> Add blank option
                      </button>
                      <span className="text-gray-300">|</span>
                      <button onClick={async () => {
                        setSuggestingOptions(true)
                        try {
                          const existing = rootChildren.map(c => c.label)
                          const buName = businessUnits.find(b => b.id === selectedBU)?.name || ''
                          const res = await fetch('/api/ivr-menus/generate-response', {
                            method: 'POST', headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ mode: 'suggest_options', businessName: buName, existingOptions: existing, count: 4 })
                          })
                          const data = await res.json()
                          setOptionSuggestions(data.options || [])
                        } catch (e) { console.error(e) }
                        setSuggestingOptions(false)
                      }} disabled={suggestingOptions}
                        className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-800 disabled:opacity-50">
                        {suggestingOptions ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                        {suggestingOptions ? 'Thinking...' : 'Suggest with AI'}
                      </button>
                    </div>

                    {/* Quick-add common options */}
                    <div className="flex flex-wrap gap-1.5">
                      {['📅 Book', '🛍️ Shop', '💬 Chat with AI', '🎤 Voice call', '📞 Phone call', '❓ FAQ', '📍 Location', '💰 Pricing', '👤 Our team', '📦 Track order'].map(label => (
                        <button key={label} onClick={async () => {
                          const siblings = nodes.filter(n => n.parent_id === root.id)
                          await fetch('/api/ivr-menus', {
                            method: 'POST', headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ businessUnitId: selectedBU, parentId: root.id, label, action: 'sub_menu', sortOrder: siblings.length + 1 }),
                          })
                          loadMenu()
                        }}
                          className="px-2 py-1 text-xs border border-gray-200 rounded-full hover:border-blue-400 hover:bg-blue-50 transition-colors text-gray-600">
                          {label}
                        </button>
                      ))}
                    </div>

                    {/* AI-suggested options */}
                    {optionSuggestions.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs text-purple-600 font-medium">AI suggestions:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {optionSuggestions.map((s, i) => (
                            <button key={i} onClick={async () => {
                              const siblings = nodes.filter(n => n.parent_id === root.id)
                              await fetch('/api/ivr-menus', {
                                method: 'POST', headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ businessUnitId: selectedBU, parentId: root.id, label: s, action: 'sub_menu', sortOrder: siblings.length + 1 }),
                              })
                              setOptionSuggestions(prev => prev.filter((_, j) => j !== i))
                              loadMenu()
                            }}
                              className="px-2.5 py-1 text-xs border border-purple-200 bg-purple-50 rounded-full hover:bg-purple-100 transition-colors text-purple-700">
                              + {s}
                            </button>
                          ))}
                          <button onClick={() => setOptionSuggestions([])} className="text-xs text-gray-400 hover:text-gray-600 px-1">✕</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Simulator (2 cols) */}
            <div className="col-span-2">
              <div className="sticky top-6 space-y-3">
                <div className="flex gap-2">
                  <button onClick={() => setSimTab('whatsapp')}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm ${simTab === 'whatsapp' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                    <MessageCircle className="w-4 h-4" /> WhatsApp
                  </button>
                  <button onClick={() => setSimTab('phone')}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm ${simTab === 'phone' ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-500'}`}>
                    <Phone className="w-4 h-4" /> Phone
                  </button>
                </div>
                {simTab === 'whatsapp' ? (
                  <WhatsAppSim tree={tree} allNodes={nodes} />
                ) : (
                  <PhoneSim tree={tree} allNodes={nodes} />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
