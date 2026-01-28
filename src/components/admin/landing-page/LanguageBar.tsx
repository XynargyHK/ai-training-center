'use client'

import { useState, useEffect, useRef } from 'react'
import { Globe, Plus, Trash2, RefreshCw, ChevronDown } from 'lucide-react'

interface LandingPageLocale {
  id: string
  country: string
  language_code: string
  is_active: boolean
  updated_at: string
}

interface LanguageBarProps {
  businessUnitId: string
  currentCountry: string
  currentLanguage: string
  filterCountry?: string
  onLocaleChange: (country: string, language: string) => void
  onAddLocale: () => void
  onSyncRequest?: (sourceCountry: string, sourceLanguage: string) => void
  onDeleteLocale?: (country: string, language: string) => void
}

export default function LanguageBar({
  businessUnitId,
  currentCountry,
  currentLanguage,
  filterCountry,
  onLocaleChange,
  onAddLocale,
  onSyncRequest,
  onDeleteLocale
}: LanguageBarProps) {
  const [locales, setLocales] = useState<LandingPageLocale[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadLocales()
  }, [businessUnitId])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const loadLocales = async () => {
    try {
      const response = await fetch(`/api/landing-pages/locales?businessUnit=${businessUnitId}`)
      const data = await response.json()
      if (data.success) {
        setLocales(data.locales || [])
      }
    } catch (error) {
      console.error('Failed to load locales:', error)
    } finally {
      setLoading(false)
    }
  }

  const getFlagEmoji = (country: string) => {
    const flags: { [key: string]: string } = {
      'US': '🇺🇸', 'HK': '🇭🇰', 'CN': '🇨🇳', 'TW': '🇹🇼',
      'JP': '🇯🇵', 'KR': '🇰🇷', 'GB': '🇬🇧', 'FR': '🇫🇷',
      'DE': '🇩🇪', 'ES': '🇪🇸'
    }
    return flags[country] || '🌍'
  }

  const getLanguageName = (code: string) => {
    const names: { [key: string]: string } = {
      'en': 'EN', 'tw': '繁', 'cn': '简',
      'ja': '日', 'ko': '한', 'fr': 'FR',
      'de': 'DE', 'es': 'ES'
    }
    return names[code] || code
  }

  const displayedLocales = filterCountry
    ? locales.filter(l => l.country === filterCountry)
    : locales

  const showSync = onSyncRequest && !(currentCountry === 'US' && currentLanguage === 'en')

  if (loading) {
    return (
      <div className="flex items-center gap-1 text-gray-500 text-xs py-1">
        <Globe className="w-3 h-3 animate-spin" />
        <span>Loading...</span>
      </div>
    )
  }

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-none px-2 py-1 text-xs text-gray-800 transition-colors"
      >
        <Globe className="w-3 h-3 text-gray-500" />
        <span>{getFlagEmoji(currentCountry)} {currentCountry}/{getLanguageName(currentLanguage)}</span>
        <ChevronDown className={`w-3 h-3 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 mt-1 w-48 bg-white border border-gray-200 rounded-none shadow-sm z-50 py-1">
          {/* Locale options */}
          {displayedLocales.map((locale) => {
            const isActive = locale.country === currentCountry && locale.language_code === currentLanguage
            return (
              <div
                key={`${locale.country}-${locale.language_code}`}
                className={`flex items-center justify-between px-2 py-1 text-xs cursor-pointer transition-colors ${
                  isActive ? 'bg-violet-50 text-violet-600' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <button
                  onClick={() => {
                    onLocaleChange(locale.country, locale.language_code)
                    setOpen(false)
                  }}
                  className="flex-1 text-left"
                >
                  {getFlagEmoji(locale.country)} {locale.country}/{getLanguageName(locale.language_code)}
                  {isActive && ' ✓'}
                </button>
                {onDeleteLocale && displayedLocales.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (confirm(`Delete ${locale.country}/${locale.language_code} locale?`)) {
                        onDeleteLocale(locale.country, locale.language_code)
                        setOpen(false)
                      }
                    }}
                    className="p-0.5 text-gray-400 hover:text-red-600 transition-colors"
                    title="Delete locale"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            )
          })}

          {/* Divider */}
          <div className="border-t border-gray-200 my-1" />

          {/* Add locale */}
          <button
            onClick={() => {
              onAddLocale()
              setOpen(false)
            }}
            className="w-full flex items-center gap-1.5 px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <Plus className="w-3 h-3" />
            Add Language
          </button>

          {/* Sync from US */}
          {showSync && (
            <button
              onClick={() => {
                onSyncRequest!('US', 'en')
                setOpen(false)
              }}
              className="w-full flex items-center gap-1.5 px-2 py-1 text-xs text-amber-600 hover:bg-gray-100 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              Sync from US/EN
            </button>
          )}
        </div>
      )}
    </div>
  )
}
