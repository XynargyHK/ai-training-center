'use client'

import React, { useState, useRef, useEffect } from 'react'
import { LandingPageBlock } from '@/types/landing-page-blocks'

interface FormBlockProps {
  block: LandingPageBlock
}

function SignaturePad({ placeholder }: { placeholder: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSigned, setHasSigned] = useState(false)

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    
    const rect = canvas.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY
    
    // Adjust for canvas scaling
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    }
  }

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { x, y } = getCoordinates(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
    setIsDrawing(true)
    setHasSigned(true)
  }

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { x, y } = getCoordinates(e)
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clear = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasSigned(false)
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#000000'
  }, [])

  return (
    <div className="space-y-2">
      <div className="relative bg-white border border-gray-300 rounded-md overflow-hidden" style={{ height: '160px' }}>
        <canvas
          ref={canvasRef}
          width={800}
          height={160}
          className="w-full h-full cursor-crosshair touch-none"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        <button
          type="button"
          onClick={clear}
          className="absolute top-2 right-2 px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-500 text-[10px] rounded border border-gray-200 transition-colors"
        >
          Clear
        </button>
        {!hasSigned && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-gray-300 text-sm italic">{placeholder || 'Please sign here'}</span>
          </div>
        )}
      </div>
      <p className="text-[10px] text-gray-400 text-center italic">Use your mouse or touch screen to sign</p>
    </div>
  )
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

    content: string
    content_font_size?: string
    content_font_family?: string
    content_color?: string
    content_bold?: boolean
    content_italic?: boolean
    content_text_align?: 'left' | 'center' | 'right'

    fields: Array<{
      id: string
      label: string
      placeholder: string
      type: 'text' | 'email' | 'tel' | 'textarea' | 'checkbox' | 'select' | 'number' | 'date' | 'time' | 'url' | 'signature'
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
        {data.content && (
          <div 
            className="mt-4 form-rich-content"
            style={{ 
              fontSize: data.content_font_size || '0.875rem',
              fontFamily: data.content_font_family || 'inherit',
              color: data.content_color || '#6b7280',
              fontWeight: data.content_bold ? 'bold' : 'normal',
              fontStyle: data.content_italic ? 'italic' : 'normal',
              textAlign: data.content_text_align || 'center'
            }}
            dangerouslySetInnerHTML={{ __html: data.content }}
          />
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
            ) : field.type === 'signature' ? (
              <SignaturePad placeholder={field.placeholder} />
            ) : (
              <input
                type={field.type}
                required={field.required}
                placeholder={field.placeholder}
                defaultValue={field.type === 'date' ? new Date().toISOString().split('T')[0] : undefined}
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

      {/* Rich text content styles */}
      <style jsx global>{`
        .form-rich-content ul {
          list-style-type: disc;
          margin-left: 1.5rem;
          padding-left: 0.5rem;
          margin-bottom: 0.5rem;
        }
        .form-rich-content ol {
          list-style-type: decimal;
          margin-left: 1.5rem;
          padding-left: 0.5rem;
          margin-bottom: 0.5rem;
        }
        .form-rich-content li {
          margin-bottom: 0.25rem;
        }
        .form-rich-content p {
          margin-bottom: 0.5rem;
        }
        /* Preserve text color while allowing bold/italic */
        .form-rich-content span[style*="color"] {
          color: inherit !important;
        }
      `}</style>
    </div>
  )
}
