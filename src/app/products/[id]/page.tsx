'use client'

/**
 * Product Detail Page
 * Displays product with dynamic fields based on business unit template
 * Supports: SkinCoach personalized skincare, and 21 other industry templates
 */

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { MetaPixel } from '@/lib/meta-pixel'

interface Product {
  id: string
  business_unit_id: string
  title: string
  description?: string
  tagline?: string
  handle?: string
  thumbnail?: string
  status: string
  // Pricing
  price?: number
  compare_at_price?: number
  cost_price?: number
  // Inventory
  stock_quantity?: number
  track_inventory?: boolean
  low_stock_threshold?: number
  allow_backorder?: boolean
  sku?: string
  barcode?: string
  // Display
  is_featured?: boolean
  badges?: string[]
  // SkinCoach specific fields (hardcoded for personalized skincare)
  ingredients?: string
  hero_benefit?: string
  key_actives?: string
  face_benefits?: string
  body_benefits?: string
  hair_benefits?: string
  eye_benefits?: string
  clinical_studies?: string
  trade_name?: string
  // Relations
  product_types?: { name: string; is_addon: boolean }
  product_category_mapping?: { product_categories: { name: string } }[]
  product_variants?: ProductVariant[]
  product_addons?: { addon_product: Product; is_recommended: boolean }[]
  // Dynamic custom field values
  custom_values?: CustomFieldValue[]
  created_at: string
  updated_at: string
}

interface ProductVariant {
  id: string
  title: string
  sku?: string
  product_variant_prices?: { amount: number; currency_code: string }[]
}

interface CustomFieldValue {
  field_key: string
  field_label: string
  field_type: string
  display_section: string
  value_text?: string
  value_number?: number
  value_boolean?: boolean
  value_json?: any
}

interface FieldDefinition {
  field_key: string
  field_label: string
  field_type: string
  display_section: string
}

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const [product, setProduct] = useState<Product | null>(null)
  const [fieldDefinitions, setFieldDefinitions] = useState<FieldDefinition[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<string>('face')
  const [expandedAccordions, setExpandedAccordions] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchProduct()
  }, [resolvedParams.id])

  const fetchProduct = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/ecommerce/products/${resolvedParams.id}`)
      const data = await response.json()

      if (response.ok) {
        setProduct(data.product)
        MetaPixel.viewContent({
          content_name: data.product.title,
          content_ids: [data.product.id],
          content_type: 'product',
          value: data.product.cost_price || data.product.price || 0,
          currency: 'USD',
        })
        if (data.product.product_variants?.length > 0) {
          setSelectedVariant(data.product.product_variants[0].id)
        }
        // Fetch field definitions for this business unit
        if (data.product.business_unit_id) {
          const configRes = await fetch(`/api/ecommerce/business-config?businessUnitId=${data.product.business_unit_id}`)
          const configData = await configRes.json()
          if (configData.fields) {
            setFieldDefinitions(configData.fields)
          }
        }
      } else {
        setError(data.error || 'Failed to fetch product')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Get custom field value by key
  const getCustomValue = (key: string): string | number | boolean | null => {
    const cv = product?.custom_values?.find(v => v.field_key === key)
    if (!cv) return null
    if (cv.value_text) return cv.value_text
    if (cv.value_number !== undefined) return cv.value_number
    if (cv.value_boolean !== undefined) return cv.value_boolean
    if (cv.value_json) return JSON.stringify(cv.value_json)
    return null
  }

  // Group custom fields by display section
  const getCustomFieldsBySection = (section: string): FieldDefinition[] => {
    return fieldDefinitions.filter(f => f.display_section === section)
  }

  const toggleAccordion = (key: string) => {
    const newSet = new Set(expandedAccordions)
    if (newSet.has(key)) {
      newSet.delete(key)
    } else {
      newSet.add(key)
    }
    setExpandedAccordions(newSet)
  }

  const getSelectedVariantPrice = (): { price: number; currency: string } | null => {
    if (!product?.product_variants || !selectedVariant) return null
    const variant = product.product_variants.find(v => v.id === selectedVariant)
    if (!variant?.product_variant_prices?.length) return null
    return {
      price: variant.product_variant_prices[0].amount,
      currency: variant.product_variant_prices[0].currency_code
    }
  }

  const formatPrice = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(amount)
  }

  // Get categories as array
  const categories = product?.product_category_mapping?.map(m => m.product_categories?.name).filter(Boolean) || []

  // Determine which benefit tabs to show
  const benefitTabs = []
  if (product?.face_benefits) benefitTabs.push({ key: 'face', label: 'Face', content: product.face_benefits })
  if (product?.body_benefits) benefitTabs.push({ key: 'body', label: 'Body', content: product.body_benefits })
  if (product?.hair_benefits) benefitTabs.push({ key: 'hair', label: 'Hair/Scalp', content: product.hair_benefits })
  if (product?.eye_benefits) benefitTabs.push({ key: 'eye', label: 'Eye', content: product.eye_benefits })

  // Accordion sections
  const accordionSections = []
  if (product?.key_actives) accordionSections.push({ key: 'key_actives', label: 'Key Actives', content: product.key_actives })
  if (product?.ingredients) accordionSections.push({ key: 'ingredients', label: 'Ingredients', content: product.ingredients })
  if (product?.clinical_studies) accordionSections.push({ key: 'clinical', label: 'Clinical Studies', content: product.clinical_studies })
  if (product?.trade_name) accordionSections.push({ key: 'trade_name', label: 'Trade Name', content: product.trade_name })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-pulse">🧴</div>
          <p className="text-gray-600">Loading product...</p>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">❌</div>
          <p className="text-red-600">{error || 'Product not found'}</p>
          <Link href="/products" className="mt-4 inline-block text-blue-600 hover:underline">
            Back to Products
          </Link>
        </div>
      </div>
    )
  }

  const variantPrice = getSelectedVariantPrice()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex text-sm text-gray-500">
            <Link href="/products" className="hover:text-gray-700">Products</Link>
            <span className="mx-2">/</span>
            {product.product_types && (
              <>
                <span className="hover:text-gray-700">{product.product_types.name}</span>
                <span className="mx-2">/</span>
              </>
            )}
            <span className="text-gray-900 font-medium">{product.title}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Main Product Section - Image Left, Details Right */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            {/* Product Image */}
            <div className="bg-gray-100 aspect-square flex items-center justify-center p-8">
              {product.thumbnail ? (
                <img
                  src={product.thumbnail}
                  alt={product.title}
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <div className="text-8xl text-gray-300">🧴</div>
              )}
            </div>

            {/* Product Details */}
            <div className="p-8">
              {/* Badges */}
              {product.badges && product.badges.length > 0 && (
                <div className="flex gap-2 mb-3">
                  {product.badges.map((badge, i) => (
                    <span key={i} className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-700 rounded-full uppercase">
                      {badge}
                    </span>
                  ))}
                </div>
              )}

              {/* Category Tags */}
              {categories.length > 0 && (
                <div className="flex gap-2 mb-3">
                  {categories.map((cat, i) => (
                    <span key={i} className="px-3 py-1 text-xs font-medium bg-blue-50 text-blue-600 rounded-full">
                      {cat}
                    </span>
                  ))}
                </div>
              )}

              {/* Title */}
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.title}</h1>

              {/* Tagline */}
              {product.tagline && (
                <p className="text-lg text-gray-500 italic mb-4">{product.tagline}</p>
              )}

              {/* Product Type */}
              {product.product_types && (
                <div className="flex items-center gap-2 mb-4">
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                    product.product_types.is_addon
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {product.product_types.name}
                    {product.product_types.is_addon && ' (Add-on)'}
                  </span>
                </div>
              )}

              {/* Pricing */}
              <div className="mb-6">
                {variantPrice ? (
                  <div className="flex items-center gap-3">
                    <span className="text-3xl font-bold text-gray-900">
                      {formatPrice(variantPrice.price, variantPrice.currency)}
                    </span>
                    {product.compare_at_price && product.compare_at_price > variantPrice.price && (
                      <span className="text-xl text-gray-400 line-through">
                        {formatPrice(product.compare_at_price, variantPrice.currency)}
                      </span>
                    )}
                  </div>
                ) : product.price ? (
                  <div className="flex items-center gap-3">
                    <span className="text-3xl font-bold text-gray-900">
                      {formatPrice(product.price)}
                    </span>
                    {product.compare_at_price && product.compare_at_price > product.price && (
                      <span className="text-xl text-gray-400 line-through">
                        {formatPrice(product.compare_at_price)}
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-gray-500">Price not set</span>
                )}
              </div>

              {/* Variant Selector */}
              {product.product_variants && product.product_variants.length > 0 && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Size</label>
                  <div className="flex flex-wrap gap-2">
                    {product.product_variants.map((variant) => (
                      <button
                        key={variant.id}
                        onClick={() => setSelectedVariant(variant.id)}
                        className={`px-4 py-2 border-2 rounded-lg font-medium transition-colors ${
                          selectedVariant === variant.id
                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {variant.title}
                        {variant.product_variant_prices?.[0] && (
                          <span className="ml-2 text-sm text-gray-500">
                            ({formatPrice(variant.product_variant_prices[0].amount)})
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Stock Status */}
              {product.track_inventory && (
                <div className="mb-6">
                  {product.stock_quantity && product.stock_quantity > 0 ? (
                    product.stock_quantity <= (product.low_stock_threshold || 5) ? (
                      <p className="text-orange-600 font-medium">
                        Only {product.stock_quantity} left in stock!
                      </p>
                    ) : (
                      <p className="text-green-600 font-medium">In Stock</p>
                    )
                  ) : product.allow_backorder ? (
                    <p className="text-yellow-600 font-medium">Available for Backorder</p>
                  ) : (
                    <p className="text-red-600 font-medium">Out of Stock</p>
                  )}
                </div>
              )}

              {/* Add to Cart Button */}
              <button className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors text-lg mb-4">
                Add to Cart
              </button>

              {/* SKU */}
              {product.sku && (
                <p className="text-sm text-gray-500">SKU: {product.sku}</p>
              )}
            </div>
          </div>
        </div>

        {/* Hero Benefit */}
        {product.hero_benefit && (
          <div className="mt-8 bg-white rounded-xl shadow-sm p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Overview</h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">{product.hero_benefit}</p>
          </div>
        )}

        {/* Benefits Tabs */}
        {benefitTabs.length > 0 && (
          <div className="mt-8 bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="border-b">
              <div className="flex">
                {benefitTabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`px-6 py-4 font-medium text-sm transition-colors ${
                      activeTab === tab.key
                        ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {tab.label} Benefits
                  </button>
                ))}
              </div>
            </div>
            <div className="p-8">
              {benefitTabs.find(t => t.key === activeTab)?.content && (
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {benefitTabs.find(t => t.key === activeTab)?.content}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Accordion Sections */}
        {accordionSections.length > 0 && (
          <div className="mt-8 bg-white rounded-xl shadow-sm overflow-hidden divide-y">
            {accordionSections.map((section) => (
              <div key={section.key}>
                <button
                  onClick={() => toggleAccordion(section.key)}
                  className="w-full px-8 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="font-medium text-gray-900">{section.label}</span>
                  <span className={`text-xl transition-transform ${
                    expandedAccordions.has(section.key) ? 'rotate-180' : ''
                  }`}>
                    ▾
                  </span>
                </button>
                {expandedAccordions.has(section.key) && (
                  <div className="px-8 pb-6">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                      {section.content}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Recommended Add-ons */}
        {product.product_addons && product.product_addons.length > 0 && (
          <div className="mt-8 bg-white rounded-xl shadow-sm p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Pair With These Products</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {product.product_addons.map((addon) => (
                <Link
                  key={addon.addon_product.id}
                  href={`/products/${addon.addon_product.id}`}
                  className="group"
                >
                  <div className="bg-gray-100 aspect-square rounded-lg overflow-hidden mb-2 group-hover:ring-2 ring-blue-500 transition-all">
                    {addon.addon_product.thumbnail ? (
                      <img
                        src={addon.addon_product.thumbnail}
                        alt={addon.addon_product.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl text-gray-300">
                        🧴
                      </div>
                    )}
                  </div>
                  <h3 className="font-medium text-gray-900 text-sm group-hover:text-blue-600 transition-colors">
                    {addon.addon_product.title}
                  </h3>
                  {addon.is_recommended && (
                    <span className="text-xs text-green-600">Recommended</span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Dynamic Custom Fields - Main Section */}
        {getCustomFieldsBySection('main').length > 0 && (
          <div className="mt-8 bg-white rounded-xl shadow-sm p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Product Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {getCustomFieldsBySection('main').map((field) => {
                const value = getCustomValue(field.field_key)
                if (!value) return null
                return (
                  <div key={field.field_key}>
                    <dt className="text-sm font-medium text-gray-500">{field.field_label}</dt>
                    <dd className="mt-1 text-gray-900">
                      {field.field_type === 'boolean' ? (
                        value ? 'Yes' : 'No'
                      ) : field.field_type === 'url' ? (
                        <a href={String(value)} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                          {String(value)}
                        </a>
                      ) : (
                        String(value)
                      )}
                    </dd>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Dynamic Custom Fields - Tab Section */}
        {(() => {
          const tabFields = getCustomFieldsBySection('tab')
          const tabsWithValues = tabFields.filter(f => getCustomValue(f.field_key))
          if (tabsWithValues.length === 0) return null

          return (
            <div className="mt-8 bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="border-b">
                <div className="flex overflow-x-auto">
                  {tabsWithValues.map((field) => (
                    <button
                      key={field.field_key}
                      onClick={() => setActiveTab(field.field_key)}
                      className={`px-6 py-4 font-medium text-sm transition-colors whitespace-nowrap ${
                        activeTab === field.field_key
                          ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {field.field_label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="p-8">
                {tabsWithValues.map((field) => {
                  if (activeTab !== field.field_key) return null
                  const value = getCustomValue(field.field_key)
                  return (
                    <p key={field.field_key} className="text-gray-700 leading-relaxed whitespace-pre-line">
                      {String(value)}
                    </p>
                  )
                })}
              </div>
            </div>
          )
        })()}

        {/* Dynamic Custom Fields - Accordion Section */}
        {(() => {
          const accordionFields = getCustomFieldsBySection('accordion')
          const accordionsWithValues = accordionFields.filter(f => getCustomValue(f.field_key))
          if (accordionsWithValues.length === 0) return null

          return (
            <div className="mt-8 bg-white rounded-xl shadow-sm overflow-hidden divide-y">
              {accordionsWithValues.map((field) => {
                const value = getCustomValue(field.field_key)
                return (
                  <div key={field.field_key}>
                    <button
                      onClick={() => toggleAccordion(field.field_key)}
                      className="w-full px-8 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                    >
                      <span className="font-medium text-gray-900">{field.field_label}</span>
                      <span className={`text-xl transition-transform ${
                        expandedAccordions.has(field.field_key) ? 'rotate-180' : ''
                      }`}>
                        ▾
                      </span>
                    </button>
                    {expandedAccordions.has(field.field_key) && (
                      <div className="px-8 pb-6">
                        <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                          {String(value)}
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )
        })()}

        {/* Dynamic Custom Fields - Sidebar Section */}
        {(() => {
          const sidebarFields = getCustomFieldsBySection('sidebar')
          const sidebarWithValues = sidebarFields.filter(f => getCustomValue(f.field_key))
          if (sidebarWithValues.length === 0) return null

          return (
            <div className="mt-8 bg-gray-100 rounded-xl p-6">
              <h3 className="font-medium text-gray-900 mb-4">Additional Information</h3>
              <dl className="space-y-3">
                {sidebarWithValues.map((field) => {
                  const value = getCustomValue(field.field_key)
                  return (
                    <div key={field.field_key} className="flex justify-between text-sm">
                      <dt className="text-gray-500">{field.field_label}</dt>
                      <dd className="text-gray-900 font-medium">
                        {field.field_type === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
                      </dd>
                    </div>
                  )
                })}
              </dl>
            </div>
          )
        })()}

        {/* Back Button */}
        <div className="mt-8">
          <Link
            href="/products"
            className="inline-flex items-center text-blue-600 hover:text-blue-700"
          >
            ← Back to Products
          </Link>
        </div>
      </div>
    </div>
  )
}
