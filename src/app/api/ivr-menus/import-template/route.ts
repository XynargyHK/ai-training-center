import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { ivrTemplates, IvrTemplateNode } from '@/data/ivr-templates'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  const { templateId, businessUnitId } = await request.json()

  if (!templateId || !businessUnitId) {
    return NextResponse.json({ error: 'templateId and businessUnitId required' }, { status: 400 })
  }

  const template = ivrTemplates.find(t => t.id === templateId)
  if (!template) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 })
  }

  const buId = await resolveId(businessUnitId)

  // Delete existing menu for this BU (fresh import)
  await supabase.from('ivr_menus').delete().eq('business_unit_id', buId)

  // Recursively insert tree
  const inserted = await insertNode(buId, null, template.tree, 0)

  return NextResponse.json({ success: true, nodesInserted: inserted })
}

async function insertNode(buId: string, parentId: string | null, node: IvrTemplateNode, sortOrder: number): Promise<number> {
  const { data, error } = await supabase
    .from('ivr_menus')
    .insert({
      business_unit_id: buId,
      parent_id: parentId,
      sort_order: sortOrder,
      label: node.label,
      description: node.description || null,
      action: node.action,
      payload: node.payload || {},
    })
    .select('id')
    .single()

  if (error || !data) {
    console.error('IVR insert error:', error?.message)
    return 0
  }

  let count = 1
  if (node.children) {
    for (let i = 0; i < node.children.length; i++) {
      count += await insertNode(buId, data.id, node.children[i], i + 1)
    }
  }
  return count
}

async function resolveId(slugOrId: string): Promise<string> {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (uuidRegex.test(slugOrId)) return slugOrId
  const { data } = await supabase.from('business_units').select('id').eq('slug', slugOrId).single()
  return data?.id || slugOrId
}

export async function GET() {
  return NextResponse.json({
    templates: ivrTemplates.map(t => ({
      id: t.id,
      name: t.name,
      industry: t.industry,
      icon: t.icon,
      description: t.description,
      optionCount: t.tree.children?.length || 0,
    }))
  })
}
