import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

type Params = {
  params: Promise<{
    id: string
    serviceId: string
  }>
}

// PUT /api/apps/[id]/services/[serviceId] - Update service
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { serviceId } = await params
    const body = await request.json()
    const {
      service_name,
      account_email,
      project_id,
      project_url,
      api_keys,
      notes
    } = body

    const { data: service, error } = await supabase
      .from('app_services')
      .update({
        service_name,
        account_email,
        project_id,
        project_url,
        api_keys,
        notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', serviceId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(service)
  } catch (error) {
    console.error('Error updating service:', error)
    return NextResponse.json(
      { error: 'Failed to update service' },
      { status: 500 }
    )
  }
}

// DELETE /api/apps/[id]/services/[serviceId] - Delete service
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { serviceId } = await params

    const { error } = await supabase
      .from('app_services')
      .delete()
      .eq('id', serviceId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting service:', error)
    return NextResponse.json(
      { error: 'Failed to delete service' },
      { status: 500 }
    )
  }
}
