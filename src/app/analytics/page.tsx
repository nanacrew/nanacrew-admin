'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

type App = {
  id: string
  name: string
  package_name: string
  platform: ('android' | 'ios')[]
}

type AppAnalytics = {
  appId: string
  appName: string
  todayUsers: number
  yesterdayUsers: number
  totalUsers: number
  weekData: { date: string; count: number }[]
  versionDistribution: { version: string; count: number }[]
  platform: ('android' | 'ios')[]
}

export default function AnalyticsPage() {
  const [apps, setApps] = useState<App[]>([])
  const [analytics, setAnalytics] = useState<AppAnalytics[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('week')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // 앱 목록 가져오기
      const appsResponse = await fetch('/api/apps')
      if (!appsResponse.ok) throw new Error('Failed to fetch apps')
      const appsData: App[] = await appsResponse.json()
      setApps(appsData)

      // 각 앱의 통계 가져오기
      const analyticsPromises = appsData.map(async (app) => {
        try {
          const response = await fetch(`/api/apps/${app.id}/analytics`)
          if (response.ok) {
            const data = await response.json()
            return {
              appId: app.id,
              appName: app.name,
              platform: app.platform,
              ...data
            }
          }
        } catch (error) {
          console.error(`Failed to fetch analytics for ${app.name}:`, error)
        }
        return {
          appId: app.id,
          appName: app.name,
          platform: app.platform,
          todayUsers: 0,
          yesterdayUsers: 0,
          totalUsers: 0,
          weekData: [],
          versionDistribution: []
        }
      })

      const analyticsData = await Promise.all(analyticsPromises)
      setAnalytics(analyticsData)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTotalStats = () => {
    return {
      totalApps: apps.length,
      todayUsers: analytics.reduce((sum, a) => sum + a.todayUsers, 0),
      yesterdayUsers: analytics.reduce((sum, a) => sum + a.yesterdayUsers, 0),
      totalUsers: analytics.reduce((sum, a) => sum + a.totalUsers, 0)
    }
  }

  const getChangePercent = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0
    return Math.round(((current - previous) / previous) * 100)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">로딩 중...</div>
      </div>
    )
  }

  const totalStats = getTotalStats()
  const changePercent = getChangePercent(totalStats.todayUsers, totalStats.yesterdayUsers)

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">통합 통계</h1>
        <p className="text-muted-foreground">전체 앱의 통계를 한눈에 확인하세요</p>
      </div>

      {/* 기간 선택 */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={selectedPeriod === 'today' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedPeriod('today')}
        >
          오늘
        </Button>
        <Button
          variant={selectedPeriod === 'week' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedPeriod('week')}
        >
          최근 7일
        </Button>
        <Button
          variant={selectedPeriod === 'month' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedPeriod('month')}
        >
          최근 30일
        </Button>
      </div>

      {/* 전체 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>전체 앱</CardDescription>
            <CardTitle className="text-3xl">{totalStats.totalApps}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">등록된 앱 수</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>오늘 접속자</CardDescription>
            <CardTitle className="text-3xl text-blue-600">
              {totalStats.todayUsers.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {changePercent > 0 ? (
                <span className="text-sm text-green-600">▲ {changePercent}%</span>
              ) : changePercent < 0 ? (
                <span className="text-sm text-red-600">▼ {Math.abs(changePercent)}%</span>
              ) : (
                <span className="text-sm text-gray-600">- 0%</span>
              )}
              <span className="text-sm text-muted-foreground">어제 대비</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>어제 접속자</CardDescription>
            <CardTitle className="text-3xl text-purple-600">
              {totalStats.yesterdayUsers.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">전일 기준</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>누적 접속</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {totalStats.totalUsers.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">전체 기간</p>
          </CardContent>
        </Card>
      </div>

      {/* 앱별 상세 통계 */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">앱별 상세 통계</h2>

        {analytics.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">등록된 앱이 없습니다.</p>
              <Link href="/apps/new">
                <Button>첫 번째 앱 등록하기</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {analytics.map((app) => {
              const appChangePercent = getChangePercent(app.todayUsers, app.yesterdayUsers)
              return (
                <Card key={app.appId}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{app.appName}</CardTitle>
                        <div className="flex gap-2 mt-2">
                          {app.platform.map((p) => (
                            <Badge
                              key={p}
                              variant={p === 'android' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {p === 'android' ? 'Android' : 'iOS'}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Link href={`/apps/${app.appId}`}>
                        <Button variant="outline" size="sm">상세보기</Button>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* 접속자 통계 */}
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">오늘</p>
                          <p className="text-2xl font-bold text-blue-600">
                            {(app.todayUsers || 0).toLocaleString()}
                          </p>
                          {appChangePercent !== 0 && (
                            <p className={`text-xs ${appChangePercent > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {appChangePercent > 0 ? '▲' : '▼'} {Math.abs(appChangePercent)}%
                            </p>
                          )}
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">어제</p>
                          <p className="text-2xl font-bold text-purple-600">
                            {(app.yesterdayUsers || 0).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">누적</p>
                          <p className="text-2xl font-bold text-green-600">
                            {(app.totalUsers || 0).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {/* 7일간 추이 */}
                      {app.weekData.length > 0 && (
                        <div>
                          <p className="text-sm font-semibold mb-2">7일간 추이</p>
                          <div className="flex items-end gap-1 h-20">
                            {app.weekData.map((day, index) => {
                              const maxCount = Math.max(...app.weekData.map(d => d.count))
                              const height = maxCount > 0 ? (day.count / maxCount) * 100 : 0
                              return (
                                <div
                                  key={index}
                                  className="flex-1 bg-blue-500 rounded-t hover:bg-blue-600 transition-colors relative group"
                                  style={{ height: `${height}%` }}
                                >
                                  <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">
                                    {new Date(day.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                                    <br />
                                    {day.count}명
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {/* 버전 분포 */}
                      {app.versionDistribution.length > 0 && (
                        <div>
                          <p className="text-sm font-semibold mb-2">버전 분포</p>
                          <div className="space-y-2">
                            {app.versionDistribution.slice(0, 3).map((version, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <span className="text-sm font-mono w-16">{version.version}</span>
                                <div className="flex-1 bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-blue-500 h-2 rounded-full"
                                    style={{
                                      width: `${(version.count / app.totalUsers) * 100}%`
                                    }}
                                  />
                                </div>
                                <span className="text-sm text-muted-foreground w-12 text-right">
                                  {version.count}명
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* 통계 정보 */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>통계 정보</CardTitle>
          <CardDescription>데이터 수집 및 업데이트 안내</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
            <li>통계는 앱에서 <code className="bg-gray-100 px-1 rounded">/api/analytics/track</code> API를 호출할 때마다 수집됩니다</li>
            <li>하루 1회 호출을 권장하며, 동일 사용자의 중복 호출은 자동으로 처리됩니다</li>
            <li>데이터는 실시간으로 업데이트되며, 이 페이지를 새로고침하면 최신 데이터를 확인할 수 있습니다</li>
            <li>7일 차트는 최근 7일간의 일별 접속자 수를 보여줍니다</li>
            <li>버전 분포는 현재 사용 중인 앱 버전별 사용자 수를 나타냅니다</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
