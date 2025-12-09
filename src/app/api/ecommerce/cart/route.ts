/**
 * Shopping Cart API Routes
 * GET /api/ecommerce/cart - Get current cart
 * POST /api/ecommerce/cart - Create or get cart
 */

import { NextRequest, NextResponse } from 'next/server'
import { getOrCreateCart, getCartWithItems } from '@/lib/ecommerce/cart-service'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const cartId = searchParams.get('cart_id')

    if (!cartId) {
      return NextResponse.json(
        { error: 'cart_id is required' },
        { status: 400 }
      )
    }

    const cart = await getCartWithItems(cartId)

    if (!cart) {
      return NextResponse.json(
        { error: 'Cart not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ cart })
  } catch (error: any) {
    console.error('Error fetching cart:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch cart' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { business_unit_id, customer_id, email } = body

    if (!business_unit_id) {
      return NextResponse.json(
        { error: 'business_unit_id is required' },
        { status: 400 }
      )
    }

    const cart = await getOrCreateCart({
      businessUnitId: business_unit_id,
      customerId: customer_id,
      email
    })

    return NextResponse.json({ cart })
  } catch (error: any) {
    console.error('Error creating cart:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create cart' },
      { status: 500 }
    )
  }
}
