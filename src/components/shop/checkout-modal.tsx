'use client'

import { useState, useEffect } from 'react'
import { X, CreditCard, AlertCircle, CheckCircle2 } from 'lucide-react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { getFontClass } from '@/lib/fonts'
import { supabase } from '@/lib/supabase'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '')

// Translations for checkout modal
const translations: Record<string, Record<string, string>> = {
  en: {
    checkout: 'Checkout',
    payment: 'Payment',
    orderConfirmed: 'Order Confirmed',
    orderSummary: 'Order Summary',
    total: 'Total',
    contactInfo: 'Contact Information',
    fullName: 'Full Name',
    email: 'Email',
    phoneOptional: 'Phone (Optional)',
    shippingAddress: 'Shipping Address (Optional)',
    streetAddress: 'Street Address',
    city: 'City',
    state: 'State',
    postalCode: 'Postal Code',
    country: 'Country',
    cancel: 'Cancel',
    continueToPayment: 'Continue to Payment',
    paymentInfo: 'Payment Information',
    processing: 'Processing...',
    pay: 'Pay',
    paymentSuccessful: 'Payment Successful!',
    orderConfirmationMsg: "Your order has been confirmed. We've sent a confirmation email to",
    orderId: 'Order ID',
    close: 'Close',
    required: '*',
    fillNameEmail: 'Please fill in your name and email',
    paymentFailed: 'Payment failed. Please try again.',
    failedInitPayment: 'Failed to initialize payment',
    quickFill: 'Quick fill with',
    or: 'or enter manually below',
  },
  tw: {
    checkout: '結帳',
    payment: '付款',
    orderConfirmed: '訂單已確認',
    orderSummary: '訂單摘要',
    total: '總計',
    contactInfo: '聯絡資料',
    fullName: '全名',
    email: '電郵',
    phoneOptional: '電話（選填）',
    shippingAddress: '送貨地址（選填）',
    streetAddress: '街道地址',
    city: '城市',
    state: '州/省',
    postalCode: '郵遞區號',
    country: '國家',
    cancel: '取消',
    continueToPayment: '繼續付款',
    paymentInfo: '付款資料',
    processing: '處理中...',
    pay: '支付',
    paymentSuccessful: '付款成功！',
    orderConfirmationMsg: '您的訂單已確認。我們已發送確認電郵至',
    orderId: '訂單編號',
    close: '關閉',
    required: '*',
    fillNameEmail: '請填寫您的姓名和電郵',
    paymentFailed: '付款失敗，請重試。',
    failedInitPayment: '無法初始化付款',
    quickFill: '快速填寫',
    or: '或在下方手動輸入',
  }
}

interface CartItem {
  product: {
    id: string
    title: string
    description?: string
    cost_price?: number
    compare_at_price?: number
    thumbnail?: string
  }
  quantity: number
}

// Currency mapping by country
const countryCurrencyMap: Record<string, string> = {
  US: 'usd',
  HK: 'hkd',
  SG: 'sgd',
  GB: 'gbp',
  EU: 'eur',
  JP: 'jpy',
  CN: 'cny',
  TW: 'twd',
}

// Currency symbol mapping
const currencySymbolMap: Record<string, string> = {
  usd: '$',
  hkd: 'HK$',
  sgd: 'S$',
  gbp: '£',
  eur: '€',
  jpy: '¥',
  cny: '¥',
  twd: 'NT$',
}

interface CheckoutModalProps {
  isOpen: boolean
  onClose: () => void
  cart: CartItem[]
  onSuccess: (orderId: string) => void
  businessUnitParam?: string
  country?: string
  headingFont?: string
  bodyFont?: string
  language?: string
  enableSocialLogin?: boolean
}

function CheckoutForm({
  cart,
  onSuccess,
  onClose,
  customerInfo,
  shippingAddress,
  total,
  headingFont = 'Josefin Sans',
  bodyFont = 'Cormorant Garamond',
  language = 'en',
  currencySymbol = '$',
  currency = 'usd',
  userId
}: {
  cart: CartItem[]
  onSuccess: (orderId: string) => void
  onClose: () => void
  customerInfo: any
  shippingAddress: any
  total: number
  headingFont?: string
  bodyFont?: string
  language?: string
  currencySymbol?: string
  currency?: string
  userId?: string
}) {
  const t = translations[language] || translations.en
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsProcessing(true)
    setErrorMessage('')

    try {
      // First, create the order
      const orderResponse = await fetch('/api/shop/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: customerInfo,
          shipping_address: shippingAddress,
          items: cart.map(item => ({
            product_id: item.product.id,
            title: item.product.title,
            thumbnail: item.product.thumbnail || '',
            quantity: item.quantity,
            unit_price: item.product.cost_price || 0
          })),
          subtotal: total,
          total: total,
          currency: currency,
          user_id: userId
        })
      })

      const orderData = await orderResponse.json()

      if (!orderData.success) {
        throw new Error(orderData.error || 'Failed to create order')
      }

      // Submit the payment
      const { error: submitError } = await elements.submit()
      if (submitError) {
        throw new Error(submitError.message)
      }

      // Confirm the payment
      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/livechat?businessUnit=${new URLSearchParams(window.location.search).get('businessUnit') || ''}`,
        },
        redirect: 'if_required'
      })

      if (confirmError) {
        throw new Error(confirmError.message)
      }

      // Confirm payment with backend
      console.log('Payment intent status:', paymentIntent?.status)

      if (paymentIntent?.status === 'succeeded') {
        await fetch('/api/shop/confirm-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: orderData.order.id,
            paymentIntentId: paymentIntent.id
          })
        })

        onSuccess(orderData.order.id)
      } else if (paymentIntent?.status === 'processing') {
        // Payment is still processing, show success anyway (will be confirmed via webhook)
        onSuccess(orderData.order.id)
      } else if (paymentIntent?.status === 'requires_action') {
        // 3D Secure or other action required - Stripe handles this automatically
        // If we reach here without redirect, something went wrong
        throw new Error('Additional authentication required. Please try again.')
      } else {
        // Unknown status
        console.error('Unexpected payment status:', paymentIntent?.status)
        throw new Error(`Payment status: ${paymentIntent?.status || 'unknown'}. Please try again.`)
      }
    } catch (error: any) {
      console.error('Payment error:', error)
      setErrorMessage(error.message || 'Payment failed. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Payment Element */}
      <div>
        <label className={`block text-sm font-medium text-gray-700 mb-2 ${getFontClass(bodyFont)}`}>
          {t.paymentInfo}
        </label>
        <PaymentElement />
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className={`text-sm text-red-800 ${getFontClass(bodyFont)}`}>{errorMessage}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onClose}
          className={`flex-1 px-6 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors font-bold tracking-[0.15em] uppercase ${getFontClass(headingFont)}`}
          disabled={isProcessing}
        >
          {t.cancel}
        </button>
        <button
          type="submit"
          disabled={!stripe || isProcessing}
          className={`flex-1 px-6 py-3 bg-black text-white hover:bg-gray-800 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-bold tracking-[0.15em] uppercase ${getFontClass(headingFont)}`}
        >
          {isProcessing ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {t.processing}
            </>
          ) : (
            <>
              <CreditCard className="w-5 h-5" />
              {t.pay} {currencySymbol}{total.toFixed(2)}
            </>
          )}
        </button>
      </div>
    </form>
  )
}

export default function CheckoutModal({
  isOpen,
  onClose,
  cart,
  onSuccess,
  businessUnitParam = '',
  country = 'US',
  headingFont = 'Josefin Sans',
  bodyFont = 'Cormorant Garamond',
  language = 'en',
  enableSocialLogin = false
}: CheckoutModalProps) {
  const t = translations[language] || translations.en
  const currency = countryCurrencyMap[country] || 'usd'
  const currencySymbol = currencySymbolMap[currency] || '$'

  console.log('[CheckoutModal] country:', country, 'currency:', currency)
  const [step, setStep] = useState<'login' | 'info' | 'payment' | 'success'>('login')
  const [clientSecret, setClientSecret] = useState('')
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: ''
  })
  const [shippingAddress, setShippingAddress] = useState({
    address: '',
    city: '',
    state: '',
    postal_code: '',
    country: country || 'US'
  })
  const [orderId, setOrderId] = useState('')

  // Calculate total
  const total = cart.reduce((sum, item) =>
    sum + (item.product.cost_price || 0) * item.quantity, 0
  )

  const [socialLoading, setSocialLoading] = useState<'google' | 'facebook' | null>(null)

  // Check auth state on mount and reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setClientSecret('')
      setOrderId('')

      // Check if user is already logged in
      const checkAuth = async () => {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          setCurrentUser(session.user)
          const meta = session.user.user_metadata || {}
          setCustomerInfo({
            name: meta.full_name || meta.name || '',
            email: session.user.email || '',
            phone: meta.phone || ''
          })

          // Load saved profile including shipping address
          try {
            const res = await fetch(`/api/customer/account?userId=${session.user.id}`)
            const data = await res.json()
            if (data.success && data.profile) {
              // Pre-fill from saved profile
              if (data.profile.name) setCustomerInfo(prev => ({ ...prev, name: data.profile.name }))
              if (data.profile.phone) setCustomerInfo(prev => ({ ...prev, phone: data.profile.phone }))
              // Pre-fill saved shipping address
              if (data.profile.shipping_address) {
                setShippingAddress(data.profile.shipping_address)
              }
            }
          } catch (err) {
            console.error('Failed to load profile:', err)
          }

          setStep('info')
        } else {
          setCurrentUser(null)
          setStep('login')
        }
      }
      checkAuth()
    }
  }, [isOpen])

  // Listen for auth state changes (social login callback)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const user = session.user
        const meta = user.user_metadata || {}
        setCurrentUser(user)
        // Auto-fill customer info from social login
        setCustomerInfo({
          name: meta.full_name || meta.name || '',
          email: user.email || '',
          phone: meta.phone || ''
        })
        setSocialLoading(null)
        // Move to info step after login
        setStep('info')

        // Save to customer_profiles
        try {
          await fetch('/api/customer/account', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user.id,
              name: meta.full_name || meta.name || null,
              email: user.email || null
            })
          })
        } catch (err) {
          console.error('Failed to save profile:', err)
        }
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null)
        setStep('login')
      }
    })
    return () => subscription.unsubscribe()
  }, [])


  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    setSocialLoading(provider)
    try {
      // Build callback URL for popup
      const callbackUrl = `${window.location.origin}/auth/callback`

      // Get the OAuth URL with our callback
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          skipBrowserRedirect: true,  // Don't redirect main window
          redirectTo: callbackUrl,
          queryParams: provider === 'google' ? { prompt: 'select_account' } : undefined
        }
      })

      if (error) {
        console.error('Social login error:', error)
        setSocialLoading(null)
        return
      }

      if (data?.url) {
        // Open OAuth in a popup window
        const width = 500
        const height = 600
        const left = window.screenX + (window.outerWidth - width) / 2
        const top = window.screenY + (window.outerHeight - height) / 2

        const popup = window.open(
          data.url,
          'oauth-popup',
          `width=${width},height=${height},left=${left},top=${top},popup=true`
        )

        // Listen for message from popup
        const handleMessage = async (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return
          if (event.data?.type === 'OAUTH_SUCCESS') {
            window.removeEventListener('message', handleMessage)

            const { session } = event.data
            if (session?.user) {
              // Set the session in main window's Supabase client
              await supabase.auth.setSession({
                access_token: session.access_token,
                refresh_token: session.refresh_token
              })

              const meta = session.user.user_metadata || {}
              setCurrentUser(session.user)
              setCustomerInfo({
                name: meta.full_name || meta.name || '',
                email: session.user.email || '',
                phone: meta.phone || ''
              })
              setStep('info')

              // Save profile
              try {
                await fetch('/api/customer/account', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    userId: session.user.id,
                    name: meta.full_name || meta.name || null,
                    email: session.user.email || null
                  })
                })
              } catch (err) {
                console.error('Failed to save profile:', err)
              }
            }
            setSocialLoading(null)
          }
        }
        window.addEventListener('message', handleMessage)

        // Also poll for popup close (in case message fails)
        const pollTimer = setInterval(async () => {
          if (popup?.closed) {
            clearInterval(pollTimer)
            window.removeEventListener('message', handleMessage)
            setSocialLoading(null)
          }
        }, 1000)

        // Timeout after 5 minutes
        setTimeout(() => {
          clearInterval(pollTimer)
          window.removeEventListener('message', handleMessage)
          setSocialLoading(null)
        }, 5 * 60 * 1000)
      }
    } catch (err) {
      console.error('Social login failed:', err)
      setSocialLoading(null)
    }
  }

  const handleContinueToPayment = async () => {
    // Validate customer info
    if (!customerInfo.name || !customerInfo.email) {
      alert(t.fillNameEmail)
      return
    }

    try {
      // Create payment intent
      const response = await fetch('/api/shop/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: total,
          currency: currency,
          metadata: {
            customer_email: customerInfo.email,
            customer_name: customerInfo.name
          }
        })
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      setClientSecret(data.clientSecret)
      setStep('payment')
    } catch (error: any) {
      console.error('Error creating payment intent:', error)
      alert(error.message || t.failedInitPayment)
    }
  }

  const handlePaymentSuccess = async (orderId: string) => {
    setOrderId(orderId)
    setStep('success')
    onSuccess(orderId)

    // Save shipping address to customer profile for next time
    if (currentUser?.id && shippingAddress.address) {
      try {
        await fetch('/api/customer/account', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: currentUser.id,
            shippingAddress: shippingAddress
          })
        })
      } catch (err) {
        console.error('Failed to save shipping address:', err)
      }
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={step !== 'payment' ? onClose : undefined}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className={`text-xl font-light tracking-[0.2em] uppercase text-gray-900 ${getFontClass(headingFont)}`}>
            {step === 'login' && (language === 'tw' ? '登入' : 'Sign In')}
            {step === 'info' && t.checkout}
            {step === 'payment' && t.payment}
            {step === 'success' && t.orderConfirmed}
          </h2>
          {step !== 'payment' && step !== 'login' && (
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step 0: Login Required */}
          {step === 'login' && (
            <div className="space-y-6">
              {/* Order Summary */}
              <div>
                <h3 className={`font-light tracking-[0.15em] uppercase text-gray-900 mb-3 ${getFontClass(headingFont)}`}>{t.orderSummary}</h3>
                <div className="space-y-2">
                  {cart.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className={`text-gray-600 font-light ${getFontClass(bodyFont)}`}>
                        {item.product.title} x {item.quantity}
                      </span>
                      <span className={`font-bold text-gray-900 ${getFontClass(headingFont)}`}>
                        {currencySymbol}{((item.product.cost_price || 0) * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                  <div className={`border-t border-gray-200 pt-2 mt-2 flex justify-between font-bold ${getFontClass(headingFont)}`}>
                    <span>{t.total}</span>
                    <span>{currencySymbol}{total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Login Message */}
              <div className="text-center py-4">
                <p className={`text-gray-600 mb-6 font-light ${getFontClass(bodyFont)}`}>
                  {language === 'tw' ? '請先登入以繼續結帳' : 'Please sign in to continue checkout'}
                </p>

                {/* Social Login Buttons */}
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => handleSocialLogin('google')}
                    disabled={socialLoading !== null}
                    className={`w-full flex items-center justify-center gap-3 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 ${getFontClass(bodyFont)}`}
                  >
                    {socialLoading === 'google' ? (
                      <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                    )}
                    <span>{language === 'tw' ? '使用 Google 登入' : 'Continue with Google'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSocialLogin('facebook')}
                    disabled={socialLoading !== null}
                    className={`w-full flex items-center justify-center gap-3 px-6 py-3 bg-[#1877F2] text-white rounded-lg hover:bg-[#166FE5] transition-colors disabled:opacity-50 ${getFontClass(bodyFont)}`}
                  >
                    {socialLoading === 'facebook' ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                    )}
                    <span>{language === 'tw' ? '使用 Facebook 登入' : 'Continue with Facebook'}</span>
                  </button>
                </div>
              </div>

              {/* Cancel Button */}
              <div className="pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onClose}
                  className={`w-full px-6 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors font-bold tracking-[0.15em] uppercase ${getFontClass(headingFont)}`}
                >
                  {t.cancel}
                </button>
              </div>
            </div>
          )}

          {/* Step 1: Customer Information */}
          {step === 'info' && (
            <div className="space-y-6">
              {/* Order Summary */}
              <div>
                <h3 className={`font-light tracking-[0.15em] uppercase text-gray-900 mb-3 ${getFontClass(headingFont)}`}>{t.orderSummary}</h3>
                <div className="space-y-2">
                  {cart.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className={`text-gray-600 font-light ${getFontClass(bodyFont)}`}>
                        {item.product.title} x {item.quantity}
                      </span>
                      <span className={`font-bold text-gray-900 ${getFontClass(headingFont)}`}>
                        {currencySymbol}{((item.product.cost_price || 0) * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                  <div className={`border-t border-gray-200 pt-2 mt-2 flex justify-between font-bold ${getFontClass(headingFont)}`}>
                    <span>{t.total}</span>
                    <span>{currencySymbol}{total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Social Login - Quick Fill */}
              {enableSocialLogin && (
              <div>
                <h3 className={`font-light tracking-[0.15em] uppercase text-gray-900 mb-3 ${getFontClass(headingFont)}`}>{t.quickFill}</h3>
                <div className="flex gap-3 mb-3">
                  <button
                    type="button"
                    onClick={() => handleSocialLogin('google')}
                    disabled={socialLoading !== null}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    {socialLoading === 'google' ? (
                      <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                    )}
                    <span className={`text-sm font-medium text-gray-700 ${getFontClass(bodyFont)}`}>Google</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSocialLogin('facebook')}
                    disabled={socialLoading !== null}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    {socialLoading === 'facebook' ? (
                      <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                    )}
                    <span className={`text-sm font-medium text-gray-700 ${getFontClass(bodyFont)}`}>Facebook</span>
                  </button>
                </div>
                <div className="flex items-center gap-3 mb-1">
                  <div className="flex-1 border-t border-gray-200" />
                  <span className={`text-xs text-gray-400 ${getFontClass(bodyFont)}`}>{t.or}</span>
                  <div className="flex-1 border-t border-gray-200" />
                </div>
              </div>
              )}

              {/* Customer Info Form */}
              <div>
                <h3 className={`font-light tracking-[0.15em] uppercase text-gray-900 mb-3 ${getFontClass(headingFont)}`}>{t.contactInfo}</h3>
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium text-gray-700 mb-1 ${getFontClass(bodyFont)}`}>
                      {t.fullName} {t.required}
                    </label>
                    <input
                      type="text"
                      required
                      value={customerInfo.name}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      placeholder={language === 'tw' ? '陳大文' : 'John Doe'}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium text-gray-700 mb-1 ${getFontClass(bodyFont)}`}>
                      {t.email} {t.required}
                    </label>
                    <input
                      type="email"
                      required
                      value={customerInfo.email}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      placeholder="john@example.com"
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium text-gray-700 mb-1 ${getFontClass(bodyFont)}`}>
                      {t.phoneOptional}
                    </label>
                    <input
                      type="tel"
                      value={customerInfo.phone}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      placeholder={language === 'tw' ? '+852 1234 5678' : '+1 (555) 123-4567'}
                    />
                  </div>
                </div>
              </div>

              {/* Shipping Address Form */}
              <div>
                <h3 className={`font-light tracking-[0.15em] uppercase text-gray-900 mb-3 ${getFontClass(headingFont)}`}>{t.shippingAddress}</h3>
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium text-gray-700 mb-1 ${getFontClass(bodyFont)}`}>
                      {t.streetAddress}
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.address}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, address: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      placeholder={language === 'tw' ? '中環德輔道中123號' : '123 Main St'}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium text-gray-700 mb-1 ${getFontClass(bodyFont)}`}>
                        {t.city}
                      </label>
                      <input
                        type="text"
                        value={shippingAddress.city}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                        placeholder={language === 'tw' ? '香港' : 'New York'}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium text-gray-700 mb-1 ${getFontClass(bodyFont)}`}>
                        {t.state}
                      </label>
                      <input
                        type="text"
                        value={shippingAddress.state}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                        placeholder={language === 'tw' ? '香港島' : 'NY'}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium text-gray-700 mb-1 ${getFontClass(bodyFont)}`}>
                        {t.postalCode}
                      </label>
                      <input
                        type="text"
                        value={shippingAddress.postal_code}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, postal_code: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                        placeholder="10001"
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium text-gray-700 mb-1 ${getFontClass(bodyFont)}`}>
                        {t.country}
                      </label>
                      <input
                        type="text"
                        value={shippingAddress.country}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, country: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                        placeholder={language === 'tw' ? '香港' : 'US'}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Continue Button */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className={`flex-1 px-6 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors font-bold tracking-[0.15em] uppercase ${getFontClass(headingFont)}`}
                >
                  {t.cancel}
                </button>
                <button
                  onClick={handleContinueToPayment}
                  className={`flex-1 px-6 py-3 bg-black text-white hover:bg-gray-800 transition-colors shadow-lg font-bold tracking-[0.15em] uppercase ${getFontClass(headingFont)}`}
                >
                  {t.continueToPayment}
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Payment */}
          {step === 'payment' && clientSecret && (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <CheckoutForm
                cart={cart}
                onSuccess={handlePaymentSuccess}
                onClose={onClose}
                customerInfo={customerInfo}
                shippingAddress={shippingAddress}
                total={total}
                headingFont={headingFont}
                bodyFont={bodyFont}
                language={language}
                currencySymbol={currencySymbol}
                currency={currency}
                userId={currentUser?.id}
              />
            </Elements>
          )}

          {/* Step 3: Success */}
          {step === 'success' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <h3 className={`text-2xl font-light tracking-[0.2em] uppercase text-gray-900 mb-2 ${getFontClass(headingFont)}`}>
                {t.paymentSuccessful}
              </h3>
              <p className={`text-gray-600 mb-6 font-light ${getFontClass(bodyFont)}`}>
                {t.orderConfirmationMsg} {customerInfo.email}
              </p>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                <p className={`text-sm text-gray-600 mb-1 font-light ${getFontClass(bodyFont)}`}>{t.orderId}</p>
                <p className={`font-mono font-bold text-gray-900 ${getFontClass(headingFont)}`}>{orderId}</p>
              </div>
              <button
                onClick={onClose}
                className={`px-6 py-3 bg-black text-white hover:bg-gray-800 transition-colors shadow-lg font-bold tracking-[0.15em] uppercase ${getFontClass(headingFont)}`}
              >
                {t.close}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
