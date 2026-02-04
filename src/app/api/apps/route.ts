import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/apps - List all apps
export async function GET() {
  try {
    const { data: apps, error } = await supabase
      .from('apps')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(apps)
  } catch (error) {
    console.error('Error fetching apps:', error)
    return NextResponse.json(
      { error: 'Failed to fetch apps' },
      { status: 500 }
    )
  }
}

// POST /api/apps - Create new app
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, package_name, platform, icon_url, description } = body

    if (!name || !package_name || !platform) {
      return NextResponse.json(
        { error: 'Missing required fields: name, package_name, platform' },
        { status: 400 }
      )
    }

    const { data: app, error } = await supabase
      .from('apps')
      .insert({
        name,
        package_name,
        platform,
        icon_url,
        description,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(app, { status: 201 })
  } catch (error: any) {
    console.error('Error creating app:', error)

    if (error?.code === '23505') { // Unique constraint violation
      return NextResponse.json(
        { error: 'App with this package name already exists' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create app' },
      { status: 500 }
    )
  }
}
