'use client'

import { Plus, Trash2 } from 'lucide-react'
import type { LandingPageBlock } from '@/types/landing-page-blocks'
import UniversalTextEditor from '../UniversalTextEditor'
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

  const updatePlanContent = (planIndex: number, contentIndex: number, value: string) => {
    const plans = [...(block.data.plans || [])]
    const content = [...(plans[planIndex].content || [])]
    content[contentIndex] = value
    plans[planIndex] = { ...plans[planIndex], content }
    updateData('plans', plans)
  }

  const addPlanContent = (planIndex: number) => {
    const plans = [...(block.data.plans || [])]
    const content = [...(plans[planIndex].content || []), 'New content item']
    plans[planIndex] = { ...plans[planIndex], content }
    updateData('plans', plans)
  }

  const removePlanContent = (planIndex: number, contentIndex: number) => {
    const plans = [...(block.data.plans || [])]
    const content = [...(plans[planIndex].content || [])]
    content.splice(contentIndex, 1)
    plans[planIndex] = { ...plans[planIndex], content }
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
      {/* Headline */}
      <div>
        <UniversalTextEditor
          label="Headline"
          value={block.data.headline || ''}
          onChange={(value) => updateData('headline', value)}
          align={block.data.headline_text_align || 'center'}
          onAlignChange={(align) => updateData('headline_text_align', align)}
          bold={block.data.headline_bold || false}
          onBoldChange={(bold) => updateData('headline_bold', bold)}
          italic={block.data.headline_italic || false}
          onItalicChange={(italic) => updateData('headline_italic', italic)}
          fontSize={block.data.headline_font_size || '1.5rem'}
          onFontSizeChange={(size) => updateData('headline_font_size', size)}
          fontFamily={block.data.headline_font_family || 'Josefin Sans'}
          onFontFamilyChange={(family) => updateData('headline_font_family', family)}
          color={block.data.headline_color || '#000000'}
          onColorChange={(color) => updateData('headline_color', color)}
          placeholder="Main headline"
        />
      </div>

      {/* Subheadline */}
      <div>
        <UniversalTextEditor
          label="Subheadline"
          value={block.data.subheadline || ''}
          onChange={(value) => updateData('subheadline', value)}
          align={block.data.subheadline_text_align || 'center'}
          onAlignChange={(align) => updateData('subheadline_text_align', align)}
          bold={block.data.subheadline_bold || false}
          onBoldChange={(bold) => updateData('subheadline_bold', bold)}
          italic={block.data.subheadline_italic || false}
          onItalicChange={(italic) => updateData('subheadline_italic', italic)}
          fontSize={block.data.subheadline_font_size || '1.25rem'}
          onFontSizeChange={(size) => updateData('subheadline_font_size', size)}
          fontFamily={block.data.subheadline_font_family || 'Josefin Sans'}
          onFontFamilyChange={(family) => updateData('subheadline_font_family', family)}
          color={block.data.subheadline_color || '#000000'}
          onColorChange={(color) => updateData('subheadline_color', color)}
          placeholder="Optional subheadline"
        />
      </div>

      {/* Features */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-300">Features</label>
            <TextEditorControls
              label=""
              value=""
              onChange={() => {}}
              hideTextInput
              textAlign={block.data.content_text_align}
              onTextAlignChange={(align) => updateData('content_text_align', align)}
              bold={block.data.content_bold}
              onBoldChange={(bold) => updateData('content_bold', bold)}
              italic={block.data.content_italic}
              onItalicChange={(italic) => updateData('content_italic', italic)}
              fontSize={block.data.content_font_size}
              onFontSizeChange={(size) => updateData('content_font_size', size)}
              fontFamily={block.data.content_font_family}
              onFontFamilyChange={(family) => updateData('content_font_family', family)}
              color={block.data.content_color}
              onColorChange={(color) => updateData('content_color', color)}
            />
          </div>
          <button
            onClick={addFeature}
            className="flex items-center gap-1 text-sm text-violet-400 hover:text-violet-300"
          >
            <Plus className="w-4 h-4" />
            Add Feature
          </button>
        </div>

        <div className="space-y-2">
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
      </div>

      {/* Plan Heading */}
      <div>
        <UniversalTextEditor
          label="Plan Heading"
          value={block.data.plan_heading || ''}
          onChange={(value) => updateData('plan_heading', value)}
          align={block.data.plan_heading_text_align || 'center'}
          onAlignChange={(align) => updateData('plan_heading_text_align', align)}
          bold={block.data.plan_heading_bold || false}
          onBoldChange={(bold) => updateData('plan_heading_bold', bold)}
          italic={block.data.plan_heading_italic || false}
          onItalicChange={(italic) => updateData('plan_heading_italic', italic)}
          fontSize={block.data.plan_heading_font_size || '1.25rem'}
          onFontSizeChange={(size) => updateData('plan_heading_font_size', size)}
          fontFamily={block.data.plan_heading_font_family || 'Josefin Sans'}
          onFontFamilyChange={(family) => updateData('plan_heading_font_family', family)}
          color={block.data.plan_heading_color || '#000000'}
          onColorChange={(color) => updateData('plan_heading_color', color)}
          placeholder="e.g., Choose Your Subscription Plan"
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

        {/* Price Display Styling */}
        <div className="mb-3">
          <TextEditorControls
            label="Price Display"
            value=""
            onChange={() => {}}
            hideTextInput
            textAlign={block.data.price_text_align}
            onTextAlignChange={(align) => updateData('price_text_align', align)}
            bold={block.data.price_bold}
            onBoldChange={(bold) => updateData('price_bold', bold)}
            italic={block.data.price_italic}
            onItalicChange={(italic) => updateData('price_italic', italic)}
            fontSize={block.data.price_font_size}
            onFontSizeChange={(size) => updateData('price_font_size', size)}
            fontFamily={block.data.price_font_family}
            onFontFamilyChange={(family) => updateData('price_font_family', family)}
            color={block.data.price_color}
            onColorChange={(color) => updateData('price_color', color)}
          />
        </div>

        {/* Plan Title Text Styling */}
        <div className="mb-3">
          <TextEditorControls
            label="Plan Title Text"
            value=""
            onChange={() => {}}
            hideTextInput
            textAlign={block.data.plan_title_text_align}
            onTextAlignChange={(align) => updateData('plan_title_text_align', align)}
            bold={block.data.plan_title_bold}
            onBoldChange={(bold) => updateData('plan_title_bold', bold)}
            italic={block.data.plan_title_italic}
            onItalicChange={(italic) => updateData('plan_title_italic', italic)}
            fontSize={block.data.plan_title_font_size}
            onFontSizeChange={(size) => updateData('plan_title_font_size', size)}
            fontFamily={block.data.plan_title_font_family}
            onFontFamilyChange={(family) => updateData('plan_title_font_family', family)}
            color={block.data.plan_title_color}
            onColorChange={(color) => updateData('plan_title_color', color)}
          />
        </div>

        {/* Plan Content Text Styling */}
        <div className="mb-3">
          <TextEditorControls
            label="Plan Content Text"
            value=""
            onChange={() => {}}
            hideTextInput
            textAlign={block.data.plan_content_text_align}
            onTextAlignChange={(align) => updateData('plan_content_text_align', align)}
            bold={block.data.plan_content_bold}
            onBoldChange={(bold) => updateData('plan_content_bold', bold)}
            italic={block.data.plan_content_italic}
            onItalicChange={(italic) => updateData('plan_content_italic', italic)}
            fontSize={block.data.plan_content_font_size}
            onFontSizeChange={(size) => updateData('plan_content_font_size', size)}
            fontFamily={block.data.plan_content_font_family}
            onFontFamilyChange={(family) => updateData('plan_content_font_family', family)}
            color={block.data.plan_content_color}
            onColorChange={(color) => updateData('plan_content_color', color)}
          />
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

                {/* Plan Content */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs text-slate-400">Plan Content (shows when plan is selected)</label>
                    <button
                      onClick={() => addPlanContent(index)}
                      className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300"
                    >
                      <Plus className="w-3 h-3" />
                      Add Content
                    </button>
                  </div>
                  <div className="space-y-2">
                    {(plan.content || []).map((contentItem: string, contentIndex: number) => (
                      <div key={contentIndex} className="flex gap-2">
                        <input
                          type="text"
                          value={contentItem}
                          onChange={(e) => updatePlanContent(index, contentIndex, e.target.value)}
                          className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-xs"
                          placeholder="Content item"
                        />
                        <button
                          onClick={() => removePlanContent(index, contentIndex)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Product ID */}
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Product ID (optional)</label>
                  <input
                    type="text"
                    value={plan.product_id || ''}
                    onChange={(e) => updatePlan(index, 'product_id', e.target.value)}
                    placeholder="Product UUID from database"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm font-mono text-xs"
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

                {/* Popular checkbox */}
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={plan.popular === true}
                      onChange={(e) => updatePlan(index, 'popular', e.target.checked)}
                      className="w-4 h-4 rounded border-slate-600 text-violet-600 focus:ring-violet-500"
                    />
                    <span className="text-xs text-slate-400">Mark as "Most Popular"</span>
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Text */}
      <div>
        <UniversalTextEditor
          label="CTA Button Text"
          value={block.data.cta_text || ''}
          onChange={(value) => updateData('cta_text', value)}
          align={block.data.cta_text_align || 'center'}
          onAlignChange={(align) => updateData('cta_text_align', align)}
          bold={block.data.cta_bold || false}
          onBoldChange={(bold) => updateData('cta_bold', bold)}
          italic={block.data.cta_italic || false}
          onItalicChange={(italic) => updateData('cta_italic', italic)}
          fontSize={block.data.cta_font_size || '0.875rem'}
          onFontSizeChange={(size) => updateData('cta_font_size', size)}
          fontFamily={block.data.cta_font_family || 'Josefin Sans'}
          onFontFamilyChange={(family) => updateData('cta_font_family', family)}
          color={block.data.cta_color || '#ffffff'}
          onColorChange={(color) => updateData('cta_color', color)}
          placeholder="Subscribe & SAVE"
        />
        <p className="text-xs text-slate-400 mt-1">The discount % will be auto-calculated and shown below the button</p>
      </div>
    </div>
  )
}
