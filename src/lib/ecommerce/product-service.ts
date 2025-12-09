/**
 * E-commerce Product Service
 * Handles all product-related operations using direct Supabase queries
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

export interface Product {
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
  deleted_at?: string
}

export interface ProductVariant {
  id: string
  product_id: string
  title: string
  sku?: string
  barcode?: string
  ean?: string
  inventory_quantity: number
  allow_backorder: boolean
  manage_inventory: boolean
  weight?: number
  length?: number
  height?: number
  width?: number
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
  deleted_at?: string
}

export interface ProductImage {
  id: string
  product_id: string
  url: string
  alt_text?: string
  metadata?: Record<string, any>
  display_order: number
  created_at: string
  updated_at: string
  deleted_at?: string
}

export interface ProductCategory {
  id: string
  business_unit_id: string
  name: string
  handle?: string
  description?: string
  parent_category_id?: string
  rank: number
  is_active: boolean
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
  deleted_at?: string
}

/**
 * Create a new product
 */
export async function createProduct(data: {
  business_unit_id: string
  title: string
  description?: string
  handle?: string
  subtitle?: string
  thumbnail?: string
  status?: 'draft' | 'published' | 'archived'
  metadata?: Record<string, any>
}): Promise<Product> {
  const { data: product, error } = await supabase
    .from('products')
    .insert({
      ...data,
      status: data.status || 'draft',
      metadata: data.metadata || {}
    })
    .select()
    .single()

  if (error) throw error
  return product
}

/**
 * Get all products for a business unit
 */
export async function getProducts(
  businessUnitId: string,
  options?: {
    status?: 'draft' | 'published' | 'archived'
    limit?: number
    offset?: number
  }
): Promise<Product[]> {
  let query = supabase
    .from('products')
    .select('*')
    .eq('business_unit_id', businessUnitId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (options?.status) {
    query = query.eq('status', options.status)
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
  }

  const { data, error } = await query

  if (error) throw error
  return data || []
}

/**
 * Get a single product by ID
 */
export async function getProduct(productId: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .is('deleted_at', null)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    throw error
  }
  return data
}

/**
 * Update a product
 */
export async function updateProduct(
  productId: string,
  data: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at'>>
): Promise<Product> {
  const { data: product, error } = await supabase
    .from('products')
    .update(data)
    .eq('id', productId)
    .select()
    .single()

  if (error) throw error
  return product
}

/**
 * Soft delete a product
 */
export async function deleteProduct(productId: string): Promise<void> {
  const { error } = await supabase
    .from('products')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', productId)

  if (error) throw error
}

/**
 * Create a product variant
 */
export async function createProductVariant(data: {
  product_id: string
  title: string
  sku?: string
  barcode?: string
  ean?: string
  inventory_quantity?: number
  allow_backorder?: boolean
  manage_inventory?: boolean
  weight?: number
  length?: number
  height?: number
  width?: number
  metadata?: Record<string, any>
}): Promise<ProductVariant> {
  const { data: variant, error } = await supabase
    .from('product_variants')
    .insert({
      ...data,
      inventory_quantity: data.inventory_quantity || 0,
      allow_backorder: data.allow_backorder || false,
      manage_inventory: data.manage_inventory !== false,
      metadata: data.metadata || {}
    })
    .select()
    .single()

  if (error) throw error
  return variant
}

/**
 * Get all variants for a product
 */
export async function getProductVariants(productId: string): Promise<ProductVariant[]> {
  const { data, error } = await supabase
    .from('product_variants')
    .select('*')
    .eq('product_id', productId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data || []
}

/**
 * Update a product variant
 */
export async function updateProductVariant(
  variantId: string,
  data: Partial<Omit<ProductVariant, 'id' | 'product_id' | 'created_at' | 'updated_at'>>
): Promise<ProductVariant> {
  const { data: variant, error } = await supabase
    .from('product_variants')
    .update(data)
    .eq('id', variantId)
    .select()
    .single()

  if (error) throw error
  return variant
}

/**
 * Add an image to a product
 */
export async function addProductImage(data: {
  product_id: string
  url: string
  alt_text?: string
  display_order?: number
  metadata?: Record<string, any>
}): Promise<ProductImage> {
  const { data: image, error } = await supabase
    .from('product_images')
    .insert({
      ...data,
      display_order: data.display_order || 0,
      metadata: data.metadata || {}
    })
    .select()
    .single()

  if (error) throw error
  return image
}

/**
 * Get all images for a product
 */
export async function getProductImages(productId: string): Promise<ProductImage[]> {
  const { data, error } = await supabase
    .from('product_images')
    .select('*')
    .eq('product_id', productId)
    .is('deleted_at', null)
    .order('display_order', { ascending: true })

  if (error) throw error
  return data || []
}

/**
 * Create a product category
 */
export async function createProductCategory(data: {
  business_unit_id: string
  name: string
  handle?: string
  description?: string
  parent_category_id?: string
  rank?: number
  is_active?: boolean
  metadata?: Record<string, any>
}): Promise<ProductCategory> {
  const { data: category, error } = await supabase
    .from('product_categories')
    .insert({
      ...data,
      rank: data.rank || 0,
      is_active: data.is_active !== false,
      metadata: data.metadata || {}
    })
    .select()
    .single()

  if (error) throw error
  return category
}

/**
 * Get all categories for a business unit
 */
export async function getProductCategories(businessUnitId: string): Promise<ProductCategory[]> {
  const { data, error } = await supabase
    .from('product_categories')
    .select('*')
    .eq('business_unit_id', businessUnitId)
    .is('deleted_at', null)
    .order('rank', { ascending: true })

  if (error) throw error
  return data || []
}

/**
 * Link a product to a category
 */
export async function addProductToCategory(
  productId: string,
  categoryId: string
): Promise<void> {
  const { error } = await supabase
    .from('product_category_mapping')
    .insert({
      product_id: productId,
      category_id: categoryId
    })

  if (error) throw error
}

/**
 * Get categories for a product
 */
export async function getProductCategories_forProduct(productId: string): Promise<ProductCategory[]> {
  const { data, error } = await supabase
    .from('product_category_mapping')
    .select(`
      category_id,
      product_categories (*)
    `)
    .eq('product_id', productId)

  if (error) throw error

  return (data || [])
    .map(item => (item as any).product_categories)
    .filter(Boolean)
}
