import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/users - Get all users with filtering
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const appId = searchParams.get('appId')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    let query = supabaseAdmin
      .from('users')
      .select(`
        *,
        apps(id, name, package_name),
        subscriptions(
          id,
          subscription_type,
          status,
          start_date,
          end_date
        )
      `)
      .order('created_at', { ascending: false })

    if (appId && appId !== 'all') {
      query = query.eq('app_id', appId)
    }

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (search) {
      query = query.or(`user_identifier.ilike.%${search}%,name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: '회원 목록을 불러오는데 실패했습니다' },
      { status: 500 }
    )
  }
}

// POST /api/users - Create new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { app_id, user_identifier, name, email, phone, status, notes } = body

    if (!app_id || !user_identifier) {
      return NextResponse.json(
        { error: '필수 항목이 누락되었습니다 (app_id, user_identifier)' },
        { status: 400 }
      )
    }

    // 중복 확인
    const { data: existing } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('app_id', app_id)
      .eq('user_identifier', user_identifier)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: '이미 등록된 사용자입니다' },
        { status: 409 }
      )
    }

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

    const { data, error } = await supabaseAdmin
      .from('users')
      .insert({
        app_id,
        user_identifier,
        name: name || null,
        email: email || null,
        phone: phone || null,
        status: status || 'active',
        notes: notes || null,
        created_by: createdBy
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: '회원 등록에 실패했습니다' },
      { status: 500 }
    )
  }
}
