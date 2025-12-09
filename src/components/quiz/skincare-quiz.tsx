'use client'

/**
 * Skincare Quiz Component
 * Multi-step quiz for collecting customer skin profile
 * Steps: Basic Info → Skin Type → Concerns → Preferences
 */

import { useState, useEffect } from 'react'
import {
  ArrowRight, ArrowLeft, Loader2, Check, User,
  Droplets, AlertCircle, Settings, Sparkles
} from 'lucide-react'

interface QuizOption {
  value: string
  label: string
  description?: string
  handle?: string
}

interface QuizQuestion {
  id: string
  type: 'single' | 'multi' | 'concerns_multi'
  question: string
  description?: string
  options: QuizOption[]
}

interface QuizStep {
  id: number
  title: string
  description: string
  questions: QuizQuestion[]
}

interface QuizConfig {
  steps: QuizStep[]
  concerns: Record<string, QuizOption[]>
}

interface SkincareQuizProps {
  businessUnitId: string
  onComplete?: (profileId: string, profile: any) => void
  className?: string
}

const STEP_ICONS = [User, Droplets, AlertCircle, Settings]

export default function SkincareQuiz({
  businessUnitId,
  onComplete,
  className = ''
}: SkincareQuizProps) {
  const [config, setConfig] = useState<QuizConfig | null>(null)
  const [currentStep, setCurrentStep] = useState(1)
  const [profileId, setProfileId] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [selectedConcerns, setSelectedConcerns] = useState<Map<string, { severity: number; isPriority: boolean }>>(new Map())
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load quiz config
  useEffect(() => {
    loadConfig()
  }, [businessUnitId])

  const loadConfig = async () => {
    try {
      const res = await fetch(`/api/quiz?businessUnitId=${businessUnitId}`)
      const data = await res.json()
      setConfig(data.config)
    } catch (err) {
      setError('Failed to load quiz')
    } finally {
      setIsLoading(false)
    }
  }

  // Start quiz - create profile
  const startQuiz = async () => {
    setIsSaving(true)
    try {
      const res = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessUnitId,
          source: 'website'
        })
      })
      const data = await res.json()
      setProfileId(data.profileId)
      setCurrentStep(1)
    } catch (err) {
      setError('Failed to start quiz')
    } finally {
      setIsSaving(false)
    }
  }

  // Save current step and move to next
  const nextStep = async () => {
    if (!profileId) {
      await startQuiz()
      return
    }

    setIsSaving(true)
    try {
      // Prepare concerns for step 3
      let stepAnswers = { ...answers }
      if (currentStep === 3) {
        stepAnswers.concerns = Array.from(selectedConcerns.entries()).map(([id, settings]) => ({
          concern_id: id,
          severity: settings.severity,
          is_priority: settings.isPriority
        }))
      }

      const res = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessUnitId,
          profileId,
          step: currentStep + 1,
          answers: stepAnswers
        })
      })

      const data = await res.json()

      if (currentStep >= 4) {
        // Quiz complete
        onComplete?.(profileId, data.profile)
      } else {
        setCurrentStep(currentStep + 1)
      }
    } catch (err) {
      setError('Failed to save progress')
    } finally {
      setIsSaving(false)
    }
  }

  // Go back to previous step
  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  // Handle single answer selection
  const selectAnswer = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }))
  }

  // Handle concern selection
  const toggleConcern = (concernId: string) => {
    setSelectedConcerns(prev => {
      const newMap = new Map(prev)
      if (newMap.has(concernId)) {
        newMap.delete(concernId)
      } else {
        newMap.set(concernId, { severity: 3, isPriority: false })
      }
      return newMap
    })
  }

  // Mark concern as priority
  const togglePriority = (concernId: string) => {
    setSelectedConcerns(prev => {
      const newMap = new Map(prev)
      const current = newMap.get(concernId)
      if (current) {
        newMap.set(concernId, { ...current, isPriority: !current.isPriority })
      }
      return newMap
    })
  }

  // Check if current step is complete
  const isStepComplete = () => {
    const step = config?.steps[currentStep - 1]
    if (!step) return false

    if (currentStep === 3) {
      return selectedConcerns.size > 0
    }

    return step.questions.every(q => answers[q.id])
  }

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center py-20 ${className}`}>
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    )
  }

  if (!config) {
    return (
      <div className={`text-center py-20 ${className}`}>
        <p className="text-red-400">{error || 'Failed to load quiz'}</p>
      </div>
    )
  }

  const step = config.steps[currentStep - 1]
  const StepIcon = STEP_ICONS[currentStep - 1] || Sparkles

  return (
    <div className={`max-w-2xl mx-auto ${className}`}>
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          {config.steps.map((s, i) => {
            const Icon = STEP_ICONS[i] || Sparkles
            const isActive = currentStep === i + 1
            const isComplete = currentStep > i + 1

            return (
              <div
                key={s.id}
                className={`flex items-center gap-2 ${
                  isActive ? 'text-purple-400' : isComplete ? 'text-green-400' : 'text-slate-500'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                  isActive ? 'border-purple-500 bg-purple-500/20' :
                  isComplete ? 'border-green-500 bg-green-500/20' : 'border-slate-600'
                }`}>
                  {isComplete ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </div>
                <span className="hidden sm:inline text-sm">{s.title}</span>
              </div>
            )
          })}
        </div>
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-600 to-pink-500 transition-all duration-300"
            style={{ width: `${(currentStep / config.steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-slate-800 rounded-2xl p-6 md:p-8 border border-slate-700">
        {/* Step Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-500/20 mb-4">
            <StepIcon className="w-8 h-8 text-purple-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">{step.title}</h2>
          <p className="text-slate-400">{step.description}</p>
        </div>

        {/* Questions */}
        <div className="space-y-8">
          {currentStep === 3 ? (
            // Concerns step - special multi-select by category
            <div className="space-y-6">
              <p className="text-sm text-slate-400 text-center">
                Select all that apply. Click the star to mark your top priorities.
              </p>
              {['face', 'eye', 'body', 'scalp'].map(category => {
                const categoryOptions = config.concerns[category] || []
                if (categoryOptions.length === 0) return null

                return (
                  <div key={category}>
                    <h3 className="text-sm font-semibold text-purple-400 uppercase mb-3">
                      {category} Concerns
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {categoryOptions.map(option => {
                        const isSelected = selectedConcerns.has(option.value)
                        const isPriority = selectedConcerns.get(option.value)?.isPriority

                        return (
                          <div
                            key={option.value}
                            className={`relative p-3 rounded-lg border-2 cursor-pointer transition-all ${
                              isSelected
                                ? 'border-purple-500 bg-purple-500/20'
                                : 'border-slate-600 hover:border-slate-500'
                            }`}
                            onClick={() => toggleConcern(option.value)}
                          >
                            <div className="flex items-center justify-between">
                              <span className={`text-sm ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                                {option.label}
                              </span>
                              {isSelected && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    togglePriority(option.value)
                                  }}
                                  className={`p-1 rounded ${
                                    isPriority ? 'text-yellow-400' : 'text-slate-500 hover:text-slate-300'
                                  }`}
                                >
                                  <Sparkles className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
              <p className="text-xs text-slate-500 text-center">
                {selectedConcerns.size} concern{selectedConcerns.size !== 1 ? 's' : ''} selected
                {Array.from(selectedConcerns.values()).filter(c => c.isPriority).length > 0 &&
                  ` (${Array.from(selectedConcerns.values()).filter(c => c.isPriority).length} priority)`
                }
              </p>
            </div>
          ) : (
            // Regular questions
            step.questions.map(question => (
              <div key={question.id}>
                <h3 className="text-lg font-medium text-white mb-4">{question.question}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {question.options.map(option => {
                    const isSelected = answers[question.id] === option.value

                    return (
                      <button
                        key={option.value}
                        onClick={() => selectAnswer(question.id, option.value)}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          isSelected
                            ? 'border-purple-500 bg-purple-500/20'
                            : 'border-slate-600 hover:border-slate-500'
                        }`}
                      >
                        <div className="font-medium text-white">{option.label}</div>
                        {option.description && (
                          <div className="text-sm text-slate-400 mt-1">{option.description}</div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-8 pt-6 border-t border-slate-700">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <button
            onClick={nextStep}
            disabled={!isStepComplete() || isSaving}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-xl font-medium hover:from-purple-500 hover:to-pink-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : currentStep >= 4 ? (
              <>
                Get My Recommendations
                <Sparkles className="w-4 h-4" />
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
