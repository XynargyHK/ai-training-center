/**
 * Cart Items API Routes
 * POST /api/ecommerce/cart/items - Add item to cart
 * PUT /api/ecommerce/cart/items - Update item quantity
 * DELETE /api/ecommerce/cart/items - Remove item from cart
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  addItemToCart,
  updateCartItemQuantity,
  removeCartItem
} from '@/lib/ecommerce/cart-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { cart_id, variant_id, quantity, unit_price } = body

    if (!cart_id || !variant_id || !quantity || !unit_price) {
      return NextResponse.json(
        { error: 'cart_id, variant_id, quantity, and unit_price are required' },
        { status: 400 }
      )
    }

    const item = await addItemToCart({
      cartId: cart_id,
      variantId: variant_id,
      quantity,
      unitPrice: unit_price
    })

    return NextResponse.json({ item }, { status: 201 })
  } catch (error: any) {
    console.error('Error adding item to cart:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to add item to cart' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { item_id, quantity } = body

    if (!item_id || quantity === undefined) {
      return NextResponse.json(
        { error: 'item_id and quantity are required' },
        { status: 400 }
      )
    }

    const item = await updateCartItemQuantity(item_id, quantity)

    return NextResponse.json({ item })
  } catch (error: any) {
    console.error('Error updating cart item:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update cart item' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const itemId = searchParams.get('item_id')

    if (!itemId) {
      return NextResponse.json(
        { error: 'item_id is required' },
        { status: 400 }
      )
    }

    await removeCartItem(itemId)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error removing cart item:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to remove cart item' },
      { status: 500 }
    )
  }
}
