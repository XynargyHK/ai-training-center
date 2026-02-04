'use client'

import { useState } from 'react'
import { Globe, Check } from 'lucide-react'

interface LanguageSwitcherSSRProps {
  languages: { country: string; language_code: string }[]
  currentLang: string
  countryPath: string
}

const langNames: Record<string, string> = {
  en: 'English',
  tw: '繁體中文',
  cn: '简体中文',
  ja: '日本語',
  ko: '한국어',
  vi: 'Tiếng Việt'
}

export default function LanguageSwitcherSSR({ languages, currentLang, countryPath }: LanguageSwitcherSSRProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen) }}
        className="hidden md:flex items-center gap-1 p-2 text-black hover:opacity-80 transition-colors"
      >
        <Globe className="w-5 h-5" />
        <span className="text-xs font-medium uppercase">{currentLang}</span>
      </button>
      {isOpen && (
        <div className="absolute right-0 top-full mt-1 bg-white shadow-lg rounded-lg border border-gray-200 py-1 min-w-[140px] z-50">
          {languages.map((locale) => {
            const isActive = locale.language_code === currentLang
            return (
              <a
                key={locale.language_code}
                href={`${countryPath}?lang=${locale.language_code}`}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 ${isActive ? 'bg-gray-50 font-medium' : ''}`}
                onClick={() => setIsOpen(false)}
              >
                <span>{langNames[locale.language_code] || locale.language_code}</span>
                {isActive && <Check className="w-4 h-4 ml-auto text-green-600" />}
              </a>
            )
          })}
        </div>
      )}
    </div>
  )
}
