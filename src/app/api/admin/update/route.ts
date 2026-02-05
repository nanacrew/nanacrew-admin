import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: '이메일은 필수입니다' },
        { status: 400 }
      )
    }

    // 현재 세션에서 사용자 ID 가져오기
    const sessionCookie = request.cookies.get('session')
    if (!sessionCookie) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      )
    }

    const sessionData = JSON.parse(
      Buffer.from(sessionCookie.value, 'base64').toString('utf-8')
    )

    // 업데이트할 데이터 준비
    const updateData: any = {
      email,
      updated_at: new Date().toISOString()
    }

    // 비밀번호가 제공된 경우에만 해시화하여 업데이트
    if (password && password.trim() !== '') {
      const passwordHash = await bcrypt.hash(password, 10)
      updateData.password_hash = passwordHash
    }

    // Supabase에서 관리자 정보 업데이트
    const { error } = await supabase
      .from('admin_users')
      .update(updateData)
      .eq('id', sessionData.userId)

    if (error) {
      console.error('Admin update error:', error)
      return NextResponse.json(
        { error: '관리자 정보 업데이트 실패' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '관리자 정보가 업데이트되었습니다'
    })
  } catch (error) {
    console.error('Admin update error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
