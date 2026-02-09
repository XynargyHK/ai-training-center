'use client'

import { useState, useEffect, useRef } from 'react'

type ViewMode = 'profile' | 'chat' | 'order'

interface UserProfile {
  user_id: string
  full_name: string | null
  email: string | null
  phone: string | null
  skin_type: string | null
  skin_concerns: string[] | null
  created_at: string
  order_count: number
  chat_count: number
  last_active: string | null
}

interface ChatSession {
  id: string
  user_id: string | null
  display_name: string
  user_identifier: string
  keywords: string[] | null
  flag_level: string
  total_messages: number
  started_at: string
  last_message: {
    type: 'user' | 'ai'
    content: string
  } | null
}

interface Order {
  id: string
  display_id: number
  user_id: string
  user_name: string | null
  user_email: string | null
  status: string
  fulfillment_status: string | null
  total: number
  currency_code: string
  items: any[]
  created_at: string
  tracking_number: string | null
}

interface Message {
  id: string
  message_type: 'user' | 'ai'
  content: string
  created_at: string
}

interface PopupData {
  profile: UserProfile | null
  orders: Order[]
  chats: ChatSession[]
  messages: Message[]
}

export default function HistoryPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('chat')
  const [profiles, setProfiles] = useState<UserProfile[]>([])
  const [chats, setChats] = useState<ChatSession[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [flagFilter, setFlagFilter] = useState('all')

  // Hover popup state
  const [hoveredUserId, setHoveredUserId] = useState<string | null>(null)
  const [popupData, setPopupData] = useState<PopupData | null>(null)
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 })
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch data based on view mode
  const fetchData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('view', viewMode)
      if (search) params.set('search', search)
      if (flagFilter !== 'all') params.set('flag', flagFilter)

      const res = await fetch(`/api/admin/history?${params}`)
      const data = await res.json()

      if (data.success) {
        if (viewMode === 'profile') setProfiles(data.profiles || [])
        if (viewMode === 'chat') setChats(data.chats || [])
        if (viewMode === 'order') setOrders(data.orders || [])
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [viewMode, flagFilter])

  // Search with debounce
  useEffect(() => {
    const timeout = setTimeout(fetchData, 300)
    return () => clearTimeout(timeout)
  }, [search])

  // Fetch popup data on hover
  const handleMouseEnter = async (userId: string | null, event: React.MouseEvent) => {
    if (!userId) return

    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()

    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)

    hoverTimeoutRef.current = setTimeout(async () => {
      setHoveredUserId(userId)
      setPopupPosition({
        top: rect.top + window.scrollY,
        left: rect.right + 10
      })

      try {
        const res = await fetch('/api/admin/history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'get_user_details', userId })
        })
        const data = await res.json()
        if (data.success) {
          setPopupData(data)
        }
      } catch (error) {
        console.error('Failed to fetch user details:', error)
      }
    }, 150)
  }

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
    setHoveredUserId(null)
    setPopupData(null)
  }

  // Format timestamp
  const formatTimestamp = (dateStr: string) => {
    const d = new Date(dateStr)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const hour = String(d.getHours()).padStart(2, '0')
    const min = String(d.getMinutes()).padStart(2, '0')
    return `${year}${month}${day}:${hour}:${min}`
  }

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
          <h1 className="text-2xl font-bold text-gray-900">History</h1>
          <p className="text-gray-600">Customer profiles, conversations, and orders</p>
        </div>

        {/* View Mode Buttons + Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            {/* View Mode Buttons */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
              {[
                { id: 'profile', label: 'Profile', icon: '👤' },
                { id: 'chat', label: 'Chat', icon: '💬' },
                { id: 'order', label: 'Order', icon: '📦' }
              ].map(({ id, label, icon }) => (
                <button
                  key={id}
                  onClick={() => setViewMode(id as ViewMode)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    viewMode === id
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <span>{icon}</span>
                  {label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder={
                  viewMode === 'profile' ? 'Search name, email...' :
                  viewMode === 'chat' ? 'Search user, keywords...' :
                  'Search order #, user...'
                }
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Flag filter (only for chat view) */}
            {viewMode === 'chat' && (
              <select
                value={flagFilter}
                onChange={(e) => setFlagFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="all">All Flags</option>
                <option value="alert">🚨 Alerts Only</option>
                <option value="warning">⚠️ Warnings+</option>
              </select>
            )}
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              {/* Profile View Header */}
              {viewMode === 'profile' && (
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Orders</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Chats</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Since</th>
                </tr>
              )}

              {/* Chat View Header */}
              {viewMode === 'chat' && (
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Keywords</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Message</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Flag</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                </tr>
              )}

              {/* Order View Header */}
              {viewMode === 'order' && (
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order #</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                </tr>
              )}
            </thead>

            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : (
                <>
                  {/* Profile View Rows */}
                  {viewMode === 'profile' && (
                    profiles.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                          No profiles found
                        </td>
                      </tr>
                    ) : (
                      profiles.map((profile) => (
                        <tr
                          key={profile.user_id}
                          className="hover:bg-gray-50 cursor-pointer"
                          onMouseEnter={(e) => handleMouseEnter(profile.user_id, e)}
                          onMouseLeave={handleMouseLeave}
                        >
                          <td className="px-4 py-3 font-medium text-gray-900">
                            {profile.full_name || 'Unknown'}
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {profile.email || '-'}
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {profile.phone || '-'}
                          </td>
                          <td className="px-4 py-3 text-center text-gray-600">
                            {profile.order_count}
                          </td>
                          <td className="px-4 py-3 text-center text-gray-600">
                            {profile.chat_count}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500 font-mono">
                            {formatTimestamp(profile.created_at)}
                          </td>
                        </tr>
                      ))
                    )
                  )}

                  {/* Chat View Rows */}
                  {viewMode === 'chat' && (
                    chats.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                          No conversations found
                        </td>
                      </tr>
                    ) : (
                      chats.map((chat) => (
                        <tr
                          key={chat.id}
                          className="hover:bg-gray-50 cursor-pointer"
                          onMouseEnter={(e) => handleMouseEnter(chat.user_id, e)}
                          onMouseLeave={handleMouseLeave}
                        >
                          <td className="px-4 py-3 font-medium text-gray-900 max-w-[150px] truncate">
                            {chat.display_name}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              {chat.keywords?.slice(0, 4).map((kw, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full"
                                >
                                  {kw}
                                </span>
                              )) || <span className="text-gray-400 text-xs">-</span>}
                            </div>
                          </td>
                          <td className="px-4 py-3 max-w-[250px]">
                            {chat.last_message && (
                              <div className="flex items-center gap-2">
                                <span className={chat.last_message.type === 'user' ? 'text-blue-600' : 'text-gray-600'}>
                                  {chat.last_message.type === 'user' ? '👤' : '🤖'}
                                </span>
                                <span className={`truncate ${chat.last_message.type === 'user' ? 'text-blue-600' : 'text-gray-600'}`}>
                                  {chat.last_message.content}
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center text-lg">
                            {getFlagEmoji(chat.flag_level)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500 font-mono">
                            {formatTimestamp(chat.started_at)}
                          </td>
                        </tr>
                      ))
                    )
                  )}

                  {/* Order View Rows */}
                  {viewMode === 'order' && (
                    orders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                          No orders found
                        </td>
                      </tr>
                    ) : (
                      orders.map((order) => (
                        <tr
                          key={order.id}
                          className="hover:bg-gray-50 cursor-pointer"
                          onMouseEnter={(e) => handleMouseEnter(order.user_id, e)}
                          onMouseLeave={handleMouseLeave}
                        >
                          <td className="px-4 py-3 font-medium text-gray-900">
                            #{order.display_id}
                          </td>
                          <td className="px-4 py-3 text-gray-600 max-w-[150px] truncate">
                            {order.user_name || order.user_email || 'Guest'}
                          </td>
                          <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate">
                            {order.items?.map((i: any) => `${i.title} x${i.quantity}`).join(', ') || '-'}
                          </td>
                          <td className="px-4 py-3 text-right font-medium">
                            {order.currency_code} {(order.total / 100).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                              order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                              order.status === 'processing' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {order.fulfillment_status || order.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500 font-mono">
                            {formatTimestamp(order.created_at)}
                          </td>
                        </tr>
                      ))
                    )
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* Hover Popup */}
        {hoveredUserId && popupData && (
          <div
            className="fixed bg-white rounded-lg shadow-2xl border border-gray-200 z-50 w-[450px] max-h-[600px] overflow-hidden"
            style={{
              top: Math.min(popupPosition.top, window.innerHeight - 620),
              left: Math.min(popupPosition.left, window.innerWidth - 470)
            }}
            onMouseEnter={() => hoverTimeoutRef.current && clearTimeout(hoverTimeoutRef.current)}
            onMouseLeave={handleMouseLeave}
          >
            {/* Profile Section */}
            <div className="bg-purple-50 px-4 py-3 border-b">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">👤</span>
                <span className="font-bold text-gray-900">
                  {popupData.profile?.full_name || 'Unknown User'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-gray-500">Email:</span> {popupData.profile?.email || '-'}</div>
                <div><span className="text-gray-500">Phone:</span> {popupData.profile?.phone || '-'}</div>
                <div><span className="text-gray-500">Skin:</span> {popupData.profile?.skin_type || '-'}</div>
                <div><span className="text-gray-500">Since:</span> {popupData.profile?.created_at ? formatTimestamp(popupData.profile.created_at) : '-'}</div>
              </div>
            </div>

            {/* Orders Section */}
            <div className="px-4 py-3 border-b max-h-[150px] overflow-y-auto">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">📦</span>
                <span className="font-medium text-gray-700">Orders ({popupData.orders?.length || 0})</span>
              </div>
              {popupData.orders?.length > 0 ? (
                <div className="space-y-2">
                  {popupData.orders.slice(0, 5).map((order) => (
                    <div key={order.id} className="flex justify-between text-sm bg-gray-50 px-2 py-1 rounded">
                      <span>#{order.display_id}</span>
                      <span className="text-gray-600 truncate max-w-[150px]">
                        {order.items?.map((i: any) => i.title).join(', ')}
                      </span>
                      <span className={`text-xs px-1 rounded ${
                        order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                        order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-400 text-sm">No orders</div>
              )}
            </div>

            {/* Chats Section */}
            <div className="px-4 py-3 max-h-[250px] overflow-y-auto">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">💬</span>
                <span className="font-medium text-gray-700">Conversations ({popupData.chats?.length || 0})</span>
              </div>
              {popupData.messages?.length > 0 ? (
                <div className="space-y-2">
                  {popupData.messages.slice(0, 20).map((msg) => (
                    <div key={msg.id} className="flex gap-2">
                      <span className="flex-shrink-0">
                        {msg.message_type === 'user' ? '👤' : '🤖'}
                      </span>
                      <span className={`text-sm ${
                        msg.message_type === 'user' ? 'text-blue-600' : 'text-gray-700'
                      }`}>
                        {msg.content}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-400 text-sm">No conversations</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
