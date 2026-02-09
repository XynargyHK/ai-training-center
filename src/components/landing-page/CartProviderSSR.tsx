'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { X, ShoppingCart, Trash2 } from 'lucide-react'
import { getFontClass } from '@/lib/fonts'
import dynamic from 'next/dynamic'

const CheckoutModal = dynamic(() => import('@/components/shop/checkout-modal'), { ssr: false })

// Currency symbol mapping by country
const countryCurrencySymbol: Record<string, string> = {
  US: '$',
  HK: 'HK$',
  SG: 'S$',
  GB: '£',
  EU: '€',
  JP: '¥',
  CN: '¥',
  TW: 'NT$',
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

interface CartContextType {
  cart: CartItem[]
  cartItemCount: number
  addToCart: (product: any) => void
  clearCart: () => void
  openCart: () => void
  language: string
  country: string
  businessUnit: string
}

const CartContext = createContext<CartContextType>({
  cart: [],
  cartItemCount: 0,
  addToCart: () => {},
  clearCart: () => {},
  openCart: () => {},
  language: 'en',
  country: 'US',
  businessUnit: '',
})

export function useCart() {
  return useContext(CartContext)
}

interface CartProviderSSRProps {
  children: ReactNode
  businessUnit: string
  country?: string
  headingFont?: string
  bodyFont?: string
  language?: string
  enableSocialLogin?: boolean
}

export default function CartProviderSSR({
  children,
  businessUnit,
  country = 'US',
  headingFont = 'Josefin Sans',
  bodyFont = 'Cormorant Garamond',
  language = 'en',
  enableSocialLogin = false,
}: CartProviderSSRProps) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [showCartSidebar, setShowCartSidebar] = useState(false)
  const [showCheckoutModal, setShowCheckoutModal] = useState(false)

  // Load cart from localStorage
  useEffect(() => {
    if (!businessUnit) return
    const savedCart = localStorage.getItem(`shop_cart_${businessUnit}`)
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart))
      } catch (e) {
        console.error('Error loading cart:', e)
      }
    }
  }, [businessUnit])


  // Save cart to localStorage
  useEffect(() => {
    if (businessUnit) {
      localStorage.setItem(`shop_cart_${businessUnit}`, JSON.stringify(cart))
    }
  }, [cart, businessUnit])

  const addToCart = (product: any) => {
    setCart(prev => {
      const existingIndex = prev.findIndex(item => item.product.id === product.id)
      if (existingIndex >= 0) {
        const updated = [...prev]
        updated[existingIndex].quantity += 1
        return updated
      }
      return [...prev, { product, quantity: 1 }]
    })
    setShowCartSidebar(true)
  }

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId))
  }

  const updateQuantity = (productId: string, quantity: number) => {
    setCart(prev =>
      prev.map(item =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    )
  }

  const clearCart = () => {
    setCart([])
    localStorage.removeItem(`shop_cart_${businessUnit}`)
  }

  const handleCheckoutSuccess = (orderId: string) => {
    clearCart()
    setShowCheckoutModal(false)
    setShowCartSidebar(false)
  }

  const cartTotal = cart.reduce((sum, item) => sum + ((item.product.cost_price || 0) * item.quantity), 0)
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  const currencySymbol = countryCurrencySymbol[country] || '$'

  // Cart translations — matching livechat/page.tsx
  const isChinese = language === 'tw' || language === 'zh-Hant'
  const cartText = isChinese ? {
    shoppingCart: '購物車',
    cartEmpty: '您的購物車是空的',
    total: '總計',
    proceedToCheckout: '前往結帳',
    removeFromCart: '從購物車移除'
  } : {
    shoppingCart: 'Shopping Cart',
    cartEmpty: 'Your cart is empty',
    total: 'Total',
    proceedToCheckout: 'Proceed to Checkout',
    removeFromCart: 'Remove from cart'
  }

  return (
    <CartContext.Provider value={{ cart, cartItemCount, addToCart, clearCart, openCart: () => setShowCartSidebar(true), language, country, businessUnit }}>
      {children}

      {/* Cart Sidebar */}
      {showCartSidebar && (
        <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setShowCartSidebar(false)}>
          <div
            className="absolute right-0 top-0 h-full w-full md:w-96 bg-white shadow-xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cart Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className={`text-lg font-light tracking-[0.2em] uppercase ${getFontClass(headingFont)}`}>{cartText.shoppingCart} ({cartItemCount})</h2>
              <button
                onClick={() => setShowCartSidebar(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-4">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <ShoppingCart className="w-16 h-16 mb-4" />
                  <p className={`text-gray-500 font-light ${getFontClass(bodyFont)}`}>{cartText.cartEmpty}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map(item => (
                    <div key={item.product.id} className="flex gap-4 pb-4 border-b border-gray-200">
                      <div className="w-20 h-20 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                        {item.product.thumbnail ? (
                          <img src={item.product.thumbnail} alt={item.product.title} className="w-full h-full object-cover rounded" />
                        ) : (
                          <span className="text-3xl">🧴</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className={`font-medium text-sm ${getFontClass(headingFont)}`}>{item.product.title}</h3>
                        {item.product.description && (
                          <p className={`text-xs text-gray-600 mt-1 font-light ${getFontClass(bodyFont)}`}>{item.product.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => updateQuantity(item.product.id, Math.max(1, item.quantity - 1))}
                            className={`w-6 h-6 rounded border border-gray-300 flex items-center justify-center text-sm font-light ${getFontClass(bodyFont)}`}
                          >
                            -
                          </button>
                          <span className={`text-sm font-light ${getFontClass(bodyFont)}`}>{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            className={`w-6 h-6 rounded border border-gray-300 flex items-center justify-center text-sm font-light ${getFontClass(bodyFont)}`}
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-col items-end justify-between">
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-red-500 hover:text-red-700 p-1 transition-colors"
                          title={cartText.removeFromCart}
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                        <span className={`font-bold ${getFontClass(headingFont)}`}>{currencySymbol}{((item.product.cost_price || 0) * item.quantity).toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cart Footer */}
            {cart.length > 0 && (
              <div className="p-4 border-t border-gray-200 bg-white">
                <div className="flex justify-between mb-4">
                  <span className={`font-light tracking-[0.15em] uppercase ${getFontClass(headingFont)}`}>{cartText.total}:</span>
                  <span className={`font-bold ${getFontClass(headingFont)}`}>{currencySymbol}{cartTotal.toFixed(2)}</span>
                </div>
                <button
                  onClick={() => setShowCheckoutModal(true)}
                  className={`block w-full px-6 py-3 bg-black text-white text-center font-bold tracking-[0.15em] uppercase hover:bg-gray-800 transition-colors shadow-lg ${getFontClass(headingFont)}`}
                >
                  {cartText.proceedToCheckout}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {showCheckoutModal && (
        <CheckoutModal
          isOpen={showCheckoutModal}
          onClose={() => setShowCheckoutModal(false)}
          cart={cart}
          onSuccess={handleCheckoutSuccess}
          businessUnitParam={businessUnit}
          country={country}
          headingFont={headingFont}
          bodyFont={bodyFont}
          language={language}
          enableSocialLogin={enableSocialLogin}
        />
      )}
    </CartContext.Provider>
  )
}
