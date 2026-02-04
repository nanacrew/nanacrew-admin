'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

type App = {
  id: string
  name: string
  package_name: string
  platform: ('android' | 'ios')[]
  created_at: string
  todayUsers?: number
  totalUsers?: number
}

export default function DashboardPage() {
  const [apps, setApps] = useState<App[]>([])
  const [stats, setStats] = useState({
    totalApps: 0,
    todayUsers: 0,
    totalUsers: 0,
    activeVersions: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // 앱 목록 가져오기
      const appsResponse = await fetch('/api/apps')
      if (!appsResponse.ok) throw new Error('Failed to fetch apps')

      const appsData: App[] = await appsResponse.json()

      // 각 앱의 통계 가져오기
      const appsWithStats = await Promise.all(
        appsData.map(async (app) => {
          try {
            const analyticsResponse = await fetch(`/api/apps/${app.id}/analytics`)
            if (analyticsResponse.ok) {
              const analytics = await analyticsResponse.json()
              return {
                ...app,
                todayUsers: analytics.today || 0,
                totalUsers: analytics.total || 0
              }
            }
          } catch (error) {
            console.error(`Failed to fetch analytics for ${app.name}:`, error)
          }
          return { ...app, todayUsers: 0, totalUsers: 0 }
        })
      )

      setApps(appsWithStats)

      // 전체 통계 계산
      const totalTodayUsers = appsWithStats.reduce((sum, app) => sum + (app.todayUsers || 0), 0)
      const totalAllUsers = appsWithStats.reduce((sum, app) => sum + (app.totalUsers || 0), 0)

      setStats({
        totalApps: appsData.length,
        todayUsers: totalTodayUsers,
        totalUsers: totalAllUsers,
        activeVersions: appsData.length * 2 // 임시 값
      })
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">대시보드</h1>
        <p className="text-muted-foreground">전체 앱 및 사용자 통계 요약</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>전체 앱</CardDescription>
            <CardTitle className="text-3xl">{stats.totalApps}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">등록된 앱 수</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>오늘 접속자</CardDescription>
            <CardTitle className="text-3xl text-blue-600">{stats.todayUsers.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">모든 앱 합계</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>누적 접속</CardDescription>
            <CardTitle className="text-3xl text-green-600">{stats.totalUsers.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">전체 기간</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>활성 버전</CardDescription>
            <CardTitle className="text-3xl text-purple-600">{stats.activeVersions}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">최신 버전 수</p>
          </CardContent>
        </Card>
      </div>

      {/* 앱 목록 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>최근 등록 앱</CardTitle>
                <CardDescription>최근에 등록된 앱 목록</CardDescription>
              </div>
              <Link href="/apps">
                <Button variant="outline" size="sm">전체 보기</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {apps.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                등록된 앱이 없습니다
              </div>
            ) : (
              <div className="space-y-4">
                {apps.slice(0, 5).map((app) => (
                  <Link
                    key={app.id}
                    href={`/apps/${app.id}`}
                    className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold">{app.name}</h3>
                      <span className="text-sm text-blue-600 font-medium">
                        {app.todayUsers?.toLocaleString() || 0} 명
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground font-mono">{app.package_name}</p>
                    <div className="flex gap-2 mt-2">
                      {app.platform.map((p) => (
                        <span
                          key={p}
                          className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600"
                        >
                          {p === 'android' ? 'Android' : 'iOS'}
                        </span>
                      ))}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>빠른 작업</CardTitle>
            <CardDescription>자주 사용하는 기능</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Link href="/apps/new">
                <Button className="w-full justify-start" variant="outline">
                  <span className="mr-2">📱</span> 새 앱 등록
                </Button>
              </Link>
              <Link href="/analytics">
                <Button className="w-full justify-start" variant="outline">
                  <span className="mr-2">📈</span> 통계 보기
                </Button>
              </Link>
              <Link href="/docs">
                <Button className="w-full justify-start" variant="outline">
                  <span className="mr-2">📚</span> API 문서
                </Button>
              </Link>
              <Link href="/settings">
                <Button className="w-full justify-start" variant="outline">
                  <span className="mr-2">⚙️</span> 설정
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
