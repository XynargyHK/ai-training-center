import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { secret, country, paths } = body

    // Verify secret token
    const expectedSecret = process.env.REVALIDATION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY
    if (secret !== expectedSecret) {
      return NextResponse.json({ error: 'Invalid secret' }, { status: 401 })
    }

    const revalidated: string[] = []

    // If specific paths provided, revalidate those
    if (paths && Array.isArray(paths)) {
      for (const path of paths) {
        revalidatePath(path)
        revalidated.push(path)
      }
    }

    // If country provided, revalidate country routes
    if (country) {
      const countryLower = country.toLowerCase()
      const countryPaths = [
        `/${countryLower}`,
        `/${countryLower}/micro-infusion/face`,
      ]
      for (const path of countryPaths) {
        revalidatePath(path)
        revalidated.push(path)
      }
    }

    // If neither paths nor country, revalidate all country pages
    if (!paths && !country) {
      const allPaths = [
        '/us', '/hk', '/sg',
        '/us/micro-infusion/face',
        '/hk/micro-infusion/face',
      ]
      for (const path of allPaths) {
        revalidatePath(path)
        revalidated.push(path)
      }
    }

    return NextResponse.json({
      success: true,
      revalidated,
      timestamp: new Date().toISOString()
    })
  } catch (err) {
    console.error('Revalidation error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
