'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ShoppingCart, Menu, X, User, Search } from 'lucide-react'
import { serifFont, headlineFont } from '@/lib/fonts'

interface MenuItem {
  label: string
  url: string
  enabled: boolean
}

interface ShopHeaderProps {
  cartItemCount?: number
  onCartClick?: () => void
  businessUnitParam?: string
  businessUnitName?: string
  announcements?: string[]
  menuItems?: MenuItem[]
  logoUrl?: string
  logoText?: string
  logoPosition?: 'left' | 'center'
  showSearch?: boolean
  showAccount?: boolean
  showCart?: boolean
  accountUrl?: string
  cartUrl?: string
}

export default function ShopHeader({
  cartItemCount = 0,
  onCartClick,
  businessUnitParam = '',
  businessUnitName = 'SkinCoach',
  announcements = [],
  menuItems = [],
  logoUrl = '',
  logoText = '',
  logoPosition = 'center',
  showSearch = false,
  showAccount = true,
  showCart = true,
  accountUrl = '#account',
  cartUrl = ''
}: ShopHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [currentAnnouncementIndex, setCurrentAnnouncementIndex] = useState(0)

  // Rotate announcements
  useEffect(() => {
    if (announcements.length <= 1) return
    const interval = setInterval(() => {
      setCurrentAnnouncementIndex((prev) => (prev + 1) % announcements.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [announcements])

  const currentAnnouncement = announcements[currentAnnouncementIndex] || ''

  // Build URL with businessUnit param preserved
  const buildUrl = (path: string) => {
    if (businessUnitParam) {
      return `${path}?businessUnit=${businessUnitParam}`
    }
    return path
  }

  // Use menu items from landing page or fallback
  const navItems = menuItems.length > 0
    ? menuItems.filter(item => item.enabled).map(item => ({
        label: item.label,
        href: item.url.startsWith('#') ? item.url : buildUrl(item.url === '#' ? '/livechat' : item.url)
      }))
    : [
        { label: 'Home', href: buildUrl('/livechat') },
        { label: 'Shop', href: buildUrl('/livechat/shop') },
      ]

  return (
    <>
      {/* Announcement Bar */}
      {currentAnnouncement && (
        <div className="bg-[#1e293b] text-white text-center py-2 px-4 text-sm">
          {currentAnnouncement}
        </div>
      )}

      {/* Header Navigation */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Left - Menu Button (Mobile) / Nav Links (Desktop) */}
            <div className="flex items-center gap-8">
              {/* Mobile Menu Toggle */}
              <button
                className="md:hidden p-2 text-gray-700"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center gap-6">
                {navItems.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="text-gray-700 hover:text-[#4A90D9] transition-colors text-sm font-medium"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Center - Logo */}
            <Link
              href={buildUrl('/livechat')}
              className={`${logoPosition === 'center' ? 'absolute left-1/2 transform -translate-x-1/2' : ''}`}
            >
              {logoUrl ? (
                <img src={logoUrl} alt={logoText || businessUnitName} className="h-8" />
              ) : (
                <span className={`text-xl font-bold text-[#0D1B2A] ${headlineFont.className}`}>
                  {logoText || businessUnitName}
                </span>
              )}
            </Link>

            {/* Right side - Account & Cart */}
            <div className="flex items-center gap-4">
              {/* Search */}
              {showSearch && (
                <button className="hidden md:flex items-center gap-1 text-gray-700 hover:text-[#4A90D9] transition-colors">
                  <Search className="w-5 h-5" />
                </button>
              )}

              {/* Account */}
              {showAccount && (
                <Link
                  href={accountUrl}
                  className="hidden md:flex items-center gap-1 text-gray-700 hover:text-[#4A90D9] transition-colors"
                >
                  <User className="w-5 h-5" />
                  <span className="text-sm">Account</span>
                </Link>
              )}

              {/* Cart */}
              {showCart && (
                <button
                  className="relative p-2 text-gray-700 hover:text-[#4A90D9] transition-colors"
                  onClick={onCartClick}
                >
                  <ShoppingCart className="w-5 h-5" />
                  {cartItemCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-[#4A90D9] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                      {cartItemCount}
                    </span>
                  )}
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
                <Link
                  key={item.label}
                  href={item.href}
                  className="px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-[#4A90D9] transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              {showAccount && (
                <Link
                  href={accountUrl}
                  className="px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-[#4A90D9] transition-colors flex items-center gap-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <User className="w-5 h-5" />
                  My Account
                </Link>
              )}
            </nav>
          </div>
        )}
      </header>
    </>
  )
}
