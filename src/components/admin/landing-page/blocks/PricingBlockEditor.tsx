'use client'

import { Plus, Trash2 } from 'lucide-react'
import type { LandingPageBlock } from '@/types/landing-page-blocks'
import TextEditorControls from '../TextEditorControls'

interface PricingBlockEditorProps {
  block: LandingPageBlock
  onUpdate: (block: LandingPageBlock) => void
}

export default function PricingBlockEditor({ block, onUpdate }: PricingBlockEditorProps) {
  const updateData = (key: string, value: any) => {
    onUpdate({
      ...block,
      data: {
        ...block.data,
        [key]: value
      }
    })
  }

  const updatePlan = (index: number, key: string, value: any) => {
    const plans = [...(block.data.plans || [])]
    plans[index] = { ...plans[index], [key]: value }
    updateData('plans', plans)
  }

  const addPlan = () => {
    const plans = [...(block.data.plans || [])]
    plans.push({
      title: 'New Plan',
      original_price: 100,
      discounted_price: 80
    })
    updateData('plans', plans)
  }

  const removePlan = (index: number) => {
    const plans = [...(block.data.plans || [])]
    plans.splice(index, 1)
    updateData('plans', plans)
  }

  const updateFeature = (index: number, value: string) => {
    const features = [...(block.data.features || [])]
    features[index] = value
    updateData('features', features)
  }

  const addFeature = () => {
    const features = [...(block.data.features || []), 'New Feature']
    updateData('features', features)
  }

  const removeFeature = (index: number) => {
    const features = [...(block.data.features || [])]
    features.splice(index, 1)
    updateData('features', features)
  }

  return (
    <div className="space-y-6">
      {/* Product Name */}
      <div>
        <TextEditorControls
          label="Product Name"
          value={block.data.product_name || ''}
          onChange={(value) => updateData('product_name', value)}
          fontSize={block.data.product_name_font_size}
          onFontSizeChange={(size) => updateData('product_name_font_size', size)}
          fontFamily={block.data.product_name_font_family}
          onFontFamilyChange={(family) => updateData('product_name_font_family', family)}
          color={block.data.product_name_color}
          onColorChange={(color) => updateData('product_name_color', color)}
        />
      </div>

      {/* Features */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <label className="text-sm font-medium text-slate-300">Features</label>
          <button
            onClick={addFeature}
            className="flex items-center gap-1 text-sm text-violet-400 hover:text-violet-300"
          >
            <Plus className="w-4 h-4" />
            Add Feature
          </button>
        </div>

        <div className="space-y-2 mb-3">
          {(block.data.features || []).map((feature: string, index: number) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={feature}
                onChange={(e) => updateFeature(index, e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                placeholder="Feature description"
              />
              <button
                onClick={() => removeFeature(index)}
                className="text-red-400 hover:text-red-300"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Font Size</label>
            <input
              type="text"
              value={block.data.features_font_size || '1rem'}
              onChange={(e) => updateData('features_font_size', e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Color</label>
            <input
              type="color"
              value={block.data.features_color || '#374151'}
              onChange={(e) => updateData('features_color', e.target.value)}
              className="w-full h-10 rounded cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Plan Heading */}
      <div>
        <TextEditorControls
          label="Plan Heading"
          value={block.data.plan_heading || ''}
          onChange={(value) => updateData('plan_heading', value)}
          fontSize={block.data.plan_heading_font_size}
          onFontSizeChange={(size) => updateData('plan_heading_font_size', size)}
          fontFamily={block.data.plan_heading_font_family}
          onFontFamilyChange={(family) => updateData('plan_heading_font_family', family)}
          color={block.data.plan_heading_color}
          onColorChange={(color) => updateData('plan_heading_color', color)}
        />
      </div>

      {/* Currency Symbol */}
      <div>
        <label className="block text-sm text-slate-300 mb-2">Currency Symbol</label>
        <input
          type="text"
          value={block.data.currency_symbol || '$'}
          onChange={(e) => updateData('currency_symbol', e.target.value)}
          className="w-24 px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
        />
      </div>

      {/* Plans */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <label className="text-sm font-medium text-slate-300">Plan Options</label>
          <button
            onClick={addPlan}
            className="flex items-center gap-1 text-sm text-violet-400 hover:text-violet-300"
          >
            <Plus className="w-4 h-4" />
            Add Plan
          </button>
        </div>

        <div className="space-y-3">
          {(block.data.plans || []).map((plan: any, index: number) => (
            <div key={index} className="bg-slate-800/50 rounded-lg p-4 border border-slate-600">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-medium text-slate-300">Plan {index + 1}</span>
                {(block.data.plans || []).length > 1 && (
                  <button
                    onClick={() => removePlan(index)}
                    className="text-red-400 hover:text-red-300"
                    title="Delete plan"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {/* Title */}
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Plan Title</label>
                  <input
                    type="text"
                    value={plan.title || ''}
                    onChange={(e) => updatePlan(index, 'title', e.target.value)}
                    placeholder="e.g., 1 Month (2 Treatments)"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                  />
                </div>

                {/* Prices */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Original Price</label>
                    <input
                      type="number"
                      value={plan.original_price || 0}
                      onChange={(e) => updatePlan(index, 'original_price', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Discounted Price</label>
                    <input
                      type="number"
                      value={plan.discounted_price || 0}
                      onChange={(e) => updatePlan(index, 'discounted_price', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Text */}
      <div>
        <label className="block text-sm text-slate-300 mb-2">CTA Button Text</label>
        <input
          type="text"
          value={block.data.cta_text || ''}
          onChange={(e) => updateData('cta_text', e.target.value)}
          placeholder="Buy Now & SAVE"
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
        />
        <p className="text-xs text-slate-400 mt-1">The discount % will be auto-calculated</p>
      </div>

      {/* Background Color */}
      <div>
        <label className="block text-sm text-slate-300 mb-2">Background Color</label>
        <input
          type="color"
          value={block.data.background_color || '#ffffff'}
          onChange={(e) => updateData('background_color', e.target.value)}
          className="w-full h-10 rounded cursor-pointer"
        />
      </div>
    </div>
  )
}
