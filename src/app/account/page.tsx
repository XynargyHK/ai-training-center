'use client'

import { useState, useEffect } from 'react'
import { User, LogOut, Edit2, Save, X, Loader2, Package, Truck, CheckCircle, Clock, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { User as SupabaseUser } from '@supabase/supabase-js'

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
  display_id: number
  email: string
  status: string
  currency_code: string
  subtotal: number
  total: number
  shipping_address?: {
    first_name?: string
    last_name?: string
    address_1?: string
    address_2?: string
    city?: string
    province?: string
    postal_code?: string
    country_code?: string
    phone?: string
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

export default function AccountPage() {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'profile' | 'orders'>('profile')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '' })
  const [socialLoading, setSocialLoading] = useState<'google' | 'facebook' | null>(null)

  // Check auth state
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setLoading(false)
    }
    checkSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })
    return () => subscription.unsubscribe()
  }, [])

  // Load profile and orders when user is available
  useEffect(() => {
    if (!user) return
    loadProfile()
    loadOrders()
  }, [user])

  const loadProfile = async () => {
    if (!user) return
    try {
      const res = await fetch(`/api/customer/account?userId=${user.id}`)
      const data = await res.json()
      if (data.success && data.profile) {
        setProfile(data.profile)
        setEditForm({
          name: data.profile.name || user.user_metadata?.full_name || '',
          email: data.profile.email || user.email || '',
          phone: data.profile.phone || ''
        })
      } else {
        // No profile yet — pre-fill from auth
        setEditForm({
          name: user.user_metadata?.full_name || user.user_metadata?.name || '',
          email: user.email || '',
          phone: ''
        })
        // Create profile
        await fetch('/api/customer/account', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            name: user.user_metadata?.full_name || user.user_metadata?.name || null,
            email: user.email || null
          })
        })
      }
    } catch (error) {
      console.error('Failed to load profile:', error)
    }
  }

  const loadOrders = async () => {
    if (!user) return
    setOrdersLoading(true)
    try {
      const res = await fetch(`/api/customer/orders?userId=${user.id}`)
      const data = await res.json()
      if (data.success) {
        setOrders(data.orders || [])
      }
    } catch (error) {
      console.error('Failed to load orders:', error)
    } finally {
      setOrdersLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Package className="w-4 h-4 text-orange-500" />
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

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Awaiting Payment'
      case 'processing':
        return 'Processing'
      case 'shipped':
        return 'Shipped'
      case 'delivered':
        return 'Delivered'
      default:
        return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-orange-100 text-orange-700'
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
      day: 'numeric'
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

  const handleSaveProfile = async () => {
    if (!user) return
    setSaving(true)
    try {
      const res = await fetch('/api/customer/account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          name: editForm.name,
          email: editForm.email,
          phone: editForm.phone
        })
      })
      const data = await res.json()
      if (data.success) {
        setProfile(data.profile)
        setEditing(false)
      }
    } catch (error) {
      console.error('Failed to save profile:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    setSocialLoading(provider)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/livechat`,
          queryParams: provider === 'google' ? { prompt: 'select_account' } : undefined
        }
      })
      if (error) {
        console.error('Social login error:', error)
        setSocialLoading(null)
      }
    } catch (err) {
      console.error('Social login failed:', err)
      setSocialLoading(null)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    // Clear all shopping carts from localStorage
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('shop_cart_')) {
        localStorage.removeItem(key)
      }
    })
    setUser(null)
    setProfile(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    )
  }

  // Not signed in — show compact social login card
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-md p-6 w-full max-w-xs">
          <div className="text-center mb-5">
            <div className="bg-black w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
              <User className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-lg font-bold text-gray-900">My Account</h1>
            <p className="text-gray-400 mt-1 text-xs">Sign in to view your profile</p>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => handleSocialLogin('google')}
              disabled={socialLoading !== null}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 text-sm"
            >
              {socialLoading === 'google' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              <span className="font-medium text-gray-700">Continue with Google</span>
            </button>

            <button
              onClick={() => handleSocialLogin('facebook')}
              disabled={socialLoading !== null}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 text-sm"
            >
              {socialLoading === 'facebook' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#1877F2">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              )}
              <span className="font-medium text-gray-700">Continue with Facebook</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Signed in — show account page with tabs
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-md mb-4">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h1 className="text-lg font-bold text-gray-900">My Account</h1>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1 text-gray-400 hover:text-red-500 transition-colors text-xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-100">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === 'profile'
                  ? 'text-black border-b-2 border-black'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <User className="w-4 h-4 inline mr-1.5" />
              Profile
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === 'orders'
                  ? 'text-black border-b-2 border-black'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Package className="w-4 h-4 inline mr-1.5" />
              Orders
              {orders.length > 0 && (
                <span className="ml-1.5 bg-gray-100 text-gray-600 text-xs px-1.5 py-0.5 rounded-full">
                  {orders.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-xl shadow-md">
            <div className="px-5 py-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Profile Information</span>
                {!editing ? (
                  <button
                    onClick={() => setEditing(true)}
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
                  >
                    <Edit2 className="w-3 h-3" />
                    Edit
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditing(false)}
                      className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-3 h-3" />
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="flex items-center gap-1 text-xs bg-black text-white px-2.5 py-1 rounded-md hover:bg-gray-800 disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                      Save
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] text-gray-400 mb-0.5">Name</label>
                  {editing ? (
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-black"
                    />
                  ) : (
                    <p className="text-sm text-gray-900">{profile?.name || editForm.name || 'Not set'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] text-gray-400 mb-0.5">Email</label>
                  <p className="text-sm text-gray-900">{user.email || 'Not set'}</p>
                </div>

                <div>
                  <label className="block text-[11px] text-gray-400 mb-0.5">Phone</label>
                  {editing ? (
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      placeholder="Enter phone number"
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-black"
                    />
                  ) : (
                    <p className="text-sm text-gray-900">{profile?.phone || 'Not set'}</p>
                  )}
                </div>

                <div className="pt-3 border-t border-gray-100">
                  <p className="text-[10px] text-gray-400">
                    Signed in via {user.app_metadata?.provider || 'email'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-3">
            {ordersLoading ? (
              <div className="bg-white rounded-xl shadow-md p-8 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : orders.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md p-8 text-center">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No orders yet</p>
                <p className="text-gray-400 text-xs mt-1">Your order history will appear here</p>
              </div>
            ) : (
              orders.map((order) => (
                <div key={order.id} className="bg-white rounded-xl shadow-md overflow-hidden">
                  {/* Order Header */}
                  <button
                    onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(order.status)}
                      <div className="text-left">
                        <div className="text-sm font-medium text-gray-900">
                          Order #{order.display_id || order.id.slice(0, 8)}
                        </div>
                        <div className="text-xs text-gray-400">{formatDate(order.created_at)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatCurrency(order.total, order.currency_code)}
                      </span>
                      {expandedOrder === order.id ? (
                        <ChevronUp className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </button>

                  {/* Order Details (Expanded) */}
                  {expandedOrder === order.id && (
                    <div className="px-4 pb-4 border-t border-gray-100">
                      {/* Status Timeline */}
                      <div className="py-4 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                          <div className={`flex flex-col items-center ${order.status === 'processing' || order.status === 'shipped' || order.status === 'delivered' ? 'text-green-500' : 'text-gray-300'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${order.status === 'processing' || order.status === 'shipped' || order.status === 'delivered' ? 'bg-green-100' : 'bg-gray-100'}`}>
                              <Clock className="w-4 h-4" />
                            </div>
                            <span className="text-[10px] mt-1">Processing</span>
                          </div>
                          <div className={`flex-1 h-0.5 mx-2 ${order.status === 'shipped' || order.status === 'delivered' ? 'bg-green-400' : 'bg-gray-200'}`} />
                          <div className={`flex flex-col items-center ${order.status === 'shipped' || order.status === 'delivered' ? 'text-green-500' : 'text-gray-300'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${order.status === 'shipped' || order.status === 'delivered' ? 'bg-green-100' : 'bg-gray-100'}`}>
                              <Truck className="w-4 h-4" />
                            </div>
                            <span className="text-[10px] mt-1">Shipped</span>
                          </div>
                          <div className={`flex-1 h-0.5 mx-2 ${order.status === 'delivered' ? 'bg-green-400' : 'bg-gray-200'}`} />
                          <div className={`flex flex-col items-center ${order.status === 'delivered' ? 'text-green-500' : 'text-gray-300'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${order.status === 'delivered' ? 'bg-green-100' : 'bg-gray-100'}`}>
                              <CheckCircle className="w-4 h-4" />
                            </div>
                            <span className="text-[10px] mt-1">Delivered</span>
                          </div>
                        </div>
                      </div>

                      {/* Tracking Info */}
                      {order.tracking_number && (
                        <div className="py-3 border-b border-gray-100">
                          <div className="text-xs text-gray-400 mb-1">Tracking</div>
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-sm font-medium text-gray-900">
                                {order.shipping_carrier || 'Carrier'}
                              </span>
                              <span className="text-sm text-gray-500 ml-2">{order.tracking_number}</span>
                            </div>
                            <a
                              href={`https://www.google.com/search?q=${order.shipping_carrier}+${order.tracking_number}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:text-blue-600"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </div>
                          {order.estimated_delivery && (
                            <div className="text-xs text-gray-400 mt-1">
                              Est. delivery: {formatDate(order.estimated_delivery)}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Order Items */}
                      <div className="py-3">
                        <div className="text-xs text-gray-400 mb-2">Items</div>
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
                                <div className="text-sm text-gray-900 truncate">{item.title}</div>
                                <div className="text-xs text-gray-400">Qty: {item.quantity}</div>
                              </div>
                              <div className="text-sm font-medium text-gray-900">
                                {formatCurrency(item.total, order.currency_code)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Order Total */}
                      <div className="pt-3 border-t border-gray-100 flex justify-between">
                        <span className="text-sm text-gray-500">Total</span>
                        <span className="text-sm font-bold text-gray-900">
                          {formatCurrency(order.total, order.currency_code)}
                        </span>
                      </div>

                      {/* Pending order notice */}
                      {order.status === 'pending' && (
                        <div className="pt-4 mt-2 bg-orange-50 -mx-4 px-4 pb-4 rounded-b-xl">
                          <p className="text-sm text-orange-700 font-medium mb-2">
                            ⏳ Payment Incomplete
                          </p>
                          <p className="text-xs text-orange-600 mb-3">
                            This order was not completed. Please add items to cart again and checkout.
                          </p>
                          <a
                            href="/hk"
                            className="inline-block px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-xs font-medium"
                          >
                            Continue Shopping
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
