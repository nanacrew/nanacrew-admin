import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/subscriptions - Get all subscriptions with filtering
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const appId = searchParams.get('appId')
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const search = searchParams.get('search')

    let query = supabaseAdmin
      .from('subscriptions')
      .select(`
        *,
        apps(id, name, package_name),
        user_sessions(id, session_token, last_active, expires_at)
      `)
      .order('created_at', { ascending: false })

    if (appId && appId !== 'all') {
      query = query.eq('app_id', appId)
    }

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (type && type !== 'all') {
      query = query.eq('subscription_type', type)
    }

    if (search) {
      query = query.ilike('user_identifier', `%${search}%`)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Error fetching subscriptions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscriptions' },
      { status: 500 }
    )
  }
}

// POST /api/subscriptions - Create new subscription
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { app_id, user_identifier, subscription_type, end_date, notes } = body

    if (!app_id || !user_identifier || !subscription_type) {
      return NextResponse.json(
        { error: '필수 항목이 누락되었습니다' },
        { status: 400 }
      )
    }

    // 중복 확인
    const { data: existing } = await supabaseAdmin
      .from('subscriptions')
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
      const sessionData = JSON.parse(
        Buffer.from(sessionCookie.value, 'base64').toString('utf-8')
      )
      createdBy = sessionData.userId
    }

    const { data, error } = await supabaseAdmin
      .from('subscriptions')
      .insert({
        app_id,
        user_identifier,
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
  } catch (error) {
    console.error('Error creating subscription:', error)
    return NextResponse.json(
      { error: '구독 생성에 실패했습니다' },
      { status: 500 }
    )
  }
}
