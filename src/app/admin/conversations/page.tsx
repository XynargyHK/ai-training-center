'use client'

import { useState, useEffect, useRef } from 'react'

interface Conversation {
  id: string
  display_name: string
  user_identifier: string
  keywords: string[] | null
  flag_level: string
  flag_reason: string | null
  total_messages: number
  started_at: string
  analyzed_at: string | null
  last_message: {
    type: 'user' | 'ai'
    content: string
    timestamp: string
  } | null
}

interface Message {
  id: string
  message_type: 'user' | 'ai'
  content: string
  created_at: string
  has_image?: boolean
  image_url?: string
}

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [flagFilter, setFlagFilter] = useState('all')
  const [dateRange, setDateRange] = useState('7') // days
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [hoveredMessages, setHoveredMessages] = useState<Message[]>([])
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 })
  const [analyzing, setAnalyzing] = useState(false)
  const popupRef = useRef<HTMLDivElement>(null)
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch conversations
  const fetchConversations = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (flagFilter !== 'all') params.set('flag', flagFilter)

      // Calculate date range
      if (dateRange !== 'all') {
        const days = parseInt(dateRange)
        const fromDate = new Date()
        fromDate.setDate(fromDate.getDate() - days)
        params.set('from', fromDate.toISOString().split('T')[0])
      }

      const res = await fetch(`/api/admin/conversations?${params}`)
      const data = await res.json()

      if (data.success) {
        setConversations(data.conversations)
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchConversations()
  }, [flagFilter, dateRange])

  // Search with debounce
  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchConversations()
    }, 300)
    return () => clearTimeout(timeout)
  }, [search])

  // Fetch messages on hover
  const handleMouseEnter = async (conv: Conversation, event: React.MouseEvent) => {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()

    // Clear any pending timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }

    // Small delay to prevent flicker
    hoverTimeoutRef.current = setTimeout(async () => {
      setHoveredId(conv.id)
      setPopupPosition({
        top: rect.top + window.scrollY,
        left: rect.right + 10
      })

      // Fetch full conversation
      try {
        const res = await fetch('/api/admin/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'get_messages', sessionId: conv.id })
        })
        const data = await res.json()
        if (data.success) {
          setHoveredMessages(data.messages)
        }
      } catch (error) {
        console.error('Failed to fetch messages:', error)
      }
    }, 100)
  }

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }
    setHoveredId(null)
    setHoveredMessages([])
  }

  // Analyze unanalyzed conversations
  const analyzeAll = async () => {
    setAnalyzing(true)
    try {
      const res = await fetch('/api/admin/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'analyze_all_unanalyzed' })
      })
      const data = await res.json()
      if (data.success) {
        alert(data.message)
        fetchConversations()
      }
    } catch (error) {
      console.error('Failed to analyze:', error)
    } finally {
      setAnalyzing(false)
    }
  }

  // Format timestamp as 20260209:16:23
  const formatTimestamp = (dateStr: string) => {
    const d = new Date(dateStr)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const hour = String(d.getHours()).padStart(2, '0')
    const min = String(d.getMinutes()).padStart(2, '0')
    return `${year}${month}${day}:${hour}:${min}`
  }

  // Get flag emoji
  const getFlagEmoji = (level: string) => {
    if (level === 'alert') return '🚨'
    if (level === 'warning') return '⚠️'
    return ''
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Conversations</h1>
          <p className="text-gray-600">Customer service conversation history</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Search user, keywords..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Flag filter */}
            <select
              value={flagFilter}
              onChange={(e) => setFlagFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Flags</option>
              <option value="alert">🚨 Alerts Only</option>
              <option value="warning">⚠️ Warnings+</option>
            </select>

            {/* Date range */}
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="1">Today</option>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="all">All time</option>
            </select>

            {/* Analyze button */}
            <button
              onClick={analyzeAll}
              disabled={analyzing}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {analyzing ? 'Analyzing...' : 'Analyze Unanalyzed'}
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Keywords</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Message</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Flag</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Msgs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : conversations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    No conversations found
                  </td>
                </tr>
              ) : (
                conversations.map((conv) => (
                  <tr
                    key={conv.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onMouseEnter={(e) => handleMouseEnter(conv, e)}
                    onMouseLeave={handleMouseLeave}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 truncate max-w-[150px]">
                        {conv.display_name}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {conv.keywords?.slice(0, 4).map((kw, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full"
                          >
                            {kw}
                          </span>
                        )) || (
                          <span className="text-gray-400 text-xs">Not analyzed</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {conv.last_message && (
                        <div className="flex items-center gap-2 max-w-[250px]">
                          <span className={conv.last_message.type === 'user' ? 'text-green-600' : 'text-gray-600'}>
                            {conv.last_message.type === 'user' ? '👤' : '🤖'}
                          </span>
                          <span className={`truncate ${conv.last_message.type === 'user' ? 'text-green-600' : 'text-gray-600'}`}>
                            {conv.last_message.content}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-lg">
                      {getFlagEmoji(conv.flag_level)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 font-mono">
                      {formatTimestamp(conv.started_at)}
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-500">
                      {conv.total_messages}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Hover Popup */}
        {hoveredId && (
          <div
            ref={popupRef}
            className="fixed bg-white rounded-lg shadow-2xl border border-gray-200 z-50 w-[400px] max-h-[500px] overflow-hidden"
            style={{
              top: Math.min(popupPosition.top, window.innerHeight - 520),
              left: Math.min(popupPosition.left, window.innerWidth - 420)
            }}
            onMouseEnter={() => {
              if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
            }}
            onMouseLeave={handleMouseLeave}
          >
            {/* Popup Header */}
            <div className="bg-gray-50 px-4 py-3 border-b flex justify-between items-center">
              <span className="font-medium text-gray-900">
                {conversations.find(c => c.id === hoveredId)?.display_name}
              </span>
              <span className="text-xs text-gray-500 font-mono">
                {conversations.find(c => c.id === hoveredId)?.started_at &&
                  formatTimestamp(conversations.find(c => c.id === hoveredId)!.started_at)}
              </span>
            </div>

            {/* Messages */}
            <div className="p-4 overflow-y-auto max-h-[440px] space-y-3">
              {hoveredMessages.length === 0 ? (
                <div className="text-center text-gray-400 py-4">Loading...</div>
              ) : (
                hoveredMessages.map((msg) => (
                  <div key={msg.id} className="flex gap-2">
                    <span className="flex-shrink-0">
                      {msg.message_type === 'user' ? '👤' : '🤖'}
                    </span>
                    <div
                      className={`text-sm ${
                        msg.message_type === 'user' ? 'text-green-600' : 'text-gray-700'
                      }`}
                    >
                      {msg.content}
                      {msg.has_image && msg.image_url && (
                        <img
                          src={msg.image_url}
                          alt="Attached"
                          className="mt-2 max-w-[200px] rounded-lg"
                        />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
