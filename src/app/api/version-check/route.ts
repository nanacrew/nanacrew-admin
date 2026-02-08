import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const packageName = searchParams.get('packageName')
  const currentVersion = searchParams.get('currentVersion')
  const platform = searchParams.get('platform')
  const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
  const userAgent = request.headers.get('user-agent') || 'unknown'

  if (!packageName || !currentVersion || !platform) {
    await logger.error('Version check - Missing parameters', {
      category: 'api',
      details: `packageName: ${packageName}, currentVersion: ${currentVersion}, platform: ${platform}`,
      ipAddress,
      userAgent
    })
    return NextResponse.json(
      { error: 'Missing required parameters: packageName, currentVersion, platform' },
      { status: 400 }
    )
  }

  try {
    // Find app by package name and platform (platform is now an array)
    const { data: app, error: appError } = await supabase
      .from('apps')
      .select('id, platform')
      .eq('package_name', packageName)
      .contains('platform', [platform]) // 배열에 해당 플랫폼이 포함되어 있는지 확인
      .single()

    if (appError || !app) {
      await logger.warning('Version check - App not found', {
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

    // Get latest version
    const { data: latestVersion, error: versionError } = await supabase
      .from('app_versions')
      .select('*')
      .eq('app_id', app.id)
      .order('release_date', { ascending: false })
      .limit(1)
      .single()

    if (versionError || !latestVersion) {
      await logger.warning('Version check - No versions found', {
        category: 'api',
        appId: app.id,
        details: `packageName: ${packageName}`,
        ipAddress,
        userAgent
      })
      return NextResponse.json(
        { error: 'No versions found for this app' },
        { status: 404 }
      )
    }

    // Compare versions
    const needsUpdate = compareVersions(currentVersion, latestVersion.version) < 0
    const forceUpdate = compareVersions(currentVersion, latestVersion.minimum_version) <= 0

    // 로그 기록
    await logger.info('Version check successful', {
      category: 'api',
      appId: app.id,
      details: JSON.stringify({
        packageName,
        currentVersion,
        latestVersion: latestVersion.version,
        platform,
        needsUpdate,
        forceUpdate
      }),
      ipAddress,
      userAgent
    })

    return NextResponse.json({
      latest_version: latestVersion.version,
      minimum_version: latestVersion.minimum_version,
      needs_update: needsUpdate,
      force_update: forceUpdate,
      update_message: latestVersion.update_message,
      download_url: latestVersion.download_url,
      features: latestVersion.features,
      release_date: latestVersion.release_date
    })
  } catch (error) {
    await logger.error('Version check - Internal error', {
      category: 'api',
      details: error instanceof Error ? error.message : String(error),
      ipAddress,
      userAgent
    })
    console.error('Version check error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Version comparison helper (semver-like)
function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number)
  const parts2 = v2.split('.').map(Number)

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = parts1[i] || 0
    const part2 = parts2[i] || 0

    if (part1 < part2) return -1
    if (part1 > part2) return 1
  }

  return 0
}
