'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'

/**
 * OAuth Callback Page
 * This page receives the OAuth callback in a popup window,
 * processes the auth tokens, and closes itself.
 * The main window will detect the login via onAuthStateChange.
 */
export default function AuthCallbackPage() {
  useEffect(() => {
    const handleCallback = async () => {
      // The hash contains the access token from OAuth
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')

      if (accessToken) {
        // Set the session in Supabase client
        await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || ''
        })
      }

      // Close the popup - the main window will detect the auth change
      if (window.opener) {
        window.close()
      } else {
        // If not a popup (direct navigation), redirect to home
        window.location.href = '/'
      }
    }

    handleCallback()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Completing sign in...</p>
      </div>
    </div>
  )
}
