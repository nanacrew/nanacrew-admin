'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type LogLevel = 'info' | 'warning' | 'error' | 'success'
type LogCategory = 'api' | 'database' | 'auth' | 'system'

type LogEntry = {
  id: string
  timestamp: string
  level: LogLevel
  category: LogCategory
  message: string
  details?: string
  ip_address?: string
  user_agent?: string
  app_id?: string
  apps?: {
    id: string
    name: string
    package_name: string
  }
}

const levelColors: Record<LogLevel, string> = {
  info: 'bg-blue-100 text-blue-700 border-blue-300',
  warning: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  error: 'bg-red-100 text-red-700 border-red-300',
  success: 'bg-green-100 text-green-700 border-green-300'
}

const categoryLabels: Record<LogCategory, string> = {
  api: 'API',
  database: 'Database',
  auth: 'Auth',
  system: 'System'
}

type App = {
  id: string
  name: string
  package_name: string
}

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [apps, setApps] = useState<App[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLevel, setSelectedLevel] = useState<LogLevel | 'all'>('all')
  const [selectedCategory, setSelectedCategory] = useState<LogCategory | 'all'>('all')
  const [selectedAppId, setSelectedAppId] = useState<string | 'all' | 'admin'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedLog, setExpandedLog] = useState<string | null>(null)

  useEffect(() => {
    fetchApps()
    fetchLogs()
  }, [selectedLevel, selectedCategory, selectedAppId, searchQuery])

  const fetchApps = async () => {
    try {
      const response = await fetch('/api/apps')
      if (response.ok) {
        const data = await response.json()
        setApps(data)
      }
    } catch (error) {
      console.error('Failed to fetch apps:', error)
    }
  }

  const fetchLogs = async () => {
    try {
      const params = new URLSearchParams()
      if (selectedLevel !== 'all') params.append('level', selectedLevel)
      if (selectedCategory !== 'all') params.append('category', selectedCategory)
      if (selectedAppId !== 'all') {
        if (selectedAppId === 'admin') {
          params.append('appId', 'null')
        } else {
          params.append('appId', selectedAppId)
        }
      }
      if (searchQuery) params.append('search', searchQuery)

      const response = await fetch(`/api/logs?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setLogs(data)
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const getLogLevelCount = (level: LogLevel) => {
    return logs.filter(l => l.level === level).length
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const getRelativeTime = (timestamp: string) => {
    const now = Date.now()
    const then = new Date(timestamp).getTime()
    const diff = Math.floor((now - then) / 1000)

    if (diff < 60) return `${diff}초 전`
    if (diff < 3600) return `${Math.floor(diff / 60)}분 전`
    if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`
    return `${Math.floor(diff / 86400)}일 전`
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
        <h1 className="text-3xl font-bold mb-2">시스템 로그</h1>
        <p className="text-muted-foreground">API 호출, 에러, 시스템 이벤트를 추적합니다</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>전체 로그</CardDescription>
            <CardTitle className="text-2xl">{logs.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>에러</CardDescription>
            <CardTitle className="text-2xl text-red-600">
              {getLogLevelCount('error')}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>경고</CardDescription>
            <CardTitle className="text-2xl text-yellow-600">
              {getLogLevelCount('warning')}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>정보</CardDescription>
            <CardTitle className="text-2xl text-blue-600">
              {getLogLevelCount('info')}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* 필터 및 검색 */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            {/* 검색 */}
            <div className="flex-1">
              <Input
                placeholder="로그 메시지 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* 레벨 필터 */}
            <div>
              <p className="text-sm font-medium mb-2">로그 레벨</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedLevel === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedLevel('all')}
                >
                  전체
                </Button>
                <Button
                  variant={selectedLevel === 'error' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedLevel('error')}
                >
                  에러
                </Button>
                <Button
                  variant={selectedLevel === 'warning' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedLevel('warning')}
                >
                  경고
                </Button>
                <Button
                  variant={selectedLevel === 'info' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedLevel('info')}
                >
                  정보
                </Button>
                <Button
                  variant={selectedLevel === 'success' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedLevel('success')}
                >
                  성공
                </Button>
              </div>
            </div>

            {/* 카테고리 필터 */}
            <div>
              <p className="text-sm font-medium mb-2">호출 위치</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedCategory === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory('all')}
                >
                  전체
                </Button>
                {Object.entries(categoryLabels).map(([key, label]) => (
                  <Button
                    key={key}
                    variant={selectedCategory === key ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(key as LogCategory)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            {/* 앱별 필터 */}
            <div>
              <p className="text-sm font-medium mb-2">앱별 필터</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedAppId === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedAppId('all')}
                >
                  전체
                </Button>
                <Button
                  variant={selectedAppId === 'admin' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedAppId('admin')}
                >
                  어드민
                </Button>
                {apps.map((app) => (
                  <Button
                    key={app.id}
                    variant={selectedAppId === app.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedAppId(app.id)}
                  >
                    {app.name}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 로그 목록 */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>로그 목록</CardTitle>
              <CardDescription>최근 100개의 로그 (필터 적용됨)</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchLogs}>
              새로고침
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              조건에 맞는 로그가 없습니다
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                >
                  <div className="flex items-start gap-3">
                    <Badge className={levelColors[log.level]}>
                      {log.level.toUpperCase()}
                    </Badge>
                    <Badge variant="outline">
                      {categoryLabels[log.category]}
                    </Badge>
                    {log.apps && (
                      <Link href={`/apps/${log.apps.id}`} onClick={(e) => e.stopPropagation()}>
                        <Badge variant="secondary" className="hover:bg-gray-300">
                          {log.apps.name}
                        </Badge>
                      </Link>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{log.message}</p>
                      {expandedLog === log.id && log.details && (
                        <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono overflow-x-auto whitespace-pre-wrap">
                          {log.details}
                        </div>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-muted-foreground">
                        {getRelativeTime(log.timestamp)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatTimestamp(log.timestamp)}
                      </p>
                    </div>
                  </div>
                  {expandedLog === log.id && (
                    <div className="mt-3 pt-3 border-t text-xs text-muted-foreground space-y-1">
                      {log.ip_address && <div>IP: {log.ip_address}</div>}
                      {log.user_agent && <div>User Agent: {log.user_agent}</div>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 로그 정보 */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>로그 시스템 정보</CardTitle>
          <CardDescription>로그 수집 및 보관 정책</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
            <li>모든 API 요청, 데이터베이스 쿼리, 시스템 이벤트가 자동으로 기록됩니다</li>
            <li>로그는 최대 30일간 보관되며, 이후 자동으로 삭제됩니다</li>
            <li>에러 로그는 즉시 알림이 전송되며, 우선적으로 처리됩니다</li>
            <li>민감한 정보(비밀번호, API 키 등)는 로그에 기록되지 않습니다</li>
            <li>최근 100개의 로그만 표시됩니다 (필터 적용 가능)</li>
            <li>앱별로 필터링하여 특정 앱의 로그만 확인할 수 있습니다</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
