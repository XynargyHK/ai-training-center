'use client'

import { useState, useEffect } from 'react'
import AITrainingCenter from '@/components/admin/ai-training-center'
import OnboardingWizard from '@/components/onboarding/onboarding-wizard'
import { Loader2 } from 'lucide-react'

export default function Home() {
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkOnboardingStatus()
  }, [])

  const checkOnboardingStatus = async () => {
    try {
      const response = await fetch('/api/profile/onboarding')
      const data = await response.json()

      // Show onboarding if not completed
      // For now, also check localStorage for first-time users
      const hasSeenOnboarding = localStorage.getItem('onboarding_completed')

      if (!data.completed && !hasSeenOnboarding) {
        setShowOnboarding(true)
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error)
      // If error, check localStorage
      const hasSeenOnboarding = localStorage.getItem('onboarding_completed')
      if (!hasSeenOnboarding) {
        setShowOnboarding(true)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleOnboardingComplete = () => {
    // Mark as completed in localStorage
    localStorage.setItem('onboarding_completed', 'true')
    setShowOnboarding(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-slate-500">Loading...</p>
        </div>
      </div>
    )
  }

  if (showOnboarding) {
    return <OnboardingWizard onComplete={handleOnboardingComplete} />
  }

  return <AITrainingCenter />
}
