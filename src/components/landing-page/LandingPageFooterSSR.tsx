import { getFontClass } from '@/lib/fonts'

interface FooterLink {
  label: string
  url: string
}

interface FooterData {
  links?: FooterLink[]
  brand_name?: string
  company_name?: string
  contact_email?: string
  background_color?: string
  text_font_family?: string
  text_font_size?: string
  text_color?: string
  text_align?: 'left' | 'center' | 'right'
  text_bold?: boolean
  text_italic?: boolean
}

interface LandingPageFooterSSRProps {
  data?: FooterData
  businessUnitName?: string
  country?: string
  language?: string
  countryPath?: string
}

const defaultLinks: FooterLink[] = [
  { label: 'About Us', url: '?policy=about-us' },
  { label: 'Shipping', url: '?policy=shipping-policy' },
  { label: 'FAQ', url: '#faq' },
  { label: 'Terms', url: '?policy=terms-of-service' },
  { label: 'Privacy', url: '?policy=privacy-policy' },
  { label: 'Contact Us', url: '?policy=contact-us' },
]

export default function LandingPageFooterSSR({
  data,
  businessUnitName = 'Shop',
  country = 'US',
  language = 'en',
  countryPath = '/us'
}: LandingPageFooterSSRProps) {
  const footerData = data || {}
  const links = footerData.links || defaultLinks

  const bgColor = footerData.background_color || '#0D1B2A'
  const textFont = footerData.text_font_family || 'Josefin Sans'
  const textSize = footerData.text_font_size || '0.875rem'
  const textColor = footerData.text_color || '#ffffff'
  const textAlign = footerData.text_align || 'center'
  const textBold = footerData.text_bold || false
  const textItalic = footerData.text_italic || false

  const brandName = footerData.brand_name || businessUnitName
  const companyName = footerData.company_name || ''
  const contactEmail = footerData.contact_email || ''
  const currentYear = new Date().getFullYear()

  const buildUrl = (url: string) => {
    if (!url) return '#'
    if (url.startsWith('#') || url.startsWith('mailto:') || url.startsWith('http')) {
      return url
    }
    const localeParams = `&country=${country}&lang=${language}`
    if (url.startsWith('?policy=')) {
      const policyName = url.replace('?policy=', '')
      return `/livechat?businessUnit=skincoach&policy=${policyName}${localeParams}`
    }
    return url
  }

  const alignClass = textAlign === 'left' ? 'text-left' : textAlign === 'right' ? 'text-right' : 'text-center'
  const justifyClass = textAlign === 'left' ? 'justify-start' : textAlign === 'right' ? 'justify-end' : 'justify-center'

  return (
    <footer style={{ backgroundColor: bgColor }} className="py-8 px-4">
      <div className={`max-w-4xl mx-auto ${alignClass}`}>
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
                  className="opacity-70 hover:opacity-100 transition-opacity"
                >
                  {link.label}
                </a>
                {index < links.length - 1 && <span className="mx-2 opacity-50">&middot;</span>}
              </span>
            ))}
          </nav>
        </div>

        <div
          className={`space-y-1 opacity-60 ${getFontClass(textFont)}`}
          style={{
            fontSize: `calc(${textSize} * 0.85)`,
            color: textColor,
            fontWeight: textBold ? 'bold' : 'normal',
            fontStyle: textItalic ? 'italic' : 'normal'
          }}
        >
          <p>&copy; {currentYear} {brandName}&trade; All rights reserved.</p>
          {companyName && <p>Operated by {companyName}</p>}
          {contactEmail && <p>{contactEmail}</p>}
        </div>
      </div>
    </footer>
  )
}
