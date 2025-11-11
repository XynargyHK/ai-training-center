// FAQ and Canned Message Library
// This reduces AI costs by answering common questions with pre-written responses

import { createClient } from '@supabase/supabase-js'

// Supabase client (optional - fallback to hardcoded if not available)
let supabase: ReturnType<typeof createClient> | null = null
try {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
  }
} catch (e) {
  console.log('Supabase not configured, using hardcoded FAQ data')
}

export interface FAQ {
  id: string
  keywords: string[]
  question: string
  answer: string
  category: 'pricing' | 'products' | 'shipping' | 'returns' | 'results' | 'ingredients' | 'general'
  is_active?: boolean
}

export interface CannedMessage {
  id: string
  scenario: string
  template: string
  variables?: string[] // Variables that can be replaced
}

// ===== FAQ DATABASE =====
export const faqDatabase: FAQ[] = [
  // PRICING
  {
    id: 'faq-price-essential',
    keywords: ['how much', 'cost', 'price', 'essential plan', 'cheapest', 'affordable'],
    question: 'How much does the Essential Plan cost?',
    answer: `The Essential Plan is $29/month and includes:
• Daily Cleanser
• Active Treatment Serum
• Daily Moisturizer with SPF 30
• Email support

Perfect for budget-conscious beginners!`,
    category: 'pricing'
  },
  {
    id: 'faq-price-pro',
    keywords: ['pro plan', 'how much pro', 'price pro', 'cost pro'],
    question: 'How much does the Pro Plan cost?',
    answer: `The Pro Plan is $49/month ⭐ BEST VALUE

Includes everything in Essential, PLUS:
• 2 Targeted Treatment Serums (day & night)
• Eye Cream
• Weekly Exfoliating Mask
• 2x higher active ingredient concentrations
• Priority email support
• Monthly progress check-ins

Most popular choice for serious results!`,
    category: 'pricing'
  },
  {
    id: 'faq-price-concierge',
    keywords: ['concierge plan', 'premium plan', 'expensive', 'price concierge', 'what included concierge'],
    question: 'What\'s included in the Concierge Plan?',
    answer: `The Concierge Plan is $89/month 👑 PREMIUM

Includes everything in Pro, PLUS:
• Personal AI Skin Coach (24/7 chat access)
• Premium Swiss-formulated ingredients
• 4 Specialized Treatment Products
• Highest concentrations (clinical-grade)
• Bi-weekly video consultations
• Priority access to new products (30 days early)
• Free express shipping
• Exclusive formulations

Only $2.96/day - less than a coffee!`,
    category: 'pricing'
  },
  {
    id: 'faq-compare-plans',
    keywords: ['compare plans', 'difference between', 'which plan', 'plans comparison'],
    question: 'What\'s the difference between the plans?',
    answer: `Here's a quick comparison:

Essential ($29/month):
• 3 basic products
• Good for beginners
• Results in 6-8 weeks

Pro ($49/month) ⭐ BEST VALUE:
• 6 products including eye cream
• 2x stronger formulations
• Results in 3-4 weeks
• Monthly check-ins

Concierge ($89/month):
• Everything in Pro + personal AI coach
• Clinical-grade concentrations
• Bi-weekly video consultations
• Results in 2-3 weeks
• VIP access to new products

Most customers choose Pro for the best balance of results and value!`,
    category: 'pricing'
  },

  // SHIPPING & DELIVERY
  {
    id: 'faq-shipping-time',
    keywords: ['shipping', 'delivery', 'how long', 'when arrive', 'receive'],
    question: 'How long does shipping take?',
    answer: `Shipping times:
• Essential & Pro: 3-5 business days (standard shipping)
• Concierge: 1-2 business days (free express shipping)

We ship within 24 hours of your order!`,
    category: 'shipping'
  },
  {
    id: 'faq-shipping-cost',
    keywords: ['shipping cost', 'free shipping', 'delivery fee'],
    question: 'Is shipping free?',
    answer: `Shipping costs:
• Essential Plan: $5 flat rate
• Pro Plan: $5 flat rate
• Concierge Plan: FREE express shipping ✨

Orders over $50 get free standard shipping!`,
    category: 'shipping'
  },

  // RETURNS & GUARANTEE
  {
    id: 'faq-return-policy',
    keywords: ['return', 'refund', 'money back', 'guarantee', 'not working'],
    question: 'What\'s your return policy?',
    answer: `We offer a 30-day money-back guarantee!

If you're not satisfied with your results:
• Full refund within 30 days
• No questions asked
• Keep the products you've used
• Just contact our support team

We want you to feel confident trying our products risk-free!`,
    category: 'returns'
  },

  // RESULTS & TIMELINE
  {
    id: 'faq-results-time',
    keywords: ['how long results', 'when see results', 'results timeline', 'work fast'],
    question: 'How long until I see results?',
    answer: `Results timeline by plan:

Essential Plan: 6-8 weeks
• Noticeable improvements
• Basic ingredient concentrations

Pro Plan: 3-4 weeks ⭐
• Visible results faster
• 2x stronger formulations

Concierge Plan: 2-3 weeks 👑
• Fastest results
• Clinical-grade concentrations
• Personal coaching for optimization

Individual results vary based on skin type and concerns!`,
    category: 'results'
  },

  // INGREDIENTS
  {
    id: 'faq-ingredients-safe',
    keywords: ['ingredients', 'safe', 'natural', 'chemicals', 'what in products'],
    question: 'Are your ingredients safe?',
    answer: `Yes! All our products are:
• Dermatologist-tested
• Clinically proven actives
• No parabens, sulfates, or phthalates
• Cruelty-free
• Made in FDA-registered facilities

Key actives include: Retinol, Niacinamide, Hyaluronic Acid, Vitamin C, and Peptides.`,
    category: 'ingredients'
  },

  // GENERAL
  {
    id: 'faq-cancel-anytime',
    keywords: ['cancel', 'subscription', 'stop', 'unsubscribe', 'commitment'],
    question: 'Can I cancel anytime?',
    answer: `Yes! You can cancel anytime with:
• No cancellation fees
• No long-term commitments
• Cancel in one click from your account
• Prorated refunds for unused time

We want you to stay because you love the results, not because you're locked in!`,
    category: 'general'
  },
]

// ===== CANNED MESSAGES =====
export const cannedMessages: CannedMessage[] = [
  {
    id: 'greeting',
    scenario: 'First message / greeting',
    template: `Hi! 👋 I'm here to help you find the perfect skincare solution.

To get started, could you tell me:
• What's your main skin concern?
• What's your current skincare routine (if any)?

This helps me recommend the best plan for you!`
  },
  {
    id: 'price-objection-general',
    scenario: 'User says "too expensive"',
    template: `I totally understand - skincare is an investment!

Quick question: How much are you currently spending on products that aren't giving you results?

Many customers find they actually SAVE money by switching to our plans because:
• No more buying random products that don't work
• Professional guidance prevents expensive mistakes
• Results mean you need less makeup/cover-up

The Pro Plan breaks down to just $1.63/day. That's less than a latte for clear, confident skin.

Would you like to hear about our 30-day money-back guarantee?`
  },
  {
    id: 'amazon-comparison',
    scenario: 'User mentions Amazon/cheaper alternatives',
    template: `Great question! Here's what most people don't realize about Amazon skincare:

Budget brands vs. SkinCoach:
• Amazon: Lower active ingredient concentrations (often 0.1% retinol)
• SkinCoach Pro: 2x concentrations (0.5% retinol) = faster results

No personal support:
• Amazon: You're on your own to figure out what works
• SkinCoach: Personal AI coach + monthly check-ins

Quality concerns:
• Amazon: Counterfeit products are common (35% in some categories)
• SkinCoach: Direct from FDA-registered facilities

The real cost isn't the price tag - it's using the wrong products for 6 months with no results.

Would you rather save $20 now and waste 6 months, or invest properly and see results in 3-4 weeks?`
  },
  {
    id: 'build-routine-beginner',
    scenario: 'User asks how to build a routine',
    template: `Great question! A proper skincare routine has 3 essential steps:

Morning:
1. Cleanser (remove oils/impurities)
2. Treatment (target specific concerns)
3. Moisturizer with SPF (hydrate + protect)

Evening:
1. Cleanser (remove makeup/sunscreen)
2. Treatment (stronger actives at night)
3. Moisturizer (repair while you sleep)

All our plans include these essentials - the difference is in the strength and number of targeted treatments.

What's your main skin concern? I can recommend which plan gives you the best results!`
  },
  {
    id: 'close-pro-plan',
    scenario: 'User interested, ready to close on Pro Plan',
    template: `Excellent choice! The Pro Plan is our most popular option for good reason.

Here's what happens next:
1. Click the link below to start your subscription
2. You'll receive your first shipment within 3-5 days
3. I'll check in with you in 2 weeks to see how it's going
4. See visible results in 3-4 weeks

Remember: 30-day money-back guarantee - zero risk!

Ready to get started?

[Start Pro Plan - $49/month →]`
  },
  {
    id: 'close-concierge-plan',
    scenario: 'User interested in premium, close on Concierge',
    template: `Perfect! The Concierge Plan is for customers who want the absolute best results.

What you get immediately:
• 24/7 access to me (your personal AI coach)
• Bi-weekly video consultations with skincare experts
• Premium Swiss formulations shipped express (1-2 days)
• VIP access to new products 30 days before anyone else

Your first shipment arrives in 1-2 days, and I'll be with you every step of the way.

30-day money-back guarantee - if you don't see dramatically faster results than your friends, full refund!

Shall I get you started today?

[Start Concierge Plan - $89/month →]`
  }
]

// ===== MATCHING LOGIC =====

/**
 * Match user message against FAQ database
 * Returns matching FAQ or null if no match found
 */
export function matchFAQ(userMessage: string): FAQ | null {
  const messageLower = userMessage.toLowerCase()

  // Find FAQ where keywords match
  for (const faq of faqDatabase) {
    const matchCount = faq.keywords.filter(keyword =>
      messageLower.includes(keyword.toLowerCase())
    ).length

    // If at least 1 keyword matches, return this FAQ
    if (matchCount > 0) {
      return faq
    }
  }

  return null
}

/**
 * Get canned message by scenario ID
 */
export function getCannedMessage(scenarioId: string): CannedMessage | null {
  return cannedMessages.find(msg => msg.id === scenarioId) || null
}

/**
 * Determine if we should use AI or template response
 * Returns: 'faq' | 'canned' | 'ai'
 */
export function determineResponseType(
  userMessage: string,
  conversationHistory: Array<{role: string, content: string}>
): 'faq' | 'canned' | 'ai' {
  const messageLower = userMessage.toLowerCase()

  // First message? Use greeting
  if (conversationHistory.length === 0) {
    return 'canned'
  }

  // Check for FAQ match
  if (matchFAQ(userMessage)) {
    return 'faq'
  }

  // Check for common scenarios that have canned messages
  if (messageLower.includes('too expensive') ||
      messageLower.includes('too much') ||
      messageLower.includes('can\'t afford')) {
    return 'canned'
  }

  if (messageLower.includes('amazon') ||
      messageLower.includes('cheaper') ||
      messageLower.includes('walmart') ||
      messageLower.includes('target')) {
    return 'canned'
  }

  // Default to AI for complex/unique questions
  return 'ai'
}
