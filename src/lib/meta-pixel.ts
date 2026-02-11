/**
 * Meta Pixel tracking helper
 * Safely calls fbq() for event tracking
 */

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
  }
}

function track(eventName: string, params?: Record<string, unknown>) {
  if (typeof window !== 'undefined' && window.fbq) {
    if (params) {
      window.fbq('track', eventName, params)
    } else {
      window.fbq('track', eventName)
    }
  }
}

export const MetaPixel = {
  viewContent(params: { content_name: string; content_ids?: string[]; content_type?: string; value?: number; currency?: string }) {
    track('ViewContent', params)
  },

  addToCart(params: { content_name: string; content_ids?: string[]; content_type?: string; value?: number; currency?: string }) {
    track('AddToCart', params)
  },

  initiateCheckout(params: { value?: number; currency?: string; num_items?: number }) {
    track('InitiateCheckout', params)
  },

  purchase(params: { value: number; currency: string; content_ids?: string[]; num_items?: number }) {
    track('Purchase', params)
  },

  completeRegistration(params?: { content_name?: string; status?: string }) {
    track('CompleteRegistration', params)
  },

  lead(params?: { content_name?: string; value?: number; currency?: string }) {
    track('Lead', params)
  },
}
