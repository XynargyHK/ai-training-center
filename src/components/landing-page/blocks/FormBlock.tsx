'use client'

import React, { useState } from 'react'
import { LandingPageBlock } from '@/types/landing-page-blocks'

interface FormBlockProps {
  block: LandingPageBlock
}

export default function FormBlock({ block }: FormBlockProps) {
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const data = block.data as {
    headline: string
    headline_font_size?: string
    headline_font_family?: string
    headline_color?: string
    headline_bold?: boolean
    headline_italic?: boolean
    headline_text_align?: 'left' | 'center' | 'right'
    
    subheadline: string
    subheadline_font_size?: string
    subheadline_font_family?: string
    subheadline_color?: string
    subheadline_bold?: boolean
    subheadline_italic?: boolean
    subheadline_text_align?: 'left' | 'center' | 'right'

    fields: Array<{
      id: string
      label: string
      placeholder: string
      type: 'text' | 'email' | 'tel' | 'textarea' | 'checkbox' | 'select'
      required: boolean
      options?: string[]
    }>

    submit_button_text: string
    submit_button_color?: string
    submit_button_text_color?: string
    
    success_message: string
    redirect_url?: string
    
    background_color?: string
    border_radius?: string
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    setIsSubmitting(false)
    setSubmitted(true)
    
    if (data.redirect_url) {
      setTimeout(() => {
        window.location.href = data.redirect_url!
      }, 2000)
    }
  }

  if (submitted) {
    return (
      <div 
        className="max-w-2xl mx-auto p-12 text-center animate-fade-in"
        style={{ 
          backgroundColor: data.background_color || '#ffffff',
          borderRadius: data.border_radius || '0.5rem'
        }}
      >
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl">
          ✓
        </div>
        <h3 className="text-2xl font-bold mb-4" style={{ fontFamily: data.headline_font_family || 'inherit' }}>
          {data.success_message || 'Thank you!'}
        </h3>
        {data.redirect_url && (
          <p className="text-gray-500 text-sm">Redirecting you now...</p>
        )}
      </div>
    )
  }

  return (
    <div 
      className="max-w-2xl mx-auto p-8 md:p-12 shadow-sm border border-gray-100"
      style={{ 
        backgroundColor: data.background_color || '#ffffff',
        borderRadius: data.border_radius || '0.5rem'
      }}
    >
      <div className="mb-8" style={{ textAlign: data.headline_text_align || 'center' }}>
        <h2 
          className="mb-4"
          style={{ 
            fontSize: data.headline_font_size || '2rem',
            fontFamily: data.headline_font_family || 'inherit',
            color: data.headline_color || '#000000',
            fontWeight: data.headline_bold ? 'bold' : 'normal',
            fontStyle: data.headline_italic ? 'italic' : 'normal'
          }}
        >
          {data.headline}
        </h2>
        {data.subheadline && (
          <p 
            style={{ 
              fontSize: data.subheadline_font_size || '1.125rem',
              fontFamily: data.subheadline_font_family || 'inherit',
              color: data.subheadline_color || '#4b5563',
              fontWeight: data.subheadline_bold ? 'bold' : 'normal',
              fontStyle: data.subheadline_italic ? 'italic' : 'normal'
            }}
          >
            {data.subheadline}
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {(data.fields || []).map((field) => (
          <div key={field.id} className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            
            {field.type === 'textarea' ? (
              <textarea
                required={field.required}
                placeholder={field.placeholder}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all"
              />
            ) : field.type === 'select' ? (
              <select
                required={field.required}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all bg-white"
              >
                <option value="">Select an option...</option>
                {(field.options || []).map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : field.type === 'checkbox' ? (
              <label className="flex items-center gap-3 cursor-pointer p-1">
                <input
                  type="checkbox"
                  required={field.required}
                  className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500"
                />
                <span className="text-sm text-gray-600">{field.placeholder}</span>
              </label>
            ) : (
              <input
                type={field.type}
                required={field.required}
                placeholder={field.placeholder}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all"
              />
            )}
          </div>
        ))}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 px-6 rounded-md font-bold text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:transform-none"
          style={{ 
            backgroundColor: data.submit_button_color || '#7c3aed',
          }}
        >
          {isSubmitting ? 'Submitting...' : data.submit_button_text || 'Submit'}
        </button>
      </form>
    </div>
  )
}
