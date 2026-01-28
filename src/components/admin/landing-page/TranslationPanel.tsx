'use client'

import { useState } from 'react'
import { Languages, Loader2, Check, X, ChevronRight, ChevronDown } from 'lucide-react'

interface TranslationPanelProps {
  sourceData: any
  targetLanguage: string
  onTranslateSection: (sectionType: string, sectionIndex: number, translatedContent: any) => void
  isOpen: boolean
  onClose: () => void
}

export default function TranslationPanel({
  sourceData,
  targetLanguage,
  onTranslateSection,
  isOpen,
  onClose
}: TranslationPanelProps) {
  const [translatingSection, setTranslatingSection] = useState<string | null>(null)
  const [translatedSections, setTranslatedSections] = useState<Set<string>>(new Set())
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['hero_slides', 'blocks']))

  if (!isOpen || !sourceData) return null

  const languageNames: { [key: string]: string } = {
    zh: 'Traditional Chinese',
    cn: 'Simplified Chinese',
    en: 'English'
  }

  const translateSection = async (sectionType: string, sectionIndex: number, content: any) => {
    const key = sectionType + '-' + sectionIndex
    setTranslatingSection(key)
    
    try {
      const response = await fetch('/api/landing-pages/translate-section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, targetLanguage, context: 'skincare and beauty' })
      })
      
      const data = await response.json()
      if (data.success) {
        onTranslateSection(sectionType, sectionIndex, data.translated)
        setTranslatedSections(prev => new Set(prev).add(key))
      } else {
        alert('Translation failed')
      }
    } catch (error) {
      alert('Translation failed')
    } finally {
      setTranslatingSection(null)
    }
  }

  const translateAllInSection = async (sectionType: string, items: any[]) => {
    for (let i = 0; i < items.length; i++) {
      const key = sectionType + '-' + i
      if (!translatedSections.has(key)) {
        await translateSection(sectionType, i, items[i])
      }
    }
  }

  const toggleExpand = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev)
      if (newSet.has(section)) newSet.delete(section)
      else newSet.add(section)
      return newSet
    })
  }

  const getPreviewText = (item: any): string => {
    if (typeof item === 'string') return item.slice(0, 50)
    if (item.title) return item.title.slice(0, 50)
    if (item.heading) return item.heading.slice(0, 50)
    if (item.text) return item.text.slice(0, 50)
    return 'Item'
  }

  const renderSectionItems = (sectionType: string, items: any[], sectionLabel: string) => {
    if (!items || items.length === 0) return null
    
    const isExpanded = expandedSections.has(sectionType)
    const allTranslated = items.every((_, i) => translatedSections.has(sectionType + '-' + i))
    
    return (
      <div className="border border-gray-200 rounded-none overflow-hidden">
        <div className="flex items-center justify-between p-3 bg-gray-100 cursor-pointer" onClick={() => toggleExpand(sectionType)}>
          <div className="flex items-center gap-2">
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            <span className="font-medium">{sectionLabel}</span>
            <span className="text-gray-500 text-sm">({items.length})</span>
            {allTranslated && <Check className="w-4 h-4 text-green-600" />}
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); translateAllInSection(sectionType, items) }}
            disabled={translatingSection !== null || allTranslated}
            className="px-2 py-1 text-xs bg-violet-50 border border-violet-200 hover:bg-violet-100 rounded-none disabled:opacity-50"
          >
            Translate All
          </button>
        </div>
        
        {isExpanded && (
          <div className="divide-y divide-gray-200">
            {items.map((item, index) => {
              const key = sectionType + '-' + index
              const isTranslating = translatingSection === key
              const isTranslated = translatedSections.has(key)
              
              return (
                <div key={index} className="flex items-center justify-between p-3 bg-white">
                  <div className="flex-1 min-w-0">
                    <span className="text-gray-500 text-xs mr-2">#{index + 1}</span>
                    <span className="text-sm truncate">{getPreviewText(item)}...</span>
                  </div>
                  <button
                    onClick={() => translateSection(sectionType, index, item)}
                    disabled={isTranslating || isTranslated}
                    className={`ml-2 px-3 py-1 text-xs rounded-none flex items-center gap-1 ${isTranslated ? 'bg-green-50 text-green-600' : 'bg-violet-50 border border-violet-200 hover:bg-violet-100'} disabled:opacity-50`}
                  >
                    {isTranslating ? <><Loader2 className="w-3 h-3 animate-spin" />Translating...</> : isTranslated ? <><Check className="w-3 h-3" />Done</> : <><Languages className="w-3 h-3" />Translate</>}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-white border-l border-gray-200 shadow-sm z-40 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Languages className="w-5 h-5 text-violet-600" />
          <h3 className="font-semibold text-gray-800">Translation Assistant</h3>
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><X className="w-5 h-5" /></button>
      </div>
      
      <div className="p-4 bg-gray-50 border-b border-gray-200">
        <p className="text-sm text-gray-600">Translating to: <span className="font-medium text-violet-600">{languageNames[targetLanguage] || targetLanguage}</span></p>
        <p className="text-xs text-gray-500 mt-1">Click Translate on each section one by one.</p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {renderSectionItems('hero_slides', sourceData.hero_slides || [], 'Hero Slides')}
        {renderSectionItems('announcements', sourceData.announcements || [], 'Announcements')}
        {renderSectionItems('blocks', sourceData.blocks || [], 'Content Blocks')}
        {renderSectionItems('menu_items', sourceData.menu_items || [], 'Menu Items')}
        {renderSectionItems('footer_columns', sourceData.footer_columns || [], 'Footer Columns')}
      </div>
      
      <div className="p-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">{translatedSections.size} sections translated</p>
      </div>
    </div>
  )
}
