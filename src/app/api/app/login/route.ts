import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'nanacrew-secret-key-2026'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { app_id, user_identifier, password } = body

    // 필수 파라미터 확인
    if (!app_id || !user_identifier || !password) {
      return NextResponse.json(
        { error: 'app_id, user_identifier, password는 필수입니다' },
        { status: 400 }
      )
    }

    // 1. 사용자 조회
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*, subscriptions(*)')
      .eq('app_id', app_id)
      .eq('user_identifier', user_identifier)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: '등록되지 않은 회원입니다', errorType: 'userNotFound' },
        { status: 404 }
      )
    }

    // 2. 비밀번호 확인
    if (!user.password_hash) {
      return NextResponse.json(
        { error: '비밀번호가 설정되지 않은 계정입니다' },
        { status: 400 }
      )
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash)
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: '비밀번호가 일치하지 않습니다', errorType: 'invalidPassword' },
        { status: 401 }
      )
    }

    // 3. 계정 상태 확인
    if (user.status === 'inactive') {
      return NextResponse.json(
        {
          error: '비활성화된 계정입니다. 관리자에게 문의하세요',
          errorType: 'accountInactive'
        },
        { status: 403 }
      )
    }

    if (user.status === 'suspended') {
      return NextResponse.json(
        {
          error: '정지된 계정입니다. 관리자에게 문의하세요',
          errorType: 'accountSuspended'
        },
        { status: 403 }
      )
    }

    // 4. JWT 토큰 생성
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.user_identifier,
        appId: user.app_id,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7일
      },
      JWT_SECRET
    )

    // 5. 구독 정보 확인
    const subscription = user.subscriptions?.[0]
    let subscriptionStatus = 'free'
    if (subscription) {
      subscriptionStatus = subscription.status

      // 만료일 체크
      if (subscription.end_date && new Date(subscription.end_date) < new Date()) {
        subscriptionStatus = 'expired'
      }
    }

    // 6. 응답
    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.user_identifier,
        name: user.name,
        email: user.email,
        phone: user.phone,
        status: user.status,
        createdAt: user.created_at,
      },
      subscription: subscription ? {
        status: subscriptionStatus,
        startDate: subscription.start_date,
        endDate: subscription.end_date,
      } : null,
    })

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: '로그인 처리 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
