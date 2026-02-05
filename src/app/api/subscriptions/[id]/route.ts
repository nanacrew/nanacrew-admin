import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

type Params = {
  params: Promise<{
    id: string
  }>
}

// PUT /api/subscriptions/[id] - Update subscription
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const body = await request.json()
    const { subscription_type, status, end_date, notes } = body

    const updateData: any = {}
    if (subscription_type) updateData.subscription_type = subscription_type
    if (status) updateData.status = status
    if (end_date !== undefined) updateData.end_date = end_date
    if (notes !== undefined) updateData.notes = notes

    const { data, error } = await supabase
      .from('subscriptions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error updating subscription:', error)
    return NextResponse.json(
      { error: '구독 업데이트에 실패했습니다' },
      { status: 500 }
    )
  }
}

// DELETE /api/subscriptions/[id] - Delete subscription
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params

    const { error } = await supabase
      .from('subscriptions')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting subscription:', error)
    return NextResponse.json(
      { error: '구독 삭제에 실패했습니다' },
      { status: 500 }
    )
  }
}

// POST /api/subscriptions/[id]/logout - Force logout user
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params

    // Delete all sessions for this subscription
    const { error } = await supabase
      .from('user_sessions')
      .delete()
      .eq('subscription_id', id)

    if (error) throw error

    return NextResponse.json({ success: true, message: '사용자가 로그아웃되었습니다' })
  } catch (error) {
    console.error('Error logging out user:', error)
    return NextResponse.json(
      { error: '로그아웃 처리에 실패했습니다' },
      { status: 500 }
    )
  }
}
