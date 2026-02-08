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
    version: '',
    minimum_version: '',
    force_update: false,
    update_message: '',
    download_url: '',
    features: ''
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
      const features = formData.features
        .split('\n')
        .map(f => f.trim())
        .filter(f => f.length > 0)

      const response = await fetch(`/api/apps/${id}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          features
        })
      })

      if (response.ok) {
        setShowNewVersionForm(false)
        setFormData({
          version: '',
          minimum_version: '',
          force_update: false,
          update_message: '',
          download_url: '',
          features: ''
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
                    <Label htmlFor="version">버전 *</Label>
                    <Input
                      id="version"
                      required
                      placeholder="1.0.0"
                      value={formData.version}
                      onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="minimum_version">최소 버전 *</Label>
                    <Input
                      id="minimum_version"
                      required
                      placeholder="1.0.0"
                      value={formData.minimum_version}
                      onChange={(e) => setFormData({ ...formData, minimum_version: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="update_message">업데이트 메시지</Label>
                  <Input
                    id="update_message"
                    placeholder="새로운 기능이 추가되었습니다"
                    value={formData.update_message}
                    onChange={(e) => setFormData({ ...formData, update_message: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="download_url">다운로드 URL</Label>
                  <Input
                    id="download_url"
                    placeholder="https://play.google.com/store/apps/details?id=..."
                    value={formData.download_url}
                    onChange={(e) => setFormData({ ...formData, download_url: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="features">주요 기능 (한 줄에 하나씩)</Label>
                  <textarea
                    id="features"
                    className="w-full min-h-[100px] px-3 py-2 border rounded-md"
                    placeholder="버그 수정&#10;성능 개선&#10;새로운 기능 추가"
                    value={formData.features}
                    onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="force_update"
                    checked={formData.force_update}
                    onChange={(e) => setFormData({ ...formData, force_update: e.target.checked })}
                  />
                  <Label htmlFor="force_update">강제 업데이트</Label>
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
                    <TableHead>버전</TableHead>
                    <TableHead>최소 버전</TableHead>
                    <TableHead>강제 업데이트</TableHead>
                    <TableHead>출시일</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {versions.map((version) => (
                    <TableRow key={version.id}>
                      <TableCell className="font-mono font-semibold">{version.version}</TableCell>
                      <TableCell className="font-mono text-sm">{version.minimum_version}</TableCell>
                      <TableCell>
                        <Badge variant={version.force_update ? 'destructive' : 'secondary'}>
                          {version.force_update ? '필수' : '선택'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {version.release_date
                          ? new Date(version.release_date).toLocaleDateString('ko-KR')
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
