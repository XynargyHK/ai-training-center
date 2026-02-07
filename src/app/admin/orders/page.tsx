'use client'

import { useState, useEffect } from 'react'
import {
  Package, Truck, CheckCircle, Clock, Search, RefreshCw,
  ChevronDown, ChevronUp, ExternalLink, Loader2, X, Save
} from 'lucide-react'

interface OrderItem {
  id: string
  title: string
  thumbnail?: string
  quantity: number
  unit_price: number
  total: number
}

interface Order {
  id: string
  display_id: string
  email: string
  status: 'processing' | 'shipped' | 'delivered'
  fulfillment_status: string
  payment_status: string
  currency_code: string
  subtotal: number
  total: number
  shipping_address?: {
    address?: string
    city?: string
    state?: string
    postal_code?: string
    country?: string
  }
  shipping_carrier?: string
  tracking_number?: string
  estimated_delivery?: string
  shipped_at?: string
  delivered_at?: string
  created_at: string
  metadata?: {
    customer_name?: string
    customer_phone?: string
    notes?: string
  }
  order_items: OrderItem[]
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)
  const [editingOrder, setEditingOrder] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    status: '',
    shipping_carrier: '',
    tracking_number: '',
    estimated_delivery: ''
  })
  const [saving, setSaving] = useState(false)

  const loadOrders = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (searchQuery) params.set('search', searchQuery)

      const res = await fetch(`/api/admin/orders?${params}`)
      const data = await res.json()
      if (data.success) {
        setOrders(data.orders || [])
        setTotal(data.total || 0)
      }
    } catch (error) {
      console.error('Failed to load orders:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [statusFilter])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    loadOrders()
  }

  const startEditing = (order: Order) => {
    setEditingOrder(order.id)
    setEditForm({
      status: order.status,
      shipping_carrier: order.shipping_carrier || '',
      tracking_number: order.tracking_number || '',
      estimated_delivery: order.estimated_delivery || ''
    })
  }

  const cancelEditing = () => {
    setEditingOrder(null)
    setEditForm({
      status: '',
      shipping_carrier: '',
      tracking_number: '',
      estimated_delivery: ''
    })
  }

  const saveOrder = async (orderId: string) => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          status: editForm.status || undefined,
          shipping_carrier: editForm.shipping_carrier || undefined,
          tracking_number: editForm.tracking_number || undefined,
          estimated_delivery: editForm.estimated_delivery || undefined
        })
      })
      const data = await res.json()
      if (data.success) {
        // Update local state
        setOrders(prev => prev.map(o => o.id === orderId ? data.order : o))
        setEditingOrder(null)
      }
    } catch (error) {
      console.error('Failed to save order:', error)
    } finally {
      setSaving(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processing':
        return <Clock className="w-4 h-4 text-yellow-500" />
      case 'shipped':
        return <Truck className="w-4 h-4 text-blue-500" />
      case 'delivered':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      default:
        return <Package className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processing':
        return 'bg-yellow-100 text-yellow-700'
      case 'shipped':
        return 'bg-blue-100 text-blue-700'
      case 'delivered':
        return 'bg-green-100 text-green-700'
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount: number, currency: string) => {
    const symbols: Record<string, string> = {
      USD: '$',
      HKD: 'HK$',
      SGD: 'S$',
      GBP: '£',
      EUR: '€'
    }
    return `${symbols[currency] || '$'}${amount.toFixed(2)}`
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
            <p className="text-sm text-gray-500">{total} total orders</p>
          </div>
          <button
            onClick={loadOrders}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Status Filter */}
            <div className="flex gap-2">
              {['all', 'processing', 'shipped', 'delivered'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 text-sm rounded-full transition-colors capitalize ${
                    statusFilter === status
                      ? 'bg-black text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {status === 'all' ? 'All' : status}
                </button>
              ))}
            </div>

            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by email or order ID..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10"
                />
              </div>
            </form>
          </div>
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="bg-white rounded-xl shadow-sm p-8 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No orders found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                {/* Order Header */}
                <div
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                >
                  <div className="flex items-center gap-4">
                    {getStatusIcon(order.status)}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          #{order.display_id || order.id.slice(0, 8)}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {order.metadata?.customer_name || order.email} • {formatDate(order.created_at)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-medium text-gray-900">
                      {formatCurrency(order.total, order.currency_code)}
                    </span>
                    {expandedOrder === order.id ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedOrder === order.id && (
                  <div className="border-t border-gray-100 p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Customer Info */}
                      <div>
                        <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                          Customer
                        </h3>
                        <div className="text-sm text-gray-900">
                          <p>{order.metadata?.customer_name || 'N/A'}</p>
                          <p className="text-gray-500">{order.email}</p>
                          {order.metadata?.customer_phone && (
                            <p className="text-gray-500">{order.metadata.customer_phone}</p>
                          )}
                        </div>

                        {order.shipping_address && (
                          <div className="mt-4">
                            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                              Shipping Address
                            </h3>
                            <div className="text-sm text-gray-900">
                              <p>{order.shipping_address.address}</p>
                              <p>
                                {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postal_code}
                              </p>
                              <p>{order.shipping_address.country}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Order Items */}
                      <div>
                        <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                          Items
                        </h3>
                        <div className="space-y-2">
                          {order.order_items.map((item) => (
                            <div key={item.id} className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                                {item.thumbnail ? (
                                  <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover rounded" />
                                ) : (
                                  <Package className="w-5 h-5 text-gray-300" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-900 truncate">{item.title}</p>
                                <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                              </div>
                              <span className="text-sm font-medium text-gray-900">
                                {formatCurrency(item.total, order.currency_code)}
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between">
                          <span className="font-medium text-gray-900">Total</span>
                          <span className="font-bold text-gray-900">
                            {formatCurrency(order.total, order.currency_code)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status & Tracking Update */}
                    <div className="mt-6 pt-6 border-t border-gray-100">
                      {editingOrder === order.id ? (
                        <div className="space-y-4">
                          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Update Order
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Status</label>
                              <select
                                value={editForm.status}
                                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 text-sm"
                              >
                                <option value="processing">Processing</option>
                                <option value="shipped">Shipped</option>
                                <option value="delivered">Delivered</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Carrier</label>
                              <input
                                type="text"
                                value={editForm.shipping_carrier}
                                onChange={(e) => setEditForm({ ...editForm, shipping_carrier: e.target.value })}
                                placeholder="e.g. FedEx, DHL, UPS"
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Tracking Number</label>
                              <input
                                type="text"
                                value={editForm.tracking_number}
                                onChange={(e) => setEditForm({ ...editForm, tracking_number: e.target.value })}
                                placeholder="Enter tracking number"
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Est. Delivery</label>
                              <input
                                type="date"
                                value={editForm.estimated_delivery}
                                onChange={(e) => setEditForm({ ...editForm, estimated_delivery: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 text-sm"
                              />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => saveOrder(order.id)}
                              disabled={saving}
                              className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                            >
                              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                              Save Changes
                            </button>
                            <button
                              onClick={cancelEditing}
                              className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              <X className="w-4 h-4" />
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div>
                            {order.tracking_number ? (
                              <div className="flex items-center gap-3">
                                <div>
                                  <span className="text-xs text-gray-500">Tracking: </span>
                                  <span className="text-sm font-medium text-gray-900">
                                    {order.shipping_carrier} - {order.tracking_number}
                                  </span>
                                </div>
                                {order.estimated_delivery && (
                                  <span className="text-xs text-gray-500">
                                    Est. delivery: {new Date(order.estimated_delivery).toLocaleDateString()}
                                  </span>
                                )}
                                <a
                                  href={`https://www.google.com/search?q=${order.shipping_carrier}+${order.tracking_number}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-500 hover:text-blue-600"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">No tracking info yet</span>
                            )}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              startEditing(order)
                            }}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                          >
                            Update Order
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
