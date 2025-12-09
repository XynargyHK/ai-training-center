'use client'

import { useState, useEffect, useRef } from 'react'
import { X, User, Building2, Upload, Camera, Save, AlertCircle, Loader2, FileText, Sparkles } from 'lucide-react'
import { type Language, getTranslation } from '@/lib/translations'

// Calculate profile completion percentage
function calculateProfileCompletion(personal: PersonalProfile, company: CompanyProfile): { personal: number, company: number, total: number } {
  // Personal required fields
  const personalRequired = ['fullName', 'email', 'phone', 'roleInCompany']
  const personalFilled = personalRequired.filter(field => {
    const value = personal[field as keyof PersonalProfile]
    return value && String(value).trim() !== ''
  }).length
  const personalPercent = Math.round((personalFilled / personalRequired.length) * 100)

  // Company required fields
  const companyRequired = [
    'companyLegalName', 'registrationNumber', 'countryOfRegistration',
    'companyType', 'industryType', 'companyEmail', 'companyPhone',
    'registeredAddressStreet', 'registeredAddressCity', 'registeredAddressPostal', 'registeredAddressCountry'
  ]
  const companyFilled = companyRequired.filter(field => {
    const value = company[field as keyof CompanyProfile]
    return value && String(value).trim() !== ''
  }).length
  const companyPercent = Math.round((companyFilled / companyRequired.length) * 100)

  // Overall completion (weighted average)
  const totalPercent = Math.round((personalPercent + companyPercent) / 2)

  return { personal: personalPercent, company: companyPercent, total: totalPercent }
}

// File upload helper function
async function uploadProfileFile(file: File, type: string, userId: string = 'anonymous'): Promise<string | null> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('type', type)
  formData.append('userId', userId)

  try {
    const response = await fetch('/api/profile/upload', {
      method: 'POST',
      body: formData
    })

    const data = await response.json()
    if (data.success) {
      return data.file.url
    } else {
      console.error('Upload failed:', data.error)
      return null
    }
  } catch (error) {
    console.error('Upload error:', error)
    return null
  }
}


interface ProfileModalProps {
  isOpen: boolean
  onClose: () => void
  language: Language
}

interface PersonalProfile {
  // Required fields
  fullName: string
  email: string
  phone: string
  countryCode: string
  roleInCompany: 'owner' | 'director' | 'manager' | 'administrator' | 'other' | ''
  profilePhoto?: string

  // Optional fields
  preferredName?: string
  jobTitle?: string
  department?: string
  dateOfBirth?: string
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say' | ''
  nationality?: string
  languagesSpoken?: string[]
  linkedInUrl?: string
  bio?: string
  timezone?: string

  // ID Documents (optional)
  idType?: string
  idNumber?: string
  idFrontImage?: string
  idBackImage?: string
  idExpiry?: string

  // Address (optional)
  addressStreet?: string
  addressCity?: string
  addressState?: string
  addressPostal?: string
  addressCountry?: string

  // Professional (optional)
  yearsExperience?: number
  previousJobType?: string
  areasOfExpertise?: string[]
  certifications?: Array<{
    name: string
    organization: string
    date: string
    fileUrl?: string
  }>

  // Family Info (GAINS Profile)
  spouseName?: string
  childrenInfo?: string
  petsInfo?: string

  // Personal Interests (GAINS Profile)
  hobbies?: string
  interestsActivities?: string
  residenceLocation?: string
  residenceDuration?: string

  // General Info (GAINS Profile)
  strongDesires?: string
  secretNobodyKnows?: string
  keyToSuccess?: string

  // GAINS Worksheet
  gainsGoals?: string
  gainsAchievements?: string
  gainsInterests?: string
  gainsNetworks?: string
  gainsSkills?: string
}

interface CompanyProfile {
  // Required fields
  companyLegalName: string
  registrationNumber: string
  countryOfRegistration: string
  businessLicenseFile?: string
  companyType: 'sole_proprietor' | 'partnership' | 'private_limited' | 'public' | 'non_profit' | 'other' | ''
  industryType: string
  yearEstablished: string
  companyEmail: string
  companyPhone: string
  registeredAddressStreet: string
  registeredAddressCity: string
  registeredAddressState: string
  registeredAddressPostal: string
  registeredAddressCountry: string

  // Optional fields
  tradingName?: string
  companyWebsite?: string
  companyDescription?: string
  numberOfEmployees?: string
  annualRevenueRange?: string
  taxId?: string
  operatingAddressStreet?: string
  operatingAddressCity?: string
  operatingAddressState?: string
  operatingAddressPostal?: string
  operatingAddressCountry?: string

  // Social Media (optional)
  socialFacebook?: string
  socialInstagram?: string
  socialTwitter?: string
  socialLinkedIn?: string
  socialYouTube?: string
  socialTikTok?: string

  // Expandable sections (optional)
  brandLogo?: string
  brandColors?: string[]
  brandTagline?: string
  brandPersonality?: string
  brandValues?: string[]

  communicationTone?: string
  communicationGreeting?: string
  communicationSignOff?: string
  communicationLanguages?: string[]

  legalDocuments?: Array<{
    type: string
    name: string
    fileUrl: string
  }>

  policyRefunds?: string
  policyReturns?: string
  policyWarranty?: string
  policyShipping?: string

  aiTopicsToAvoid?: string[]
  aiCompetitorsNeverMention?: string[]
  aiEscalationRules?: string

  bankName?: string
  bankAccountName?: string
  bankAccountNumber?: string
  bankSwiftCode?: string
}

const countryCodes = [
  { code: '+1', country: 'US/CA' },
  { code: '+44', country: 'UK' },
  { code: '+86', country: 'CN' },
  { code: '+852', country: 'HK' },
  { code: '+886', country: 'TW' },
  { code: '+84', country: 'VN' },
  { code: '+65', country: 'SG' },
  { code: '+60', country: 'MY' },
  { code: '+61', country: 'AU' },
  { code: '+81', country: 'JP' },
  { code: '+82', country: 'KR' },
  { code: '+91', country: 'IN' },
  { code: '+62', country: 'ID' },
  { code: '+63', country: 'PH' },
  { code: '+66', country: 'TH' },
]

const industries = [
  'Technology',
  'Healthcare',
  'Finance',
  'Retail',
  'Manufacturing',
  'Education',
  'Real Estate',
  'Hospitality',
  'Food & Beverage',
  'Beauty & Wellness',
  'Fashion',
  'Automotive',
  'Construction',
  'Entertainment',
  'Non-Profit',
  'Other'
]

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, language }) => {
  const t = getTranslation(language)
  const [activeTab, setActiveTab] = useState<'personal' | 'company'>('personal')
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // Personal Profile State
  const [personalProfile, setPersonalProfile] = useState<PersonalProfile>({
    fullName: '',
    email: '',
    phone: '',
    countryCode: '+1',
    roleInCompany: '',
    preferredName: '',
    jobTitle: '',
    department: '',
    dateOfBirth: '',
    gender: '',
    nationality: '',
    languagesSpoken: [],
    linkedInUrl: '',
    bio: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  })

  // Company Profile State
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>({
    companyLegalName: '',
    registrationNumber: '',
    countryOfRegistration: '',
    companyType: '',
    industryType: '',
    yearEstablished: '',
    companyEmail: '',
    companyPhone: '',
    registeredAddressStreet: '',
    registeredAddressCity: '',
    registeredAddressState: '',
    registeredAddressPostal: '',
    registeredAddressCountry: '',
    tradingName: '',
    companyWebsite: '',
    companyDescription: '',
  })

  // Load saved profiles on mount
  useEffect(() => {
    const loadProfiles = async () => {
      try {
        // Try to load from database first
        const response = await fetch('/api/profile')
        const data = await response.json()

        if (data.success && data.userProfile) {
          // Map database fields to frontend state
          setPersonalProfile({
            fullName: data.userProfile.full_name || '',
            email: data.userProfile.email || '',
            phone: data.userProfile.phone || '',
            countryCode: data.userProfile.country_code || '+1',
            roleInCompany: data.userProfile.role_in_company || '',
            profilePhoto: data.userProfile.profile_photo_url,
            preferredName: data.userProfile.preferred_name,
            jobTitle: data.userProfile.job_title,
            department: data.userProfile.department,
            dateOfBirth: data.userProfile.date_of_birth,
            gender: data.userProfile.gender,
            nationality: data.userProfile.nationality,
            languagesSpoken: data.userProfile.languages_spoken,
            linkedInUrl: data.userProfile.linkedin_url,
            bio: data.userProfile.bio,
            timezone: data.userProfile.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
            idType: data.userProfile.id_type,
            idNumber: data.userProfile.id_number,
            idFrontImage: data.userProfile.id_front_image_url,
            idBackImage: data.userProfile.id_back_image_url,
            idExpiry: data.userProfile.id_expiry,
            addressStreet: data.userProfile.address_street,
            addressCity: data.userProfile.address_city,
            addressState: data.userProfile.address_state,
            addressPostal: data.userProfile.address_postal,
            addressCountry: data.userProfile.address_country,
            yearsExperience: data.userProfile.years_experience,
            areasOfExpertise: data.userProfile.areas_of_expertise,
            certifications: data.userProfile.certifications,
            // GAINS Profile fields
            previousJobType: data.userProfile.previous_job_type,
            spouseName: data.userProfile.spouse_name,
            childrenInfo: data.userProfile.children_info,
            petsInfo: data.userProfile.pets_info,
            hobbies: data.userProfile.hobbies,
            interestsActivities: data.userProfile.interests_activities,
            residenceLocation: data.userProfile.residence_location,
            residenceDuration: data.userProfile.residence_duration,
            strongDesires: data.userProfile.strong_desires,
            secretNobodyKnows: data.userProfile.secret_nobody_knows,
            keyToSuccess: data.userProfile.key_to_success,
            gainsGoals: data.userProfile.gains_goals,
            gainsAchievements: data.userProfile.gains_achievements,
            gainsInterests: data.userProfile.gains_interests,
            gainsNetworks: data.userProfile.gains_networks,
            gainsSkills: data.userProfile.gains_skills,
          })
        } else {
          // Fallback to localStorage
          const savedPersonal = localStorage.getItem('personalProfile')
          if (savedPersonal) {
            setPersonalProfile(JSON.parse(savedPersonal))
          }
        }

        if (data.success && data.company) {
          // Map database fields to frontend state
          setCompanyProfile({
            companyLegalName: data.company.company_legal_name || '',
            registrationNumber: data.company.registration_number || '',
            countryOfRegistration: data.company.country_of_registration || '',
            businessLicenseFile: data.company.business_license_url,
            companyType: data.company.company_type || '',
            industryType: data.company.industry_type || '',
            yearEstablished: data.company.year_established?.toString() || '',
            companyEmail: data.company.company_email || '',
            companyPhone: data.company.company_phone || '',
            registeredAddressStreet: data.company.registered_address_street || '',
            registeredAddressCity: data.company.registered_address_city || '',
            registeredAddressState: data.company.registered_address_state || '',
            registeredAddressPostal: data.company.registered_address_postal || '',
            registeredAddressCountry: data.company.registered_address_country || '',
            tradingName: data.company.trading_name,
            companyWebsite: data.company.company_website,
            companyDescription: data.company.company_description,
            numberOfEmployees: data.company.number_of_employees,
            annualRevenueRange: data.company.annual_revenue_range,
            taxId: data.company.tax_id,
            operatingAddressStreet: data.company.operating_address_street,
            operatingAddressCity: data.company.operating_address_city,
            operatingAddressState: data.company.operating_address_state,
            operatingAddressPostal: data.company.operating_address_postal,
            operatingAddressCountry: data.company.operating_address_country,
            socialFacebook: data.company.social_facebook,
            socialInstagram: data.company.social_instagram,
            socialTwitter: data.company.social_twitter,
            socialLinkedIn: data.company.social_linkedin,
            socialYouTube: data.company.social_youtube,
            socialTikTok: data.company.social_tiktok,
            brandLogo: data.company.brand_logo_url,
            brandColors: data.company.brand_colors,
            brandTagline: data.company.brand_tagline,
            brandPersonality: data.company.brand_personality,
            brandValues: data.company.brand_values,
            communicationTone: data.company.communication_tone,
            communicationGreeting: data.company.communication_greeting,
            communicationSignOff: data.company.communication_sign_off,
            communicationLanguages: data.company.communication_languages,
            legalDocuments: data.company.legal_documents,
            policyRefunds: data.company.policy_refunds,
            policyReturns: data.company.policy_returns,
            policyWarranty: data.company.policy_warranty,
            policyShipping: data.company.policy_shipping,
            aiTopicsToAvoid: data.company.ai_topics_to_avoid,
            aiCompetitorsNeverMention: data.company.ai_competitors_never_mention,
            aiEscalationRules: data.company.ai_escalation_rules,
            bankName: data.company.bank_name,
            bankAccountName: data.company.bank_account_name,
            bankAccountNumber: data.company.bank_account_number,
            bankSwiftCode: data.company.bank_swift_code,
          })
        } else {
          // Fallback to localStorage
          const savedCompany = localStorage.getItem('companyProfile')
          if (savedCompany) {
            setCompanyProfile(JSON.parse(savedCompany))
          }
        }
      } catch (error) {
        console.error('Failed to load profiles from API, falling back to localStorage:', error)
        // Fallback to localStorage
        const savedPersonal = localStorage.getItem('personalProfile')
        const savedCompany = localStorage.getItem('companyProfile')
        if (savedPersonal) setPersonalProfile(JSON.parse(savedPersonal))
        if (savedCompany) setCompanyProfile(JSON.parse(savedCompany))
      }
    }

    if (isOpen) {
      loadProfiles()
    }
  }, [isOpen])

  const handleSave = async () => {
    setIsSaving(true)
    setSaveMessage(null)

    try {
      // Save to database via API
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalProfile,
          companyProfile,
          userId: null // Will be set when auth is implemented
        }),
      })

      const data = await response.json()

      if (data.success) {
        // Also save to localStorage as backup
        localStorage.setItem('personalProfile', JSON.stringify(personalProfile))
        localStorage.setItem('companyProfile', JSON.stringify(companyProfile))

        setSaveMessage({ type: 'success', text: 'Profile saved successfully!' })
        setTimeout(() => setSaveMessage(null), 3000)
      } else {
        throw new Error(data.error || 'Failed to save')
      }
    } catch (error) {
      console.error('Failed to save profiles:', error)
      // Fallback: save to localStorage
      localStorage.setItem('personalProfile', JSON.stringify(personalProfile))
      localStorage.setItem('companyProfile', JSON.stringify(companyProfile))
      setSaveMessage({ type: 'error', text: 'Saved locally. Database sync failed.' })
    } finally {
      setIsSaving(false)
    }
  }

  const handlePersonalChange = (field: keyof PersonalProfile, value: any) => {
    setPersonalProfile(prev => ({ ...prev, [field]: value }))
  }

  const handleCompanyChange = (field: keyof CompanyProfile, value: any) => {
    setCompanyProfile(prev => ({ ...prev, [field]: value }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-slate-900 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-slate-700 shadow-2xl">
          {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-4">
            {/* Tab Buttons */}
            {(() => {
              const completion = calculateProfileCompletion(personalProfile, companyProfile)
              return (
                <>
                  <button
                    onClick={() => setActiveTab('personal')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                      activeTab === 'personal'
                        ? 'bg-gradient-to-r from-purple-500 to-cyan-500 text-white'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <User className="w-5 h-5" />
                    {t.personalProfile}
                    <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${
                      completion.personal === 100
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {completion.personal}%
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTab('company')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                      activeTab === 'company'
                        ? 'bg-gradient-to-r from-purple-500 to-cyan-500 text-white'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Building2 className="w-5 h-5" />
                    {t.companyProfile}
                    <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${
                      completion.company === 100
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {completion.company}%
                    </span>
                  </button>
                </>
              )
            })()}
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {activeTab === 'personal' ? (
            <PersonalProfileForm
              profile={personalProfile}
              onChange={handlePersonalChange}
              language={language}
            />
          ) : (
            <CompanyProfileForm
              profile={companyProfile}
              onChange={handleCompanyChange}
              language={language}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-slate-700 bg-slate-800/50">
          <div className="flex items-center gap-4">
            {/* Overall completion bar */}
            {(() => {
              const completion = calculateProfileCompletion(personalProfile, companyProfile)
              return (
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        completion.total === 100 ? 'bg-green-500' : 'bg-purple-500'
                      }`}
                      style={{ width: `${completion.total}%` }}
                    />
                  </div>
                  <span className={`text-sm ${
                    completion.total === 100 ? 'text-green-400' : 'text-slate-400'
                  }`}>
                    {completion.total}% complete
                  </span>
                </div>
              )
            })()}
            {saveMessage && (
              <div className={`flex items-center gap-2 text-sm ${
                saveMessage.type === 'success' ? 'text-green-400' : 'text-red-400'
              }`}>
                <AlertCircle className="w-4 h-4" />
                {saveMessage.text}
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
            >
              {t.cancel}
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 text-white rounded-lg font-semibold transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : t.save}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Personal Profile Form Component
const PersonalProfileForm: React.FC<{
  profile: PersonalProfile
  onChange: (field: keyof PersonalProfile, value: any) => void
  language: Language
}> = ({ profile, onChange, language }) => {
  const t = getTranslation(language)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const gainsInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isExtractingGains, setIsExtractingGains] = useState(false)
  const [extractionMessage, setExtractionMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const url = await uploadProfileFile(file, 'profile_photo')
      if (url) {
        onChange('profilePhoto', url)
      }
    } finally {
      setIsUploading(false)
    }
  }

  const handleGainsUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsExtractingGains(true)
    setExtractionMessage(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/profile/extract-gains', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (result.success && result.data) {
        // Auto-fill all extracted fields
        const fieldMappings: { [key: string]: keyof PersonalProfile } = {
          fullName: 'fullName',
          email: 'email',
          phone: 'phone',
          jobTitle: 'jobTitle',
          department: 'department',
          yearsExperience: 'yearsExperience',
          previousJobType: 'previousJobType',
          spouseName: 'spouseName',
          childrenInfo: 'childrenInfo',
          petsInfo: 'petsInfo',
          hobbies: 'hobbies',
          interestsActivities: 'interestsActivities',
          residenceLocation: 'residenceLocation',
          residenceDuration: 'residenceDuration',
          strongDesires: 'strongDesires',
          secretNobodyKnows: 'secretNobodyKnows',
          keyToSuccess: 'keyToSuccess',
          gainsGoals: 'gainsGoals',
          gainsAchievements: 'gainsAchievements',
          gainsInterests: 'gainsInterests',
          gainsNetworks: 'gainsNetworks',
          gainsSkills: 'gainsSkills',
        }

        let fieldsUpdated = 0
        for (const [extractedKey, profileKey] of Object.entries(fieldMappings)) {
          if (result.data[extractedKey]) {
            onChange(profileKey, result.data[extractedKey])
            fieldsUpdated++
          }
        }

        setExtractionMessage({
          type: 'success',
          text: `Extracted ${fieldsUpdated} fields from your GAINS profile!`
        })
      } else {
        setExtractionMessage({
          type: 'error',
          text: result.error || 'Failed to extract data from document'
        })
      }
    } catch (error) {
      console.error('GAINS extraction error:', error)
      setExtractionMessage({
        type: 'error',
        text: 'Failed to process document'
      })
    } finally {
      setIsExtractingGains(false)
      // Clear the input so the same file can be uploaded again
      if (gainsInputRef.current) {
        gainsInputRef.current.value = ''
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* GAINS Profile Upload Banner */}
      <div className="bg-gradient-to-r from-purple-900/50 to-cyan-900/50 rounded-xl p-4 border border-purple-500/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Sparkles className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold">Quick Fill with GAINS Profile</h3>
              <p className="text-sm text-slate-400">Upload your BNI GAINS Profile PDF to auto-fill your information</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input
              ref={gainsInputRef}
              type="file"
              accept=".pdf,image/jpeg,image/png,image/webp"
              onChange={handleGainsUpload}
              className="hidden"
            />
            <button
              onClick={() => gainsInputRef.current?.click()}
              disabled={isExtractingGains}
              className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {isExtractingGains ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Extracting...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  Upload GAINS PDF
                </>
              )}
            </button>
          </div>
        </div>
        {extractionMessage && (
          <div className={`mt-3 flex items-center gap-2 text-sm ${
            extractionMessage.type === 'success' ? 'text-green-400' : 'text-red-400'
          }`}>
            <AlertCircle className="w-4 h-4" />
            {extractionMessage.text}
          </div>
        )}
      </div>

      {/* Profile Photo */}
      <div className="flex items-center gap-6">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden border-2 border-slate-600">
            {isUploading ? (
              <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
            ) : profile.profilePhoto ? (
              <img src={profile.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User className="w-12 h-12 text-slate-400" />
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handlePhotoUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="absolute bottom-0 right-0 p-2 bg-purple-500 rounded-full hover:bg-purple-600 transition-colors disabled:opacity-50"
          >
            <Camera className="w-4 h-4 text-white" />
          </button>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Profile Photo</h3>
          <p className="text-sm text-slate-400">Upload a professional photo (JPG, PNG, max 10MB)</p>
        </div>
      </div>

      {/* Required Fields Section */}
      <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <span className="text-red-400">*</span> Required Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Full Legal Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={profile.fullName}
              onChange={(e) => onChange('fullName', e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter your full legal name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Email Address <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={profile.email}
              onChange={(e) => onChange('email', e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Phone Number <span className="text-red-400">*</span>
            </label>
            <div className="flex gap-2">
              <select
                value={profile.countryCode}
                onChange={(e) => onChange('countryCode', e.target.value)}
                className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {countryCodes.map(({ code, country }) => (
                  <option key={code} value={code}>{code} {country}</option>
                ))}
              </select>
              <input
                type="tel"
                value={profile.phone}
                onChange={(e) => onChange('phone', e.target.value)}
                className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Phone number"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Role in Company <span className="text-red-400">*</span>
            </label>
            <select
              value={profile.roleInCompany}
              onChange={(e) => onChange('roleInCompany', e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Select role</option>
              <option value="owner">Owner</option>
              <option value="director">Director</option>
              <option value="manager">Manager</option>
              <option value="administrator">Administrator</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Optional Fields Section */}
      <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">Optional Information</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Preferred Name / Nickname
            </label>
            <input
              type="text"
              value={profile.preferredName || ''}
              onChange={(e) => onChange('preferredName', e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="What should we call you?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Job Title
            </label>
            <input
              type="text"
              value={profile.jobTitle || ''}
              onChange={(e) => onChange('jobTitle', e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="e.g. CEO, Marketing Director"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Department
            </label>
            <input
              type="text"
              value={profile.department || ''}
              onChange={(e) => onChange('department', e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="e.g. Sales, Operations"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Date of Birth
            </label>
            <input
              type="date"
              value={profile.dateOfBirth || ''}
              onChange={(e) => onChange('dateOfBirth', e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Gender
            </label>
            <select
              value={profile.gender || ''}
              onChange={(e) => onChange('gender', e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Prefer not to say</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Nationality
            </label>
            <input
              type="text"
              value={profile.nationality || ''}
              onChange={(e) => onChange('nationality', e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="e.g. American, Chinese"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              LinkedIn Profile URL
            </label>
            <input
              type="url"
              value={profile.linkedInUrl || ''}
              onChange={(e) => onChange('linkedInUrl', e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="https://linkedin.com/in/yourprofile"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Timezone
            </label>
            <input
              type="text"
              value={profile.timezone || ''}
              onChange={(e) => onChange('timezone', e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Auto-detected"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Bio / About Me
            </label>
            <textarea
              value={profile.bio || ''}
              onChange={(e) => onChange('bio', e.target.value)}
              rows={3}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              placeholder="Tell us about yourself..."
            />
          </div>
        </div>
      </div>

      {/* Family & Personal Info Section (GAINS Profile) */}
      <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">Family & Personal Info</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Spouse / Partner Name
            </label>
            <input
              type="text"
              value={profile.spouseName || ''}
              onChange={(e) => onChange('spouseName', e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Spouse or partner's name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Children
            </label>
            <input
              type="text"
              value={profile.childrenInfo || ''}
              onChange={(e) => onChange('childrenInfo', e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="e.g. 2 kids (ages 5 and 8)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Pets
            </label>
            <input
              type="text"
              value={profile.petsInfo || ''}
              onChange={(e) => onChange('petsInfo', e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="e.g. Golden Retriever named Max"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Previous Job Type
            </label>
            <input
              type="text"
              value={profile.previousJobType || ''}
              onChange={(e) => onChange('previousJobType', e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Your previous profession or career"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Hobbies
            </label>
            <input
              type="text"
              value={profile.hobbies || ''}
              onChange={(e) => onChange('hobbies', e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="e.g. Golf, Reading, Cooking"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Interests / Activities
            </label>
            <input
              type="text"
              value={profile.interestsActivities || ''}
              onChange={(e) => onChange('interestsActivities', e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="e.g. Networking, Community service"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Residence Location
            </label>
            <input
              type="text"
              value={profile.residenceLocation || ''}
              onChange={(e) => onChange('residenceLocation', e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Where do you live?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              How Long Have You Lived There?
            </label>
            <input
              type="text"
              value={profile.residenceDuration || ''}
              onChange={(e) => onChange('residenceDuration', e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="e.g. 5 years"
            />
          </div>
        </div>
      </div>

      {/* General Info Section (GAINS Profile) */}
      <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">About You</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              What Are Your Strong Desires / Wishes?
            </label>
            <textarea
              value={profile.strongDesires || ''}
              onChange={(e) => onChange('strongDesires', e.target.value)}
              rows={2}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              placeholder="What do you strongly desire or wish to achieve?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              A Secret Nobody Knows About You
            </label>
            <textarea
              value={profile.secretNobodyKnows || ''}
              onChange={(e) => onChange('secretNobodyKnows', e.target.value)}
              rows={2}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              placeholder="Something interesting people don't know about you..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Key to Your Success
            </label>
            <textarea
              value={profile.keyToSuccess || ''}
              onChange={(e) => onChange('keyToSuccess', e.target.value)}
              rows={2}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              placeholder="What has been key to your success?"
            />
          </div>
        </div>
      </div>

      {/* GAINS Worksheet Section */}
      <div className="bg-gradient-to-br from-purple-900/30 to-cyan-900/30 rounded-xl p-4 border border-purple-500/30">
        <h3 className="text-lg font-semibold text-white mb-2">GAINS Worksheet</h3>
        <p className="text-sm text-slate-400 mb-4">Goals, Achievements, Interests, Networks, Skills - Help others understand how to refer you better</p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-purple-300 mb-1">
              G - Goals
            </label>
            <textarea
              value={profile.gainsGoals || ''}
              onChange={(e) => onChange('gainsGoals', e.target.value)}
              rows={2}
              className="w-full px-4 py-2 bg-slate-700/70 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              placeholder="What are your business and personal goals? What type of referrals are you looking for?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-cyan-300 mb-1">
              A - Achievements
            </label>
            <textarea
              value={profile.gainsAchievements || ''}
              onChange={(e) => onChange('gainsAchievements', e.target.value)}
              rows={2}
              className="w-full px-4 py-2 bg-slate-700/70 border border-cyan-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
              placeholder="What are your key accomplishments and achievements? Awards, certifications, notable projects?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-green-300 mb-1">
              I - Interests
            </label>
            <textarea
              value={profile.gainsInterests || ''}
              onChange={(e) => onChange('gainsInterests', e.target.value)}
              rows={2}
              className="w-full px-4 py-2 bg-slate-700/70 border border-green-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
              placeholder="What topics, industries, or activities interest you professionally and personally?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-yellow-300 mb-1">
              N - Networks
            </label>
            <textarea
              value={profile.gainsNetworks || ''}
              onChange={(e) => onChange('gainsNetworks', e.target.value)}
              rows={2}
              className="w-full px-4 py-2 bg-slate-700/70 border border-yellow-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 resize-none"
              placeholder="What groups, associations, or communities are you part of? Who do you know?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-pink-300 mb-1">
              S - Skills
            </label>
            <textarea
              value={profile.gainsSkills || ''}
              onChange={(e) => onChange('gainsSkills', e.target.value)}
              rows={2}
              className="w-full px-4 py-2 bg-slate-700/70 border border-pink-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none"
              placeholder="What are your special skills, talents, or expertise that set you apart?"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// Business License Upload Component
const BusinessLicenseUpload: React.FC<{
  currentUrl?: string
  onChange: (url: string) => void
}> = ({ currentUrl, onChange }) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setFileName(file.name)
    try {
      const url = await uploadProfileFile(file, 'document')
      if (url) {
        onChange(url)
      }
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="mt-4">
      <label className="block text-sm font-medium text-slate-300 mb-1">
        Business Registration License <span className="text-red-400">*</span>
      </label>
      <div className="flex items-center gap-4">
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,image/jpeg,image/png"
          onChange={handleUpload}
          className="hidden"
        />
        <button
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="flex items-center gap-2 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white hover:bg-slate-600 transition-colors disabled:opacity-50"
        >
          {isUploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
          {isUploading ? 'Uploading...' : 'Upload Document'}
        </button>
        {currentUrl ? (
          <a
            href={currentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-purple-400 hover:text-purple-300"
          >
            {fileName || 'View uploaded document'}
          </a>
        ) : (
          <span className="text-sm text-slate-400">PDF, JPG, or PNG (max 10MB)</span>
        )}
      </div>
    </div>
  )
}

// Company Profile Form Component
const CompanyProfileForm: React.FC<{
  profile: CompanyProfile
  onChange: (field: keyof CompanyProfile, value: any) => void
  language: Language
}> = ({ profile, onChange, language }) => {
  const t = getTranslation(language)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const url = await uploadProfileFile(file, 'company_logo')
      if (url) {
        onChange('brandLogo', url)
      }
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Company Logo */}
      <div className="flex items-center gap-6">
        <div className="relative">
          <div className="w-24 h-24 rounded-xl bg-slate-700 flex items-center justify-center overflow-hidden border-2 border-slate-600">
            {isUploading ? (
              <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
            ) : profile.brandLogo ? (
              <img src={profile.brandLogo} alt="Company Logo" className="w-full h-full object-cover" />
            ) : (
              <Building2 className="w-12 h-12 text-slate-400" />
            )}
          </div>
          <input
            ref={logoInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleLogoUpload}
            className="hidden"
          />
          <button
            onClick={() => logoInputRef.current?.click()}
            disabled={isUploading}
            className="absolute bottom-0 right-0 p-2 bg-purple-500 rounded-full hover:bg-purple-600 transition-colors disabled:opacity-50"
          >
            <Upload className="w-4 h-4 text-white" />
          </button>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Company Logo</h3>
          <p className="text-sm text-slate-400">Upload your company logo (JPG, PNG, max 10MB)</p>
        </div>
      </div>

      {/* Required Fields Section */}
      <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <span className="text-red-400">*</span> Required Company Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Company Legal Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={profile.companyLegalName}
              onChange={(e) => onChange('companyLegalName', e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Official registered company name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Registration Number <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={profile.registrationNumber}
              onChange={(e) => onChange('registrationNumber', e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Company registration number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Country of Registration <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={profile.countryOfRegistration}
              onChange={(e) => onChange('countryOfRegistration', e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="e.g. United States"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Company Type <span className="text-red-400">*</span>
            </label>
            <select
              value={profile.companyType}
              onChange={(e) => onChange('companyType', e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Select company type</option>
              <option value="sole_proprietor">Sole Proprietor</option>
              <option value="partnership">Partnership</option>
              <option value="private_limited">Private Limited (Ltd/LLC)</option>
              <option value="public">Public Company</option>
              <option value="non_profit">Non-Profit Organization</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Industry Type <span className="text-red-400">*</span>
            </label>
            <select
              value={profile.industryType}
              onChange={(e) => onChange('industryType', e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Select industry</option>
              {industries.map(industry => (
                <option key={industry} value={industry.toLowerCase()}>{industry}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Year Established <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              value={profile.yearEstablished}
              onChange={(e) => onChange('yearEstablished', e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="e.g. 2020"
              min="1800"
              max={new Date().getFullYear()}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Company Email <span className="text-red-400">*</span>
            </label>
            <input
              type="email"
              value={profile.companyEmail}
              onChange={(e) => onChange('companyEmail', e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="contact@company.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Company Phone <span className="text-red-400">*</span>
            </label>
            <input
              type="tel"
              value={profile.companyPhone}
              onChange={(e) => onChange('companyPhone', e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="+1 (555) 123-4567"
            />
          </div>
        </div>

        {/* Registered Address */}
        <h4 className="text-md font-medium text-white mt-6 mb-3">Registered Address <span className="text-red-400">*</span></h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-300 mb-1">Street Address</label>
            <input
              type="text"
              value={profile.registeredAddressStreet}
              onChange={(e) => onChange('registeredAddressStreet', e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="123 Business Street, Suite 100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">City</label>
            <input
              type="text"
              value={profile.registeredAddressCity}
              onChange={(e) => onChange('registeredAddressCity', e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="City"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">State / Province</label>
            <input
              type="text"
              value={profile.registeredAddressState}
              onChange={(e) => onChange('registeredAddressState', e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="State / Province"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Postal Code</label>
            <input
              type="text"
              value={profile.registeredAddressPostal}
              onChange={(e) => onChange('registeredAddressPostal', e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Postal Code"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Country</label>
            <input
              type="text"
              value={profile.registeredAddressCountry}
              onChange={(e) => onChange('registeredAddressCountry', e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Country"
            />
          </div>
        </div>

        {/* Business License Upload */}
        <BusinessLicenseUpload
          currentUrl={profile.businessLicenseFile}
          onChange={(url) => onChange('businessLicenseFile', url)}
        />
      </div>

      {/* Optional Fields Section */}
      <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">Optional Company Information</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Trading Name / DBA
            </label>
            <input
              type="text"
              value={profile.tradingName || ''}
              onChange={(e) => onChange('tradingName', e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Doing business as..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Company Website
            </label>
            <input
              type="url"
              value={profile.companyWebsite || ''}
              onChange={(e) => onChange('companyWebsite', e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="https://www.company.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Number of Employees
            </label>
            <select
              value={profile.numberOfEmployees || ''}
              onChange={(e) => onChange('numberOfEmployees', e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Select range</option>
              <option value="1-10">1-10</option>
              <option value="11-50">11-50</option>
              <option value="51-200">51-200</option>
              <option value="201-500">201-500</option>
              <option value="501-1000">501-1000</option>
              <option value="1000+">1000+</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Annual Revenue Range
            </label>
            <select
              value={profile.annualRevenueRange || ''}
              onChange={(e) => onChange('annualRevenueRange', e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Select range</option>
              <option value="<100k">Less than $100K</option>
              <option value="100k-500k">$100K - $500K</option>
              <option value="500k-1m">$500K - $1M</option>
              <option value="1m-5m">$1M - $5M</option>
              <option value="5m-10m">$5M - $10M</option>
              <option value="10m+">$10M+</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Tax ID / VAT Number
            </label>
            <input
              type="text"
              value={profile.taxId || ''}
              onChange={(e) => onChange('taxId', e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Tax identification number"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Company Description
            </label>
            <textarea
              value={profile.companyDescription || ''}
              onChange={(e) => onChange('companyDescription', e.target.value)}
              rows={3}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              placeholder="Describe your company, products, and services..."
            />
          </div>
        </div>
      </div>

      {/* Social Media Section */}
      <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">Social Media Links (Optional)</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Facebook</label>
            <input
              type="url"
              value={profile.socialFacebook || ''}
              onChange={(e) => onChange('socialFacebook', e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="https://facebook.com/yourpage"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Instagram</label>
            <input
              type="url"
              value={profile.socialInstagram || ''}
              onChange={(e) => onChange('socialInstagram', e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="https://instagram.com/yourpage"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">LinkedIn</label>
            <input
              type="url"
              value={profile.socialLinkedIn || ''}
              onChange={(e) => onChange('socialLinkedIn', e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="https://linkedin.com/company/yourcompany"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">YouTube</label>
            <input
              type="url"
              value={profile.socialYouTube || ''}
              onChange={(e) => onChange('socialYouTube', e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="https://youtube.com/@yourchannel"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfileModal
