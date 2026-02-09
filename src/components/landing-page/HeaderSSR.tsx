'use client'

import { useState, useEffect } from 'react'
import { Menu, X, Search, User, ShoppingCart, Globe, Check } from 'lucide-react'
import { getFontClass, headlineFont, serifFont } from '@/lib/fonts'
import { useCart } from './CartProviderSSR'
import { supabase } from '@/lib/supabase'
import AccountModal from './AccountModal'

interface HeaderSSRProps {
  logoUrl: string
  logoText: string
  logoPosition: string
  navItems: { label: string; href: string }[]
  showSearch: boolean
  showAccount: boolean
  showCart: boolean
  primaryColor: string
  countryPath: string
  currentLang: string
  languages: { country: string; language_code: string }[]
  bodyFont?: string
  headingFont?: string
  accountUrl?: string
  country?: string
}

const langName: Record<string, string> = {
  en: 'English',
  'zh-Hant': '繁體中文',
  'zh-Hans': '简体中文',
  tw: '繁體中文',
  cn: '简体中文',
  ja: '日本語',
  ko: '한국어',
}

export default function HeaderSSR({
  logoUrl,
  logoText,
  logoPosition,
  navItems,
  showSearch,
  showAccount,
  showCart,
  primaryColor,
  countryPath,
  currentLang,
  languages,
  bodyFont,
  headingFont,
  accountUrl = '/account',
  country = 'US',
}: HeaderSSRProps) {
  console.log('[HeaderSSR] currentLang:', currentLang)
  const { cartItemCount, openCart } = useCart()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false)
  const [showAccountModal, setShowAccountModal] = useState(false)
  const [authUserName, setAuthUserName] = useState<string | null>(null)

  // Check auth state
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const meta = session.user.user_metadata || {}
        setAuthUserName(meta.full_name || meta.name || session.user.email?.split('@')[0] || null)
      }
    }
    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const meta = session.user.user_metadata || {}
        setAuthUserName(meta.full_name || meta.name || session.user.email?.split('@')[0] || null)
      } else {
        setAuthUserName(null)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  // Close language dropdown on outside click
  useEffect(() => {
    const handleClick = () => setShowLanguageDropdown(false)
    if (showLanguageDropdown) {
      document.addEventListener('click', handleClick)
      return () => document.removeEventListener('click', handleClick)
    }
  }, [showLanguageDropdown])

  const handleLanguageChange = (languageCode: string) => {
    setShowLanguageDropdown(false)
    setMobileMenuOpen(false)
    const currentPath = window.location.pathname
    // Always include lang parameter to ensure correct language is loaded
    window.location.href = `${currentPath}?lang=${languageCode}`
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Left side */}
          <div className="flex items-center gap-6">
            {/* Mobile menu button on left (if logo is center) */}
            {logoPosition === 'center' && (
              <button
                className="md:hidden p-2 text-black"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            )}

            {/* Logo on left */}
            {logoPosition === 'left' && (
              <a href={countryPath} className="flex items-center gap-2">
                {logoUrl ? (
                  <img src={logoUrl} alt={logoText} className="h-5 w-auto" />
                ) : (
                  <span className={`text-sm font-light tracking-[0.2em] uppercase ${serifFont.className}`} style={{ color: '#000000' }}>{logoText}</span>
                )}
              </a>
            )}

            {/* Desktop menu items */}
            <nav className="hidden md:flex items-center gap-6">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className={`text-black hover:opacity-80 transition-colors text-sm font-bold tracking-[0.15em] uppercase ${headlineFont.className}`}
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>

          {/* Center logo */}
          {logoPosition === 'center' && (
            <a href={countryPath} className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-2">
              {logoUrl ? (
                <img src={logoUrl} alt={logoText} className="h-5 w-auto" />
              ) : (
                <span className={`text-sm font-light tracking-[0.2em] uppercase ${serifFont.className}`} style={{ color: '#000000' }}>{logoText}</span>
              )}
            </a>
          )}

          {/* Right side: Search, Account, Cart, Language, Mobile menu */}
          <div className="flex items-center gap-3">
            {/* Search */}
            {showSearch && (
              <button className="hidden md:flex items-center p-2 text-black hover:opacity-80 transition-colors">
                <Search className="w-5 h-5" />
              </button>
            )}

            {/* Account */}
            {showAccount && (
              <button
                onClick={() => setShowAccountModal(true)}
                className="hidden md:flex items-center gap-1.5 p-2 text-black hover:opacity-80 transition-colors"
              >
                <User className="w-5 h-5" />
                {authUserName && (
                  <span className={`text-sm font-medium ${getFontClass(bodyFont)}`}>
                    Hi, {authUserName}
                  </span>
                )}
              </button>
            )}

            {/* Cart */}
            {showCart && (
              <button
                onClick={openCart}
                className="relative p-2 text-black hover:opacity-80 transition-colors"
              >
                <ShoppingCart className="w-5 h-5" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: primaryColor }}>
                    {cartItemCount}
                  </span>
                )}
              </button>
            )}

            {/* Language Selector */}
            {languages.length > 1 && (
              <div className="relative">
                <button
                  onClick={(e) => { e.stopPropagation(); setShowLanguageDropdown(!showLanguageDropdown) }}
                  className="hidden md:flex items-center gap-1 p-2 text-black hover:opacity-80 transition-colors"
                >
                  <Globe className="w-5 h-5" />
                  <span className="text-xs font-medium uppercase">{currentLang}</span>
                </button>
                {showLanguageDropdown && (
                  <div className="absolute right-0 top-full mt-1 bg-white shadow-lg rounded-lg border border-gray-200 py-1 min-w-[140px] z-50">
                    {languages.map((locale) => {
                      const isActive = locale.language_code === currentLang
                      return (
                        <button
                          key={locale.language_code}
                          onClick={() => handleLanguageChange(locale.language_code)}
                          className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 ${isActive ? 'bg-gray-50 font-medium' : ''}`}
                        >
                          <span>{langName[locale.language_code] || locale.language_code}</span>
                          {isActive && <Check className="w-4 h-4 ml-auto text-green-600" />}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Mobile menu button on right (if logo is left) */}
            {logoPosition === 'left' && (
              <button
                className="md:hidden p-2 text-black"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100">
          <nav className="flex flex-col py-4">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className={`px-4 py-3 text-black hover:bg-gray-50 transition-colors text-sm font-bold tracking-[0.15em] uppercase ${headlineFont.className}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </a>
            ))}
            {/* Mobile account link */}
            {showAccount && (
              <button
                className={`px-4 py-3 text-black hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm font-bold tracking-[0.15em] uppercase w-full text-left ${headlineFont.className}`}
                onClick={() => { setMobileMenuOpen(false); setShowAccountModal(true) }}
              >
                <User className="w-4 h-4" />
                {authUserName ? `Hi, ${authUserName}` : 'My Account'}
              </button>
            )}
            {/* Mobile language selector */}
            {languages.length > 1 && (
              <div className="border-t border-gray-100 mt-2 pt-2">
                <div className="px-4 py-2 text-xs text-gray-500 uppercase tracking-wider">Language</div>
                {languages.map((locale) => {
                  const isActive = locale.language_code === currentLang
                  return (
                    <button
                      key={`mobile-${locale.language_code}`}
                      onClick={() => handleLanguageChange(locale.language_code)}
                      className={`w-full px-4 py-3 text-left text-sm hover:bg-gray-50 flex items-center gap-2 ${isActive ? 'bg-gray-50 font-medium' : ''}`}
                    >
                      <span>{langName[locale.language_code] || locale.language_code}</span>
                      {isActive && <Check className="w-4 h-4 ml-auto text-green-600" />}
                    </button>
                  )
                })}
              </div>
            )}
          </nav>
        </div>
      )}

      {/* Account Modal */}
      <AccountModal
        isOpen={showAccountModal}
        onClose={() => setShowAccountModal(false)}
        onSignOut={() => setAuthUserName(null)}
        headingFont={headingFont}
        bodyFont={bodyFont}
        language={currentLang}
        country={country}
      />
    </header>
  )
}
