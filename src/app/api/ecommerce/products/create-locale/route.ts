/**
 * Product Create-Locale API
 * POST /api/ecommerce/products/create-locale
 * Creates a new locale for products by copying/translating from source locale
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getLLMConfig } from '@/app/api/llm-config/route'
import { GoogleGenerativeAI } from '@google/generative-ai'
import Anthropic from '@anthropic-ai/sdk'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function resolveBusinessUnitId(param: string): Promise<string | null> {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (uuidRegex.test(param)) return param

  const { data } = await supabase
    .from('business_units')
    .select('id')
    .eq('slug', param)
    .single()

  return data?.id || null
}

// Translate text using configured LLM
async function translateText(text: string, targetLanguage: string, context: string = 'skincare and beauty'): Promise<string> {
  if (!text || !text.trim()) return text

  const llmConfig = getLLMConfig()

  const languageMap: { [key: string]: string } = {
    'tw': 'Traditional Chinese (Hong Kong)',
    'cn': 'Simplified Chinese',
    'en': 'English',
    'es': 'Spanish',
    'ja': 'Japanese',
    'ko': 'Korean',
    'fr': 'French',
    'de': 'German'
  }

  const targetLang = languageMap[targetLanguage] || targetLanguage

  const prompt = `You are a professional translator specializing in ${context} content.

Translate the following text to ${targetLang}.

CRITICAL RULES:
1. Preserve ALL HTML tags, markdown formatting exactly
2. Use professional terminology for ${context}
3. Maintain tone and style
4. Keep brand names in original language
5. Keep URLs unchanged
6. Respond with ONLY translated text, no explanations

Text:
"""
${text}
"""

Translation:`

  let translation = text

  try {
    switch (llmConfig.provider) {
      case 'google':
        const genAI = new GoogleGenerativeAI(llmConfig.googleKey!)
        const model = genAI.getGenerativeModel({ model: llmConfig.model })
        const result = await model.generateContent(prompt)
        translation = result.response.text().trim()
        break

      case 'anthropic':
        const anthropic = new Anthropic({ apiKey: llmConfig.anthropicKey! })
        const response = await anthropic.messages.create({
          model: llmConfig.model,
          max_tokens: 2048,
          messages: [{ role: 'user', content: prompt }]
        })
        translation = response.content[0].type === 'text' ? response.content[0].text.trim() : text
        break

      case 'openai':
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${llmConfig.openaiKey}`
          },
          body: JSON.stringify({
            model: llmConfig.model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3
          })
        })
        const data = await openaiResponse.json()
        translation = data.choices[0]?.message?.content?.trim() || text
        break
    }
  } catch (error) {
    console.error('Translation error:', error)
    return text
  }

  return translation
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { businessUnitId, country, language, mode, sourceCountry, sourceLanguage } = body

    if (!businessUnitId || !country || !language) {
      return NextResponse.json(
        { error: 'businessUnitId, country, and language are required' },
        { status: 400 }
      )
    }

    const resolvedBusinessUnitId = await resolveBusinessUnitId(businessUnitId)
    if (!resolvedBusinessUnitId) {
      return NextResponse.json({ error: 'Business unit not found' }, { status: 404 })
    }

    // Check if target locale already has products
    const { data: existing } = await supabase
      .from('products')
      .select('id')
      .eq('business_unit_id', resolvedBusinessUnitId)
      .eq('country', country)
      .eq('language_code', language)
      .is('deleted_at', null)
      .limit(1)

    if (existing && existing.length > 0) {
      return NextResponse.json({ error: 'Products already exist for this locale' }, { status: 409 })
    }

    // Empty mode: nothing to copy
    if (mode === 'empty') {
      return NextResponse.json({
        success: true,
        message: `Empty locale created for ${country}/${language}`,
        copiedCount: 0
      })
    }

    // Copy or translate from source
    if (!sourceCountry || !sourceLanguage) {
      return NextResponse.json(
        { error: 'sourceCountry and sourceLanguage are required for copy/translate mode' },
        { status: 400 }
      )
    }

    // Fetch all source products with relations (addon matches fetched separately to avoid FK hint issues)
    const { data: sourceProducts, error: sourceError } = await supabase
      .from('products')
      .select(`
        *,
        product_images(id, url, alt_text, display_order),
        product_variants(
          id, title, sku, barcode, inventory_quantity, allow_backorder, manage_inventory,
          product_variant_prices(amount, currency_code)
        ),
        product_category_mapping(category_id)
      `)
      .eq('business_unit_id', resolvedBusinessUnitId)
      .eq('country', sourceCountry)
      .eq('language_code', sourceLanguage)
      .is('deleted_at', null)

    if (sourceError) {
      console.error('Error fetching source products:', sourceError)
      return NextResponse.json({ error: 'Failed to fetch source products', details: sourceError.message }, { status: 500 })
    }

    if (!sourceProducts || sourceProducts.length === 0) {
      return NextResponse.json({ error: 'No products found in source locale' }, { status: 404 })
    }

    // Fetch addon matches separately (table has two FKs to products, so we query directly)
    const sourceProductIds = sourceProducts.map((p: any) => p.id)
    const { data: allAddonMatches } = await supabase
      .from('product_addon_matches')
      .select('product_id, addon_product_id, display_order')
      .in('product_id', sourceProductIds)

    // Group addon matches by product_id
    const addonMatchesByProduct: Record<string, any[]> = {}
    for (const m of (allAddonMatches || [])) {
      if (!addonMatchesByProduct[m.product_id]) addonMatchesByProduct[m.product_id] = []
      addonMatchesByProduct[m.product_id].push(m)
    }

    const shouldTranslate = mode === 'translate'
    const sourceToNewIdMap: Record<string, string> = {} // old product ID -> new product ID
    let copiedCount = 0

    // Copy each product
    for (const source of sourceProducts) {
      // Prepare product data (exclude relational and system fields)
      const {
        id: sourceId,
        created_at, updated_at, deleted_at,
        product_images, product_variants, product_category_mapping,
        ...productData
      } = source

      // Update locale fields
      productData.country = country
      productData.language_code = language

      // Translate text fields if requested
      if (shouldTranslate) {
        if (productData.title) productData.title = await translateText(productData.title, language)
        if (productData.tagline) productData.tagline = await translateText(productData.tagline, language)
        if (productData.description) productData.description = await translateText(productData.description, language)
        if (productData.hero_benefit) productData.hero_benefit = await translateText(productData.hero_benefit, language)
        if (productData.key_actives) productData.key_actives = await translateText(productData.key_actives, language)
        if (productData.clinical_studies) productData.clinical_studies = await translateText(productData.clinical_studies, language)
        // Keep ingredients, trade_name as-is (scientific/brand names)
      }

      // Insert new product
      const { data: newProduct, error: insertError } = await supabase
        .from('products')
        .insert(productData)
        .select()
        .single()

      if (insertError) {
        console.error(`Error copying product "${source.title}":`, insertError)
        continue
      }

      sourceToNewIdMap[sourceId] = newProduct.id
      copiedCount++

      // Copy images
      if (product_images && product_images.length > 0) {
        const imageInserts = product_images.map((img: any) => ({
          product_id: newProduct.id,
          url: img.url,
          alt_text: img.alt_text,
          display_order: img.display_order
        }))
        await supabase.from('product_images').insert(imageInserts)
      }

      // Copy variants with prices
      if (product_variants && product_variants.length > 0) {
        for (const variant of product_variants) {
          const { data: newVariant, error: variantError } = await supabase
            .from('product_variants')
            .insert({
              product_id: newProduct.id,
              title: shouldTranslate ? await translateText(variant.title, language) : variant.title,
              sku: variant.sku,
              barcode: variant.barcode,
              inventory_quantity: variant.inventory_quantity,
              allow_backorder: variant.allow_backorder,
              manage_inventory: variant.manage_inventory
            })
            .select()
            .single()

          if (variantError) continue

          // Copy variant prices
          if (variant.product_variant_prices && variant.product_variant_prices.length > 0) {
            const priceInserts = variant.product_variant_prices.map((p: any) => ({
              variant_id: newVariant.id,
              amount: p.amount,
              currency_code: p.currency_code
            }))
            await supabase.from('product_variant_prices').insert(priceInserts)
          }
        }
      }

      // Copy category mappings (categories are shared across locales)
      if (product_category_mapping && product_category_mapping.length > 0) {
        const catInserts = product_category_mapping.map((m: any) => ({
          product_id: newProduct.id,
          category_id: m.category_id
        }))
        await supabase.from('product_category_mapping').insert(catInserts)
      }
    }

    // Copy addon matches with remapped IDs (second pass after all products are created)
    for (const source of sourceProducts) {
      const newProductId = sourceToNewIdMap[source.id]
      if (!newProductId) continue

      const addonMatches = addonMatchesByProduct[source.id]
      if (addonMatches && addonMatches.length > 0) {
        const addonInserts = addonMatches
          .filter((m: any) => sourceToNewIdMap[m.addon_product_id])
          .map((m: any) => ({
            product_id: newProductId,
            addon_product_id: sourceToNewIdMap[m.addon_product_id],
            display_order: m.display_order
          }))

        if (addonInserts.length > 0) {
          await supabase.from('product_addon_matches').insert(addonInserts)
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `${copiedCount} products ${shouldTranslate ? 'translated' : 'copied'} to ${country}/${language}`,
      copiedCount
    })
  } catch (error) {
    console.error('Create product locale error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
