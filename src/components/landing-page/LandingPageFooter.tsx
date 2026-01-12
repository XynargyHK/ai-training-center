'use client'

import Link from 'next/link'
import { getFontClass } from '@/lib/fonts'

interface FooterLink {
  label: string
  url: string
}

interface FooterData {
  // Links
  links?: FooterLink[]

  // Legal info
  brand_name?: string
  company_name?: string
  contact_email?: string

  // Styling
  background_color?: string
  text_font_family?: string
  text_font_size?: string
  text_color?: string
  text_align?: 'left' | 'center' | 'right'
  text_bold?: boolean
  text_italic?: boolean

  // Policy settings (used by PolicyContentView)
  website_url?: string
  contact_address?: string
  governing_state?: string
  effective_date?: string
  liability_cap?: string
  refund_days?: string
  refund_processing_days?: string
  warranty_months?: string
  restocking_fee?: string
  return_address?: string
  processing_days?: string
  domestic_shipping_days?: string
  international_shipping_days?: string
  free_shipping_threshold?: string
  shipping_carriers?: string
  cutoff_time?: string
  warehouse_location?: string
  policies?: {
    about_us?: { enabled: boolean }
    terms_of_service?: { enabled: boolean }
    privacy_policy?: { enabled: boolean }
    refund_policy?: { enabled: boolean }
    shipping_policy?: { enabled: boolean }
    guarantee?: { enabled: boolean }
  }
  policy_content?: Record<string, string>
}

interface LandingPageFooterProps {
  data?: FooterData
  businessUnitName?: string
  businessUnitParam?: string
}

// Default footer data
const defaultLinks: FooterLink[] = [
  { label: 'About Us', url: '?policy=about-us' },
  { label: 'Shipping', url: '?policy=shipping-policy' },
  { label: 'FAQ', url: '#faq' },
  { label: 'Terms', url: '?policy=terms-of-service' },
  { label: 'Privacy', url: '?policy=privacy-policy' },
]

export default function LandingPageFooter({
  data,
  businessUnitName = 'Shop',
  businessUnitParam = ''
}: LandingPageFooterProps) {
  const footerData = data || {}
  const links = footerData.links || defaultLinks

  // Styling
  const bgColor = footerData.background_color || '#0D1B2A'
  const textFont = footerData.text_font_family || 'Josefin Sans'
  const textSize = footerData.text_font_size || '0.875rem'
  const textColor = footerData.text_color || '#ffffff'
  const textAlign = footerData.text_align || 'center'
  const textBold = footerData.text_bold || false
  const textItalic = footerData.text_italic || false

  // Legal info
  const brandName = footerData.brand_name || businessUnitName
  const companyName = footerData.company_name || ''
  const contactEmail = footerData.contact_email || ''
  const currentYear = new Date().getFullYear()

  const buildUrl = (url: string) => {
    if (!url) return '#'
    if (url.startsWith('#') || url.startsWith('mailto:') || url.startsWith('http')) {
      return url
    }
    if (url.startsWith('?policy=')) {
      return businessUnitParam ? `/livechat?businessUnit=${businessUnitParam}&policy=${url.replace('?policy=', '')}` : `/livechat${url}`
    }
    return businessUnitParam ? `${url}?businessUnit=${businessUnitParam}` : url
  }

  const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>, url: string) => {
    if (url.startsWith('#') && url.length > 1) {
      e.preventDefault()
      const element = document.querySelector(url)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
  }

  const alignClass = textAlign === 'left' ? 'text-left' : textAlign === 'right' ? 'text-right' : 'text-center'
  const justifyClass = textAlign === 'left' ? 'justify-start' : textAlign === 'right' ? 'justify-end' : 'justify-center'

  return (
    <footer style={{ backgroundColor: bgColor }} className="py-8 px-4">
      <div className={`max-w-4xl mx-auto ${alignClass}`}>
        {/* Links Row */}
        <div className="mb-6">
          <nav
            className={`flex flex-wrap ${justifyClass} gap-x-2 gap-y-1 ${getFontClass(textFont)}`}
            style={{
              fontSize: textSize,
              color: textColor,
              fontWeight: textBold ? 'bold' : 'normal',
              fontStyle: textItalic ? 'italic' : 'normal'
            }}
          >
            {links.map((link, index) => (
              <span key={index} className="flex items-center">
                <a
                  href={buildUrl(link.url)}
                  onClick={(e) => handleAnchorClick(e, link.url)}
                  className="opacity-70 hover:opacity-100 transition-opacity"
                >
                  {link.label}
                </a>
                {index < links.length - 1 && <span className="mx-2 opacity-50">·</span>}
              </span>
            ))}
          </nav>
        </div>

        {/* Legal Bar */}
        <div
          className={`space-y-1 opacity-60 ${getFontClass(textFont)}`}
          style={{
            fontSize: `calc(${textSize} * 0.85)`,
            color: textColor,
            fontWeight: textBold ? 'bold' : 'normal',
            fontStyle: textItalic ? 'italic' : 'normal'
          }}
        >
          <p>© {currentYear} {brandName}™ All rights reserved.</p>
          {companyName && <p>Operated by {companyName}</p>}
          {contactEmail && <p>{contactEmail}</p>}
        </div>
      </div>
    </footer>
  )
}
