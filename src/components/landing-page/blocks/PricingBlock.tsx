'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'
import { getFontClass } from '@/lib/fonts'
import { useSearchParams } from 'next/navigation'

interface PricingPlan {
  title: string
  original_price: number
  discounted_price: number
  popular?: boolean
  product_id?: string
  treatments?: number
  content?: string[]
}

interface PricingBlockData {
  // Headline
  headline?: string
  headline_font_size?: string
  headline_font_family?: string
  headline_color?: string
  headline_bold?: boolean
  headline_italic?: boolean
  headline_text_align?: 'left' | 'center' | 'right'

  // Subheadline
  subheadline?: string
  subheadline_font_size?: string
  subheadline_font_family?: string
  subheadline_color?: string
  subheadline_bold?: boolean
  subheadline_italic?: boolean
  subheadline_text_align?: 'left' | 'center' | 'right'

  // Features
  features?: string[]
  content_font_size?: string
  content_font_family?: string
  content_color?: string
  content_bold?: boolean
  content_italic?: boolean
  content_text_align?: 'left' | 'center' | 'right'

  // Plan heading
  plan_heading?: string
  plan_heading_font_size?: string
  plan_heading_font_family?: string
  plan_heading_color?: string
  plan_heading_bold?: boolean
  plan_heading_italic?: boolean
  plan_heading_text_align?: 'left' | 'center' | 'right'

  // Plans
  plans?: PricingPlan[]

  // Price display styling
  price_font_size?: string
  price_font_family?: string
  price_color?: string
  price_bold?: boolean
  price_italic?: boolean
  price_text_align?: 'left' | 'center' | 'right'

  // Plan title styling
  plan_title_bold?: boolean
  plan_title_italic?: boolean
  plan_title_text_align?: 'left' | 'center' | 'right'

  // Plan content styling
  plan_content_font_size?: string
  plan_content_font_family?: string
  plan_content_color?: string
  plan_content_bold?: boolean
  plan_content_italic?: boolean
  plan_content_text_align?: 'left' | 'center' | 'right'

  // CTA
  cta_text?: string
  cta_font_size?: string
  cta_font_family?: string
  cta_color?: string
  cta_bold?: boolean
  cta_italic?: boolean
  cta_text_align?: 'left' | 'center' | 'right'

  currency_symbol?: string
  background_color?: string
}

interface PricingBlockProps {
  data: PricingBlockData
  anchorId?: string
  onAddToCart?: (product: any) => void
}

export default function PricingBlock({ data, anchorId, onAddToCart }: PricingBlockProps) {
  const searchParams = useSearchParams()
  const businessUnitParam = searchParams.get('businessUnit') || ''
  const [selectedPlanIndex, setSelectedPlanIndex] = useState(0)

  const plans = data.plans || []
  const features = data.features || []
  const selectedPlan = plans[selectedPlanIndex] || plans[0] || {
    title: '',
    original_price: 0,
    discounted_price: 0
  }

  // Calculate discount percentage
  const discountPercentage = selectedPlan.original_price > 0
    ? Math.round(((selectedPlan.original_price - selectedPlan.discounted_price) / selectedPlan.original_price) * 100)
    : 0

  const currencySymbol = data.currency_symbol || '$'

  // Add selected plan to cart
  const handleAddToCart = async () => {
    let planProduct

    // If plan has product_id, fetch actual product data
    if (selectedPlan.product_id) {
      try {
        const response = await fetch(`/api/shop/products?businessUnit=${businessUnitParam}`)
        const responseData = await response.json()
        const product = responseData.products?.find((p: any) => p.id === selectedPlan.product_id)

        if (product) {
          planProduct = {
            id: product.id,
            title: product.title,
            description: product.description || '',
            cost_price: selectedPlan.discounted_price,
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

    // Call parent's addToCart function to add to cart and open sidebar
    if (onAddToCart) {
      onAddToCart(planProduct)
    }
  }

  return (
    <section
      id={anchorId}
      className="py-12 px-4"
      style={{ backgroundColor: data.background_color || '#ffffff' }}
    >
      <div className="px-4 md:px-12 max-w-2xl mx-auto w-full">
        {/* Headline */}
        {data.headline && (
          <h2
            className={`font-light tracking-[0.2em] uppercase leading-tight mb-6 ${getFontClass(data.headline_font_family)} ${
              (data.headline_text_align || 'center') === 'left' ? 'text-left' :
              (data.headline_text_align || 'center') === 'right' ? 'text-right' :
              'text-center'
            }`}
            style={{
              fontSize: data.headline_font_size || '1.5rem',
              color: data.headline_color || '#000000',
              fontWeight: data.headline_bold ? 'bold' : undefined,
              fontStyle: data.headline_italic ? 'italic' : undefined
            }}
          >
            {data.headline}
          </h2>
        )}

        {/* Subheadline */}
        {data.subheadline && (
          <p
            className={`font-light tracking-[0.15em] uppercase mb-4 ${getFontClass(data.subheadline_font_family)} ${
              (data.subheadline_text_align || 'center') === 'left' ? 'text-left' :
              (data.subheadline_text_align || 'center') === 'right' ? 'text-right' :
              'text-center'
            }`}
            style={{
              fontSize: data.subheadline_font_size || '1.25rem',
              color: data.subheadline_color || '#000000',
              fontWeight: data.subheadline_bold ? 'bold' : undefined,
              fontStyle: data.subheadline_italic ? 'italic' : undefined
            }}
          >
            {data.subheadline}
          </p>
        )}

        {/* Features */}
        {features.length > 0 && (
          <ul className={`space-y-2 mb-6 max-w-md mx-auto ${
            (data.content_text_align || 'left') === 'left' ? 'text-left' :
            (data.content_text_align || 'left') === 'right' ? 'text-right' :
            'text-center'
          }`}>
            {features.map((feature, index) => (
              <li key={index} className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span
                  className={`font-light ${getFontClass(data.content_font_family || 'Cormorant Garamond')}`}
                  style={{
                    fontSize: data.content_font_size || '1.125rem',
                    color: data.content_color || '#374151',
                    fontWeight: data.content_bold ? 'bold' : undefined,
                    fontStyle: data.content_italic ? 'italic' : undefined
                  }}
                >
                  {feature}
                </span>
              </li>
            ))}
          </ul>
        )}

        {/* Pricing Display - Discounted LEFT, Original RIGHT */}
        <div className={`flex items-center gap-4 mb-6 ${
          (data.price_text_align || 'center') === 'left' ? 'justify-start' :
          (data.price_text_align || 'center') === 'right' ? 'justify-end' :
          'justify-center'
        }`}>
          {/* Discounted Price */}
          <div
            className={`${getFontClass(data.price_font_family)}`}
            style={{
              fontSize: data.price_font_size || '2.5rem',
              color: data.price_color || data.headline_color || '#000000',
              fontWeight: data.price_bold ? 'bold' : undefined,
              fontStyle: data.price_italic ? 'italic' : undefined
            }}
          >
            {currencySymbol}{selectedPlan.discounted_price}
          </div>

          {/* Original Price (Strikethrough) */}
          {selectedPlan.original_price > selectedPlan.discounted_price && (
            <div
              className={`line-through ${getFontClass(data.price_font_family)}`}
              style={{
                fontSize: data.price_font_size ? `calc(${data.price_font_size} * 0.6)` : '1.5rem',
                color: data.subheadline_color || '#6b7280',
                fontWeight: data.price_bold ? 'bold' : undefined,
                fontStyle: data.price_italic ? 'italic' : undefined
              }}
            >
              {currencySymbol}{selectedPlan.original_price}
            </div>
          )}
        </div>

        {/* Plan Heading */}
        {data.plan_heading && (
          <h3
            className={`font-light tracking-[0.15em] uppercase mb-4 ${getFontClass(data.plan_heading_font_family || data.subheadline_font_family)} ${
              (data.plan_heading_text_align || 'center') === 'left' ? 'text-left' :
              (data.plan_heading_text_align || 'center') === 'right' ? 'text-right' :
              'text-center'
            }`}
            style={{
              fontSize: data.plan_heading_font_size || data.subheadline_font_size || '1.25rem',
              color: data.plan_heading_color || data.subheadline_color || '#000000',
              fontWeight: data.plan_heading_bold ? 'bold' : undefined,
              fontStyle: data.plan_heading_italic ? 'italic' : undefined
            }}
          >
            {data.plan_heading}
          </h3>
        )}

        {/* Plan Options - Radio Buttons */}
        {plans.length > 0 && (
          <div className="space-y-3 mb-6">
            {plans.map((plan, index) => (
              <div key={index}>
                <label
                  className={`relative flex items-center gap-3 p-4 border-2 cursor-pointer transition-all ${
                    selectedPlanIndex === index
                      ? 'border-black bg-gray-100'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedPlanIndex(index)}
                >
                  {/* Most Popular Badge */}
                  {plan.popular && (
                    <div className={`absolute -top-2.5 right-4 bg-black text-white text-xs px-3 py-1 rounded-full font-semibold tracking-wider ${getFontClass(data.plan_heading_font_family)}`}>
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
                  <span
                    className={`flex-1 ${getFontClass(data.plan_title_font_family || 'Cormorant Garamond')} ${
                      (data.plan_title_text_align || 'left') === 'left' ? 'text-left' :
                      (data.plan_title_text_align || 'left') === 'right' ? 'text-right' :
                      'text-center'
                    }`}
                    style={{
                      fontSize: data.plan_title_font_size || '1rem',
                      color: data.plan_title_color || '#1f2937',
                      fontWeight: data.plan_title_bold ? 'bold' : undefined,
                      fontStyle: data.plan_title_italic ? 'italic' : undefined
                    }}
                  >
                    {plan.title}
                  </span>
                </label>

                {/* Plan Content - Shows only when selected */}
                {selectedPlanIndex === index && plan.content && plan.content.length > 0 && (
                  <div className="mt-3 px-4">
                    <ul className={`space-y-2 ${
                      (data.plan_content_text_align || 'left') === 'left' ? 'text-left' :
                      (data.plan_content_text_align || 'left') === 'right' ? 'text-right' :
                      'text-center'
                    }`}>
                      {plan.content.map((contentItem, contentIndex) => (
                        <li key={contentIndex} className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                          <span
                            className={`${getFontClass(data.plan_content_font_family || 'Cormorant Garamond')}`}
                            style={{
                              fontSize: data.plan_content_font_size || '0.875rem',
                              color: data.plan_content_color || '#374151',
                              fontWeight: data.plan_content_bold ? 'bold' : undefined,
                              fontStyle: data.plan_content_italic ? 'italic' : undefined
                            }}
                          >
                            {contentItem}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* CTA Button */}
        {data.cta_text && (
          <div className="text-center">
            <button
              onClick={handleAddToCart}
              className={`w-full px-8 py-4 bg-black tracking-wider uppercase hover:bg-gray-800 transition-colors shadow-lg ${getFontClass(data.cta_font_family || data.headline_font_family)} ${
                (data.cta_text_align || 'center') === 'left' ? 'text-left' :
                (data.cta_text_align || 'center') === 'right' ? 'text-right' :
                'text-center'
              }`}
              style={{
                fontSize: data.cta_font_size || '0.875rem',
                color: data.cta_color || '#ffffff',
                fontWeight: data.cta_bold ? 'bold' : undefined,
                fontStyle: data.cta_italic ? 'italic' : undefined
              }}
            >
              {data.cta_text}
            </button>
            {/* Discount savings text below button */}
            {discountPercentage > 0 && (
              <p
                className={`mt-2 italic ${getFontClass(data.content_font_family || 'Cormorant Garamond')}`}
                style={{
                  fontSize: '0.875rem',
                  color: data.content_color || '#6b7280'
                }}
              >
                Save {discountPercentage}% vs single treatment
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
