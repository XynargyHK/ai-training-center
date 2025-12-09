'use client'

import { useState, useEffect } from 'react'
import ProductTemplateSelector from '@/components/admin/product-template-selector'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface BusinessUnit {
  id: string
  name: string
  slug: string
}

export default function ProductTemplatesPage() {
  const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([])
  const [selectedBU, setSelectedBU] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBusinessUnits()
  }, [])

  const loadBusinessUnits = async () => {
    try {
      const response = await fetch('/api/knowledge?action=load_business_units')
      const data = await response.json()
      if (data.success && data.businessUnits) {
        setBusinessUnits(data.businessUnits)
        // Default to first BU
        if (data.businessUnits.length > 0) {
          setSelectedBU(data.businessUnits[0].id)
        }
      }
    } catch (error) {
      console.error('Failed to load business units:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-pulse">...</div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-gray-500 hover:text-gray-700">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Product Page Templates</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Configure product page fields for each business unit
                </p>
              </div>
            </div>

            {/* Business Unit Selector */}
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700">Business Unit:</label>
              <select
                value={selectedBU}
                onChange={(e) => setSelectedBU(e.target.value)}
                className="px-4 py-2 border rounded-lg bg-white shadow-sm"
              >
                {businessUnits.map(bu => (
                  <option key={bu.id} value={bu.id}>{bu.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {selectedBU ? (
          <ProductTemplateSelector
            businessUnitId={selectedBU}
            onConfigSaved={() => {
              // Could show a toast notification
              console.log('Configuration saved')
            }}
          />
        ) : (
          <div className="text-center py-12 bg-white rounded-lg border">
            <p className="text-gray-500">Select a business unit to configure</p>
          </div>
        )}
      </div>
    </div>
  )
}
