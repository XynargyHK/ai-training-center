'use client'

import { useState } from 'react'
import { Plus, Trash2, Image, Upload, Loader2, X } from 'lucide-react'
import type { LandingPageBlock } from '@/types/landing-page-blocks'

interface CardBlockEditorProps {
  block: LandingPageBlock
  onUpdate: (block: LandingPageBlock) => void
}

export default function CardBlockEditor({ block, onUpdate }: CardBlockEditorProps) {
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null)
  const data = block.data as {
    layout: string
    cards: Array<{
      image_url: string
      title: string
      content: string
      rating: number
      badge: string
      author: string
    }>
  }

  const updateCard = (index: number, updates: any) => {
    const newCards = [...data.cards]
    newCards[index] = { ...newCards[index], ...updates }
    onUpdate({
      ...block,
      data: { ...data, cards: newCards }
    })
  }

  const addCard = () => {
    onUpdate({
      ...block,
      data: {
        ...data,
        cards: [
          ...data.cards,
          {
            image_url: '',
            title: '',
            content: '',
            rating: 5,
            badge: 'Verified Customer',
            author: ''
          }
        ]
      }
    })
  }

  const deleteCard = (index: number) => {
    onUpdate({
      ...block,
      data: {
        ...data,
        cards: data.cards.filter((_, i) => i !== index)
      }
    })
  }

  const handleImageUpload = async (index: number, file: File) => {
    setUploadingIndex(index)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/media-library/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) throw new Error('Upload failed')

      const result = await response.json()
      updateCard(index, { image_url: result.url })
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload image')
    } finally {
      setUploadingIndex(null)
    }
  }

  return (
    <div className="space-y-4">
      {data.cards.map((card, index) => (
        <div key={index} className="bg-slate-800/50 rounded-lg p-4 border border-slate-600">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-medium text-slate-300">Card {index + 1}</span>
            <button
              onClick={() => deleteCard(index)}
              className="text-red-400 hover:text-red-300 p-1"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            {/* Image */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Image</label>
              <div className="flex flex-col gap-2">
                {card.image_url ? (
                  <div className="relative inline-block">
                    <img src={card.image_url} className="h-24 w-24 object-cover rounded-lg border border-slate-600" alt="" />
                    <button
                      onClick={() => updateCard(index, { image_url: '' })}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="h-24 w-24 bg-slate-800 border-2 border-dashed border-slate-600 rounded-lg flex items-center justify-center">
                    <Image className="w-6 h-6 text-slate-500" />
                  </div>
                )}

                <label className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer flex items-center gap-2 w-fit">
                  {uploadingIndex === index ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Upload Image
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleImageUpload(index, file)
                    }}
                    className="hidden"
                    disabled={uploadingIndex === index}
                  />
                </label>
              </div>
            </div>

            {/* Title & Author */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Title</label>
                <input
                  type="text"
                  value={card.title}
                  onChange={(e) => updateCard(index, { title: e.target.value })}
                  placeholder="Review title"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Author</label>
                <input
                  type="text"
                  value={card.author}
                  onChange={(e) => updateCard(index, { author: e.target.value })}
                  placeholder="Customer name"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
            </div>

            {/* Content */}
            <div>
              <label className="block text-xs text-slate-400 mb-1">Content</label>
              <textarea
                value={card.content}
                onChange={(e) => updateCard(index, { content: e.target.value })}
                placeholder="Review content or testimonial..."
                rows={3}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500 resize-y"
              />
            </div>

            {/* Rating & Badge */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Rating (1-5)</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={card.rating}
                  onChange={(e) => updateCard(index, { rating: parseInt(e.target.value) || 5 })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Badge</label>
                <input
                  type="text"
                  value={card.badge}
                  onChange={(e) => updateCard(index, { badge: e.target.value })}
                  placeholder="e.g., Verified Customer"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
            </div>
          </div>
        </div>
      ))}

      <button
        onClick={addCard}
        className="w-full py-2 bg-pink-500/20 text-pink-400 hover:bg-pink-500/30 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
      >
        <Plus className="w-4 h-4" />
        Add Card
      </button>
    </div>
  )
}
