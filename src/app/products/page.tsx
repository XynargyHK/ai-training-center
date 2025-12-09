'use client'

/**
 * Product Management Dashboard
 * Admin interface for managing e-commerce products
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Product {
  id: string
  business_unit_id: string
  title: string
  description?: string
  handle?: string
  subtitle?: string
  thumbnail?: string
  status: 'draft' | 'published' | 'archived'
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
}

export default function ProductsPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [businessUnitId, setBusinessUnitId] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published' | 'archived'>('all')
  const [mounted, setMounted] = useState(false)
  const [aiGenerating, setAiGenerating] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Create Product Form State
  const [newProduct, setNewProduct] = useState({
    title: '',
    description: '',
    handle: '',
    subtitle: '',
    thumbnail: '',
    status: 'draft' as 'draft' | 'published' | 'archived'
  })

  useEffect(() => {
    // Get business unit ID from localStorage or API
    const loadBusinessUnit = async () => {
      try {
        const response = await fetch('/api/business-units/current')

        // Check if response is JSON
        const contentType = response.headers.get('content-type')
        if (!contentType || !contentType.includes('application/json')) {
          console.error('Expected JSON response, got:', contentType)
          return
        }

        const data = await response.json()
        if (data.businessUnit) {
          setBusinessUnitId(data.businessUnit.id)
        }
      } catch (err) {
        console.error('Error loading business unit:', err)
      }
    }
    loadBusinessUnit()
  }, [])

  useEffect(() => {
    if (businessUnitId) {
      fetchProducts()
    }
  }, [businessUnitId, statusFilter])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        business_unit_id: businessUnitId!
      })
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }

      const response = await fetch(`/api/ecommerce/products?${params}`)
      const data = await response.json()

      if (response.ok) {
        setProducts(data.products)
      } else {
        setError(data.error || 'Failed to fetch products')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateAIContent = async (type: 'description' | 'title' | 'all') => {
    if (!newProduct.title) {
      alert('Please enter a product title first')
      return
    }

    try {
      setAiGenerating(true)

      if (type === 'description') {
        const response = await fetch('/api/ecommerce/ai-content/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'description',
            productTitle: newProduct.title,
            tone: 'professional',
            length: 'medium'
          })
        })

        const data = await response.json()
        if (response.ok) {
          setNewProduct({ ...newProduct, description: data.description })
        } else {
          alert(data.error || 'Failed to generate description')
        }
      } else if (type === 'title') {
        const response = await fetch('/api/ecommerce/ai-content/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'title',
            basicTitle: newProduct.title,
            style: 'descriptive'
          })
        })

        const data = await response.json()
        if (response.ok) {
          setNewProduct({ ...newProduct, title: data.title })
        } else {
          alert(data.error || 'Failed to generate title')
        }
      }
    } catch (err: any) {
      alert(err.message)
    } finally {
      setAiGenerating(false)
    }
  }

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch('/api/ecommerce/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_unit_id: businessUnitId,
          ...newProduct
        })
      })

      const data = await response.json()

      if (response.ok) {
        setProducts([data.product, ...products])
        setShowCreateModal(false)
        setNewProduct({
          title: '',
          description: '',
          handle: '',
          subtitle: '',
          thumbnail: '',
          status: 'draft'
        })
      } else {
        alert(data.error || 'Failed to create product')
      }
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return

    try {
      const response = await fetch(`/api/ecommerce/products/${productId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setProducts(products.filter(p => p.id !== productId))
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to delete product')
      }
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleUpdateStatus = async (productId: string, status: 'draft' | 'published' | 'archived') => {
    try {
      const response = await fetch(`/api/ecommerce/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })

      const data = await response.json()

      if (response.ok) {
        setProducts(products.map(p =>
          p.id === productId ? { ...p, status } : p
        ))
      } else {
        alert(data.error || 'Failed to update product')
      }
    } catch (err: any) {
      alert(err.message)
    }
  }

  if (!mounted) {
    return null
  }

  if (!businessUnitId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Loading business unit...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50" suppressHydrationWarning>
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Products</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage your e-commerce product catalog
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              + Create Product
            </button>
          </div>

          {/* Status Filter */}
          <div className="mt-4 flex gap-2">
            {['all', 'draft', 'published', 'archived'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status as any)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${
                  statusFilter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">⏳</div>
            <p className="text-gray-600">Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No products yet</h3>
            <p className="text-gray-500 mb-6">
              Create your first product to get started
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Product
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <div key={product.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                {/* Product Image */}
                <div className="h-48 bg-gray-200 rounded-t-lg overflow-hidden">
                  {product.thumbnail ? (
                    <img
                      src={product.thumbnail}
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-6xl">
                      📦
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 text-lg">{product.title}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      product.status === 'published'
                        ? 'bg-green-100 text-green-800'
                        : product.status === 'draft'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {product.status}
                    </span>
                  </div>

                  {product.subtitle && (
                    <p className="text-sm text-gray-600 mb-2">{product.subtitle}</p>
                  )}

                  {product.description && (
                    <p className="text-sm text-gray-500 line-clamp-2 mb-4">
                      {product.description}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 mt-4">
                    <select
                      value={product.status}
                      onChange={(e) => handleUpdateStatus(product.id, e.target.value as any)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="archived">Archived</option>
                    </select>
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Product Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Create New Product</h2>

              <form onSubmit={handleCreateProduct}>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-medium text-gray-700">
                        Title *
                      </label>
                      <button
                        type="button"
                        onClick={() => handleGenerateAIContent('title')}
                        disabled={aiGenerating || !newProduct.title}
                        className="text-xs px-2 py-1 bg-purple-50 text-purple-600 rounded hover:bg-purple-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        ✨ Enhance with AI
                      </button>
                    </div>
                    <input
                      type="text"
                      required
                      value={newProduct.title}
                      onChange={(e) => setNewProduct({ ...newProduct, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter basic product name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subtitle
                    </label>
                    <input
                      type="text"
                      value={newProduct.subtitle}
                      onChange={(e) => setNewProduct({ ...newProduct, subtitle: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-medium text-gray-700">
                        Description
                      </label>
                      <button
                        type="button"
                        onClick={() => handleGenerateAIContent('description')}
                        disabled={aiGenerating || !newProduct.title}
                        className="text-xs px-2 py-1 bg-purple-50 text-purple-600 rounded hover:bg-purple-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        ✨ Generate with AI
                      </button>
                    </div>
                    <textarea
                      rows={4}
                      value={newProduct.description}
                      onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="AI can generate this for you..."
                    />
                    {aiGenerating && (
                      <p className="text-xs text-purple-600 mt-1">
                        ✨ AI is generating content...
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Handle (URL slug)
                    </label>
                    <input
                      type="text"
                      value={newProduct.handle}
                      onChange={(e) => setNewProduct({ ...newProduct, handle: e.target.value })}
                      placeholder="product-name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Thumbnail URL
                    </label>
                    <input
                      type="text"
                      value={newProduct.thumbnail}
                      onChange={(e) => setNewProduct({ ...newProduct, thumbnail: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={newProduct.status}
                      onChange={(e) => setNewProduct({ ...newProduct, status: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create Product
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
