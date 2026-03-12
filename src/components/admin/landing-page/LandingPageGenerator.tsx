'use client'

import { useState, useEffect, useMemo } from 'react'
import { Sparkles, X, ChevronDown, ChevronUp, Check, Loader2, RefreshCw, FileText, Globe, MessageSquareQuote, Layout, Eye } from 'lucide-react'
import { createNewBlock } from './block-registry'
import type { LandingPageBlock } from '@/types/landing-page-blocks'
import BlockPreview from './BlockPreview'

interface GeneratedBlock {
  type: string
  heading?: string
  headline?: string
  content?: string
  subheadline?: string
  cta_text?: string
  cta_url?: string
  steps?: Array<{ title: string, text_content: string }>
  items?: Array<{ title: string, content: string }>
  fields?: Array<{ label: string, type: string, placeholder: string, required: boolean }>
  stats?: Array<{ value: string, label: string }>
  logos?: Array<{ name: string, url: string }>
}

interface GeneratedSections {
  intro: GeneratedBlock[]
  main_content: GeneratedBlock[]
  social_proof: GeneratedBlock[]
  interaction: GeneratedBlock[]
  faq: GeneratedBlock[]
}

interface Selections {
  intro: number | null
  main_content: number | null
  social_proof: number | null
  interaction: number | null
  faq: number | null
}

interface Props {
  businessUnitId: string
  country: string
  languageCode: string
  existingBlocks: LandingPageBlock[]
  onInsert: (blocks: LandingPageBlock[]) => void
}

const SECTION_LABELS: Record<keyof GeneratedSections, string> = {
  intro: 'Introduction',
  main_content: 'Main Content',
  social_proof: 'Social Proof & Trust',
  interaction: 'Interaction & Conversion',
  faq: 'FAQ',
}

const SECTION_ORDER: (keyof GeneratedSections)[] = ['intro', 'main_content', 'social_proof', 'interaction', 'faq']

export default function LandingPageGenerator({ businessUnitId, country, languageCode, existingBlocks, onInsert }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [sections, setSections] = useState<GeneratedSections | null>(null)
  const [selections, setSelections] = useState<Selections>({ intro: 0, main_content: 0, social_proof: 0, interaction: 0, faq: 0 })
  const [insertMode, setInsertMode] = useState<'replace' | 'append'>('replace')
  const [error, setError] = useState('')
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})

  // Source selection states
  const [sourceType, setSourceType] = useState<'knowledge' | 'document' | 'url'>('knowledge')
  const [documents, setDocuments] = useState<Array<{ id: string, topic: string }>>([])
  const [selectedSources, setSelectedSources] = useState<Array<{ type: 'document' | 'url', id?: string, value: string, label: string }>>([])
  const [selectedDocId, setSelectedDocId] = useState('')
  const [externalUrl, setExternalUrl] = useState('')
  const [customInstructions, setCustomInstructions] = useState('')
  const [isLoadingDocs, setIsLoadingDocs] = useState(false)
  const [pageName, setPageName] = useState('')
  const [buName, setBuName] = useState('Loading...')

  const LANGUAGE_MAP: Record<string, string> = {
    en: 'English',
    tw: 'Traditional Chinese',
    cn: 'Simplified Chinese',
    vi: 'Vietnamese'
  }

  const fetchBuName = async () => {
    try {
      const res = await fetch(`/api/business-units`)
      const data = await res.json()
      if (data.business_units && Array.isArray(data.business_units)) {
        const bu = data.business_units.find((b: any) => 
          b.id === businessUnitId || b.slug === businessUnitId
        )
        if (bu) {
          setBuName(bu.name)
          return
        }
      }
      
      const displayName = businessUnitId.length > 20 
        ? 'Active Business' 
        : businessUnitId.charAt(0).toUpperCase() + businessUnitId.slice(1)
      setBuName(displayName)
    } catch {
      setBuName('Business Unit')
    }
  }

  const fetchDocuments = async () => {
    if (!businessUnitId) return
    setIsLoadingDocs(true)
    try {
      const res = await fetch(`/api/ai/list-knowledge?businessUnitId=${businessUnitId}`)
      const data = await res.json()
      if (res.ok) {
        setDocuments(data.documents || [])
        if (data.documents?.length === 1 && !selectedDocId) {
          setSelectedDocId(data.documents[0].id)
        }
      }
    } catch (err) {
      console.error('Failed to fetch documents')
    } finally {
      setIsLoadingDocs(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchBuName()
      if (sourceType === 'document') fetchDocuments()
    }
  }, [isOpen, sourceType, businessUnitId])

  const addSource = () => {
    if (sourceType === 'document' && selectedDocId) {
      const doc = documents.find(d => d.id === selectedDocId)
      if (doc && !selectedSources.find(s => s.id === selectedDocId)) {
        setSelectedSources([...selectedSources, { type: 'document', id: doc.id, value: doc.id, label: doc.topic }])
      }
      setSelectedDocId('')
    } else if (sourceType === 'url' && externalUrl) {
      if (!selectedSources.find(s => s.value === externalUrl)) {
        setSelectedSources([...selectedSources, { type: 'url', value: externalUrl, label: externalUrl }])
      }
      setExternalUrl('')
    }
  }

  const removeSource = (value: string) => {
    setSelectedSources(selectedSources.filter(s => s.value !== value))
  }

  const generate = async () => {
    setIsGenerating(true)
    setError('')
    // Only reset sections if starting from scratch (no sections yet)
    // If refining, keep existing sections to prevent UI flashing back to source view
    if (!sections) setSections(null)
    
    setSelections({ intro: 0, main_content: 0, social_proof: 0, interaction: 0, faq: 0 })
    setExpandedSections({})
    try {
      const res = await fetch('/api/ai/generate-landing-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          businessUnitId, 
          country, 
          languageCode,
          sourceType: selectedSources.length > 0 ? 'multi' : sourceType,
          sources: selectedSources,
          customInstructions,
          existingSections: sections // Pass current draft for refinement
        })
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
      if (selIdx === null) return

      const opt = sections[sectionKey][selIdx]
      if (!opt) return

      const block = createNewBlock(opt.type, opt.heading || opt.headline || opt.type, order++)
      if (block) {
        // Map AI generated data to block-specific formats
        if (opt.type === 'steps' && opt.steps) {
          block.data = {
            ...block.data,
            heading: opt.heading || opt.headline,
            subheadline: opt.subheadline,
            steps: opt.steps.map(s => ({
              subheadline: s.title,
              text_content: s.text_content,
              background_url: s.background_url || '', // AI matched image
              image_width: '400px',
              text_position: 'right'
            }))
          }
        } else if (opt.type === 'accordion' && opt.items) {
          block.data = {
            ...block.data,
            headline: opt.heading || opt.headline,
            items: opt.items.map(it => ({
              title: it.title,
              content: it.content,
              image_url: it.image_url || it.background_url || '' // Support images in accordion
            }))
          }
        } else if (opt.type === 'form' && opt.fields) {
          block.data = {
            ...block.data,
            headline: opt.heading || opt.headline,
            subheadline: opt.subheadline,
            fields: opt.fields.map((f, i) => ({ id: `f-${i}`, ...f })),
            submit_button_text: opt.cta_text || 'Submit'
          }
        } else if (opt.type === 'stats_grid' && opt.stats) {
          block.data = {
            ...block.data,
            headline: opt.heading || opt.headline,
            stats: opt.stats.map((s, i) => ({ id: `s-${i}`, ...s }))
          }
        } else {
          // Generic mapping for split, static_banner, etc.
          block.data = {
            ...block.data,
            headline: opt.headline || opt.heading,
            subheadline: opt.subheadline,
            content: opt.content,
            cta_text: opt.cta_text,
            cta_url: opt.cta_url,
            background_url: opt.background_url || '' // AI matched image for split
          }
        }
        newBlocks.push(block)
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

  const [showFullPreview, setShowFullPreview] = useState(false)

  // Memoize buildBlocks to avoid unnecessary re-renders
  const draftBlocks = useMemo(() => {
    return buildBlocks()
  }, [sections, selections, insertMode])

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
    <div className={`fixed inset-0 z-[100] flex flex-col bg-white ${showFullPreview ? 'p-0' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white flex-shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span className="text-sm font-semibold text-gray-900">AI Landing Page Generator</span>
          {sections && <span className="text-xs text-gray-500 ml-2">Select one option per section, then insert</span>}
        </div>
        <div className="flex items-center gap-2">
          {sections && (
            <button 
              onClick={() => setShowFullPreview(!showFullPreview)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border transition-all ${showFullPreview ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'}`}
            >
              <Eye className="w-3.5 h-3.5" />
              {showFullPreview ? 'Back to Editor' : 'Full Preview'}
            </button>
          )}
          <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-gray-100 rounded">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-hidden bg-gray-50/30">
        {!sections ? (
          <div className="h-full overflow-y-auto p-4">
            <div className="max-w-xl mx-auto mt-4 space-y-6">
              {/* Context Header */}
              <div className="bg-emerald-600 text-white p-4 rounded-sm shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase opacity-80 tracking-widest">Generating Content For</p>
                  <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                    <Layout className="w-5 h-5" />
                    {buName} 
                    <span className="text-emerald-200 ml-1">/ {country.toUpperCase()} - {LANGUAGE_MAP[languageCode] || languageCode.toUpperCase()}</span>
                    {pageName && <span className="text-white/60 ml-2 font-mono text-[14px]">/ {pageName}</span>}
                  </h2>
                </div>
                <div className="text-right">
                  <Sparkles className="w-8 h-8 opacity-20" />
                </div>
              </div>

              {/* Target Page Info */}
              <div className="bg-white border border-emerald-200 shadow-sm overflow-hidden">
                <div className="p-4">
                  <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wider">Target Page Name (Slug)</label>
                  <div className="flex items-center gap-2">
                    <div className="bg-gray-100 px-3 py-2 text-xs text-gray-400 font-mono border border-gray-200">
                      / {country.toLowerCase()} /
                    </div>
                    <input
                      type="text"
                      value={pageName}
                      onChange={(e) => setPageName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                      placeholder="e.g. how-to-use"
                      className="flex-1 px-3 py-2 text-xs border border-gray-300 outline-none focus:border-emerald-500 font-bold text-emerald-700"
                    />
                  </div>
                  <p className="text-[9px] text-gray-400 mt-1.5 italic">Leaving this empty will generate content for your homepage.</p>
                </div>
              </div>

              {/* Source Selection */}
              <div className="bg-white border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                  <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5" />
                    Step 1: Choose Content Source
                  </h3>
                </div>
                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => setSourceType('knowledge')}
                      className={`flex flex-col items-center gap-2 p-3 border transition-all ${sourceType === 'knowledge' ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <MessageSquareQuote className={`w-5 h-5 ${sourceType === 'knowledge' ? 'text-emerald-600' : 'text-gray-400'}`} />
                      <span className="text-[10px] font-bold uppercase">All Knowledge</span>
                    </button>
                    <button
                      onClick={() => setSourceType('document')}
                      className={`flex flex-col items-center gap-2 p-3 border transition-all ${sourceType === 'document' ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <FileText className={`w-5 h-5 ${sourceType === 'document' ? 'text-emerald-600' : 'text-gray-400'}`} />
                      <span className="text-[10px] font-bold uppercase">Specific Doc</span>
                    </button>
                    <button
                      onClick={() => setSourceType('url')}
                      className={`flex flex-col items-center gap-2 p-3 border transition-all ${sourceType === 'url' ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <Globe className={`w-5 h-5 ${sourceType === 'url' ? 'text-emerald-600' : 'text-gray-400'}`} />
                      <span className="text-[10px] font-bold uppercase">External URL</span>
                    </button>
                  </div>

                  {sourceType === 'document' && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[10px] font-bold text-gray-500 uppercase">Select Document</label>
                        <button 
                          onClick={fetchDocuments}
                          className="text-[9px] text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1"
                        >
                          <RefreshCw className={`w-2.5 h-2.5 ${isLoadingDocs ? 'animate-spin' : ''}`} />
                          REFRESH
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <select
                          value={selectedDocId}
                          onChange={(e) => setSelectedDocId(e.target.value)}
                          className="flex-1 px-3 py-2 text-xs border border-gray-300 outline-none focus:border-emerald-500 bg-white"
                        >
                          {documents.length === 0 ? (
                            <option value="">No documents found...</option>
                          ) : (
                            <>
                              <option value="">Choose a document...</option>
                              {documents.map(doc => (
                                <option key={doc.id} value={doc.id}>{doc.topic}</option>
                              ))}
                            </>
                          )}
                        </select>
                        <button
                          onClick={addSource}
                          disabled={!selectedDocId}
                          className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 disabled:opacity-50"
                        >
                          ADD
                        </button>
                      </div>
                      {isLoadingDocs && <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Loading documents...</p>}
                    </div>
                  )}

                  {sourceType === 'url' && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                      <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Website URL</label>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={externalUrl}
                          onChange={(e) => setExternalUrl(e.target.value)}
                          placeholder="https://example.com/product-info"
                          className="flex-1 px-3 py-2 text-xs border border-gray-300 outline-none focus:border-emerald-500"
                        />
                        <button
                          onClick={addSource}
                          disabled={!externalUrl}
                          className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 disabled:opacity-50"
                        >
                          ADD
                        </button>
                      </div>
                    </div>
                  )}

                  {/* List of Selected Sources */}
                  {selectedSources.length > 0 && (
                    <div className="pt-2 border-t border-gray-100 mt-2 space-y-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Selected Sources ({selectedSources.length})</p>
                      <div className="space-y-1.5">
                        {selectedSources.map((source) => (
                          <div key={source.value} className="flex items-center justify-between bg-emerald-50/50 border border-emerald-100 px-3 py-2 rounded-sm group">
                            <div className="flex items-center gap-2 overflow-hidden">
                              {source.type === 'document' ? <FileText className="w-3 h-3 text-emerald-600 shrink-0" /> : <Globe className="w-3 h-3 text-blue-600 shrink-0" />}
                              <span className="text-[11px] font-medium text-emerald-900 truncate">{source.label}</span>
                            </div>
                            <button 
                              onClick={() => removeSource(source.value)}
                              className="text-emerald-400 hover:text-red-500 transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Custom Instructions */}
              <div className="bg-white border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                  <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    Step 2: Custom Instructions (Optional)
                  </h3>
                </div>
                <div className="p-4">
                  <textarea
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                    placeholder="e.g. 'Create a how-to guide with a registration form at the start. Use a professional tone. Link to https://dmsprod...'"
                    rows={3}
                    className="w-full px-3 py-2 text-xs border border-gray-300 outline-none focus:border-emerald-500"
                  />
                  <p className="text-[10px] text-gray-400 mt-2 italic">Pro tip: Mention specific blocks like 'Form' or 'Steps' to guide the AI.</p>
                </div>
              </div>

              <div className="text-center pt-4">
                {error && <p className="text-xs text-red-600 mb-4 bg-red-50 p-2 border border-red-100">{error}</p>}
                <button
                  onClick={generate}
                  disabled={
                    isGenerating || 
                    (selectedSources.length === 0 && sourceType === 'document' && !selectedDocId) || 
                    (selectedSources.length === 0 && sourceType === 'url' && !externalUrl) ||
                    (sourceType === 'knowledge' && false) // Always allowed for 'knowledge'
                  }
                  className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white px-8 py-3 rounded-none text-sm font-bold transition-all shadow-lg hover:shadow-emerald-200"
                >
                  {isGenerating ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing & Generating...</> : <><Sparkles className="w-4 h-4" /> Start Generation</>}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className={`h-full flex ${showFullPreview ? 'flex-col' : 'flex-row'} relative`}>
            {/* Loading Overlay for Refinement */}
            {isGenerating && sections && (
              <div className="absolute inset-0 z-50 bg-white/40 backdrop-blur-[1px] flex items-center justify-center animate-in fade-in duration-300">
                <div className="bg-white shadow-2xl border border-emerald-100 p-6 flex flex-col items-center gap-3">
                  <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                  <p className="text-xs font-black text-emerald-900 uppercase tracking-widest">Improvising...</p>
                </div>
              </div>
            )}
            
            {/* Left: Selections */}
            {!showFullPreview && (
              <div className="w-1/2 h-full overflow-y-auto border-r border-gray-200 p-4">
                <div className="max-w-xl mx-auto space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Configure Page Layout</h3>
                    {error && <p className="text-[10px] text-red-600">{error}</p>}
                  </div>

                  {/* Improvisation / Refinement Box */}
                  <div className="bg-emerald-50 border border-emerald-200 p-3 mb-4 shadow-sm animate-in slide-in-from-top-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider">Improvise with AI</span>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customInstructions}
                        onChange={(e) => setCustomInstructions(e.target.value)}
                        placeholder="e.g. 'Make the intro more urgent' or 'Add a pricing section'"
                        className="flex-1 px-3 py-2 text-xs border border-emerald-200 outline-none focus:border-emerald-500 bg-white shadow-inner"
                        onKeyDown={(e) => e.key === 'Enter' && generate()}
                      />
                      <button
                        onClick={generate}
                        disabled={isGenerating}
                        className="px-4 py-2 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-tighter hover:bg-emerald-700 disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-sm"
                      >
                        {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Refine'}
                      </button>
                    </div>
                  </div>

                  {SECTION_ORDER.map(sectionKey => {
                    const label = SECTION_LABELS[sectionKey]
                    const isSkipped = selections[sectionKey] === null
                    const isExpanded = expandedSections[sectionKey]
                    const options = sections[sectionKey] || []

                    if (!options || options.length === 0) return null

                    return (
                      <div key={sectionKey} className={`border rounded-none ${isSkipped ? 'border-gray-200 opacity-60' : 'border-gray-300'}`}>
                        {/* Section header */}
                        <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-200 text-gray-800">
                          <button
                            onClick={() => toggleSection(sectionKey)}
                            className="flex items-center gap-2 flex-1 text-left"
                          >
                            <span className="text-xs font-semibold">{label}</span>
                            {selections[sectionKey] !== null && (
                              <span className="text-xs text-emerald-600 font-bold">Option {(selections[sectionKey] ?? 0) + 1} selected</span>
                            )}
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-gray-400 ml-auto" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400 ml-auto" />}
                          </button>
                          <button
                            onClick={() => toggleSkip(sectionKey)}
                            className={`ml-3 text-[10px] px-2 py-0.5 rounded border transition-all font-bold uppercase ${isSkipped ? 'bg-gray-200 border-gray-300 text-gray-600' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-100'}`}
                          >
                            {isSkipped ? 'Skipped' : 'Skip'}
                          </button>
                        </div>

                        {/* Options */}
                        {isExpanded && !isSkipped && (
                          <div className="p-3 grid grid-cols-1 gap-3 bg-white">
                            {Array.isArray(options) ? options.map((opt: GeneratedBlock, idx: number) => {
                              const isSelected = selections[sectionKey] === idx
                              return (
                                <div
                                  key={idx}
                                  onClick={() => setSelections(prev => ({ ...prev, [sectionKey]: idx }))}
                                  className={`cursor-pointer border-2 rounded-none p-3 transition-all ${isSelected ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-gray-300 bg-white'}`}
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase">Option {idx + 1} ({opt.type})</span>
                                    {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                                  </div>

                                  <p className="text-xs font-bold text-gray-800 mb-1">{opt.headline || opt.heading}</p>
                                  {opt.subheadline && <p className="text-[10px] text-gray-500 mb-2">{opt.subheadline}</p>}
                                  
                                  {opt.steps && Array.isArray(opt.steps) && (
                                    <div className="space-y-1 mt-2">
                                      {opt.steps.slice(0, 3).map((s, i) => (
                                        <div key={i} className="text-[10px] text-gray-600 flex gap-1">
                                          <span className="font-bold">{i+1}.</span>
                                          <span>{s.title}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {opt.items && Array.isArray(opt.items) && (
                                    <div className="space-y-1 mt-2">
                                      {opt.items.slice(0, 2).map((it, i) => (
                                        <div key={i} className="text-[10px] text-gray-600">
                                          <span className="font-bold">Q: {it.title}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {opt.fields && Array.isArray(opt.fields) && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                      {opt.fields.map((f, i) => (
                                        <span key={i} className="text-[8px] bg-gray-100 px-1 rounded text-gray-500">{f.label}</span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )
                            }) : (
                              <p className="text-xs text-gray-400 p-4 col-span-2 text-center">No options available for this section.</p>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Right: Live Draft Preview */}
            <div className={`${showFullPreview ? 'w-full' : 'w-1/2'} h-full overflow-y-auto bg-gray-100 p-4 border-l border-gray-200`}>
              <div className="bg-white shadow-xl min-h-full border border-gray-200">
                <div className="px-4 py-2 bg-gray-800 text-white flex items-center justify-between sticky top-0 z-10">
                  <span className="text-[10px] font-black uppercase tracking-widest">DRAFT PAGE PREVIEW</span>
                  <div className="flex gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <div className="w-2 h-2 rounded-full bg-yellow-500" />
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                  </div>
                </div>
                <div className="p-0 pointer-events-none scale-[0.85] origin-top">
                  {draftBlocks.length > 0 ? (
                    <BlockPreview blocks={draftBlocks} />
                  ) : (
                    <div className="p-20 text-center">
                      <Layout className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                      <p className="text-gray-400 text-sm">Select blocks on the left to build your draft preview.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
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
              onClick={() => setSections(null)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-gray-300 hover:bg-gray-50 text-gray-600 transition-all"
            >
              Back to Source
            </button>
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
              className="flex items-center gap-1.5 text-xs px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all"
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
