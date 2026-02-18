import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, app_id, user_identifier, phone, new_password } = body

    if (!app_id || !user_identifier) {
      return NextResponse.json(
        { error: 'app_id, user_identifier는 필수입니다' },
        { status: 400 }
      )
    }

    // action: 'verify' - 아이디+연락처로 본인확인
    // action: 'reset'  - 새 비밀번호로 변경
    if (action === 'verify') {
      if (!phone) {
        return NextResponse.json(
          { error: 'phone은 필수입니다' },
          { status: 400 }
        )
      }

      // 아이디 + 연락처로 사용자 조회
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('id, user_identifier, phone')
        .eq('app_id', app_id)
        .eq('user_identifier', user_identifier)
        .eq('status', 'active')
        .single()

      if (error || !user) {
        return NextResponse.json(
          { error: '등록되지 않은 아이디입니다', errorType: 'userNotFound' },
          { status: 404 }
        )
      }

      // 연락처 확인 (숫자만 비교)
      const inputPhone = phone.replace(/[^0-9]/g, '')
      const storedPhone = (user.phone || '').replace(/[^0-9]/g, '')

      if (!storedPhone || inputPhone !== storedPhone) {
        return NextResponse.json(
          { error: '연락처가 일치하지 않습니다', errorType: 'phoneMismatch' },
          { status: 401 }
        )
      }

      return NextResponse.json({ success: true, verified: true })

    } else if (action === 'reset') {
      if (!new_password) {
        return NextResponse.json(
          { error: 'new_password는 필수입니다' },
          { status: 400 }
        )
      }

      if (new_password.length < 6) {
        return NextResponse.json(
          { error: '비밀번호는 6자 이상이어야 합니다' },
          { status: 400 }
        )
      }

      // 사용자 조회
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('app_id', app_id)
        .eq('user_identifier', user_identifier)
        .eq('status', 'active')
        .single()

      if (error || !user) {
        return NextResponse.json(
          { error: '사용자를 찾을 수 없습니다' },
          { status: 404 }
        )
      }

      // 새 비밀번호 해싱 후 업데이트
      const password_hash = await bcrypt.hash(new_password, 10)

      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({ password_hash, updated_at: new Date().toISOString() })
        .eq('id', user.id)

      if (updateError) {
        console.error('Password reset error:', updateError)
        return NextResponse.json(
          { error: '비밀번호 변경 중 오류가 발생했습니다' },
          { status: 500 }
        )
      }

      return NextResponse.json({ success: true })

    } else {
      return NextResponse.json(
        { error: 'action은 verify 또는 reset이어야 합니다' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: '처리 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
