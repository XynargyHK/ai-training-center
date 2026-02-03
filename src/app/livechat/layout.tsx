import { Metadata } from 'next'
import { supabase } from '@/lib/supabase'

// Map domains to business units
const DOMAIN_TO_BUSINESS_UNIT: Record<string, { slug: string; defaultTitle: string; defaultDescription: string }> = {
  'skincoach.ai': {
    slug: 'skincoach',
    defaultTitle: 'SkinCoach - AI-Powered Skincare Solutions',
    defaultDescription: 'Discover personalized skincare recommendations powered by AI. Expert guidance for your unique skin concerns and goals.'
  },
  'www.skincoach.ai': {
    slug: 'skincoach',
    defaultTitle: 'SkinCoach - AI-Powered Skincare Solutions',
    defaultDescription: 'Discover personalized skincare recommendations powered by AI. Expert guidance for your unique skin concerns and goals.'
  },
  // Add more domains as needed
}

async function getBusinessUnitMetadata(businessUnitSlug?: string, domain?: string): Promise<{ title: string; description: string }> {
  try {
    // Try to get business unit from domain mapping first
    if (domain && DOMAIN_TO_BUSINESS_UNIT[domain]) {
      const { slug, defaultTitle, defaultDescription } = DOMAIN_TO_BUSINESS_UNIT[domain]
      businessUnitSlug = businessUnitSlug || slug
    }

    if (!businessUnitSlug) {
      return {
        title: 'AI Business Center',
        description: 'Train and manage AI agents with roleplay scenarios, knowledge management, and real-time testing'
      }
    }

    // Load business unit data
    const { data: businessUnit } = await supabase
      .from('business_units')
      .select('name, description')
      .eq('slug', businessUnitSlug)
      .single()

    if (businessUnit) {
      return {
        title: businessUnit.name || 'AI Business Center',
        description: businessUnit.description || `Welcome to ${businessUnit.name}. AI-powered solutions for your business.`
      }
    }

    // Fallback to domain defaults
    if (domain && DOMAIN_TO_BUSINESS_UNIT[domain]) {
      const { defaultTitle, defaultDescription } = DOMAIN_TO_BUSINESS_UNIT[domain]
      return { title: defaultTitle, description: defaultDescription }
    }

    return {
      title: 'AI Business Center',
      description: 'Train and manage AI agents with roleplay scenarios, knowledge management, and real-time testing'
    }
  } catch (error) {
    console.error('Error loading business unit metadata:', error)
    return {
      title: 'AI Business Center',
      description: 'AI-powered business solutions'
    }
  }
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: { businessUnit?: string }
}): Promise<Metadata> {
  // Get domain from headers (this will be available server-side)
  let domain = ''
  try {
    const { headers } = await import('next/headers')
    const headersList = await headers()
    domain = headersList.get('host') || ''
  } catch (error) {
    console.error('Error getting headers:', error)
  }

  const businessUnitSlug = searchParams.businessUnit
  const { title, description } = await getBusinessUnitMetadata(businessUnitSlug, domain)

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

export default function LivechatLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
