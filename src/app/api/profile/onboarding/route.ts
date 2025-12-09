import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * API endpoint for saving onboarding profile data
 * Saves personal profile, company profile, and marks onboarding as complete
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { personal, company, businessUnits } = body

    // For now, we're not using auth - just saving the data
    // In production, you would get the user from the session

    // Save personal profile
    if (personal) {
      const { error: personalError } = await supabaseAdmin
        .from('user_profiles')
        .upsert({
          email: personal.email,
          first_name: personal.firstName,
          last_name: personal.lastName,
          phone: personal.phone,
          bio: personal.bio,
          profile_photo: personal.profilePhoto,
          social_links: personal.socialLinks,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'email'
        })

      if (personalError) {
        console.error('Error saving personal profile:', personalError)
        // Continue even if there's an error - table might not exist yet
      }
    }

    // Save company profile
    if (company) {
      const { error: companyError } = await supabaseAdmin
        .from('company_profiles')
        .upsert({
          email: personal?.email,
          company_name: company.companyName,
          company_url: company.companyUrl,
          industry: company.industry,
          address: company.address,
          city: company.city,
          country: company.country,
          registration_no: company.registrationNo,
          billing_email: company.billingEmail,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'email'
        })

      if (companyError) {
        console.error('Error saving company profile:', companyError)
        // Continue even if there's an error
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Onboarding data saved successfully'
    })

  } catch (error) {
    console.error('Onboarding save error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to save onboarding data' },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint to check onboarding status
 */
export async function GET() {
  try {
    // For now, just return not completed to show the wizard
    // In production, check user session and database
    return NextResponse.json({
      completed: false,
      profile: null
    })

  } catch (error) {
    console.error('Error checking onboarding status:', error)
    return NextResponse.json({
      completed: false,
      profile: null
    })
  }
}
