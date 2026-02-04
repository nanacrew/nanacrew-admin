'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function NewAppPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    package_name: '',
    platform: [] as ('android' | 'ios')[],
    icon_url: '',
    description: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const togglePlatform = (platform: 'android' | 'ios') => {
    setFormData(prev => ({
      ...prev,
      platform: prev.platform.includes(platform)
        ? prev.platform.filter(p => p !== platform)
        : [...prev.platform, platform]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/apps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '앱 등록에 실패했습니다')
      }

      const app = await response.json()
      router.push(`/apps/${app.id}`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <div className="mb-8">
        <Link href="/">
          <Button variant="ghost" className="mb-4">← 돌아가기</Button>
        </Link>
        <h1 className="text-3xl font-bold mb-2">새 앱 등록</h1>
        <p className="text-muted-foreground">버전 관리를 시작할 앱을 등록하세요</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>앱 정보</CardTitle>
          <CardDescription>앱의 기본 정보를 입력하세요</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">앱 이름 *</Label>
              <Input
                id="name"
                required
                placeholder="예: 에어노트"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="package_name">패키지명 *</Label>
              <Input
                id="package_name"
                required
                placeholder="예: com.nanacrew.airnote"
                value={formData.package_name}
                onChange={(e) => setFormData({ ...formData, package_name: e.target.value })}
              />
              <p className="text-sm text-muted-foreground">
                고유한 패키지명을 입력하세요 (한 번 등록하면 변경할 수 없습니다)
              </p>
            </div>

            <div className="space-y-2">
              <Label>플랫폼 * (하나 이상 선택)</Label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => togglePlatform('android')}
                  className={`flex-1 p-6 border-2 rounded-lg transition-all ${
                    formData.platform.includes('android')
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <svg className="w-12 h-12" viewBox="0 0 24 24" fill={formData.platform.includes('android') ? '#3DDC84' : '#A0AEC0'}>
                      <path d="M17.6,9.48l1.84-3.18c0.16-0.31,0.04-0.69-0.26-0.85c-0.29-0.15-0.65-0.06-0.83,0.22l-1.88,3.24 c-2.86-1.21-6.08-1.21-8.94,0L5.65,5.67c-0.19-0.29-0.58-0.38-0.87-0.2C4.5,5.65,4.41,6.01,4.56,6.3L6.4,9.48 C3.3,11.25,1.28,14.44,1,18h22C22.72,14.44,20.7,11.25,17.6,9.48z M7,15.25c-0.69,0-1.25-0.56-1.25-1.25 c0-0.69,0.56-1.25,1.25-1.25S8.25,13.31,8.25,14C8.25,14.69,7.69,15.25,7,15.25z M17,15.25c-0.69,0-1.25-0.56-1.25-1.25 c0-0.69,0.56-1.25,1.25-1.25s1.25,0.56,1.25,1.25C18.25,14.69,17.69,15.25,17,15.25z"/>
                    </svg>
                    <span className={`font-semibold ${formData.platform.includes('android') ? 'text-green-700' : 'text-gray-600'}`}>
                      Android
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => togglePlatform('ios')}
                  className={`flex-1 p-6 border-2 rounded-lg transition-all ${
                    formData.platform.includes('ios')
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <svg className="w-12 h-12" viewBox="0 0 24 24" fill={formData.platform.includes('ios') ? '#007AFF' : '#A0AEC0'}>
                      <path d="M18.71,19.5C17.88,20.74 17,21.95 15.66,21.97C14.32,22 13.89,21.18 12.37,21.18C10.84,21.18 10.37,21.95 9.1,22C7.79,22.05 6.8,20.68 5.96,19.47C4.25,17 2.94,12.45 4.7,9.39C5.57,7.87 7.13,6.91 8.82,6.88C10.1,6.86 11.32,7.75 12.11,7.75C12.89,7.75 14.37,6.68 15.92,6.84C16.57,6.87 18.39,7.1 19.56,8.82C19.47,8.88 17.39,10.1 17.41,12.63C17.44,15.65 20.06,16.66 20.09,16.67C20.06,16.74 19.67,18.11 18.71,19.5M13,3.5C13.73,2.67 14.94,2.04 15.94,2C16.07,3.17 15.6,4.35 14.9,5.19C14.21,6.04 13.07,6.7 11.95,6.61C11.8,5.46 12.36,4.26 13,3.5Z"/>
                    </svg>
                    <span className={`font-semibold ${formData.platform.includes('ios') ? 'text-blue-700' : 'text-gray-600'}`}>
                      iOS
                    </span>
                  </div>
                </button>
              </div>
              {formData.platform.length === 0 && (
                <p className="text-sm text-red-600">최소 하나의 플랫폼을 선택해야 합니다</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="icon_url">아이콘 URL</Label>
              <Input
                id="icon_url"
                placeholder="https://example.com/icon.png"
                value={formData.icon_url}
                onChange={(e) => setFormData({ ...formData, icon_url: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">설명</Label>
              <Input
                id="description"
                placeholder="앱에 대한 간단한 설명"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            {error && (
              <div className="p-3 rounded bg-red-50 text-red-600 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? '등록 중...' : '앱 등록하기'}
              </Button>
              <Link href="/">
                <Button type="button" variant="outline">취소</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
