import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

type Params = {
  params: Promise<{
    id: string
  }>
}

// GET /api/apps/[id]/analytics - Get analytics for an app
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params

    // 오늘 날짜
    const today = new Date().toISOString().split('T')[0]

    // 오늘의 통계
    const { data: todayData } = await supabase
      .from('app_analytics')
      .select('active_users')
      .eq('app_id', id)
      .eq('date', today)
      .single()

    // 총 누적 사용자 수
    const { data: totalData } = await supabase
      .from('app_analytics')
      .select('active_users')
      .eq('app_id', id)
      .order('date', { ascending: false })

    // 최근 7일 통계
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const { data: weekData } = await supabase
      .from('app_analytics')
      .select('date, active_users, version_distribution')
      .eq('app_id', id)
      .gte('date', sevenDaysAgo.toISOString().split('T')[0])
      .order('date', { ascending: true })

    // 최근 30일 통계
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const { data: monthData } = await supabase
      .from('app_analytics')
      .select('date, active_users')
      .eq('app_id', id)
      .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
      .order('date', { ascending: true })

    // 누적 사용자 계산 (중복 제거는 클라이언트에서 처리)
    const totalUsers = totalData?.reduce((sum, record) => sum + (record.active_users || 0), 0) || 0
    const todayUsers = todayData?.active_users || 0

    // 어제 사용자 수
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const { data: yesterdayData } = await supabase
      .from('app_analytics')
      .select('active_users')
      .eq('app_id', id)
      .eq('date', yesterday.toISOString().split('T')[0])
      .single()

    const yesterdayUsers = yesterdayData?.active_users || 0

    // 버전 분포 데이터 추출 (최신 날짜 기준)
    const latestVersionData = weekData && weekData.length > 0
      ? weekData[weekData.length - 1].version_distribution
      : null

    let versionDistribution: { version: string; count: number }[] = []
    if (latestVersionData && typeof latestVersionData === 'object') {
      versionDistribution = Object.entries(latestVersionData)
        .map(([version, count]) => ({ version, count: count as number }))
        .sort((a, b) => b.count - a.count)
    }

    return NextResponse.json({
      todayUsers,
      yesterdayUsers,
      totalUsers,
      weekData: weekData?.map(d => ({ date: d.date, count: d.active_users || 0 })) || [],
      monthData: monthData?.map(d => ({ date: d.date, count: d.active_users || 0 })) || [],
      versionDistribution
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}
