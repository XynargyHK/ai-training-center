'use client'

import { useState, useEffect } from 'react'
import { Globe, Plus, Trash2 } from 'lucide-react'

interface ProductLocale {
  country: string
  language_code: string
  product_count: number
}

interface ProductLanguageBarProps {
  businessUnitId: string
  currentCountry: string
  currentLanguage: string
  onLocaleChange: (country: string, language: string) => void
  onAddLocale: () => void
  onDeleteLocale?: (country: string, language: string) => void
}

export default function ProductLanguageBar({
  businessUnitId,
  currentCountry,
  currentLanguage,
  onLocaleChange,
  onAddLocale,
  onDeleteLocale
}: ProductLanguageBarProps) {
  const [locales, setLocales] = useState<ProductLocale[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLocales()
  }, [businessUnitId])

  const loadLocales = async () => {
    try {
      const response = await fetch(`/api/ecommerce/products/locales?businessUnit=${businessUnitId}`)
      const data = await response.json()
      if (data.success) {
        setLocales(data.locales || [])
      }
    } catch (error) {
      console.error('Failed to load product locales:', error)
    } finally {
      setLoading(false)
    }
  }

  const getFlagEmoji = (country: string) => {
    const flags: { [key: string]: string } = {
      'US': '🇺🇸',
      'HK': '🇭🇰',
      'CN': '🇨🇳',
      'TW': '🇹🇼',
      'JP': '🇯🇵',
      'KR': '🇰🇷',
      'GB': '🇬🇧',
      'FR': '🇫🇷',
      'DE': '🇩🇪',
      'ES': '🇪🇸'
    }
    return flags[country] || '🌍'
  }

  const getLanguageName = (code: string) => {
    const names: { [key: string]: string } = {
      'en': 'English',
      'tw': '繁體中文',
      'cn': '简体中文',
      'ja': '日本語',
      'ko': '한국어',
      'fr': 'Français',
      'de': 'Deutsch',
      'es': 'Español'
    }
    return names[code] || code
  }

  if (loading) {
    return (
      <div className="bg-slate-800 border-b border-slate-700 px-6 py-3">
        <div className="flex items-center gap-2 text-slate-400">
          <Globe className="w-4 h-4 animate-spin" />
          <span className="text-sm">Loading locales...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-slate-800 border-b border-slate-700 px-6 py-3">
      <div className="flex items-center justify-between">
        {/* Left: Language tabs */}
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-slate-400" />
          <span className="text-sm text-slate-400 mr-2">Product Languages:</span>

          <div className="flex items-center gap-1">
            {locales.map((locale) => {
              const isActive = locale.country === currentCountry && locale.language_code === currentLanguage
              return (
                <div key={`${locale.country}-${locale.language_code}`} className="flex items-center">
                  <button
                    onClick={() => onLocaleChange(locale.country, locale.language_code)}
                    className={`
                      px-3 py-1.5 rounded-l text-sm font-medium transition-colors
                      ${isActive
                        ? 'bg-violet-600 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }
                    `}
                  >
                    {getFlagEmoji(locale.country)} {locale.country}/{getLanguageName(locale.language_code)}
                    <span className="ml-1 text-xs opacity-70">({locale.product_count})</span>
                  </button>
                  {onDeleteLocale && locales.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (confirm(`Delete all ${locale.country}/${locale.language_code} products?`)) {
                          onDeleteLocale(locale.country, locale.language_code)
                        }
                      }}
                      className={`
                        px-2 py-1.5 rounded-r text-sm transition-colors border-l border-slate-600
                        ${isActive
                          ? 'bg-violet-700 text-violet-200 hover:bg-red-600 hover:text-white'
                          : 'bg-slate-700 text-slate-400 hover:bg-red-600 hover:text-white'
                        }
                      `}
                      title="Delete locale"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )
            })}

            <button
              onClick={onAddLocale}
              className="px-3 py-1.5 rounded text-sm font-medium bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              Add
            </button>
          </div>
        </div>

        {/* Right: Current locale info */}
        <div className="text-sm text-slate-400">
          Currently editing: <span className="text-white font-medium">
            {getFlagEmoji(currentCountry)} {currentCountry}/{getLanguageName(currentLanguage)}
          </span>
        </div>
      </div>
    </div>
  )
}
