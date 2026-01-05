import termsOfService from './terms-of-service.json'
import privacyPolicy from './privacy-policy.json'
import refundPolicy from './refund-policy.json'
import shippingPolicy from './shipping-policy.json'

export const policyTemplates = {
  terms_of_service: termsOfService,
  privacy_policy: privacyPolicy,
  refund_policy: refundPolicy,
  shipping_policy: shippingPolicy,
}

export type PolicyType = keyof typeof policyTemplates

export interface PolicyField {
  key: string
  label: string
  placeholder: string
  required: boolean
}

export interface PolicyTemplate {
  type: string
  title: string
  version: string
  fields: PolicyField[]
  content: string
}

// Helper function to replace placeholders with actual values
export function renderPolicy(
  template: PolicyTemplate,
  fieldValues: Record<string, string>
): string {
  let content = template.content

  for (const field of template.fields) {
    const value = fieldValues[field.key] || field.placeholder
    const regex = new RegExp(`\\{\\{${field.key}\\}\\}`, 'g')
    content = content.replace(regex, value)
  }

  return content
}

// Get all required fields for a policy type
export function getRequiredFields(policyType: PolicyType): PolicyField[] {
  const template = policyTemplates[policyType]
  return template.fields.filter(f => f.required)
}

// Validate that all required fields are provided
export function validateFields(
  policyType: PolicyType,
  fieldValues: Record<string, string>
): { valid: boolean; missing: string[] } {
  const requiredFields = getRequiredFields(policyType)
  const missing = requiredFields
    .filter(f => !fieldValues[f.key] || fieldValues[f.key].trim() === '')
    .map(f => f.label)

  return {
    valid: missing.length === 0,
    missing
  }
}

export default policyTemplates
