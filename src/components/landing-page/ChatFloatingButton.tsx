'use client'

import { useState } from 'react'
import { MessageCircle, X } from 'lucide-react'

interface ChatFloatingButtonProps {
  businessUnit: string
  country: string
  lang: string
  pageSlug?: string
}

export default function ChatFloatingButton({ businessUnit, country, lang, pageSlug }: ChatFloatingButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  const chatUrl = `/livechat?businessUnit=${businessUnit}&country=${country}&lang=${lang}${pageSlug ? `&page=${pageSlug}` : ''}`

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 bg-black text-white p-4 rounded-full shadow-2xl hover:bg-gray-800 transition-colors"
          aria-label="Open chat"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Chat Iframe Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-end p-4 md:p-6">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setIsOpen(false)}
          />

          {/* Chat Window */}
          <div className="relative w-full h-full md:w-[420px] md:h-[700px] md:max-h-[85vh] bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-3 right-3 z-10 bg-white/90 text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition-colors shadow-sm"
              aria-label="Close chat"
            >
              <X className="w-5 h-5" />
            </button>

            <iframe
              src={chatUrl}
              className="w-full h-full border-0"
              title="Chat with SkinCoach"
              loading="lazy"
            />
          </div>
        </div>
      )}
    </>
  )
}
