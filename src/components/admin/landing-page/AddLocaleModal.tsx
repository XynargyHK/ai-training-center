'use client'

import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'

interface AddLocaleModalProps {
  isOpen: boolean
  onClose: () => void
  businessUnitId: string
  existingLocales: Array<{ country: string; language_code: string }>
  onLocaleCreated: (country: string, language: string) => void
}

export default function AddLocaleModal({
  isOpen,
  onClose,
  businessUnitId,
  existingLocales,
  onLocaleCreated
}: AddLocaleModalProps) {
  const [country, setCountry] = useState('')
  const [language, setLanguage] = useState('')
  const [creationMode, setCreationMode] = useState<'empty' | 'translate' | 'copy'>('translate')
  const [sourceLocale, setSourceLocale] = useState('')
  const [creating, setCreating] = useState(false)

  const countries = [
    { code: 'US', name: 'United States' },
    { code: 'HK', name: 'Hong Kong' },
    { code: 'CN', name: 'China' },
    { code: 'TW', name: 'Taiwan' },
    { code: 'JP', name: 'Japan' },
    { code: 'KR', name: 'South Korea' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'FR', name: 'France' },
    { code: 'DE', name: 'Germany' },
    { code: 'ES', name: 'Spain' }
  ]

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'zh', name: '繁體中文 (Traditional Chinese)' },
    { code: 'cn', name: '简体中文 (Simplified Chinese)' },
    { code: 'ja', name: '日本語 (Japanese)' },
    { code: 'ko', name: '한국어 (Korean)' },
    { code: 'fr', name: 'Français (French)' },
    { code: 'de', name: 'Deutsch (German)' },
    { code: 'es', name: 'Español (Spanish)' }
  ]

  const handleCreate = async () => {
    if (!country || !language) {
      alert('Please select both country and language')
      return
    }

    // Check if locale already exists
    const exists = existingLocales.some(
      l => l.country === country && l.language_code === language
    )
    if (exists) {
      alert('This locale already exists')
      return
    }

    if (creationMode !== 'empty' && !sourceLocale) {
      alert('Please select a source locale to copy/translate from')
      return
    }

    setCreating(true)
    try {
      const response = await fetch('/api/landing-pages/create-locale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessUnitId,
          country,
          language,
          mode: creationMode,
          sourceCountry: sourceLocale ? sourceLocale.split('/')[0] : undefined,
          sourceLanguage: sourceLocale ? sourceLocale.split('/')[1] : undefined
        })
      })

      const data = await response.json()
      if (data.success) {
        onLocaleCreated(country, language)
        onClose()
        // Reset form
        setCountry('')
        setLanguage('')
        setCreationMode('translate')
        setSourceLocale('')
      } else {
        alert(data.error || 'Failed to create locale')
      }
    } catch (error) {
      console.error('Error creating locale:', error)
      alert('Failed to create locale')
    } finally {
      setCreating(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-lg shadow-xl max-w-md w-full border border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-xl font-semibold text-white">Add New Locale</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Country & Language Selection */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Country
              </label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
              >
                <option value="">Select country...</option>
                {countries.map(c => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
              >
                <option value="">Select language...</option>
                {languages.map(l => (
                  <option key={l.code} value={l.code}>{l.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Creation Mode */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">
              Create by:
            </label>
            <div className="space-y-3">
              {/* Translate option */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="mode"
                  value="translate"
                  checked={creationMode === 'translate'}
                  onChange={() => setCreationMode('translate')}
                  className="mt-1"
                />
                <div>
                  <div className="text-white font-medium">Translating from:</div>
                  <div className="text-sm text-slate-400">AI will translate content to target language</div>
                  {creationMode === 'translate' && (
                    <select
                      value={sourceLocale}
                      onChange={(e) => setSourceLocale(e.target.value)}
                      className="mt-2 w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm"
                    >
                      <option value="">Select source locale...</option>
                      {existingLocales.map(l => (
                        <option key={`${l.country}-${l.language_code}`} value={`${l.country}/${l.language_code}`}>
                          {l.country}/{l.language_code}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </label>

              {/* Copy option */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="mode"
                  value="copy"
                  checked={creationMode === 'copy'}
                  onChange={() => setCreationMode('copy')}
                  className="mt-1"
                />
                <div>
                  <div className="text-white font-medium">Duplicating from:</div>
                  <div className="text-sm text-slate-400">Copy as-is without translation</div>
                  {creationMode === 'copy' && (
                    <select
                      value={sourceLocale}
                      onChange={(e) => setSourceLocale(e.target.value)}
                      className="mt-2 w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm"
                    >
                      <option value="">Select source locale...</option>
                      {existingLocales.map(l => (
                        <option key={`${l.country}-${l.language_code}`} value={`${l.country}/${l.language_code}`}>
                          {l.country}/{l.language_code}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </label>

              {/* Empty option */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="mode"
                  value="empty"
                  checked={creationMode === 'empty'}
                  onChange={() => setCreationMode('empty')}
                  className="mt-1"
                />
                <div>
                  <div className="text-white font-medium">Starting empty</div>
                  <div className="text-sm text-slate-400">Create blank page from scratch</div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={creating || !country || !language}
            className="px-4 py-2 bg-violet-600 text-white rounded hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {creating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
