import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import crypto from 'crypto'

// POST /api/subscriptions/check - Check user and subscription, create session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { app_id, user_identifier, device_info } = body

    if (!app_id || !user_identifier) {
      return NextResponse.json(
        { error: '앱 ID와 사용자 식별자가 필요합니다' },
        { status: 400 }
      )
    }

    // 1. 회원 정보 확인
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('app_id', app_id)
      .eq('user_identifier', user_identifier)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        {
          allowed: false,
          reason: 'user_not_found',
          message: '등록되지 않은 회원입니다.\n하단의 회원가입 버튼을 눌러 가입을 진행해주세요.'
        },
        { status: 403 }
      )
    }

    // 2. 회원 상태 확인
    if (user.status !== 'active') {
      return NextResponse.json(
        {
          allowed: false,
          reason: 'user_inactive',
          message: user.status === 'suspended'
            ? '계정이 정지되었습니다.\n관리자에게 문의하세요.'
            : '계정이 비활성화되었습니다.\n관리자에게 문의하세요.'
        },
        { status: 403 }
      )
    }

    // 3. 구독 정보 확인
    const { data: subscription, error: subError } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (subError || !subscription) {
      return NextResponse.json(
        {
          allowed: false,
          reason: 'no_subscription',
          message: '구독 정보가 없습니다.\n결제를 진행해주세요.'
        },
        { status: 403 }
      )
    }

    // 4. 구독 상태 확인
    if (subscription.status !== 'active') {
      return NextResponse.json(
        {
          allowed: false,
          reason: 'inactive_subscription',
          message: subscription.status === 'expired'
            ? '구독이 만료되었습니다.\n결제를 진행해주세요.'
            : subscription.status === 'cancelled'
            ? '구독이 취소되었습니다.\n재가입을 원하시면 결제를 진행해주세요.'
            : '구독이 활성화되지 않았습니다.\n결제를 진행해주세요.'
        },
        { status: 403 }
      )
    }

    // 5. 만료일 확인 (end_date가 있는 경우)
    if (subscription.end_date) {
      const endDate = new Date(subscription.end_date)
      if (endDate < new Date()) {
        // 자동으로 상태 업데이트
        await supabaseAdmin
          .from('subscriptions')
          .update({ status: 'expired' })
          .eq('id', subscription.id)

        return NextResponse.json(
          {
            allowed: false,
            reason: 'expired',
            message: '구독이 만료되었습니다.\n결제를 진행해주세요.'
          },
          { status: 403 }
        )
      }
    }

    // 6. 기존 세션 확인 (중복 로그인 방지)
    const { data: existingSession } = await supabaseAdmin
      .from('user_sessions')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (existingSession) {
      // 기존 세션이 만료되지 않았으면 중복 로그인 거부
      const expiresAt = new Date(existingSession.expires_at)
      if (expiresAt > new Date()) {
        return NextResponse.json(
          {
            allowed: false,
            reason: 'duplicate_login',
            message: '다른 기기에서 이미 로그인되어 있습니다',
            last_active: existingSession.last_active
          },
          { status: 409 }
        )
      } else {
        // 만료된 세션 삭제
        await supabaseAdmin
          .from('user_sessions')
          .delete()
          .eq('id', existingSession.id)
      }
    }

    // 7. 새 세션 생성
    const sessionToken = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30) // 30일 유효

    const { data: session, error: sessionError } = await supabaseAdmin
      .from('user_sessions')
      .insert({
        subscription_id: subscription.id,
        user_id: user.id,
        session_token: sessionToken,
        device_info: device_info || null,
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single()

    if (sessionError) throw sessionError

    return NextResponse.json({
      allowed: true,
      session_token: sessionToken,
      expires_at: expiresAt.toISOString(),
      subscription: {
        type: subscription.subscription_type,
        end_date: subscription.end_date
      }
    })
  } catch (error) {
    console.error('Error checking subscription:', error)
    return NextResponse.json(
      { error: '구독 확인 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
