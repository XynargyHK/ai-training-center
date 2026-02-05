'use client'

import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { getFontClass } from '@/lib/fonts'

// Policy templates
import termsOfService from '@/data/policy-templates/terms-of-service.json'
import privacyPolicy from '@/data/policy-templates/privacy-policy.json'
import refundPolicy from '@/data/policy-templates/refund-policy.json'
import shippingPolicy from '@/data/policy-templates/shipping-policy.json'

const policyTemplates: Record<string, any> = {
  'terms-of-service': termsOfService,
  'terms_of_service': termsOfService,
  'privacy-policy': privacyPolicy,
  'privacy_policy': privacyPolicy,
  'refund-policy': refundPolicy,
  'refund_policy': refundPolicy,
  'shipping-policy': shippingPolicy,
  'shipping_policy': shippingPolicy,
}

const policyTitles: Record<string, string> = {
  'about-us': 'About Us',
  'about_us': 'About Us',
  'terms-of-service': 'Terms of Service',
  'terms_of_service': 'Terms of Service',
  'privacy-policy': 'Privacy Policy',
  'privacy_policy': 'Privacy Policy',
  'refund-policy': 'Refund Policy',
  'refund_policy': 'Refund Policy',
  'shipping-policy': 'Shipping Policy',
  'shipping_policy': 'Shipping Policy',
  'guarantee': 'Guarantee',
  'contact-us': 'Contact Us',
  'contact_us': 'Contact Us',
}

function buildContactUsHtml(policyData?: PolicyData): string | null {
  const brandName = policyData?.brand_name
  const companyName = policyData?.company_name
  const contactEmail = policyData?.contact_email
  const websiteUrl = policyData?.website_url
  const address = policyData?.contact_address
  const governingState = policyData?.governing_state

  if (!brandName && !companyName && !contactEmail) return null

  const lines: string[] = []
  lines.push(`<h2 class="text-2xl font-semibold mb-4 mt-8 text-gray-800">Get in Touch</h2>`)
  lines.push(`<p class="mb-4 text-gray-700 leading-relaxed">We'd love to hear from you. Reach out to us using the information below.</p>`)

  lines.push(`<div class="bg-gray-50 rounded-lg p-6 mt-6 space-y-4">`)
  if (brandName) lines.push(`<div><strong>Brand:</strong> ${brandName}</div>`)
  if (companyName) lines.push(`<div><strong>Operated by:</strong> ${companyName}</div>`)
  if (contactEmail) lines.push(`<div><strong>Email:</strong> <a href="mailto:${contactEmail}" class="text-blue-600 hover:underline">${contactEmail}</a></div>`)
  if (websiteUrl) lines.push(`<div><strong>Website:</strong> <a href="${websiteUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">${websiteUrl}</a></div>`)
  if (address) lines.push(`<div><strong>Address:</strong> ${address}</div>`)
  if (governingState) lines.push(`<div><strong>Jurisdiction:</strong> ${governingState}</div>`)
  lines.push(`</div>`)

  return lines.join('\n')
}

interface PolicyData {
  company_name?: string
  brand_name?: string
  website_url?: string
  contact_email?: string
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
  policy_content?: Record<string, string>
}

interface PolicyContentViewProps {
  policyType: string
  policyData?: PolicyData
  backUrl: string
}

// Helper to render policy content with placeholders replaced
function renderPolicyContent(template: any, fieldValues: Record<string, string>): string {
  let content = template.content

  for (const field of template.fields) {
    const value = fieldValues[field.key] || field.placeholder
    const regex = new RegExp(`\\{\\{${field.key}\\}\\}`, 'g')
    content = content.replace(regex, value)
  }

  return content
}

// Convert markdown to HTML
function markdownToHtml(markdown: string): string {
  return markdown
    .replace(/^# (.+)$/gm, '<h1 class="text-3xl font-bold mb-6 mt-8 text-gray-900">$1</h1>')
    .replace(/^## (.+)$/gm, '<h2 class="text-2xl font-semibold mb-4 mt-8 text-gray-800">$1</h2>')
    .replace(/^### (.+)$/gm, '<h3 class="text-xl font-medium mb-3 mt-6 text-gray-800">$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^\| (.+) \|$/gm, (match, content) => {
      const cells = content.split(' | ').map((cell: string) => `<td class="border border-gray-300 px-4 py-2">${cell.trim()}</td>`).join('')
      return `<tr>${cells}</tr>`
    })
    .replace(/^- (.+)$/gm, '<li class="ml-6 mb-1 list-disc">$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-6 mb-1 list-decimal">$2</li>')
    .replace(/^---$/gm, '<hr class="my-8 border-gray-200" />')
    .replace(/\n\n/g, '</p><p class="mb-4 text-gray-700 leading-relaxed">')
    .replace(/\n/g, '<br />')
}

// Helper to replace placeholders in custom content
function replacePlaceholders(content: string, policyData?: PolicyData): string {
  const replacements: Record<string, string> = {
    '{{COMPANY_NAME}}': policyData?.company_name || '[Company Name]',
    '{{BRAND_NAME}}': policyData?.brand_name || '[Brand Name]',
    '{{WEBSITE_URL}}': policyData?.website_url || '[Website URL]',
    '{{CONTACT_EMAIL}}': policyData?.contact_email || '[Contact Email]',
    '{{CONTACT_ADDRESS}}': policyData?.contact_address || '[Business Address]',
    '{{GOVERNING_STATE}}': policyData?.governing_state || '[State/Country]',
    '{{EFFECTIVE_DATE}}': policyData?.effective_date || new Date().toLocaleDateString(),
    '{{LIABILITY_CAP}}': policyData?.liability_cap || '$500',
    '{{REFUND_DAYS}}': policyData?.refund_days || '30',
    '{{REFUND_PROCESSING_DAYS}}': policyData?.refund_processing_days || '7-10',
    '{{WARRANTY_MONTHS}}': policyData?.warranty_months || '12',
    '{{RESTOCKING_FEE}}': policyData?.restocking_fee || '$10',
    '{{RETURN_ADDRESS}}': policyData?.return_address || policyData?.contact_address || '[Business Address]',
    '{{PROCESSING_DAYS}}': policyData?.processing_days || '1-3',
    '{{DOMESTIC_SHIPPING_DAYS}}': policyData?.domestic_shipping_days || '2-5 business days',
    '{{INTERNATIONAL_SHIPPING_DAYS}}': policyData?.international_shipping_days || '7-14 business days',
    '{{FREE_SHIPPING_THRESHOLD}}': policyData?.free_shipping_threshold || '$50',
    '{{SHIPPING_CARRIERS}}': policyData?.shipping_carriers || 'USPS, DHL, FedEx',
    '{{CUTOFF_TIME}}': policyData?.cutoff_time || '2:00 PM EST',
    '{{WAREHOUSE_LOCATION}}': policyData?.warehouse_location || 'United States',
    '{{CURRENCY}}': 'USD',
    '{{DATA_RETENTION_DAYS}}': '365 days',
  }
  let result = content
  for (const [placeholder, value] of Object.entries(replacements)) {
    result = result.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value)
  }
  return result
}

export default function PolicyContentView({ policyType, policyData, backUrl }: PolicyContentViewProps) {
  const template = policyTemplates[policyType]
  const title = policyTitles[policyType] || 'Policy'

  // Check for custom content first
  const customContent = policyData?.policy_content?.[policyType]

  // Handle contact-us: auto-generate from legal bar fields
  const isContactUs = policyType === 'contact-us' || policyType === 'contact_us'
  const contactUsHtml = isContactUs ? buildContactUsHtml(policyData) : null

  // If no template AND no custom content AND not contact-us, show not found
  if (!template && !customContent && !contactUsHtml) {
    return (
      <div className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Policy Not Found</h1>
          <p className="text-gray-600 mb-6">The requested policy does not exist.</p>
          <Link
            href={backUrl}
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  // Map field values for template rendering
  const getFieldValues = (): Record<string, string> => ({
    COMPANY_NAME: policyData?.company_name || '[Company Name]',
    BRAND_NAME: policyData?.brand_name || '[Brand Name]',
    WEBSITE_URL: policyData?.website_url || '[Website URL]',
    CONTACT_EMAIL: policyData?.contact_email || '[Contact Email]',
    CONTACT_ADDRESS: policyData?.contact_address || '[Business Address]',
    GOVERNING_STATE: policyData?.governing_state || '[State/Country]',
    EFFECTIVE_DATE: policyData?.effective_date || '[Effective Date]',
    LIABILITY_CAP: policyData?.liability_cap || '$500',
    REFUND_DAYS: policyData?.refund_days || '30',
    REFUND_PROCESSING_DAYS: policyData?.refund_processing_days || '7-10',
    WARRANTY_MONTHS: policyData?.warranty_months || '12',
    RESTOCKING_FEE: policyData?.restocking_fee || '$10',
    RETURN_ADDRESS: policyData?.return_address || policyData?.contact_address || '[Business Address]',
    PROCESSING_DAYS: policyData?.processing_days || '1-3',
    DOMESTIC_SHIPPING_DAYS: policyData?.domestic_shipping_days || '2-5 business days',
    INTERNATIONAL_SHIPPING_DAYS: policyData?.international_shipping_days || '7-14 business days',
    FREE_SHIPPING_THRESHOLD: policyData?.free_shipping_threshold || '$50',
    SHIPPING_CARRIERS: policyData?.shipping_carriers || 'USPS, DHL, FedEx',
    CUTOFF_TIME: policyData?.cutoff_time || '2:00 PM EST',
    WAREHOUSE_LOCATION: policyData?.warehouse_location || 'United States',
    DATA_RETENTION_DAYS: '365 days',
  })

  // Check if content looks like HTML (from WYSIWYG editor)
  const isHtmlContent = (content: string): boolean => {
    return content.includes('<') && content.includes('>')
  }

  // Use custom content if available, otherwise use template
  let policyContent: string
  let isHtml = false

  if (customContent) {
    // Custom content from WYSIWYG editor is already HTML
    policyContent = replacePlaceholders(customContent, policyData)
    isHtml = isHtmlContent(customContent)
  } else if (contactUsHtml) {
    // Auto-generated contact us page from legal bar fields
    policyContent = contactUsHtml
    isHtml = true
  } else if (template) {
    // Template content is markdown
    policyContent = renderPolicyContent(template, getFieldValues())
    isHtml = false
  } else {
    policyContent = ''
  }

  // Prepare final HTML content
  const finalHtml = isHtml
    ? policyContent // Already HTML from WYSIWYG editor
    : markdownToHtml(policyContent) // Convert markdown to HTML

  return (
    <div className="py-8 px-4 bg-white min-h-[60vh]">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Link
          href={backUrl}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className={`text-sm font-medium ${getFontClass('Josefin Sans')}`}>Back to Home</span>
        </Link>

        {/* Policy Title */}
        <h1 className={`text-3xl md:text-4xl font-light tracking-wide mb-8 text-gray-900 ${getFontClass('Josefin Sans')}`}>
          {title}
        </h1>

        {/* Policy Content */}
        <div
          className="prose prose-gray max-w-none policy-content"
          dangerouslySetInnerHTML={{
            __html: isHtml ? finalHtml : `<p class="mb-4 text-gray-700 leading-relaxed">${finalHtml}</p>`
          }}
        />

        {/* Styles for WYSIWYG content */}
        <style jsx global>{`
          .policy-content h1 { font-size: 2rem; font-weight: bold; margin-top: 1.5rem; margin-bottom: 1rem; color: #111827; }
          .policy-content h2 { font-size: 1.5rem; font-weight: 600; margin-top: 1.5rem; margin-bottom: 0.75rem; color: #1f2937; }
          .policy-content h3 { font-size: 1.25rem; font-weight: 500; margin-top: 1rem; margin-bottom: 0.5rem; color: #1f2937; }
          .policy-content p { margin-bottom: 1rem; line-height: 1.7; color: #374151; }
          .policy-content ul, .policy-content ol { margin-left: 1.5rem; margin-bottom: 1rem; }
          .policy-content li { margin-bottom: 0.25rem; color: #374151; }
          .policy-content ul li { list-style-type: disc; }
          .policy-content ol li { list-style-type: decimal; }
          .policy-content strong { font-weight: 600; }
          .policy-content em { font-style: italic; }
          .policy-content u { text-decoration: underline; }
        `}</style>

        {/* Bottom Back Link */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <Link
            href={backUrl}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
