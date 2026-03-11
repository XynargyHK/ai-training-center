'use client'

import { useState } from 'react'
import { Sparkles, X, ChevronDown, ChevronUp, Check, Loader2, RefreshCw } from 'lucide-react'
import { createNewBlock } from './block-registry'
import type { LandingPageBlock } from '@/types/landing-page-blocks'

interface GeneratedStep {
  title: string
  text_content: string
}

interface GeneratedStepsSection {
  heading: string
  steps: GeneratedStep[]
}

interface GeneratedFaqItem {
  title: string
  content: string
}

interface GeneratedFaqSection {
  heading: string
  items: GeneratedFaqItem[]
}

interface GeneratedCta {
  headline: string
  subheadline: string
  cta_text: string
}

interface GeneratedSections {
  problem: GeneratedStepsSection[]
  solution: GeneratedStepsSection[]
  howItWorks: GeneratedStepsSection[]
  faq: GeneratedFaqSection[]
  cta: GeneratedCta[]
}

interface Selections {
  problem: number | null
  solution: number | null
  howItWorks: number | null
  faq: number | null
  cta: number | null
}

interface Props {
  businessUnitId: string
  country: string
  languageCode: string
  existingBlocks: LandingPageBlock[]
  onInsert: (blocks: LandingPageBlock[]) => void
}

const SECTION_LABELS: Record<keyof GeneratedSections, string> = {
  problem: 'Problem / Hook',
  solution: 'Solution',
  howItWorks: 'How It Works',
  faq: 'FAQ',
  cta: 'Call to Action',
}

const SECTION_ORDER: (keyof GeneratedSections)[] = ['problem', 'solution', 'howItWorks', 'faq', 'cta']

export default function LandingPageGenerator({ businessUnitId, country, languageCode, existingBlocks, onInsert }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [sections, setSections] = useState<GeneratedSections | null>(null)
  const [selections, setSelections] = useState<Selections>({ problem: 0, solution: 0, howItWorks: 0, faq: 0, cta: 0 })
  const [insertMode, setInsertMode] = useState<'replace' | 'append'>('replace')
  const [error, setError] = useState('')
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})

  const generate = async () => {
    setIsGenerating(true)
    setError('')
    setSections(null)
    setSelections({ problem: 0, solution: 0, howItWorks: 0, faq: 0, cta: 0 })
    setExpandedSections({})
    try {
      const res = await fetch('/api/ai/generate-landing-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessUnitId, country, languageCode })
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to generate content')
        return
      }
      setSections(data.sections)
      // Auto-expand all sections
      const expanded: Record<string, boolean> = {}
      SECTION_ORDER.forEach(s => { expanded[s] = true })
      setExpandedSections(expanded)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const buildBlocks = (): LandingPageBlock[] => {
    if (!sections) return []
    const newBlocks: LandingPageBlock[] = []
    let order = insertMode === 'append' ? existingBlocks.length : 0

    SECTION_ORDER.forEach(sectionKey => {
      const selIdx = selections[sectionKey]
      if (selIdx === null) return // skipped

      if (sectionKey === 'faq') {
        const opt = sections.faq[selIdx]
        if (!opt) return
        const block = createNewBlock('accordion', opt.heading, order++)
        if (block) {
          block.data = {
            ...block.data,
            heading: opt.heading,
            items: opt.items.map(item => ({ title: item.title, content: item.content }))
          }
          newBlocks.push(block)
        }
      } else if (sectionKey === 'cta') {
        const opt = sections.cta[selIdx]
        if (!opt) return
        const block = createNewBlock('static_banner', 'Call to Action', order++)
        if (block) {
          block.data = {
            ...block.data,
            headline: opt.headline,
            subheadline: opt.subheadline,
            cta_text: opt.cta_text,
          }
          newBlocks.push(block)
        }
      } else {
        const optList = sections[sectionKey] as GeneratedStepsSection[]
        const opt = optList[selIdx]
        if (!opt) return
        const labelMap: Record<string, string> = { problem: 'Problem', solution: 'Solution', howItWorks: 'How It Works' }
        const block = createNewBlock('steps', labelMap[sectionKey] || sectionKey, order++)
        if (block) {
          block.data = {
            ...block.data,
            heading: opt.heading,
            overall_layout: 'vertical',
            steps: opt.steps.map(step => ({
              background_url: '',
              background_type: 'image',
              image_width: '400px',
              subheadline: step.title,
              text_content: step.text_content,
              text_position: 'right',
              text_font_size: '1rem',
              text_font_family: 'Cormorant Garamond',
              text_color: '#000000',
              text_bold: false,
              text_italic: false,
              text_align: 'left'
            }))
          }
          newBlocks.push(block)
        }
      }
    })

    return newBlocks
  }

  const handleInsert = () => {
    const newBlocks = buildBlocks()
    if (newBlocks.length === 0) {
      setError('Please select at least one section.')
      return
    }
    const finalBlocks = insertMode === 'append'
      ? [...existingBlocks, ...newBlocks]
      : newBlocks
    onInsert(finalBlocks)
    setIsOpen(false)
  }

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const toggleSkip = (key: keyof Selections) => {
    setSelections(prev => ({ ...prev, [key]: prev[key] === null ? 0 : null }))
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-none text-xs font-medium transition-all"
      >
        <Sparkles className="w-4 h-4" />
        Generate with AI
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white flex-shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span className="text-sm font-semibold text-gray-900">AI Landing Page Generator</span>
          {sections && <span className="text-xs text-gray-500 ml-2">Select one option per section, then insert</span>}
        </div>
        <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-gray-100 rounded">
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Generate button + error */}
        {!sections && (
          <div className="max-w-xl mx-auto mt-16 text-center">
            <Sparkles className="w-10 h-10 text-emerald-500 mx-auto mb-4" />
            <h2 className="text-base font-semibold text-gray-900 mb-2">Generate landing page content from your knowledge base</h2>
            <p className="text-xs text-gray-500 mb-6">AI will read your industry knowledge and create 2 variations for each section. You pick the best one.</p>
            {error && <p className="text-xs text-red-600 mb-4">{error}</p>}
            <button
              onClick={generate}
              disabled={isGenerating}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white px-5 py-2.5 rounded-none text-sm font-medium transition-all"
            >
              {isGenerating ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</> : <><Sparkles className="w-4 h-4" /> Generate Content</>}
            </button>
          </div>
        )}

        {/* Sections */}
        {sections && (
          <div className="max-w-3xl mx-auto space-y-4">
            {error && <p className="text-xs text-red-600">{error}</p>}

            {SECTION_ORDER.map(sectionKey => {
              const label = SECTION_LABELS[sectionKey]
              const isSkipped = selections[sectionKey] === null
              const isExpanded = expandedSections[sectionKey]
              const options = sectionKey === 'faq'
                ? sections.faq
                : sectionKey === 'cta'
                  ? sections.cta
                  : sections[sectionKey] as GeneratedStepsSection[]

              return (
                <div key={sectionKey} className={`border rounded-none ${isSkipped ? 'border-gray-200 opacity-60' : 'border-gray-300'}`}>
                  {/* Section header */}
                  <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-200">
                    <button
                      onClick={() => toggleSection(sectionKey)}
                      className="flex items-center gap-2 flex-1 text-left"
                    >
                      <span className="text-xs font-semibold text-gray-700">{label}</span>
                      {selections[sectionKey] !== null && (
                        <span className="text-xs text-emerald-600">Option {(selections[sectionKey] ?? 0) + 1} selected</span>
                      )}
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-gray-400 ml-auto" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400 ml-auto" />}
                    </button>
                    <button
                      onClick={() => toggleSkip(sectionKey)}
                      className={`ml-3 text-xs px-2 py-0.5 rounded border transition-all ${isSkipped ? 'bg-gray-200 border-gray-300 text-gray-600' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-100'}`}
                    >
                      {isSkipped ? 'Skipped' : 'Skip'}
                    </button>
                  </div>

                  {/* Options */}
                  {isExpanded && !isSkipped && (
                    <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                      {options.map((opt: any, idx: number) => {
                        const isSelected = selections[sectionKey] === idx
                        return (
                          <div
                            key={idx}
                            onClick={() => setSelections(prev => ({ ...prev, [sectionKey]: idx }))}
                            className={`cursor-pointer border-2 rounded-none p-3 transition-all ${isSelected ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-gray-300 bg-white'}`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-medium text-gray-500">Option {idx + 1}</span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                            </div>

                            {/* Steps section preview */}
                            {(sectionKey === 'problem' || sectionKey === 'solution' || sectionKey === 'howItWorks') && (
                              <>
                                <p className="text-xs font-semibold text-gray-800 mb-2">{opt.heading}</p>
                                <div className="space-y-1.5">
                                  {opt.steps.map((step: GeneratedStep, si: number) => (
                                    <div key={si} className="text-xs">
                                      <span className="font-medium text-gray-700">{step.title}: </span>
                                      <span className="text-gray-500">{step.text_content}</span>
                                    </div>
                                  ))}
                                </div>
                              </>
                            )}

                            {/* FAQ preview */}
                            {sectionKey === 'faq' && (
                              <>
                                <p className="text-xs font-semibold text-gray-800 mb-2">{opt.heading}</p>
                                <div className="space-y-1.5">
                                  {opt.items.slice(0, 3).map((item: GeneratedFaqItem, ii: number) => (
                                    <div key={ii} className="text-xs">
                                      <span className="font-medium text-gray-700">Q: {item.title}</span>
                                    </div>
                                  ))}
                                  {opt.items.length > 3 && <p className="text-xs text-gray-400">+{opt.items.length - 3} more questions</p>}
                                </div>
                              </>
                            )}

                            {/* CTA preview */}
                            {sectionKey === 'cta' && (
                              <div className="space-y-1">
                                <p className="text-xs font-semibold text-gray-800">{opt.headline}</p>
                                <p className="text-xs text-gray-500">{opt.subheadline}</p>
                                <span className="inline-block mt-1 text-xs bg-gray-900 text-white px-3 py-1">{opt.cta_text}</span>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {sections && (
        <div className="flex-shrink-0 border-t border-gray-200 px-4 py-3 bg-white flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500">Insert mode:</span>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="radio" name="insertMode" checked={insertMode === 'replace'} onChange={() => setInsertMode('replace')} className="w-3 h-3" />
              <span className="text-xs text-gray-700">Replace all blocks</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="radio" name="insertMode" checked={insertMode === 'append'} onChange={() => setInsertMode('append')} className="w-3 h-3" />
              <span className="text-xs text-gray-700">Append to existing</span>
            </label>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={generate}
              disabled={isGenerating}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-gray-300 hover:bg-gray-50 text-gray-600 transition-all disabled:opacity-50"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Regenerate
            </button>
            <button
              onClick={handleInsert}
              className="flex items-center gap-1.5 text-xs px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-all"
            >
              <Check className="w-3.5 h-3.5" />
              Insert into Editor
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
