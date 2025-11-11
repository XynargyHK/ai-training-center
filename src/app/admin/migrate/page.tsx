'use client'

import { useState, useEffect } from 'react'
import { Download, Database, Upload, CheckCircle2, AlertCircle } from 'lucide-react'

interface KnowledgeEntry {
  id: string
  category: string
  topic: string
  content: string
  keywords: string[]
  confidence: number
  createdAt: Date
  updatedAt: Date
  filePath?: string
  fileName?: string
}

export default function MigrationPage() {
  const [localStorageData, setLocalStorageData] = useState<KnowledgeEntry[]>([])
  const [migrationStatus, setMigrationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [migrationMessage, setMigrationMessage] = useState('')
  const [migratedCount, setMigratedCount] = useState(0)

  useEffect(() => {
    loadLocalStorageData()
  }, [])

  const loadLocalStorageData = () => {
    try {
      // Try different possible keys
      const possibleKeys = [
        'skincoach_ai_training_knowledge',
        'ai_training_knowledge',
        'knowledgeEntries'
      ]

      for (const key of possibleKeys) {
        const data = localStorage.getItem(key)
        if (data) {
          const parsed = JSON.parse(data)
          if (Array.isArray(parsed) && parsed.length > 0) {
            setLocalStorageData(parsed)
            setMigrationMessage(`Found ${parsed.length} knowledge entries in localStorage (key: ${key})`)
            return
          }
        }
      }

      setMigrationMessage('No knowledge base data found in localStorage')
    } catch (error) {
      console.error('Error loading localStorage:', error)
      setMigrationMessage('Error reading localStorage data')
    }
  }

  const downloadAsJSON = () => {
    const dataStr = JSON.stringify(localStorageData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `knowledge-base-backup-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const migrateToSupabase = async () => {
    setMigrationStatus('loading')
    setMigrationMessage('Migrating data to Supabase...')

    try {
      const response = await fetch('/api/migrate-to-supabase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          knowledgeEntries: localStorageData,
          businessUnitId: '77313e61-2a19-4f3e-823b-80390dde8bd2' // SkinCoach ID
        })
      })

      const result = await response.json()

      if (result.success) {
        setMigrationStatus('success')
        setMigratedCount(result.migratedCount || 0)
        setMigrationMessage(`Successfully migrated ${result.migratedCount} entries to Supabase!`)
      } else {
        setMigrationStatus('error')
        setMigrationMessage(`Migration failed: ${result.error}`)
      }
    } catch (error: any) {
      setMigrationStatus('error')
      setMigrationMessage(`Migration error: ${error.message}`)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <Database className="w-8 h-8 text-purple-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              Migrate to Supabase
            </h1>
          </div>

          <div className="mb-8">
            <p className="text-gray-600 mb-4">
              This tool will migrate your knowledge base data from localStorage to Supabase database.
            </p>

            {/* Status Message */}
            <div className={`p-4 rounded-lg mb-6 ${
              migrationStatus === 'success' ? 'bg-green-50 border border-green-200' :
              migrationStatus === 'error' ? 'bg-red-50 border border-red-200' :
              'bg-blue-50 border border-blue-200'
            }`}>
              <div className="flex items-center gap-2">
                {migrationStatus === 'success' && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                {migrationStatus === 'error' && <AlertCircle className="w-5 h-5 text-red-600" />}
                <p className={`font-medium ${
                  migrationStatus === 'success' ? 'text-green-800' :
                  migrationStatus === 'error' ? 'text-red-800' :
                  'text-blue-800'
                }`}>
                  {migrationMessage}
                </p>
              </div>
            </div>

            {/* Data Preview */}
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4">Current Data Preview</h2>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  <strong>Total Entries:</strong> {localStorageData.length}
                </p>
                {localStorageData.length > 0 && (
                  <>
                    <p className="text-sm text-gray-600">
                      <strong>Categories:</strong> {[...new Set(localStorageData.map(e => e.category))].join(', ')}
                    </p>
                    <div className="mt-4 max-h-96 overflow-y-auto border border-gray-200 rounded p-4 bg-white">
                      {localStorageData.slice(0, 10).map((entry, index) => (
                        <div key={entry.id} className="mb-4 pb-4 border-b border-gray-200 last:border-0">
                          <div className="text-sm">
                            <p className="font-semibold text-gray-800">#{index + 1} - {entry.topic}</p>
                            <p className="text-gray-600 mt-1">Category: {entry.category}</p>
                            <p className="text-gray-500 mt-1 line-clamp-2">{entry.content}</p>
                          </div>
                        </div>
                      ))}
                      {localStorageData.length > 10 && (
                        <p className="text-sm text-gray-500 italic">...and {localStorageData.length - 10} more entries</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={downloadAsJSON}
                disabled={localStorageData.length === 0}
                className="flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-5 h-5" />
                Download Backup (JSON)
              </button>

              <button
                onClick={migrateToSupabase}
                disabled={localStorageData.length === 0 || migrationStatus === 'loading' || migrationStatus === 'success'}
                className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload className="w-5 h-5" />
                {migrationStatus === 'loading' ? 'Migrating...' : 'Migrate to Supabase'}
              </button>
            </div>

            {migrationStatus === 'success' && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">Migration Complete!</h3>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>✅ {migratedCount} entries migrated to Supabase</li>
                  <li>✅ Data is now stored in the cloud</li>
                  <li>✅ Your app will now use Supabase instead of localStorage</li>
                  <li>💡 Tip: You can still download a backup for your records</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
