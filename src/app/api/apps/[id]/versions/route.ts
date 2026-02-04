import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

type Params = {
  params: Promise<{
    id: string
  }>
}

// GET /api/apps/[id]/versions - List versions for an app
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params

    const { data: versions, error } = await supabase
      .from('app_versions')
      .select('*')
      .eq('app_id', id)
      .order('release_date', { ascending: false })

    if (error) throw error

    return NextResponse.json(versions)
  } catch (error) {
    console.error('Error fetching versions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch versions' },
      { status: 500 }
    )
  }
}

// POST /api/apps/[id]/versions - Create new version
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const body = await request.json()
    const {
      version,
      minimum_version,
      force_update = false,
      update_message,
      download_url,
      features = []
    } = body

    if (!version || !minimum_version) {
      return NextResponse.json(
        { error: 'Missing required fields: version, minimum_version' },
        { status: 400 }
      )
    }

    const { data: appVersion, error } = await supabase
      .from('app_versions')
      .insert({
        app_id: id,
        version,
        minimum_version,
        force_update,
        update_message,
        download_url,
        features,
        release_date: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(appVersion, { status: 201 })
  } catch (error) {
    console.error('Error creating version:', error)
    return NextResponse.json(
      { error: 'Failed to create version' },
      { status: 500 }
    )
  }
}
