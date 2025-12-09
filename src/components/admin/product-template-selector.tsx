'use client'

/**
 * Product Template Selector
 * Allows businesses to:
 * 1. Choose from 22 industry templates
 * 2. Create custom fields from scratch
 * 3. Import structure from reference URL using AI
 */

import { useState, useEffect } from 'react'
import {
  Loader2, Save, Plus, Trash2, ChevronDown, ChevronRight,
  Link2, Sparkles, Check, X, GripVertical, Settings,
  Store, Utensils, Shirt, Flower2, Wine, ShoppingCart,
  Cake, Gem, Laptop, Sofa, Pill, PawPrint, BookOpen,
  Wrench, Scissors, Home, Car, Plane, Dumbbell, Gift,
  Factory, Droplets
} from 'lucide-react'

// Icon mapping for templates
const templateIcons: Record<string, any> = {
  'personalized-skincare': Droplets,
  'skincare-retail': Store,
  'restaurant-cafe': Utensils,
  'apparel-fashion': Shirt,
  'flower-shop': Flower2,
  'liquor-wine': Wine,
  'grocery-supermarket': ShoppingCart,
  'bakery-pastry': Cake,
  'jewelry-store': Gem,
  'electronics': Laptop,
  'furniture': Sofa,
  'pharmacy-health': Pill,
  'pet-store': PawPrint,
  'bookstore': BookOpen,
  'hardware-tools': Wrench,
  'spa-salon': Scissors,
  'real-estate': Home,
  'automotive-parts': Car,
  'travel-tours': Plane,
  'sports-fitness': Dumbbell,
  'boutique-gift': Gift,
  'apparel-factory-outlet': Factory,
}

interface ProductTemplate {
  id: string
  name: string
  handle: string
  description?: string
  icon?: string
  display_order: number
  is_active: boolean
}

interface TemplateField {
  id: string
  template_id: string
  field_key: string
  field_label: string
  field_type: string
  field_options?: any
  display_section: string
  display_order: number
  is_required: boolean
  placeholder?: string
  help_text?: string
}

interface CustomField {
  id?: string
  field_key: string
  field_label: string
  field_type: string
  field_options?: any
  display_section: string
  display_order: number
  is_required: boolean
  is_from_template: boolean
  placeholder?: string
  help_text?: string
}

interface ProductTemplateSelectorProps {
  businessUnitId: string
  onConfigSaved?: () => void
}

const FIELD_TYPES = [
  { value: 'text', label: 'Text (single line)' },
  { value: 'rich_text', label: 'Rich Text (multi-line)' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Yes/No Toggle' },
  { value: 'select', label: 'Dropdown Select' },
  { value: 'multi_select', label: 'Multi-Select Tags' },
  { value: 'date', label: 'Date' },
  { value: 'url', label: 'URL' },
  { value: 'image', label: 'Image URL' },
]

const DISPLAY_SECTIONS = [
  { value: 'main', label: 'Main Details' },
  { value: 'accordion', label: 'Accordion (expandable)' },
  { value: 'tab', label: 'Tabbed Content' },
  { value: 'sidebar', label: 'Sidebar Info' },
]

export default function ProductTemplateSelector({
  businessUnitId,
  onConfigSaved
}: ProductTemplateSelectorProps) {
  // State
  const [templates, setTemplates] = useState<ProductTemplate[]>([])
  const [templateFields, setTemplateFields] = useState<Map<string, TemplateField[]>>(new Map())
  const [customFields, setCustomFields] = useState<CustomField[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [currentConfig, setCurrentConfig] = useState<any>(null)

  // UI State
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [activeView, setActiveView] = useState<'templates' | 'custom' | 'url'>('templates')
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null)
  const [showAddField, setShowAddField] = useState(false)

  // URL Import State
  const [importUrl, setImportUrl] = useState('')
  const [isImporting, setIsImporting] = useState(false)
  const [importedFields, setImportedFields] = useState<CustomField[]>([])
  const [importError, setImportError] = useState<string | null>(null)

  // New Field Form
  const [newField, setNewField] = useState<Partial<CustomField>>({
    field_key: '',
    field_label: '',
    field_type: 'text',
    display_section: 'main',
    display_order: 0,
    is_required: false,
    is_from_template: false,
  })

  // Load data on mount
  useEffect(() => {
    loadData()
  }, [businessUnitId])

  const loadData = async () => {
    setIsLoading(true)
    try {
      // Load templates
      const templatesRes = await fetch('/api/ecommerce/templates')
      const templatesData = await templatesRes.json()
      if (templatesData.templates) {
        setTemplates(templatesData.templates)

        // Load fields for each template
        const fieldsMap = new Map<string, TemplateField[]>()
        for (const template of templatesData.templates) {
          const fieldsRes = await fetch(`/api/ecommerce/templates/${template.id}/fields`)
          const fieldsData = await fieldsRes.json()
          if (fieldsData.fields) {
            fieldsMap.set(template.id, fieldsData.fields)
          }
        }
        setTemplateFields(fieldsMap)
      }

      // Load current business unit config
      const configRes = await fetch(`/api/ecommerce/business-config?businessUnitId=${businessUnitId}`)
      const configData = await configRes.json()
      if (configData.config) {
        setCurrentConfig(configData.config)
        setSelectedTemplateId(configData.config.template_id)
        if (configData.fields) {
          setCustomFields(configData.fields)
        }
      }
    } catch (error) {
      console.error('Failed to load template data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Select a template
  const handleSelectTemplate = async (templateId: string) => {
    setSelectedTemplateId(templateId)

    // Copy template fields to custom fields
    const fields = templateFields.get(templateId) || []
    const copiedFields: CustomField[] = fields.map((f, i) => ({
      field_key: f.field_key,
      field_label: f.field_label,
      field_type: f.field_type,
      field_options: f.field_options,
      display_section: f.display_section,
      display_order: f.display_order || i,
      is_required: f.is_required,
      is_from_template: true,
      placeholder: f.placeholder,
      help_text: f.help_text,
    }))
    setCustomFields(copiedFields)
  }

  // Import from URL using AI
  const handleUrlImport = async () => {
    if (!importUrl.trim()) return

    setIsImporting(true)
    setImportError(null)
    setImportedFields([])

    try {
      const response = await fetch('/api/ecommerce/analyze-product-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: importUrl })
      })

      const data = await response.json()

      if (response.ok && data.fields) {
        setImportedFields(data.fields)
      } else {
        setImportError(data.error || 'Failed to analyze URL')
      }
    } catch (error: any) {
      setImportError(error.message || 'Network error')
    } finally {
      setIsImporting(false)
    }
  }

  // Apply imported fields
  const applyImportedFields = () => {
    setCustomFields(importedFields.map((f, i) => ({
      ...f,
      display_order: i,
      is_from_template: false,
    })))
    setSelectedTemplateId(null)
    setActiveView('custom')
    setImportedFields([])
    setImportUrl('')
  }

  // Add custom field
  const addCustomField = () => {
    if (!newField.field_key || !newField.field_label) return

    const field: CustomField = {
      field_key: newField.field_key!.toLowerCase().replace(/\s+/g, '_'),
      field_label: newField.field_label!,
      field_type: newField.field_type || 'text',
      field_options: newField.field_options,
      display_section: newField.display_section || 'main',
      display_order: customFields.length,
      is_required: newField.is_required || false,
      is_from_template: false,
      placeholder: newField.placeholder,
      help_text: newField.help_text,
    }

    setCustomFields([...customFields, field])
    setNewField({
      field_key: '',
      field_label: '',
      field_type: 'text',
      display_section: 'main',
      display_order: 0,
      is_required: false,
      is_from_template: false,
    })
    setShowAddField(false)
  }

  // Remove custom field
  const removeField = (index: number) => {
    setCustomFields(customFields.filter((_, i) => i !== index))
  }

  // Update field
  const updateField = (index: number, updates: Partial<CustomField>) => {
    setCustomFields(customFields.map((f, i) =>
      i === index ? { ...f, ...updates } : f
    ))
  }

  // Save configuration
  const saveConfiguration = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/ecommerce/business-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessUnitId,
          templateId: selectedTemplateId,
          referenceUrl: importUrl || null,
          fields: customFields,
        })
      })

      if (response.ok) {
        await loadData()
        onConfigSaved?.()
      }
    } catch (error) {
      console.error('Failed to save configuration:', error)
    } finally {
      setIsSaving(false)
    }
  }

  // Group fields by section for preview
  const fieldsBySection = customFields.reduce((acc, field) => {
    const section = field.display_section || 'main'
    if (!acc[section]) acc[section] = []
    acc[section].push(field)
    return acc
  }, {} as Record<string, CustomField[]>)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Product Page Template</h2>
          <p className="text-sm text-gray-500 mt-1">
            Choose a template or create custom fields for your product pages
          </p>
        </div>
        <button
          onClick={saveConfiguration}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Configuration
        </button>
      </div>

      {/* View Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveView('templates')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeView === 'templates'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Industry Templates ({templates.length})
        </button>
        <button
          onClick={() => setActiveView('custom')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeView === 'custom'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Custom Fields ({customFields.length})
        </button>
        <button
          onClick={() => setActiveView('url')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeView === 'url'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Link2 className="w-4 h-4" />
          Import from URL
        </button>
      </div>

      {/* Templates View */}
      {activeView === 'templates' && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {templates.map((template) => {
            const IconComponent = templateIcons[template.handle] || Store
            const isSelected = selectedTemplateId === template.id
            const fields = templateFields.get(template.id) || []
            const isExpanded = expandedTemplate === template.id

            return (
              <div
                key={template.id}
                className={`border-2 rounded-lg overflow-hidden transition-all cursor-pointer ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                }`}
              >
                {/* Template Header */}
                <div
                  onClick={() => handleSelectTemplate(template.id)}
                  className="p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className={`p-2 rounded-lg ${isSelected ? 'bg-blue-100' : 'bg-gray-100'}`}>
                      <IconComponent className={`w-6 h-6 ${isSelected ? 'text-blue-600' : 'text-gray-600'}`} />
                    </div>
                    {isSelected && (
                      <Check className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                  <h3 className={`font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                    {template.name}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {fields.length} fields
                  </p>
                </div>

                {/* Expand to see fields */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setExpandedTemplate(isExpanded ? null : template.id)
                  }}
                  className="w-full px-4 py-2 bg-gray-50 border-t text-xs text-gray-500 hover:bg-gray-100 flex items-center justify-center gap-1"
                >
                  {isExpanded ? 'Hide' : 'View'} Fields
                  <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </button>

                {/* Fields List */}
                {isExpanded && (
                  <div className="px-4 pb-4 bg-gray-50 border-t">
                    <div className="max-h-48 overflow-y-auto mt-2 space-y-1">
                      {fields.map((field) => (
                        <div
                          key={field.id}
                          className="text-xs px-2 py-1 bg-white rounded border flex items-center justify-between"
                        >
                          <span className="text-gray-700">{field.field_label}</span>
                          <span className="text-gray-400 capitalize">{field.field_type}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Custom Fields View */}
      {activeView === 'custom' && (
        <div className="space-y-4">
          {/* Add Field Button */}
          <div className="flex justify-end">
            <button
              onClick={() => setShowAddField(!showAddField)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
            >
              <Plus className="w-4 h-4" />
              Add Custom Field
            </button>
          </div>

          {/* Add Field Form */}
          {showAddField && (
            <div className="bg-gray-50 border rounded-lg p-4 space-y-4">
              <h4 className="font-medium text-gray-800">New Custom Field</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Field Label *</label>
                  <input
                    type="text"
                    value={newField.field_label || ''}
                    onChange={(e) => setNewField({
                      ...newField,
                      field_label: e.target.value,
                      field_key: e.target.value.toLowerCase().replace(/\s+/g, '_')
                    })}
                    placeholder="e.g., Serving Size"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Field Key</label>
                  <input
                    type="text"
                    value={newField.field_key || ''}
                    onChange={(e) => setNewField({ ...newField, field_key: e.target.value })}
                    placeholder="serving_size"
                    className="w-full px-3 py-2 border rounded-lg bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Field Type</label>
                  <select
                    value={newField.field_type || 'text'}
                    onChange={(e) => setNewField({ ...newField, field_type: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    {FIELD_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Display Section</label>
                  <select
                    value={newField.display_section || 'main'}
                    onChange={(e) => setNewField({ ...newField, display_section: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    {DISPLAY_SECTIONS.map(section => (
                      <option key={section.value} value={section.value}>{section.label}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Placeholder Text</label>
                  <input
                    type="text"
                    value={newField.placeholder || ''}
                    onChange={(e) => setNewField({ ...newField, placeholder: e.target.value })}
                    placeholder="Enter placeholder text..."
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_required"
                    checked={newField.is_required || false}
                    onChange={(e) => setNewField({ ...newField, is_required: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label htmlFor="is_required" className="text-sm text-gray-700">Required field</label>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowAddField(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={addCustomField}
                  disabled={!newField.field_label}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Add Field
                </button>
              </div>
            </div>
          )}

          {/* Fields List */}
          {customFields.length > 0 ? (
            <div className="space-y-2">
              {Object.entries(fieldsBySection).map(([section, fields]) => (
                <div key={section} className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-100 px-4 py-2 font-medium text-sm text-gray-700 capitalize">
                    {DISPLAY_SECTIONS.find(s => s.value === section)?.label || section}
                  </div>
                  <div className="divide-y">
                    {fields.map((field, idx) => {
                      const globalIndex = customFields.findIndex(f => f.field_key === field.field_key)
                      return (
                        <div key={field.field_key} className="px-4 py-3 flex items-center gap-4 hover:bg-gray-50">
                          <GripVertical className="w-4 h-4 text-gray-300 cursor-grab" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">{field.field_label}</span>
                              {field.is_required && (
                                <span className="text-xs text-red-500">*</span>
                              )}
                              {field.is_from_template && (
                                <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-600 rounded">
                                  from template
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500">
                              {field.field_key} | {FIELD_TYPES.find(t => t.value === field.field_type)?.label}
                            </div>
                          </div>
                          <button
                            onClick={() => removeField(globalIndex)}
                            className="p-1 text-gray-400 hover:text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed">
              <Settings className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No custom fields yet</p>
              <p className="text-sm text-gray-400 mt-1">
                Select a template or add custom fields
              </p>
            </div>
          )}
        </div>
      )}

      {/* URL Import View */}
      {activeView === 'url' && (
        <div className="space-y-6">
          {/* URL Input */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white rounded-lg shadow-sm">
                <Sparkles className="w-6 h-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">AI-Powered Field Extraction</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Paste a URL from a product page you want to use as reference. Our AI will analyze
                  the page structure and extract relevant fields for your products.
                </p>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={importUrl}
                    onChange={(e) => setImportUrl(e.target.value)}
                    placeholder="https://example.com/products/sample-product"
                    className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                  <button
                    onClick={handleUrlImport}
                    disabled={isImporting || !importUrl.trim()}
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {isImporting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Analyze
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Import Error */}
          {importError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <X className="w-5 h-5 text-red-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-800">Failed to analyze URL</h4>
                <p className="text-sm text-red-600">{importError}</p>
              </div>
            </div>
          )}

          {/* Imported Fields Preview */}
          {importedFields.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-green-50 px-4 py-3 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-800">
                    Found {importedFields.length} fields
                  </span>
                </div>
                <button
                  onClick={applyImportedFields}
                  className="px-4 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
                >
                  Apply These Fields
                </button>
              </div>
              <div className="divide-y max-h-96 overflow-y-auto">
                {importedFields.map((field, idx) => (
                  <div key={idx} className="px-4 py-3 flex items-center gap-4">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{field.field_label}</div>
                      <div className="text-xs text-gray-500">
                        {field.field_key} | {FIELD_TYPES.find(t => t.value === field.field_type)?.label} | {field.display_section}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Example Sites */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-700 mb-3">Example reference sites:</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              <span className="text-gray-500">Shopify stores</span>
              <span className="text-gray-500">Amazon products</span>
              <span className="text-gray-500">Etsy listings</span>
              <span className="text-gray-500">Any e-commerce site</span>
            </div>
          </div>
        </div>
      )}

      {/* Current Config Status */}
      {currentConfig && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-800 mb-2">Current Configuration</h4>
          <div className="text-sm text-blue-700 space-y-1">
            <p>
              Template: {currentConfig.template_id
                ? templates.find(t => t.id === currentConfig.template_id)?.name
                : 'Custom'}
            </p>
            <p>Fields: {customFields.length} configured</p>
            {currentConfig.reference_url && (
              <p>Reference: {currentConfig.reference_url}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
