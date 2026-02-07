import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// POST /api/users/check-duplicate - Check if user identifier is already taken
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { app_id, user_identifier } = body

    if (!app_id || !user_identifier) {
      return NextResponse.json(
        { error: '필수 항목이 누락되었습니다 (app_id, user_identifier)' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const { data: existing, error } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('app_id', app_id)
      .eq('user_identifier', user_identifier)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "not found" error, which is expected when user doesn't exist
      throw error
    }

    const isAvailable = !existing

    return NextResponse.json({
      available: isAvailable,
      message: isAvailable
        ? '사용 가능한 아이디입니다.'
        : '이미 사용 중인 아이디입니다.',
    })
  } catch (error) {
    console.error('Error checking duplicate:', error)
    return NextResponse.json(
      { error: '중복 확인에 실패했습니다' },
      { status: 500 }
    )
  }
}
