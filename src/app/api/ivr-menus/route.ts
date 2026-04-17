import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const businessUnitId = searchParams.get('businessUnit')

  if (!businessUnitId) {
    return NextResponse.json({ error: 'businessUnit required' }, { status: 400 })
  }

  const buId = await resolveId(businessUnitId)

  const { data, error } = await supabase
    .from('ivr_menus')
    .select('*')
    .eq('business_unit_id', buId)
    .order('sort_order', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const tree = buildTree(data || [])
  return NextResponse.json({ nodes: data, tree })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { businessUnitId, parentId, label, description, action, payload, sortOrder } = body

  if (!businessUnitId || !label) {
    return NextResponse.json({ error: 'businessUnitId and label required' }, { status: 400 })
  }

  const buId = await resolveId(businessUnitId)

  const { data, error } = await supabase
    .from('ivr_menus')
    .insert({
      business_unit_id: buId,
      parent_id: parentId || null,
      label,
      description: description || null,
      action: action || 'sub_menu',
      payload: payload || {},
      sort_order: sortOrder || 0,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, node: data })
}

export async function PUT(request: NextRequest) {
  const body = await request.json()
  const { id, label, description, action, payload, sortOrder, active, parentId } = body

  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const update: any = { updated_at: new Date().toISOString() }
  if (label !== undefined) update.label = label
  if (description !== undefined) update.description = description
  if (action !== undefined) update.action = action
  if (payload !== undefined) update.payload = payload
  if (sortOrder !== undefined) update.sort_order = sortOrder
  if (active !== undefined) update.active = active
  if (parentId !== undefined) update.parent_id = parentId

  const { data, error } = await supabase
    .from('ivr_menus')
    .update(update)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, node: data })
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { error } = await supabase.from('ivr_menus').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

async function resolveId(slugOrId: string): Promise<string> {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (uuidRegex.test(slugOrId)) return slugOrId
  const { data } = await supabase.from('business_units').select('id').eq('slug', slugOrId).single()
  return data?.id || slugOrId
}

interface MenuNode {
  id: string
  label: string
  description?: string
  action: string
  payload: any
  sort_order: number
  active: boolean
  parent_id: string | null
  children: MenuNode[]
}

function buildTree(flat: any[]): MenuNode[] {
  const map = new Map<string, MenuNode>()
  const roots: MenuNode[] = []

  for (const row of flat) {
    map.set(row.id, { ...row, children: [] })
  }

  for (const node of map.values()) {
    if (node.parent_id && map.has(node.parent_id)) {
      map.get(node.parent_id)!.children.push(node)
    } else if (!node.parent_id) {
      roots.push(node)
    }
  }

  return roots
}
