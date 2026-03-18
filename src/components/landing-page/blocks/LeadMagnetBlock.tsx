'use client'

import React, { useState, useEffect } from 'react'
import { LandingPageBlock } from '@/types/landing-page-blocks'
import { getFontClass } from '@/lib/fonts'
import { createClient } from '@/lib/supabase-browser'
import { Check, Download, ExternalLink, FileText } from 'lucide-react'
import { stripHtml, cleanHtml } from '@/lib/utils'

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

  // Media Rendering - Patterned exactly after StepsBlock
  const renderMedia = () => {
    if (!data.media_url) return null
    const isMediaVideo = data.media_type === 'video'
    const imageWidth = data.image_width || '400px'

    return (
      <div className="flex-shrink-0 flex justify-center">
        {isMediaVideo ? (
          <video
            src={data.media_url}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            className="h-auto rounded shadow-lg"
            style={{ width: imageWidth, maxWidth: '100%' }}
          />
        ) : (
          <img
            src={data.media_url}
            alt={stripHtml(data.headline)}
            className="h-auto rounded shadow-lg"
            style={{ width: imageWidth, maxWidth: '100%' }}
          />
        )}
      </div>
    )
  }

  const textPosition = data.text_position || 'left'
  const hasMedia = !!data.media_url
  
  const isTextAbove = textPosition === 'above'
  const isTextBelow = textPosition === 'below'
  const isTextLeft = textPosition === 'left'
  const isTextRight = textPosition === 'right'

  if (loading) return null

  return (
    <section 
      id={block.id}
      className="py-20 px-4 overflow-hidden" 
      style={{ backgroundColor: data.background_color || '#f9fafb' }}
    >
      <div className="max-w-6xl mx-auto">
        {/* EXPLICIT LAYOUT LOGIC - Identical to StepsBlock */}
        {isTextAbove || isTextBelow || !hasMedia ? (
          // VERTICAL STACK
          <div className="flex flex-col gap-12 items-center text-center">
            {isTextAbove && renderTextContent()}
            {hasMedia && renderMedia()}
            {isTextBelow && renderTextContent()}
          </div>
        ) : (
          // HORIZONTAL SIDE-BY-SIDE
          <div className="flex flex-col md:flex-row gap-12 lg:gap-20 items-center justify-center">
            {isTextLeft && (
              <div className="flex-1 w-full text-left" style={{ minWidth: '40%' }}>
                {renderTextContent(true)}
              </div>
            )}
            
            {hasMedia && renderMedia()}

            {isTextRight && (
              <div className="flex-1 w-full text-left" style={{ minWidth: '40%' }}>
                {renderTextContent(true)}
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx global>{`
        .prose p { margin-bottom: 0; }
      `}</style>
    </section>
  )

  function renderTextContent(isSide: boolean = false) {
    return (
      <div className="w-full">
        <div className="mb-8">
          <h2 
            className={`font-bold mb-6 leading-tight ${getFontClass(data.headline_font_family)}`}
            style={{ 
              color: data.headline_color || '#111827',
              fontSize: data.headline_font_size || 'clamp(2rem, 5vw, 3.5rem)',
              fontWeight: data.headline_bold ? 'bold' : 'normal',
              fontStyle: data.headline_italic ? 'italic' : 'normal'
            }}
          >
            {stripHtml(data.headline)}
          </h2>
          {data.subheadline && (
            <p 
              className="opacity-80"
              style={{ 
                color: data.subheadline_color || '#4b5563',
                fontSize: data.subheadline_font_size || '1.25rem',
                textAlign: data.subheadline_text_align || (isSide ? 'left' : 'center')
              }}
            >
              {stripHtml(data.subheadline)}
            </p>
          )}
        </div>

        <div className="space-y-8">
          {!success ? (
            <div className="space-y-8">
              {data.content && (
                <div 
                  className={`prose prose-sm md:prose-base text-gray-600 max-w-none ${!isSide ? 'text-center mx-auto' : 'text-left'}`}
                  dangerouslySetInnerHTML={{ __html: cleanHtml(data.content) }}
                />
              )}
              
              <div className={`pt-8 border-t border-gray-100 ${!isSide ? 'text-center' : 'text-left'}`} style={{ textAlign: data.button_align || (isSide ? 'left' : 'center') }}>
                <button
                  onClick={handleLogin}
                  disabled={submitting}
                  className={`inline-flex items-center justify-center gap-3 px-10 py-5 text-white font-bold rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-violet-200`}
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
              <div className={`flex flex-col ${!isSide ? 'items-center' : 'items-start'} gap-3`}>
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <Check className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">{isTW ? '解鎖成功！' : 'Success! Guide Unlocked'}</h3>
              </div>
              
              <p className={`text-sm text-gray-600 max-w-lg ${!isSide ? 'mx-auto' : ''}`}>
                {data.success_message || (isTW ? '感謝您的支持！您現在可以下載專屬指南。' : 'Thank you! You can now download your professional guide below.')}
              </p>

              {data.pdf_url ? (
                <div className={`p-8 bg-white rounded-3xl border border-gray-100 shadow-xl shadow-violet-100/50 ${!isSide ? 'text-center' : 'text-left'}`} style={{ textAlign: data.button_align || (isSide ? 'left' : 'center') }}>
                  <div className={`flex items-center ${!isSide ? 'justify-center' : 'justify-start'} gap-4 mb-6`}>
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
                    className="inline-flex items-center gap-2 px-6 py-3 bg-violet-600 text-white font-bold rounded-xl hover:bg-violet-700 transition-all shadow-md hover:shadow-violet-200 w-full md:w-auto justify-center text-sm"
                  >
                    {isTW ? '立即下載 PDF' : 'DOWNLOAD PDF NOW'} <ExternalLink className="w-3.5 h-3.5" />
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
    )
  }
}
