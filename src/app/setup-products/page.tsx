'use client'

import { useState } from 'react'

export default function SetupProductsPage() {
  const [sqlCopied, setSqlCopied] = useState(false)
  const [commandCopied, setCommandCopied] = useState(false)

  const setupSQL = `-- ========================================
-- PRODUCTS TABLE SETUP
-- ========================================
-- This creates the products table for your Excel data
-- Run this ONCE in Supabase SQL Editor
-- ========================================

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_unit_id UUID REFERENCES business_units(id) ON DELETE CASCADE,

  product_name TEXT,
  tagline TEXT,
  ingredients TEXT,
  hero_benefit_summary TEXT,
  key_actives TEXT,
  face_benefits TEXT,
  body_benefit TEXT,
  hairscalp_benefits TEXT,
  eye_benefits TEXT,
  clinical_highlight TEXT,
  trade_name TEXT,
  cost_2ml DECIMAL(10,2),
  retail_2ml TEXT,
  retail_30ml TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_business_unit ON products(business_unit_id);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(product_name);
CREATE INDEX IF NOT EXISTS idx_products_trade_name ON products(trade_name);

-- Enable Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
DROP POLICY IF EXISTS "Service role has full access" ON products;
CREATE POLICY "Service role has full access" ON products
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

SELECT 'Products table created successfully! Now run: node scripts/import-products-data.js' AS status;`

  const importCommand = `node scripts/import-products-data.js`

  const copySQL = () => {
    navigator.clipboard.writeText(setupSQL)
    setSqlCopied(true)
    setTimeout(() => setSqlCopied(false), 2000)
  }

  const copyCommand = () => {
    navigator.clipboard.writeText(importCommand)
    setCommandCopied(true)
    setTimeout(() => setCommandCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Products Database Setup
          </h1>
          <p className="text-gray-600 text-lg">
            Two simple steps to import your 50 products from Excel
          </p>
        </div>

        {/* Step 1: SQL Setup */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="flex items-center mb-4">
            <div className="bg-indigo-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-xl mr-4">
              1
            </div>
            <h2 className="text-2xl font-bold text-gray-800">
              Run SQL in Supabase
            </h2>
          </div>

          <div className="space-y-4 ml-14">
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
              <p className="font-semibold text-blue-900 mb-2">Instructions:</p>
              <ol className="list-decimal list-inside space-y-1 text-blue-800">
                <li>Click "Copy SQL" below</li>
                <li>
                  Open{' '}
                  <a
                    href="https://supabase.com/dashboard/project/utqxzbnbqwuxwonxhryn/sql/new"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline font-semibold hover:text-blue-600"
                  >
                    Supabase SQL Editor
                  </a>
                </li>
                <li>Paste the SQL and click "Run"</li>
              </ol>
            </div>

            <button
              onClick={copySQL}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center gap-2"
            >
              {sqlCopied ? (
                <>
                  <span>✓</span>
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <span>📋</span>
                  <span>Copy SQL</span>
                </>
              )}
            </button>

            <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
              <pre className="text-green-400 text-sm font-mono whitespace-pre-wrap">
                {setupSQL}
              </pre>
            </div>
          </div>
        </div>

        {/* Step 2: Import Products */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center mb-4">
            <div className="bg-green-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-xl mr-4">
              2
            </div>
            <h2 className="text-2xl font-bold text-gray-800">
              Import Products
            </h2>
          </div>

          <div className="space-y-4 ml-14">
            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
              <p className="font-semibold text-green-900 mb-2">After Step 1 completes:</p>
              <p className="text-green-800">
                Open your terminal and run this command to automatically import all 50 products:
              </p>
            </div>

            <button
              onClick={copyCommand}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center gap-2"
            >
              {commandCopied ? (
                <>
                  <span>✓</span>
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <span>📋</span>
                  <span>Copy Command</span>
                </>
              )}
            </button>

            <div className="bg-gray-900 rounded-lg p-4">
              <pre className="text-green-400 text-sm font-mono">
                {importCommand}
              </pre>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
              <p className="font-semibold text-yellow-900 mb-2">📊 What will be imported:</p>
              <ul className="list-disc list-inside space-y-1 text-yellow-800">
                <li>50 booster products from your Excel file</li>
                <li>All 14 columns: name, tagline, ingredients, benefits, pricing</li>
                <li>Automatic duplicate detection</li>
                <li>Progress tracking for each product</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Info Footer */}
        <div className="mt-6 bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl p-6">
          <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
            <span>💡</span>
            <span>After Setup:</span>
          </h3>
          <ul className="space-y-1 text-gray-700">
            <li>✅ Your AI chatbot will have access to all product information</li>
            <li>✅ Future Excel uploads will be fully automatic</li>
            <li>✅ No more manual SQL needed - this is a one-time setup!</li>
          </ul>
        </div>

      </div>
    </div>
  )
}
