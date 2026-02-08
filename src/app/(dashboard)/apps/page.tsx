'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

type App = {
  id: string
  name: string
  package_name: string
  platform: ('android' | 'ios')[]
  icon_url?: string
  description?: string
  created_at: string
  updated_at: string
  todayUsers?: number
}

export default function Home() {
  const [apps, setApps] = useState<App[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchApps()
  }, [])

  const fetchApps = async () => {
    try {
      const response = await fetch('/api/apps')
      if (response.ok) {
        const data: App[] = await response.json()

        // 각 앱의 오늘 통계 가져오기
        const appsWithStats = await Promise.all(
          data.map(async (app) => {
            try {
              const analyticsResponse = await fetch(`/api/apps/${app.id}/analytics`)
              if (analyticsResponse.ok) {
                const analytics = await analyticsResponse.json()
                return { ...app, todayUsers: analytics.today || 0 }
              }
            } catch (error) {
              console.error(`Failed to fetch analytics for ${app.name}:`, error)
            }
            return { ...app, todayUsers: 0 }
          })
        )

        setApps(appsWithStats)
      }
    } catch (error) {
      console.error('Failed to fetch apps:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (appId: string, appName: string) => {
    if (!confirm(`"${appName}" 앱을 삭제하시겠습니까?\n\n⚠️ 이 작업은 되돌릴 수 없으며, 연관된 버전, 서비스, 분석 데이터가 모두 삭제됩니다.`)) {
      return
    }

    try {
      const response = await fetch(`/api/apps/${appId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchApps() // 목록 새로고침
      } else {
        alert('앱 삭제에 실패했습니다.')
      }
    } catch (error) {
      console.error('Failed to delete app:', error)
      alert('앱 삭제 중 오류가 발생했습니다.')
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
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">NanaCrew Admin</h1>
          <p className="text-muted-foreground">앱 버전 관리 시스템</p>
        </div>
        <Link href="/apps/new">
          <Button>+ 새 앱 등록</Button>
        </Link>
      </div>

      {apps.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">등록된 앱이 없습니다.</p>
            <Link href="/apps/new">
              <Button>첫 번째 앱 등록하기</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>등록된 앱 목록</CardTitle>
            <CardDescription>총 {apps.length}개의 앱이 등록되어 있습니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>앱 이름</TableHead>
                  <TableHead>패키지명</TableHead>
                  <TableHead>플랫폼</TableHead>
                  <TableHead className="text-center">오늘 접속</TableHead>
                  <TableHead>등록일</TableHead>
                  <TableHead className="text-right">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apps.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell className="font-medium">{app.name}</TableCell>
                    <TableCell className="font-mono text-sm">{app.package_name}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
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
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-semibold text-blue-600">
                        {app.todayUsers?.toLocaleString() || '0'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {app.created_at
                        ? new Date(app.created_at).toLocaleDateString('ko-KR')
                        : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Link href={`/apps/${app.id}`}>
                          <Button variant="outline" size="sm">관리</Button>
                        </Link>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(app.id, app.name)}
                        >
                          삭제
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
