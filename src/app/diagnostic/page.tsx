'use client'

import { useState, useEffect } from 'react'

export default function DiagnosticPage() {
  const [apiData, setApiData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/landing-page?businessUnit=skincoach')
        const data = await response.json()
        setApiData(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 font-mono">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🔍 Railway Deployment Diagnostic</h1>

        {/* Environment Info */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-green-400">Environment Info</h2>
          <div className="space-y-2 text-sm">
            <div className="flex">
              <span className="w-48 text-gray-400">Supabase URL:</span>
              <span className="text-yellow-300">{process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT SET'}</span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-400">Service Key:</span>
              <span className="text-yellow-300">{process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ SET' : '❌ NOT SET'}</span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-400">Node ENV:</span>
              <span className="text-yellow-300">{process.env.NODE_ENV}</span>
            </div>
          </div>
        </div>

        {/* API Response */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-green-400">API Response</h2>

          {loading && (
            <div className="text-gray-400">Loading...</div>
          )}

          {error && (
            <div className="bg-red-900 border border-red-600 rounded p-4 mb-4">
              <div className="font-semibold text-red-300">❌ Error</div>
              <div className="text-sm mt-2">{error}</div>
            </div>
          )}

          {apiData && (
            <>
              <div className="mb-4 space-y-2">
                <div className="flex">
                  <span className="w-48 text-gray-400">Has Landing Page:</span>
                  <span className={apiData.hasLandingPage ? 'text-green-400' : 'text-red-400'}>
                    {apiData.hasLandingPage ? '✅ YES' : '❌ NO'}
                  </span>
                </div>

                {apiData.landingPage && (
                  <>
                    <div className="flex">
                      <span className="w-48 text-gray-400">Landing Page ID:</span>
                      <span className="text-yellow-300">{apiData.landingPage.id}</span>
                    </div>
                    <div className="flex">
                      <span className="w-48 text-gray-400">Blocks Count:</span>
                      <span className="text-yellow-300">{apiData.landingPage.blocks?.length || 0}</span>
                    </div>
                    <div className="flex">
                      <span className="w-48 text-gray-400">Is Active:</span>
                      <span className={apiData.landingPage.is_active ? 'text-green-400' : 'text-red-400'}>
                        {apiData.landingPage.is_active ? '✅ YES' : '❌ NO'}
                      </span>
                    </div>
                    <div className="flex">
                      <span className="w-48 text-gray-400">Is Published:</span>
                      <span className={apiData.landingPage.is_published ? 'text-green-400' : 'text-yellow-400'}>
                        {apiData.landingPage.is_published ? '✅ YES' : '⚠️  NO'}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Blocks List */}
              {apiData.landingPage?.blocks && apiData.landingPage.blocks.length > 0 && (
                <div className="bg-gray-900 rounded p-4">
                  <h3 className="font-semibold mb-3 text-cyan-400">Blocks:</h3>
                  {apiData.landingPage.blocks.map((block: any, i: number) => (
                    <div key={i} className="mb-3 pl-4 border-l-2 border-cyan-600">
                      <div className="text-sm">
                        <span className="text-gray-400">Block {i + 1}:</span>{' '}
                        <span className="text-cyan-300">{block.type}</span>
                      </div>
                      <div className="text-sm text-gray-500">Name: {block.name}</div>
                      <div className="text-sm text-gray-500">ID: {block.id}</div>
                      {block.type === 'accordion' && block.data?.items && (
                        <div className="text-sm text-green-400">
                          ✅ FAQ Items: {block.data.items.length}
                        </div>
                      )}
                      {block.type === 'testimonials' && block.data?.testimonials && (
                        <div className="text-sm text-green-400">
                          ✅ Testimonials: {block.data.testimonials.length}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Full JSON */}
              <details className="mt-6">
                <summary className="cursor-pointer text-gray-400 hover:text-white">
                  View Full JSON Response
                </summary>
                <pre className="bg-gray-900 rounded p-4 mt-2 overflow-x-auto text-xs">
                  {JSON.stringify(apiData, null, 2)}
                </pre>
              </details>
            </>
          )}
        </div>

        {/* Diagnosis */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-green-400">Diagnosis</h2>

          {apiData && (
            <div className="space-y-3">
              {!apiData.hasLandingPage && (
                <div className="bg-red-900 border border-red-600 rounded p-4">
                  <div className="font-semibold text-red-300">❌ No Landing Page Found</div>
                  <div className="text-sm mt-2">
                    Possible causes:
                    <ul className="list-disc list-inside mt-1 text-gray-300">
                      <li>Wrong business unit ID or slug</li>
                      <li>No page for country=US, language=en</li>
                      <li>Page is not active</li>
                    </ul>
                  </div>
                </div>
              )}

              {apiData.hasLandingPage && (!apiData.landingPage.blocks || apiData.landingPage.blocks.length === 0) && (
                <div className="bg-yellow-900 border border-yellow-600 rounded p-4">
                  <div className="font-semibold text-yellow-300">⚠️  No Blocks Found</div>
                  <div className="text-sm mt-2">
                    Landing page exists but has no blocks. The page will show fallback content.
                  </div>
                </div>
              )}

              {apiData.hasLandingPage && apiData.landingPage.blocks && apiData.landingPage.blocks.length > 0 && (
                <div className="bg-green-900 border border-green-600 rounded p-4">
                  <div className="font-semibold text-green-300">✅ Blocks Found!</div>
                  <div className="text-sm mt-2">
                    Landing page has {apiData.landingPage.blocks.length} block(s).
                    The page should show dynamic content.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Test Link */}
        <div className="mt-6 text-center">
          <a
            href="/livechat/landing?businessUnit=skincoach"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Go to Landing Page →
          </a>
        </div>
      </div>
    </div>
  )
}
