'use client'

import AICoach from '@/components/ui/ai-coach'

export default function ChatPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-cyan-50">
      {/* Simple header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 bg-clip-text text-transparent">
            AI customer service Coach
          </h1>
          <p className="text-gray-600 mt-2">
            Ask me anything about customer service, products, or beauty tips!
          </p>
        </div>
      </div>

      {/* Main content area */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-xl text-center">
          <div className="mb-6">
            <div className="w-20 h-20 mx-auto bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 rounded-full flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              Welcome! 👋
            </h2>
            <p className="text-gray-600 max-w-xl mx-auto">
              Click the sparkle button in the bottom-right corner to start chatting with your AI customer service expert.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mt-8">
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-xl">
              <div className="text-2xl mb-2">💆‍♀️</div>
              <h3 className="font-semibold text-gray-800 mb-1">customer service Advice</h3>
              <p className="text-sm text-gray-600">Get personalized tips for your skin type</p>
            </div>
            <div className="bg-gradient-to-br from-pink-50 to-cyan-50 p-4 rounded-xl">
              <div className="text-2xl mb-2">🧴</div>
              <h3 className="font-semibold text-gray-800 mb-1">Product Info</h3>
              <p className="text-sm text-gray-600">Learn about ingredients and products</p>
            </div>
            <div className="bg-gradient-to-br from-cyan-50 to-blue-50 p-4 rounded-xl">
              <div className="text-2xl mb-2">💰</div>
              <h3 className="font-semibold text-gray-800 mb-1">Pricing & Plans</h3>
              <p className="text-sm text-gray-600">Find the perfect plan for you</p>
            </div>
          </div>
        </div>
      </div>

      {/* AI Coach Widget - The floating chat button */}
      <AICoach />
    </div>
  )
}
