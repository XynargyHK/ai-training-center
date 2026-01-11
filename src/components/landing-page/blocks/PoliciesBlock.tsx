'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

// Policy templates
import termsOfService from '@/data/policy-templates/terms-of-service.json'
import privacyPolicy from '@/data/policy-templates/privacy-policy.json'
import refundPolicy from '@/data/policy-templates/refund-policy.json'
import shippingPolicy from '@/data/policy-templates/shipping-policy.json'

const policyTemplates = {
  terms_of_service: termsOfService,
  privacy_policy: privacyPolicy,
  refund_policy: refundPolicy,
  shipping_policy: shippingPolicy,
}

type PolicyType = keyof typeof policyTemplates

interface PolicyData {
  company_name: string
  brand_name: string
  website_url: string
  contact_email: string
  contact_address: string
  governing_state: string
  effective_date: string
  liability_cap: string
  refund_days: string
  refund_processing_days: string
  warranty_months: string
  restocking_fee: string
  return_address: string
  processing_days: string
  domestic_shipping_days: string
  international_shipping_days: string
  free_shipping_threshold: string
  shipping_carriers: string
  cutoff_time: string
  warehouse_location: string
  policies: {
    terms_of_service: { enabled: boolean; content: string }
    privacy_policy: { enabled: boolean; content: string }
    refund_policy: { enabled: boolean; content: string }
    shipping_policy: { enabled: boolean; content: string }
  }
}

interface PoliciesBlockProps {
  data: PolicyData
  anchorId?: string
}

// Helper to render policy content with placeholders replaced
function renderPolicyContent(template: typeof termsOfService, fieldValues: Record<string, string>): string {
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

export default function PoliciesBlock({ data, anchorId }: PoliciesBlockProps) {
  const [expandedPolicy, setExpandedPolicy] = useState<PolicyType | null>(null)

  // Map field values for template rendering
  const getFieldValues = (): Record<string, string> => ({
    COMPANY_NAME: data.company_name || '[Company Name]',
    BRAND_NAME: data.brand_name || '[Brand Name]',
    WEBSITE_URL: data.website_url || '[Website URL]',
    CONTACT_EMAIL: data.contact_email || '[Contact Email]',
    CONTACT_ADDRESS: data.contact_address || '[Business Address]',
    GOVERNING_STATE: data.governing_state || '[State/Country]',
    EFFECTIVE_DATE: data.effective_date || '[Effective Date]',
    LIABILITY_CAP: data.liability_cap || '$500',
    REFUND_DAYS: data.refund_days || '30',
    REFUND_PROCESSING_DAYS: data.refund_processing_days || '7-10',
    WARRANTY_MONTHS: data.warranty_months || '12',
    RESTOCKING_FEE: data.restocking_fee || '$10',
    RETURN_ADDRESS: data.return_address || data.contact_address || '[Business Address]',
    PROCESSING_DAYS: data.processing_days || '1-3',
    DOMESTIC_SHIPPING_DAYS: data.domestic_shipping_days || '2-5 business days',
    INTERNATIONAL_SHIPPING_DAYS: data.international_shipping_days || '7-14 business days',
    FREE_SHIPPING_THRESHOLD: data.free_shipping_threshold || '$50',
    SHIPPING_CARRIERS: data.shipping_carriers || 'USPS, DHL, FedEx',
    CUTOFF_TIME: data.cutoff_time || '2:00 PM EST',
    WAREHOUSE_LOCATION: data.warehouse_location || 'United States',
    DATA_RETENTION_DAYS: '365 days',
  })

  const getPolicyContent = (policyType: PolicyType): string => {
    const customContent = data.policies?.[policyType]?.content
    if (customContent) return customContent

    const template = policyTemplates[policyType]
    return renderPolicyContent(template, getFieldValues())
  }

  const policyLabels: Record<PolicyType, { title: string; icon: string }> = {
    terms_of_service: { title: 'Terms of Service', icon: '📜' },
    privacy_policy: { title: 'Privacy Policy', icon: '🔒' },
    refund_policy: { title: 'Refund Policy', icon: '💸' },
    shipping_policy: { title: 'Shipping Policy', icon: '📦' },
  }

  const enabledPolicies = (Object.keys(policyLabels) as PolicyType[]).filter(
    (policyType) => data.policies?.[policyType]?.enabled !== false
  )

  if (enabledPolicies.length === 0) {
    return null
  }

  return (
    <section id={anchorId} className="py-12 px-4 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="space-y-3">
          {enabledPolicies.map((policyType) => {
            const isExpanded = expandedPolicy === policyType
            const policyInfo = policyLabels[policyType]

            return (
              <div
                key={policyType}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
              >
                {/* Header */}
                <button
                  onClick={() => setExpandedPolicy(isExpanded ? null : policyType)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{policyInfo.icon}</span>
                    <span className="font-semibold text-gray-900">{policyInfo.title}</span>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  )}
                </button>

                {/* Content */}
                {isExpanded && (
                  <div className="border-t border-gray-200 p-6 bg-white">
                    <div
                      className="prose prose-gray max-w-none"
                      dangerouslySetInnerHTML={{
                        __html: markdownToHtml(getPolicyContent(policyType))
                      }}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
