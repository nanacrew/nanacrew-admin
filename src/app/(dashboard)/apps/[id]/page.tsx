'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import AppServicesSection from '@/components/AppServicesSection'
import AppAnalyticsSection from '@/components/AppAnalyticsSection'

type App = {
  id: string
  name: string
  package_name: string
  platform: ('android' | 'ios')[]
  icon_url?: string
  description?: string
}

type AppVersion = {
  id: string
  app_id: string
  version: string
  minimum_version: string
  force_update: boolean
  update_message?: string
  release_date: string
  download_url?: string
  features: string[]
}

export default function AppDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [app, setApp] = useState<App | null>(null)
  const [versions, setVersions] = useState<AppVersion[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewVersionForm, setShowNewVersionForm] = useState(false)
  const [formData, setFormData] = useState({
    update_version: '',
    update_message: '',
    download_url: ''
  })

  useEffect(() => {
    fetchApp()
    fetchVersions()
  }, [id])

  const fetchApp = async () => {
    try {
      const response = await fetch(`/api/apps`)
      if (response.ok) {
        const apps = await response.json()
        const foundApp = apps.find((a: App) => a.id === id)
        setApp(foundApp || null)
      }
    } catch (error) {
      console.error('Failed to fetch app:', error)
    }
  }

  const fetchVersions = async () => {
    try {
      const response = await fetch(`/api/apps/${id}/versions`)
      if (response.ok) {
        const data = await response.json()
        setVersions(data)
      }
    } catch (error) {
      console.error('Failed to fetch versions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      // 현재 버전 (최신 버전)
      const currentVersion = versions.length > 0 ? versions[0].version : '0.0.0'

      // 기본값 설정
      const updateMessage = formData.update_message.trim() || '새로운 버전이 출시되었습니다. 업데이트를 진행해주세요.'
      const downloadUrl = formData.download_url.trim() || (
        app?.package_name
          ? `https://play.google.com/store/apps/details?id=${app.package_name}`
          : ''
      )

      const response = await fetch(`/api/apps/${id}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          version: formData.update_version,
          minimum_version: currentVersion,
          force_update: true, // 항상 강제 업데이트
          update_message: updateMessage,
          download_url: downloadUrl,
          features: []
        })
      })

      if (response.ok) {
        setShowNewVersionForm(false)
        setFormData({
          update_version: '',
          update_message: '',
          download_url: ''
        })
        fetchVersions()
      }
    } catch (error) {
      console.error('Failed to create version:', error)
    }
  }

  const handleDeleteApp = async () => {
    if (!app) return

    if (!confirm(`"${app.name}" 앱을 삭제하시겠습니까?\n\n⚠️ 이 작업은 되돌릴 수 없으며, 연관된 버전, 서비스, 분석 데이터가 모두 삭제됩니다.`)) {
      return
    }

    try {
      const response = await fetch(`/api/apps/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        router.push('/') // 삭제 후 메인 페이지로 이동
      } else {
        alert('앱 삭제에 실패했습니다.')
      }
    } catch (error) {
      console.error('Failed to delete app:', error)
      alert('앱 삭제 중 오류가 발생했습니다.')
    }
  }

  if (loading || !app) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <div className="flex justify-between items-start mb-4">
          <Link href="/">
            <Button variant="ghost">← 목록으로</Button>
          </Link>
          <Button
            variant="destructive"
            onClick={handleDeleteApp}
          >
            앱 삭제
          </Button>
        </div>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold">{app.name}</h1>
          <div className="flex gap-2">
            {app.platform.map((p) => (
              <Badge
                key={p}
                variant={p === 'android' ? 'default' : 'secondary'}
              >
                {p === 'android' ? 'Android' : 'iOS'}
              </Badge>
            ))}
          </div>
        </div>
        <p className="text-muted-foreground font-mono text-sm">{app.package_name}</p>
        {app.description && (
          <p className="text-muted-foreground mt-2">{app.description}</p>
        )}
      </div>

      <div className="space-y-6">
        <AppAnalyticsSection appId={id} />

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>버전 목록</CardTitle>
                <CardDescription>등록된 버전 {versions.length}개</CardDescription>
              </div>
              <Button onClick={() => setShowNewVersionForm(!showNewVersionForm)}>
                {showNewVersionForm ? '취소' : '+ 새 버전 등록'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {showNewVersionForm && (
              <form onSubmit={handleSubmit} className="mb-6 p-4 border rounded-lg space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>현재 버전</Label>
                    <Input
                      disabled
                      value={versions.length > 0 ? versions[0].version : '등록된 버전 없음'}
                      className="bg-gray-100"
                    />
                    <p className="text-xs text-muted-foreground">
                      이 버전 이하는 업데이트 필요 (자동 설정)
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="update_version">업데이트 버전 *</Label>
                    <Input
                      id="update_version"
                      required
                      placeholder="1.0.1"
                      value={formData.update_version}
                      onChange={(e) => setFormData({ ...formData, update_version: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">
                      새로 출시된 버전
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="update_message">업데이트 메시지 (선택)</Label>
                  <Input
                    id="update_message"
                    placeholder="비워두면 기본 메시지 사용"
                    value={formData.update_message}
                    onChange={(e) => setFormData({ ...formData, update_message: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    기본: "새로운 버전이 출시되었습니다. 업데이트를 진행해주세요."
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="download_url">다운로드 URL (선택)</Label>
                  <Input
                    id="download_url"
                    placeholder="https://..."
                    value={formData.download_url}
                    onChange={(e) => setFormData({ ...formData, download_url: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    비워두면 Play Store 링크 자동 생성: {app?.package_name && `https://play.google.com/store/apps/details?id=${app.package_name}`}
                  </p>
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                  <p className="text-sm text-amber-800">
                    ⚠️ 항상 <strong>강제 업데이트</strong>로 등록됩니다
                  </p>
                </div>

                <Button type="submit" className="w-full">등록하기</Button>
              </form>
            )}

            {versions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                등록된 버전이 없습니다. 첫 번째 버전을 등록하세요.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>업데이트 버전</TableHead>
                    <TableHead>현재 버전</TableHead>
                    <TableHead>강제 업데이트</TableHead>
                    <TableHead>출시 일시</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {versions.map((version) => (
                    <TableRow key={version.id}>
                      <TableCell className="font-mono font-semibold text-blue-600">
                        {version.version}
                      </TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {version.minimum_version} 이하
                      </TableCell>
                      <TableCell>
                        <Badge variant="destructive">필수</Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {version.release_date
                          ? new Date(version.release_date).toLocaleString('ko-KR', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: false
                            })
                          : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <AppServicesSection appId={id} />

        <Card>
          <CardHeader>
            <CardTitle>API 정보</CardTitle>
            <CardDescription>앱에서 사용할 버전 체크 API 엔드포인트</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-zinc-50 dark:bg-zinc-900 p-4 rounded-lg font-mono text-sm">
              <div className="mb-2 text-zinc-500">GET</div>
              <div className="break-all">
                /api/version-check?packageName={app.package_name}&currentVersion=1.0.0&platform={app.platform}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
