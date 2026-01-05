'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, Save, Eye, EyeOff } from 'lucide-react'
import type { LandingPageBlock } from '@/types/landing-page-blocks'

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

interface PoliciesBlockEditorProps {
  block: LandingPageBlock
  onUpdate: (block: LandingPageBlock) => void
}

interface PolicyData {
  // Common fields
  company_name: string
  brand_name: string
  website_url: string
  contact_email: string
  contact_address: string
  governing_state: string
  effective_date: string
  // Policy-specific fields
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
  // Custom content overrides
  policies: {
    terms_of_service: { enabled: boolean; content: string }
    privacy_policy: { enabled: boolean; content: string }
    refund_policy: { enabled: boolean; content: string }
    shipping_policy: { enabled: boolean; content: string }
  }
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

export default function PoliciesBlockEditor({ block, onUpdate }: PoliciesBlockEditorProps) {
  const [expandedPolicy, setExpandedPolicy] = useState<PolicyType | null>(null)
  const [previewMode, setPreviewMode] = useState<PolicyType | null>(null)

  const data = block.data as PolicyData

  // Initialize default values if not present
  const defaultData: PolicyData = {
    company_name: data.company_name || '',
    brand_name: data.brand_name || '',
    website_url: data.website_url || '',
    contact_email: data.contact_email || '',
    contact_address: data.contact_address || '',
    governing_state: data.governing_state || '',
    effective_date: data.effective_date || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    liability_cap: data.liability_cap || '$500',
    refund_days: data.refund_days || '30',
    refund_processing_days: data.refund_processing_days || '7-10',
    warranty_months: data.warranty_months || '12',
    restocking_fee: data.restocking_fee || '$10',
    return_address: data.return_address || '',
    processing_days: data.processing_days || '1-3',
    domestic_shipping_days: data.domestic_shipping_days || '2-5 business days',
    international_shipping_days: data.international_shipping_days || '7-14 business days',
    free_shipping_threshold: data.free_shipping_threshold || '$50',
    shipping_carriers: data.shipping_carriers || 'USPS, DHL, FedEx',
    cutoff_time: data.cutoff_time || '2:00 PM EST',
    warehouse_location: data.warehouse_location || 'United States',
    policies: data.policies || {
      terms_of_service: { enabled: true, content: '' },
      privacy_policy: { enabled: true, content: '' },
      refund_policy: { enabled: true, content: '' },
      shipping_policy: { enabled: true, content: '' },
    }
  }

  const updateData = (updates: Partial<PolicyData>) => {
    onUpdate({
      ...block,
      data: { ...defaultData, ...data, ...updates }
    })
  }

  const updatePolicyContent = (policyType: PolicyType, content: string) => {
    const newPolicies = {
      ...defaultData.policies,
      ...data.policies,
      [policyType]: {
        ...(data.policies?.[policyType] || defaultData.policies[policyType]),
        content
      }
    }
    updateData({ policies: newPolicies })
  }

  const togglePolicyEnabled = (policyType: PolicyType) => {
    const newPolicies = {
      ...defaultData.policies,
      ...data.policies,
      [policyType]: {
        ...(data.policies?.[policyType] || defaultData.policies[policyType]),
        enabled: !(data.policies?.[policyType]?.enabled ?? true)
      }
    }
    updateData({ policies: newPolicies })
  }

  // Map field values for template rendering
  const getFieldValues = (): Record<string, string> => ({
    COMPANY_NAME: data.company_name || defaultData.company_name,
    BRAND_NAME: data.brand_name || defaultData.brand_name,
    WEBSITE_URL: data.website_url || defaultData.website_url,
    CONTACT_EMAIL: data.contact_email || defaultData.contact_email,
    CONTACT_ADDRESS: data.contact_address || defaultData.contact_address,
    GOVERNING_STATE: data.governing_state || defaultData.governing_state,
    EFFECTIVE_DATE: data.effective_date || defaultData.effective_date,
    LIABILITY_CAP: data.liability_cap || defaultData.liability_cap,
    REFUND_DAYS: data.refund_days || defaultData.refund_days,
    REFUND_PROCESSING_DAYS: data.refund_processing_days || defaultData.refund_processing_days,
    WARRANTY_MONTHS: data.warranty_months || defaultData.warranty_months,
    RESTOCKING_FEE: data.restocking_fee || defaultData.restocking_fee,
    RETURN_ADDRESS: data.return_address || data.contact_address || defaultData.contact_address,
    PROCESSING_DAYS: data.processing_days || defaultData.processing_days,
    DOMESTIC_SHIPPING_DAYS: data.domestic_shipping_days || defaultData.domestic_shipping_days,
    INTERNATIONAL_SHIPPING_DAYS: data.international_shipping_days || defaultData.international_shipping_days,
    FREE_SHIPPING_THRESHOLD: data.free_shipping_threshold || defaultData.free_shipping_threshold,
    SHIPPING_CARRIERS: data.shipping_carriers || defaultData.shipping_carriers,
    CUTOFF_TIME: data.cutoff_time || defaultData.cutoff_time,
    WAREHOUSE_LOCATION: data.warehouse_location || defaultData.warehouse_location,
    DATA_RETENTION_DAYS: '365 days',
  })

  const getPolicyContent = (policyType: PolicyType): string => {
    const customContent = data.policies?.[policyType]?.content
    if (customContent) return customContent

    const template = policyTemplates[policyType]
    return renderPolicyContent(template, getFieldValues())
  }

  const resetToTemplate = (policyType: PolicyType) => {
    updatePolicyContent(policyType, '')
  }

  const policyLabels: Record<PolicyType, { title: string; icon: string }> = {
    terms_of_service: { title: 'Terms of Service', icon: '📜' },
    privacy_policy: { title: 'Privacy Policy', icon: '🔒' },
    refund_policy: { title: 'Refund Policy', icon: '💸' },
    shipping_policy: { title: 'Shipping Policy', icon: '📦' },
  }

  return (
    <div className="space-y-6">
      {/* Common Placeholder Fields */}
      <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-600">
        <h3 className="text-lg font-semibold text-white mb-4">Company Information</h3>
        <p className="text-sm text-slate-400 mb-4">
          Fill in these fields once - they will be automatically inserted into all policies.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Company Name */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Company Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={data.company_name || ''}
              onChange={(e) => updateData({ company_name: e.target.value })}
              placeholder="e.g., Xynargy Limited"
              className="w-full bg-slate-700 text-white rounded px-3 py-2 border border-slate-600 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Brand Name */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Brand Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={data.brand_name || ''}
              onChange={(e) => updateData({ brand_name: e.target.value })}
              placeholder="e.g., SkinCoach"
              className="w-full bg-slate-700 text-white rounded px-3 py-2 border border-slate-600 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Website URL */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Website URL <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={data.website_url || ''}
              onChange={(e) => updateData({ website_url: e.target.value })}
              placeholder="e.g., https://skincoach.ai"
              className="w-full bg-slate-700 text-white rounded px-3 py-2 border border-slate-600 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Contact Email */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Contact Email <span className="text-red-400">*</span>
            </label>
            <input
              type="email"
              value={data.contact_email || ''}
              onChange={(e) => updateData({ contact_email: e.target.value })}
              placeholder="e.g., support@skincoach.ai"
              className="w-full bg-slate-700 text-white rounded px-3 py-2 border border-slate-600 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Contact Address */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Business Address <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={data.contact_address || ''}
              onChange={(e) => updateData({ contact_address: e.target.value })}
              placeholder="e.g., 123 Business Street, Suite 100, Hong Kong"
              className="w-full bg-slate-700 text-white rounded px-3 py-2 border border-slate-600 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Governing State */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Governing Jurisdiction <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={data.governing_state || ''}
              onChange={(e) => updateData({ governing_state: e.target.value })}
              placeholder="e.g., Hong Kong SAR"
              className="w-full bg-slate-700 text-white rounded px-3 py-2 border border-slate-600 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Effective Date */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Effective Date <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={data.effective_date || ''}
              onChange={(e) => updateData({ effective_date: e.target.value })}
              placeholder="e.g., January 6, 2026"
              className="w-full bg-slate-700 text-white rounded px-3 py-2 border border-slate-600 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Policy-Specific Fields */}
      <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-600">
        <h3 className="text-lg font-semibold text-white mb-4">Policy Settings</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Refund Days */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Refund Period (Days)</label>
            <input
              type="text"
              value={data.refund_days || '30'}
              onChange={(e) => updateData({ refund_days: e.target.value })}
              placeholder="30"
              className="w-full bg-slate-700 text-white rounded px-3 py-2 border border-slate-600 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Liability Cap */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Liability Cap</label>
            <input
              type="text"
              value={data.liability_cap || '$500'}
              onChange={(e) => updateData({ liability_cap: e.target.value })}
              placeholder="$500"
              className="w-full bg-slate-700 text-white rounded px-3 py-2 border border-slate-600 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Warranty */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Warranty (Months)</label>
            <input
              type="text"
              value={data.warranty_months || '12'}
              onChange={(e) => updateData({ warranty_months: e.target.value })}
              placeholder="12"
              className="w-full bg-slate-700 text-white rounded px-3 py-2 border border-slate-600 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Processing Days */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Processing Time</label>
            <input
              type="text"
              value={data.processing_days || '1-3'}
              onChange={(e) => updateData({ processing_days: e.target.value })}
              placeholder="1-3 business days"
              className="w-full bg-slate-700 text-white rounded px-3 py-2 border border-slate-600 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Domestic Shipping */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Domestic Shipping</label>
            <input
              type="text"
              value={data.domestic_shipping_days || '2-5 business days'}
              onChange={(e) => updateData({ domestic_shipping_days: e.target.value })}
              placeholder="2-5 business days"
              className="w-full bg-slate-700 text-white rounded px-3 py-2 border border-slate-600 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Free Shipping Threshold */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Free Shipping Min.</label>
            <input
              type="text"
              value={data.free_shipping_threshold || '$50'}
              onChange={(e) => updateData({ free_shipping_threshold: e.target.value })}
              placeholder="$50"
              className="w-full bg-slate-700 text-white rounded px-3 py-2 border border-slate-600 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Policy Sections */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-white mb-2">Policies</h3>

        {(Object.keys(policyLabels) as PolicyType[]).map((policyType) => {
          const isExpanded = expandedPolicy === policyType
          const isPreview = previewMode === policyType
          const policyInfo = policyLabels[policyType]
          const isEnabled = data.policies?.[policyType]?.enabled ?? true

          return (
            <div key={policyType} className="bg-slate-800/50 rounded-lg border border-slate-600 overflow-hidden">
              {/* Header Row */}
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-700/50 transition-colors"
                onClick={() => setExpandedPolicy(isExpanded ? null : policyType)}
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  )}
                  <span className="text-xl">{policyInfo.icon}</span>
                  <span className="font-medium text-white">{policyInfo.title}</span>
                  {!isEnabled && (
                    <span className="text-xs bg-slate-600 text-slate-300 px-2 py-0.5 rounded">Disabled</span>
                  )}
                </div>
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => togglePolicyEnabled(policyType)}
                    className={`text-sm px-3 py-1 rounded ${
                      isEnabled
                        ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                        : 'bg-slate-600 text-slate-400 hover:bg-slate-500'
                    }`}
                  >
                    {isEnabled ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="border-t border-slate-600 p-4">
                  {/* Toolbar */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPreviewMode(isPreview ? null : policyType)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm ${
                          isPreview
                            ? 'bg-blue-500 text-white'
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        {isPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        {isPreview ? 'Edit Mode' : 'Preview'}
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      {data.policies?.[policyType]?.content && (
                        <button
                          onClick={() => resetToTemplate(policyType)}
                          className="text-sm text-orange-400 hover:text-orange-300"
                        >
                          Reset to Template
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Content Area */}
                  {isPreview ? (
                    <div className="bg-white rounded-lg p-6 max-h-[500px] overflow-y-auto prose prose-sm max-w-none">
                      <div
                        dangerouslySetInnerHTML={{
                          __html: getPolicyContent(policyType)
                            .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mb-4">$1</h1>')
                            .replace(/^## (.+)$/gm, '<h2 class="text-xl font-semibold mt-6 mb-3">$1</h2>')
                            .replace(/^### (.+)$/gm, '<h3 class="text-lg font-medium mt-4 mb-2">$1</h3>')
                            .replace(/^\*\*(.+?)\*\*/gm, '<strong>$1</strong>')
                            .replace(/^- (.+)$/gm, '<li class="ml-4">$1</li>')
                            .replace(/^---$/gm, '<hr class="my-4 border-gray-200" />')
                            .replace(/\n\n/g, '</p><p class="mb-3">')
                            .replace(/\n/g, '<br />')
                        }}
                      />
                    </div>
                  ) : (
                    <textarea
                      value={data.policies?.[policyType]?.content || getPolicyContent(policyType)}
                      onChange={(e) => updatePolicyContent(policyType, e.target.value)}
                      className="w-full h-[500px] bg-slate-900 text-white rounded-lg p-4 border border-slate-600 focus:border-blue-500 focus:outline-none font-mono text-sm resize-none"
                      placeholder="Policy content..."
                    />
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
