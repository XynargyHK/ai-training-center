'use client'

import { useState, useEffect } from 'react'
import AICoach from '@/components/ui/ai-coach'
import { useSearchParams } from 'next/navigation'

interface AIStaff {
  id: string
  name: string
  role: 'coach' | 'sales' | 'customer-service' | 'scientist'
  createdAt: Date
  trainingMemory: {[key: string]: string[]}
  totalSessions: number
}

interface BusinessUnit {
  id: string
  name: string
  slug: string
}

export default function DemoPage() {
  const searchParams = useSearchParams()
  const businessUnitParam = searchParams.get('businessUnit') || 'skincoach'

  const [aiStaffList, setAiStaffList] = useState<AIStaff[]>([])
  const [openStaffId, setOpenStaffId] = useState<string | null>(null)
  const [isDataLoaded, setIsDataLoaded] = useState(false)
  const [businessUnit, setBusinessUnit] = useState<BusinessUnit | null>(null)

  useEffect(() => {
    // Load Business Unit and AI Staff from Supabase
    const loadData = async () => {
      try {
        console.log('🔄 Demo Page: Loading data for business unit:', businessUnitParam)

        // Import client-safe API functions
        const { loadBusinessUnits, loadAIStaff } = await import('@/lib/api-client')

        // Load business unit details
        const units = await loadBusinessUnits()
        const currentUnit = units.find((u: any) => u.id === businessUnitParam || u.slug === businessUnitParam)
        if (currentUnit) {
          setBusinessUnit(currentUnit)
          console.log('✅ Loaded business unit:', currentUnit.name)
        }

        // Load AI staff from Supabase for this business unit
        const staff = await loadAIStaff(businessUnitParam)
        if (staff && staff.length > 0) {
          setAiStaffList(staff)
          console.log('✅ Loaded', staff.length, 'AI staff from Supabase')
        }

        setIsDataLoaded(true)
      } catch (error) {
        console.error('❌ Failed to load data:', error)
        setIsDataLoaded(true) // Still allow chat even if loading fails
      }
    }

    loadData()
  }, [businessUnitParam])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col">
      {/* Header */}
      <div className="bg-slate-800/50 backdrop-blur-md border-b border-slate-700/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                {businessUnit?.name || 'AI'} - Live Chat
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Click on an AI staff icon to start chatting
              </p>
            </div>
            <button
              onClick={() => window.close()}
              className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Close
            </button>
          </div>
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

        {/* Single AI Coach with all staff */}
        {aiStaffList.length > 0 && (
          <AICoach
            businessUnit={businessUnitParam}
            aiStaffList={aiStaffList}
            initialOpen={false}
          />
        )}

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
                Welcome to {businessUnit?.name || 'AI'}!
              </h2>
              <p className="text-slate-300 mb-4">
                {aiStaffList.length > 0 ? (
                  <>Click on any sparkle button to chat with our trained AI staff</>
                ) : (
                  <>No AI staff available. Please train some AI staff first in the admin panel.</>
                )}
              </p>
              {aiStaffList.length > 0 && (
                <div className="text-sm text-slate-400">
                  Available staff:
                  <div className="mt-2 space-y-1">
                    {aiStaffList.map((staff) => (
                      <div key={staff.id} className="text-cyan-300">
                        {staff.role === 'coach' ? '🎓' :
                         staff.role === 'sales' ? '💰' :
                         staff.role === 'customer-service' ? '🛡️' : '🔬'} {staff.name} ({staff.role})
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
