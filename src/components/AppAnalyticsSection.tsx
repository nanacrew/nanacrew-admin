'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type AnalyticsData = {
  today: number
  yesterday: number
  total: number
  week: Array<{ date: string; active_users: number; version_distribution?: Record<string, number> }>
  month: Array<{ date: string; active_users: number }>
}

export default function AppAnalyticsSection({ appId }: { appId: string }) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [appId])

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`/api/apps/${appId}/analytics`)
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="text-lg text-muted-foreground">통계 로딩 중...</div>
        </CardContent>
      </Card>
    )
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="text-lg text-muted-foreground">통계 데이터를 불러올 수 없습니다</div>
        </CardContent>
      </Card>
    )
  }

  const todayChange = analytics.yesterday > 0
    ? ((analytics.today - analytics.yesterday) / analytics.yesterday * 100).toFixed(1)
    : '0'
  const todayTrend = analytics.today >= analytics.yesterday ? '↑' : '↓'

  return (
    <Card>
      <CardHeader>
        <CardTitle>사용자 통계</CardTitle>
        <CardDescription>앱 사용자 통계 및 분석</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* 오늘 사용자 */}
          <div className="p-6 border rounded-lg bg-gradient-to-br from-blue-50 to-blue-100">
            <div className="text-sm text-blue-600 font-medium mb-2">오늘 접속자</div>
            <div className="text-3xl font-bold text-blue-900 mb-1">
              {analytics.today.toLocaleString()}
            </div>
            <div className={`text-sm ${analytics.today >= analytics.yesterday ? 'text-green-600' : 'text-red-600'}`}>
              {todayTrend} {Math.abs(Number(todayChange))}% vs 어제
            </div>
          </div>

          {/* 어제 사용자 */}
          <div className="p-6 border rounded-lg bg-gradient-to-br from-purple-50 to-purple-100">
            <div className="text-sm text-purple-600 font-medium mb-2">어제 접속자</div>
            <div className="text-3xl font-bold text-purple-900">
              {analytics.yesterday.toLocaleString()}
            </div>
          </div>

          {/* 누적 사용자 */}
          <div className="p-6 border rounded-lg bg-gradient-to-br from-green-50 to-green-100">
            <div className="text-sm text-green-600 font-medium mb-2">누적 접속</div>
            <div className="text-3xl font-bold text-green-900">
              {analytics.total.toLocaleString()}
            </div>
            <div className="text-sm text-green-600">전체 기간</div>
          </div>
        </div>

        {/* 최근 7일 차트 */}
        {analytics.week.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">최근 7일 접속자 추이</h3>
            <div className="h-64 flex items-end justify-between gap-2">
              {analytics.week.map((day, index) => {
                const maxUsers = Math.max(...analytics.week.map(d => d.active_users), 1)
                const height = (day.active_users / maxUsers) * 100

                return (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full bg-blue-500 rounded-t hover:bg-blue-600 transition-colors cursor-pointer relative group"
                      style={{ height: `${height}%`, minHeight: day.active_users > 0 ? '8px' : '2px' }}
                    >
                      <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {day.active_users.toLocaleString()}명
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      {day.date ? new Date(day.date).getDate() : '-'}일
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* 버전 분포 */}
        {analytics.week.length > 0 && analytics.week[analytics.week.length - 1].version_distribution && (
          <div>
            <h3 className="text-lg font-semibold mb-4">최근 버전 분포 (오늘 기준)</h3>
            <div className="space-y-2">
              {Object.entries(analytics.week[analytics.week.length - 1].version_distribution || {})
                .sort(([, a], [, b]) => b - a)
                .map(([version, count]) => {
                  const total = Object.values(analytics.week[analytics.week.length - 1].version_distribution || {})
                    .reduce((sum, val) => sum + val, 0)
                  const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : '0'

                  return (
                    <div key={version} className="flex items-center gap-3">
                      <div className="w-24 font-mono text-sm">{version}</div>
                      <div className="flex-1">
                        <div className="h-8 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center px-3"
                            style={{ width: `${percentage}%`, minWidth: '40px' }}
                          >
                            <span className="text-xs text-white font-medium">
                              {percentage}%
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="w-20 text-right text-sm text-gray-600">
                        {count}명
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        )}

        {analytics.week.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            아직 수집된 통계 데이터가 없습니다.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
