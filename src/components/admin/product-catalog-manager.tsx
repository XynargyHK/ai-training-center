'use client'

/**
 * Product Catalog Manager
 *
 * Unified dashboard for managing product catalog with:
 * - Category and product type management
 * - Product listing with filters
 * - Add-on matching (base products → compatible addons)
 * - Bundle creation
 * - Bulk import options
 */

import { useState, useEffect, useRef } from 'react'
import {
  Loader2, Plus, Settings, FolderTree, Package,
  Tag, Grid, List, Search, Filter, MoreVertical, Edit,
  Trash2, Eye, ChevronRight, AlertCircle, CheckCircle2,
  X, Upload, Link2, FileText, Layers, ChevronDown
} from 'lucide-react'
import CatalogSetupWizard from './catalog-setup-wizard'
import ProductForm from './product-form'
import BundleManager from './bundle-manager'
import CatalogSettings from './catalog-settings'
import AddonMatchingModal from './addon-matching-modal'
import ProductLanguageBar from './landing-page/ProductLanguageBar'
import ProductAddLocaleModal from './landing-page/ProductAddLocaleModal'

interface Category {
  id: string
  name: string
  handle: string
  product_count?: number
}

interface ProductType {
  id: string
  name: string
  handle: string
  is_addon: boolean
  product_count?: number
}

interface Product {
  id: string
  title: string
  tagline?: string
  thumbnail?: string
  status: 'draft' | 'published' | 'archived'
  is_addon: boolean
  created_at: string
  product_types?: { name: string; is_addon?: boolean }
  product_category_mapping?: { product_categories: { name: string } }[]
  product_variants?: {
    id: string
    title: string
    product_variant_prices?: { amount: number; currency_code: string }[]
  }[]
  product_images?: { id: string; url: string }[]
  metadata?: any
}

interface ProductCatalogManagerProps {
  businessUnitId: string
  language?: string
}

export default function ProductCatalogManager({
  businessUnitId,
  language = 'en'
}: ProductCatalogManagerProps) {
  // Data state
  const [categories, setCategories] = useState<Category[]>([])
  const [productTypes, setProductTypes] = useState<ProductType[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [totalProducts, setTotalProducts] = useState(0)

  // UI state
  const [isLoading, setIsLoading] = useState(true)
  const [showWizard, setShowWizard] = useState(false)
  const [showProductForm, setShowProductForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedProductType, setSelectedProductType] = useState<'all' | 'base' | 'addon'>('all')
  const [activeTab, setActiveTab] = useState<'products' | 'catalog-settings' | 'bundles'>('products')
  const [showBulkImportMenu, setShowBulkImportMenu] = useState(false)
  const bulkImportRef = useRef<HTMLDivElement>(null)

  // Locale state
  const [selectedCountry, setSelectedCountry] = useState('US')
  const [selectedLangCode, setSelectedLangCode] = useState('en')
  const [availableLocales, setAvailableLocales] = useState<Array<{ country: string; language_code: string }>>([])
  const [showAddLocaleModal, setShowAddLocaleModal] = useState(false)

  // Add-on matching modal state
  const [addonModalProduct, setAddonModalProduct] = useState<{
    id: string
    title: string
    category: string
    categoryId: string
  } | null>(null)
  const [productAddonCounts, setProductAddonCounts] = useState<Record<string, number>>({})

  // Check if catalog is empty
  const catalogIsEmpty = categories.length === 0 && products.length === 0

  // Close bulk import dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (bulkImportRef.current && !bulkImportRef.current.contains(event.target as Node)) {
        setShowBulkImportMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Load data
  useEffect(() => {
    loadData()
  }, [businessUnitId, selectedCountry, selectedLangCode])

  // Load available locales
  useEffect(() => {
    loadLocales()
  }, [businessUnitId])

  const loadLocales = async () => {
    try {
      const res = await fetch(`/api/ecommerce/products/locales?businessUnit=${businessUnitId}`)
      const data = await res.json()
      if (data.success) {
        setAvailableLocales(data.locales || [])
      }
    } catch (error) {
      console.error('Failed to load product locales:', error)
    }
  }

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [categoriesRes, typesRes, productsRes] = await Promise.all([
        fetch(`/api/ecommerce/categories?businessUnitId=${businessUnitId}`),
        fetch(`/api/ecommerce/product-types?businessUnitId=${businessUnitId}`),
        fetch(`/api/ecommerce/products?business_unit_id=${businessUnitId}&country=${selectedCountry}&language=${selectedLangCode}&limit=200`)
      ])

      const [categoriesData, typesData, productsData] = await Promise.all([
        categoriesRes.json(),
        typesRes.json(),
        productsRes.json()
      ])

      setCategories(categoriesData.categories || [])
      setProductTypes(typesData.types || [])
      setProducts(productsData.products || [])
      setTotalProducts(productsData.products?.length || 0)

      // Show wizard ONLY if both categories AND products are completely empty
      // Don't show if there are products (even without categories)
      if ((categoriesData.categories?.length || 0) === 0 && (productsData.products?.length || 0) === 0) {
        setShowWizard(true)
      } else {
        setShowWizard(false)
      }
    } catch (error) {
      console.error('Failed to load catalog data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Helper function to check if a product is an add-on
  const isProductAddon = (product: Product): boolean => {
    // Check metadata first (explicit override), then product type
    return product.metadata?.is_addon === true || product.product_types?.is_addon === true
  }

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = !searchQuery ||
      product.title.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory = selectedCategory === 'all' ||
      product.product_category_mapping?.some(m =>
        m.product_categories?.name === selectedCategory
      )

    const matchesStatus = selectedStatus === 'all' || product.status === selectedStatus

    const productIsAddon = isProductAddon(product)
    const matchesProductType = selectedProductType === 'all' ||
      (selectedProductType === 'addon' && productIsAddon) ||
      (selectedProductType === 'base' && !productIsAddon)

    return matchesSearch && matchesCategory && matchesStatus && matchesProductType
  })

  // Handle product actions
  const handleEditProduct = (product: Product) => {
    setEditingProduct(product)
    setShowProductForm(true)
  }

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return

    try {
      const response = await fetch(`/api/ecommerce/products?id=${productId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setProducts(products.filter(p => p.id !== productId))
      }
    } catch (error) {
      console.error('Failed to delete product:', error)
    }
  }

  const handleProductSaved = () => {
    setShowProductForm(false)
    setEditingProduct(null)
    loadData()
    loadLocales()
  }

  const handleLocaleChange = (country: string, lang: string) => {
    setSelectedCountry(country)
    setSelectedLangCode(lang)
  }

  const handleLocaleCreated = (country: string, lang: string) => {
    setSelectedCountry(country)
    setSelectedLangCode(lang)
    loadLocales()
    // loadData will be triggered by the useEffect on selectedCountry/selectedLangCode
  }

  const handleDeleteLocale = async (delCountry: string, delLang: string) => {
    try {
      // Fetch products for this locale and delete them one by one
      const res = await fetch(
        `/api/ecommerce/products?business_unit_id=${businessUnitId}&country=${delCountry}&language=${delLang}&limit=500`
      )
      const data = await res.json()
      const localeProducts = data.products || []

      for (const p of localeProducts) {
        await fetch(`/api/ecommerce/products?id=${p.id}`, { method: 'DELETE' })
      }

      // Switch to first available locale
      const remaining = availableLocales.filter(
        l => !(l.country === delCountry && l.language_code === delLang)
      )
      if (remaining.length > 0) {
        setSelectedCountry(remaining[0].country)
        setSelectedLangCode(remaining[0].language_code)
      }
      loadLocales()
    } catch (error) {
      console.error('Failed to delete locale:', error)
    }
  }

  // Toggle add-on status for a product
  const handleToggleAddon = async (product: Product) => {
    const currentIsAddon = isProductAddon(product)
    const newIsAddon = !currentIsAddon

    // Optimistic update - update metadata
    setProducts(products.map(p =>
      p.id === product.id
        ? { ...p, metadata: { ...p.metadata, is_addon: newIsAddon } }
        : p
    ))

    try {
      const response = await fetch(`/api/ecommerce/products?id=${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_addon: newIsAddon })
      })

      if (!response.ok) {
        // Revert on failure
        setProducts(products.map(p =>
          p.id === product.id
            ? { ...p, metadata: { ...p.metadata, is_addon: currentIsAddon } }
            : p
        ))
        console.error('Failed to update add-on status')
      }
    } catch (error) {
      // Revert on error
      setProducts(products.map(p =>
        p.id === product.id
          ? { ...p, metadata: { ...p.metadata, is_addon: currentIsAddon } }
          : p
      ))
      console.error('Failed to update add-on status:', error)
    }
  }

  // Wizard complete handler
  const handleWizardComplete = () => {
    setShowWizard(false)
    loadData()
  }

  // Load addon counts for base products
  const loadAddonCounts = async () => {
    try {
      // Get all base products (non-addons)
      const baseProductIds = products
        .filter(p => !isProductAddon(p))
        .map(p => p.id)

      if (baseProductIds.length === 0) return

      // Fetch addon matches for all base products
      const counts: Record<string, number> = {}
      for (const productId of baseProductIds) {
        const res = await fetch(`/api/ecommerce/addon-matches?productId=${productId}`)
        const data = await res.json()
        counts[productId] = (data.addonIds || []).length
      }
      setProductAddonCounts(counts)
    } catch (error) {
      console.error('Failed to load addon counts:', error)
    }
  }

  // Load addon counts when products change
  useEffect(() => {
    if (products.length > 0) {
      loadAddonCounts()
    }
  }, [products])

  // Open addon matching modal for a product
  const handleEditAddons = (product: Product) => {
    console.log('[handleEditAddons] Product:', product)
    console.log('[handleEditAddons] Categories loaded:', categories)

    // Get product's category
    const categoryMapping = product.product_category_mapping?.[0]
    console.log('[handleEditAddons] Category mapping:', categoryMapping)

    const categoryName = categoryMapping?.product_categories?.name || ''
    console.log('[handleEditAddons] Looking for category name:', categoryName)

    const category = categories.find(c => c.name === categoryName)
    console.log('[handleEditAddons] Found category:', category)

    if (!category) {
      alert('Product must have a category assigned to edit add-ons. Category name: ' + categoryName + ', Categories: ' + categories.map(c => c.name).join(', '))
      return
    }

    const modalProduct = {
      id: product.id,
      title: product.title,
      category: category.handle,
      categoryId: category.id
    }
    console.log('[handleEditAddons] Setting modal product:', modalProduct)
    setAddonModalProduct(modalProduct)
  }

  // Save addon matches
  const handleSaveAddons = async (productId: string, addonIds: string[]) => {
    try {
      const res = await fetch('/api/ecommerce/addon-matches', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, addonIds })
      })

      if (res.ok) {
        // Update count
        setProductAddonCounts(prev => ({
          ...prev,
          [productId]: addonIds.length
        }))
      }
    } catch (error) {
      console.error('Failed to save addon matches:', error)
      throw error
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  // Show wizard overlay
  if (showWizard) {
    return (
      <div className="h-[600px]">
        <CatalogSetupWizard
          businessUnitId={businessUnitId}
          onComplete={handleWizardComplete}
          onClose={() => setShowWizard(false)}
        />
      </div>
    )
  }

  // Show product form
  if (showProductForm) {
    return (
      <div>
        <div className="mb-4 flex items-center gap-4">
          <button
            onClick={() => { setShowProductForm(false); setEditingProduct(null) }}
            className="flex items-center gap-2 text-slate-400 hover:text-white"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
            Back to Catalog
          </button>
        </div>
        <ProductForm
          businessUnitId={businessUnitId}
          productId={editingProduct?.id}
          country={selectedCountry}
          languageCode={selectedLangCode}
          onSave={handleProductSaved}
          onCancel={() => { setShowProductForm(false); setEditingProduct(null) }}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Product Language Bar */}
      <ProductLanguageBar
        businessUnitId={businessUnitId}
        currentCountry={selectedCountry}
        currentLanguage={selectedLangCode}
        onLocaleChange={handleLocaleChange}
        onAddLocale={() => setShowAddLocaleModal(true)}
        onDeleteLocale={handleDeleteLocale}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Product Catalog</h1>
          <p className="text-slate-400 mt-1">
            {totalProducts} products, {categories.length} categories, {productTypes.filter(t => t.is_addon).length} addon types
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Bulk Import Dropdown */}
          <div className="relative" ref={bulkImportRef}>
            <button
              onClick={() => setShowBulkImportMenu(!showBulkImportMenu)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
            >
              <Upload className="w-4 h-4" />
              Bulk Import
              <ChevronDown className={`w-4 h-4 transition-transform ${showBulkImportMenu ? 'rotate-180' : ''}`} />
            </button>
            {showBulkImportMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-50 overflow-hidden">
                <button
                  onClick={() => {
                    setShowBulkImportMenu(false)
                    setShowWizard(true)
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700 text-left"
                >
                  <FileText className="w-5 h-5 text-blue-400" />
                  <div>
                    <div className="text-white font-medium">Upload Document</div>
                    <div className="text-xs text-slate-400">PDF, Excel, Word files</div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setShowBulkImportMenu(false)
                    setShowWizard(true)
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700 text-left border-t border-slate-700"
                >
                  <Link2 className="w-5 h-5 text-green-400" />
                  <div>
                    <div className="text-white font-medium">Import from URL</div>
                    <div className="text-xs text-slate-400">Website or product page</div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setShowBulkImportMenu(false)
                    setShowWizard(true)
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700 text-left border-t border-slate-700"
                >
                  <Layers className="w-5 h-5 text-purple-400" />
                  <div>
                    <div className="text-white font-medium">Use Template</div>
                    <div className="text-xs text-slate-400">Industry templates</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Add Product Button */}
          <button
            onClick={() => setShowProductForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/20 rounded-lg">
              <Package className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{totalProducts}</div>
              <div className="text-sm text-slate-400">Total Products</div>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-600/20 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">
                {products.filter(p => p.status === 'published').length}
              </div>
              <div className="text-sm text-slate-400">Published</div>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-600/20 rounded-lg">
              <FolderTree className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{categories.length}</div>
              <div className="text-sm text-slate-400">Categories</div>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-600/20 rounded-lg">
              <Tag className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{productTypes.length}</div>
              <div className="text-sm text-slate-400">Product Types</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs - Simplified: Products → Catalog Settings → Bundles */}
      <div className="flex items-center gap-1 border-b border-slate-700">
        <button
          onClick={() => setActiveTab('products')}
          className={`px-4 py-3 font-medium border-b-2 transition-colors ${
            activeTab === 'products'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Products
        </button>
        <button
          onClick={() => setActiveTab('catalog-settings')}
          className={`px-4 py-3 font-medium border-b-2 transition-colors ${
            activeTab === 'catalog-settings'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Catalog Settings
        </button>
        <button
          onClick={() => setActiveTab('bundles')}
          className={`px-4 py-3 font-medium border-b-2 transition-colors ${
            activeTab === 'bundles'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Bundles
        </button>
      </div>

      {/* Products Tab */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
            <select
              value={selectedProductType}
              onChange={(e) => setSelectedProductType(e.target.value as 'all' | 'base' | 'addon')}
              className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Products</option>
              <option value="base">Base Products</option>
              <option value="addon">Add-ons Only</option>
            </select>
            <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-slate-700' : ''}`}
              >
                <Grid className="w-4 h-4 text-slate-400" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-slate-700' : ''}`}
              >
                <List className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Empty state */}
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12 bg-slate-800/50 rounded-lg border border-slate-700">
              <Package className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No products found</h3>
              <p className="text-slate-400 mb-6">
                {products.length === 0
                  ? "Get started by adding your first product"
                  : "Try adjusting your filters"}
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setShowProductForm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  <Plus className="w-4 h-4" />
                  Add Product
                </button>
                <button
                  onClick={() => setShowWizard(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg"
                >
                  <Upload className="w-4 h-4" />
                  Bulk Import
                </button>
              </div>
            </div>
          ) : viewMode === 'grid' ? (
            /* Grid View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map(product => (
                <div
                  key={product.id}
                  className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden hover:border-slate-600 transition-colors group"
                >
                  <div className="aspect-square bg-slate-700 relative">
                    {(product.thumbnail || product.product_images?.[0]?.url) ? (
                      <img
                        src={product.thumbnail || product.product_images?.[0]?.url}
                        alt={product.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-12 h-12 text-slate-600" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEditProduct(product)}
                        className="p-2 bg-slate-900/80 hover:bg-slate-900 rounded-lg"
                      >
                        <Edit className="w-4 h-4 text-white" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="p-2 bg-slate-900/80 hover:bg-red-600 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4 text-white" />
                      </button>
                    </div>
                    <div className="absolute top-2 left-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        product.status === 'published'
                          ? 'bg-green-600 text-white'
                          : product.status === 'draft'
                          ? 'bg-yellow-600 text-white'
                          : 'bg-slate-600 text-white'
                      }`}>
                        {product.status}
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-white truncate">{product.title}</h3>
                        {product.tagline && (
                          <p className="text-sm text-slate-400 truncate mt-1">{product.tagline}</p>
                        )}
                      </div>
                      <label className="flex items-center gap-1.5 cursor-pointer" title={isProductAddon(product) ? 'Click to remove from add-ons' : 'Click to mark as add-on'}>
                        <input
                          type="checkbox"
                          checked={isProductAddon(product)}
                          onChange={() => handleToggleAddon(product)}
                          className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-orange-500 focus:ring-orange-500 cursor-pointer"
                        />
                        <span className="text-xs text-slate-400">Add-on</span>
                      </label>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-sm text-slate-500">
                        {(() => {
                          // Check metadata price first (simple products)
                          if (product.metadata?.price) return `$${product.metadata.price}`
                          // Check variant prices (products with variants)
                          const variantPrices = product.product_variants
                            ?.map(v => v.product_variant_prices?.[0]?.amount)
                            .filter((p): p is number => p !== undefined && p !== null)
                          if (variantPrices && variantPrices.length > 0) {
                            const min = Math.min(...variantPrices)
                            const max = Math.max(...variantPrices)
                            return min === max ? `$${min}` : `$${min} - $${max}`
                          }
                          return 'No price'
                        })()}
                      </span>
                      {product.product_types && (
                        <span className="text-xs px-2 py-1 bg-slate-700 text-slate-300 rounded">
                          {product.product_types.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* List View */
            <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-700/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Product</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Category</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Type</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Status</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-slate-300">Add-ons</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-slate-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {filteredProducts.map(product => {
                    const productIsAddon = isProductAddon(product)
                    const addonCount = productAddonCounts[product.id] || 0
                    const categoryName = product.product_category_mapping?.[0]?.product_categories?.name || '-'

                    return (
                      <tr key={product.id} className="hover:bg-slate-700/30">
                        {/* Product Name & Image */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-700 rounded overflow-hidden flex-shrink-0">
                              {(product.thumbnail || product.product_images?.[0]?.url) ? (
                                <img src={product.thumbnail || product.product_images?.[0]?.url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Package className="w-5 h-5 text-slate-500" />
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-white">{product.title}</div>
                              {product.tagline && (
                                <div className="text-sm text-slate-400">{product.tagline}</div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="px-4 py-3 text-sm text-slate-300">
                          {categoryName}
                        </td>

                        {/* Type */}
                        <td className="px-4 py-3 text-sm text-slate-300">
                          <div className="flex items-center gap-2">
                            {product.product_types?.name || '-'}
                            {productIsAddon && (
                              <span className="px-1.5 py-0.5 text-xs bg-orange-600/20 text-orange-400 rounded">
                                Add-on
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs font-medium rounded ${
                            product.status === 'published'
                              ? 'bg-green-600/20 text-green-400'
                              : product.status === 'draft'
                              ? 'bg-yellow-600/20 text-yellow-400'
                              : 'bg-slate-600/20 text-slate-400'
                          }`}>
                            {product.status}
                          </span>
                        </td>

                        {/* Add-ons Column - Only for base products */}
                        <td className="px-4 py-3 text-center">
                          {productIsAddon ? (
                            <span className="text-xs text-slate-500">-</span>
                          ) : (
                            <button
                              onClick={() => handleEditAddons(product)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-700 hover:bg-slate-600 rounded text-sm transition-colors"
                            >
                              <span className={addonCount > 0 ? 'text-blue-400' : 'text-slate-400'}>
                                {addonCount}
                              </span>
                              <Edit className="w-3 h-3 text-slate-400" />
                            </button>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEditProduct(product)}
                              className="p-2 hover:bg-slate-700 rounded-lg"
                              title="Edit product"
                            >
                              <Edit className="w-4 h-4 text-slate-400" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product.id)}
                              className="p-2 hover:bg-red-600/20 rounded-lg"
                              title="Delete product"
                            >
                              <Trash2 className="w-4 h-4 text-slate-400 hover:text-red-400" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Catalog Settings Tab */}
      {activeTab === 'catalog-settings' && (
        <CatalogSettings
          businessUnitId={businessUnitId}
          onDataChange={loadData}
        />
      )}

      {/* Bundles Tab */}
      {activeTab === 'bundles' && (
        <BundleManager
          businessUnitId={businessUnitId}
          language={language as any}
        />
      )}

      {/* Add-on Matching Modal */}
      {addonModalProduct && (
        <AddonMatchingModal
          isOpen={!!addonModalProduct}
          onClose={() => setAddonModalProduct(null)}
          product={addonModalProduct}
          businessUnitId={businessUnitId}
          onSave={handleSaveAddons}
        />
      )}

      {/* Add Product Locale Modal */}
      <ProductAddLocaleModal
        isOpen={showAddLocaleModal}
        onClose={() => setShowAddLocaleModal(false)}
        businessUnitId={businessUnitId}
        existingLocales={availableLocales}
        onLocaleCreated={handleLocaleCreated}
      />
    </div>
  )
}
