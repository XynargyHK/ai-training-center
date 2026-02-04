'use client'

import { useState } from 'react'
import { Menu, X } from 'lucide-react'

interface MobileMenuSSRProps {
  navItems: { label: string; href: string }[]
  languages?: { country: string; language_code: string }[]
  currentLang?: string
  countryPath?: string
}

const langName: Record<string, string> = {
  en: 'English',
  'zh-Hant': '繁體中文',
  'zh-Hans': '简体中文',
}

export default function MobileMenuSSR({ navItems, languages, currentLang, countryPath }: MobileMenuSSRProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Hamburger button — mobile only */}
      <button
        className="md:hidden p-2 text-gray-700"
        onClick={() => setOpen(!open)}
        aria-label="Toggle menu"
      >
        {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile dropdown menu */}
      {open && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white border-t border-gray-100 shadow-lg z-50">
          <nav className="flex flex-col py-4">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors text-sm"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </a>
            ))}
          </nav>
          {/* Language selector in mobile menu */}
          {languages && languages.length > 1 && (
            <div className="border-t border-gray-100 pt-2 pb-4">
              <div className="px-4 py-2 text-xs text-gray-500 uppercase">Language</div>
              {languages.map((locale) => {
                const isActive = locale.language_code === currentLang
                const href = locale.language_code === 'en'
                  ? countryPath || '/'
                  : `${countryPath}?lang=${locale.language_code}`
                return (
                  <a
                    key={locale.language_code}
                    href={href}
                    className={`block w-full px-4 py-3 text-sm text-left ${isActive ? 'font-bold text-black' : 'text-gray-700'} hover:bg-gray-50 transition-colors`}
                    onClick={() => setOpen(false)}
                  >
                    {langName[locale.language_code] || locale.language_code}
                  </a>
                )
              })}
            </div>
          )}
        </div>
      )}
    </>
  )
}
