'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Star } from 'lucide-react'
import { getFontClass } from '@/lib/fonts'

interface Testimonial {
  image_url: string
  name: string
  age?: string
  location?: string
  rating: number
  benefits: string[]
  content: string
}

interface TestimonialsBlockData {
  heading_font_size?: string
  heading_font_family?: string
  heading_color?: string
  heading_align?: 'left' | 'center' | 'right'
  heading_bold?: boolean
  heading_italic?: boolean
  testimonials: Testimonial[]
  background_color?: string
  autoplay?: boolean
  autoplay_interval?: number
}

interface TestimonialsBlockProps {
  data: TestimonialsBlockData
  heading?: string
}

export default function TestimonialsBlock({ data, heading = '' }: TestimonialsBlockProps) {
  const {
    heading_font_size = '2.5rem',
    heading_font_family = 'Josefin Sans',
    heading_color = '#000000',
    heading_align = 'center',
    heading_bold = false,
    heading_italic = false,
    testimonials = [],
    background_color = '#ffffff',
    autoplay = false,
    autoplay_interval = 5000
  } = data

  const [currentIndex, setCurrentIndex] = useState(0)

  // Auto-advance carousel
  useEffect(() => {
    if (!autoplay || testimonials.length <= 1) return

    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % testimonials.length)
    }, autoplay_interval)

    return () => clearInterval(interval)
  }, [autoplay, autoplay_interval, testimonials.length])

  const goToPrevious = () => {
    setCurrentIndex(prev => (prev - 1 + testimonials.length) % testimonials.length)
  }

  const goToNext = () => {
    setCurrentIndex(prev => (prev + 1) % testimonials.length)
  }

  if (!testimonials || testimonials.length === 0) {
    return null
  }

  return (
    <section
      className="py-16 px-4"
      style={{ backgroundColor: background_color }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Heading */}
        {heading && (
          <h2
            className={`font-light tracking-[0.2em] uppercase leading-tight mb-12 ${getFontClass(heading_font_family)}`}
            style={{
              fontSize: heading_font_size,
              color: heading_color,
              textAlign: heading_align,
              fontWeight: heading_bold ? 'bold' : undefined,
              fontStyle: heading_italic ? 'italic' : undefined
            }}
          >
            {heading}
          </h2>
        )}

        {/* Carousel Container */}
        <div className="relative">
          {/* Navigation Buttons */}
          {testimonials.length > 1 && (
            <>
              <button
                onClick={goToPrevious}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-12 z-10 bg-black text-white p-3 rounded-full hover:bg-gray-800 transition-colors shadow-lg"
                aria-label="Previous testimonial"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              <button
                onClick={goToNext}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-12 z-10 bg-black text-white p-3 rounded-full hover:bg-gray-800 transition-colors shadow-lg"
                aria-label="Next testimonial"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          {/* Testimonial Cards */}
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {testimonials.map((testimonial, index) => (
                <div
                  key={index}
                  className="w-full flex-shrink-0 px-4"
                >
                  <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-xl p-8 md:p-12">
                    {/* Large Before/After Image */}
                    <div className="mb-8">
                      {testimonial.image_url ? (
                        <img
                          src={testimonial.image_url}
                          alt={`${testimonial.name} - Before and After`}
                          className="w-full h-auto max-w-2xl mx-auto rounded-lg shadow-2xl"
                        />
                      ) : (
                        <div className="w-full aspect-square max-w-2xl mx-auto bg-gray-200 rounded-lg flex items-center justify-center">
                          <span className="text-gray-400">No image</span>
                        </div>
                      )}
                    </div>

                    {/* Stars */}
                    <div className="flex items-center justify-center gap-1 mb-3">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-6 h-6 ${
                            i < testimonial.rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'fill-gray-300 text-gray-300'
                          }`}
                        />
                      ))}
                    </div>

                    {/* Verified Badge */}
                    <p className={`text-sm font-bold tracking-wider uppercase text-gray-600 mb-2 text-center ${getFontClass('Josefin Sans')}`}>
                      Verified Customer
                    </p>

                    {/* Customer Name, Age, Location */}
                    <p className={`text-lg font-light text-gray-900 mb-6 text-center ${getFontClass('Cormorant Garamond')}`}>
                      {testimonial.name}
                      {testimonial.age && `, ${testimonial.age}`}
                      {testimonial.location && ` — ${testimonial.location}`}
                    </p>

                    {/* Benefits List */}
                    {testimonial.benefits && testimonial.benefits.length > 0 && (
                      <ul className="space-y-2 mb-6">
                        {testimonial.benefits.map((benefit, i) => (
                          <li
                            key={i}
                            className={`text-sm font-light text-gray-700 ${getFontClass('Cormorant Garamond')}`}
                          >
                            • {benefit}
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* Testimonial Content (Quote) */}
                    {testimonial.content && (
                      <blockquote className={`text-base md:text-lg font-light text-gray-800 leading-relaxed italic border-l-4 border-black pl-4 ${getFontClass('Cormorant Garamond')}`}>
                        "{testimonial.content}"
                      </blockquote>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dots Indicator */}
          {testimonials.length > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentIndex ? 'bg-black' : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
