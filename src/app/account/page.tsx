'use client'

import { useState, useEffect } from 'react'
import { User, LogOut, Edit2, Save, X, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { User as SupabaseUser } from '@supabase/supabase-js'

export default function AccountPage() {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '' })
  const [socialLoading, setSocialLoading] = useState<'google' | 'facebook' | null>(null)

  // Check auth state
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setLoading(false)
    }
    checkSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })
    return () => subscription.unsubscribe()
  }, [])

  // Load profile when user is available
  useEffect(() => {
    if (!user) return
    loadProfile()
  }, [user])

  const loadProfile = async () => {
    if (!user) return
    try {
      const res = await fetch(`/api/customer/account?userId=${user.id}`)
      const data = await res.json()
      if (data.success && data.profile) {
        setProfile(data.profile)
        setEditForm({
          name: data.profile.name || user.user_metadata?.full_name || '',
          email: data.profile.email || user.email || '',
          phone: data.profile.phone || ''
        })
      } else {
        // No profile yet — pre-fill from auth
        setEditForm({
          name: user.user_metadata?.full_name || user.user_metadata?.name || '',
          email: user.email || '',
          phone: ''
        })
        // Create profile
        await fetch('/api/customer/account', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            name: user.user_metadata?.full_name || user.user_metadata?.name || null,
            email: user.email || null
          })
        })
      }
    } catch (error) {
      console.error('Failed to load profile:', error)
    }
  }

  const handleSaveProfile = async () => {
    if (!user) return
    setSaving(true)
    try {
      const res = await fetch('/api/customer/account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          name: editForm.name,
          email: editForm.email,
          phone: editForm.phone
        })
      })
      const data = await res.json()
      if (data.success) {
        setProfile(data.profile)
        setEditing(false)
      }
    } catch (error) {
      console.error('Failed to save profile:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    setSocialLoading(provider)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/livechat`,
          queryParams: provider === 'google' ? { prompt: 'select_account' } : undefined
        }
      })
      if (error) {
        console.error('Social login error:', error)
        setSocialLoading(null)
      }
    } catch (err) {
      console.error('Social login failed:', err)
      setSocialLoading(null)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    )
  }

  // Not signed in — show compact social login card
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-md p-6 w-full max-w-xs">
          <div className="text-center mb-5">
            <div className="bg-black w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
              <User className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-lg font-bold text-gray-900">My Account</h1>
            <p className="text-gray-400 mt-1 text-xs">Sign in to view your profile</p>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => handleSocialLogin('google')}
              disabled={socialLoading !== null}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 text-sm"
            >
              {socialLoading === 'google' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              <span className="font-medium text-gray-700">Continue with Google</span>
            </button>

            <button
              onClick={() => handleSocialLogin('facebook')}
              disabled={socialLoading !== null}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 text-sm"
            >
              {socialLoading === 'facebook' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#1877F2">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              )}
              <span className="font-medium text-gray-700">Continue with Facebook</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Signed in — show compact profile card
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-md w-full max-w-xs">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h1 className="text-base font-bold text-gray-900">My Account</h1>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1 text-gray-400 hover:text-red-500 transition-colors text-xs"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>

        {/* Profile content */}
        <div className="px-5 pb-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Profile</span>
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
              >
                <Edit2 className="w-3 h-3" />
                Edit
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setEditing(false)}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3 h-3" />
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="flex items-center gap-1 text-xs bg-black text-white px-2.5 py-1 rounded-md hover:bg-gray-800 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                  Save
                </button>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-[11px] text-gray-400 mb-0.5">Name</label>
              {editing ? (
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-black"
                />
              ) : (
                <p className="text-sm text-gray-900">{profile?.name || editForm.name || 'Not set'}</p>
              )}
            </div>

            <div>
              <label className="block text-[11px] text-gray-400 mb-0.5">Email</label>
              <p className="text-sm text-gray-900">{user.email || 'Not set'}</p>
            </div>

            <div>
              <label className="block text-[11px] text-gray-400 mb-0.5">Phone</label>
              {editing ? (
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  placeholder="Enter phone number"
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-black"
                />
              ) : (
                <p className="text-sm text-gray-900">{profile?.phone || 'Not set'}</p>
              )}
            </div>

            <div className="pt-3 border-t border-gray-100">
              <p className="text-[10px] text-gray-400">
                Signed in via {user.app_metadata?.provider || 'email'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
