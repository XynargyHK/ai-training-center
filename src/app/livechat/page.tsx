'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { ShoppingCart, Search, Plus, X, ChevronRight, CheckCircle, ArrowLeft } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import AICoach from '@/components/ui/ai-coach'

interface ProductType {
  id: string
  name: string
}

interface Product {
  id: string
  title: string
  description?: string
  subtitle?: string
  thumbnail?: string
  tagline?: string
  key_actives?: string
  face_benefits?: string
  body_benefits?: string
  hair_benefits?: string
  eye_benefits?: string
  compare_at_price?: number
  cost_price?: number
  is_featured?: boolean
  product_type_id?: string
  product_types?: ProductType
  addons?: ProductAddon[]
}

interface ProductTypeWithCount {
  id: string
  name: string
  count: number
}

interface ProductAddon {
  id: string
  title: string
  tagline?: string
  thumbnail?: string
  cost_price?: number
  product_types?: ProductType
}

interface CartItem {
  product: Product
  quantity: number
}

interface AIStaff {
  id: string
  name: string
  role: 'coach' | 'sales' | 'customer-service' | 'scientist'
  createdAt: Date
  trainingMemory: {[key: string]: string[]}
  totalSessions: number
}

interface BusinessUnit {
  id: string
  name: string
  slug: string
}

function LiveChatShopContent() {
  const searchParams = useSearchParams()
  const businessUnitParam = searchParams.get('businessUnit') || 'skincoach'

  // Shop state
  const [products, setProducts] = useState<Product[]>([])
  const [productTypes, setProductTypes] = useState<ProductTypeWithCount[]>([])
  const [loading, setLoading] = useState(true)
  const [cart, setCart] = useState<CartItem[]>([])
  const [showCart, setShowCart] = useState(false)
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showCheckout, setShowCheckout] = useState(false)
  const [checkoutStep, setCheckoutStep] = useState<'form' | 'success'>('form')
  const [orderInfo, setOrderInfo] = useState<{ id: string; display_id: number } | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [customerForm, setCustomerForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    notes: ''
  })

  // AI Chat state
  const [aiStaffList, setAiStaffList] = useState<AIStaff[]>([])
  const [businessUnit, setBusinessUnit] = useState<BusinessUnit | null>(null)

  useEffect(() => {
    fetchProducts()
    loadAIData()
    // Load cart from localStorage
    const savedCart = localStorage.getItem('shop_cart')
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart))
      } catch (e) {
        console.error('Error loading cart:', e)
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('shop_cart', JSON.stringify(cart))
  }, [cart])

  useEffect(() => {
    fetchProducts()
  }, [selectedTypeId])

  const loadAIData = async () => {
    try {
      const { loadBusinessUnits, loadAIStaff } = await import('@/lib/api-client')
      const units = await loadBusinessUnits()
      const currentUnit = units.find((u: any) => u.id === businessUnitParam || u.slug === businessUnitParam)
      if (currentUnit) {
        setBusinessUnit(currentUnit)
      }
      const staff = await loadAIStaff(businessUnitParam)
      if (staff && staff.length > 0) {
        setAiStaffList(staff)
      }
    } catch (error) {
      console.error('Failed to load AI data:', error)
    }
  }

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (selectedTypeId) params.set('productTypeId', selectedTypeId)
      if (searchQuery) params.set('search', searchQuery)

      const response = await fetch(`/api/shop/products?${params}`)
      const data = await response.json()
      if (data.success) {
        setProducts(data.products || [])
        setProductTypes(data.productTypes || [])
      }
    } catch (err) {
      console.error('Error fetching products:', err)
    } finally {
      setLoading(false)
    }
  }

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id)
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, { product, quantity: 1 }]
    })
  }

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId))
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }
    setCart(prev =>
      prev.map(item =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    )
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchProducts()
  }

  const handleCheckout = async () => {
    if (!customerForm.name || !customerForm.email) {
      alert('Please fill in name and email')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/shop/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: {
            name: customerForm.name,
            email: customerForm.email,
            phone: customerForm.phone
          },
          shipping_address: customerForm.address ? {
            address: customerForm.address,
            city: customerForm.city,
            state: '',
            postal_code: '',
            country: ''
          } : undefined,
          items: cart.map(item => ({
            product_id: item.product.id,
            title: item.product.title,
            thumbnail: item.product.thumbnail,
            quantity: item.quantity,
            unit_price: getPrice(item.product)
          })),
          subtotal: cartTotal,
          total: cartTotal,
          notes: customerForm.notes
        })
      })

      const data = await response.json()
      if (data.success) {
        setOrderInfo({ id: data.order.id, display_id: data.order.display_id })
        setCheckoutStep('success')
        setCart([])
        localStorage.removeItem('shop_cart')
      } else {
        alert('Error: ' + data.error)
      }
    } catch (err) {
      console.error('Checkout error:', err)
      alert('Failed to place order')
    } finally {
      setSubmitting(false)
    }
  }

  const startCheckout = () => {
    setShowCart(false)
    setShowCheckout(true)
    setCheckoutStep('form')
  }

  const closeCheckout = () => {
    setShowCheckout(false)
    setCheckoutStep('form')
    setCustomerForm({ name: '', email: '', phone: '', address: '', city: '', notes: '' })
    setOrderInfo(null)
  }

  const filteredProducts = products.filter(product =>
    product.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getPrice = (product: Product) => {
    return product.cost_price || 89.00
  }

  const cartTotal = cart.reduce((sum, item) => sum + (getPrice(item.product) * item.quantity), 0)
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  const selectedTypeName = selectedTypeId
    ? productTypes.find(t => t.id === selectedTypeId)?.name || 'Products'
    : 'All Products'

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex-shrink-0 sticky top-0 h-screen overflow-y-auto">
        <div className="p-4 border-b border-gray-200">
          <Link href={`/livechat?businessUnit=${businessUnitParam}`} className="flex items-center gap-2">
            <span className="text-2xl">🧴</span>
            <span className="font-bold text-lg">{businessUnit?.name || 'SkinCoach'} Shop</span>
          </Link>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </form>

        {/* Categories */}
        <div className="p-4">
          {/* Products Section */}
          <h3 className="font-semibold text-gray-900 mb-2 text-sm uppercase tracking-wide">Products</h3>

          <button
            onClick={() => setSelectedTypeId(null)}
            className={`w-full text-left px-3 py-2 rounded-lg mb-1 text-sm flex items-center justify-between ${
              !selectedTypeId ? 'bg-purple-100 text-purple-700 font-medium' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <span>All Products</span>
            <span className="text-xs text-gray-500">{products.length}</span>
          </button>

          {productTypes.filter(t => t.name !== 'Booster').map(type => (
            <button
              key={type.id}
              onClick={() => setSelectedTypeId(type.id)}
              className={`w-full text-left px-3 py-2 rounded-lg mb-1 text-sm flex items-center justify-between ${
                selectedTypeId === type.id
                  ? 'bg-purple-100 text-purple-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span>{type.name}</span>
              <span className="text-xs text-gray-500">{type.count}</span>
            </button>
          ))}

          {/* Boosters Section */}
          {productTypes.find(t => t.name === 'Booster') && (
            <>
              <h3 className="font-semibold text-gray-900 mb-2 mt-4 text-sm uppercase tracking-wide">Boosters</h3>
              <button
                onClick={() => setSelectedTypeId(productTypes.find(t => t.name === 'Booster')?.id || null)}
                className={`w-full text-left px-3 py-2 rounded-lg mb-1 text-sm flex items-center justify-between ${
                  selectedTypeId === productTypes.find(t => t.name === 'Booster')?.id
                    ? 'bg-purple-100 text-purple-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span>All Boosters</span>
                <span className="text-xs text-gray-500">{productTypes.find(t => t.name === 'Booster')?.count}</span>
              </button>
            </>
          )}
        </div>

        {/* Back to Home */}
        <div className="p-4 border-t border-gray-200 mt-auto">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
            Back to Admin
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{selectedTypeName}</h1>
            <p className="text-sm text-gray-500">{filteredProducts.length} products</p>
          </div>

          <button
            onClick={() => setShowCart(true)}
            className="relative flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <ShoppingCart className="w-5 h-5" />
            <span>Cart</span>
            {cartItemCount > 0 && (
              <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                {cartItemCount}
              </span>
            )}
          </button>
        </header>

        {/* Products Grid */}
        <main className="flex-1 p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-500">Loading products...</p>
              </div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No products found</h3>
              <p className="text-gray-500">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map(product => (
                <div
                  key={product.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div
                    className="h-48 bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center cursor-pointer relative"
                    onClick={() => setSelectedProduct(product)}
                  >
                    {product.thumbnail ? (
                      <img src={product.thumbnail} alt={product.title} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-6xl">🧴</span>
                    )}
                    {product.is_featured && (
                      <span className="absolute top-2 left-2 px-2 py-1 bg-yellow-400 text-yellow-900 text-xs font-medium rounded">
                        Featured
                      </span>
                    )}
                  </div>

                  <div className="p-4">
                    <div className="text-xs text-purple-600 font-medium mb-1">
                      {product.product_types?.name || 'Product'}
                    </div>
                    <h3
                      className="font-semibold text-gray-900 mb-1 cursor-pointer hover:text-purple-600"
                      onClick={() => setSelectedProduct(product)}
                    >
                      {product.title}
                    </h3>

                    {product.tagline && (
                      <p className="text-sm text-gray-500 mb-2 line-clamp-2">
                        {product.tagline}
                      </p>
                    )}

                    {product.addons && product.addons.length > 0 && (
                      <p className="text-xs text-orange-600 mb-1">
                        + {product.addons.length} add-on{product.addons.length > 1 ? 's' : ''} available
                      </p>
                    )}

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                      <span className="text-lg font-bold text-gray-900">
                        ${getPrice(product).toFixed(2)}
                      </span>
                      <button
                        onClick={() => addToCart(product)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700"
                      >
                        <Plus className="w-4 h-4" />
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* AI Coach Floating Button */}
      {aiStaffList.length > 0 && (
        <AICoach
          businessUnit={businessUnitParam}
          aiStaffList={aiStaffList}
          initialOpen={false}
        />
      )}

      {/* Cart Sidebar */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowCart(false)} />
          <div className="relative w-full max-w-md bg-white h-full shadow-xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-bold">Shopping Cart ({cartItemCount})</h2>
              <button onClick={() => setShowCart(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Your cart is empty</p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {cart.map(item => (
                    <div key={item.product.id} className="flex gap-4 bg-gray-50 rounded-lg p-3">
                      <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        {item.product.thumbnail ? (
                          <img src={item.product.thumbnail} alt={item.product.title} className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <span className="text-2xl">🧴</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">{item.product.title}</h4>
                        <p className="text-sm text-gray-500">${getPrice(item.product).toFixed(2)}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            className="w-6 h-6 flex items-center justify-center border border-gray-300 rounded text-gray-600 hover:bg-gray-100"
                          >
                            -
                          </button>
                          <span className="w-8 text-center text-sm">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            className="w-6 h-6 flex items-center justify-center border border-gray-300 rounded text-gray-600 hover:bg-gray-100"
                          >
                            +
                          </button>
                          <button
                            onClick={() => removeFromCart(item.product.id)}
                            className="ml-auto text-red-500 hover:text-red-700 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-200 p-4 space-y-4">
                  <div className="flex items-center justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>${cartTotal.toFixed(2)}</span>
                  </div>
                  <button
                    onClick={startCheckout}
                    className="w-full py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700"
                  >
                    Checkout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedProduct(null)} />
          <div className="relative bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg z-10 bg-white/80"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  {selectedProduct.thumbnail ? (
                    <img src={selectedProduct.thumbnail} alt={selectedProduct.title} className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <span className="text-4xl">🧴</span>
                  )}
                </div>
                <div className="flex-1">
                  <span className="inline-block px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium mb-1">
                    {selectedProduct.product_types?.name || 'Product'}
                  </span>
                  <h2 className="text-xl font-bold text-gray-900">{selectedProduct.title}</h2>
                  {selectedProduct.subtitle && (
                    <p className="text-sm text-gray-500">{selectedProduct.subtitle}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-xl font-bold text-purple-600">${getPrice(selectedProduct).toFixed(2)}</span>
                    <button
                      onClick={() => {
                        addToCart(selectedProduct)
                        setSelectedProduct(null)
                        setShowCart(true)
                      }}
                      className="px-4 py-1.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700"
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                {selectedProduct.tagline && (
                  <div className="flex gap-2">
                    <span className="text-gray-400 flex-shrink-0">•</span>
                    <p className="text-sm text-gray-700 italic">{selectedProduct.tagline}</p>
                  </div>
                )}
                {selectedProduct.description && (
                  <div className="flex gap-2">
                    <span className="text-gray-400 flex-shrink-0">•</span>
                    <p className="text-sm text-gray-700">{selectedProduct.description}</p>
                  </div>
                )}
                {selectedProduct.key_actives && (
                  <div className="flex gap-2">
                    <span className="text-purple-500 flex-shrink-0">•</span>
                    <div>
                      <span className="text-sm font-medium text-purple-700">Key Actives: </span>
                      <span className="text-sm text-gray-700">{selectedProduct.key_actives}</span>
                    </div>
                  </div>
                )}
                {selectedProduct.face_benefits && (
                  <div className="flex gap-2">
                    <span className="text-pink-500 flex-shrink-0">•</span>
                    <div>
                      <span className="text-sm font-medium text-pink-700">Face: </span>
                      <span className="text-sm text-gray-700">{selectedProduct.face_benefits}</span>
                    </div>
                  </div>
                )}
                {selectedProduct.body_benefits && (
                  <div className="flex gap-2">
                    <span className="text-blue-500 flex-shrink-0">•</span>
                    <div>
                      <span className="text-sm font-medium text-blue-700">Body: </span>
                      <span className="text-sm text-gray-700">{selectedProduct.body_benefits}</span>
                    </div>
                  </div>
                )}
                {selectedProduct.hair_benefits && (
                  <div className="flex gap-2">
                    <span className="text-green-500 flex-shrink-0">•</span>
                    <div>
                      <span className="text-sm font-medium text-green-700">Hair: </span>
                      <span className="text-sm text-gray-700">{selectedProduct.hair_benefits}</span>
                    </div>
                  </div>
                )}
                {selectedProduct.eye_benefits && (
                  <div className="flex gap-2">
                    <span className="text-indigo-500 flex-shrink-0">•</span>
                    <div>
                      <span className="text-sm font-medium text-indigo-700">Eye: </span>
                      <span className="text-sm text-gray-700">{selectedProduct.eye_benefits}</span>
                    </div>
                  </div>
                )}
              </div>

              {selectedProduct.addons && selectedProduct.addons.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-4">
                    Recommended Add-ons ({selectedProduct.addons.length})
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {selectedProduct.addons.map(addon => (
                      <div
                        key={addon.id}
                        className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors cursor-pointer"
                        onClick={() => {
                          const fullAddon = products.find(p => p.id === addon.id)
                          if (fullAddon) {
                            addToCart(fullAddon)
                          }
                        }}
                      >
                        <div className="w-full h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center mb-2">
                          {addon.thumbnail ? (
                            <img src={addon.thumbnail} alt={addon.title} className="w-full h-full object-cover rounded-lg" />
                          ) : (
                            <span className="text-3xl">💧</span>
                          )}
                        </div>
                        <p className="text-xs text-purple-600 font-medium">
                          {addon.product_types?.name || 'Booster'}
                        </p>
                        <p className="text-sm font-medium text-gray-900 truncate">{addon.title}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm font-bold text-gray-700">
                            ${(addon.cost_price || 89).toFixed(2)}
                          </span>
                          <button
                            className="text-xs px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700"
                            onClick={(e) => {
                              e.stopPropagation()
                              const fullAddon = products.find(p => p.id === addon.id)
                              if (fullAddon) {
                                addToCart(fullAddon)
                              }
                            }}
                          >
                            + Add
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={closeCheckout} />
          <div className="relative bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <button
              onClick={closeCheckout}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {checkoutStep === 'form' ? (
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Checkout</h2>

                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Order Summary</h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {cart.map(item => (
                      <div key={item.product.id} className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          {item.product.title} x {item.quantity}
                        </span>
                        <span className="font-medium">
                          ${(getPrice(item.product) * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-gray-200 mt-3 pt-3 flex justify-between font-bold">
                    <span>Total</span>
                    <span className="text-purple-600">${cartTotal.toFixed(2)}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Customer Information</h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={customerForm.name}
                        onChange={(e) => setCustomerForm(f => ({ ...f, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Your name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={customerForm.email}
                        onChange={(e) => setCustomerForm(f => ({ ...f, email: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="your@email.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={customerForm.phone}
                      onChange={(e) => setCustomerForm(f => ({ ...f, phone: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Phone number"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                      <input
                        type="text"
                        value={customerForm.address}
                        onChange={(e) => setCustomerForm(f => ({ ...f, address: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Street address"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                      <input
                        type="text"
                        value={customerForm.city}
                        onChange={(e) => setCustomerForm(f => ({ ...f, city: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="City"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                      value={customerForm.notes}
                      onChange={(e) => setCustomerForm(f => ({ ...f, notes: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      rows={2}
                      placeholder="Any special requests..."
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => { setShowCheckout(false); setShowCart(true); }}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Cart
                  </button>
                  <button
                    onClick={handleCheckout}
                    disabled={submitting || !customerForm.name || !customerForm.email}
                    className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Placing Order...' : 'Place Order'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Placed!</h2>
                <p className="text-gray-600 mb-4">
                  Thank you for your order. We&apos;ll send a confirmation to your email.
                </p>
                {orderInfo && (
                  <p className="text-sm text-gray-500 mb-6">
                    Order #{orderInfo.display_id}
                  </p>
                )}
                <button
                  onClick={closeCheckout}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700"
                >
                  Continue Shopping
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function LiveChatPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    }>
      <LiveChatShopContent />
    </Suspense>
  )
}
