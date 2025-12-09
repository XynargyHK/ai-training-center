import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// GET - Fetch user profile and company
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    // If userId provided, fetch that user's profile
    // Otherwise return the first profile (for development without auth)
    let userProfile = null
    let company = null

    if (userId) {
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError
      }

      userProfile = profile

      if (profile?.company_id) {
        const { data: companyData, error: companyError } = await supabase
          .from('companies')
          .select('*')
          .eq('id', profile.company_id)
          .single()

        if (companyError && companyError.code !== 'PGRST116') {
          throw companyError
        }

        company = companyData
      }
    } else {
      // Development mode: get first profile
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('*')
        .limit(1)

      if (profilesError) throw profilesError

      if (profiles && profiles.length > 0) {
        userProfile = profiles[0]

        if (userProfile.company_id) {
          const { data: companyData, error: companyError } = await supabase
            .from('companies')
            .select('*')
            .eq('id', userProfile.company_id)
            .single()

          if (companyError && companyError.code !== 'PGRST116') {
            throw companyError
          }

          company = companyData
        }
      }
    }

    return NextResponse.json({
      success: true,
      userProfile,
      company
    })

  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}

// POST - Create or update profile
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { personalProfile, companyProfile, userId } = body

    let companyId = null

    // First, create or update company if provided
    if (companyProfile && companyProfile.companyLegalName) {
      const companyData = {
        company_legal_name: companyProfile.companyLegalName,
        registration_number: companyProfile.registrationNumber,
        country_of_registration: companyProfile.countryOfRegistration,
        business_license_url: companyProfile.businessLicenseFile,
        company_type: companyProfile.companyType,
        industry_type: companyProfile.industryType,
        year_established: companyProfile.yearEstablished ? parseInt(companyProfile.yearEstablished) : null,
        company_email: companyProfile.companyEmail,
        company_phone: companyProfile.companyPhone,
        registered_address_street: companyProfile.registeredAddressStreet,
        registered_address_city: companyProfile.registeredAddressCity,
        registered_address_state: companyProfile.registeredAddressState,
        registered_address_postal: companyProfile.registeredAddressPostal,
        registered_address_country: companyProfile.registeredAddressCountry,
        trading_name: companyProfile.tradingName,
        company_website: companyProfile.companyWebsite,
        company_description: companyProfile.companyDescription,
        number_of_employees: companyProfile.numberOfEmployees,
        annual_revenue_range: companyProfile.annualRevenueRange,
        tax_id: companyProfile.taxId,
        operating_address_street: companyProfile.operatingAddressStreet,
        operating_address_city: companyProfile.operatingAddressCity,
        operating_address_state: companyProfile.operatingAddressState,
        operating_address_postal: companyProfile.operatingAddressPostal,
        operating_address_country: companyProfile.operatingAddressCountry,
        social_facebook: companyProfile.socialFacebook,
        social_instagram: companyProfile.socialInstagram,
        social_twitter: companyProfile.socialTwitter,
        social_linkedin: companyProfile.socialLinkedIn,
        social_youtube: companyProfile.socialYouTube,
        social_tiktok: companyProfile.socialTikTok,
        brand_logo_url: companyProfile.brandLogo,
        brand_colors: companyProfile.brandColors,
        brand_tagline: companyProfile.brandTagline,
        brand_personality: companyProfile.brandPersonality,
        brand_values: companyProfile.brandValues,
        communication_tone: companyProfile.communicationTone,
        communication_greeting: companyProfile.communicationGreeting,
        communication_sign_off: companyProfile.communicationSignOff,
        communication_languages: companyProfile.communicationLanguages,
        legal_documents: companyProfile.legalDocuments,
        policy_refunds: companyProfile.policyRefunds,
        policy_returns: companyProfile.policyReturns,
        policy_warranty: companyProfile.policyWarranty,
        policy_shipping: companyProfile.policyShipping,
        ai_topics_to_avoid: companyProfile.aiTopicsToAvoid,
        ai_competitors_never_mention: companyProfile.aiCompetitorsNeverMention,
        ai_escalation_rules: companyProfile.aiEscalationRules,
        bank_name: companyProfile.bankName,
        bank_account_name: companyProfile.bankAccountName,
        bank_account_number: companyProfile.bankAccountNumber,
        bank_swift_code: companyProfile.bankSwiftCode,
        created_by: userId || null,
        updated_at: new Date().toISOString()
      }

      // Check if company already exists for this user
      const { data: existingCompany } = await supabase
        .from('companies')
        .select('id')
        .eq('created_by', userId)
        .single()

      if (existingCompany) {
        // Update existing company
        const { data: updatedCompany, error: updateError } = await supabase
          .from('companies')
          .update(companyData)
          .eq('id', existingCompany.id)
          .select()
          .single()

        if (updateError) throw updateError
        companyId = updatedCompany.id
      } else {
        // Create new company
        const { data: newCompany, error: createError } = await supabase
          .from('companies')
          .insert(companyData)
          .select()
          .single()

        if (createError) throw createError
        companyId = newCompany.id
      }
    }

    // Then create or update user profile
    if (personalProfile && personalProfile.fullName) {
      const profileData = {
        user_id: userId || null,
        company_id: companyId,
        full_name: personalProfile.fullName,
        email: personalProfile.email,
        phone: personalProfile.phone,
        country_code: personalProfile.countryCode,
        role_in_company: personalProfile.roleInCompany,
        profile_photo_url: personalProfile.profilePhoto,
        preferred_name: personalProfile.preferredName,
        job_title: personalProfile.jobTitle,
        department: personalProfile.department,
        date_of_birth: personalProfile.dateOfBirth || null,
        gender: personalProfile.gender || null,
        nationality: personalProfile.nationality,
        languages_spoken: personalProfile.languagesSpoken,
        linkedin_url: personalProfile.linkedInUrl,
        bio: personalProfile.bio,
        timezone: personalProfile.timezone,
        id_type: personalProfile.idType,
        id_number: personalProfile.idNumber,
        id_front_image_url: personalProfile.idFrontImage,
        id_back_image_url: personalProfile.idBackImage,
        id_expiry: personalProfile.idExpiry || null,
        address_street: personalProfile.addressStreet,
        address_city: personalProfile.addressCity,
        address_state: personalProfile.addressState,
        address_postal: personalProfile.addressPostal,
        address_country: personalProfile.addressCountry,
        years_experience: personalProfile.yearsExperience ? parseInt(String(personalProfile.yearsExperience).replace(/[^0-9]/g, '')) || null : null,
        areas_of_expertise: personalProfile.areasOfExpertise,
        certifications: personalProfile.certifications,
        // GAINS Profile fields
        previous_job_type: personalProfile.previousJobType,
        spouse_name: personalProfile.spouseName,
        children_info: personalProfile.childrenInfo,
        pets_info: personalProfile.petsInfo,
        hobbies: personalProfile.hobbies,
        interests_activities: personalProfile.interestsActivities,
        residence_location: personalProfile.residenceLocation,
        residence_duration: personalProfile.residenceDuration,
        strong_desires: personalProfile.strongDesires,
        secret_nobody_knows: personalProfile.secretNobodyKnows,
        key_to_success: personalProfile.keyToSuccess,
        gains_goals: personalProfile.gainsGoals,
        gains_achievements: personalProfile.gainsAchievements,
        gains_interests: personalProfile.gainsInterests,
        gains_networks: personalProfile.gainsNetworks,
        gains_skills: personalProfile.gainsSkills,
        updated_at: new Date().toISOString()
      }

      // Check if profile already exists
      let existingProfile = null
      if (userId) {
        const { data } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('user_id', userId)
          .single()
        existingProfile = data
      }

      if (existingProfile) {
        // Update existing profile
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update(profileData)
          .eq('id', existingProfile.id)

        if (updateError) throw updateError
      } else {
        // Create new profile
        const { error: createError } = await supabase
          .from('user_profiles')
          .insert(profileData)

        if (createError) throw createError
      }
    }

    // Link company to all business units (since there's one company per user typically)
    if (companyId) {
      // Get all business units that don't have a company_id set
      const { data: unlinkedUnits } = await supabase
        .from('business_units')
        .select('id')
        .is('company_id', null)

      if (unlinkedUnits && unlinkedUnits.length > 0) {
        // Link them to this company
        await supabase
          .from('business_units')
          .update({ company_id: companyId })
          .in('id', unlinkedUnits.map(u => u.id))
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Profile saved successfully',
      companyId
    })

  } catch (error) {
    console.error('Error saving profile:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to save profile' },
      { status: 500 }
    )
  }
}
