'use client'

import { useState, useEffect, useCallback } from 'react'
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

function WhatsAppPreview({ tree }: { tree: IvrNode[] }) {
  const root = tree[0]
  if (!root) return <p className="text-sm text-gray-400">No menu yet</p>
  const children = root.children || []
  const greeting = root.payload?.greeting || `Welcome! I'm your AI assistant.`
  return (
    <div className="bg-[#0b141a] text-white rounded-2xl p-4 max-w-xs font-sans text-sm">
      <div className="bg-[#005c4b] rounded-lg p-3 mb-1">
        <p className="mb-2">{greeting}</p>
        {children.map((c, i) => (
          <p key={c.id}>{['', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'][i + 1]} {c.label}</p>
        ))}
        <p className="mt-2 text-gray-300">Type a number or tell me what you need.</p>
      </div>
    </div>
  )
}

function PhonePreview({ tree }: { tree: IvrNode[] }) {
  const root = tree[0]
  if (!root) return <p className="text-sm text-gray-400">No menu yet</p>
  const children = root.children || []
  const greeting = root.payload?.greeting || 'Welcome.'
  return (
    <div className="bg-gray-900 text-green-400 rounded-lg p-4 max-w-xs font-mono text-xs">
      <p className="text-green-300 mb-2">📞 Phone IVR Script:</p>
      <p className="mb-1">&quot;{greeting}</p>
      {children.map((c, i) => (
        <p key={c.id} className="ml-2">Press {i + 1} for {c.label.replace(/[^\w\s]/g, '')}.</p>
      ))}
      <p>&quot;</p>
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

  useEffect(() => {
    fetch('/api/business-units').then(r => r.json()).then(d => {
      setBusinessUnits(d.businessUnits || d || [])
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
                  {tree.length === 0 && (
                    <button
                      onClick={createRoot}
                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                    >
                      <Plus className="w-4 h-4" /> Create Root Menu
                    </button>
                  )}
                </div>
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
                  <WhatsAppPreview tree={tree} />
                ) : (
                  <PhonePreview tree={tree} />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
