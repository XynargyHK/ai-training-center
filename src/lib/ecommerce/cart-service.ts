/**
 * Shopping Cart Service
 * Manages shopping cart operations
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export interface Cart {
  id: string
  business_unit_id: string
  customer_id?: string
  email?: string
  billing_address?: any
  shipping_address?: any
  region_id?: string
  currency_code: string
  metadata?: Record<string, any>
  completed_at?: string
  created_at: string
  updated_at: string
  deleted_at?: string
}

export interface CartItem {
  id: string
  cart_id: string
  variant_id: string
  quantity: number
  unit_price: number
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
}

export interface CartWithItems extends Cart {
  items: (CartItem & {
    variant?: any
    product?: any
  })[]
}

/**
 * Create or get cart for a customer
 */
export async function getOrCreateCart(params: {
  businessUnitId: string
  customerId?: string
  email?: string
}): Promise<Cart> {
  const { businessUnitId, customerId, email } = params

  // Try to find existing active cart
  let query = supabase
    .from('carts')
    .select('*')
    .eq('business_unit_id', businessUnitId)
    .is('completed_at', null)
    .is('deleted_at', null)

  if (customerId) {
    query = query.eq('customer_id', customerId)
  } else if (email) {
    query = query.eq('email', email)
  }

  const { data: existingCarts } = await query.limit(1)

  if (existingCarts && existingCarts.length > 0) {
    return existingCarts[0]
  }

  // Create new cart
  const { data: newCart, error } = await supabase
    .from('carts')
    .insert({
      business_unit_id: businessUnitId,
      customer_id: customerId,
      email: email,
      currency_code: 'USD',
      metadata: {}
    })
    .select()
    .single()

  if (error) throw error
  return newCart
}

/**
 * Get cart with items and product details
 */
export async function getCartWithItems(cartId: string): Promise<CartWithItems | null> {
  const { data: cart, error: cartError } = await supabase
    .from('carts')
    .select('*')
    .eq('id', cartId)
    .is('deleted_at', null)
    .single()

  if (cartError || !cart) return null

  // Get cart items with variant and product info
  const { data: items, error: itemsError } = await supabase
    .from('cart_items')
    .select(`
      *,
      variant:product_variants!inner (
        *,
        product:products!inner (*)
      )
    `)
    .eq('cart_id', cartId)

  if (itemsError) throw itemsError

  return {
    ...cart,
    items: items || []
  }
}

/**
 * Add item to cart
 */
export async function addItemToCart(params: {
  cartId: string
  variantId: string
  quantity: number
  unitPrice: number
}): Promise<CartItem> {
  const { cartId, variantId, quantity, unitPrice } = params

  // Check if item already exists in cart
  const { data: existingItems } = await supabase
    .from('cart_items')
    .select('*')
    .eq('cart_id', cartId)
    .eq('variant_id', variantId)

  if (existingItems && existingItems.length > 0) {
    // Update quantity
    const existingItem = existingItems[0]
    const { data: updatedItem, error } = await supabase
      .from('cart_items')
      .update({
        quantity: existingItem.quantity + quantity
      })
      .eq('id', existingItem.id)
      .select()
      .single()

    if (error) throw error
    return updatedItem
  }

  // Add new item
  const { data: newItem, error } = await supabase
    .from('cart_items')
    .insert({
      cart_id: cartId,
      variant_id: variantId,
      quantity,
      unit_price: unitPrice,
      metadata: {}
    })
    .select()
    .single()

  if (error) throw error
  return newItem
}

/**
 * Update cart item quantity
 */
export async function updateCartItemQuantity(
  itemId: string,
  quantity: number
): Promise<CartItem> {
  if (quantity <= 0) {
    throw new Error('Quantity must be greater than 0')
  }

  const { data: item, error } = await supabase
    .from('cart_items')
    .update({ quantity })
    .eq('id', itemId)
    .select()
    .single()

  if (error) throw error
  return item
}

/**
 * Remove item from cart
 */
export async function removeCartItem(itemId: string): Promise<void> {
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('id', itemId)

  if (error) throw error
}

/**
 * Clear all items from cart
 */
export async function clearCart(cartId: string): Promise<void> {
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('cart_id', cartId)

  if (error) throw error
}

/**
 * Update cart addresses
 */
export async function updateCartAddresses(params: {
  cartId: string
  billingAddress?: any
  shippingAddress?: any
  email?: string
}): Promise<Cart> {
  const { cartId, billingAddress, shippingAddress, email } = params

  const updateData: any = {}
  if (billingAddress) updateData.billing_address = billingAddress
  if (shippingAddress) updateData.shipping_address = shippingAddress
  if (email) updateData.email = email

  const { data: cart, error } = await supabase
    .from('carts')
    .update(updateData)
    .eq('id', cartId)
    .select()
    .single()

  if (error) throw error
  return cart
}

/**
 * Calculate cart totals
 */
export function calculateCartTotals(cart: CartWithItems): {
  subtotal: number
  tax: number
  total: number
  itemCount: number
} {
  let subtotal = 0
  let itemCount = 0

  for (const item of cart.items) {
    subtotal += item.unit_price * item.quantity
    itemCount += item.quantity
  }

  const taxRate = 0.08 // 8% tax rate (configurable)
  const tax = subtotal * taxRate
  const total = subtotal + tax

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    total: Math.round(total * 100) / 100,
    itemCount
  }
}

/**
 * Mark cart as completed (after order creation)
 */
export async function completeCart(cartId: string): Promise<Cart> {
  const { data: cart, error } = await supabase
    .from('carts')
    .update({
      completed_at: new Date().toISOString()
    })
    .eq('id', cartId)
    .select()
    .single()

  if (error) throw error
  return cart
}
