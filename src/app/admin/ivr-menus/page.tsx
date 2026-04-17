'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Plus, Trash2, ChevronRight, ChevronDown, Save, Phone, MessageCircle, Eye, GripVertical } from 'lucide-react'

const ACTION_TYPES = [
  { value: 'sub_menu', label: 'Sub-menu', icon: '📂' },
  { value: 'ai_chat', label: 'AI Chat', icon: '💬' },
  { value: 'transfer_human', label: 'Transfer to Human', icon: '👤' },
  { value: 'send_link', label: 'Send Link', icon: '🔗' },
  { value: 'play_message', label: 'Play Message', icon: '📢' },
  { value: 'phone_call', label: 'Phone Call', icon: '📞' },
  { value: 'voice_ai', label: 'Voice AI', icon: '🎤' },
]

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
    } else if (!node.parent_id) {
      roots.push(node)
    }
  }
  return roots
}

const DIGITS = ['', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣']

const ACTION_RESULTS: Record<string, (node: IvrNode) => string> = {
  ai_chat: (n) => `💬 ${n.payload?.prompt || 'Connecting you with AI...'}\n\n[AI conversation starts here]`,
  transfer_human: (n) => `👤 ${n.payload?.message || 'Connecting you with a team member. Please wait.'}`,
  send_link: (n) => `🔗 Here you go: ${n.payload?.url || '(no URL set)'}`,
  voice_ai: (n) => `🎤 Tap to start voice: ${n.payload?.url || '(no URL set)'}`,
  phone_call: () => `📞 Calling you now... pick up in a few seconds.`,
  play_message: (n) => `📢 ${n.payload?.message || '(no message set)'}`,
}

function WhatsAppSimulator({ tree, allNodes }: { tree: IvrNode[]; allNodes: IvrNode[] }) {
  const [messages, setMessages] = useState<{ role: 'system' | 'user'; text: string }[]>([])
  const [currentParentId, setCurrentParentId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [ended, setEnded] = useState(false)
  const chatRef = useRef<HTMLDivElement>(null)

  useEffect(() => { restart() }, [tree])
  useEffect(() => { chatRef.current?.scrollTo(0, chatRef.current.scrollHeight) }, [messages])

  const restart = () => {
    const root = tree[0]
    if (!root) { setMessages([]); return }
    setCurrentParentId(root.id)
    setEnded(false)
    const children = (root.children || []).sort((a, b) => a.sort_order - b.sort_order)
    const greeting = root.payload?.greeting || 'Welcome!'
    const menu = children.map((c, i) => `${DIGITS[i + 1]} ${c.label}`).join('\n')
    setMessages([{ role: 'system', text: `${greeting}\n\n${menu}\n\nType a number or tell me what you need.` }])
  }

  const handleSend = () => {
    if (!input.trim() || ended) return
    const userText = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: userText }])

    const digit = parseInt(userText)
    if (!currentParentId || isNaN(digit) || digit < 1) {
      setMessages(prev => [...prev, { role: 'system', text: '💬 [AI would respond here based on your message]' }])
      return
    }

    const children = allNodes.filter(n => n.parent_id === currentParentId).sort((a, b) => a.sort_order - b.sort_order)
    const matched = children[digit - 1]
    if (!matched) {
      setMessages(prev => [...prev, { role: 'system', text: `Invalid option. Please type 1-${children.length}.` }])
      return
    }

    if (matched.action === 'sub_menu') {
      const subChildren = allNodes.filter(n => n.parent_id === matched.id).sort((a, b) => a.sort_order - b.sort_order)
      const subGreeting = matched.payload?.greeting || matched.label
      const menu = subChildren.map((c, i) => `${DIGITS[i + 1]} ${c.label}`).join('\n')
      setCurrentParentId(matched.id)
      setMessages(prev => [...prev, { role: 'system', text: `${subGreeting}\n\n${menu}\n\nType a number.` }])
    } else {
      const resultFn = ACTION_RESULTS[matched.action]
      const result = resultFn ? resultFn(matched) : `[${matched.action}]`
      setMessages(prev => [...prev, { role: 'system', text: result }])
      setEnded(true)
    }
  }

  return (
    <div className="bg-[#0b141a] rounded-2xl overflow-hidden flex flex-col" style={{ height: 480 }}>
      <div className="bg-[#1f2c34] px-3 py-2 flex items-center gap-2">
        <div className="w-8 h-8 bg-[#00a884] rounded-full flex items-center justify-center text-white text-xs font-bold">AI</div>
        <div><div className="text-white text-sm font-medium">AI Assistant</div><div className="text-[#8696a0] text-xs">online</div></div>
        <button onClick={restart} className="ml-auto text-[#8696a0] text-xs hover:text-white">↻ Reset</button>
      </div>
      <div ref={chatRef} className="flex-1 overflow-y-auto p-3 space-y-2" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cdefs%3E%3Cpattern id=\'p\' width=\'20\' height=\'20\' patternUnits=\'userSpaceOnUse\'%3E%3Ccircle cx=\'10\' cy=\'10\' r=\'1\' fill=\'%23182229\'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width=\'100\' height=\'100\' fill=\'%23111b21\'/%3E%3Crect width=\'100\' height=\'100\' fill=\'url(%23p)\'/%3E%3C/svg%3E")' }}>
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${m.role === 'user' ? 'bg-[#005c4b] text-white' : 'bg-[#1f2c34] text-[#e9edef]'}`}>
              {m.text}
            </div>
          </div>
        ))}
      </div>
      <div className="bg-[#1f2c34] p-2 flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder={ended ? 'Conversation ended. Reset ↻' : 'Type a message...'}
          disabled={ended}
          className="flex-1 bg-[#2a3942] text-white text-sm rounded-full px-4 py-2 outline-none placeholder-[#8696a0] disabled:opacity-50"
        />
        <button onClick={handleSend} disabled={ended} className="bg-[#00a884] text-white w-8 h-8 rounded-full flex items-center justify-center text-sm disabled:opacity-50">→</button>
      </div>
    </div>
  )
}

function PhoneSimulator({ tree, allNodes }: { tree: IvrNode[]; allNodes: IvrNode[] }) {
  const [log, setLog] = useState<string[]>([])
  const [currentParentId, setCurrentParentId] = useState<string | null>(null)
  const [ended, setEnded] = useState(false)
  const logRef = useRef<HTMLDivElement>(null)

  useEffect(() => { restart() }, [tree])
  useEffect(() => { logRef.current?.scrollTo(0, logRef.current.scrollHeight) }, [log])

  const restart = () => {
    const root = tree[0]
    if (!root) { setLog([]); return }
    setCurrentParentId(root.id)
    setEnded(false)
    const children = (root.children || []).sort((a, b) => a.sort_order - b.sort_order)
    const greeting = root.payload?.greeting || 'Welcome.'
    const options = children.map((c, i) => `Press ${i + 1} for ${c.label.replace(/[^\w\s]/g, '')}.`).join(' ')
    setLog([`🔔 Incoming call...`, `🗣️ "${greeting} ${options}"`])
  }

  const pressDigit = (digit: number) => {
    if (ended || !currentParentId) return
    setLog(prev => [...prev, `👆 Pressed ${digit}`])
    const children = allNodes.filter(n => n.parent_id === currentParentId).sort((a, b) => a.sort_order - b.sort_order)
    const matched = children[digit - 1]
    if (!matched) {
      setLog(prev => [...prev, `🗣️ "Invalid option. Please try again."`])
      return
    }
    if (matched.action === 'sub_menu') {
      const subChildren = allNodes.filter(n => n.parent_id === matched.id).sort((a, b) => a.sort_order - b.sort_order)
      const subGreeting = matched.payload?.greeting || matched.label.replace(/[^\w\s]/g, '')
      const options = subChildren.map((c, i) => `Press ${i + 1} for ${c.label.replace(/[^\w\s]/g, '')}.`).join(' ')
      setCurrentParentId(matched.id)
      setLog(prev => [...prev, `🗣️ "${subGreeting}. ${options}"`])
    } else {
      const actionLabels: Record<string, string> = {
        ai_chat: '🗣️ "How can I help you?" [Speech recognition active]',
        transfer_human: `🗣️ "${matched.payload?.message || 'Transferring you now.'}" [Call transferred]`,
        send_link: '🗣️ "I\'ve sent you a link via WhatsApp." [Hangup]',
        voice_ai: '🗣️ "Connecting you with AI voice assistant..." [WebRTC handoff]',
        phone_call: '🗣️ "You\'re already on the phone." [Continue]',
        play_message: `🗣️ "${matched.payload?.message || 'Thank you.'}" [Hangup]`,
      }
      setLog(prev => [...prev, actionLabels[matched.action] || `[${matched.action}]`])
      setEnded(true)
    }
  }

  const dialPad = [1,2,3,4,5,6,7,8,9,'*',0,'#']
  return (
    <div className="bg-gray-900 rounded-2xl overflow-hidden flex flex-col" style={{ height: 480 }}>
      <div className="bg-gray-800 px-3 py-2 flex items-center justify-between">
        <span className="text-white text-sm font-medium">📞 Phone Simulator</span>
        <button onClick={restart} className="text-gray-400 text-xs hover:text-white">↻ Reset</button>
      </div>
      <div ref={logRef} className="flex-1 overflow-y-auto p-3 space-y-1">
        {log.map((l, i) => (
          <p key={i} className={`text-xs ${l.startsWith('👆') ? 'text-blue-400' : l.startsWith('🔔') ? 'text-yellow-400' : 'text-green-400'}`}>{l}</p>
        ))}
        {ended && <p className="text-xs text-red-400 mt-2">📵 Call ended. Reset to try again.</p>}
      </div>
      <div className="bg-gray-800 p-3">
        <div className="grid grid-cols-3 gap-2">
          {dialPad.map(d => (
            <button
              key={d}
              onClick={() => typeof d === 'number' && d >= 1 && d <= 9 && pressDigit(d)}
              disabled={ended || typeof d !== 'number' || d < 1 || d > 9}
              className="bg-gray-700 hover:bg-gray-600 disabled:opacity-30 text-white text-lg font-medium rounded-lg py-2 transition-colors"
            >
              {d}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}


function NodeEditor({
  node, depth, onUpdate, onDelete, onAddChild, allNodes
}: {
  node: IvrNode
  depth: number
  onUpdate: (id: string, field: string, value: any) => void
  onDelete: (id: string) => void
  onAddChild: (parentId: string) => void
  allNodes: IvrNode[]
}) {
  const [expanded, setExpanded] = useState(true)
  const children = (node.children || []).sort((a, b) => a.sort_order - b.sort_order)
  const isRoot = node.parent_id === null
  const actionType = ACTION_TYPES.find(a => a.value === node.action) || ACTION_TYPES[0]

  return (
    <div className={`${depth > 0 ? 'ml-6 border-l-2 border-gray-200 pl-4' : ''}`}>
      <div className={`flex items-start gap-2 p-3 rounded-lg mb-2 ${isRoot ? 'bg-blue-50 border border-blue-200' : 'bg-white border border-gray-200'} hover:shadow-sm transition-shadow`}>
        <div className="flex items-center gap-1 mt-1">
          <GripVertical className="w-4 h-4 text-gray-300 cursor-grab" />
          {children.length > 0 && (
            <button onClick={() => setExpanded(!expanded)} className="text-gray-400 hover:text-gray-600">
              {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          )}
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">{actionType.icon}</span>
            <input
              type="text"
              value={node.label}
              onChange={e => onUpdate(node.id, 'label', e.target.value)}
              className="flex-1 px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-400 font-medium"
              placeholder="Menu label"
            />
            {isRoot && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Root</span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={node.action}
              onChange={e => onUpdate(node.id, 'action', e.target.value)}
              className="text-xs px-2 py-1 border border-gray-200 rounded bg-white"
            >
              {ACTION_TYPES.map(a => (
                <option key={a.value} value={a.value}>{a.icon} {a.label}</option>
              ))}
            </select>

            {(node.action === 'send_link' || node.action === 'voice_ai') && (
              <input
                type="text"
                value={node.payload?.url || ''}
                onChange={e => onUpdate(node.id, 'payload', { ...node.payload, url: e.target.value })}
                className="flex-1 text-xs px-2 py-1 border border-gray-200 rounded"
                placeholder="URL"
              />
            )}

            {node.action === 'ai_chat' && (
              <input
                type="text"
                value={node.payload?.prompt || ''}
                onChange={e => onUpdate(node.id, 'payload', { ...node.payload, prompt: e.target.value })}
                className="flex-1 text-xs px-2 py-1 border border-gray-200 rounded"
                placeholder="Initial prompt (optional)"
              />
            )}

            {node.action === 'play_message' && (
              <input
                type="text"
                value={node.payload?.message || ''}
                onChange={e => onUpdate(node.id, 'payload', { ...node.payload, message: e.target.value })}
                className="flex-1 text-xs px-2 py-1 border border-gray-200 rounded"
                placeholder="Message text"
              />
            )}

            {isRoot && (
              <input
                type="text"
                value={node.payload?.greeting || ''}
                onChange={e => onUpdate(node.id, 'payload', { ...node.payload, greeting: e.target.value })}
                className="flex-1 text-xs px-2 py-1 border border-gray-200 rounded"
                placeholder="Greeting text (shown/spoken first)"
              />
            )}
          </div>

          <div className="flex items-center gap-2">
            {node.action === 'sub_menu' && (
              <button
                onClick={() => onAddChild(node.id)}
                className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-800"
              >
                <Plus className="w-3 h-3" /> Add option
              </button>
            )}
            {!isRoot && (
              <button
                onClick={() => onDelete(node.id)}
                className="text-xs flex items-center gap-1 text-red-500 hover:text-red-700 ml-auto"
              >
                <Trash2 className="w-3 h-3" /> Remove
              </button>
            )}
          </div>
        </div>
      </div>

      {expanded && children.map(child => (
        <NodeEditor
          key={child.id}
          node={child}
          depth={depth + 1}
          onUpdate={onUpdate}
          onDelete={onDelete}
          onAddChild={onAddChild}
          allNodes={allNodes}
        />
      ))}
    </div>
  )
}

export default function IvrMenuPage() {
  const [nodes, setNodes] = useState<IvrNode[]>([])
  const [tree, setTree] = useState<IvrNode[]>([])
  const [businessUnits, setBusinessUnits] = useState<{ id: string; name: string }[]>([])
  const [selectedBU, setSelectedBU] = useState('')
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [previewTab, setPreviewTab] = useState<'whatsapp' | 'phone'>('whatsapp')
  const [templates, setTemplates] = useState<any[]>([])
  const [importing, setImporting] = useState(false)

  useEffect(() => {
    fetch('/api/business-units').then(r => r.json()).then(d => {
      setBusinessUnits(d.business_units || d.businessUnits || [])
    })
    fetch('/api/ivr-menus/import-template').then(r => r.json()).then(d => {
      setTemplates(d.templates || [])
    })
  }, [])

  useEffect(() => {
    if (selectedBU) loadMenu()
  }, [selectedBU])

  const loadMenu = async () => {
    const res = await fetch(`/api/ivr-menus?businessUnit=${selectedBU}`)
    const data = await res.json()
    setNodes(data.nodes || [])
    setTree(data.tree || [])
    setDirty(false)
  }

  const createRoot = async () => {
    const res = await fetch('/api/ivr-menus', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        businessUnitId: selectedBU,
        label: 'Main Menu',
        action: 'sub_menu',
        payload: { greeting: 'Hi! Welcome. How can I help?' },
      }),
    })
    if (res.ok) loadMenu()
  }

  const addChild = async (parentId: string) => {
    const siblings = nodes.filter(n => n.parent_id === parentId)
    const res = await fetch('/api/ivr-menus', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        businessUnitId: selectedBU,
        parentId,
        label: 'New Option',
        action: 'ai_chat',
        sortOrder: siblings.length + 1,
      }),
    })
    if (res.ok) loadMenu()
  }

  const updateNode = useCallback((id: string, field: string, value: any) => {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, [field]: value } : n))
    setTree(prev => {
      const flat = nodes.map(n => n.id === id ? { ...n, [field]: value } : n)
      return buildTree(flat)
    })
    setDirty(true)
  }, [nodes])

  const deleteNode = async (id: string) => {
    await fetch(`/api/ivr-menus?id=${id}`, { method: 'DELETE' })
    loadMenu()
  }

  const saveAll = async () => {
    setSaving(true)
    for (const node of nodes) {
      await fetch('/api/ivr-menus', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: node.id,
          label: node.label,
          description: node.description,
          action: node.action,
          payload: node.payload,
          sortOrder: node.sort_order,
          active: node.active,
        }),
      })
    }
    setSaving(false)
    setDirty(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">IVR Menu Builder</h1>
            <p className="text-sm text-gray-500">Design menus for WhatsApp + Phone. One tree, two channels.</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedBU}
              onChange={e => setSelectedBU(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">Select Business Unit</option>
              {businessUnits.map(bu => (
                <option key={bu.id} value={bu.id}>{bu.name}</option>
              ))}
            </select>
            {dirty && (
              <button
                onClick={saveAll}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg text-sm hover:bg-gray-800 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            )}
          </div>
        </div>

        {!selectedBU ? (
          <div className="text-center py-20 text-gray-400">Select a business unit to start.</div>
        ) : (
          <div className="grid grid-cols-3 gap-6">
            {/* Tree Editor */}
            <div className="col-span-2">
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-gray-700">Menu Tree</h2>
                  <div className="flex items-center gap-2">
                    {tree.length === 0 && (
                      <button
                        onClick={createRoot}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                      >
                        <Plus className="w-4 h-4" /> Create Blank Menu
                      </button>
                    )}
                    {tree.length > 0 && !importing && (
                      <button
                        onClick={() => setImporting(true)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200"
                      >
                        Replace with Template
                      </button>
                    )}
                    {importing && (
                      <button
                        onClick={() => setImporting(false)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>

                {/* Template Picker — show when no menu exists, or via button */}
                {templates.length > 0 && (tree.length === 0 || importing) && (
                  <div className="mb-6">
                    <p className="text-sm text-gray-500 mb-3">Or start from an industry template:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {templates.map(t => (
                        <button
                          key={t.id}
                          disabled={importing}
                          onClick={async () => {
                            setImporting(true)
                            await fetch('/api/ivr-menus/import-template', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ templateId: t.id, businessUnitId: selectedBU })
                            })
                            await loadMenu()
                            setImporting(false)  // hide template grid after import
                          }}
                          className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors text-left disabled:opacity-50"
                        >
                          <span className="text-2xl">{t.icon}</span>
                          <div>
                            <div className="text-sm font-medium text-gray-800">{t.name}</div>
                            <div className="text-xs text-gray-400">{t.optionCount} options</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {tree.map(root => (
                  <NodeEditor
                    key={root.id}
                    node={root}
                    depth={0}
                    onUpdate={updateNode}
                    onDelete={deleteNode}
                    onAddChild={addChild}
                    allNodes={nodes}
                  />
                ))}
              </div>
            </div>

            {/* Preview Panel */}
            <div>
              <div className="bg-white rounded-xl border border-gray-200 p-4 sticky top-6">
                <div className="flex items-center gap-2 mb-4">
                  <button
                    onClick={() => setPreviewTab('whatsapp')}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm ${previewTab === 'whatsapp' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}
                  >
                    <MessageCircle className="w-4 h-4" /> WhatsApp
                  </button>
                  <button
                    onClick={() => setPreviewTab('phone')}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm ${previewTab === 'phone' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-500'}`}
                  >
                    <Phone className="w-4 h-4" /> Phone IVR
                  </button>
                </div>
                {previewTab === 'whatsapp' ? (
                  <WhatsAppSimulator tree={tree} allNodes={nodes} />
                ) : (
                  <PhoneSimulator tree={tree} allNodes={nodes} />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
