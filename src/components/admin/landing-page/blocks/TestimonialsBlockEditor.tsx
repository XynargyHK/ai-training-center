'use client'

import { Plus, Trash2, Upload } from 'lucide-react'
import type { LandingPageBlock } from '@/types/landing-page-blocks'
import TextEditorControls from '../TextEditorControls'
import { useState } from 'react'

interface TestimonialsBlockEditorProps {
  block: LandingPageBlock
  onUpdate: (block: LandingPageBlock) => void
  businessUnitId?: string
}

export default function TestimonialsBlockEditor({ block, onUpdate, businessUnitId }: TestimonialsBlockEditorProps) {
  const [expandedTestimonial, setExpandedTestimonial] = useState<number | null>(0)

  const updateData = (key: string, value: any) => {
    onUpdate({
      ...block,
      data: {
        ...block.data,
        [key]: value
      }
    })
  }

  const updateTestimonial = (index: number, key: string, value: any) => {
    const testimonials = [...(block.data.testimonials || [])]
    testimonials[index] = { ...testimonials[index], [key]: value }
    updateData('testimonials', testimonials)
  }

  const updateBenefit = (testimonialIndex: number, benefitIndex: number, value: string) => {
    const testimonials = [...(block.data.testimonials || [])]
    const benefits = [...(testimonials[testimonialIndex].benefits || [])]
    benefits[benefitIndex] = value
    testimonials[testimonialIndex] = { ...testimonials[testimonialIndex], benefits }
    updateData('testimonials', testimonials)
  }

  const addBenefit = (testimonialIndex: number) => {
    const testimonials = [...(block.data.testimonials || [])]
    const benefits = [...(testimonials[testimonialIndex].benefits || []), 'New benefit']
    testimonials[testimonialIndex] = { ...testimonials[testimonialIndex], benefits }
    updateData('testimonials', testimonials)
  }

  const removeBenefit = (testimonialIndex: number, benefitIndex: number) => {
    const testimonials = [...(block.data.testimonials || [])]
    const benefits = [...(testimonials[testimonialIndex].benefits || [])]
    benefits.splice(benefitIndex, 1)
    testimonials[testimonialIndex] = { ...testimonials[testimonialIndex], benefits }
    updateData('testimonials', testimonials)
  }

  const addTestimonial = () => {
    const testimonials = [...(block.data.testimonials || [])]
    testimonials.push({
      image_url: '',
      name: 'Customer Name',
      age: '',
      location: '',
      rating: 5,
      benefits: ['New benefit'],
      content: 'Customer testimonial quote...'
    })
    updateData('testimonials', testimonials)
    setExpandedTestimonial(testimonials.length - 1)
  }

  const removeTestimonial = (index: number) => {
    const testimonials = [...(block.data.testimonials || [])]
    testimonials.splice(index, 1)
    updateData('testimonials', testimonials)
    if (expandedTestimonial === index) {
      setExpandedTestimonial(testimonials.length > 0 ? 0 : null)
    }
  }

  const handleImageUpload = async (testimonialIndex: number, file: File) => {
    if (!businessUnitId) {
      alert('Business Unit ID is required for upload')
      return
    }

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('businessUnit', businessUnitId)

      const response = await fetch('/api/media-library', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const data = await response.json()
      updateTestimonial(testimonialIndex, 'image_url', data.file.url)
    } catch (error) {
      console.error('Error uploading image:', error)
      alert(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return (
    <div className="space-y-3">
      {/* Carousel Settings */}
      <div className="space-y-3">
        <label className="text-xs font-medium text-gray-600 block">Carousel Settings</label>
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={block.data.autoplay || false}
            onChange={(e) => updateData('autoplay', e.target.checked)}
            className="w-4 h-4"
          />
          <span className="text-sm text-gray-500">Auto-advance carousel</span>
        </div>
        {block.data.autoplay && (
          <div>
            <label className="text-xs text-gray-500 block mb-1">Interval (seconds)</label>
            <input
              type="number"
              min="3"
              max="10"
              value={(block.data.autoplay_interval || 5000) / 1000}
              onChange={(e) => updateData('autoplay_interval', parseInt(e.target.value) * 1000)}
              className="w-24 px-2 py-1.5 bg-gray-100 border border-gray-200 rounded-none text-gray-800 text-xs"
            />
          </div>
        )}
      </div>

      {/* Testimonials */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <label className="text-xs font-medium text-gray-600">Testimonials</label>
          <button
            onClick={addTestimonial}
            className="flex items-center gap-1 text-sm text-violet-600 hover:text-violet-600"
          >
            <Plus className="w-4 h-4" />
            Add Testimonial
          </button>
        </div>

        <div className="space-y-3">
          {(block.data.testimonials || []).map((testimonial: any, testimonialIndex: number) => (
            <div key={testimonialIndex} className="bg-gray-50 border border-gray-200 rounded-none overflow-hidden">
              {/* Testimonial Header */}
              <div className="w-full px-2 py-1.5 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <button
                  onClick={() => setExpandedTestimonial(expandedTestimonial === testimonialIndex ? null : testimonialIndex)}
                  className="flex items-center gap-3 flex-1 text-left"
                >
                  {testimonial.image_url ? (
                    <img
                      src={testimonial.image_url}
                      alt={testimonial.name}
                      className="w-10 h-10 object-cover rounded-none"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-100 flex items-center justify-center text-gray-500 text-xs rounded-none">
                      No img
                    </div>
                  )}
                  <div className="text-left">
                    <div className="text-sm font-medium text-gray-800">{testimonial.name || 'Unnamed'}</div>
                    <div className="text-xs text-gray-500">
                      {testimonial.age && `${testimonial.age}`}
                      {testimonial.location && ` — ${testimonial.location}`}
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => removeTestimonial(testimonialIndex)}
                  className="text-red-600 hover:text-red-600 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Testimonial Details (Expanded) */}
              {expandedTestimonial === testimonialIndex && (
                <div className="px-4 pb-4 space-y-4 border-t border-gray-200 pt-4">
                  {/* Before/After Image Upload */}
                  <div>
                    <label className="text-xs text-gray-500 block mb-2">Before/After Image (Square)</label>
                    <div className="flex items-start gap-3">
                      {/* Image Preview or Placeholder */}
                      <div className="relative">
                        {testimonial.image_url ? (
                          <>
                            <img
                              src={testimonial.image_url}
                              alt="Preview"
                              className="w-32 h-32 object-cover border-2 border-gray-200 rounded-none"
                            />
                            {/* Remove Image Button */}
                            <button
                              onClick={() => updateTestimonial(testimonialIndex, 'image_url', '')}
                              className="absolute -top-2 -right-2 w-6 h-6 bg-red-50 hover:bg-red-50 border border-red-200 text-gray-800 rounded-full flex items-center justify-center transition-colors shadow-sm"
                              title="Remove image"
                            >
                              ✕
                            </button>
                          </>
                        ) : (
                          <div className="w-32 h-32 bg-gray-100 border-2 border-gray-200 flex items-center justify-center rounded-none">
                            <span className="text-gray-400 text-xs text-center">No image</span>
                          </div>
                        )}
                      </div>

                      {/* Upload Button */}
                      <div className="flex-1">
                        <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-none text-sm text-gray-800 transition-colors">
                          <Upload className="w-4 h-4" />
                          Upload Image
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) handleImageUpload(testimonialIndex, file)
                            }}
                            className="hidden"
                          />
                        </label>
                        <p className="text-xs text-gray-400 mt-2">Upload a square image showing before and after transformation</p>
                      </div>
                    </div>
                  </div>

                  {/* Name */}
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Name</label>
                    <input
                      type="text"
                      value={testimonial.name || ''}
                      onChange={(e) => updateTestimonial(testimonialIndex, 'name', e.target.value)}
                      className="w-full px-2 py-1.5 bg-gray-100 border border-gray-200 rounded-none text-gray-800 text-xs"
                      placeholder="Emily R."
                    />
                  </div>

                  {/* Age & Location */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Age</label>
                      <input
                        type="text"
                        value={testimonial.age || ''}
                        onChange={(e) => updateTestimonial(testimonialIndex, 'age', e.target.value)}
                        className="w-full px-2 py-1.5 bg-gray-100 border border-gray-200 rounded-none text-gray-800 text-xs"
                        placeholder="28"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Location</label>
                      <input
                        type="text"
                        value={testimonial.location || ''}
                        onChange={(e) => updateTestimonial(testimonialIndex, 'location', e.target.value)}
                        className="w-full px-2 py-1.5 bg-gray-100 border border-gray-200 rounded-none text-gray-800 text-xs"
                        placeholder="California"
                      />
                    </div>
                  </div>

                  {/* Rating */}
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Rating</label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => updateTestimonial(testimonialIndex, 'rating', star)}
                          className={`text-2xl ${
                            star <= (testimonial.rating || 5)
                              ? 'text-yellow-600'
                              : 'text-gray-400'
                          } hover:scale-110 transition-transform`}
                        >
                          ⭐
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Benefits */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-xs text-gray-500">Benefits</label>
                      <button
                        onClick={() => addBenefit(testimonialIndex)}
                        className="text-xs text-violet-600 hover:text-violet-600"
                      >
                        + Add Benefit
                      </button>
                    </div>
                    <div className="space-y-2">
                      {(testimonial.benefits || []).map((benefit: string, benefitIndex: number) => (
                        <div key={benefitIndex} className="flex gap-2">
                          <input
                            type="text"
                            value={benefit}
                            onChange={(e) => updateBenefit(testimonialIndex, benefitIndex, e.target.value)}
                            className="flex-1 px-2 py-1.5 bg-gray-100 border border-gray-200 rounded-none text-gray-800 text-xs"
                            placeholder="Benefit description"
                          />
                          <button
                            onClick={() => removeBenefit(testimonialIndex, benefitIndex)}
                            className="text-red-600 hover:text-red-600 p-2"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Testimonial Content (Quote) */}
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Testimonial Quote</label>
                    <textarea
                      value={testimonial.content || ''}
                      onChange={(e) => updateTestimonial(testimonialIndex, 'content', e.target.value)}
                      rows={4}
                      className="w-full px-2 py-1.5 bg-gray-100 border border-gray-200 rounded-none text-gray-800 text-xs resize-none"
                      placeholder="Customer testimonial quote..."
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
