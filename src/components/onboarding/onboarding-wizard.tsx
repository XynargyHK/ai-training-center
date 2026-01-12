'use client'

/**
 * AI Onboarding Wizard
 *
 * Complete onboarding flow:
 * Step 1: Personal Profile (with document upload for AI extraction)
 * Step 2: Company Profile
 * Step 3: Business Unit Setup (AI-guided, one at a time)
 * Step 4: Knowledge Upload (for AI training)
 */

import { useState, useEffect } from 'react'
import {
  User, Building2, Store, Upload, Check, ChevronRight, ChevronLeft,
  Loader2, Sparkles, X, Camera, Link2, FileText, Globe, Phone, Mail,
  MapPin, Hash, CreditCard, Linkedin, Facebook, Instagram, Twitter,
  BookOpen, AlertCircle, CheckCircle
} from 'lucide-react'

// Types
interface PersonalProfile {
  firstName: string
  lastName: string
  email: string
  phone: string
  bio: string
  profilePhoto: string | null
  socialLinks: {
    linkedin: string
    facebook: string
    instagram: string
    twitter: string
  }
}

interface CompanyProfile {
  companyName: string
  companyUrl: string
  industry: string
  address: string
  city: string
  country: string
  registrationNo: string
  billingEmail: string
}

interface BusinessUnit {
  id?: string
  name: string
  type: 'service' | 'product' | 'both'
  description: string
  documents: File[]
  enableBooking: boolean
  enableProducts: boolean
  enableFaq: boolean
}

interface OnboardingWizardProps {
  onComplete: () => void
  existingProfile?: {
    personal?: Partial<PersonalProfile>
    company?: Partial<CompanyProfile>
  }
}

interface KnowledgeFile {
  file: File
  name: string
  type: 'product' | 'service' | 'policy' | 'general'
  status: 'pending' | 'processing' | 'completed' | 'error'
  progress: number
}

type Step = 'personal' | 'company' | 'business-unit' | 'knowledge'

export default function OnboardingWizard({ onComplete, existingProfile }: OnboardingWizardProps) {
  // Current step
  const [currentStep, setCurrentStep] = useState<Step>('personal')
  const [isProcessing, setIsProcessing] = useState(false)
  const [aiMessage, setAiMessage] = useState('')

  // Personal Profile State
  const [personalProfile, setPersonalProfile] = useState<PersonalProfile>({
    firstName: existingProfile?.personal?.firstName || '',
    lastName: existingProfile?.personal?.lastName || '',
    email: existingProfile?.personal?.email || '',
    phone: existingProfile?.personal?.phone || '',
    bio: existingProfile?.personal?.bio || '',
    profilePhoto: existingProfile?.personal?.profilePhoto || null,
    socialLinks: {
      linkedin: existingProfile?.personal?.socialLinks?.linkedin || '',
      facebook: existingProfile?.personal?.socialLinks?.facebook || '',
      instagram: existingProfile?.personal?.socialLinks?.instagram || '',
      twitter: existingProfile?.personal?.socialLinks?.twitter || '',
    }
  })

  // Company Profile State
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>({
    companyName: existingProfile?.company?.companyName || '',
    companyUrl: existingProfile?.company?.companyUrl || '',
    industry: existingProfile?.company?.industry || '',
    address: existingProfile?.company?.address || '',
    city: existingProfile?.company?.city || '',
    country: existingProfile?.company?.country || '',
    registrationNo: existingProfile?.company?.registrationNo || '',
    billingEmail: existingProfile?.company?.billingEmail || '',
  })

  // Business Unit State
  const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([])
  const [currentBusinessUnit, setCurrentBusinessUnit] = useState<BusinessUnit>({
    name: '',
    type: 'both',
    description: '',
    documents: [],
    enableBooking: false,
    enableProducts: true,
    enableFaq: true,
  })

  // File upload for AI extraction
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])

  // Knowledge files for Step 4
  const [knowledgeFiles, setKnowledgeFiles] = useState<KnowledgeFile[]>([])
  const [processingKnowledge, setProcessingKnowledge] = useState(false)

  // Steps configuration
  const steps = [
    { id: 'personal', label: 'Personal Profile', icon: User },
    { id: 'company', label: 'Company Profile', icon: Building2 },
    { id: 'business-unit', label: 'Business Units', icon: Store },
    { id: 'knowledge', label: 'Knowledge Base', icon: BookOpen },
  ]

  // Handle document upload for AI extraction
  const handleDocumentUpload = async (files: FileList | null, type: 'personal' | 'company') => {
    if (!files || files.length === 0) return

    setIsProcessing(true)
    setAiMessage('Analyzing documents with AI...')

    try {
      const formData = new FormData()
      Array.from(files).forEach(file => {
        formData.append('files', file)
      })
      formData.append('extractType', type)

      const response = await fetch('/api/ai/extract-profile', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (result.success && result.extracted) {
        if (type === 'personal') {
          setPersonalProfile(prev => ({
            ...prev,
            ...result.extracted,
            socialLinks: {
              ...prev.socialLinks,
              ...result.extracted.socialLinks
            }
          }))
          setAiMessage('Found and filled your profile information!')
        } else {
          setCompanyProfile(prev => ({
            ...prev,
            ...result.extracted
          }))
          setAiMessage('Found and filled company information!')
        }
      } else {
        setAiMessage('Could not extract information. Please fill manually.')
      }
    } catch (error) {
      console.error('Document extraction error:', error)
      setAiMessage('Error processing document. Please fill manually.')
    } finally {
      setTimeout(() => {
        setIsProcessing(false)
        setAiMessage('')
      }, 2000)
    }
  }

  // Handle profile photo upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // For now, create a local URL. In production, upload to storage
    const url = URL.createObjectURL(file)
    setPersonalProfile(prev => ({ ...prev, profilePhoto: url }))
  }

  // Save and continue to next step
  const handleNext = async () => {
    if (currentStep === 'personal') {
      // Validate personal profile
      if (!personalProfile.firstName || !personalProfile.email) {
        alert('Please fill in at least your name and email')
        return
      }
      setCurrentStep('company')
    } else if (currentStep === 'company') {
      // Validate company profile
      if (!companyProfile.companyName) {
        alert('Please fill in your company name')
        return
      }
      setCurrentStep('business-unit')
    } else if (currentStep === 'business-unit') {
      // Save business unit and go to knowledge
      if (currentBusinessUnit.name) {
        await saveBusinessUnit()
      }
      setCurrentStep('knowledge')
    } else if (currentStep === 'knowledge') {
      // Process any remaining knowledge files and complete
      await processKnowledgeFiles()
      await saveAllData()
      onComplete()
    }
  }

  // Go back to previous step
  const handleBack = () => {
    if (currentStep === 'company') {
      setCurrentStep('personal')
    } else if (currentStep === 'business-unit') {
      setCurrentStep('company')
    } else if (currentStep === 'knowledge') {
      setCurrentStep('business-unit')
    }
  }

  // Handle knowledge file upload
  const handleKnowledgeUpload = (files: FileList | null, type: 'product' | 'service' | 'policy' | 'general') => {
    if (!files) return

    const newFiles: KnowledgeFile[] = Array.from(files).map(file => ({
      file,
      name: file.name,
      type,
      status: 'pending' as const,
      progress: 0
    }))

    setKnowledgeFiles(prev => [...prev, ...newFiles])
  }

  // Remove a knowledge file
  const removeKnowledgeFile = (index: number) => {
    setKnowledgeFiles(prev => prev.filter((_, i) => i !== index))
  }

  // Process knowledge files with AI
  const processKnowledgeFiles = async () => {
    if (knowledgeFiles.length === 0) return

    setProcessingKnowledge(true)
    setAiMessage('Processing knowledge files...')

    // Get first created business unit for association
    const businessUnitId = businessUnits[0]?.id

    for (let i = 0; i < knowledgeFiles.length; i++) {
      const kf = knowledgeFiles[i]
      if (kf.status === 'completed') continue

      // Update status to processing
      setKnowledgeFiles(prev => prev.map((f, idx) =>
        idx === i ? { ...f, status: 'processing' as const, progress: 0 } : f
      ))

      try {
        const formData = new FormData()
        formData.append('file', kf.file)
        formData.append('type', kf.type)
        formData.append('businessUnitId', businessUnitId || '')

        // Simulate progress updates
        const progressInterval = setInterval(() => {
          setKnowledgeFiles(prev => prev.map((f, idx) =>
            idx === i && f.status === 'processing'
              ? { ...f, progress: Math.min(f.progress + 10, 90) }
              : f
          ))
        }, 300)

        const response = await fetch('/api/knowledge-base/upload', {
          method: 'POST',
          body: formData
        })

        clearInterval(progressInterval)

        if (response.ok) {
          setKnowledgeFiles(prev => prev.map((f, idx) =>
            idx === i ? { ...f, status: 'completed' as const, progress: 100 } : f
          ))
        } else {
          setKnowledgeFiles(prev => prev.map((f, idx) =>
            idx === i ? { ...f, status: 'error' as const } : f
          ))
        }
      } catch (error) {
        console.error('Error processing file:', kf.name, error)
        setKnowledgeFiles(prev => prev.map((f, idx) =>
          idx === i ? { ...f, status: 'error' as const } : f
        ))
      }
    }

    setProcessingKnowledge(false)
    setAiMessage('')
  }

  // Save business unit
  const saveBusinessUnit = async () => {
    if (!currentBusinessUnit.name) return

    setIsProcessing(true)
    setAiMessage('Creating business unit...')

    try {
      const response = await fetch('/api/business-units', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: currentBusinessUnit.name,
          type: currentBusinessUnit.type,
          description: currentBusinessUnit.description,
          settings: {
            enableBooking: currentBusinessUnit.enableBooking,
            enableProducts: currentBusinessUnit.enableProducts,
            enableFaq: currentBusinessUnit.enableFaq,
          }
        })
      })

      const result = await response.json()
      if (result.success) {
        setBusinessUnits(prev => [...prev, { ...currentBusinessUnit, id: result.id }])
        setAiMessage('Business unit created!')
      }
    } catch (error) {
      console.error('Save business unit error:', error)
    } finally {
      setIsProcessing(false)
      setAiMessage('')
    }
  }

  // Save all onboarding data
  const saveAllData = async () => {
    setIsProcessing(true)
    setAiMessage('Saving your profile...')

    try {
      await fetch('/api/profile/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personal: personalProfile,
          company: companyProfile,
          businessUnits
        })
      })
    } catch (error) {
      console.error('Save onboarding error:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  // Add another business unit
  const addAnotherBusinessUnit = async () => {
    if (currentBusinessUnit.name) {
      await saveBusinessUnit()
    }
    setCurrentBusinessUnit({
      name: '',
      type: 'both',
      description: '',
      documents: [],
      enableBooking: false,
      enableProducts: true,
      enableFaq: true,
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome to AI Business Center
          </h1>
          <p className="text-slate-400">
            Let's set up your account in a few simple steps
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          {steps.map((step, index) => {
            const Icon = step.icon
            const isActive = step.id === currentStep
            const isCompleted = steps.findIndex(s => s.id === currentStep) > index

            return (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : isCompleted
                      ? 'bg-green-600 text-white'
                      : 'bg-slate-700 text-slate-400'
                }`}>
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                  <span className="hidden sm:inline font-medium">{step.label}</span>
                </div>
                {index < steps.length - 1 && (
                  <ChevronRight className="w-5 h-5 text-slate-600 mx-2" />
                )}
              </div>
            )
          })}
        </div>

        {/* AI Processing Indicator */}
        {isProcessing && (
          <div className="mb-6 p-4 bg-purple-900/30 border border-purple-500 rounded-lg flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
            <span className="text-purple-300">{aiMessage}</span>
          </div>
        )}

        {/* Step Content */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          {/* Personal Profile Step */}
          {currentStep === 'personal' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-blue-600/20 rounded-lg">
                  <User className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Personal Profile</h2>
                  <p className="text-sm text-slate-400">Tell us about yourself</p>
                </div>
              </div>

              {/* AI Document Upload */}
              <div className="p-4 bg-slate-700/50 rounded-lg border border-dashed border-slate-600">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-purple-600/20 rounded-lg">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-white mb-1">Quick Fill with AI</h3>
                    <p className="text-sm text-slate-400 mb-3">
                      Upload your GAINS PDF, business card, or LinkedIn export and we'll fill your profile automatically
                    </p>
                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg cursor-pointer transition-colors">
                      <Upload className="w-4 h-4" />
                      Upload Documents
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        multiple
                        className="hidden"
                        onChange={(e) => handleDocumentUpload(e.target.files, 'personal')}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Profile Photo */}
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden">
                    {personalProfile.profilePhoto ? (
                      <img src={personalProfile.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-10 h-10 text-slate-500" />
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 p-2 bg-blue-600 rounded-full cursor-pointer hover:bg-blue-700">
                    <Camera className="w-4 h-4 text-white" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoUpload}
                    />
                  </label>
                </div>
                <div>
                  <h3 className="font-medium text-white">Profile Photo</h3>
                  <p className="text-sm text-slate-400">Upload a photo for your profile</p>
                </div>
              </div>

              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-300 mb-2">First Name *</label>
                  <input
                    type="text"
                    value={personalProfile.firstName}
                    onChange={(e) => setPersonalProfile(prev => ({ ...prev, firstName: e.target.value }))}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-2">Last Name</label>
                  <input
                    type="text"
                    value={personalProfile.lastName}
                    onChange={(e) => setPersonalProfile(prev => ({ ...prev, lastName: e.target.value }))}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Doe"
                  />
                </div>
              </div>

              {/* Contact Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-300 mb-2">
                    <Mail className="w-4 h-4 inline mr-1" /> Email *
                  </label>
                  <input
                    type="email"
                    value={personalProfile.email}
                    onChange={(e) => setPersonalProfile(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-2">
                    <Phone className="w-4 h-4 inline mr-1" /> Phone
                  </label>
                  <input
                    type="tel"
                    value={personalProfile.phone}
                    onChange={(e) => setPersonalProfile(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+65 9123 4567"
                  />
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm text-slate-300 mb-2">Bio / About Me</label>
                <textarea
                  value={personalProfile.bio}
                  onChange={(e) => setPersonalProfile(prev => ({ ...prev, bio: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Tell us about yourself..."
                />
              </div>

              {/* Social Links */}
              <div>
                <label className="block text-sm text-slate-300 mb-3">Social Media Links</label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Linkedin className="w-5 h-5 text-blue-400" />
                    <input
                      type="url"
                      value={personalProfile.socialLinks.linkedin}
                      onChange={(e) => setPersonalProfile(prev => ({
                        ...prev,
                        socialLinks: { ...prev.socialLinks, linkedin: e.target.value }
                      }))}
                      className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="LinkedIn URL"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Facebook className="w-5 h-5 text-blue-500" />
                    <input
                      type="url"
                      value={personalProfile.socialLinks.facebook}
                      onChange={(e) => setPersonalProfile(prev => ({
                        ...prev,
                        socialLinks: { ...prev.socialLinks, facebook: e.target.value }
                      }))}
                      className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="Facebook URL"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Instagram className="w-5 h-5 text-pink-400" />
                    <input
                      type="url"
                      value={personalProfile.socialLinks.instagram}
                      onChange={(e) => setPersonalProfile(prev => ({
                        ...prev,
                        socialLinks: { ...prev.socialLinks, instagram: e.target.value }
                      }))}
                      className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="Instagram URL"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Twitter className="w-5 h-5 text-sky-400" />
                    <input
                      type="url"
                      value={personalProfile.socialLinks.twitter}
                      onChange={(e) => setPersonalProfile(prev => ({
                        ...prev,
                        socialLinks: { ...prev.socialLinks, twitter: e.target.value }
                      }))}
                      className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="Twitter/X URL"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Company Profile Step */}
          {currentStep === 'company' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-green-600/20 rounded-lg">
                  <Building2 className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Company Profile</h2>
                  <p className="text-sm text-slate-400">Tell us about your company</p>
                </div>
              </div>

              {/* AI Document Upload */}
              <div className="p-4 bg-slate-700/50 rounded-lg border border-dashed border-slate-600">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-purple-600/20 rounded-lg">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-white mb-1">Quick Fill with AI</h3>
                    <p className="text-sm text-slate-400 mb-3">
                      Upload company brochure or registration documents
                    </p>
                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg cursor-pointer transition-colors">
                      <Upload className="w-4 h-4" />
                      Upload Documents
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                        multiple
                        className="hidden"
                        onChange={(e) => handleDocumentUpload(e.target.files, 'company')}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Company Name & URL */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-300 mb-2">
                    <Building2 className="w-4 h-4 inline mr-1" /> Company Name *
                  </label>
                  <input
                    type="text"
                    value={companyProfile.companyName}
                    onChange={(e) => setCompanyProfile(prev => ({ ...prev, companyName: e.target.value }))}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Acme Corporation"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-2">
                    <Globe className="w-4 h-4 inline mr-1" /> Company Website
                  </label>
                  <input
                    type="url"
                    value={companyProfile.companyUrl}
                    onChange={(e) => setCompanyProfile(prev => ({ ...prev, companyUrl: e.target.value }))}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com"
                  />
                </div>
              </div>

              {/* Industry */}
              <div>
                <label className="block text-sm text-slate-300 mb-2">Industry</label>
                <select
                  value={companyProfile.industry}
                  onChange={(e) => setCompanyProfile(prev => ({ ...prev, industry: e.target.value }))}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select industry</option>
                  <option value="skincare">Skincare & Beauty</option>
                  <option value="health">Health & Wellness</option>
                  <option value="fitness">Fitness & Sports</option>
                  <option value="food">Food & Beverage</option>
                  <option value="retail">Retail</option>
                  <option value="technology">Technology</option>
                  <option value="consulting">Consulting</option>
                  <option value="education">Education</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm text-slate-300 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" /> Address
                </label>
                <input
                  type="text"
                  value={companyProfile.address}
                  onChange={(e) => setCompanyProfile(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="123 Main Street, Suite 100"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-300 mb-2">City</label>
                  <input
                    type="text"
                    value={companyProfile.city}
                    onChange={(e) => setCompanyProfile(prev => ({ ...prev, city: e.target.value }))}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Singapore"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-2">Country</label>
                  <input
                    type="text"
                    value={companyProfile.country}
                    onChange={(e) => setCompanyProfile(prev => ({ ...prev, country: e.target.value }))}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Singapore"
                  />
                </div>
              </div>

              {/* Registration & Billing */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-300 mb-2">
                    <Hash className="w-4 h-4 inline mr-1" /> Business Registration No. (optional)
                  </label>
                  <input
                    type="text"
                    value={companyProfile.registrationNo}
                    onChange={(e) => setCompanyProfile(prev => ({ ...prev, registrationNo: e.target.value }))}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="UEN / Registration No."
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-2">
                    <CreditCard className="w-4 h-4 inline mr-1" /> Billing Email
                  </label>
                  <input
                    type="email"
                    value={companyProfile.billingEmail}
                    onChange={(e) => setCompanyProfile(prev => ({ ...prev, billingEmail: e.target.value }))}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="billing@example.com"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Business Unit Step */}
          {currentStep === 'business-unit' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-orange-600/20 rounded-lg">
                  <Store className="w-6 h-6 text-orange-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Business Unit Setup</h2>
                  <p className="text-sm text-slate-400">Set up your first business unit</p>
                </div>
              </div>

              {/* Existing Business Units */}
              {businessUnits.length > 0 && (
                <div className="space-y-2 mb-6">
                  <label className="block text-sm text-slate-400">Created Business Units:</label>
                  {businessUnits.map((unit, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-green-900/20 border border-green-700 rounded-lg">
                      <Check className="w-5 h-5 text-green-400" />
                      <span className="text-white">{unit.name}</span>
                      <span className="text-xs text-slate-400">({unit.type})</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Business Unit Form */}
              <div>
                <label className="block text-sm text-slate-300 mb-2">Business Unit Name *</label>
                <input
                  type="text"
                  value={currentBusinessUnit.name}
                  onChange={(e) => setCurrentBusinessUnit(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., SkinCoach, BreastGuardian"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-2">Business Type</label>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { value: 'service', label: 'Service-based', desc: 'Clinic, salon, consulting' },
                    { value: 'product', label: 'Product-based', desc: 'Retail, e-commerce' },
                    { value: 'both', label: 'Both', desc: 'Services + Products' },
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() => setCurrentBusinessUnit(prev => ({ ...prev, type: option.value as any }))}
                      className={`p-4 rounded-lg border text-left transition-all ${
                        currentBusinessUnit.type === option.value
                          ? 'bg-blue-600/20 border-blue-500 text-white'
                          : 'bg-slate-700/50 border-slate-600 text-slate-300 hover:border-slate-500'
                      }`}
                    >
                      <div className="font-medium">{option.label}</div>
                      <div className="text-xs text-slate-400 mt-1">{option.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-2">Description</label>
                <textarea
                  value={currentBusinessUnit.description}
                  onChange={(e) => setCurrentBusinessUnit(prev => ({ ...prev, description: e.target.value }))}
                  rows={2}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Brief description of this business unit..."
                />
              </div>

              {/* Module toggles */}
              <div>
                <label className="block text-sm text-slate-300 mb-3">Enable Features</label>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-700">
                    <input
                      type="checkbox"
                      checked={currentBusinessUnit.enableBooking}
                      onChange={(e) => setCurrentBusinessUnit(prev => ({ ...prev, enableBooking: e.target.checked }))}
                      className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <div className="font-medium text-white">Booking System</div>
                      <div className="text-xs text-slate-400">Allow customers to book appointments</div>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-700">
                    <input
                      type="checkbox"
                      checked={currentBusinessUnit.enableProducts}
                      onChange={(e) => setCurrentBusinessUnit(prev => ({ ...prev, enableProducts: e.target.checked }))}
                      className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <div className="font-medium text-white">Product Catalog</div>
                      <div className="text-xs text-slate-400">Manage and display products</div>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-700">
                    <input
                      type="checkbox"
                      checked={currentBusinessUnit.enableFaq}
                      onChange={(e) => setCurrentBusinessUnit(prev => ({ ...prev, enableFaq: e.target.checked }))}
                      className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <div className="font-medium text-white">FAQ & AI Chat</div>
                      <div className="text-xs text-slate-400">Auto-generate FAQs and enable AI chat</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Add Another */}
              {currentBusinessUnit.name && (
                <button
                  onClick={addAnotherBusinessUnit}
                  className="w-full py-3 border border-dashed border-slate-600 rounded-lg text-slate-400 hover:text-white hover:border-slate-500 transition-colors"
                >
                  + Save & Add Another Business Unit
                </button>
              )}
            </div>
          )}

          {/* Knowledge Upload Step */}
          {currentStep === 'knowledge' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-purple-600/20 rounded-lg">
                  <BookOpen className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Knowledge Base</h2>
                  <p className="text-sm text-slate-400">Upload documents to train your AI assistant</p>
                </div>
              </div>

              {/* AI Info Box */}
              <div className="p-4 bg-purple-900/20 border border-purple-700 rounded-lg">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-purple-400 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-white mb-1">AI-Powered Knowledge Extraction</h3>
                    <p className="text-sm text-purple-300">
                      Upload PDFs, documents, or images. Our AI will automatically extract product info,
                      service details, policies, and FAQs to power your intelligent assistant.
                    </p>
                  </div>
                </div>
              </div>

              {/* Upload Sections */}
              <div className="grid grid-cols-2 gap-4">
                {/* Product Documents */}
                <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="w-5 h-5 text-blue-400" />
                    <span className="font-medium text-white">Product Info</span>
                  </div>
                  <p className="text-xs text-slate-400 mb-3">
                    Catalogs, price lists, product specs
                  </p>
                  <label className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg cursor-pointer transition-colors text-sm">
                    <Upload className="w-4 h-4" />
                    Upload Files
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.xlsx,.png,.jpg,.jpeg"
                      multiple
                      className="hidden"
                      onChange={(e) => handleKnowledgeUpload(e.target.files, 'product')}
                    />
                  </label>
                </div>

                {/* Service Documents */}
                <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="w-5 h-5 text-green-400" />
                    <span className="font-medium text-white">Service Info</span>
                  </div>
                  <p className="text-xs text-slate-400 mb-3">
                    Service menus, treatment guides
                  </p>
                  <label className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg cursor-pointer transition-colors text-sm">
                    <Upload className="w-4 h-4" />
                    Upload Files
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.xlsx,.png,.jpg,.jpeg"
                      multiple
                      className="hidden"
                      onChange={(e) => handleKnowledgeUpload(e.target.files, 'service')}
                    />
                  </label>
                </div>

                {/* Policy Documents */}
                <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="w-5 h-5 text-orange-400" />
                    <span className="font-medium text-white">Policies</span>
                  </div>
                  <p className="text-xs text-slate-400 mb-3">
                    Terms, refund policy, guidelines
                  </p>
                  <label className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg cursor-pointer transition-colors text-sm">
                    <Upload className="w-4 h-4" />
                    Upload Files
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.xlsx,.png,.jpg,.jpeg"
                      multiple
                      className="hidden"
                      onChange={(e) => handleKnowledgeUpload(e.target.files, 'policy')}
                    />
                  </label>
                </div>

                {/* General Knowledge */}
                <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="w-5 h-5 text-purple-400" />
                    <span className="font-medium text-white">General Knowledge</span>
                  </div>
                  <p className="text-xs text-slate-400 mb-3">
                    FAQs, training materials, guides
                  </p>
                  <label className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg cursor-pointer transition-colors text-sm">
                    <Upload className="w-4 h-4" />
                    Upload Files
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.xlsx,.png,.jpg,.jpeg"
                      multiple
                      className="hidden"
                      onChange={(e) => handleKnowledgeUpload(e.target.files, 'general')}
                    />
                  </label>
                </div>
              </div>

              {/* Uploaded Files List */}
              {knowledgeFiles.length > 0 && (
                <div className="space-y-2">
                  <label className="block text-sm text-slate-300">Uploaded Files ({knowledgeFiles.length})</label>
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {knowledgeFiles.map((kf, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg">
                        {/* Status Icon */}
                        {kf.status === 'completed' ? (
                          <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                        ) : kf.status === 'error' ? (
                          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                        ) : kf.status === 'processing' ? (
                          <Loader2 className="w-5 h-5 text-blue-400 animate-spin flex-shrink-0" />
                        ) : (
                          <FileText className="w-5 h-5 text-slate-400 flex-shrink-0" />
                        )}

                        {/* File Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-white truncate">{kf.name}</span>
                            <span className={`px-2 py-0.5 rounded text-xs ${
                              kf.type === 'product' ? 'bg-blue-600/30 text-blue-300' :
                              kf.type === 'service' ? 'bg-green-600/30 text-green-300' :
                              kf.type === 'policy' ? 'bg-orange-600/30 text-orange-300' :
                              'bg-purple-600/30 text-purple-300'
                            }`}>
                              {kf.type}
                            </span>
                          </div>
                          {/* Progress Bar */}
                          {kf.status === 'processing' && (
                            <div className="mt-1 h-1 bg-slate-600 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-500 transition-all duration-300"
                                style={{ width: `${kf.progress}%` }}
                              />
                            </div>
                          )}
                        </div>

                        {/* Remove Button */}
                        {kf.status !== 'processing' && (
                          <button
                            onClick={() => removeKnowledgeFile(index)}
                            className="p-1 hover:bg-slate-600 rounded"
                          >
                            <X className="w-4 h-4 text-slate-400 hover:text-white" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Process Now Button */}
              {knowledgeFiles.some(f => f.status === 'pending') && (
                <button
                  onClick={processKnowledgeFiles}
                  disabled={processingKnowledge}
                  className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processingKnowledge ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing Files...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Process Files with AI
                    </>
                  )}
                </button>
              )}

              {/* Skip Note */}
              <p className="text-xs text-slate-500 text-center">
                You can always add more knowledge later from the Knowledge Base section
              </p>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-700">
            <button
              onClick={handleBack}
              disabled={currentStep === 'personal'}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                currentStep === 'personal'
                  ? 'text-slate-600 cursor-not-allowed'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
              Back
            </button>

            <button
              onClick={handleNext}
              disabled={isProcessing}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : currentStep === 'business-unit' ? (
                <>
                  Complete Setup
                  <Check className="w-5 h-5" />
                </>
              ) : (
                <>
                  Continue
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Skip link */}
        <div className="text-center mt-4">
          <button
            onClick={onComplete}
            className="text-sm text-slate-500 hover:text-slate-400"
          >
            Skip for now - I'll set up later
          </button>
        </div>
      </div>
    </div>
  )
}
