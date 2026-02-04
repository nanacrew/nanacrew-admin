import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'

// POST /api/analytics/track - Track app usage
export async function POST(request: NextRequest) {
  const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
  const userAgent = request.headers.get('user-agent') || 'unknown'

  try {
    const body = await request.json()
    const { packageName, platform, version } = body

    if (!packageName || !platform) {
      await logger.error('Analytics track - Missing parameters', {
        category: 'api',
        details: `packageName: ${packageName}, platform: ${platform}`,
        ipAddress,
        userAgent
      })
      return NextResponse.json(
        { error: 'Missing required fields: packageName, platform' },
        { status: 400 }
      )
    }

    // Find app by package name and platform
    const { data: app, error: appError } = await supabase
      .from('apps')
      .select('id')
      .eq('package_name', packageName)
      .contains('platform', [platform])
      .single()

    if (appError || !app) {
      await logger.warning('Analytics track - App not found', {
        category: 'api',
        details: `packageName: ${packageName}, platform: ${platform}`,
        ipAddress,
        userAgent
      })
      return NextResponse.json(
        { error: 'App not found' },
        { status: 404 }
      )
    }

    const today = new Date().toISOString().split('T')[0]

    // 오늘 날짜의 통계가 있는지 확인
    const { data: existingAnalytics } = await supabase
      .from('app_analytics')
      .select('*')
      .eq('app_id', app.id)
      .eq('date', today)
      .single()

    if (existingAnalytics) {
      // 기존 통계 업데이트
      const newActiveUsers = existingAnalytics.active_users + 1
      const versionDist = existingAnalytics.version_distribution || {}

      // 버전별 사용자 수 업데이트
      if (version) {
        versionDist[version] = (versionDist[version] || 0) + 1
      }

      const { error: updateError } = await supabase
        .from('app_analytics')
        .update({
          active_users: newActiveUsers,
          version_distribution: versionDist
        })
        .eq('id', existingAnalytics.id)

      if (updateError) throw updateError
    } else {
      // 새로운 통계 생성
      const versionDist: Record<string, number> = {}
      if (version) {
        versionDist[version] = 1
      }

      const { error: insertError } = await supabase
        .from('app_analytics')
        .insert({
          app_id: app.id,
          date: today,
          active_users: 1,
          version_distribution: versionDist
        })

      if (insertError) throw insertError
    }

    // 성공 로그 기록
    await logger.success('Analytics tracked successfully', {
      category: 'api',
      appId: app.id,
      details: JSON.stringify({ packageName, platform, version }),
      ipAddress,
      userAgent
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    await logger.error('Analytics track - Internal error', {
      category: 'api',
      details: error instanceof Error ? error.message : String(error),
      ipAddress,
      userAgent
    })
    console.error('Error tracking analytics:', error)
    return NextResponse.json(
      { error: 'Failed to track analytics' },
      { status: 500 }
    )
  }
}
