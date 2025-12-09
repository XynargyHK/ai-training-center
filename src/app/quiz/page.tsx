'use client'

/**
 * Skincare Quiz Page
 * Public page for customers to take the skin assessment quiz
 */

import { useState } from 'react'
import SkincareQuiz from '@/components/quiz/skincare-quiz'
import RecommendationsView from '@/components/quiz/recommendations-view'
import { Sparkles } from 'lucide-react'

export default function QuizPage() {
  const [completed, setCompleted] = useState(false)
  const [profileId, setProfileId] = useState<string | null>(null)

  const handleComplete = (id: string, profileData: any) => {
    setProfileId(id)
    setCompleted(true)
  }

  const handleSelectBundle = (bundle: any) => {
    console.log('Selected bundle:', bundle)
    // TODO: Proceed to checkout
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="py-6 px-4 border-b border-slate-700/50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-400" />
            <span className="text-xl font-bold text-white">SkinCoach</span>
          </div>
          <span className="text-sm text-slate-400">
            {completed ? 'Your Recommendations' : 'Personalized Skincare Assessment'}
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-12 px-4">
        {!completed ? (
          <>
            {/* Intro Section */}
            <div className="max-w-2xl mx-auto text-center mb-12">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Discover Your Perfect Skincare Routine
              </h1>
              <p className="text-lg text-slate-400">
                Answer a few questions and our AI will create a personalized skincare
                regimen tailored to your unique needs.
              </p>
            </div>

            {/* Quiz */}
            <SkincareQuiz
              businessUnitId="skincoach"
              onComplete={handleComplete}
            />
          </>
        ) : (
          /* Recommendations */
          <RecommendationsView
            profileId={profileId!}
            onSelectBundle={handleSelectBundle}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="py-6 px-4 border-t border-slate-700/50 mt-auto">
        <div className="max-w-4xl mx-auto text-center text-sm text-slate-500">
          Your data is secure and will only be used to personalize your experience.
        </div>
      </footer>
    </div>
  )
}
