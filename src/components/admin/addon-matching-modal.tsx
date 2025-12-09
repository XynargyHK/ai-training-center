'use client'

/**
 * Add-on Matching Modal (Generic Approach)
 *
 * Shows a table of add-ons grouped by attribute options
 * Filtered by product's category (Face product → Face options only)
 *
 * Uses generic tables:
 * - product_attributes (defines filterable attributes like "Skin Concerns")
 * - product_attribute_options (options like "Acne", "Dryness" linked to categories)
 * - product_attribute_values (links products/add-ons to options)
 * - product_addon_matches (manual matches between products and add-ons)
 */

import { useState, useEffect } from 'react'
import { X, Loader2, Check, Package, Zap } from 'lucide-react'

interface AttributeOption {
  id: string
  name: string
  attribute_id: string
  attribute_name: string
}

interface Addon {
  id: string
  title: string
  tradeName?: string
  thumbnail?: string
  optionIds: string[] // Which attribute options this addon has
}

interface AddonMatchingModalProps {
  isOpen: boolean
  onClose: () => void
  product: {
    id: string
    title: string
    category: string // category handle: 'face', 'eye', 'body', 'scalp'
    categoryId: string
  }
  businessUnitId: string
  onSave: (productId: string, addonIds: string[]) => Promise<void>
}

export default function AddonMatchingModal({
  isOpen,
  onClose,
  product,
  businessUnitId,
  onSave
}: AddonMatchingModalProps) {
  const [options, setOptions] = useState<AttributeOption[]>([])
  const [addons, setAddons] = useState<Addon[]>([])
  const [selectedAddonIds, setSelectedAddonIds] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (isOpen && product) {
      loadData()
    }
  }, [isOpen, product])

  const loadData = async () => {
    setIsLoading(true)
    try {
      console.log('[AddonModal] Loading data for product:', product)
      console.log('[AddonModal] businessUnitId:', businessUnitId)

      // 1. Get category-linked attributes and their options filtered by product's category
      const attrsRes = await fetch(
        `/api/ecommerce/attributes?businessUnitId=${businessUnitId}`
      )
      const attrsData = await attrsRes.json()
      console.log('[AddonModal] Attributes response:', attrsData)

      // Filter to category-linked attributes only
      const categoryLinkedAttrs = (attrsData.attributes || []).filter(
        (a: any) => a.is_category_linked
      )
      console.log('[AddonModal] Category-linked attributes:', categoryLinkedAttrs)

      // Collect options that belong to product's category
      const categoryOptions: AttributeOption[] = []
      for (const attr of categoryLinkedAttrs) {
        console.log('[AddonModal] Filtering options for categoryId:', product.categoryId)
        console.log('[AddonModal] Attribute options:', attr.options)
        const filteredOptions = (attr.options || []).filter(
          (o: any) => o.category_id === product.categoryId
        )
        console.log('[AddonModal] Filtered options:', filteredOptions)
        for (const opt of filteredOptions) {
          categoryOptions.push({
            id: opt.id,
            name: opt.name,
            attribute_id: attr.id,
            attribute_name: attr.name
          })
        }
      }
      console.log('[AddonModal] Final categoryOptions:', categoryOptions)
      setOptions(categoryOptions)

      // 2. Get all add-on products with their attribute values
      const productsRes = await fetch(
        `/api/ecommerce/products?business_unit_id=${businessUnitId}&limit=200`
      )
      const productsData = await productsRes.json()
      console.log('[AddonModal] Products response:', productsData.products?.length, 'products')

      // Filter to add-ons only
      const addonProducts = (productsData.products || []).filter(
        (p: any) => p.product_types?.is_addon === true || p.metadata?.is_addon === true
      )
      console.log('[AddonModal] Add-on products:', addonProducts.length, addonProducts.map((p: any) => p.title))

      // 3. Get attribute values for all add-ons
      const addonIds = addonProducts.map((p: any) => p.id)
      console.log('[AddonModal] Add-on IDs:', addonIds)

      // Fetch attribute values for these products
      const valuesRes = await fetch(
        `/api/ecommerce/product-attribute-values?productIds=${addonIds.join(',')}`
      )
      const valuesData = await valuesRes.json()
      console.log('[AddonModal] Attribute values:', valuesData)

      // Build addon -> optionIds map
      const addonOptionMap = new Map<string, string[]>()
      for (const val of valuesData.values || []) {
        const existing = addonOptionMap.get(val.product_id) || []
        existing.push(val.option_id)
        addonOptionMap.set(val.product_id, existing)
      }
      console.log('[AddonModal] Addon option map:', Object.fromEntries(addonOptionMap))

      // Map addon products with their options
      const addonList: Addon[] = addonProducts.map((p: any) => ({
        id: p.id,
        title: p.title,
        tradeName: p.trade_name,
        thumbnail: p.thumbnail || p.product_images?.[0]?.url,
        optionIds: addonOptionMap.get(p.id) || []
      }))
      console.log('[AddonModal] Final addon list:', addonList)

      setAddons(addonList)

      // 4. Load existing matches for this product
      const matchesRes = await fetch(
        `/api/ecommerce/addon-matches?productId=${product.id}`
      )
      const matchesData = await matchesRes.json()
      setSelectedAddonIds(new Set(matchesData.addonIds || []))

    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleAddon = (addonId: string) => {
    setSelectedAddonIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(addonId)) {
        newSet.delete(addonId)
      } else {
        newSet.add(addonId)
      }
      return newSet
    })
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave(product.id, Array.from(selectedAddonIds))
      onClose()
    } catch (error) {
      console.error('Failed to save:', error)
    } finally {
      setIsSaving(false)
    }
  }

  // Get addons that have a specific option
  const getAddonsForOption = (optionId: string): Addon[] => {
    return addons.filter(addon => addon.optionIds.includes(optionId))
  }

  // Get options that have at least one addon
  const optionsWithAddons = options.filter(option => {
    return getAddonsForOption(option.id).length > 0
  })

  // Group options by attribute name
  const optionsByAttribute = optionsWithAddons.reduce((acc, option) => {
    if (!acc[option.attribute_name]) {
      acc[option.attribute_name] = []
    }
    acc[option.attribute_name].push(option)
    return acc
  }, {} as Record<string, AttributeOption[]>)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Select Add-ons for: {product.title}
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Category: <span className="text-blue-400 capitalize">{product.category}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : Object.keys(optionsByAttribute).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Zap className="w-12 h-12 mb-4 opacity-30" />
              <p className="text-center">
                No add-ons available for {product.category} options.
                <br />
                <span className="text-sm">Assign attribute values to add-ons first.</span>
              </p>
            </div>
          ) : (
            <div className="p-6">
              {Object.entries(optionsByAttribute).map(([attrName, attrOptions]) => (
                <div key={attrName} className="mb-6">
                  <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">
                    {product.category.toUpperCase()} {attrName.toUpperCase()}
                  </h3>

                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-400 w-1/3">
                          {attrName.replace('Skin ', '')}
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">
                          Add-on
                        </th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-slate-400 w-20">
                          Select
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {attrOptions.map((option) => {
                        const addonsForOption = getAddonsForOption(option.id)

                        return addonsForOption.map((addon, addonIdx) => (
                          <tr
                            key={`${option.id}-${addon.id}`}
                            className={`border-b border-slate-700/50 hover:bg-slate-700/30 ${
                              selectedAddonIds.has(addon.id) ? 'bg-blue-900/20' : ''
                            }`}
                          >
                            {/* Show option name only on first row */}
                            <td className="py-3 px-4">
                              {addonIdx === 0 && (
                                <span className="font-medium text-white">
                                  {option.name}
                                </span>
                              )}
                            </td>

                            {/* Addon */}
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                {addon.thumbnail ? (
                                  <img
                                    src={addon.thumbnail}
                                    alt=""
                                    className="w-8 h-8 rounded object-cover"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded bg-slate-700 flex items-center justify-center">
                                    <Package className="w-4 h-4 text-slate-500" />
                                  </div>
                                )}
                                <span className={`text-sm ${
                                  selectedAddonIds.has(addon.id) ? 'text-blue-300' : 'text-slate-300'
                                }`}>
                                  {addon.title}
                                  {addon.tradeName && (
                                    <span className="text-slate-500 ml-1">({addon.tradeName})</span>
                                  )}
                                </span>
                              </div>
                            </td>

                            {/* Checkbox */}
                            <td className="py-3 px-4 text-center">
                              <button
                                onClick={() => toggleAddon(addon.id)}
                                className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                                  selectedAddonIds.has(addon.id)
                                    ? 'bg-blue-600 border-blue-600'
                                    : 'border-slate-500 hover:border-slate-400'
                                }`}
                              >
                                {selectedAddonIds.has(addon.id) && (
                                  <Check className="w-4 h-4 text-white" />
                                )}
                              </button>
                            </td>
                          </tr>
                        ))
                      })}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-700 bg-slate-800/50">
          <div className="text-sm text-slate-400">
            Selected: <span className="text-blue-400 font-medium">{selectedAddonIds.size}</span> add-ons
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
