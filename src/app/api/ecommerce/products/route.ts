/**
 * Products API Routes - Comprehensive SkinCoach Product Management
 * GET /api/ecommerce/products - List all products with relations
 * POST /api/ecommerce/products - Create a new product with all fields
 * PUT /api/ecommerce/products - Update an existing product
 * DELETE /api/ecommerce/products - Delete a product
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Helper function to resolve business unit ID from slug or UUID
async function resolveBusinessUnitId(idOrSlug: string): Promise<string | null> {
  // Check if it's already a UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (uuidRegex.test(idOrSlug)) {
    return idOrSlug
  }

  // Look up by slug
  const { data: bu } = await supabase
    .from('business_units')
    .select('id')
    .eq('slug', idOrSlug)
    .single()

  return bu?.id || null
}

// GET - List products with full relations
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const businessUnitParam = searchParams.get('business_unit_id') || searchParams.get('businessUnitId')
    const productId = searchParams.get('id')
    const status = searchParams.get('status') as 'draft' | 'published' | 'archived' | null
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0

    // Get single product by ID
    if (productId) {
      const { data: product, error } = await supabase
        .from('products')
        .select(`
          *,
          product_images(id, url, alt_text, display_order),
          product_variants(
            id, title, sku, barcode, inventory_quantity, allow_backorder,
            product_variant_prices(amount, currency_code)
          ),
          product_category_mapping(
            category_id,
            product_categories(id, name, handle)
          ),
          product_types(id, name, handle, is_addon)
        `)
        .eq('id', productId)
        .is('deleted_at', null)
        .single()

      if (error) throw error
      return NextResponse.json({ product })
    }

    // Get all products for business unit
    if (!businessUnitParam) {
      return NextResponse.json(
        { error: 'business_unit_id is required' },
        { status: 400 }
      )
    }

    const businessUnitId = await resolveBusinessUnitId(businessUnitParam)
    if (!businessUnitId) {
      return NextResponse.json(
        { error: 'Business unit not found' },
        { status: 404 }
      )
    }

    let query = supabase
      .from('products')
      .select(`
        *,
        product_images(id, url, alt_text, display_order),
        product_variants(
          id, title, sku, barcode, inventory_quantity, allow_backorder,
          product_variant_prices(amount, currency_code)
        ),
        product_category_mapping(
          category_id,
          product_categories(id, name, handle)
        ),
        product_types(id, name, handle, is_addon)
      `)
      .eq('business_unit_id', businessUnitId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    query = query.range(offset, offset + limit - 1)

    const { data: products, error } = await query

    if (error) throw error

    return NextResponse.json({ products: products || [] })
  } catch (error: any) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch products' },
      { status: 500 }
    )
  }
}

// POST - Create new product with all SkinCoach fields
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      business_unit_id,
      title,
      tagline,
      description,
      product_type_id,
      category_ids,
      status,
      images,
      thumbnail,
      price,
      compare_at_price,
      cost_price,
      sku,
      barcode,
      track_inventory,
      stock_quantity,
      low_stock_threshold,
      allow_backorder,
      has_variants,
      variants,
      // SkinCoach specific fields
      hero_benefit,
      key_actives,
      ingredients,
      face_benefits,
      body_benefits,
      hair_benefits,
      eye_benefits,
      clinical_studies,
      trade_name,
      // Landing page
      has_landing_page,
      landing_page_reference_url,
      // Display
      is_featured,
      badges
    } = body

    if (!business_unit_id || !title) {
      return NextResponse.json(
        { error: 'business_unit_id and title are required' },
        { status: 400 }
      )
    }

    // Resolve business unit ID from slug if needed
    const resolvedBusinessUnitId = await resolveBusinessUnitId(business_unit_id)
    if (!resolvedBusinessUnitId) {
      return NextResponse.json(
        { error: 'Business unit not found' },
        { status: 404 }
      )
    }

    // Generate handle from title
    const handle = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

    // Create product
    // Note: price/inventory fields stored via product_variants or in metadata
    // Detail fields (hero_benefit, ingredients, etc) were added to products table in migration 051
    const { data: product, error: productError } = await supabase
      .from('products')
      .insert({
        business_unit_id: resolvedBusinessUnitId,
        title,
        handle,
        tagline,
        description,
        product_type_id: product_type_id || null,
        status: status || 'draft',
        thumbnail: thumbnail || (images && images[0]) || null,
        // Detail fields (added in migration 051)
        hero_benefit,
        key_actives,
        ingredients,
        face_benefits,
        body_benefits,
        hair_benefits,
        eye_benefits,
        clinical_studies,
        trade_name,
        // Additional fields stored in metadata
        metadata: {
          // Pricing (for simple products without variants)
          ...(has_variants ? {} : {
            price,
            compare_at_price,
            cost_price,
            sku,
            barcode,
            stock_quantity: stock_quantity || 0,
          }),
          track_inventory: track_inventory !== false,
          low_stock_threshold: low_stock_threshold || 5,
          allow_backorder: allow_backorder || false,
          has_variants: has_variants || false,
          has_landing_page,
          landing_page_reference_url,
          is_featured,
          badges
        }
      })
      .select()
      .single()

    if (productError) throw productError

    const productId = product.id

    // Add product images
    if (images && images.length > 0) {
      const imageInserts = images.map((url: string, idx: number) => ({
        product_id: productId,
        url,
        display_order: idx
      }))

      const { error: imagesError } = await supabase
        .from('product_images')
        .insert(imageInserts)

      if (imagesError) {
        console.error('Error adding images:', imagesError)
      }
    }

    // Add category mappings
    if (category_ids && category_ids.length > 0) {
      const categoryInserts = category_ids.map((categoryId: string) => ({
        product_id: productId,
        category_id: categoryId
      }))

      const { error: categoryError } = await supabase
        .from('product_category_mapping')
        .insert(categoryInserts)

      if (categoryError) {
        console.error('Error adding categories:', categoryError)
      }
    }

    // Add variants if applicable
    if (has_variants && variants && variants.length > 0) {
      for (const variant of variants) {
        // Create variant
        const { data: newVariant, error: variantError } = await supabase
          .from('product_variants')
          .insert({
            product_id: productId,
            title: variant.title,
            sku: variant.sku || null,
            inventory_quantity: variant.stock_quantity || 0,
            allow_backorder: allow_backorder || false,
            manage_inventory: track_inventory !== false
          })
          .select()
          .single()

        if (variantError) {
          console.error('Error creating variant:', variantError)
          continue
        }

        // Create variant price
        if (variant.price) {
          const { error: priceError } = await supabase
            .from('product_variant_prices')
            .insert({
              variant_id: newVariant.id,
              amount: variant.price,
              currency_code: 'USD'
            })

          if (priceError) {
            console.error('Error adding variant price:', priceError)
          }
        }
      }
    }

    // Fetch complete product with relations
    const { data: completeProduct, error: fetchError } = await supabase
      .from('products')
      .select(`
        *,
        product_images(id, url, alt_text, display_order),
        product_variants(
          id, title, sku, inventory_quantity,
          product_variant_prices(amount, currency_code)
        ),
        product_category_mapping(
          category_id,
          product_categories(id, name, handle)
        )
      `)
      .eq('id', productId)
      .single()

    if (fetchError) throw fetchError

    return NextResponse.json({ product: completeProduct }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating product:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create product' },
      { status: 500 }
    )
  }
}

// PUT - Update existing product
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    const {
      title,
      tagline,
      description,
      product_type_id,
      category_ids,
      status,
      images,
      thumbnail,
      price,
      compare_at_price,
      cost_price,
      sku,
      barcode,
      track_inventory,
      stock_quantity,
      low_stock_threshold,
      allow_backorder,
      has_variants,
      variants,
      // SkinCoach specific fields
      hero_benefit,
      key_actives,
      ingredients,
      face_benefits,
      body_benefits,
      hair_benefits,
      eye_benefits,
      clinical_studies,
      trade_name,
      // Landing page
      has_landing_page,
      landing_page_reference_url,
      // Display
      is_featured,
      badges
    } = body

    // Build update object
    // Note: price/inventory fields go in metadata, detail fields go in direct columns
    const updates: any = {
      updated_at: new Date().toISOString()
    }

    if (title !== undefined) {
      updates.title = title
      updates.handle = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    }
    if (tagline !== undefined) {
      updates.tagline = tagline
    }
    if (description !== undefined) updates.description = description
    if (product_type_id !== undefined) updates.product_type_id = product_type_id || null
    if (status !== undefined) updates.status = status
    if (thumbnail !== undefined) updates.thumbnail = thumbnail

    // Detail fields (direct columns from migration 051)
    if (hero_benefit !== undefined) updates.hero_benefit = hero_benefit
    if (key_actives !== undefined) updates.key_actives = key_actives
    if (ingredients !== undefined) updates.ingredients = ingredients
    if (face_benefits !== undefined) updates.face_benefits = face_benefits
    if (body_benefits !== undefined) updates.body_benefits = body_benefits
    if (hair_benefits !== undefined) updates.hair_benefits = hair_benefits
    if (eye_benefits !== undefined) updates.eye_benefits = eye_benefits
    if (clinical_studies !== undefined) updates.clinical_studies = clinical_studies
    if (trade_name !== undefined) updates.trade_name = trade_name

    // Additional fields stored in metadata
    updates.metadata = {
      // Pricing (for simple products without variants)
      ...(has_variants ? {} : {
        price,
        compare_at_price,
        cost_price,
        sku,
        barcode,
        stock_quantity: stock_quantity || 0,
      }),
      track_inventory: track_inventory !== false,
      low_stock_threshold: low_stock_threshold || 5,
      allow_backorder: allow_backorder || false,
      has_variants: has_variants || false,
      has_landing_page,
      landing_page_reference_url,
      is_featured,
      badges
    }

    // Update product
    const { data: product, error: productError } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (productError) throw productError

    // Update images if provided
    if (images !== undefined) {
      // Delete old images
      await supabase
        .from('product_images')
        .delete()
        .eq('product_id', id)

      // Add new images
      if (images.length > 0) {
        const imageInserts = images.map((url: string, idx: number) => ({
          product_id: id,
          url,
          display_order: idx
        }))

        await supabase
          .from('product_images')
          .insert(imageInserts)
      }
    }

    // Update category mappings if provided
    if (category_ids !== undefined) {
      // Delete old mappings
      await supabase
        .from('product_category_mapping')
        .delete()
        .eq('product_id', id)

      // Add new mappings
      if (category_ids.length > 0) {
        const categoryInserts = category_ids.map((categoryId: string) => ({
          product_id: id,
          category_id: categoryId
        }))

        await supabase
          .from('product_category_mapping')
          .insert(categoryInserts)
      }
    }

    // Update variants if provided
    if (has_variants && variants !== undefined) {
      // Delete old variants and their prices
      const { data: oldVariants } = await supabase
        .from('product_variants')
        .select('id')
        .eq('product_id', id)

      if (oldVariants && oldVariants.length > 0) {
        const oldVariantIds = oldVariants.map(v => v.id)
        await supabase
          .from('product_variant_prices')
          .delete()
          .in('variant_id', oldVariantIds)
        await supabase
          .from('product_variants')
          .delete()
          .eq('product_id', id)
      }

      // Add new variants
      for (const variant of variants) {
        const { data: newVariant, error: variantError } = await supabase
          .from('product_variants')
          .insert({
            product_id: id,
            title: variant.title,
            sku: variant.sku || null,
            inventory_quantity: variant.stock_quantity || 0,
            allow_backorder: allow_backorder || false,
            manage_inventory: track_inventory !== false
          })
          .select()
          .single()

        if (variantError) continue

        if (variant.price) {
          await supabase
            .from('product_variant_prices')
            .insert({
              variant_id: newVariant.id,
              amount: variant.price,
              currency_code: 'USD'
            })
        }
      }
    }

    // Fetch complete updated product
    const { data: completeProduct, error: fetchError } = await supabase
      .from('products')
      .select(`
        *,
        product_images(id, url, alt_text, display_order),
        product_variants(
          id, title, sku, inventory_quantity,
          product_variant_prices(amount, currency_code)
        ),
        product_category_mapping(
          category_id,
          product_categories(id, name, handle)
        )
      `)
      .eq('id', id)
      .single()

    if (fetchError) throw fetchError

    return NextResponse.json({ product: completeProduct })
  } catch (error: any) {
    console.error('Error updating product:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update product' },
      { status: 500 }
    )
  }
}

// PATCH - Quick update for specific fields (like is_addon toggle)
export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const body = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    // Get current product to merge metadata
    const { data: currentProduct, error: fetchError } = await supabase
      .from('products')
      .select('metadata')
      .eq('id', id)
      .single()

    if (fetchError) throw fetchError

    const currentMetadata = currentProduct?.metadata || {}

    // Build update object - only update fields that are provided
    const updates: any = {
      updated_at: new Date().toISOString()
    }

    // Handle is_addon - store in metadata for now
    if (body.is_addon !== undefined) {
      updates.metadata = {
        ...currentMetadata,
        is_addon: body.is_addon
      }
    }

    // Handle status quick update
    if (body.status !== undefined) {
      updates.status = body.status
    }

    const { data: product, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ product })
  } catch (error: any) {
    console.error('Error patching product:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update product' },
      { status: 500 }
    )
  }
}

// DELETE - Soft delete a product
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    // Soft delete
    const { error } = await supabase
      .from('products')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting product:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete product' },
      { status: 500 }
    )
  }
}
