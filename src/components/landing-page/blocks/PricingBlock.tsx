'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'
import { getFontClass } from '@/lib/fonts'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

interface Plan {
  title: string
  original_price: number
  discounted_price: number
  popular?: boolean
  product_id?: string
}

interface PricingBlockData {
  // Product name
  product_name?: string
  product_name_font_size?: string
  product_name_font_family?: string
  product_name_color?: string

  // Features
  features?: string[]
  features_font_size?: string
  features_font_family?: string
  features_color?: string

  // Plan heading
  plan_heading?: string
  plan_heading_font_size?: string
  plan_heading_font_family?: string
  plan_heading_color?: string

  // Plans
  plans?: Plan[]

  // CTA
  cta_text?: string
  currency_symbol?: string
  background_color?: string
}

interface PricingBlockProps {
  data: PricingBlockData
}

export default function PricingBlock({ data }: PricingBlockProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const businessUnitParam = searchParams.get('businessUnit') || ''

  const {
    product_name = 'Product Name',
    product_name_font_size = '2rem',
    product_name_font_family = 'Josefin Sans',
    product_name_color = '#000000',
    features = [],
    features_font_size = '1rem',
    features_font_family = 'Cormorant Garamond',
    features_color = '#374151',
    plan_heading = 'Choose Your Plan',
    plan_heading_font_size = '1.25rem',
    plan_heading_font_family = 'Josefin Sans',
    plan_heading_color = '#000000',
    plans = [],
    cta_text = 'Buy Now & SAVE',
    currency_symbol = '$',
    background_color = '#ffffff'
  } = data

  // State for selected plan (default to first plan)
  const [selectedPlanIndex, setSelectedPlanIndex] = useState(0)
  const [showAddedConfirmation, setShowAddedConfirmation] = useState(false)

  // Get selected plan
  const selectedPlan = plans[selectedPlanIndex] || plans[0] || {
    title: '',
    original_price: 0,
    discounted_price: 0
  }

  // Calculate discount percentage
  const discountPercentage = selectedPlan.original_price > 0
    ? Math.round(((selectedPlan.original_price - selectedPlan.discounted_price) / selectedPlan.original_price) * 100)
    : 0

  // Add selected plan to cart
  const handleAddToCart = async () => {
    // Get cart from localStorage
    const cartKey = `shop_cart_${businessUnitParam}`
    const savedCart = localStorage.getItem(cartKey)
    let cart = []

    try {
      if (savedCart) {
        cart = JSON.parse(savedCart)
      }
    } catch (e) {
      console.error('Error loading cart:', e)
    }

    let planProduct

    // If plan has product_id, fetch actual product data
    if (selectedPlan.product_id) {
      try {
        const response = await fetch(`/api/shop/products?businessUnit=${businessUnitParam}`)
        const data = await response.json()
        const product = data.products?.find((p: any) => p.id === selectedPlan.product_id)

        if (product) {
          planProduct = {
            id: product.id,
            title: product.title,
            description: product.description || '',
            cost_price: selectedPlan.discounted_price, // Use plan pricing
            compare_at_price: selectedPlan.original_price,
            thumbnail: product.thumbnail || '',
          }
        }
      } catch (error) {
        console.error('Error fetching product:', error)
      }
    }

    // Fallback: Create a product object from the selected plan
    if (!planProduct) {
      planProduct = {
        id: `plan-${selectedPlanIndex}`,
        title: selectedPlan.title,
        description: features?.join(', ') || '',
        cost_price: selectedPlan.discounted_price,
        compare_at_price: selectedPlan.original_price,
        thumbnail: '',
      }
    }

    // Check if this plan is already in cart
    const existingItemIndex = cart.findIndex((item: any) => item.product.id === planProduct.id)

    if (existingItemIndex >= 0) {
      // Increment quantity
      cart[existingItemIndex].quantity += 1
    } else {
      // Add new item
      cart.push({
        product: planProduct,
        quantity: 1
      })
    }

    // Save to localStorage
    localStorage.setItem(cartKey, JSON.stringify(cart))

    // Show confirmation
    setShowAddedConfirmation(true)
    setTimeout(() => setShowAddedConfirmation(false), 3000)
  }

  return (
    <section
      className="py-12 px-4"
      style={{ backgroundColor: background_color }}
    >
      <div className="max-w-2xl mx-auto">
        {/* Product Name */}
        {product_name && (
          <h2
            className={`text-center font-light tracking-[0.2em] uppercase leading-tight mb-6 ${getFontClass(product_name_font_family)}`}
            style={{
              fontSize: product_name_font_size,
              color: product_name_color
            }}
          >
            {product_name}
          </h2>
        )}

        {/* Pricing Display - Discounted LEFT, Original RIGHT */}
        <div className="flex items-center justify-center gap-4 mb-6">
          {/* Discounted Price */}
          <div className="text-4xl font-bold" style={{ color: product_name_color }}>
            {currency_symbol}{selectedPlan.discounted_price}
          </div>

          {/* Original Price (Strikethrough) */}
          {selectedPlan.original_price > selectedPlan.discounted_price && (
            <div className="text-2xl text-gray-400 line-through">
              {currency_symbol}{selectedPlan.original_price}
            </div>
          )}
        </div>

        {/* Features */}
        {features.length > 0 && (
          <ul className="space-y-2 mb-8">
            {features.map((feature, index) => (
              <li key={index} className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span
                  className={`font-light ${getFontClass(features_font_family)}`}
                  style={{
                    fontSize: features_font_size,
                    color: features_color
                  }}
                >
                  {feature}
                </span>
              </li>
            ))}
          </ul>
        )}

        {/* Plan Heading */}
        {plan_heading && (
          <h3
            className={`text-center font-light tracking-[0.15em] uppercase mb-4 ${getFontClass(plan_heading_font_family)}`}
            style={{
              fontSize: plan_heading_font_size,
              color: plan_heading_color
            }}
          >
            {plan_heading}
          </h3>
        )}

        {/* Plan Options - Radio Buttons */}
        {plans.length > 0 && (
          <div className="space-y-3 mb-6">
            {plans.map((plan, index) => (
              <label
                key={index}
                className={`relative flex items-center gap-3 p-4 border-2 cursor-pointer transition-all ${
                  selectedPlanIndex === index
                    ? 'border-black bg-gray-100'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
                onClick={() => setSelectedPlanIndex(index)}
              >
                {/* Most Popular Badge */}
                {plan.popular && (
                  <div className={`absolute -top-2.5 right-4 bg-black text-white text-xs px-3 py-1 rounded-full font-semibold tracking-wider ${getFontClass(plan_heading_font_family)}`}>
                    MOST POPULAR
                  </div>
                )}

                {/* Radio Button */}
                <input
                  type="radio"
                  name="pricing-plan"
                  checked={selectedPlanIndex === index}
                  onChange={() => setSelectedPlanIndex(index)}
                  className="w-5 h-5 text-violet-600 focus:ring-violet-500"
                />

                {/* Plan Title */}
                <span className="flex-1 font-medium text-gray-900">
                  {plan.title}
                </span>
              </label>
            ))}
          </div>
        )}

        {/* CTA Button with Auto-Calculated Discount */}
        {cta_text && (
          <div>
            <button
              onClick={handleAddToCart}
              className={`w-full px-8 py-4 bg-black text-white text-sm font-bold tracking-wider uppercase hover:bg-gray-800 transition-colors shadow-lg ${getFontClass(product_name_font_family)}`}
            >
              {cta_text} {discountPercentage > 0 && `${discountPercentage}%`}
            </button>

            {/* Added to Cart Confirmation */}
            {showAddedConfirmation && (
              <div className="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg text-center">
                ✓ Added to cart! <Link href={`/livechat/shop?businessUnit=${businessUnitParam}&openCart=true`} className="underline font-semibold">View Cart</Link>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
