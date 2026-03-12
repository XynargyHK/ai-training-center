import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const businessUnitId = searchParams.get('businessUnitId')

    if (!businessUnitId) {
      return NextResponse.json({ error: 'businessUnitId required' }, { status: 400 })
    }

    // Call the existing knowledge API which handles RLS correctly
    const protocol = request.nextUrl.protocol
    const host = request.nextUrl.host
    const baseUrl = `${protocol}//${host}`
    
    const response = await fetch(`${baseUrl}/api/knowledge?action=load_knowledge&businessUnitId=${businessUnitId}`)
    const data = await response.json()

    if (!response.ok) throw new Error(data.error || 'Failed to fetch knowledge')

    // Transform data to be more readable
    const documents = (data.data || [])
      .filter((e: any) => !e.id?.startsWith('product-') && !e.id?.startsWith('service-') && !e.id?.startsWith('landing-page-'))
      .map((item: any) => {
        // Use the exact file_path (filename) from the database
        const displayName = item.file_path || item.topic || 'Untitled Document';
          
        return {
          id: item.id,
          topic: displayName
        }
      })

    return NextResponse.json({ documents })
  } catch (err: any) {
    console.error('List knowledge error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
