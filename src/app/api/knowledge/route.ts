import { NextRequest, NextResponse } from 'next/server'
import {
  loadKnowledge, saveKnowledge, deleteKnowledge,
  loadFAQs, saveFAQ, deleteFAQ,
  loadCannedMessages, saveCannedMessage, deleteCannedMessage,
  loadFAQCategories, loadCannedCategories, saveCategory, deleteCategory,
  loadGuidelines, saveGuideline, deleteGuideline,
  loadTrainingData, saveTrainingData,
  loadBusinessUnits, saveBusinessUnit, deleteBusinessUnit
} from '@/lib/supabase-storage'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')

  try {
    switch (action) {
      case 'load_knowledge':
        const knowledge = await loadKnowledge()
        return NextResponse.json({ data: knowledge })

      case 'load_faqs':
        const faqs = await loadFAQs()
        return NextResponse.json({ data: faqs })

      case 'load_canned_messages':
        const messages = await loadCannedMessages()
        return NextResponse.json({ data: messages })

      case 'load_faq_categories':
        const faqCategories = await loadFAQCategories()
        return NextResponse.json({ data: faqCategories })

      case 'load_canned_categories':
        const cannedCategories = await loadCannedCategories()
        return NextResponse.json({ data: cannedCategories })

      case 'load_guidelines':
        const guidelines = await loadGuidelines()
        return NextResponse.json({ data: guidelines })

      case 'load_training_data':
        const trainingData = await loadTrainingData()
        return NextResponse.json({ data: trainingData })

      case 'load_business_units':
        const businessUnits = await loadBusinessUnits()
        return NextResponse.json({ data: businessUnits })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { action, data } = body

  try {
    switch (action) {
      case 'save_knowledge':
        await saveKnowledge(data)
        return NextResponse.json({ success: true })

      case 'save_faq':
        await saveFAQ(data)
        return NextResponse.json({ success: true })

      case 'save_canned_message':
        await saveCannedMessage(data)
        return NextResponse.json({ success: true })

      case 'save_category':
        await saveCategory(data.name, data.type)
        return NextResponse.json({ success: true })

      case 'save_guideline':
        await saveGuideline(data)
        return NextResponse.json({ success: true })

      case 'save_training_data':
        await saveTrainingData(data)
        return NextResponse.json({ success: true })

      case 'save_business_unit':
        await saveBusinessUnit(data)
        return NextResponse.json({ success: true })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')
  const id = searchParams.get('id')
  const name = searchParams.get('name')

  try {
    switch (action) {
      case 'delete_knowledge':
        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
        await deleteKnowledge(id)
        return NextResponse.json({ success: true })

      case 'delete_faq':
        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
        await deleteFAQ(id)
        return NextResponse.json({ success: true })

      case 'delete_canned_message':
        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
        await deleteCannedMessage(id)
        return NextResponse.json({ success: true })

      case 'delete_category':
        if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 })
        await deleteCategory(name)
        return NextResponse.json({ success: true })

      case 'delete_guideline':
        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
        await deleteGuideline(id)
        return NextResponse.json({ success: true })

      case 'delete_business_unit':
        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
        await deleteBusinessUnit(id)
        return NextResponse.json({ success: true })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
