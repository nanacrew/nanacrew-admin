import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

type Params = {
  params: Promise<{
    id: string
  }>
}

// GET /api/users/[id] - Get user details
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params

    const { data, error } = await supabaseAdmin
      .from('users')
      .select(`
        *,
        apps(id, name, package_name),
        subscriptions(
          id,
          subscription_type,
          status,
          start_date,
          end_date,
          notes,
          created_at,
          updated_at
        )
      `)
      .eq('id', id)
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: '회원 정보를 불러오는데 실패했습니다' },
      { status: 500 }
    )
  }
}

// PUT /api/users/[id] - Update user
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const body = await request.json()
    const { user_identifier, name, email, phone, status, notes } = body

    const updateData: any = {}
    if (user_identifier) updateData.user_identifier = user_identifier
    if (name !== undefined) updateData.name = name
    if (email !== undefined) updateData.email = email
    if (phone !== undefined) updateData.phone = phone
    if (status) updateData.status = status
    if (notes !== undefined) updateData.notes = notes

    const { data, error } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: '회원 정보 수정에 실패했습니다' },
      { status: 500 }
    )
  }
}

// DELETE /api/users/[id] - Delete user
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params

    // Delete all related data first
    await supabaseAdmin
      .from('user_sessions')
      .delete()
      .eq('user_id', id)

    await supabaseAdmin
      .from('subscriptions')
      .delete()
      .eq('user_id', id)

    const { error } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: '회원 삭제에 실패했습니다' },
      { status: 500 }
    )
  }
}

// POST /api/users/[id]/subscription - Add/Update subscription for user
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id: userId } = await params
    const body = await request.json()
    const { subscription_type, end_date, notes } = body

    if (!subscription_type) {
      return NextResponse.json(
        { error: '구독 타입이 필요합니다' },
        { status: 400 }
      )
    }

    // Get user info
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('app_id, user_identifier')
      .eq('id', userId)
      .single()

    if (userError) throw userError

    // Get admin user ID from session
    const sessionCookie = request.cookies.get('session')
    let createdBy = null
    if (sessionCookie) {
      try {
        const sessionData = JSON.parse(
          Buffer.from(sessionCookie.value, 'base64').toString('utf-8')
        )
        createdBy = sessionData.userId
      } catch (e) {
        console.error('Failed to parse session cookie:', e)
      }
    }

    // Check if subscription already exists
    const { data: existing } = await supabaseAdmin
      .from('subscriptions')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (existing) {
      // Update existing subscription
      const { data, error } = await supabaseAdmin
        .from('subscriptions')
        .update({
          subscription_type,
          status: 'active',
          end_date: end_date || null,
          notes: notes || null
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) throw error

      return NextResponse.json(data)
    } else {
      // Create new subscription
      const { data, error } = await supabaseAdmin
        .from('subscriptions')
        .insert({
          app_id: user.app_id,
          user_id: userId,
          user_identifier: user.user_identifier,
          subscription_type,
          status: 'active',
          end_date: end_date || null,
          notes: notes || null,
          created_by: createdBy
        })
        .select()
        .single()

      if (error) throw error

      return NextResponse.json(data, { status: 201 })
    }
  } catch (error) {
    console.error('Error managing subscription:', error)
    return NextResponse.json(
      { error: '구독 관리에 실패했습니다' },
      { status: 500 }
    )
  }
}
