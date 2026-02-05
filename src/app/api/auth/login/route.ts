import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      await logger.warning('Login - Missing credentials', {
        category: 'auth',
        details: 'Email or password missing',
        ipAddress
      })
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // 관리자 계정 조회
    const { data: admin, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', email)
      .single()

    console.log('Supabase query result:', { admin, error })

    if (error || !admin) {
      await logger.warning('Login - User not found', {
        category: 'auth',
        details: `Email: ${email}, Error: ${JSON.stringify(error)}`,
        ipAddress
      })
      console.error('Login failed - User not found:', error)
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // 비밀번호 확인
    console.log('Comparing password:', { password, hash: admin.password_hash })
    const isValidPassword = await bcrypt.compare(password, admin.password_hash)
    console.log('Password comparison result:', isValidPassword)

    if (!isValidPassword) {
      await logger.warning('Login - Invalid password', {
        category: 'auth',
        details: `Email: ${email}`,
        ipAddress
      })
      console.error('Password mismatch')
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // 로그인 성공
    await logger.success('Login successful', {
      category: 'auth',
      details: `Email: ${email}, Name: ${admin.name}`,
      ipAddress
    })

    // 세션 생성 (간단한 토큰)
    const sessionToken = Buffer.from(JSON.stringify({
      userId: admin.id,
      email: admin.email,
      name: admin.name,
      timestamp: Date.now()
    })).toString('base64')

    const response = NextResponse.json({
      success: true,
      user: {
        id: admin.id,
        email: admin.email,
        name: admin.name
      }
    })

    // 쿠키에 세션 저장 (7일)
    response.cookies.set('session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7일
    })

    return response
  } catch (error) {
    await logger.error('Login - Internal error', {
      category: 'auth',
      details: error instanceof Error ? error.message : String(error),
      ipAddress
    })
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
