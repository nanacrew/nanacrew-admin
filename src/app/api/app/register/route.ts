import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { app_id, user_identifier, password, name, phone } = body

    // 필수 파라미터 확인
    if (!app_id || !user_identifier || !password) {
      return NextResponse.json(
        { error: 'app_id, user_identifier, password는 필수입니다' },
        { status: 400 }
      )
    }

    // 1. 중복 확인
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('app_id', app_id)
      .eq('user_identifier', user_identifier)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: '이미 사용 중인 아이디입니다', errorType: 'duplicateUser' },
        { status: 409 }
      )
    }

    // 2. 비밀번호 해싱
    const password_hash = await bcrypt.hash(password, 10)

    // 3. 사용자 생성
    const { data: newUser, error: createError } = await supabaseAdmin
      .from('users')
      .insert({
        app_id,
        user_identifier,
        password_hash,
        name,
        phone,
        status: 'active',
      })
      .select()
      .single()

    if (createError || !newUser) {
      console.error('User creation error:', createError)
      return NextResponse.json(
        { error: '회원가입 처리 중 오류가 발생했습니다' },
        { status: 500 }
      )
    }

    // 4. 기본 구독 생성 (free)
    const { error: subError } = await supabaseAdmin
      .from('subscriptions')
      .insert({
        app_id,
        user_id: newUser.id,
        user_identifier,
        status: 'free',
        start_date: new Date().toISOString(),
      })

    if (subError) {
      console.error('Subscription creation error:', subError)
    }

    // 5. 응답
    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        username: newUser.user_identifier,
        name: newUser.name,
        phone: newUser.phone,
        status: newUser.status,
        createdAt: newUser.created_at,
      },
    }, { status: 201 })

  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json(
      { error: '회원가입 처리 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
