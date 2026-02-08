'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

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

const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  supabase: 'Supabase',
  vercel: 'Vercel',
  firebase: 'Firebase',
  github: 'GitHub',
  play_store: 'Play Store',
  app_store: 'App Store',
  other: '기타'
}

const SERVICE_TYPE_COLORS: Record<ServiceType, string> = {
  supabase: 'bg-green-100 text-green-800',
  vercel: 'bg-black text-white',
  firebase: 'bg-orange-100 text-orange-800',
  github: 'bg-gray-100 text-gray-800',
  play_store: 'bg-blue-100 text-blue-800',
  app_store: 'bg-blue-100 text-blue-800',
  other: 'bg-gray-100 text-gray-800'
}

export default function AppServicesSection({ appId }: { appId: string }) {
  const [services, setServices] = useState<AppService[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewServiceForm, setShowNewServiceForm] = useState(false)
  const [editingService, setEditingService] = useState<AppService | null>(null)
  const [formData, setFormData] = useState({
    service_type: 'supabase' as ServiceType,
    service_name: '',
    account_email: '',
    project_id: '',
    project_url: '',
    notes: ''
  })

  useEffect(() => {
    fetchServices()
  }, [appId])

  const fetchServices = async () => {
    try {
      const response = await fetch(`/api/apps/${appId}/services`)
      if (response.ok) {
        const data = await response.json()
        setServices(data)
      }
    } catch (error) {
      console.error('Failed to fetch services:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = editingService
        ? `/api/apps/${appId}/services/${editingService.id}`
        : `/api/apps/${appId}/services`

      const response = await fetch(url, {
        method: editingService ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setShowNewServiceForm(false)
        setEditingService(null)
        setFormData({
          service_type: 'supabase',
          service_name: '',
          account_email: '',
          project_id: '',
          project_url: '',
          notes: ''
        })
        fetchServices()
      }
    } catch (error) {
      console.error('Failed to save service:', error)
    }
  }

  const handleEdit = (service: AppService) => {
    setEditingService(service)
    setFormData({
      service_type: service.service_type,
      service_name: service.service_name,
      account_email: service.account_email || '',
      project_id: service.project_id || '',
      project_url: service.project_url || '',
      notes: service.notes || ''
    })
    setShowNewServiceForm(true)
  }

  const handleDelete = async (serviceId: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return

    try {
      const response = await fetch(`/api/apps/${appId}/services/${serviceId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchServices()
      }
    } catch (error) {
      console.error('Failed to delete service:', error)
    }
  }

  const handleCancel = () => {
    setShowNewServiceForm(false)
    setEditingService(null)
    setFormData({
      service_type: 'supabase',
      service_name: '',
      account_email: '',
      project_id: '',
      project_url: '',
      notes: ''
    })
  }

  if (loading) {
    return <div>로딩 중...</div>
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>연관 서비스</CardTitle>
            <CardDescription>
              앱과 연결된 서비스 계정 관리 (Supabase, Vercel, Firebase 등)
            </CardDescription>
          </div>
          <Button
            onClick={() => setShowNewServiceForm(!showNewServiceForm)}
            variant={showNewServiceForm ? 'outline' : 'default'}
          >
            {showNewServiceForm ? '취소' : '+ 서비스 추가'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {showNewServiceForm && (
          <form onSubmit={handleSubmit} className="mb-6 p-4 border rounded-lg space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="service_type">서비스 종류 *</Label>
                <Select
                  value={formData.service_type}
                  onValueChange={(value) => setFormData({ ...formData, service_type: value as ServiceType })}
                  disabled={!!editingService}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(SERVICE_TYPE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="service_name">서비스 이름 *</Label>
                <Input
                  id="service_name"
                  required
                  placeholder="예: 메인 프로젝트"
                  value={formData.service_name}
                  onChange={(e) => setFormData({ ...formData, service_name: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="account_email">계정 이메일</Label>
              <Input
                id="account_email"
                type="email"
                placeholder="example@email.com"
                value={formData.account_email}
                onChange={(e) => setFormData({ ...formData, account_email: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="project_id">프로젝트 ID</Label>
                <Input
                  id="project_id"
                  placeholder="프로젝트 ID 또는 고유 식별자"
                  value={formData.project_id}
                  onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="project_url">프로젝트 URL</Label>
                <Input
                  id="project_url"
                  type="url"
                  placeholder="https://..."
                  value={formData.project_url}
                  onChange={(e) => setFormData({ ...formData, project_url: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">메모</Label>
              <textarea
                id="notes"
                className="w-full min-h-[80px] px-3 py-2 border rounded-md"
                placeholder="추가 정보나 메모..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" className="flex-1">
                {editingService ? '수정하기' : '등록하기'}
              </Button>
              <Button type="button" variant="outline" onClick={handleCancel}>
                취소
              </Button>
            </div>
          </form>
        )}

        {services.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            등록된 서비스가 없습니다. 연관 서비스를 추가하세요.
          </p>
        ) : (
          <div className="space-y-4">
            {services.map((service) => (
              <div
                key={service.id}
                className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <Badge className={SERVICE_TYPE_COLORS[service.service_type]}>
                      {SERVICE_TYPE_LABELS[service.service_type]}
                    </Badge>
                    <h3 className="font-semibold text-lg">{service.service_name}</h3>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(service)}>
                      수정
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(service.id)}
                    >
                      삭제
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  {service.account_email && (
                    <div>
                      <span className="text-muted-foreground">계정:</span>{' '}
                      <span className="font-mono">{service.account_email}</span>
                    </div>
                  )}
                  {service.project_id && (
                    <div>
                      <span className="text-muted-foreground">프로젝트 ID:</span>{' '}
                      <span className="font-mono">{service.project_id}</span>
                    </div>
                  )}
                  {service.project_url && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">URL:</span>{' '}
                      <a
                        href={service.project_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {service.project_url}
                      </a>
                    </div>
                  )}
                  {service.notes && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">메모:</span>{' '}
                      <span className="text-gray-700">{service.notes}</span>
                    </div>
                  )}
                </div>

                <div className="mt-2 text-xs text-muted-foreground">
                  등록일: {service.created_at
                    ? new Date(service.created_at).toLocaleDateString('ko-KR')
                    : '-'}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
