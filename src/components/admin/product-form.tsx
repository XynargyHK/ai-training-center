'use client'

/**
 * Comprehensive Product Form for SkinCoach
 * Features:
 * - Up to 5 images with upload + AI generate
 * - All SkinCoach-specific fields
 * - Variants/sizes with pricing
 * - Inventory tracking
 * - Landing page option with reference URL
 */

import { useState, useEffect, useRef } from 'react'
import {
  X, Upload, Sparkles, Plus, Trash2, Save, Loader2,
  Image as ImageIcon, Package, DollarSign, Box, FileText,
  ChevronDown, ChevronUp, GripVertical, Globe, Eye, ZoomIn,
  ChevronLeft, ChevronRight
} from 'lucide-react'

interface ProductCategory {
  id: string
  name: string
  handle: string
}

interface ProductType {
  id: string
  name: string
  handle: string
  is_addon: boolean
  category_id: string | null
}

interface AttributeOption {
  id: string
  name: string
  category_id: string | null
  category_name?: string
}

interface ProductAttribute {
  id: string
  name: string
  handle: string
  is_category_linked: boolean
  options: AttributeOption[]
}

interface ProductVariant {
  id?: string
  title: string
  sku: string
  barcode?: string
  price: number
  compare_at_price?: number
  cost_price?: number
  stock_quantity: number
}

interface ProductFormData {
  // Basic
  title: string
  tagline: string
  description: string
  product_type_id: string
  category_ids: string[]
  status: 'draft' | 'published' | 'archived'

  // Images
  images: string[]
  thumbnail: string

  // Pricing (for simple products without variants)
  price: number | null
  compare_at_price: number | null
  cost_price: number | null

  // Inventory
  size_option: string
  sku: string
  barcode: string
  track_inventory: boolean
  stock_quantity: number
  low_stock_threshold: number
  allow_backorder: boolean

  // Variants
  has_variants: boolean
  variants: ProductVariant[]

  // SkinCoach specific fields
  hero_benefit: string
  key_actives: string
  ingredients: string
  clinical_studies: string
  trade_name: string

  // Concerns (selected attribute option IDs)
  selectedConcernIds: string[]

  // Landing page
  has_landing_page: boolean
  landing_page_reference_url: string

  // Display
  is_featured: boolean
  badges: string[]
}

interface ProductFormProps {
  businessUnitId: string
  productId?: string // Product ID for editing (will fetch full data)
  onSave: (product: any) => void
  onCancel: () => void
}

const INITIAL_FORM_DATA: ProductFormData = {
  title: '',
  tagline: '',
  description: '',
  product_type_id: '',
  category_ids: [],
  status: 'draft',
  images: [],
  thumbnail: '',
  price: null,
  compare_at_price: null,
  cost_price: null,
  size_option: '',
  sku: '',
  barcode: '',
  track_inventory: true,
  stock_quantity: 0,
  low_stock_threshold: 5,
  allow_backorder: false,
  has_variants: false,
  variants: [],
  hero_benefit: '',
  key_actives: '',
  ingredients: '',
  clinical_studies: '',
  trade_name: '',
  selectedConcernIds: [],
  has_landing_page: false,
  landing_page_reference_url: '',
  is_featured: false,
  badges: [],
}

export default function ProductForm({
  businessUnitId,
  productId,
  onSave,
  onCancel
}: ProductFormProps) {
  const [formData, setFormData] = useState<ProductFormData>(INITIAL_FORM_DATA)
  const [productTypes, setProductTypes] = useState<ProductType[]>([])
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [attributes, setAttributes] = useState<ProductAttribute[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['basic', 'images', 'pricing', 'skincoach'])
  )
  const [isGeneratingLandingPage, setIsGeneratingLandingPage] = useState(false)
  const [landingPageContent, setLandingPageContent] = useState<any>(null)
  const [imagePrompt, setImagePrompt] = useState('')
  const [imageGenError, setImageGenError] = useState('')
  const [previewImageIndex, setPreviewImageIndex] = useState<number | null>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [loadedProduct, setLoadedProduct] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load product types, categories, and product data if editing
  useEffect(() => {
    loadMetadata()
    if (productId) {
      loadProduct(productId)
    }
  }, [businessUnitId, productId])

  // Populate form when product is loaded
  useEffect(() => {
    if (loadedProduct) {
      populateForm(loadedProduct)
    }
  }, [loadedProduct])

  const loadProduct = async (id: string) => {
    try {
      const response = await fetch(`/api/ecommerce/products?id=${id}`)
      const data = await response.json()
      if (data.product) {
        setLoadedProduct(data.product)
      }
    } catch (error) {
      console.error('Failed to load product:', error)
    }
  }

  const loadMetadata = async () => {
    setIsLoading(true)
    try {
      // Load product types
      const typesRes = await fetch(`/api/ecommerce/product-types?businessUnitId=${businessUnitId}`)
      const typesData = await typesRes.json()
      if (typesData.types) {
        setProductTypes(typesData.types)
      }

      // Load categories
      const catsRes = await fetch(`/api/ecommerce/categories?businessUnitId=${businessUnitId}`)
      const catsData = await catsRes.json()
      if (catsData.categories) {
        setCategories(catsData.categories)
      }

      // Load attributes (for concerns)
      const attrsRes = await fetch(`/api/ecommerce/attributes?businessUnitId=${businessUnitId}`)
      const attrsData = await attrsRes.json()
      if (attrsData.attributes) {
        // Only keep category-linked attributes (like Skin Concerns)
        setAttributes(attrsData.attributes.filter((a: ProductAttribute) => a.is_category_linked))
      }
    } catch (error) {
      console.error('Failed to load metadata:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const populateForm = async (prod: any) => {
    // Load existing concern values for this product
    let concernIds: string[] = []
    if (prod.id) {
      try {
        const valuesRes = await fetch(`/api/ecommerce/product-attribute-values?productId=${prod.id}`)
        const valuesData = await valuesRes.json()
        concernIds = (valuesData.values || []).map((v: any) => v.option_id)
      } catch (error) {
        console.error('Failed to load product concerns:', error)
      }
    }

    setFormData({
      title: prod.title || '',
      tagline: prod.tagline || '',
      description: prod.description || '',
      product_type_id: prod.product_type_id || '',
      category_ids: prod.product_category_mapping?.map((m: any) => m.category_id) || [],
      status: prod.status || 'draft',
      images: prod.product_images?.map((i: any) => i.url) || [],
      thumbnail: prod.thumbnail || '',
      price: prod.price || null,
      compare_at_price: prod.compare_at_price || null,
      cost_price: prod.cost_price || null,
      size_option: prod.size_option || '',
      sku: prod.sku || '',
      barcode: prod.barcode || '',
      track_inventory: prod.track_inventory ?? true,
      stock_quantity: prod.stock_quantity || 0,
      low_stock_threshold: prod.low_stock_threshold || 5,
      allow_backorder: prod.allow_backorder || false,
      has_variants: (prod.product_variants?.length || 0) > 0,
      variants: prod.product_variants?.map((v: any) => ({
        id: v.id,
        title: v.title,
        sku: v.sku || '',
        price: v.product_variant_prices?.[0]?.amount || 0,
        compare_at_price: v.compare_at_price,
        cost_price: v.cost_price,
        stock_quantity: v.stock_quantity || 0,
      })) || [],
      hero_benefit: prod.hero_benefit || '',
      key_actives: prod.key_actives || '',
      ingredients: prod.ingredients || '',
      clinical_studies: prod.clinical_studies || '',
      trade_name: prod.trade_name || '',
      selectedConcernIds: concernIds,
      has_landing_page: prod.has_landing_page || false,
      landing_page_reference_url: prod.landing_page_reference_url || '',
      is_featured: prod.is_featured || false,
      badges: prod.badges || [],
    })
  }

  const toggleSection = (section: string) => {
    const newSet = new Set(expandedSections)
    if (newSet.has(section)) {
      newSet.delete(section)
    } else {
      newSet.add(section)
    }
    setExpandedSections(newSet)
  }

  // Helper function to check if URL is a video
  const isVideoUrl = (url: string) => {
    return url.match(/\.(mp4|webm|mov)(\?|$)/i) !== null
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || formData.images.length >= 5) return

    setIsUploadingImage(true)
    const filesToUpload = Array.from(files).slice(0, 5 - formData.images.length)
    const uploadedUrls: string[] = []

    try {
      for (const file of filesToUpload) {
        const formDataUpload = new FormData()
        formDataUpload.append('file', file)
        formDataUpload.append('businessUnitId', businessUnitId)

        const response = await fetch('/api/ecommerce/upload-image', {
          method: 'POST',
          body: formDataUpload
        })

        const data = await response.json()
        if (data.url) {
          uploadedUrls.push(data.url)
        } else if (data.error) {
          console.error('Upload error:', data.error)
        }
      }

      if (uploadedUrls.length > 0) {
        setFormData({
          ...formData,
          images: [...formData.images, ...uploadedUrls],
          thumbnail: formData.thumbnail || uploadedUrls[0] || ''
        })
      }
    } catch (error) {
      console.error('Failed to upload images:', error)
    } finally {
      setIsUploadingImage(false)
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleAiGenerateImage = async () => {
    if (!imagePrompt.trim()) {
      setImageGenError('Please enter a prompt to generate an image')
      return
    }

    setIsGeneratingImage(true)
    setImageGenError('')

    try {
      // Get reference image if available (first uploaded image)
      const referenceImage = formData.images.length > 0 ? formData.images[0] : undefined

      // Build product info from form data for context
      const productInfo = [
        formData.tagline,
        formData.hero_benefit,
        formData.key_actives
      ].filter(Boolean).join(' | ')

      const response = await fetch('/api/ecommerce/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: imagePrompt,
          productName: formData.title || undefined,
          productInfo: productInfo || undefined,
          referenceImage: referenceImage
        })
      })

      const data = await response.json()

      if (data.error) {
        setImageGenError(data.error)
        return
      }

      if (data.imageUrl) {
        // Upload generated image to Supabase storage
        try {
          const uploadResponse = await fetch('/api/ecommerce/upload-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              image: data.imageUrl, // base64 data URL
              businessUnitId: businessUnitId,
              filename: `ai-generated-${Date.now()}.png`
            })
          })
          const uploadData = await uploadResponse.json()

          if (uploadData.url) {
            setFormData({
              ...formData,
              images: [...formData.images, uploadData.url].slice(0, 5),
              thumbnail: formData.thumbnail || uploadData.url
            })
            setImagePrompt('') // Clear prompt after success
          } else {
            // Fallback to base64 if upload fails
            setFormData({
              ...formData,
              images: [...formData.images, data.imageUrl].slice(0, 5),
              thumbnail: formData.thumbnail || data.imageUrl
            })
            setImagePrompt('')
          }
        } catch (uploadError) {
          // Fallback to base64 if upload fails
          console.warn('Failed to upload AI image to storage, using base64:', uploadError)
          setFormData({
            ...formData,
            images: [...formData.images, data.imageUrl].slice(0, 5),
            thumbnail: formData.thumbnail || data.imageUrl
          })
          setImagePrompt('')
        }
      }
    } catch (error: any) {
      console.error('Failed to generate image:', error)
      setImageGenError(error.message || 'Failed to generate image')
    } finally {
      setIsGeneratingImage(false)
    }
  }

  const removeImage = (index: number) => {
    const newImages = formData.images.filter((_, i) => i !== index)
    setFormData({
      ...formData,
      images: newImages,
      thumbnail: newImages[0] || ''
    })
  }

  const setAsThumbnail = (url: string) => {
    setFormData({ ...formData, thumbnail: url })
  }

  const addVariant = () => {
    setFormData({
      ...formData,
      variants: [
        ...formData.variants,
        { title: '', sku: '', barcode: '', price: 0, compare_at_price: undefined, cost_price: undefined, stock_quantity: 0 }
      ]
    })
  }

  const updateVariant = (index: number, updates: Partial<ProductVariant>) => {
    const newVariants = [...formData.variants]
    newVariants[index] = { ...newVariants[index], ...updates }
    setFormData({ ...formData, variants: newVariants })
  }

  const removeVariant = (index: number) => {
    setFormData({
      ...formData,
      variants: formData.variants.filter((_, i) => i !== index)
    })
  }

  const toggleCategory = (categoryId: string) => {
    const isRemoving = formData.category_ids.includes(categoryId)
    const ids = isRemoving
      ? formData.category_ids.filter(id => id !== categoryId)
      : [...formData.category_ids, categoryId]

    // Clear product_type_id if it doesn't match any selected category
    const selectedType = productTypes.find(t => t.id === formData.product_type_id)
    if (selectedType && selectedType.category_id && !ids.includes(selectedType.category_id)) {
      setFormData({ ...formData, category_ids: ids, product_type_id: '' })
    } else {
      setFormData({ ...formData, category_ids: ids })
    }
  }

  // Get product types filtered by selected categories
  const getFilteredProductTypes = () => {
    if (formData.category_ids.length === 0) {
      return productTypes // Show all if no category selected
    }
    return productTypes.filter(type =>
      !type.category_id || formData.category_ids.includes(type.category_id)
    )
  }

  // Get concerns grouped by category based on selected categories
  const getConcernsByCategory = () => {
    const result: { categoryId: string; categoryName: string; options: AttributeOption[] }[] = []

    for (const catId of formData.category_ids) {
      const cat = categories.find(c => c.id === catId)
      if (!cat) continue

      // Get all options for this category across all category-linked attributes
      const categoryOptions: AttributeOption[] = []
      for (const attr of attributes) {
        const opts = attr.options.filter(o => o.category_id === catId)
        categoryOptions.push(...opts)
      }

      if (categoryOptions.length > 0) {
        result.push({
          categoryId: catId,
          categoryName: cat.name,
          options: categoryOptions
        })
      }
    }

    return result
  }

  // Toggle a concern option
  const toggleConcern = (optionId: string) => {
    const currentIds = formData.selectedConcernIds
    if (currentIds.includes(optionId)) {
      setFormData({ ...formData, selectedConcernIds: currentIds.filter(id => id !== optionId) })
    } else {
      setFormData({ ...formData, selectedConcernIds: [...currentIds, optionId] })
    }
  }

  const generateLandingPage = async () => {
    if (!formData.landing_page_reference_url) {
      alert('Please enter a reference URL')
      return
    }

    setIsGeneratingLandingPage(true)
    try {
      const response = await fetch('/api/ecommerce/generate-landing-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referenceUrl: formData.landing_page_reference_url,
          productName: formData.title,
          productDescription: formData.description,
          productBenefits: formData.hero_benefit
        })
      })

      const data = await response.json()
      if (data.landingPage) {
        setLandingPageContent(data.landingPage)
        alert('Landing page generated! Content will be saved with the product.')
      } else if (data.error) {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error('Failed to generate landing page:', error)
      alert('Failed to generate landing page')
    } finally {
      setIsGeneratingLandingPage(false)
    }
  }

  const handleSave = async () => {
    if (!formData.title) {
      alert('Product name is required')
      return
    }

    setIsSaving(true)
    try {
      const payload = {
        ...formData,
        business_unit_id: businessUnitId,
        id: productId,
      }

      const response = await fetch('/api/ecommerce/products', {
        method: productId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await response.json()
      if (response.ok) {
        const savedProductId = data.product?.id || productId

        // Save concern values if we have a product ID and concerns selected
        if (savedProductId && formData.selectedConcernIds.length > 0 && attributes.length > 0) {
          // Get the first category-linked attribute (e.g., Skin Concerns)
          const concernAttr = attributes[0]
          await fetch('/api/ecommerce/product-attribute-values', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              productId: savedProductId,
              attributeId: concernAttr.id,
              optionIds: formData.selectedConcernIds
            })
          })
        } else if (savedProductId && formData.selectedConcernIds.length === 0 && attributes.length > 0) {
          // Clear concerns if none selected
          const concernAttr = attributes[0]
          await fetch('/api/ecommerce/product-attribute-values', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              productId: savedProductId,
              attributeId: concernAttr.id,
              optionIds: []
            })
          })
        }

        onSave(data.product)
      } else {
        alert(data.error || 'Failed to save product')
      }
    } catch (error) {
      console.error('Failed to save:', error)
      alert('Failed to save product')
    } finally {
      setIsSaving(false)
    }
  }

  const SectionHeader = ({ id, title, icon: Icon }: { id: string; title: string; icon: any }) => (
    <button
      onClick={() => toggleSection(id)}
      className="w-full flex items-center justify-between p-4 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
    >
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5 text-purple-400" />
        <span className="font-medium text-white">{title}</span>
      </div>
      {expandedSections.has(id) ? (
        <ChevronUp className="w-5 h-5 text-slate-400" />
      ) : (
        <ChevronDown className="w-5 h-5 text-slate-400" />
      )}
    </button>
  )

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
        <div className="bg-slate-800 rounded-xl p-8">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500 mx-auto" />
          <p className="text-slate-400 mt-4">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-xl font-semibold text-white flex items-center gap-3">
            <Package className="w-6 h-6 text-purple-400" />
            {productId ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button onClick={onCancel} className="text-slate-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">

          {/* Images Section */}
          <div className="space-y-3">
            <SectionHeader id="images" title="Product Images (up to 5)" icon={ImageIcon} />
            {expandedSections.has('images') && (
              <div className="bg-slate-700/50 rounded-lg p-4 space-y-4">
                <div className="flex flex-wrap gap-4">
                  {formData.images.map((url, idx) => {
                    // Extract filename from URL
                    const urlParts = url.split('/')
                    const filename = urlParts[urlParts.length - 1]
                    // Get the storage path (everything after the bucket name)
                    const pathMatch = url.match(/product-images\/(.+)$/)
                    const storagePath = pathMatch ? pathMatch[1] : filename

                    return (
                      <div key={idx} className="relative group">
                        <div
                          className={`w-24 h-24 rounded-lg overflow-hidden border-2 cursor-pointer ${
                            formData.thumbnail === url ? 'border-purple-500' : 'border-slate-600'
                          }`}
                          onClick={() => setPreviewImageIndex(idx)}
                        >
                          {isVideoUrl(url) ? (
                            <video src={url} className="w-full h-full object-cover" muted playsInline preload="metadata" />
                          ) : (
                            <img src={url} alt={`Product ${idx + 1}`} className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 rounded-lg">
                          <button
                            onClick={(e) => { e.stopPropagation(); setPreviewImageIndex(idx) }}
                            className="p-1 bg-blue-600 rounded text-white text-xs"
                            title="Enlarge image"
                          >
                            <ZoomIn className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setAsThumbnail(url) }}
                            className="p-1 bg-purple-600 rounded text-white text-xs"
                            title="Set as thumbnail"
                          >
                            <Eye className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); removeImage(idx) }}
                            className="p-1 bg-red-600 rounded text-white text-xs"
                            title="Remove image"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                        {formData.thumbnail === url && (
                          <span className="absolute -top-2 -right-2 bg-purple-600 text-white text-xs px-1 rounded">
                            Main
                          </span>
                        )}
                      </div>
                    )
                  })}
                  {formData.images.length < 5 && (
                    <div className="w-24 h-24 border-2 border-dashed border-slate-500 rounded-lg flex items-center justify-center">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="text-slate-400 hover:text-white"
                      >
                        <Plus className="w-8 h-8" />
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={formData.images.length >= 5 || isUploadingImage}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-600 hover:bg-slate-500 disabled:opacity-50 rounded-lg transition-colors"
                  >
                    {isUploadingImage ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Upload Images
                      </>
                    )}
                  </button>
                </div>

                {/* AI Image Generation */}
                <div className="mt-4 p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg space-y-3">
                  <div className="flex items-center gap-2 text-purple-300">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-sm font-medium">AI Image Generator</span>
                    {formData.images.length > 0 && (
                      <span className="text-xs text-slate-400">(will use first image as reference)</span>
                    )}
                  </div>
                  <textarea
                    value={imagePrompt}
                    onChange={(e) => setImagePrompt(e.target.value)}
                    placeholder="Describe the image you want to generate... e.g., 'Create a professional product shot with the product name and 3 key benefits overlaid on a clean white background'"
                    rows={3}
                    className="w-full px-4 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                  {imageGenError && (
                    <p className="text-sm text-red-400">{imageGenError}</p>
                  )}
                  <button
                    onClick={handleAiGenerateImage}
                    disabled={isGeneratingImage || formData.images.length >= 5 || !imagePrompt.trim()}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 rounded-lg transition-colors"
                  >
                    {isGeneratingImage ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Generate Image
                      </>
                    )}
                  </button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/mp4,video/webm"
                  multiple
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </div>
            )}
          </div>

          {/* Basic Info Section */}
          <div className="space-y-3">
            <SectionHeader id="basic" title="Basic Information" icon={FileText} />
            {expandedSections.has('basic') && (
              <div className="bg-slate-700/50 rounded-lg p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm text-slate-300 mb-1">Product Name *</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g., Bright+ Booster"
                      className="w-full px-4 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm text-slate-300 mb-1">Tagline</label>
                    <input
                      type="text"
                      value={formData.tagline}
                      onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                      placeholder="e.g., Renew. Brighten. Glow."
                      className="w-full px-4 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  {/* Categories FIRST - determines what product types and benefits are shown */}
                  <div className="col-span-2">
                    <label className="block text-sm text-slate-300 mb-1">Categories * (select first)</label>
                    <div className="flex flex-wrap gap-2">
                      {categories.map(cat => (
                        <button
                          key={cat.id}
                          onClick={() => toggleCategory(cat.id)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            formData.category_ids.includes(cat.id)
                              ? 'bg-cyan-600 text-white'
                              : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                          }`}
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>
                    {formData.category_ids.length === 0 && (
                      <p className="text-xs text-amber-400 mt-1">Select at least one category to see product types</p>
                    )}
                  </div>
                  {/* Product Type - filtered by selected categories */}
                  <div>
                    <label className="block text-sm text-slate-300 mb-1">Product Type *</label>
                    <select
                      value={formData.product_type_id}
                      onChange={(e) => setFormData({ ...formData, product_type_id: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
                      disabled={formData.category_ids.length === 0}
                    >
                      <option value="">{formData.category_ids.length === 0 ? 'Select categories first...' : 'Select type...'}</option>
                      {getFilteredProductTypes().map(type => (
                        <option key={type.id} value={type.id}>
                          {type.name} {type.is_addon && '(Add-on)'}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-300 mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full px-4 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm text-slate-300 mb-1">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="General product description..."
                      rows={3}
                      className="w-full px-4 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Pricing & Inventory Section */}
          <div className="space-y-3">
            <SectionHeader id="pricing" title="Pricing & Inventory" icon={DollarSign} />
            {expandedSections.has('pricing') && (
              <div className="bg-slate-700/50 rounded-lg p-4 space-y-4">
                {/* Variants Toggle */}
                <div className="flex items-center gap-3 p-3 bg-slate-600 rounded-lg">
                  <input
                    type="checkbox"
                    id="has-variants"
                    checked={formData.has_variants}
                    onChange={(e) => setFormData({ ...formData, has_variants: e.target.checked })}
                    className="w-4 h-4 rounded"
                  />
                  <label htmlFor="has-variants" className="text-slate-300">
                    This product has multiple variants (sizes, options)
                  </label>
                </div>

                {!formData.has_variants ? (
                  /* Simple Pricing - Single Product */
                  <div className="space-y-4">
                    {/* Row 1: Size/Option, SKU, Barcode */}
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm text-slate-300 mb-1">Size/Option</label>
                        <input
                          type="text"
                          value={formData.size_option || ''}
                          onChange={(e) => setFormData({ ...formData, size_option: e.target.value })}
                          placeholder="e.g., 30ml, Standard, etc."
                          className="w-full px-4 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-slate-300 mb-1">SKU</label>
                        <input
                          type="text"
                          value={formData.sku}
                          onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                          placeholder="BRT-BOOST-30ML"
                          className="w-full px-4 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-slate-300 mb-1">Barcode</label>
                        <input
                          type="text"
                          value={formData.barcode}
                          onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                          placeholder="UPC/EAN for scanning"
                          className="w-full px-4 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white"
                        />
                      </div>
                    </div>
                    {/* Row 2: Price, Compare At, Cost, Stock */}
                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm text-slate-300 mb-1">Price *</label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.price || ''}
                          onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || null })}
                          placeholder="0.00"
                          className="w-full px-4 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-slate-300 mb-1">Compare At</label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.compare_at_price || ''}
                          onChange={(e) => setFormData({ ...formData, compare_at_price: parseFloat(e.target.value) || null })}
                          placeholder="Original price"
                          className="w-full px-4 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-slate-300 mb-1">Cost Price</label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.cost_price || ''}
                          onChange={(e) => setFormData({ ...formData, cost_price: parseFloat(e.target.value) || null })}
                          placeholder="Your cost"
                          className="w-full px-4 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-slate-300 mb-1">Stock Qty</label>
                        <input
                          type="number"
                          value={formData.stock_quantity}
                          onChange={(e) => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) || 0 })}
                          className="w-full px-4 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Variants */
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300 font-medium">Variants</span>
                      <button
                        onClick={addVariant}
                        className="flex items-center gap-2 px-3 py-1 bg-green-600 hover:bg-green-500 rounded-lg text-sm"
                      >
                        <Plus className="w-4 h-4" />
                        Add Variant
                      </button>
                    </div>
                    {formData.variants.map((variant, idx) => (
                      <div key={idx} className="p-3 bg-slate-600 rounded-lg space-y-2">
                        {/* Row 1: Size/Option, SKU, Barcode */}
                        <div className="grid grid-cols-4 gap-2">
                          <div>
                            <label className="block text-xs text-slate-400 mb-1">Size/Option</label>
                            <input
                              type="text"
                              value={variant.title}
                              onChange={(e) => updateVariant(idx, { title: e.target.value })}
                              placeholder="e.g., 30ml"
                              className="w-full px-3 py-2 bg-slate-700 border border-slate-500 rounded text-white text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-slate-400 mb-1">SKU</label>
                            <input
                              type="text"
                              value={variant.sku}
                              onChange={(e) => updateVariant(idx, { sku: e.target.value })}
                              placeholder="BRT-BOOST-30ML"
                              className="w-full px-3 py-2 bg-slate-700 border border-slate-500 rounded text-white text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-slate-400 mb-1">Barcode</label>
                            <input
                              type="text"
                              value={variant.barcode || ''}
                              onChange={(e) => updateVariant(idx, { barcode: e.target.value })}
                              placeholder="UPC/EAN"
                              className="w-full px-3 py-2 bg-slate-700 border border-slate-500 rounded text-white text-sm"
                            />
                          </div>
                          <div className="flex items-end justify-end">
                            <button
                              onClick={() => removeVariant(idx)}
                              className="p-2 text-red-400 hover:text-red-300 hover:bg-slate-700 rounded"
                              title="Delete variant"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        {/* Row 2: Price, Compare At, Cost, Stock */}
                        <div className="grid grid-cols-4 gap-2">
                          <div>
                            <label className="block text-xs text-slate-400 mb-1">Price *</label>
                            <input
                              type="number"
                              step="0.01"
                              value={variant.price || ''}
                              onChange={(e) => updateVariant(idx, { price: parseFloat(e.target.value) || 0 })}
                              placeholder="0.00"
                              className="w-full px-3 py-2 bg-slate-700 border border-slate-500 rounded text-white text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-slate-400 mb-1">Compare At</label>
                            <input
                              type="number"
                              step="0.01"
                              value={variant.compare_at_price || ''}
                              onChange={(e) => updateVariant(idx, { compare_at_price: parseFloat(e.target.value) || null })}
                              placeholder="Original"
                              className="w-full px-3 py-2 bg-slate-700 border border-slate-500 rounded text-white text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-slate-400 mb-1">Cost</label>
                            <input
                              type="number"
                              step="0.01"
                              value={variant.cost_price || ''}
                              onChange={(e) => updateVariant(idx, { cost_price: parseFloat(e.target.value) || null })}
                              placeholder="Your cost"
                              className="w-full px-3 py-2 bg-slate-700 border border-slate-500 rounded text-white text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-slate-400 mb-1">Stock Qty</label>
                            <input
                              type="number"
                              value={variant.stock_quantity}
                              onChange={(e) => updateVariant(idx, { stock_quantity: parseInt(e.target.value) || 0 })}
                              placeholder="0"
                              className="w-full px-3 py-2 bg-slate-700 border border-slate-500 rounded text-white text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    {formData.variants.length === 0 && (
                      <p className="text-slate-400 text-sm text-center py-4">
                        No variants yet. Click "Add Variant" to create sizes/options.
                      </p>
                    )}
                  </div>
                )}

                {/* Inventory Settings */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-600">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="track-inventory"
                      checked={formData.track_inventory}
                      onChange={(e) => setFormData({ ...formData, track_inventory: e.target.checked })}
                      className="w-4 h-4 rounded"
                    />
                    <label htmlFor="track-inventory" className="text-sm text-slate-300">Track inventory</label>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-300 mb-1">Low Stock Alert</label>
                    <input
                      type="number"
                      value={formData.low_stock_threshold}
                      onChange={(e) => setFormData({ ...formData, low_stock_threshold: parseInt(e.target.value) || 5 })}
                      className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="allow-backorder"
                      checked={formData.allow_backorder}
                      onChange={(e) => setFormData({ ...formData, allow_backorder: e.target.checked })}
                      className="w-4 h-4 rounded"
                    />
                    <label htmlFor="allow-backorder" className="text-sm text-slate-300">Allow backorder</label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SkinCoach Specific Fields */}
          <div className="space-y-3">
            <SectionHeader id="skincoach" title="SkinCoach Product Details" icon={Sparkles} />
            {expandedSections.has('skincoach') && (
              <div className="bg-slate-700/50 rounded-lg p-4 space-y-4">
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Hero Benefit Summary</label>
                  <textarea
                    value={formData.hero_benefit}
                    onChange={(e) => setFormData({ ...formData, hero_benefit: e.target.value })}
                    placeholder="Main benefits overview..."
                    rows={3}
                    className="w-full px-4 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Key Actives</label>
                  <textarea
                    value={formData.key_actives}
                    onChange={(e) => setFormData({ ...formData, key_actives: e.target.value })}
                    placeholder="Active ingredients and their benefits..."
                    rows={3}
                    className="w-full px-4 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white"
                  />
                </div>

                {/* Concerns by Category - Only show for selected categories */}
                {getConcernsByCategory().length > 0 ? (
                  <div>
                    <label className="block text-sm text-slate-300 mb-2">
                      Concerns by Category
                      <span className="text-slate-500 ml-2">
                        (Select what this product helps with)
                      </span>
                    </label>
                    <div className="space-y-4">
                      {getConcernsByCategory().map(cat => (
                        <div key={cat.categoryId} className="p-3 bg-slate-600/50 rounded-lg">
                          <div className="text-sm font-medium text-cyan-400 mb-2">
                            {cat.categoryName} Concerns
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {cat.options.map(opt => (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => toggleConcern(opt.id)}
                                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                                  formData.selectedConcernIds.includes(opt.id)
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                }`}
                              >
                                {opt.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    {formData.selectedConcernIds.length > 0 && (
                      <div className="mt-2 text-xs text-slate-400">
                        {formData.selectedConcernIds.length} concern{formData.selectedConcernIds.length !== 1 ? 's' : ''} selected
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 bg-slate-600/50 rounded-lg border border-dashed border-slate-500">
                    <p className="text-sm text-slate-400 text-center">
                      Select categories above to see available concerns
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm text-slate-300 mb-1">Full Ingredients (INCI)</label>
                  <textarea
                    value={formData.ingredients}
                    onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
                    placeholder="Water, Glycerin, Niacinamide..."
                    rows={3}
                    className="w-full px-4 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-300 mb-1">Clinical Studies</label>
                    <textarea
                      value={formData.clinical_studies}
                      onChange={(e) => setFormData({ ...formData, clinical_studies: e.target.value })}
                      placeholder="Clinical study results..."
                      rows={3}
                      className="w-full px-4 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-300 mb-1">Trade Name</label>
                    <textarea
                      value={formData.trade_name}
                      onChange={(e) => setFormData({ ...formData, trade_name: e.target.value })}
                      placeholder="Proprietary ingredient names..."
                      rows={3}
                      className="w-full px-4 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Landing Page Section */}
          <div className="space-y-3">
            <SectionHeader id="landing" title="Landing Page (Optional)" icon={Globe} />
            {expandedSections.has('landing') && (
              <div className="bg-slate-700/50 rounded-lg p-4 space-y-4">
                <div className="flex items-center gap-3 p-3 bg-purple-900/30 border border-purple-500/30 rounded-lg">
                  <input
                    type="checkbox"
                    id="has-landing"
                    checked={formData.has_landing_page}
                    onChange={(e) => setFormData({ ...formData, has_landing_page: e.target.checked })}
                    className="w-4 h-4 rounded"
                  />
                  <label htmlFor="has-landing" className="text-purple-300">
                    Create a dedicated marketing landing page for this product
                  </label>
                </div>

                {formData.has_landing_page && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-slate-300 mb-1">Reference URL (competitor site)</label>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={formData.landing_page_reference_url}
                          onChange={(e) => setFormData({ ...formData, landing_page_reference_url: e.target.value })}
                          placeholder="https://competitor.com/their-product"
                          className="flex-1 px-4 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white"
                        />
                        <button
                          onClick={generateLandingPage}
                          disabled={!formData.landing_page_reference_url || isGeneratingLandingPage}
                          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 rounded-lg"
                        >
                          {isGeneratingLandingPage ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Sparkles className="w-4 h-4" />
                          )}
                          {isGeneratingLandingPage ? 'Generating...' : 'Generate'}
                        </button>
                      </div>
                      <p className="text-xs text-slate-400 mt-2">
                        AI will analyze the reference site and generate a similar landing page layout
                      </p>
                    </div>

                    {/* Generated Landing Page Preview */}
                    {landingPageContent && (
                      <div className="bg-slate-600/50 rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-green-400">Landing Page Generated</span>
                          <button
                            onClick={() => setLandingPageContent(null)}
                            className="text-xs text-slate-400 hover:text-white"
                          >
                            Clear
                          </button>
                        </div>
                        {landingPageContent.hero && (
                          <div>
                            <span className="text-xs text-slate-400">Hero:</span>
                            <p className="text-white font-medium">{landingPageContent.hero.headline}</p>
                            <p className="text-slate-300 text-sm">{landingPageContent.hero.subheadline}</p>
                          </div>
                        )}
                        {landingPageContent.benefits?.items && (
                          <div>
                            <span className="text-xs text-slate-400">Benefits:</span>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {landingPageContent.benefits.items.slice(0, 3).map((b: any, i: number) => (
                                <span key={i} className="px-2 py-1 bg-slate-700 rounded text-xs text-slate-200">
                                  {b.title}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        <p className="text-xs text-slate-400">
                          Full landing page content will be saved with the product
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Display Options */}
          <div className="space-y-3">
            <SectionHeader id="display" title="Display Options" icon={Eye} />
            {expandedSections.has('display') && (
              <div className="bg-slate-700/50 rounded-lg p-4">
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.is_featured}
                      onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-slate-300">Featured Product</span>
                  </label>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-700">
          <button
            onClick={onCancel}
            className="px-6 py-2 bg-slate-600 hover:bg-slate-500 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !formData.title}
            className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 rounded-lg transition-colors"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {productId ? 'Update Product' : 'Create Product'}
          </button>
        </div>
      </div>

      {/* Image Preview Modal */}
      {previewImageIndex !== null && formData.images[previewImageIndex] && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60]"
          onClick={() => setPreviewImageIndex(null)}
        >
          <div className="relative max-w-[90vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            {/* Close button */}
            <button
              onClick={() => setPreviewImageIndex(null)}
              className="absolute -top-12 right-0 p-2 text-white hover:text-gray-300 transition-colors"
            >
              <X className="w-8 h-8" />
            </button>

            {/* Navigation arrows */}
            {formData.images.length > 1 && (
              <>
                <button
                  onClick={() => setPreviewImageIndex(
                    previewImageIndex === 0 ? formData.images.length - 1 : previewImageIndex - 1
                  )}
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-14 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                >
                  <ChevronLeft className="w-8 h-8" />
                </button>
                <button
                  onClick={() => setPreviewImageIndex(
                    previewImageIndex === formData.images.length - 1 ? 0 : previewImageIndex + 1
                  )}
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-14 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                >
                  <ChevronRight className="w-8 h-8" />
                </button>
              </>
            )}

            {/* Main image/video */}
            {isVideoUrl(formData.images[previewImageIndex]) ? (
              <video
                src={formData.images[previewImageIndex]}
                className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg"
                controls
                autoPlay
                loop
                muted
              />
            ) : (
              <img
                src={formData.images[previewImageIndex]}
                alt={`Product image ${previewImageIndex + 1}`}
                className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg"
              />
            )}

            {/* Image counter */}
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-white text-sm">
              {previewImageIndex + 1} / {formData.images.length}
              {formData.images[previewImageIndex] === formData.thumbnail && (
                <span className="ml-2 px-2 py-0.5 bg-purple-600 rounded text-xs">Main</span>
              )}
            </div>

            {/* Action buttons */}
            <div className="absolute -bottom-10 right-0 flex gap-2">
              <button
                onClick={() => {
                  setAsThumbnail(formData.images[previewImageIndex])
                }}
                className="px-3 py-1 bg-purple-600 hover:bg-purple-500 rounded text-white text-sm flex items-center gap-1"
              >
                <Eye className="w-4 h-4" />
                Set as Main
              </button>
              <button
                onClick={() => {
                  const idx = previewImageIndex
                  removeImage(idx)
                  if (formData.images.length <= 1) {
                    setPreviewImageIndex(null)
                  } else if (idx >= formData.images.length - 1) {
                    setPreviewImageIndex(idx - 1)
                  }
                }}
                className="px-3 py-1 bg-red-600 hover:bg-red-500 rounded text-white text-sm flex items-center gap-1"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
