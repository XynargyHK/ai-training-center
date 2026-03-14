'use client'

import React, { useState, useEffect } from 'react'
import { LandingPageBlock } from '@/types/landing-page-blocks'
import { getFontClass } from '@/lib/fonts'
import { createClient } from '@/lib/supabase-browser'
import { FileText, Check, Download, ExternalLink, Lock } from 'lucide-react'

export default function LeadMagnetBlock({ block, businessUnitId }: { block: LandingPageBlock, businessUnitId?: string }) {
  const data = block.data
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const supabase = createClient()

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
      // 1. Save the FULL ABSOLUTE URL in a cookie (e.g., http://localhost:3000/livechat?page=user)
      const fullUrl = window.location.href
      document.cookie = `sb-next-url=${encodeURIComponent(fullUrl)}; path=/; max-age=300; SameSite=Lax`
      
      // 2. Use a SIMPLE redirectTo that matches Supabase Dashboard
      const redirectTo = `${window.location.origin}/auth/callback`
      
      console.log('[LeadMagnet] Login Start. Full URL bookmarked:', fullUrl)

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectTo,
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

  if (loading) return null

  return (
    <section className="py-16 px-4" style={{ backgroundColor: data.background_color || '#f9fafb' }}>
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-3xl shadow-2xl shadow-violet-100 overflow-hidden border border-gray-100 p-8 md:p-12 text-center">
          <div className="mb-8">
            <div className="w-16 h-16 bg-violet-100 rounded-2xl flex items-center justify-center text-violet-600 mx-auto mb-6">
              <FileText className="w-8 h-8" />
            </div>
            <h2 className={`text-3xl md:text-4xl font-bold mb-4 ${getFontClass(data.headline_font_family)}`} style={{ color: data.headline_color || '#111827' }}>
              {data.headline}
            </h2>
            <p className="text-lg opacity-80 max-w-2xl mx-auto" style={{ color: data.subheadline_color || '#4b5563' }}>
              {data.subheadline}
            </p>
          </div>

          <div className="space-y-8">
            {!success ? (
              <div className="space-y-8">
                <div className="prose prose-sm md:prose-base text-gray-600 mx-auto text-left md:text-center" dangerouslySetInnerHTML={{ __html: data.content }} />
                <div className="pt-8 border-t border-gray-100">
                  <p className="text-sm font-medium text-gray-500 mb-6 italic flex items-center justify-center gap-2">
                    <Lock className="w-4 h-4" /> Verify identity with Google to unlock your guide
                  </p>
                  <button onClick={handleLogin} disabled={submitting} className="w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-5 text-white font-bold rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-violet-200" style={{ backgroundColor: data.button_color || '#7c3aed' }}>
                    {submitting ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (
                      <><img src="/images/google-icon.svg" alt="" className="w-5 h-5 bg-white rounded-full p-0.5" />{data.cta_text || 'Unlock PDF Guide'}</>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-8 animate-in fade-in zoom-in-95 duration-700">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600"><Check className="w-10 h-10" /></div>
                  <h3 className="text-2xl font-bold text-gray-900">Success! Guide Unlocked</h3>
                </div>
                <p className="text-gray-600 max-w-lg mx-auto">{data.success_message || 'Thank you! You can now download your professional guide below.'}</p>
                {data.pdf_url ? (
                  <div className="p-10 bg-violet-50 rounded-3xl border-2 border-dashed border-violet-200 text-center">
                    <Download className="w-16 h-16 text-violet-500 mx-auto mb-6" />
                    <a href={data.pdf_url} target="_blank" className="inline-flex items-center gap-3 px-12 py-5 bg-violet-600 text-white font-bold rounded-2xl hover:bg-violet-700 transition-all shadow-xl hover:shadow-violet-200">DOWNLOAD PDF NOW <ExternalLink className="w-5 h-5" /></a>
                    <p className="mt-6 text-xs text-gray-400 font-medium">Hello! Your file is ready.</p>
                  </div>
                ) : (
                  <div className="p-6 bg-amber-50 rounded-2xl border border-amber-200 text-amber-700 text-sm italic">Note: PDF file is being prepared. Please check back in a moment.</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <style jsx global>{`.prose ul { list-style-type: disc; padding-left: 1.5rem; text-align: left; max-width: fit-content; margin: 0 auto; } .prose p { margin-bottom: 1.5rem; }`}</style>
    </section>
  )
}
