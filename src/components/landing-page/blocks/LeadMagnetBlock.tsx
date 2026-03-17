'use client'

import React, { useState, useEffect } from 'react'
import { LandingPageBlock } from '@/types/landing-page-blocks'
import { getFontClass } from '@/lib/fonts'
import { createClient } from '@/lib/supabase-browser'
import { Check, Download, ExternalLink, FileText } from 'lucide-react'

interface LeadMagnetBlockProps {
  block: LandingPageBlock
  businessUnitId?: string
}

export default function LeadMagnetBlock({ block, businessUnitId }: LeadMagnetBlockProps) {
  const data = block.data
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const supabase = createClient()

  // Improved locale detection
  const isTW = typeof window !== 'undefined' && 
    (window.location.pathname.includes('/hk') || 
     window.location.search.includes('lang=tw') || 
     window.location.search.includes('country=HK'))

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUser(session.user)
        setSuccess(true)
      }
      setLoading(false)
    }
    checkUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user)
        setSuccess(true)
      } else {
        setUser(null)
        setSuccess(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogin = async () => {
    setSubmitting(true)
    try {
      const fullUrl = window.location.href
      document.cookie = `sb-next-url=${encodeURIComponent(fullUrl)}; path=/; max-age=300; SameSite=Lax`
      const redirectTo = `${window.location.origin}/auth/callback`

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo }
      })
      if (error) throw error
    } catch (err) {
      console.error('Login error:', err)
      setSubmitting(false)
    }
  }

  useEffect(() => {
    if (user && success) {
      const saveLead = async () => {
        try {
          await supabase
            .from('customer_leads')
            .insert({
              business_unit_id: businessUnitId,
              email: user.email,
              full_name: user.user_metadata?.full_name || user.email.split('@')[0],
              source_page_slug: window.location.pathname.split('/').pop() || 'home',
              metadata: {
                provider: user.app_metadata?.provider,
                domain: window.location.hostname
              }
            })
        } catch (err) {
          console.error('Lead capture error:', err)
        }
      }
      saveLead()
    }
  }, [user, success, businessUnitId])

  const renderMedia = () => {
    if (!data.media_url) return null

    if (data.media_type === 'video') {
      let embedUrl = data.media_url
      if (data.media_url.includes('youtube.com/watch?v=')) {
        embedUrl = data.media_url.replace('watch?v=', 'embed/')
      } else if (data.media_url.includes('youtu.be/')) {
        embedUrl = data.media_url.replace('youtu.be/', 'youtube.com/embed/')
      }

      return (
        <div className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl border border-white/20">
          <iframe
            src={embedUrl}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )
    }

    return (
      <div className="relative aspect-square md:aspect-auto md:h-full min-h-[300px] rounded-3xl overflow-hidden shadow-2xl border border-white/20 group">
        <img
          src={data.media_url}
          alt={data.headline}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>
    )
  }

  const textPosition = data.text_position || 'left'
  const hasMedia = !!data.media_url

  const getFlexClass = () => {
    if (!hasMedia) return 'items-center text-center'
    if (textPosition === 'above') return 'flex-col items-center text-center'
    if (textPosition === 'below') return 'flex-col-reverse items-center text-center'
    if (textPosition === 'left') return 'md:flex-row items-center text-left'
    if (textPosition === 'right') return 'md:flex-row-reverse items-center text-left'
    return 'md:flex-row items-center text-left'
  }

  if (loading) return null

  return (
    <section 
      id={block.id}
      className="py-20 px-4 overflow-hidden" 
      style={{ backgroundColor: data.background_color || '#f9fafb' }}
    >
      <div className="max-w-6xl mx-auto">
        <div className={`flex flex-col ${getFlexClass()} gap-12 lg:gap-20`}>
          
          {/* Content Side */}
          <div className={`flex-1 w-full ${!hasMedia || textPosition === 'above' || textPosition === 'below' ? 'max-w-3xl' : ''}`}>
            <div className="mb-8">
              <h2 
                className={`text-3xl md:text-5xl font-bold mb-6 leading-tight ${getFontClass(data.headline_font_family)}`}
                style={{ color: data.headline_color || '#111827' }}
              >
                {data.headline}
              </h2>
              <p 
                className="text-lg md:text-xl opacity-80"
                style={{ color: data.subheadline_color || '#4b5563' }}
              >
                {data.subheadline}
              </p>
            </div>

            <div className="space-y-8">
              {!success ? (
                <div className="space-y-8">
                  {data.content && (
                    <div 
                      className={`prose prose-sm md:prose-base text-gray-600 max-w-none ${(!hasMedia || textPosition === 'above' || textPosition === 'below') ? 'text-center' : 'text-left'}`}
                      dangerouslySetInnerHTML={{ __html: data.content }}
                    />
                  )}
                  
                  <div className={`pt-8 border-t border-gray-100 ${(!hasMedia || textPosition === 'above' || textPosition === 'below') ? 'text-center' : 'text-left'}`}>
                    <button
                      onClick={handleLogin}
                      disabled={submitting}
                      className={`w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-5 text-white font-bold rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-violet-200`}
                      style={{ backgroundColor: data.button_color || '#7c3aed' }}
                    >
                      {submitting ? (
                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <img src="/images/google-icon.svg" alt="" className="w-5 h-5 bg-white rounded-full p-0.5" />
                          {data.cta_text || (isTW ? '立即解鎖並下載 PDF' : 'Unlock and Download PDF')}
                        </>
                      )}
                    </button>
                    <p className="mt-4 text-[10px] text-gray-400 uppercase tracking-widest font-bold">
                      {isTW ? '* 登入後 PDF 將發送到您的電子郵件' : '* PDF WILL BE SENT TO YOUR EMAIL AFTER SIGNING IN'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <div className={`flex flex-col ${(!hasMedia || textPosition === 'above' || textPosition === 'below') ? 'items-center' : 'items-start'} gap-4`}>
                    <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                      <Check className="w-10 h-10" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">{isTW ? '解鎖成功！' : 'Success! Guide Unlocked'}</h3>
                  </div>
                  
                  <p className="text-gray-600 max-w-lg mx-auto">
                    {data.success_message || (isTW ? '感謝您的支持！您現在可以下載專屬指南。' : 'Thank you! You can now download your professional guide below.')}
                  </p>

                  {data.pdf_url ? (
                    <div className={`p-8 bg-white rounded-3xl border border-gray-100 shadow-xl shadow-violet-100/50 ${(!hasMedia || textPosition === 'above' || textPosition === 'below') ? 'text-center' : 'text-left'}`}>
                      <div className={`flex items-center ${(!hasMedia || textPosition === 'above' || textPosition === 'below') ? 'justify-center' : 'justify-start'} gap-4 mb-6`}>
                        <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center text-violet-600">
                          <FileText className="w-6 h-6" />
                        </div>
                        <div className="text-left">
                          <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Document Ready</p>
                          <p className="text-sm font-bold text-gray-900 truncate max-w-[200px]">{data.pdf_url.split('/').pop()}</p>
                        </div>
                      </div>
                      <a
                        href={data.pdf_url}
                        target="_blank"
                        className="inline-flex items-center gap-3 px-10 py-4 bg-violet-600 text-white font-bold rounded-2xl hover:bg-violet-700 transition-all shadow-lg hover:shadow-violet-200 w-full justify-center"
                      >
                        {isTW ? '立即下載 PDF' : 'DOWNLOAD PDF NOW'} <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  ) : (
                    <div className="p-6 bg-amber-50 rounded-2xl border border-amber-200 text-amber-700 text-sm italic">
                      {isTW ? '文件準備中，請稍候。' : 'Note: PDF file is being prepared. Please check back in a moment.'}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Media Side */}
          {hasMedia && (
            <div className={`flex-1 w-full ${textPosition === 'above' || textPosition === 'below' ? 'max-w-4xl' : 'max-w-xl lg:max-w-2xl'}`}>
              {renderMedia()}
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        .prose ul { list-style-type: disc; padding-left: 1.5rem; text-align: left; max-width: fit-content; margin: 0 auto; }
        .prose p { margin-bottom: 1.5rem; }
      `}</style>
    </section>
  )
}
