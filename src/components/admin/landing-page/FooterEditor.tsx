'use client'

import { Plus, Trash2, Edit } from 'lucide-react'

interface FooterLink {
  label: string
  url: string
}

interface PolicySettings {
  about_us: { enabled: boolean }
  terms_of_service: { enabled: boolean }
  privacy_policy: { enabled: boolean }
  refund_policy: { enabled: boolean }
  shipping_policy: { enabled: boolean }
  guarantee: { enabled: boolean }
  contact_us: { enabled: boolean }
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

  // Policy settings
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
  policies?: PolicySettings
  policy_content?: Record<string, string>
}

interface FooterEditorProps {
  data: FooterData
  onChange: (data: FooterData) => void
  onEditPolicy?: (policyType: string) => void
}

const defaultLinks: FooterLink[] = [
  { label: 'About Us', url: '?policy=about-us' },
  { label: 'Shipping', url: '?policy=shipping-policy' },
  { label: 'FAQ', url: '#faq' },
  { label: 'Terms', url: '?policy=terms-of-service' },
  { label: 'Privacy', url: '?policy=privacy-policy' },
  { label: 'Contact Us', url: '?policy=contact-us' },
]

export default function FooterEditor({ data, onChange, onEditPolicy }: FooterEditorProps) {
  const updateField = (key: keyof FooterData, value: any) => {
    onChange({ ...data, [key]: value })
  }

  const initializeLinks = () => {
    if (!data.links || data.links.length === 0) {
      updateField('links', defaultLinks)
    }
  }

  const addLink = () => {
    const links = [...(data.links || []), { label: 'New Link', url: '#' }]
    updateField('links', links)
  }

  const updateLink = (index: number, updates: Partial<FooterLink>) => {
    const links = [...(data.links || [])]
    links[index] = { ...links[index], ...updates }
    updateField('links', links)
  }

  const removeLink = (index: number) => {
    const links = [...(data.links || [])]
    links.splice(index, 1)
    updateField('links', links)
  }

  const updatePolicyEnabled = (policyType: keyof PolicySettings, enabled: boolean) => {
    const policies = data.policies || {
      about_us: { enabled: true },
      terms_of_service: { enabled: true },
      privacy_policy: { enabled: true },
      refund_policy: { enabled: true },
      shipping_policy: { enabled: true },
      guarantee: { enabled: true },
      contact_us: { enabled: true },
    }
    updateField('policies', {
      ...policies,
      [policyType]: { ...policies[policyType], enabled }
    })
  }

  const isPolicyEnabled = (policyType: keyof PolicySettings) => {
    return data.policies?.[policyType]?.enabled !== false
  }

  return (
    <div className="space-y-6">
      {/* Footer Links */}
      <div className="bg-gray-50 rounded-none p-4 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-medium text-gray-600">Footer Links</h4>
          <div className="flex gap-2">
            {(!data.links || data.links.length === 0) && (
              <button
                onClick={initializeLinks}
                className="text-xs text-violet-600 hover:text-violet-600"
              >
                Load Defaults
              </button>
            )}
            <button
              onClick={addLink}
              className="text-xs text-violet-600 hover:text-violet-600 flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              Add
            </button>
          </div>
        </div>

        <p className="text-xs text-gray-400 mb-3">Links appear as: About Us · Shipping · FAQ · Terms · Privacy · Contact Us</p>

        <div className="space-y-2">
          {(data.links || []).map((link, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={link.label}
                onChange={(e) => updateLink(index, { label: e.target.value })}
                placeholder="Label"
                className="flex-1 px-2 py-1.5 bg-gray-100 border border-gray-200 rounded-none text-gray-800 text-xs"
              />
              <input
                type="text"
                value={link.url}
                onChange={(e) => updateLink(index, { url: e.target.value })}
                placeholder="#anchor or ?policy=xxx"
                className="flex-1 px-2 py-1.5 bg-gray-100 border border-gray-200 rounded-none text-gray-800 text-xs"
              />
              <button
                onClick={() => removeLink(index)}
                className="text-red-600 hover:text-red-600"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Legal Info */}
      <div className="bg-gray-50 rounded-none p-4 border border-gray-200">
        <h4 className="text-sm font-medium text-gray-600 mb-4">Legal Bar</h4>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Brand Name (with ™)</label>
            <input
              type="text"
              value={data.brand_name || ''}
              onChange={(e) => updateField('brand_name', e.target.value)}
              placeholder="BrandName"
              className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-none text-gray-800 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Operated by (Legal Company Name)</label>
            <input
              type="text"
              value={data.company_name || ''}
              onChange={(e) => updateField('company_name', e.target.value)}
              placeholder="Local Legal Company Name"
              className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-none text-gray-800 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Contact Email</label>
            <input
              type="email"
              value={data.contact_email || ''}
              onChange={(e) => updateField('contact_email', e.target.value)}
              placeholder="support@brandname.com"
              className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-none text-gray-800 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Policy Settings */}
      <div className="bg-gray-50 rounded-none p-4 border border-gray-200">
        <h4 className="text-sm font-medium text-gray-600 mb-4">Policy Pages</h4>

        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* About Us */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isPolicyEnabled('about_us')}
                onChange={(e) => updatePolicyEnabled('about_us', e.target.checked)}
                className="w-4 h-4 rounded-none border-gray-200 text-violet-600 focus:ring-violet-500"
              />
              <span className="text-xs text-gray-500">About Us</span>
            </label>
            {onEditPolicy && (
              <button
                onClick={() => onEditPolicy('about-us')}
                className="p-1 text-gray-400 hover:text-violet-600 transition-colors"
                title="Edit About Us"
              >
                <Edit className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Terms of Service */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isPolicyEnabled('terms_of_service')}
                onChange={(e) => updatePolicyEnabled('terms_of_service', e.target.checked)}
                className="w-4 h-4 rounded-none border-gray-200 text-violet-600 focus:ring-violet-500"
              />
              <span className="text-xs text-gray-500">Terms of Service</span>
            </label>
            {onEditPolicy && (
              <button
                onClick={() => onEditPolicy('terms-of-service')}
                className="p-1 text-gray-400 hover:text-violet-600 transition-colors"
                title="Edit Terms of Service"
              >
                <Edit className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Privacy Policy */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isPolicyEnabled('privacy_policy')}
                onChange={(e) => updatePolicyEnabled('privacy_policy', e.target.checked)}
                className="w-4 h-4 rounded-none border-gray-200 text-violet-600 focus:ring-violet-500"
              />
              <span className="text-xs text-gray-500">Privacy Policy</span>
            </label>
            {onEditPolicy && (
              <button
                onClick={() => onEditPolicy('privacy-policy')}
                className="p-1 text-gray-400 hover:text-violet-600 transition-colors"
                title="Edit Privacy Policy"
              >
                <Edit className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Refund Policy */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isPolicyEnabled('refund_policy')}
                onChange={(e) => updatePolicyEnabled('refund_policy', e.target.checked)}
                className="w-4 h-4 rounded-none border-gray-200 text-violet-600 focus:ring-violet-500"
              />
              <span className="text-xs text-gray-500">Refund Policy</span>
            </label>
            {onEditPolicy && (
              <button
                onClick={() => onEditPolicy('refund-policy')}
                className="p-1 text-gray-400 hover:text-violet-600 transition-colors"
                title="Edit Refund Policy"
              >
                <Edit className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Shipping Policy */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isPolicyEnabled('shipping_policy')}
                onChange={(e) => updatePolicyEnabled('shipping_policy', e.target.checked)}
                className="w-4 h-4 rounded-none border-gray-200 text-violet-600 focus:ring-violet-500"
              />
              <span className="text-xs text-gray-500">Shipping Policy</span>
            </label>
            {onEditPolicy && (
              <button
                onClick={() => onEditPolicy('shipping-policy')}
                className="p-1 text-gray-400 hover:text-violet-600 transition-colors"
                title="Edit Shipping Policy"
              >
                <Edit className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Guarantee */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isPolicyEnabled('guarantee')}
                onChange={(e) => updatePolicyEnabled('guarantee', e.target.checked)}
                className="w-4 h-4 rounded-none border-gray-200 text-violet-600 focus:ring-violet-500"
              />
              <span className="text-xs text-gray-500">Guarantee</span>
            </label>
            {onEditPolicy && (
              <button
                onClick={() => onEditPolicy('guarantee')}
                className="p-1 text-gray-400 hover:text-violet-600 transition-colors"
                title="Edit Guarantee"
              >
                <Edit className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Contact Us */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isPolicyEnabled('contact_us')}
                onChange={(e) => updatePolicyEnabled('contact_us', e.target.checked)}
                className="w-4 h-4 rounded-none border-gray-200 text-violet-600 focus:ring-violet-500"
              />
              <span className="text-xs text-gray-500">Contact Us</span>
            </label>
            {onEditPolicy && (
              <button
                onClick={() => onEditPolicy('contact-us')}
                className="p-1 text-gray-400 hover:text-violet-600 transition-colors"
                title="Edit Contact Us"
              >
                <Edit className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Company Info for Policies */}
        <h5 className="text-xs font-medium text-gray-500 mb-3 border-t border-gray-200 pt-4">Policy Template Fields</h5>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Website URL</label>
            <input
              type="text"
              value={data.website_url || ''}
              onChange={(e) => updateField('website_url', e.target.value)}
              placeholder="https://example.com"
              className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-none text-gray-800 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Governing State/Country</label>
            <input
              type="text"
              value={data.governing_state || ''}
              onChange={(e) => updateField('governing_state', e.target.value)}
              placeholder="Hong Kong"
              className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-none text-gray-800 text-sm"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs text-gray-500 mb-1">Business Address</label>
            <input
              type="text"
              value={data.contact_address || ''}
              onChange={(e) => updateField('contact_address', e.target.value)}
              placeholder="123 Main St, City, Country"
              className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-none text-gray-800 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Refund Days</label>
            <input
              type="text"
              value={data.refund_days || ''}
              onChange={(e) => updateField('refund_days', e.target.value)}
              placeholder="30"
              className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-none text-gray-800 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Free Shipping Threshold</label>
            <input
              type="text"
              value={data.free_shipping_threshold || ''}
              onChange={(e) => updateField('free_shipping_threshold', e.target.value)}
              placeholder="$50"
              className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-none text-gray-800 text-sm"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
