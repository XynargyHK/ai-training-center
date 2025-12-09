'use client'

import { useState, useEffect } from 'react'
import {
  FileText, Loader2, Save, Plus, Edit, Trash2, Check, X,
  RotateCcw, Truck, Shield, CreditCard, Lock, ScrollText, ChevronDown
} from 'lucide-react'
import { type Language, getTranslation } from '@/lib/translations'

// Policy types with icons and default templates
const POLICY_TYPES = [
  {
    id: 'return',
    name: 'Return & Refund Policy',
    icon: RotateCcw,
    color: 'blue',
    fields: [
      { key: 'return_window', label: 'Return Window (days)', type: 'select', options: ['7', '14', '30', '60', '90'] },
      { key: 'refund_method', label: 'Refund Method', type: 'select', options: ['Original payment', 'Store credit', 'Exchange only'] },
      { key: 'condition', label: 'Item Condition Required', type: 'select', options: ['Unused with tags', 'Unused', 'Any condition'] },
      { key: 'restocking_fee', label: 'Restocking Fee (%)', type: 'number' },
      { key: 'exceptions', label: 'Exceptions (items not returnable)', type: 'textarea' },
      { key: 'process', label: 'Return Process', type: 'textarea' }
    ],
    defaultContent: `Items can be returned within {return_window} days of purchase. Items must be {condition}. Refunds will be issued via {refund_method}. {restocking_fee ? 'A ' + restocking_fee + '% restocking fee may apply.' : ''}\n\nExceptions: {exceptions}\n\nHow to return: {process}`
  },
  {
    id: 'shipping',
    name: 'Shipping Policy',
    icon: Truck,
    color: 'green',
    fields: [
      { key: 'processing_time', label: 'Processing Time (days)', type: 'select', options: ['1-2', '2-3', '3-5', '5-7'] },
      { key: 'domestic_shipping', label: 'Domestic Shipping', type: 'text' },
      { key: 'international_shipping', label: 'International Shipping', type: 'text' },
      { key: 'free_shipping_threshold', label: 'Free Shipping Above ($)', type: 'number' },
      { key: 'shipping_carriers', label: 'Shipping Carriers', type: 'text' },
      { key: 'tracking', label: 'Tracking Provided', type: 'select', options: ['Yes', 'No'] }
    ],
    defaultContent: `Orders are processed within {processing_time} business days.\n\nDomestic: {domestic_shipping}\nInternational: {international_shipping}\n\n{free_shipping_threshold ? 'Free shipping on orders over $' + free_shipping_threshold : ''}\n\nCarriers: {shipping_carriers}\nTracking: {tracking}`
  },
  {
    id: 'warranty',
    name: 'Warranty & Guarantee',
    icon: Shield,
    color: 'purple',
    fields: [
      { key: 'warranty_period', label: 'Warranty Period', type: 'select', options: ['30 days', '90 days', '1 year', '2 years', 'Lifetime'] },
      { key: 'coverage', label: 'What is Covered', type: 'textarea' },
      { key: 'exclusions', label: 'Exclusions', type: 'textarea' },
      { key: 'claim_process', label: 'How to Claim', type: 'textarea' },
      { key: 'satisfaction_guarantee', label: 'Satisfaction Guarantee', type: 'select', options: ['Yes', 'No'] }
    ],
    defaultContent: `Warranty Period: {warranty_period}\n\nCoverage: {coverage}\n\nExclusions: {exclusions}\n\nClaim Process: {claim_process}\n\n{satisfaction_guarantee === 'Yes' ? '100% Satisfaction Guaranteed' : ''}`
  },
  {
    id: 'payment',
    name: 'Payment Terms',
    icon: CreditCard,
    color: 'orange',
    fields: [
      { key: 'accepted_methods', label: 'Accepted Payment Methods', type: 'text' },
      { key: 'currency', label: 'Currency', type: 'text' },
      { key: 'payment_timing', label: 'When Payment is Charged', type: 'select', options: ['At checkout', 'When shipped', 'Upon delivery'] },
      { key: 'installments', label: 'Installment Options', type: 'text' },
      { key: 'cancellation', label: 'Cancellation Policy', type: 'textarea' }
    ],
    defaultContent: `Accepted Payment Methods: {accepted_methods}\nCurrency: {currency}\nPayment Timing: {payment_timing}\n\n{installments ? 'Installment Options: ' + installments : ''}\n\nCancellation: {cancellation}`
  },
  {
    id: 'privacy',
    name: 'Privacy Policy',
    icon: Lock,
    color: 'red',
    fields: [
      { key: 'data_collected', label: 'Data We Collect', type: 'textarea' },
      { key: 'data_usage', label: 'How We Use Your Data', type: 'textarea' },
      { key: 'data_sharing', label: 'Data Sharing', type: 'textarea' },
      { key: 'cookies', label: 'Cookie Policy', type: 'textarea' },
      { key: 'user_rights', label: 'Your Rights', type: 'textarea' },
      { key: 'contact', label: 'Contact for Privacy Concerns', type: 'text' }
    ],
    defaultContent: `Data We Collect:\n{data_collected}\n\nHow We Use Your Data:\n{data_usage}\n\nData Sharing:\n{data_sharing}\n\nCookies:\n{cookies}\n\nYour Rights:\n{user_rights}\n\nContact: {contact}`
  },
  {
    id: 'terms',
    name: 'Terms of Service',
    icon: ScrollText,
    color: 'slate',
    fields: [
      { key: 'agreement', label: 'User Agreement', type: 'textarea' },
      { key: 'eligibility', label: 'Eligibility Requirements', type: 'textarea' },
      { key: 'prohibited', label: 'Prohibited Activities', type: 'textarea' },
      { key: 'liability', label: 'Limitation of Liability', type: 'textarea' },
      { key: 'disputes', label: 'Dispute Resolution', type: 'textarea' },
      { key: 'modifications', label: 'Policy Modifications', type: 'textarea' }
    ],
    defaultContent: `By using our services, you agree to these terms.\n\nEligibility: {eligibility}\n\nProhibited Activities: {prohibited}\n\nLimitation of Liability: {liability}\n\nDispute Resolution: {disputes}\n\nWe reserve the right to modify these terms: {modifications}`
  }
]

interface Policy {
  id: string
  type: string
  title: string
  content: string
  fields_data?: Record<string, string>
  effective_date?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface PolicyManagerProps {
  businessUnitId: string
  language: Language
}

const PolicyManager: React.FC<PolicyManagerProps> = ({ businessUnitId, language }) => {
  const t = getTranslation(language)

  // State
  const [policies, setPolicies] = useState<Policy[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [editingPolicy, setEditingPolicy] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedType, setSelectedType] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState<Record<string, string>>({})

  // Load policies
  useEffect(() => {
    loadPolicies()
  }, [businessUnitId])

  const loadPolicies = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/knowledge-base/policies?businessUnitId=${businessUnitId}`)
      const data = await response.json()
      if (data.success) {
        setPolicies(data.policies || [])
      }
    } catch (error) {
      console.error('Failed to load policies:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Get policy type config
  const getPolicyConfig = (typeId: string) => {
    return POLICY_TYPES.find(pt => pt.id === typeId)
  }

  // Generate content from fields
  const generateContent = (typeId: string, fields: Record<string, string>) => {
    const config = getPolicyConfig(typeId)
    if (!config) return ''

    let content = config.defaultContent
    Object.entries(fields).forEach(([key, value]) => {
      content = content.replace(new RegExp(`\\{${key}\\}`, 'g'), value || '')
    })
    // Clean up empty placeholders
    content = content.replace(/\{[^}]+\}/g, '')
    return content.trim()
  }

  // Start editing a policy type
  const startEditing = (typeId: string) => {
    const existingPolicy = policies.find(p => p.type === typeId)
    if (existingPolicy && existingPolicy.fields_data) {
      setFormData(existingPolicy.fields_data)
    } else {
      setFormData({})
    }
    setEditingPolicy(typeId)
  }

  // Save policy
  const savePolicy = async (typeId: string) => {
    const config = getPolicyConfig(typeId)
    if (!config) return

    setIsSaving(true)
    try {
      const existingPolicy = policies.find(p => p.type === typeId)
      const content = generateContent(typeId, formData)

      const payload = {
        title: config.name,
        type: typeId,
        content,
        fields_data: formData,
        business_unit_id: businessUnitId,
        is_active: true
      }

      const method = existingPolicy ? 'PUT' : 'POST'
      const body = existingPolicy ? { ...payload, id: existingPolicy.id } : payload

      const response = await fetch('/api/knowledge-base/policies', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (response.ok) {
        await loadPolicies()
        setEditingPolicy(null)
        setFormData({})
      }
    } catch (error) {
      console.error('Failed to save policy:', error)
    } finally {
      setIsSaving(false)
    }
  }

  // Delete policy
  const deletePolicy = async (policyId: string) => {
    if (!confirm('Delete this policy?')) return

    try {
      await fetch(`/api/knowledge-base/policies?id=${policyId}`, {
        method: 'DELETE'
      })
      await loadPolicies()
    } catch (error) {
      console.error('Failed to delete policy:', error)
    }
  }

  // Check if policy exists
  const hasPolicy = (typeId: string) => {
    return policies.some(p => p.type === typeId)
  }

  // Get color classes
  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      blue: { bg: 'bg-blue-600/20', text: 'text-blue-400', border: 'border-blue-600/30' },
      green: { bg: 'bg-green-600/20', text: 'text-green-400', border: 'border-green-600/30' },
      purple: { bg: 'bg-purple-600/20', text: 'text-purple-400', border: 'border-purple-600/30' },
      orange: { bg: 'bg-orange-600/20', text: 'text-orange-400', border: 'border-orange-600/30' },
      red: { bg: 'bg-red-600/20', text: 'text-red-400', border: 'border-red-600/30' },
      slate: { bg: 'bg-slate-600/20', text: 'text-slate-400', border: 'border-slate-600/30' }
    }
    return colors[color] || colors.slate
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-white">Business Policies</h2>
        <p className="text-sm text-slate-400 mt-1">
          Set up your store policies. Fill in the form fields and we'll generate the policy text.
        </p>
      </div>

      {/* Policy Cards Grid */}
      <div className="grid grid-cols-2 gap-4">
        {POLICY_TYPES.map(policyType => {
          const Icon = policyType.icon
          const colors = getColorClasses(policyType.color)
          const existingPolicy = policies.find(p => p.type === policyType.id)
          const isEditing = editingPolicy === policyType.id

          return (
            <div
              key={policyType.id}
              className={`rounded-xl border ${colors.border} ${
                existingPolicy ? colors.bg : 'bg-slate-800/50'
              } overflow-hidden`}
            >
              {/* Card Header */}
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${colors.bg} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${colors.text}`} />
                  </div>
                  <div>
                    <h3 className="font-medium text-white">{policyType.name}</h3>
                    {existingPolicy ? (
                      <span className="text-xs text-green-400 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Configured
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500">Not set up</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {!isEditing && (
                    <button
                      onClick={() => startEditing(policyType.id)}
                      className={`p-2 rounded-lg ${colors.text} hover:${colors.bg}`}
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  )}
                  {existingPolicy && !isEditing && (
                    <button
                      onClick={() => deletePolicy(existingPolicy.id)}
                      className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-600/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Edit Form */}
              {isEditing && (
                <div className="border-t border-slate-700 p-4 space-y-4">
                  {policyType.fields.map(field => (
                    <div key={field.key}>
                      <label className="block text-sm text-slate-400 mb-1">
                        {field.label}
                      </label>
                      {field.type === 'select' ? (
                        <select
                          value={formData[field.key] || ''}
                          onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
                        >
                          <option value="">Select...</option>
                          {field.options?.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : field.type === 'textarea' ? (
                        <textarea
                          value={formData[field.key] || ''}
                          onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
                          rows={3}
                        />
                      ) : (
                        <input
                          type={field.type}
                          value={formData[field.key] || ''}
                          onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
                        />
                      )}
                    </div>
                  ))}

                  {/* Preview */}
                  <div className="pt-4 border-t border-slate-700">
                    <label className="block text-sm text-slate-400 mb-2">Preview</label>
                    <div className="p-3 bg-slate-900 rounded-lg text-sm text-slate-300 whitespace-pre-wrap max-h-40 overflow-y-auto">
                      {generateContent(policyType.id, formData) || 'Fill in the fields above to generate policy text'}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      onClick={() => {
                        setEditingPolicy(null)
                        setFormData({})
                      }}
                      className="px-3 py-1.5 text-sm text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => savePolicy(policyType.id)}
                      disabled={isSaving}
                      className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isSaving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      Save
                    </button>
                  </div>
                </div>
              )}

              {/* Existing Policy Preview */}
              {existingPolicy && !isEditing && (
                <div className="border-t border-slate-700/50 p-4">
                  <p className="text-sm text-slate-400 line-clamp-3">
                    {existingPolicy.content}
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Help */}
      <div className="bg-slate-700/30 rounded-lg p-4 text-sm text-slate-400">
        <p><strong>Tip:</strong> Fill in the form fields for each policy type. The system will automatically generate professional policy text that you can customize further.</p>
      </div>
    </div>
  )
}

export default PolicyManager
