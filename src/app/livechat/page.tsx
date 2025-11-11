'use client'

import { useState, useEffect } from 'react'
import AICoach from '@/components/ui/ai-coach'

interface AIStaff {
  id: string
  name: string
  role: 'coach' | 'sales' | 'customer-service' | 'scientist'
  createdAt: Date
  trainingMemory: {[key: string]: string[]}
  totalSessions: number
}

export default function DemoPage() {
  const [aiStaffList, setAiStaffList] = useState<AIStaff[]>([])
  const [selectedStaff, setSelectedStaff] = useState<AIStaff | null>(null)
  const [isDataLoaded, setIsDataLoaded] = useState(false)
  const businessUnit = 'skincoach'

  useEffect(() => {
    // Load AI Staff from Supabase
    const loadData = async () => {
      try {
        console.log('🔄 Demo Page: Loading AI staff from Supabase...')

        // Import Supabase function dynamically
        const { loadAIStaff } = await import('@/lib/supabase-storage')

        // Load AI staff from Supabase
        const staff = await loadAIStaff()
        if (staff && staff.length > 0) {
          setAiStaffList(staff)
          setSelectedStaff(staff[0])
          console.log('✅ Loaded', staff.length, 'AI staff from Supabase')
        }

        setIsDataLoaded(true)
      } catch (error) {
        console.error('❌ Failed to load AI staff:', error)
        setIsDataLoaded(true) // Still allow chat even if loading fails
      }
    }

    loadData()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col">
      {/* Header */}
      <div className="bg-slate-800/50 backdrop-blur-md border-b border-slate-700/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                AI Customer Service Coach - Live Chat
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Chat with our trained AI assistant
              </p>
            </div>
            <button
              onClick={() => window.close()}
              className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Close Demo
            </button>
          </div>

          {/* AI Staff Selector */}
          {aiStaffList.length > 0 && (
            <div className="mt-4 flex items-center gap-3">
              <span className="text-slate-300 text-sm font-medium">Select AI Staff:</span>
              <div className="flex gap-2 flex-wrap">
                {aiStaffList.map((staff) => (
                  <button
                    key={staff.id}
                    onClick={() => setSelectedStaff(staff)}
                    className={`px-3 py-1.5 rounded-lg transition-colors text-sm flex items-center gap-2 ${
                      selectedStaff?.id === staff.id
                        ? 'bg-cyan-600 text-white border-2 border-cyan-400'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    <span>{
                      staff.role === 'coach' ? '🎓' :
                      staff.role === 'sales' ? '💰' :
                      staff.role === 'customer-service' ? '🛡️' :
                      '🔬'
                    }</span>
                    <span className="font-medium">{staff.name}</span>
                    <span className="text-xs opacity-70">
                      ({staff.totalSessions || 0} sessions)
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content - Full Screen Chat */}
      <div className="flex-1 relative">
        {/* Loading Indicator */}
        {!isDataLoaded && (
          <div className="absolute top-4 right-4 z-50 bg-yellow-500/90 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            <span className="text-sm font-medium">Loading knowledge base...</span>
          </div>
        )}

        {/* AI Coach - auto-opens on demo page */}
        <AICoach
          initialOpen={true}
          businessUnit={businessUnit}
          selectedStaff={selectedStaff}
        />

        {/* Welcome Message */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center px-4">
            <div className="bg-slate-800/80 backdrop-blur-lg rounded-2xl p-8 border border-slate-700/50 pointer-events-auto max-w-md">
              <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Welcome to AI Demo!
              </h2>
              <p className="text-slate-300 mb-4">
                Click the sparkle button (bottom-right) to start chatting with our AI assistant
              </p>
              <div className="text-sm text-slate-400">
                Try asking about:
                <div className="mt-2 space-y-1">
                  <div className="text-cyan-300">• Products & Ingredients</div>
                  <div className="text-pink-300">• Pricing & Services</div>
                  <div className="text-purple-300">• Skincare Advice</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
