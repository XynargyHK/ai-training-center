'use client'

import { useState, useEffect } from 'react'
import { X, CreditCard, AlertCircle, CheckCircle2 } from 'lucide-react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { getFontClass } from '@/lib/fonts'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '')

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

interface CheckoutModalProps {
  isOpen: boolean
  onClose: () => void
  cart: CartItem[]
  onSuccess: (orderId: string) => void
  businessUnitParam?: string
  headingFont?: string
  bodyFont?: string
}

function CheckoutForm({
  cart,
  onSuccess,
  onClose,
  customerInfo,
  shippingAddress,
  total,
  headingFont = 'Josefin Sans',
  bodyFont = 'Cormorant Garamond'
}: {
  cart: CartItem[]
  onSuccess: (orderId: string) => void
  onClose: () => void
  customerInfo: any
  shippingAddress: any
  total: number
  headingFont?: string
  bodyFont?: string
}) {
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
          total: total
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
          Payment Information
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
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || isProcessing}
          className={`flex-1 px-6 py-3 bg-black text-white hover:bg-gray-800 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-bold tracking-[0.15em] uppercase ${getFontClass(headingFont)}`}
        >
          {isProcessing ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="w-5 h-5" />
              Pay ${total.toFixed(2)}
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
  headingFont = 'Josefin Sans',
  bodyFont = 'Cormorant Garamond'
}: CheckoutModalProps) {
  const [step, setStep] = useState<'info' | 'payment' | 'success'>('info')
  const [clientSecret, setClientSecret] = useState('')
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
    country: 'US'
  })
  const [orderId, setOrderId] = useState('')

  // Calculate total
  const total = cart.reduce((sum, item) =>
    sum + (item.product.cost_price || 0) * item.quantity, 0
  )

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('info')
      setClientSecret('')
      setOrderId('')
    }
  }, [isOpen])

  const handleContinueToPayment = async () => {
    // Validate customer info
    if (!customerInfo.name || !customerInfo.email) {
      alert('Please fill in your name and email')
      return
    }

    try {
      // Create payment intent
      const response = await fetch('/api/shop/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: total,
          currency: 'usd',
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
      alert(error.message || 'Failed to initialize payment')
    }
  }

  const handlePaymentSuccess = (orderId: string) => {
    setOrderId(orderId)
    setStep('success')
    onSuccess(orderId)
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
            {step === 'info' && 'Checkout'}
            {step === 'payment' && 'Payment'}
            {step === 'success' && 'Order Confirmed'}
          </h2>
          {step !== 'payment' && (
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
          {/* Step 1: Customer Information */}
          {step === 'info' && (
            <div className="space-y-6">
              {/* Order Summary */}
              <div>
                <h3 className={`font-light tracking-[0.15em] uppercase text-gray-900 mb-3 ${getFontClass(headingFont)}`}>Order Summary</h3>
                <div className="space-y-2">
                  {cart.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className={`text-gray-600 font-light ${getFontClass(bodyFont)}`}>
                        {item.product.title} x {item.quantity}
                      </span>
                      <span className={`font-bold text-gray-900 ${getFontClass(headingFont)}`}>
                        ${((item.product.cost_price || 0) * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                  <div className={`border-t border-gray-200 pt-2 mt-2 flex justify-between font-bold ${getFontClass(headingFont)}`}>
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Customer Info Form */}
              <div>
                <h3 className={`font-light tracking-[0.15em] uppercase text-gray-900 mb-3 ${getFontClass(headingFont)}`}>Contact Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium text-gray-700 mb-1 ${getFontClass(bodyFont)}`}>
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={customerInfo.name}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium text-gray-700 mb-1 ${getFontClass(bodyFont)}`}>
                      Email *
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
                      Phone (Optional)
                    </label>
                    <input
                      type="tel"
                      value={customerInfo.phone}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>
              </div>

              {/* Shipping Address Form */}
              <div>
                <h3 className={`font-light tracking-[0.15em] uppercase text-gray-900 mb-3 ${getFontClass(headingFont)}`}>Shipping Address (Optional)</h3>
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium text-gray-700 mb-1 ${getFontClass(bodyFont)}`}>
                      Street Address
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.address}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, address: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      placeholder="123 Main St"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium text-gray-700 mb-1 ${getFontClass(bodyFont)}`}>
                        City
                      </label>
                      <input
                        type="text"
                        value={shippingAddress.city}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                        placeholder="New York"
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium text-gray-700 mb-1 ${getFontClass(bodyFont)}`}>
                        State
                      </label>
                      <input
                        type="text"
                        value={shippingAddress.state}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                        placeholder="NY"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium text-gray-700 mb-1 ${getFontClass(bodyFont)}`}>
                        Postal Code
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
                        Country
                      </label>
                      <input
                        type="text"
                        value={shippingAddress.country}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, country: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                        placeholder="US"
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
                  Cancel
                </button>
                <button
                  onClick={handleContinueToPayment}
                  className={`flex-1 px-6 py-3 bg-black text-white hover:bg-gray-800 transition-colors shadow-lg font-bold tracking-[0.15em] uppercase ${getFontClass(headingFont)}`}
                >
                  Continue to Payment
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
                Payment Successful!
              </h3>
              <p className={`text-gray-600 mb-6 font-light ${getFontClass(bodyFont)}`}>
                Your order has been confirmed. We've sent a confirmation email to {customerInfo.email}.
              </p>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                <p className={`text-sm text-gray-600 mb-1 font-light ${getFontClass(bodyFont)}`}>Order ID</p>
                <p className={`font-mono font-bold text-gray-900 ${getFontClass(headingFont)}`}>{orderId}</p>
              </div>
              <button
                onClick={onClose}
                className={`px-6 py-3 bg-black text-white hover:bg-gray-800 transition-colors shadow-lg font-bold tracking-[0.15em] uppercase ${getFontClass(headingFont)}`}
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
