import { NextRequest, NextResponse } from 'next/server'
import {
  loadAIStaff, saveAIStaff, deleteAIStaff,
  loadTrainingScenarios, saveTrainingScenario, deleteTrainingScenario,
  loadTrainingSessions, saveTrainingSession, deleteTrainingSession
} from '@/lib/supabase-storage'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')
  const businessUnitId = searchParams.get('businessUnitId')

  try {
    switch (action) {
      case 'load_ai_staff':
        const staff = await loadAIStaff(businessUnitId)
        return NextResponse.json({ data: staff })

      case 'load_scenarios':
        const scenarios = await loadTrainingScenarios(businessUnitId)
        return NextResponse.json({ data: scenarios })

      case 'load_sessions':
        const sessions = await loadTrainingSessions(businessUnitId)
        return NextResponse.json({ data: sessions })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { action, data, businessUnitId } = body

  try {
    switch (action) {
      case 'save_ai_staff':
        await saveAIStaff(data, businessUnitId)
        return NextResponse.json({ success: true })

      case 'save_scenario':
        const savedScenario = await saveTrainingScenario(data, businessUnitId)
        return NextResponse.json({ success: true, data: savedScenario })

      case 'save_session':
        await saveTrainingSession(data, businessUnitId)
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

  if (!id) {
    return NextResponse.json({ error: 'ID required' }, { status: 400 })
  }

  try {
    switch (action) {
      case 'delete_ai_staff':
        await deleteAIStaff(id)
        return NextResponse.json({ success: true })

      case 'delete_scenario':
        await deleteTrainingScenario(id)
        return NextResponse.json({ success: true })

      case 'delete_session':
        await deleteTrainingSession(id)
        return NextResponse.json({ success: true })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
