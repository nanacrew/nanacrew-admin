import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const level = searchParams.get('level') // info, warning, error, success, all
    const category = searchParams.get('category') // api, database, auth, system, all
    const appId = searchParams.get('appId')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '100')

    let query = supabase
      .from('api_logs')
      .select('*, apps(id, name, package_name)')
      .order('timestamp', { ascending: false })
      .limit(limit)

    // 레벨 필터
    if (level && level !== 'all') {
      query = query.eq('level', level)
    }

    // 카테고리 필터
    if (category && category !== 'all') {
      query = query.eq('category', category)
    }

    // 앱별 필터
    if (appId) {
      query = query.eq('app_id', appId)
    }

    // 검색어 필터
    if (search) {
      query = query.ilike('message', `%${search}%`)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Error fetching logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch logs' },
      { status: 500 }
    )
  }
}

// DELETE - 오래된 로그 수동 삭제
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const days = parseInt(searchParams.get('days') || '30')

    const { error } = await supabase
      .from('api_logs')
      .delete()
      .lt('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())

    if (error) throw error

    return NextResponse.json({ success: true, message: `Logs older than ${days} days deleted` })
  } catch (error) {
    console.error('Error deleting logs:', error)
    return NextResponse.json(
      { error: 'Failed to delete logs' },
      { status: 500 }
    )
  }
}
