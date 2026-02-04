import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

type Params = {
  params: Promise<{
    id: string
  }>
}

// GET /api/apps/[id]/services - List services for an app
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params

    const { data: services, error } = await supabase
      .from('app_services')
      .select('*')
      .eq('app_id', id)
      .order('service_type', { ascending: true })

    if (error) throw error

    return NextResponse.json(services)
  } catch (error) {
    console.error('Error fetching services:', error)
    return NextResponse.json(
      { error: 'Failed to fetch services' },
      { status: 500 }
    )
  }
}

// POST /api/apps/[id]/services - Create new service
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const body = await request.json()
    const {
      service_type,
      service_name,
      account_email,
      project_id,
      project_url,
      api_keys = {},
      notes
    } = body

    if (!service_type || !service_name) {
      return NextResponse.json(
        { error: 'Missing required fields: service_type, service_name' },
        { status: 400 }
      )
    }

    const { data: service, error } = await supabase
      .from('app_services')
      .insert({
        app_id: id,
        service_type,
        service_name,
        account_email,
        project_id,
        project_url,
        api_keys,
        notes,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(service, { status: 201 })
  } catch (error: any) {
    console.error('Error creating service:', error)

    if (error?.code === '23505') { // Unique constraint violation
      return NextResponse.json(
        { error: 'Service already exists for this app' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create service' },
      { status: 500 }
    )
  }
}
