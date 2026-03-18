'use client'

import React, { useState, useEffect } from 'react'
import { LandingPageBlock } from '@/types/landing-page-blocks'
import { getFontClass } from '@/lib/fonts'
import { createClient } from '@/lib/supabase-browser'
import { Check, Download, ExternalLink, FileText, UserPlus } from 'lucide-react'
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
    const checkLoginEvent = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      // We only show "Success" if they just returned from a login redirect
      if (session?.user && (window.location.hash.includes('access_token') || window.location.search.includes('code='))) {
        setUser(session.user)
        setSuccess(true)
      } else {
        // Always force a fresh start on page load/refresh for kiosk mode
        if (session?.user) {
          await supabase.auth.signOut()
        }
        setUser(null)
        setSuccess(false)
      }
      setLoading(false)
    }
    checkLoginEvent()
  }, [])

  const handleInitialClick = async () => {
    setSubmitting(true)
    try {
      const currentPath = window.location.pathname + window.location.search
      const redirectTo = `${window.location.origin}${currentPath}`

      // Force account selection for the outlet tablet
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { 
          redirectTo,
          queryParams: {
            prompt: 'select_account'
          }
        }
      })
      if (error) throw error
    } catch (err) {
      console.error('Login error:', err)
      setSubmitting(false)
    }
  }

  const handleActualDownload = async () => {
    // 1. Trigger the download
    if (data.pdf_url) {
      window.open(data.pdf_url, '_blank')
    }
    
    // 2. Clear state and logout immediately for the next customer
    setTimeout(async () => {
      await supabase.auth.signOut()
      window.location.href = window.location.pathname + window.location.search
    }, 1000)
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
                domain: window.location.hostname,
                is_kiosk: true
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
    const isMediaVideo = data.media_type === 'video'
    const imageWidth = data.image_width || '400px'

    return (
      <div className="flex-shrink-0 flex justify-center w-full md:w-auto">
        {isMediaVideo ? (
          <video src={data.media_url} autoPlay muted loop playsInline preload="auto" className="h-auto rounded shadow-lg" style={{ width: imageWidth, maxWidth: '100%' }} />
        ) : (
          <img src={data.media_url} alt={stripHtml(data.headline)} className="h-auto rounded shadow-lg" style={{ width: imageWidth, maxWidth: '100%' }} />
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
    <section id={block.id} className="py-20 px-4 overflow-hidden" style={{ backgroundColor: data.background_color || '#f9fafb' }}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-16" style={{ textAlign: data.headline_text_align || 'center' }}>
          <h2 className={`font-bold mb-6 leading-tight ${getFontClass(data.headline_font_family)}`} style={{ color: data.headline_color || '#111827', fontSize: data.headline_font_size || 'clamp(2rem, 5vw, 3.5rem)', fontWeight: data.headline_bold ? 'bold' : 'normal', fontStyle: data.headline_italic ? 'italic' : 'normal' }}>
            {stripHtml(data.headline)}
          </h2>
          {data.subheadline && (
            <p className="opacity-80" style={{ color: data.subheadline_color || '#4b5563', fontSize: data.subheadline_font_size || '1.25rem' }}>
              {stripHtml(data.subheadline)}
            </p>
          )}
        </div>

        {(isTextAbove || isTextBelow || !hasMedia) ? (
          <div className="flex flex-col gap-12 items-center text-center">
            {isTextAbove && renderInnerContent(false)}
            {hasMedia && renderMedia()}
            {isTextBelow && renderInnerContent(false)}
          </div>
        ) : (
          <div className={`flex flex-col ${isTextLeft ? 'md:flex-row' : 'md:flex-row-reverse'} gap-12 lg:gap-20 items-center justify-center`}>
            <div className="flex-1 w-full text-left">{renderInnerContent(true)}</div>
            {renderMedia()}
          </div>
        )}
      </div>
      <style jsx global>{` .prose p { margin-bottom: 0; } `}</style>
    </section>
  )

  function renderInnerContent(isSide: boolean) {
    return (
      <div className="w-full">
        <div className="space-y-8">
          {!success ? (
            <div className="space-y-8">
              {data.content && (
                <div className={`prose prose-sm md:prose-base text-gray-600 max-w-none ${!isSide ? 'text-center mx-auto' : 'text-left'}`} dangerouslySetInnerHTML={{ __html: cleanHtml(data.content) }} />
              )}
              <div className={`pt-8 border-t border-gray-100 ${!isSide ? 'text-center' : 'text-left'}`} style={{ textAlign: data.button_align || (isSide ? 'left' : 'center') }}>
                <button onClick={handleInitialClick} disabled={submitting} className={`inline-flex items-center justify-center gap-3 px-10 py-5 text-white font-bold rounded-2xl transition-all hover:scale-[1.02] shadow-xl shadow-violet-200`} style={{ backgroundColor: data.button_color || '#7c3aed' }}>
                  {submitting ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      {data.cta_text || (isTW ? '立即下載 PDF 指南' : 'Download PDF Guide')}
                    </>
                  )}
                </button>
                <p className="mt-4 text-[10px] text-gray-400 uppercase tracking-widest font-bold">
                  {isTW ? '* 登入後即可下載' : '* SIGN IN TO DOWNLOAD'}
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
                {data.success_message || (isTW ? '您的指南已準備就緒。' : 'Your guide is ready for download.')}
              </p>
              <div className={`p-8 bg-white rounded-3xl border border-gray-100 shadow-xl shadow-violet-100/50 ${!isSide ? 'text-center' : 'text-left'}`} style={{ textAlign: data.button_align || (isSide ? 'left' : 'center') }}>
                <div className={`flex items-center ${!isSide ? 'justify-center' : 'justify-start'} gap-4 mb-6`}>
                  <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center text-violet-600">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Document Ready</p>
                    <p className="text-sm font-bold text-gray-900 truncate max-w-[200px]">{data.pdf_url?.split('/').pop()}</p>
                  </div>
                </div>
                <button onClick={handleActualDownload} className="inline-flex items-center gap-2 px-10 py-4 bg-violet-600 text-white font-bold rounded-xl hover:bg-violet-700 transition-all shadow-md hover:shadow-violet-200 justify-center text-sm">
                  {isTW ? '開始下載' : 'START DOWNLOAD'} <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }
}
