'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

type ServiceType = 'supabase' | 'vercel' | 'firebase' | 'github' | 'play_store' | 'app_store' | 'other'

type AppService = {
  id: string
  app_id: string
  service_type: ServiceType
  service_name: string
  account_email?: string
  project_id?: string
  project_url?: string
  api_keys: Record<string, string>
  notes?: string
  created_at: string
  updated_at: string
}

type App = {
  id: string
  name: string
  package_name: string
  platform: ('android' | 'ios')[]
}

type ServiceWithApp = AppService & {
  app: App
}

const serviceTypeLabels: Record<ServiceType, string> = {
  supabase: 'Supabase',
  vercel: 'Vercel',
  firebase: 'Firebase',
  github: 'GitHub',
  play_store: 'Play Store',
  app_store: 'App Store',
  other: '기타'
}

const serviceTypeColors: Record<ServiceType, string> = {
  supabase: 'bg-green-100 text-green-700 border-green-300',
  vercel: 'bg-black text-white border-black',
  firebase: 'bg-orange-100 text-orange-700 border-orange-300',
  github: 'bg-purple-100 text-purple-700 border-purple-300',
  play_store: 'bg-blue-100 text-blue-700 border-blue-300',
  app_store: 'bg-gray-100 text-gray-700 border-gray-300',
  other: 'bg-gray-100 text-gray-700 border-gray-300'
}

export default function ServicesPage() {
  const [services, setServices] = useState<ServiceWithApp[]>([])
  const [apps, setApps] = useState<App[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedType, setSelectedType] = useState<ServiceType | 'all'>('all')

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

      // 각 앱의 서비스 가져오기
      const servicesPromises = appsData.map(async (app) => {
        try {
          const response = await fetch(`/api/apps/${app.id}/services`)
          if (response.ok) {
            const data: AppService[] = await response.json()
            return data.map(service => ({ ...service, app }))
          }
        } catch (error) {
          console.error(`Failed to fetch services for ${app.name}:`, error)
        }
        return []
      })

      const servicesData = await Promise.all(servicesPromises)
      setServices(servicesData.flat())
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getServicesByType = (type: ServiceType | 'all') => {
    if (type === 'all') return services
    return services.filter(s => s.service_type === type)
  }

  const getServiceTypeCount = (type: ServiceType) => {
    return services.filter(s => s.service_type === type).length
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">로딩 중...</div>
      </div>
    )
  }

  const filteredServices = getServicesByType(selectedType)

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">연관 서비스</h1>
        <p className="text-muted-foreground">모든 앱의 외부 서비스를 한곳에서 관리하세요</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>전체 앱</CardDescription>
            <CardTitle className="text-2xl">{apps.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>전체 서비스</CardDescription>
            <CardTitle className="text-2xl">{services.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Firebase</CardDescription>
            <CardTitle className="text-2xl text-orange-600">
              {getServiceTypeCount('firebase')}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Supabase</CardDescription>
            <CardTitle className="text-2xl text-green-600">
              {getServiceTypeCount('supabase')}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* 필터 버튼 */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Button
          variant={selectedType === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedType('all')}
        >
          전체 ({services.length})
        </Button>
        {Object.entries(serviceTypeLabels).map(([type, label]) => {
          const count = getServiceTypeCount(type as ServiceType)
          if (count === 0) return null
          return (
            <Button
              key={type}
              variant={selectedType === type ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedType(type as ServiceType)}
            >
              {label} ({count})
            </Button>
          )
        })}
      </div>

      {/* 서비스 목록 */}
      {filteredServices.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              {selectedType === 'all'
                ? '등록된 서비스가 없습니다.'
                : `${serviceTypeLabels[selectedType as ServiceType]} 서비스가 없습니다.`}
            </p>
            <Link href="/apps">
              <Button>앱 관리로 이동</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredServices.map((service) => (
            <Card key={service.id}>
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={serviceTypeColors[service.service_type]}>
                        {serviceTypeLabels[service.service_type]}
                      </Badge>
                      <CardTitle className="text-lg">{service.service_name}</CardTitle>
                    </div>
                    <Link href={`/apps/${service.app_id}`}>
                      <CardDescription className="hover:underline cursor-pointer">
                        {service.app.name}
                      </CardDescription>
                    </Link>
                  </div>
                  <Link href={`/apps/${service.app_id}`}>
                    <Button variant="outline" size="sm">앱 보기</Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {service.account_email && (
                    <div>
                      <p className="text-sm font-semibold text-muted-foreground">계정</p>
                      <p className="text-sm font-mono">{service.account_email}</p>
                    </div>
                  )}

                  {service.project_id && (
                    <div>
                      <p className="text-sm font-semibold text-muted-foreground">프로젝트 ID</p>
                      <p className="text-sm font-mono">{service.project_id}</p>
                    </div>
                  )}

                  {service.project_url && (
                    <div>
                      <p className="text-sm font-semibold text-muted-foreground">프로젝트 URL</p>
                      <a
                        href={service.project_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline break-all"
                      >
                        {service.project_url}
                      </a>
                    </div>
                  )}

                  {Object.keys(service.api_keys).length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-muted-foreground mb-2">API Keys</p>
                      <div className="space-y-1">
                        {Object.entries(service.api_keys).map(([key, value]) => (
                          <div key={key} className="text-sm">
                            <span className="font-medium">{key}:</span>
                            <span className="ml-2 font-mono text-xs text-muted-foreground">
                              {String(value).substring(0, 20)}...
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {service.notes && (
                    <div>
                      <p className="text-sm font-semibold text-muted-foreground">메모</p>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{service.notes}</p>
                    </div>
                  )}

                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground">
                      등록일:{' '}
                      {service.created_at
                        ? new Date(service.created_at).toLocaleDateString('ko-KR')
                        : '-'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 서비스 타입별 요약 */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>서비스 타입별 요약</CardTitle>
          <CardDescription>등록된 서비스를 타입별로 분류</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(serviceTypeLabels).map(([type, label]) => {
              const count = getServiceTypeCount(type as ServiceType)
              return (
                <div key={type} className="text-center p-4 border rounded-lg">
                  <Badge className={`${serviceTypeColors[type as ServiceType]} mb-2`}>
                    {label}
                  </Badge>
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-xs text-muted-foreground">개 등록됨</p>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* 안내 */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>서비스 관리 안내</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
            <li>각 앱의 상세 페이지에서 연관 서비스를 추가하고 관리할 수 있습니다</li>
            <li>서비스 계정 정보, 프로젝트 ID, API 키 등을 안전하게 보관하세요</li>
            <li>API 키는 일부만 표시되며, 전체 내용은 앱 상세 페이지에서 확인할 수 있습니다</li>
            <li>서비스를 수정하거나 삭제하려면 해당 앱의 상세 페이지로 이동하세요</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
