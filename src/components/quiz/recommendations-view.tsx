'use client'

/**
 * Recommendations View Component
 * Displays personalized product recommendations with progressive offer strategy
 */

import { useState, useEffect } from 'react'
import {
  Loader2, Package, Sparkles, Check, ChevronDown, ChevronUp,
  Shield, Truck, Gift, Star, ArrowRight, Clock
} from 'lucide-react'

interface Booster {
  id: string
  title: string
  thumbnail?: string
  price: number
  concerns: string[]
  totalScore: number
  isPrimary: boolean
}

interface Product {
  id: string
  title: string
  thumbnail?: string
  price: number
  category: string
  boosters: Booster[]
}

interface Bundle {
  type: string
  title: string
  description: string
  discount: number
  products: Product[]
  originalPrice: number
  finalPrice: number
}

interface Recommendations {
  profile: {
    id: string
    skin_type: string
    age_group: string
    concerns: { name: string; category: string; severity: number; isPriority: boolean }[]
  }
  topBoosters: Booster[]
  fullRoutine: Bundle
  starterBundle: Bundle
  trialBundle: Bundle
  singleProduct: Bundle
  incentives: {
    freeShipping: boolean
    freeShippingThreshold: number
    moneyBackGuarantee: number
    bonusSamples: boolean
  }
}

interface RecommendationsViewProps {
  profileId: string
  onSelectBundle?: (bundle: Bundle) => void
}

export default function RecommendationsView({
  profileId,
  onSelectBundle
}: RecommendationsViewProps) {
  const [recommendations, setRecommendations] = useState<Recommendations | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedBundle, setExpandedBundle] = useState<string | null>('6_month')
  const [selectedBundle, setSelectedBundle] = useState<string | null>(null)

  useEffect(() => {
    generateRecommendations()
  }, [profileId])

  const generateRecommendations = async () => {
    try {
      const res = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId })
      })
      const data = await res.json()

      if (data.error) {
        setError(data.error)
      } else {
        setRecommendations(data.recommendations)
      }
    } catch (err) {
      setError('Failed to generate recommendations')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectBundle = (bundle: Bundle) => {
    setSelectedBundle(bundle.type)
    onSelectBundle?.(bundle)
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 animate-spin text-purple-500 mb-4" />
        <p className="text-white text-lg">Analyzing your skin profile...</p>
        <p className="text-slate-400 text-sm mt-2">Creating personalized recommendations</p>
      </div>
    )
  }

  if (error || !recommendations) {
    return (
      <div className="text-center py-20">
        <p className="text-red-400">{error || 'No recommendations available'}</p>
      </div>
    )
  }

  const bundles = [
    recommendations.fullRoutine,
    recommendations.starterBundle,
    recommendations.trialBundle,
    recommendations.singleProduct
  ].filter(b => b.products.length > 0)

  return (
    <div className="max-w-4xl mx-auto">
      {/* Profile Summary */}
      <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-2xl p-6 mb-8 border border-purple-500/30">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-400" />
          Your Personalized Results
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-slate-400">Skin Type</span>
            <p className="text-white font-medium capitalize">{recommendations.profile.skin_type}</p>
          </div>
          <div>
            <span className="text-slate-400">Age Group</span>
            <p className="text-white font-medium">{recommendations.profile.age_group}</p>
          </div>
          <div className="col-span-2">
            <span className="text-slate-400">Key Concerns</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {recommendations.profile.concerns
                .filter(c => c.isPriority)
                .slice(0, 5)
                .map((c, i) => (
                  <span key={i} className="px-2 py-0.5 bg-purple-500/30 rounded-full text-purple-300 text-xs">
                    {c.name}
                  </span>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Top Recommended Boosters */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-white mb-4">Top Boosters For You</h3>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {recommendations.topBoosters.map(booster => (
            <div
              key={booster.id}
              className="flex-shrink-0 w-40 bg-slate-800 rounded-xl p-3 border border-slate-700"
            >
              {booster.thumbnail ? (
                <img src={booster.thumbnail} alt="" className="w-full h-24 object-cover rounded-lg mb-2" />
              ) : (
                <div className="w-full h-24 bg-slate-700 rounded-lg mb-2 flex items-center justify-center">
                  <Package className="w-8 h-8 text-slate-500" />
                </div>
              )}
              <p className="text-sm font-medium text-white truncate">{booster.title}</p>
              <p className="text-xs text-purple-400 mt-1">
                {booster.concerns.slice(0, 2).join(', ')}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Bundle Options */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Choose Your Plan</h3>

        {bundles.map((bundle, index) => {
          const isExpanded = expandedBundle === bundle.type
          const isSelected = selectedBundle === bundle.type
          const isBestValue = index === 0

          return (
            <div
              key={bundle.type}
              className={`bg-slate-800 rounded-2xl border-2 transition-all overflow-hidden ${
                isSelected
                  ? 'border-purple-500 shadow-lg shadow-purple-500/20'
                  : isBestValue
                  ? 'border-purple-500/50'
                  : 'border-slate-700'
              }`}
            >
              {/* Bundle Header */}
              <div
                className="p-4 cursor-pointer"
                onClick={() => setExpandedBundle(isExpanded ? null : bundle.type)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isBestValue && (
                      <span className="px-2 py-1 bg-gradient-to-r from-purple-600 to-pink-500 rounded-full text-xs font-bold text-white">
                        BEST VALUE
                      </span>
                    )}
                    <div>
                      <h4 className="font-semibold text-white">{bundle.title}</h4>
                      <p className="text-sm text-slate-400">{bundle.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      {bundle.discount > 0 && (
                        <span className="text-sm text-slate-400 line-through">
                          ${bundle.originalPrice.toFixed(0)}
                        </span>
                      )}
                      <p className="text-xl font-bold text-white">${bundle.finalPrice.toFixed(0)}</p>
                      {bundle.discount > 0 && (
                        <span className="text-xs text-green-400">Save {bundle.discount}%</span>
                      )}
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-slate-700 pt-4">
                  {/* Products */}
                  <div className="space-y-3 mb-4">
                    {bundle.products.map(product => (
                      <div key={product.id} className="flex gap-3 bg-slate-700/50 rounded-lg p-3">
                        {product.thumbnail ? (
                          <img src={product.thumbnail} alt="" className="w-16 h-16 object-cover rounded" />
                        ) : (
                          <div className="w-16 h-16 bg-slate-600 rounded flex items-center justify-center">
                            <Package className="w-6 h-6 text-slate-400" />
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="font-medium text-white">{product.title}</p>
                          {product.boosters.length > 0 && (
                            <p className="text-xs text-purple-400 mt-1">
                              + {product.boosters.map(b => b.title).join(', ')}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* CTA Button */}
                  <button
                    onClick={() => handleSelectBundle(bundle)}
                    className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                      isSelected
                        ? 'bg-green-600 text-white'
                        : 'bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:from-purple-500 hover:to-pink-400'
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <Check className="w-5 h-5" />
                        Selected
                      </>
                    ) : (
                      <>
                        Select This Plan
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Incentives */}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 rounded-xl p-4 text-center">
          <Truck className="w-6 h-6 text-purple-400 mx-auto mb-2" />
          <p className="text-sm text-white font-medium">Free Shipping</p>
          <p className="text-xs text-slate-400">Over ${recommendations.incentives.freeShippingThreshold}</p>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 text-center">
          <Shield className="w-6 h-6 text-green-400 mx-auto mb-2" />
          <p className="text-sm text-white font-medium">{recommendations.incentives.moneyBackGuarantee}-Day Guarantee</p>
          <p className="text-xs text-slate-400">Risk-free trial</p>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 text-center">
          <Gift className="w-6 h-6 text-pink-400 mx-auto mb-2" />
          <p className="text-sm text-white font-medium">Bonus Samples</p>
          <p className="text-xs text-slate-400">With every order</p>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 text-center">
          <Clock className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
          <p className="text-sm text-white font-medium">Limited Offer</p>
          <p className="text-xs text-slate-400">Expires in 7 days</p>
        </div>
      </div>
    </div>
  )
}
