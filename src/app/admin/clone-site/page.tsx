'use client'

import { useState, useEffect, useRef } from 'react'

export default function CloneSitePage() {
  const [businessUnits, setBusinessUnits] = useState<any[]>([])
  const [bu, setBu] = useState('')
  const [url, setUrl] = useState('')
  const [country, setCountry] = useState('HK')
  const [language, setLanguage] = useState('tw')
  const [running, setRunning] = useState(false)
  const [jobId, setJobId] = useState<string | null>(null)
  const [log, setLog] = useState('')
  const pollRef = useRef<any>(null)

  useEffect(() => {
    fetch('/api/knowledge?action=load_business_units')
      .then(r => r.json())
      .then(d => {
        setBusinessUnits(d.data || [])
        if (d.data?.[0]) setBu(d.data[0].slug)
      })
  }, [])

  useEffect(() => () => pollRef.current && clearInterval(pollRef.current), [])

  async function startClone() {
    if (!bu || !url) return
    setRunning(true)
    setLog('')
    const r = await fetch('/api/clone-site', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, businessUnit: bu, country, language }),
    })
    const j = await r.json()
    if (!j.success) { setLog(`❌ ${j.error}`); setRunning(false); return }
    setJobId(j.jobId)
    pollRef.current = setInterval(async () => {
      const lr = await fetch(`/api/clone-site/log?jobId=${j.jobId}`)
      const lj = await lr.json()
      setLog(lj.log)
      if (lj.done) {
        clearInterval(pollRef.current)
        setRunning(false)
      }
    }, 1000)
  }

  return (
    <div className="max-w-3xl mx-auto p-8 space-y-6 font-sans">
      <div>
        <h1 className="text-2xl font-bold mb-1">Clone Site</h1>
        <p className="text-sm text-gray-500">Paste any Shopify-based URL. We scrape colors, menu, products, and build a landing page draft that you can polish in the editor.</p>
      </div>

      <div className="space-y-3 bg-white border border-gray-200 rounded-lg p-5">
        <label className="block">
          <span className="block text-xs font-medium text-gray-600 mb-1">Business Unit</span>
          <select
            value={bu}
            onChange={(e) => setBu(e.target.value)}
            disabled={running}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded outline-none focus:ring-2 focus:ring-violet-300"
          >
            {businessUnits.map(b => (
              <option key={b.id} value={b.slug}>{b.name} ({b.slug})</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="block text-xs font-medium text-gray-600 mb-1">Source URL</span>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.xynargy.hk"
            disabled={running}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded outline-none focus:ring-2 focus:ring-violet-300"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="block text-xs font-medium text-gray-600 mb-1">Country</span>
            <select value={country} onChange={(e) => setCountry(e.target.value)} disabled={running}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded outline-none">
              <option value="US">US</option>
              <option value="HK">HK</option>
              <option value="SG">SG</option>
              <option value="UK">UK</option>
              <option value="AU">AU</option>
            </select>
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-gray-600 mb-1">Language</span>
            <select value={language} onChange={(e) => setLanguage(e.target.value)} disabled={running}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded outline-none">
              <option value="en">English</option>
              <option value="tw">繁體中文</option>
              <option value="cn">简体中文</option>
            </select>
          </label>
        </div>

        <button
          onClick={startClone}
          disabled={running || !bu || !url}
          className="w-full mt-2 px-4 py-3 bg-violet-600 hover:bg-violet-700 disabled:bg-gray-300 text-white rounded font-medium transition-colors"
        >
          {running ? '🔄 Cloning…' : '🚀 Clone Site'}
        </button>
      </div>

      {log && (
        <div className="bg-gray-900 text-green-300 rounded-lg p-4 font-mono text-xs overflow-x-auto whitespace-pre-wrap max-h-96 overflow-y-auto">
          {log}
        </div>
      )}

      {jobId && !running && log && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm">
          ✅ Clone finished. Open the landing page editor to review & polish →{' '}
          <a href="/admin/conversations" className="text-violet-600 underline">Go to editor</a>
        </div>
      )}
    </div>
  )
}
