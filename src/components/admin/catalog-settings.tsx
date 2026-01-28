'use client'

/**
 * Catalog Settings Component
 *
 * Unified settings page for managing:
 * - Categories (where products go)
 * - Product Types (what products are)
 * - Attributes (filterable features like skin concerns)
 */

import { useState, useEffect } from 'react'
import {
  Loader2, Plus, FolderTree, Tag, Settings, Edit, Trash2, X,
  ChevronDown, ChevronRight, AlertCircle, Wand2
} from 'lucide-react'

interface Category {
  id: string
  name: string
  handle: string
  icon?: string
  product_count?: number
}

interface ProductType {
  id: string
  name: string
  handle: string
  is_addon: boolean
  product_count?: number
}

interface AttributeOption {
  id: string
  name: string
  handle: string
  category_id?: string
  category_name?: string
}

interface Attribute {
  id: string
  name: string
  handle: string
  attribute_type: string
  is_category_linked: boolean
  is_filterable: boolean
  options: AttributeOption[]
}

interface CatalogSettingsProps {
  businessUnitId: string
  onDataChange?: () => void
}

export default function CatalogSettings({ businessUnitId, onDataChange }: CatalogSettingsProps) {
  // Data state
  const [categories, setCategories] = useState<Category[]>([])
  const [productTypes, setProductTypes] = useState<ProductType[]>([])
  const [attributes, setAttributes] = useState<Attribute[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // UI state
  const [activeSection, setActiveSection] = useState<'categories' | 'types' | 'attributes'>('categories')
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState<'category' | 'type' | 'attribute' | 'option'>('category')
  const [editingItem, setEditingItem] = useState<any>(null)
  const [expandedAttributes, setExpandedAttributes] = useState<Set<string>>(new Set())

  // Form state
  const [formData, setFormData] = useState<any>({})

  // Load data
  useEffect(() => {
    loadData()
  }, [businessUnitId])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [categoriesRes, typesRes, attributesRes] = await Promise.all([
        fetch(`/api/ecommerce/categories?businessUnitId=${businessUnitId}`),
        fetch(`/api/ecommerce/product-types?businessUnitId=${businessUnitId}`),
        fetch(`/api/ecommerce/attributes?businessUnitId=${businessUnitId}`)
      ])

      const [categoriesData, typesData, attributesData] = await Promise.all([
        categoriesRes.json(),
        typesRes.json(),
        attributesRes.json()
      ])

      setCategories(categoriesData.categories || [])
      setProductTypes(typesData.types || [])
      setAttributes(attributesData.attributes || [])
    } catch (error) {
      console.error('Failed to load catalog settings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Modal handlers
  const openModal = (type: 'category' | 'type' | 'attribute' | 'option', item?: any, parentId?: string) => {
    setModalType(type)
    setEditingItem(item)

    if (type === 'category') {
      setFormData({
        name: item?.name || '',
        handle: item?.handle || '',
        icon: item?.icon || ''
      })
    } else if (type === 'type') {
      setFormData({
        name: item?.name || '',
        handle: item?.handle || '',
        is_addon: item?.is_addon || false
      })
    } else if (type === 'attribute') {
      setFormData({
        name: item?.name || '',
        handle: item?.handle || '',
        attribute_type: item?.attribute_type || 'feature',
        is_category_linked: item?.is_category_linked || false,
        is_filterable: item?.is_filterable ?? true
      })
    } else if (type === 'option') {
      setFormData({
        name: item?.name || '',
        handle: item?.handle || '',
        category_id: item?.category_id || '',
        attribute_id: parentId || ''
      })
    }

    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingItem(null)
    setFormData({})
  }

  // Save handlers
  const handleSave = async () => {
    try {
      let url = ''
      let method = editingItem ? 'PUT' : 'POST'
      let body: any = { businessUnitId }

      if (modalType === 'category') {
        url = editingItem
          ? `/api/ecommerce/categories?id=${editingItem.id}`
          : '/api/ecommerce/categories'
        body = {
          ...body,
          name: formData.name,
          handle: formData.handle || formData.name.toLowerCase().replace(/\s+/g, '-'),
          icon: formData.icon
        }
      } else if (modalType === 'type') {
        url = editingItem
          ? `/api/ecommerce/product-types?id=${editingItem.id}`
          : '/api/ecommerce/product-types'
        body = {
          ...body,
          id: editingItem?.id,
          name: formData.name,
          handle: formData.handle || formData.name.toLowerCase().replace(/\s+/g, '-'),
          is_addon: formData.is_addon
        }
      } else if (modalType === 'attribute') {
        url = editingItem
          ? `/api/ecommerce/attributes?id=${editingItem.id}`
          : '/api/ecommerce/attributes'
        body = {
          ...body,
          name: formData.name,
          handle: formData.handle || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
          attribute_type: formData.attribute_type,
          is_category_linked: formData.is_category_linked,
          is_filterable: formData.is_filterable
        }
      } else if (modalType === 'option') {
        url = editingItem
          ? `/api/ecommerce/attribute-options?id=${editingItem.id}`
          : '/api/ecommerce/attribute-options'
        body = {
          ...body,
          attribute_id: formData.attribute_id,
          name: formData.name,
          handle: formData.handle || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          category_id: formData.category_id || null
        }
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (response.ok) {
        closeModal()
        loadData()
        onDataChange?.()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to save')
      }
    } catch (error) {
      console.error('Failed to save:', error)
      alert('Failed to save')
    }
  }

  // Delete handlers
  const handleDelete = async (type: 'category' | 'type' | 'attribute' | 'option', item: any) => {
    const itemName = type === 'option' ? 'option' : type
    if (!confirm(`Are you sure you want to delete this ${itemName}?`)) return

    try {
      let url = ''
      if (type === 'category') {
        url = `/api/ecommerce/categories?id=${item.id}`
      } else if (type === 'type') {
        url = `/api/ecommerce/product-types?id=${item.id}`
      } else if (type === 'attribute') {
        url = `/api/ecommerce/attributes?id=${item.id}`
      } else if (type === 'option') {
        url = `/api/ecommerce/attribute-options?id=${item.id}`
      }

      const response = await fetch(url, { method: 'DELETE' })

      if (response.ok) {
        loadData()
        onDataChange?.()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to delete')
      }
    } catch (error) {
      console.error('Failed to delete:', error)
      alert('Failed to delete')
    }
  }

  // Toggle attribute expansion
  const toggleAttribute = (attrId: string) => {
    const newExpanded = new Set(expandedAttributes)
    if (newExpanded.has(attrId)) {
      newExpanded.delete(attrId)
    } else {
      newExpanded.add(attrId)
    }
    setExpandedAttributes(newExpanded)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-none border border-gray-200">
      {/* Section Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveSection('categories')}
          className={`flex items-center gap-2 px-3 py-2 text-xs font-medium transition-colors ${
            activeSection === 'categories'
              ? 'text-blue-600 border-b-2 border-blue-400 bg-gray-50'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <FolderTree className="w-4 h-4" />
          Categories ({categories.length})
        </button>
        <button
          onClick={() => setActiveSection('types')}
          className={`flex items-center gap-2 px-3 py-2 text-xs font-medium transition-colors ${
            activeSection === 'types'
              ? 'text-blue-600 border-b-2 border-blue-400 bg-gray-50'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Tag className="w-4 h-4" />
          Product Types ({productTypes.length})
        </button>
        <button
          onClick={() => setActiveSection('attributes')}
          className={`flex items-center gap-2 px-3 py-2 text-xs font-medium transition-colors ${
            activeSection === 'attributes'
              ? 'text-blue-600 border-b-2 border-blue-400 bg-gray-50'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Settings className="w-4 h-4" />
          Attributes ({attributes.length})
        </button>
      </div>

      {/* Content */}
      <div className="p-3">
        {/* Categories Section */}
        {activeSection === 'categories' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-xs font-medium text-gray-800">Categories</h2>
                <p className="text-xs text-gray-500 mt-1">
                  Organize products into categories (e.g., Face, Eye, Body)
                </p>
              </div>
              <button
                onClick={() => openModal('category')}
                className="flex items-center gap-2 px-2 py-1 text-xs bg-blue-50 border border-blue-200 hover:bg-blue-100 text-gray-800 rounded-none text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Add Category
              </button>
            </div>

            {categories.length === 0 ? (
              <div className="text-center py-4 border border-dashed border-gray-300 rounded-none">
                <FolderTree className="w-6 h-6 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 mb-4">No categories yet</p>
                <button
                  onClick={() => openModal('category')}
                  className="text-blue-600 hover:text-blue-600"
                >
                  Add your first category
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {categories.map(category => (
                  <div key={category.id} className="p-2 bg-gray-50 rounded-none border border-gray-200 group hover:border-gray-300 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {category.icon && <span className="text-xl">{category.icon}</span>}
                        <div>
                          <h3 className="font-medium text-gray-800">{category.name}</h3>
                          <p className="text-xs text-gray-500">{category.handle}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openModal('category', category)}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-gray-200 rounded-none"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete('category', category)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-gray-200 rounded-none"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    {category.product_count !== undefined && (
                      <p className="text-xs text-gray-400 mt-2">
                        {category.product_count} product{category.product_count !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Product Types Section */}
        {activeSection === 'types' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-xs font-medium text-gray-800">Product Types</h2>
                <p className="text-xs text-gray-500 mt-1">
                  Define what products are (e.g., Cream, Serum, Booster)
                </p>
              </div>
              <button
                onClick={() => openModal('type')}
                className="flex items-center gap-2 px-2 py-1 text-xs bg-blue-50 border border-blue-200 hover:bg-blue-100 text-gray-800 rounded-none text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Add Product Type
              </button>
            </div>

            {productTypes.length === 0 ? (
              <div className="text-center py-4 border border-dashed border-gray-300 rounded-none">
                <Tag className="w-6 h-6 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 mb-4">No product types yet</p>
                <button
                  onClick={() => openModal('type')}
                  className="text-blue-600 hover:text-blue-600"
                >
                  Add your first product type
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {productTypes.map(type => (
                  <div key={type.id} className="p-2 bg-gray-50 rounded-none border border-gray-200 group hover:border-gray-300 transition-colors">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-800">{type.name}</h3>
                          {type.is_addon && (
                            <span className="text-xs px-2 py-0.5 bg-orange-50 text-orange-600 rounded-none">
                              Add-on
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{type.handle}</p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openModal('type', type)}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-gray-200 rounded-none"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete('type', type)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-gray-200 rounded-none"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    {type.product_count !== undefined && (
                      <p className="text-xs text-gray-400 mt-2">
                        {type.product_count} product{type.product_count !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Attributes Section */}
        {activeSection === 'attributes' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-xs font-medium text-gray-800">Attributes</h2>
                <p className="text-xs text-gray-500 mt-1">
                  Define filterable features (e.g., Skin Concerns, Skin Type)
                </p>
              </div>
              <button
                onClick={() => openModal('attribute')}
                className="flex items-center gap-2 px-2 py-1 text-xs bg-blue-50 border border-blue-200 hover:bg-blue-100 text-gray-800 rounded-none text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Add Attribute
              </button>
            </div>

            {attributes.length === 0 ? (
              <div className="text-center py-4 border border-dashed border-gray-300 rounded-none">
                <Settings className="w-6 h-6 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 mb-4">No attributes yet</p>
                <button
                  onClick={() => openModal('attribute')}
                  className="text-blue-600 hover:text-blue-600"
                >
                  Add your first attribute
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {attributes.map(attr => (
                  <div key={attr.id} className="bg-gray-50 rounded-none border border-gray-200">
                    {/* Attribute Header */}
                    <div
                      className="flex items-center justify-between p-2 cursor-pointer hover:bg-gray-100"
                      onClick={() => toggleAttribute(attr.id)}
                    >
                      <div className="flex items-center gap-3">
                        {expandedAttributes.has(attr.id) ? (
                          <ChevronDown className="w-5 h-5 text-gray-500" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-500" />
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-gray-800">{attr.name}</h3>
                            <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded-none">
                              {attr.attribute_type}
                            </span>
                            {attr.is_category_linked && (
                              <span className="text-xs px-2 py-0.5 bg-purple-50 text-purple-600 rounded-none">
                                Category-linked
                              </span>
                            )}
                            {attr.is_filterable && (
                              <span className="text-xs px-2 py-0.5 bg-green-50 text-green-600 rounded-none">
                                Filterable
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500">{attr.options?.length || 0} options</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => openModal('option', null, attr.id)}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-200 hover:bg-gray-100 text-gray-800 rounded-none"
                        >
                          <Plus className="w-3 h-3" />
                          Add Option
                        </button>
                        <button
                          onClick={() => openModal('attribute', attr)}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-gray-200 rounded-none"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete('attribute', attr)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-gray-200 rounded-none"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Attribute Options */}
                    {expandedAttributes.has(attr.id) && attr.options && attr.options.length > 0 && (
                      <div className="border-t border-gray-200 p-2">
                        {attr.is_category_linked ? (
                          // Group by category
                          <div className="space-y-2">
                            {categories.map(cat => {
                              const catOptions = attr.options.filter(o => o.category_id === cat.id)
                              if (catOptions.length === 0) return null
                              return (
                                <div key={cat.id}>
                                  <h4 className="text-sm font-medium text-gray-600 mb-2 flex items-center gap-2">
                                    {cat.icon && <span>{cat.icon}</span>}
                                    {cat.name}
                                  </h4>
                                  <div className="flex flex-wrap gap-2 ml-6">
                                    {catOptions.map(option => (
                                      <div
                                        key={option.id}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-gray-200 rounded-none group"
                                      >
                                        <span className="text-gray-800 text-sm">{option.name}</span>
                                        <button
                                          onClick={() => openModal('option', option, attr.id)}
                                          className="text-gray-500 hover:text-blue-600 opacity-0 group-hover:opacity-100"
                                        >
                                          <Edit className="w-3 h-3" />
                                        </button>
                                        <button
                                          onClick={() => handleDelete('option', option)}
                                          className="text-gray-500 hover:text-red-600 opacity-0 group-hover:opacity-100"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )
                            })}
                            {/* Uncategorized options */}
                            {attr.options.filter(o => !o.category_id).length > 0 && (
                              <div>
                                <h4 className="text-sm font-medium text-gray-400 mb-2">Uncategorized</h4>
                                <div className="flex flex-wrap gap-2 ml-6">
                                  {attr.options.filter(o => !o.category_id).map(option => (
                                    <div
                                      key={option.id}
                                      className="flex items-center gap-2 px-3 py-1.5 bg-gray-200 rounded-none group"
                                    >
                                      <span className="text-gray-800 text-sm">{option.name}</span>
                                      <button
                                        onClick={() => openModal('option', option, attr.id)}
                                        className="text-gray-500 hover:text-blue-600 opacity-0 group-hover:opacity-100"
                                      >
                                        <Edit className="w-3 h-3" />
                                      </button>
                                      <button
                                        onClick={() => handleDelete('option', option)}
                                        className="text-gray-500 hover:text-red-600 opacity-0 group-hover:opacity-100"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          // Flat list
                          <div className="flex flex-wrap gap-2">
                            {attr.options.map(option => (
                              <div
                                key={option.id}
                                className="flex items-center gap-2 px-3 py-1.5 bg-gray-200 rounded-none group"
                              >
                                <span className="text-gray-800 text-sm">{option.name}</span>
                                <button
                                  onClick={() => openModal('option', option, attr.id)}
                                  className="text-gray-500 hover:text-blue-600 opacity-0 group-hover:opacity-100"
                                >
                                  <Edit className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => handleDelete('option', option)}
                                  className="text-gray-500 hover:text-red-600 opacity-0 group-hover:opacity-100"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-none w-full max-w-md p-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-medium text-gray-800">
                {editingItem ? 'Edit' : 'Add'} {modalType === 'type' ? 'Product Type' : modalType.charAt(0).toUpperCase() + modalType.slice(1)}
              </h3>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              {/* Name field */}
              <div>
                <label className="block text-xs text-gray-600 mb-2">Name</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={modalType === 'category' ? 'e.g., Face Care' : modalType === 'type' ? 'e.g., Serum' : 'e.g., Skin Concerns'}
                  className="w-full px-2 py-1.5 text-xs bg-gray-100 border border-gray-200 rounded-none text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>

              {/* Handle field */}
              <div>
                <label className="block text-xs text-gray-600 mb-2">Handle (URL slug)</label>
                <input
                  type="text"
                  value={formData.handle || ''}
                  onChange={(e) => setFormData({ ...formData, handle: e.target.value })}
                  placeholder="auto-generated if empty"
                  className="w-full px-2 py-1.5 text-xs bg-gray-100 border border-gray-200 rounded-none text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>

              {/* Category-specific: Icon */}
              {modalType === 'category' && (
                <div>
                  <label className="block text-xs text-gray-600 mb-2">Icon (emoji)</label>
                  <input
                    type="text"
                    value={formData.icon || ''}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    placeholder="e.g., 😊"
                    className="w-full px-2 py-1.5 text-xs bg-gray-100 border border-gray-200 rounded-none text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>
              )}

              {/* Type-specific: Is Add-on */}
              {modalType === 'type' && (
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="is_addon"
                    checked={formData.is_addon || false}
                    onChange={(e) => setFormData({ ...formData, is_addon: e.target.checked })}
                    className="w-4 h-4 rounded-none border-gray-200 bg-gray-100 text-blue-600 focus:ring-blue-300"
                  />
                  <label htmlFor="is_addon" className="text-xs text-gray-600">
                    This is an add-on product type
                  </label>
                </div>
              )}

              {/* Attribute-specific fields */}
              {modalType === 'attribute' && (
                <>
                  <div>
                    <label className="block text-xs text-gray-600 mb-2">Attribute Type</label>
                    <select
                      value={formData.attribute_type || 'feature'}
                      onChange={(e) => setFormData({ ...formData, attribute_type: e.target.value })}
                      className="w-full px-2 py-1.5 text-xs bg-gray-100 border border-gray-200 rounded-none text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300"
                    >
                      <option value="concern">Concern (problems to solve)</option>
                      <option value="feature">Feature (product characteristics)</option>
                      <option value="preference">Preference (customer choices)</option>
                      <option value="constraint">Constraint (dietary, allergies)</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="is_category_linked"
                      checked={formData.is_category_linked || false}
                      onChange={(e) => setFormData({ ...formData, is_category_linked: e.target.checked })}
                      className="w-4 h-4 rounded-none border-gray-200 bg-gray-100 text-blue-600 focus:ring-blue-300"
                    />
                    <label htmlFor="is_category_linked" className="text-xs text-gray-600">
                      Options are linked to categories (e.g., Face→Wrinkles, Eye→Dark Circles)
                    </label>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="is_filterable"
                      checked={formData.is_filterable ?? true}
                      onChange={(e) => setFormData({ ...formData, is_filterable: e.target.checked })}
                      className="w-4 h-4 rounded-none border-gray-200 bg-gray-100 text-blue-600 focus:ring-blue-300"
                    />
                    <label htmlFor="is_filterable" className="text-xs text-gray-600">
                      Show in filters and quiz
                    </label>
                  </div>
                </>
              )}

              {/* Option-specific: Category selection */}
              {modalType === 'option' && (
                <div>
                  <label className="block text-xs text-gray-600 mb-2">Category (optional)</label>
                  <select
                    value={formData.category_id || ''}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full px-2 py-1.5 text-xs bg-gray-100 border border-gray-200 rounded-none text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  >
                    <option value="">No category (global)</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon} {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-3">
              <button
                onClick={closeModal}
                className="px-2 py-1 text-xs text-gray-500 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-3 py-1.5 text-xs bg-blue-50 border border-blue-200 hover:bg-blue-100 text-gray-800 rounded-none"
              >
                {editingItem ? 'Save Changes' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
