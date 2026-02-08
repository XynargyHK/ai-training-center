'use client'

import { useState, useEffect } from 'react'
import { X, User, LogOut, Edit2, Save, Loader2, Package, Truck, CheckCircle, Clock, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { getFontClass } from '@/lib/fonts'

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

// Phone country codes by country
const phoneCountryCodes: Record<string, { code: string; flag: string; name: string }> = {
  HK: { code: '+852', flag: '🇭🇰', name: 'Hong Kong' },
  US: { code: '+1', flag: '🇺🇸', name: 'USA' },
  SG: { code: '+65', flag: '🇸🇬', name: 'Singapore' },
  GB: { code: '+44', flag: '🇬🇧', name: 'UK' },
  CN: { code: '+86', flag: '🇨🇳', name: 'China' },
  TW: { code: '+886', flag: '🇹🇼', name: 'Taiwan' },
  JP: { code: '+81', flag: '🇯🇵', name: 'Japan' },
}

interface AccountModalProps {
  isOpen: boolean
  onClose: () => void
  onSignOut?: () => void
  headingFont?: string
  bodyFont?: string
  language?: string
  country?: string
}

export default function AccountModal({
  isOpen,
  onClose,
  onSignOut,
  headingFont = 'Josefin Sans',
  bodyFont = 'Cormorant Garamond',
  language = 'en',
  country = 'US'
}: AccountModalProps) {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'profile' | 'orders'>('profile')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [phoneCode, setPhoneCode] = useState(phoneCountryCodes[country]?.code || '+1')
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    addressCountry: ''
  })
  const [socialLoading, setSocialLoading] = useState<'google' | 'facebook' | null>(null)

  // Translations
  const t = language === 'tw' ? {
    myAccount: '我的帳戶',
    signOut: '登出',
    profile: '個人資料',
    orders: '訂單',
    profileInfo: '個人資料',
    shippingAddress: '送貨地址',
    edit: '編輯',
    cancel: '取消',
    save: '儲存',
    name: '姓名',
    email: '電郵',
    phone: '電話',
    address: '街道地址',
    city: '城市',
    state: '州/省',
    postalCode: '郵遞區號',
    country: '國家/地區',
    notSet: '未設定',
    signedInVia: '透過以下方式登入',
    noOrders: '暫無訂單',
    orderHistory: '您的訂單記錄將顯示在這裡',
    order: '訂單',
    pending: '待處理',
    processing: '處理中',
    shipped: '已發貨',
    delivered: '已送達',
    tracking: '物流追蹤',
    estDelivery: '預計送達',
    items: '商品',
    total: '總計',
    signInToView: '登入查看您的帳戶',
    continueWith: '使用以下方式繼續',
    google: 'Google',
    facebook: 'Facebook'
  } : {
    myAccount: 'My Account',
    signOut: 'Sign Out',
    profile: 'Profile',
    orders: 'Orders',
    profileInfo: 'Profile Information',
    shippingAddress: 'Shipping Address',
    edit: 'Edit',
    cancel: 'Cancel',
    save: 'Save',
    name: 'Name',
    email: 'Email',
    phone: 'Phone',
    address: 'Street Address',
    city: 'City',
    state: 'State/Province',
    postalCode: 'Postal Code',
    country: 'Country',
    notSet: 'Not set',
    signedInVia: 'Signed in via',
    noOrders: 'No orders yet',
    orderHistory: 'Your order history will appear here',
    order: 'Order',
    pending: 'Pending',
    processing: 'Processing',
    shipped: 'Shipped',
    delivered: 'Delivered',
    tracking: 'Tracking',
    estDelivery: 'Est. delivery',
    items: 'Items',
    total: 'Total',
    signInToView: 'Sign in to view your account',
    continueWith: 'Continue with',
    google: 'Google',
    facebook: 'Facebook'
  }

  // Check auth state
  useEffect(() => {
    if (!isOpen) return

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
  }, [isOpen])

  // Load profile and orders when user is available
  useEffect(() => {
    if (!user || !isOpen) return
    loadProfile()
    loadOrders()
  }, [user, isOpen])

  // Handle OAuth popup message
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      if (event.data?.type === 'OAUTH_SUCCESS' && event.data.session) {
        const { access_token, refresh_token } = event.data.session
        await supabase.auth.setSession({ access_token, refresh_token })
        setSocialLoading(null)
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  const loadProfile = async () => {
    if (!user) return
    try {
      const res = await fetch(`/api/customer/account?userId=${user.id}`)
      const data = await res.json()
      console.log('[AccountModal] loadProfile response:', data)
      console.log('[AccountModal] loadProfile shipping_address:', data.profile?.shipping_address)
      if (data.success && data.profile) {
        setProfile(data.profile)
        const addr = data.profile.shipping_address || {}
        // Parse phone - extract country code if present
        let phone = data.profile.phone || ''
        if (phone.startsWith('+')) {
          // Try to match known country codes
          for (const [, info] of Object.entries(phoneCountryCodes)) {
            if (phone.startsWith(info.code)) {
              setPhoneCode(info.code)
              phone = phone.slice(info.code.length).trim()
              break
            }
          }
        }
        setEditForm({
          name: data.profile.name || user.user_metadata?.full_name || '',
          email: data.profile.email || user.email || '',
          phone: phone,
          address: addr.address || '',
          city: addr.city || '',
          state: addr.state || '',
          postal_code: addr.postal_code || '',
          addressCountry: addr.country || country
        })
      } else {
        setEditForm({
          name: user.user_metadata?.full_name || user.user_metadata?.name || '',
          email: user.email || '',
          phone: '',
          address: '',
          city: '',
          state: '',
          postal_code: '',
          addressCountry: country
        })
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
      case 'pending': return <Clock className="w-4 h-4 text-gray-400" />
      case 'processing': return <Clock className="w-4 h-4 text-yellow-500" />
      case 'shipped': return <Truck className="w-4 h-4 text-blue-500" />
      case 'delivered': return <CheckCircle className="w-4 h-4 text-green-500" />
      default: return <Package className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return t.pending
      case 'processing': return t.processing
      case 'shipped': return t.shipped
      case 'delivered': return t.delivered
      default: return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 text-gray-600'
      case 'processing': return 'bg-yellow-100 text-yellow-700'
      case 'shipped': return 'bg-blue-100 text-blue-700'
      case 'delivered': return 'bg-green-100 text-green-700'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === 'tw' ? 'zh-TW' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount: number, currency: string) => {
    const symbols: Record<string, string> = { USD: '$', HKD: 'HK$', SGD: 'S$', GBP: '£', EUR: '€' }
    return `${symbols[currency] || '$'}${amount.toFixed(2)}`
  }

  const handleSaveProfile = async () => {
    if (!user) return
    setSaving(true)
    try {
      // Combine phone code with number
      const fullPhone = editForm.phone ? `${phoneCode} ${editForm.phone}` : ''
      // Build shipping address object
      const shippingAddress = {
        address: editForm.address,
        city: editForm.city,
        state: editForm.state,
        postal_code: editForm.postal_code,
        country: editForm.addressCountry
      }
      console.log('[AccountModal] Saving shipping address:', shippingAddress)
      const res = await fetch('/api/customer/account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          name: editForm.name,
          email: editForm.email,
          phone: fullPhone,
          shippingAddress: shippingAddress
        })
      })
      const data = await res.json()
      console.log('[AccountModal] Save response:', data)
      if (data.success) {
        console.log('[AccountModal] Saved profile shipping_address:', data.profile?.shipping_address)
        setProfile(data.profile)
        setEditing(false)
      } else {
        console.error('[AccountModal] Save failed:', data.error)
        alert('Failed to save: ' + (data.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Failed to save profile:', error)
      alert('Failed to save profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    setSocialLoading(provider)
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          skipBrowserRedirect: true,
          queryParams: provider === 'google' ? { prompt: 'select_account' } : undefined
        }
      })
      if (error) {
        console.error('Social login error:', error)
        setSocialLoading(null)
        return
      }
      if (data?.url) {
        const width = 500, height = 600
        const left = window.screenX + (window.outerWidth - width) / 2
        const top = window.screenY + (window.outerHeight - height) / 2
        window.open(data.url, 'oauth-popup', `width=${width},height=${height},left=${left},top=${top}`)
      }
    } catch (err) {
      console.error('Social login failed:', err)
      setSocialLoading(null)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setOrders([])
    onSignOut?.()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose}>
      <div
        className="absolute right-0 top-0 h-full w-full md:w-96 bg-white shadow-xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className={`text-lg font-light tracking-[0.2em] uppercase ${getFontClass(headingFont)}`}>
            {t.myAccount}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : !user ? (
            /* Not signed in - show social login */
            <div className="p-6 flex flex-col items-center justify-center h-full">
              <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                <User className="w-8 h-8 text-gray-400" />
              </div>
              <p className={`text-gray-500 mb-6 text-center ${getFontClass(bodyFont)}`}>
                {t.signInToView}
              </p>
              <div className="space-y-3 w-full max-w-xs">
                <button
                  onClick={() => handleSocialLogin('google')}
                  disabled={socialLoading !== null}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 ${getFontClass(bodyFont)}`}
                >
                  {socialLoading === 'google' ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  )}
                  <span className="font-medium text-gray-700">{t.continueWith} {t.google}</span>
                </button>
                <button
                  onClick={() => handleSocialLogin('facebook')}
                  disabled={socialLoading !== null}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 ${getFontClass(bodyFont)}`}
                >
                  {socialLoading === 'facebook' ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  )}
                  <span className="font-medium text-gray-700">{t.continueWith} {t.facebook}</span>
                </button>
              </div>
            </div>
          ) : (
            /* Signed in - show account tabs */
            <div className="flex flex-col h-full">
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
                  {t.profile}
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
                  {t.orders}
                  {orders.length > 0 && (
                    <span className="ml-1.5 bg-gray-100 text-gray-600 text-xs px-1.5 py-0.5 rounded-full">
                      {orders.length}
                    </span>
                  )}
                </button>
              </div>

              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="p-4 flex-1">
                  <div className="flex items-center justify-between mb-4">
                    <span className={`text-xs font-medium text-gray-500 uppercase tracking-wide ${getFontClass(headingFont)}`}>
                      {t.profileInfo}
                    </span>
                    {!editing ? (
                      <button
                        onClick={() => setEditing(true)}
                        className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
                      >
                        <Edit2 className="w-3 h-3" />
                        {t.edit}
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditing(false)}
                          className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-3 h-3" />
                          {t.cancel}
                        </button>
                        <button
                          onClick={handleSaveProfile}
                          disabled={saving}
                          className="flex items-center gap-1 text-xs bg-black text-white px-2.5 py-1 rounded-md hover:bg-gray-800 disabled:opacity-50"
                        >
                          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                          {t.save}
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    {/* Name */}
                    <div>
                      <label className={`block text-[11px] text-gray-400 mb-0.5 ${getFontClass(bodyFont)}`}>{t.name}</label>
                      {editing ? (
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className={`w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-black ${getFontClass(bodyFont)}`}
                        />
                      ) : (
                        <p className={`text-sm text-gray-900 ${getFontClass(bodyFont)}`}>
                          {profile?.name || editForm.name || t.notSet}
                        </p>
                      )}
                    </div>

                    {/* Email */}
                    <div>
                      <label className={`block text-[11px] text-gray-400 mb-0.5 ${getFontClass(bodyFont)}`}>{t.email}</label>
                      <p className={`text-sm text-gray-900 ${getFontClass(bodyFont)}`}>{user.email || t.notSet}</p>
                    </div>

                    {/* Phone with country code */}
                    <div>
                      <label className={`block text-[11px] text-gray-400 mb-0.5 ${getFontClass(bodyFont)}`}>{t.phone}</label>
                      {editing ? (
                        <div className="flex gap-2">
                          <select
                            value={phoneCode}
                            onChange={(e) => setPhoneCode(e.target.value)}
                            className={`px-2 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-black ${getFontClass(bodyFont)}`}
                          >
                            {Object.entries(phoneCountryCodes).map(([key, info]) => (
                              <option key={key} value={info.code}>{info.flag} {info.code}</option>
                            ))}
                          </select>
                          <input
                            type="tel"
                            value={editForm.phone}
                            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                            placeholder="1234 5678"
                            className={`flex-1 px-2.5 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-black ${getFontClass(bodyFont)}`}
                          />
                        </div>
                      ) : (
                        <p className={`text-sm text-gray-900 ${getFontClass(bodyFont)}`}>{profile?.phone || t.notSet}</p>
                      )}
                    </div>

                    {/* Shipping Address Section */}
                    <div className="pt-3 border-t border-gray-100">
                      <label className={`block text-[11px] text-gray-400 mb-2 ${getFontClass(bodyFont)}`}>{t.shippingAddress}</label>

                      {editing ? (
                        <div className="space-y-3">
                          <input
                            type="text"
                            value={editForm.address}
                            onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                            placeholder={t.address}
                            className={`w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-black ${getFontClass(bodyFont)}`}
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={editForm.city}
                              onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                              placeholder={t.city}
                              className={`px-2.5 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-black ${getFontClass(bodyFont)}`}
                            />
                            <input
                              type="text"
                              value={editForm.state}
                              onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                              placeholder={t.state}
                              className={`px-2.5 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-black ${getFontClass(bodyFont)}`}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={editForm.postal_code}
                              onChange={(e) => setEditForm({ ...editForm, postal_code: e.target.value })}
                              placeholder={t.postalCode}
                              className={`px-2.5 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-black ${getFontClass(bodyFont)}`}
                            />
                            <input
                              type="text"
                              value={editForm.addressCountry}
                              onChange={(e) => setEditForm({ ...editForm, addressCountry: e.target.value })}
                              placeholder={t.country}
                              className={`px-2.5 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-black ${getFontClass(bodyFont)}`}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className={`text-sm text-gray-900 ${getFontClass(bodyFont)}`}>
                          {profile?.shipping_address?.address ? (
                            <>
                              <p>{profile.shipping_address.address}</p>
                              <p>{profile.shipping_address.city}{profile.shipping_address.state ? `, ${profile.shipping_address.state}` : ''} {profile.shipping_address.postal_code}</p>
                              <p>{profile.shipping_address.country}</p>
                            </>
                          ) : (
                            <p className="text-gray-400">{t.notSet}</p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-gray-100">
                      <p className={`text-[10px] text-gray-400 ${getFontClass(bodyFont)}`}>
                        {t.signedInVia} {user.app_metadata?.provider || 'email'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Orders Tab */}
              {activeTab === 'orders' && (
                <div className="p-4 flex-1 overflow-y-auto">
                  {ordersLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className={`text-gray-500 text-sm ${getFontClass(bodyFont)}`}>{t.noOrders}</p>
                      <p className={`text-gray-400 text-xs mt-1 ${getFontClass(bodyFont)}`}>{t.orderHistory}</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {orders.map((order) => (
                        <div key={order.id} className="border border-gray-200 rounded-lg overflow-hidden">
                          <button
                            onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                            className="w-full px-3 py-2.5 flex items-center justify-between hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              {getStatusIcon(order.status)}
                              <div className="text-left">
                                <div className={`text-sm font-medium text-gray-900 ${getFontClass(headingFont)}`}>
                                  {t.order} #{order.display_id || order.id.slice(0, 8)}
                                </div>
                                <div className={`text-xs text-gray-400 ${getFontClass(bodyFont)}`}>
                                  {formatDate(order.created_at)}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(order.status)}`}>
                                {getStatusLabel(order.status)}
                              </span>
                              <span className={`text-sm font-medium text-gray-900 ${getFontClass(headingFont)}`}>
                                {formatCurrency(order.total, order.currency_code)}
                              </span>
                              {expandedOrder === order.id ? (
                                <ChevronUp className="w-4 h-4 text-gray-400" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-gray-400" />
                              )}
                            </div>
                          </button>

                          {expandedOrder === order.id && (
                            <div className="px-3 pb-3 border-t border-gray-100">
                              {/* Tracking */}
                              {order.tracking_number && (
                                <div className="py-2 border-b border-gray-100">
                                  <div className={`text-xs text-gray-400 mb-1 ${getFontClass(bodyFont)}`}>{t.tracking}</div>
                                  <div className="flex items-center justify-between">
                                    <span className={`text-sm ${getFontClass(bodyFont)}`}>
                                      {order.shipping_carrier} {order.tracking_number}
                                    </span>
                                    <a
                                      href={`https://www.google.com/search?q=${order.shipping_carrier}+${order.tracking_number}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-500"
                                    >
                                      <ExternalLink className="w-4 h-4" />
                                    </a>
                                  </div>
                                  {order.estimated_delivery && (
                                    <div className={`text-xs text-gray-400 mt-1 ${getFontClass(bodyFont)}`}>
                                      {t.estDelivery}: {formatDate(order.estimated_delivery)}
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Items */}
                              <div className="py-2">
                                <div className={`text-xs text-gray-400 mb-2 ${getFontClass(bodyFont)}`}>{t.items}</div>
                                {order.order_items.map((item) => (
                                  <div key={item.id} className="flex items-center gap-2 py-1">
                                    <div className="w-8 h-8 bg-gray-100 rounded flex-shrink-0">
                                      {item.thumbnail && (
                                        <img src={item.thumbnail} alt="" className="w-full h-full object-cover rounded" />
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className={`text-sm truncate ${getFontClass(bodyFont)}`}>{item.title}</div>
                                      <div className={`text-xs text-gray-400 ${getFontClass(bodyFont)}`}>x{item.quantity}</div>
                                    </div>
                                    <div className={`text-sm ${getFontClass(bodyFont)}`}>
                                      {formatCurrency(item.total, order.currency_code)}
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Total */}
                              <div className="pt-2 border-t border-gray-100 flex justify-between">
                                <span className={`text-sm text-gray-500 ${getFontClass(bodyFont)}`}>{t.total}</span>
                                <span className={`text-sm font-bold ${getFontClass(headingFont)}`}>
                                  {formatCurrency(order.total, order.currency_code)}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sign Out Footer */}
        {user && (
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleSignOut}
              className={`w-full flex items-center justify-center gap-2 py-2 text-gray-500 hover:text-red-500 transition-colors ${getFontClass(bodyFont)}`}
            >
              <LogOut className="w-4 h-4" />
              {t.signOut}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
