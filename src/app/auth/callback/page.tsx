'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'

/**
 * OAuth Callback Page
 * This page receives the OAuth callback in a popup window,
 * processes the auth tokens, notifies the main window, and closes itself.
 */
export default function AuthCallbackPage() {
  useEffect(() => {
    const handleCallback = async () => {
      // The hash contains the access token from OAuth
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')

      if (accessToken && refreshToken) {
        // Set the session in Supabase client (this stores in localStorage)
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        })

        if (!error && data.session) {
          // Notify the main window about successful login
          if (window.opener) {
            window.opener.postMessage({
              type: 'OAUTH_SUCCESS',
              session: {
                user: data.session.user,
                access_token: accessToken,
                refresh_token: refreshToken
              }
            }, window.location.origin)
          }
        }
      }

      // Small delay to ensure message is sent, then close
      setTimeout(() => {
        if (window.opener) {
          window.close()
        } else {
          // If not a popup (direct navigation), redirect to home
          window.location.href = '/'
        }
      }, 500)
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
