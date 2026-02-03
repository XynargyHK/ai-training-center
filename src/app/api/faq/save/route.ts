import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Default business unit (skincoach) - used as fallback
const DEFAULT_BUSINESS_UNIT_ID = '77313e61-2a19-4f3e-823b-80390dde8bd2'

function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

async function getBusinessUnitId(slugOrId: string | null | undefined, supabase: any): Promise<string> {
  if (!slugOrId) {
    return DEFAULT_BUSINESS_UNIT_ID
  }

  // If it's already a UUID, return it
  if (isValidUUID(slugOrId)) {
    return slugOrId
  }

  // Otherwise, it's a slug - look up the UUID from database
  const { data } = await supabase
    .from('business_units')
    .select('id')
    .eq('slug', slugOrId)
    .single()

  return data?.id || DEFAULT_BUSINESS_UNIT_ID
}

export async function POST(request: NextRequest) {
  try {
    const { faqs, language, country = 'HK', businessUnitId: businessUnitSlugOrId } = await request.json()

    // Use SERVICE ROLE KEY to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const businessUnitId = await getBusinessUnitId(businessUnitSlugOrId, supabase)

    const savedFaqs = []
    for (const faq of faqs) {
      // Get category_id from category name if provided
      let categoryId = null
      if (faq.category) {
        const { data: categoryData } = await supabase
          .from('categories')
          .select('id')
          .eq('business_unit_id', businessUnitId)
          .eq('name', faq.category)
          .single()

        categoryId = categoryData?.id
      }

      const { data, error } = await supabase
        .from('faq_library')
        .insert({
          business_unit_id: businessUnitId,
          category_id: categoryId,
          reference_id: randomUUID(),
          question: faq.question,
          answer: faq.answer,
          keywords: faq.keywords || [],
          language: language,
          country: country,
          is_published: true
        })
        .select()
        .single()

      if (error) {
        console.error('Insert error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      savedFaqs.push(data)
    }

    return NextResponse.json({ success: true, faqs: savedFaqs })
  } catch (error: any) {
    console.error('Save FAQ error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
