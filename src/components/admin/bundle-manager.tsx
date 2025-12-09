'use client'

/**
 * Bundle Manager for SkinCoach E-commerce
 * Features:
 * - Checkbox product selection from product list
 * - Discount by % or $ with auto-calculate savings
 * - Duration-based subscription bundles (1mo, 3mo, 6mo)
 * - AI image generation for bundle
 */

import { useState, useEffect } from 'react'
import {
  Package, Loader2, Plus, Trash2, Edit, Save, X,
  Layers, DollarSign, Percent, ChevronDown, ChevronRight,
  Eye, EyeOff, Sparkles, Clock, Check, Image as ImageIcon,
  Calendar
} from 'lucide-react'
import { type Language, getTranslation } from '@/lib/translations'

// Types
interface Product {
  id: string
  title: string
  name?: string
  description?: string
  thumbnail?: string
  price?: number
  product_type_id?: string
  product_types?: { name: string; is_addon: boolean }
  metadata?: {
    hero_benefit?: string
  }
}

interface BundleProduct {
  product_id: string
  product?: Product
  quantity: number
}

interface Bundle {
  id: string
  name: string
  description?: string
  thumbnail?: string
  bundle_type: 'fixed' | 'subscription'
  products: BundleProduct[]
  // Pricing
  original_price: number // Sum of individual products
  discount_type: 'percentage' | 'fixed_amount'
  discount_value: number
  final_price: number
  savings: number
  // Subscription bundles
  subscription_duration?: '1_month' | '3_month' | '6_month' | '12_month'
  // Status
  is_active: boolean
  is_featured: boolean
  created_at?: string
  updated_at?: string
}

interface BundleManagerProps {
  businessUnitId: string
  language: Language
}

const DURATION_OPTIONS = [
  { value: '1_month', label: '1 Month', discount: 0 },
  { value: '3_month', label: '3 Months', discount: 15 },
  { value: '6_month', label: '6 Months', discount: 25 },
  { value: '12_month', label: '12 Months', discount: 35 },
]

const BundleManager: React.FC<BundleManagerProps> = ({ businessUnitId, language }) => {
  const t = getTranslation(language)

  // Data state
  const [bundles, setBundles] = useState<Bundle[]>([])
  const [products, setProducts] = useState<Product[]>([])

  // UI state
  const [isLoading, setIsLoading] = useState(true)
  const [showEditor, setShowEditor] = useState(false)
  const [editingBundle, setEditingBundle] = useState<Bundle | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Form state
  const [formData, setFormData] = useState<Partial<Bundle>>({
    name: '',
    description: '',
    thumbnail: '',
    bundle_type: 'fixed',
    products: [],
    discount_type: 'percentage',
    discount_value: 10,
    is_active: true,
    is_featured: false
  })

  // Load data
  useEffect(() => {
    loadData()
  }, [businessUnitId])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [bundlesRes, productsRes] = await Promise.all([
        fetch(`/api/ecommerce/bundles?businessUnitId=${businessUnitId}`),
        fetch(`/api/ecommerce/products?businessUnitId=${businessUnitId}`)
      ])

      const [bundlesData, productsData] = await Promise.all([
        bundlesRes.json(),
        productsRes.json()
      ])

      if (bundlesData.bundles) setBundles(bundlesData.bundles || [])
      if (productsData.products) setProducts(productsData.products || [])
    } catch (error) {
      console.error('Failed to load data:', error)
      // Load products anyway
      try {
        const productsRes = await fetch(`/api/ecommerce/products?businessUnitId=${businessUnitId}`)
        const productsData = await productsRes.json()
        if (productsData.products) setProducts(productsData.products || [])
      } catch (e) {
        console.error('Failed to load products:', e)
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Calculate pricing
  const calculatePricing = (selectedProducts: BundleProduct[], discountType: 'percentage' | 'fixed_amount', discountValue: number) => {
    const originalPrice = selectedProducts.reduce((sum, bp) => {
      const product = products.find(p => p.id === bp.product_id)
      return sum + ((product?.price || 0) * bp.quantity)
    }, 0)

    let savings = 0
    let finalPrice = originalPrice

    if (discountType === 'percentage') {
      savings = originalPrice * (discountValue / 100)
      finalPrice = originalPrice - savings
    } else {
      savings = discountValue
      finalPrice = originalPrice - discountValue
    }

    return {
      originalPrice,
      savings,
      finalPrice: Math.max(0, finalPrice)
    }
  }

  // Toggle product selection
  const toggleProduct = (productId: string) => {
    const currentProducts = formData.products || []
    const exists = currentProducts.find(p => p.product_id === productId)

    let newProducts: BundleProduct[]
    if (exists) {
      newProducts = currentProducts.filter(p => p.product_id !== productId)
    } else {
      newProducts = [...currentProducts, { product_id: productId, quantity: 1 }]
    }

    const pricing = calculatePricing(
      newProducts,
      formData.discount_type || 'percentage',
      formData.discount_value || 0
    )

    setFormData({
      ...formData,
      products: newProducts,
      original_price: pricing.originalPrice,
      final_price: pricing.finalPrice,
      savings: pricing.savings
    })
  }

  // Update quantity
  const updateQuantity = (productId: string, quantity: number) => {
    const newProducts = (formData.products || []).map(p =>
      p.product_id === productId ? { ...p, quantity: Math.max(1, quantity) } : p
    )

    const pricing = calculatePricing(
      newProducts,
      formData.discount_type || 'percentage',
      formData.discount_value || 0
    )

    setFormData({
      ...formData,
      products: newProducts,
      original_price: pricing.originalPrice,
      final_price: pricing.finalPrice,
      savings: pricing.savings
    })
  }

  // Update discount
  const updateDiscount = (type: 'percentage' | 'fixed_amount', value: number) => {
    const pricing = calculatePricing(
      formData.products || [],
      type,
      value
    )

    setFormData({
      ...formData,
      discount_type: type,
      discount_value: value,
      original_price: pricing.originalPrice,
      final_price: pricing.finalPrice,
      savings: pricing.savings
    })
  }

  // Open editor for new bundle
  const createNewBundle = () => {
    setEditingBundle(null)
    setFormData({
      name: '',
      description: '',
      thumbnail: '',
      bundle_type: 'fixed',
      products: [],
      discount_type: 'percentage',
      discount_value: 10,
      original_price: 0,
      final_price: 0,
      savings: 0,
      is_active: true,
      is_featured: false
    })
    setShowEditor(true)
  }

  // Open editor for existing bundle
  const editBundle = (bundle: Bundle) => {
    setEditingBundle(bundle)
    setFormData({ ...bundle })
    setShowEditor(true)
  }

  // Generate AI image
  const generateImage = async () => {
    if (!formData.name) return

    setIsGeneratingImage(true)
    try {
      const productNames = (formData.products || [])
        .map(bp => products.find(p => p.id === bp.product_id)?.title)
        .filter(Boolean)
        .join(', ')

      const response = await fetch('/api/ecommerce/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Professional product photography of skincare bundle package containing ${productNames || formData.name}, elegant packaging, white background, studio lighting, high quality commercial photography`,
          productName: formData.name
        })
      })

      const data = await response.json()
      if (data.imageUrl) {
        setFormData({ ...formData, thumbnail: data.imageUrl })
      }
    } catch (error) {
      console.error('Failed to generate image:', error)
    } finally {
      setIsGeneratingImage(false)
    }
  }

  // Save bundle
  const saveBundle = async () => {
    if (!formData.name || (formData.products?.length || 0) === 0) {
      alert('Please enter a bundle name and select at least one product')
      return
    }

    setIsSaving(true)
    try {
      const url = '/api/ecommerce/bundles'
      const method = editingBundle ? 'PUT' : 'POST'
      const body = editingBundle
        ? { ...formData, id: editingBundle.id }
        : { ...formData, business_unit_id: businessUnitId }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (response.ok) {
        setShowEditor(false)
        await loadData()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to save bundle')
      }
    } catch (error) {
      console.error('Failed to save bundle:', error)
      alert('Failed to save bundle')
    } finally {
      setIsSaving(false)
    }
  }

  // Delete bundle
  const deleteBundle = async (bundleId: string) => {
    if (!confirm('Delete this bundle?')) return

    try {
      await fetch(`/api/ecommerce/bundles?id=${bundleId}`, {
        method: 'DELETE'
      })
      await loadData()
    } catch (error) {
      console.error('Failed to delete bundle:', error)
    }
  }

  // Toggle bundle active status
  const toggleActive = async (bundle: Bundle) => {
    try {
      await fetch('/api/ecommerce/bundles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: bundle.id,
          is_active: !bundle.is_active
        })
      })
      await loadData()
    } catch (error) {
      console.error('Failed to toggle bundle:', error)
    }
  }

  // Filter products by search
  const filteredProducts = products.filter(p => {
    const name = p.title || p.name || ''
    return name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase())
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Bundle Manager</h2>
          <p className="text-sm text-slate-400 mt-1">
            Create product bundles with discounts and subscription options
          </p>
        </div>

        <button
          onClick={createNewBundle}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Bundle
        </button>
      </div>

      {/* Bundle List */}
      {bundles.length === 0 ? (
        <div className="bg-slate-700/50 rounded-lg p-12 text-center">
          <Layers className="w-16 h-16 text-slate-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No Bundles Yet</h3>
          <p className="text-slate-400 mb-4">
            Create your first bundle to offer products together at a special price.
          </p>
          <button
            onClick={createNewBundle}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <Plus className="w-4 h-4" />
            Create Your First Bundle
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {bundles.map(bundle => (
            <div
              key={bundle.id}
              className={`bg-slate-700 rounded-lg p-4 border ${
                bundle.is_active ? 'border-slate-600' : 'border-slate-700 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-slate-600 rounded-lg flex items-center justify-center overflow-hidden">
                    {bundle.thumbnail ? (
                      <img src={bundle.thumbnail} alt={bundle.name} className="w-full h-full object-cover" />
                    ) : (
                      <Layers className="w-8 h-8 text-purple-400" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-white">{bundle.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        bundle.bundle_type === 'subscription'
                          ? 'bg-blue-900 text-blue-300'
                          : 'bg-purple-900 text-purple-300'
                      }`}>
                        {bundle.bundle_type === 'subscription' ? 'Subscription' : 'Fixed'}
                      </span>
                      {bundle.is_featured && (
                        <span className="text-xs bg-yellow-900 text-yellow-300 px-2 py-0.5 rounded">
                          Featured
                        </span>
                      )}
                    </div>
                    {bundle.description && (
                      <p className="text-sm text-slate-400 mt-1">{bundle.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-1 text-sm">
                        <span className="text-slate-400 line-through">${bundle.original_price?.toFixed(2)}</span>
                        <span className="font-medium text-green-400">${bundle.final_price?.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-orange-400">
                        <Percent className="w-3 h-3" />
                        Save ${bundle.savings?.toFixed(2)}
                      </div>
                      <div className="text-sm text-slate-400">
                        {bundle.products?.length || 0} items
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleActive(bundle)}
                    className={`p-2 rounded-lg transition-colors ${
                      bundle.is_active ? 'text-green-400 hover:bg-green-900/30' : 'text-slate-400 hover:bg-slate-600'
                    }`}
                    title={bundle.is_active ? 'Active' : 'Inactive'}
                  >
                    {bundle.is_active ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={() => editBundle(bundle)}
                    className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-900/30 rounded-lg transition-colors"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => deleteBundle(bundle.id)}
                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-900/30 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Products Preview */}
              {bundle.products && bundle.products.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-600">
                  <div className="flex flex-wrap gap-2">
                    {bundle.products.map((bp, i) => {
                      const product = products.find(p => p.id === bp.product_id)
                      return (
                        <div
                          key={i}
                          className="flex items-center gap-2 px-3 py-1.5 bg-slate-600 rounded-lg text-sm"
                        >
                          <Package className="w-4 h-4 text-slate-400" />
                          <span className="text-slate-200">{product?.title || 'Unknown Product'}</span>
                          {bp.quantity > 1 && (
                            <span className="text-xs text-slate-400">x{bp.quantity}</span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Editor Modal */}
      {showEditor && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
              <h3 className="font-semibold text-xl text-white flex items-center gap-3">
                <Layers className="w-6 h-6 text-purple-400" />
                {editingBundle ? 'Edit Bundle' : 'Create Bundle'}
              </h3>
              <button
                onClick={() => setShowEditor(false)}
                className="p-2 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm text-slate-300 mb-1">Bundle Name *</label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                    placeholder="e.g., Eye Care Essential Bundle"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm text-slate-300 mb-1">Bundle Type</label>
                  <select
                    value={formData.bundle_type || 'fixed'}
                    onChange={(e) => setFormData({ ...formData, bundle_type: e.target.value as any })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                  >
                    <option value="fixed">Fixed Bundle (One-time purchase)</option>
                    <option value="subscription">Subscription Bundle (Recurring)</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm text-slate-300 mb-1">Description</label>
                  <textarea
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                    rows={2}
                    placeholder="Describe what's included in this bundle"
                  />
                </div>
              </div>

              {/* Subscription Duration (if subscription type) */}
              {formData.bundle_type === 'subscription' && (
                <div>
                  <label className="block text-sm text-slate-300 mb-2">Subscription Duration</label>
                  <div className="grid grid-cols-4 gap-3">
                    {DURATION_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => {
                          setFormData({ ...formData, subscription_duration: opt.value as any })
                          updateDiscount('percentage', opt.discount)
                        }}
                        className={`p-3 rounded-lg border text-center transition-colors ${
                          formData.subscription_duration === opt.value
                            ? 'bg-purple-600 border-purple-500 text-white'
                            : 'bg-slate-700 border-slate-600 text-slate-300 hover:border-purple-500'
                        }`}
                      >
                        <div className="flex items-center justify-center gap-2 mb-1">
                          <Calendar className="w-4 h-4" />
                          <span className="font-medium">{opt.label}</span>
                        </div>
                        {opt.discount > 0 && (
                          <span className="text-xs text-green-400">Save {opt.discount}%</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Bundle Image */}
              <div>
                <label className="block text-sm text-slate-300 mb-2">Bundle Image</label>
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 bg-slate-700 rounded-lg flex items-center justify-center overflow-hidden border-2 border-slate-600">
                    {formData.thumbnail ? (
                      <img src={formData.thumbnail} alt="Bundle" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-slate-500" />
                    )}
                  </div>
                  <button
                    onClick={generateImage}
                    disabled={isGeneratingImage || !formData.name}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 rounded-lg text-white transition-colors"
                  >
                    {isGeneratingImage ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    AI Generate Image
                  </button>
                </div>
              </div>

              {/* Product Selection */}
              <div>
                <label className="block text-sm text-slate-300 mb-2">
                  Select Products ({(formData.products?.length || 0)} selected)
                </label>

                {/* Search */}
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white mb-3"
                />

                {/* Product List with Checkboxes */}
                <div className="grid gap-2 max-h-48 overflow-y-auto">
                  {filteredProducts.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                      No products found. Add products first.
                    </div>
                  ) : (
                    filteredProducts.map(product => {
                      const isSelected = formData.products?.some(p => p.product_id === product.id)
                      const bundleProduct = formData.products?.find(p => p.product_id === product.id)

                      return (
                        <div
                          key={product.id}
                          className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                            isSelected ? 'bg-purple-900/30 border border-purple-500' : 'bg-slate-700 hover:bg-slate-600'
                          }`}
                          onClick={() => toggleProduct(product.id)}
                        >
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            isSelected ? 'bg-purple-600 border-purple-600' : 'border-slate-500'
                          }`}>
                            {isSelected && <Check className="w-3 h-3 text-white" />}
                          </div>

                          <div className="w-10 h-10 bg-slate-600 rounded overflow-hidden flex-shrink-0">
                            {product.thumbnail ? (
                              <img src={product.thumbnail} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <Package className="w-5 h-5 text-slate-400 m-auto mt-2.5" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-white truncate">{product.title || product.name}</div>
                            {product.price && (
                              <div className="text-sm text-green-400">${product.price.toFixed(2)}</div>
                            )}
                          </div>

                          {isSelected && (
                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  updateQuantity(product.id, (bundleProduct?.quantity || 1) - 1)
                                }}
                                className="w-7 h-7 bg-slate-600 hover:bg-slate-500 rounded text-white"
                              >
                                -
                              </button>
                              <span className="w-8 text-center text-white">{bundleProduct?.quantity || 1}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  updateQuantity(product.id, (bundleProduct?.quantity || 1) + 1)
                                }}
                                className="w-7 h-7 bg-slate-600 hover:bg-slate-500 rounded text-white"
                              >
                                +
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

              {/* Discount Settings */}
              <div className="bg-slate-700/50 rounded-lg p-4">
                <label className="block text-sm text-slate-300 mb-3">Discount</label>
                <div className="flex items-center gap-4">
                  <select
                    value={formData.discount_type || 'percentage'}
                    onChange={(e) => updateDiscount(e.target.value as any, formData.discount_value || 0)}
                    className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed_amount">Fixed Amount ($)</option>
                  </select>

                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={formData.discount_value || ''}
                      onChange={(e) => updateDiscount(
                        formData.discount_type || 'percentage',
                        parseFloat(e.target.value) || 0
                      )}
                      className="w-24 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                      placeholder="0"
                      min="0"
                      step={formData.discount_type === 'percentage' ? '1' : '0.01'}
                    />
                    <span className="text-slate-400">
                      {formData.discount_type === 'percentage' ? '%' : '$'}
                    </span>
                  </div>
                </div>

                {/* Pricing Summary */}
                {(formData.products?.length || 0) > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-600 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Original Price:</span>
                      <span className="text-slate-300 line-through">${(formData.original_price || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Discount:</span>
                      <span className="text-orange-400">-${(formData.savings || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-medium">
                      <span className="text-white">Bundle Price:</span>
                      <span className="text-green-400">${(formData.final_price || 0).toFixed(2)}</span>
                    </div>
                    <div className="text-center text-sm text-green-400 bg-green-900/30 rounded py-2">
                      Customers save ${(formData.savings || 0).toFixed(2)} ({formData.discount_type === 'percentage' ? `${formData.discount_value}%` : 'flat'})
                    </div>
                  </div>
                )}
              </div>

              {/* Display Options */}
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-slate-300">Active (visible to customers)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_featured}
                    onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-slate-300">Featured Bundle</span>
                </label>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-700">
              <button
                onClick={() => setShowEditor(false)}
                className="px-6 py-2 text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveBundle}
                disabled={!formData.name || (formData.products?.length || 0) === 0 || isSaving}
                className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 disabled:opacity-50 transition-colors"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {isSaving ? 'Saving...' : 'Save Bundle'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="bg-purple-900/30 border border-purple-500/30 rounded-lg p-4">
        <h4 className="font-medium text-purple-300 mb-2">Bundle Tips:</h4>
        <ul className="text-sm text-purple-200/80 space-y-1">
          <li><strong>Fixed Bundle:</strong> Products sold together at a one-time discounted price</li>
          <li><strong>Subscription Bundle:</strong> Recurring delivery with increasing discounts (3mo: 15%, 6mo: 25%, 12mo: 35%)</li>
          <li>Click products to add/remove them from the bundle</li>
          <li>Adjust quantities using + / - buttons</li>
        </ul>
      </div>
    </div>
  )
}

export default BundleManager
