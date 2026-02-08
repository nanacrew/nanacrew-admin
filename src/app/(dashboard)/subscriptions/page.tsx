'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type Subscription = {
  id: string
  user_identifier: string
  subscription_type: 'free' | 'paid' | 'trial'
  status: 'active' | 'expired' | 'cancelled' | 'suspended'
  start_date: string
  end_date?: string
  notes?: string
  created_at: string
  apps?: {
    id: string
    name: string
    package_name: string
  }
  user_sessions?: {
    id: string
    last_active: string
    expires_at: string
  }[]
}

type App = {
  id: string
  name: string
  package_name: string
}

const statusColors = {
  active: 'bg-green-100 text-green-700 border-green-300',
  expired: 'bg-red-100 text-red-700 border-red-300',
  cancelled: 'bg-gray-100 text-gray-700 border-gray-300',
  suspended: 'bg-yellow-100 text-yellow-700 border-yellow-300'
}

const statusLabels = {
  active: '활성',
  expired: '만료',
  cancelled: '취소',
  suspended: '정지'
}

const typeColors = {
  free: 'bg-blue-100 text-blue-700',
  paid: 'bg-purple-100 text-purple-700',
  trial: 'bg-orange-100 text-orange-700'
}

const typeLabels = {
  free: '무료',
  paid: '유료',
  trial: '체험'
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [apps, setApps] = useState<App[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedApp, setSelectedApp] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Add subscription dialog state
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newSub, setNewSub] = useState({
    app_id: '',
    user_identifier: '',
    subscription_type: 'free',
    end_date: '',
    notes: ''
  })

  useEffect(() => {
    fetchApps()
    fetchSubscriptions()
  }, [selectedApp, selectedStatus, selectedType, searchQuery])

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

  const fetchSubscriptions = async () => {
    try {
      const params = new URLSearchParams()
      if (selectedApp !== 'all') params.append('appId', selectedApp)
      if (selectedStatus !== 'all') params.append('status', selectedStatus)
      if (selectedType !== 'all') params.append('type', selectedType)
      if (searchQuery) params.append('search', searchQuery)

      const response = await fetch(`/api/subscriptions?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setSubscriptions(data)
      }
    } catch (error) {
      console.error('Failed to fetch subscriptions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddSubscription = async () => {
    if (!newSub.app_id || !newSub.user_identifier) {
      alert('앱과 사용자 식별자는 필수입니다')
      return
    }

    try {
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSub)
      })

      if (response.ok) {
        alert('구독이 추가되었습니다')
        setIsAddDialogOpen(false)
        setNewSub({
          app_id: '',
          user_identifier: '',
          subscription_type: 'free',
          end_date: '',
          notes: ''
        })
        fetchSubscriptions()
      } else {
        const error = await response.json()
        alert(error.error || '구독 추가에 실패했습니다')
      }
    } catch (error) {
      console.error('Error adding subscription:', error)
      alert('구독 추가 중 오류가 발생했습니다')
    }
  }

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const response = await fetch(`/api/subscriptions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })

      if (response.ok) {
        fetchSubscriptions()
      }
    } catch (error) {
      console.error('Error updating subscription:', error)
    }
  }

  const handleForceLogout = async (id: string) => {
    if (!confirm('해당 사용자를 강제 로그아웃시키겠습니까?')) return

    try {
      const response = await fetch(`/api/subscriptions/${id}`, {
        method: 'POST'
      })

      if (response.ok) {
        alert('사용자가 로그아웃되었습니다')
        fetchSubscriptions()
      }
    } catch (error) {
      console.error('Error logging out user:', error)
    }
  }

  const handleDeleteSubscription = async (id: string) => {
    if (!confirm('정말 이 구독을 삭제하시겠습니까?')) return

    try {
      const response = await fetch(`/api/subscriptions/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchSubscriptions()
      }
    } catch (error) {
      console.error('Error deleting subscription:', error)
    }
  }

  const getStats = () => {
    return {
      total: subscriptions.length,
      active: subscriptions.filter(s => s.status === 'active').length,
      loggedIn: subscriptions.filter(s => s.user_sessions && s.user_sessions.length > 0).length
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">로딩 중...</div>
      </div>
    )
  }

  const stats = getStats()

  return (
    <div className="p-8">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">구독 관리</h1>
          <p className="text-muted-foreground">앱별 사용자 구독을 관리합니다</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>+ 구독 추가</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>새 구독 추가</DialogTitle>
              <DialogDescription>사용자에게 앱 이용 권한을 부여합니다</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>앱 선택</Label>
                <Select value={newSub.app_id} onValueChange={(value) => setNewSub({...newSub, app_id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="앱을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {apps.map(app => (
                      <SelectItem key={app.id} value={app.id}>{app.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>사용자 식별자</Label>
                <Input
                  placeholder="이메일, 전화번호 등"
                  value={newSub.user_identifier}
                  onChange={(e) => setNewSub({...newSub, user_identifier: e.target.value})}
                />
              </div>
              <div>
                <Label>구독 유형</Label>
                <Select value={newSub.subscription_type} onValueChange={(value: any) => setNewSub({...newSub, subscription_type: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">무료</SelectItem>
                    <SelectItem value="paid">유료</SelectItem>
                    <SelectItem value="trial">체험</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>만료일 (선택)</Label>
                <Input
                  type="date"
                  value={newSub.end_date}
                  onChange={(e) => setNewSub({...newSub, end_date: e.target.value})}
                />
              </div>
              <div>
                <Label>메모 (선택)</Label>
                <Input
                  placeholder="관리자 메모"
                  value={newSub.notes}
                  onChange={(e) => setNewSub({...newSub, notes: e.target.value})}
                />
              </div>
              <Button onClick={handleAddSubscription} className="w-full">추가</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>전체 구독</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>활성 구독</CardDescription>
            <CardTitle className="text-3xl text-green-600">{stats.active}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>현재 로그인</CardDescription>
            <CardTitle className="text-3xl text-blue-600">{stats.loggedIn}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* 필터 */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            <div>
              <Input
                placeholder="사용자 식별자 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-4 flex-wrap">
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">앱</Label>
                <Select value={selectedApp} onValueChange={setSelectedApp}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    {apps.map(app => (
                      <SelectItem key={app.id} value={app.id}>{app.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">상태</Label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    <SelectItem value="active">활성</SelectItem>
                    <SelectItem value="expired">만료</SelectItem>
                    <SelectItem value="cancelled">취소</SelectItem>
                    <SelectItem value="suspended">정지</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">유형</Label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    <SelectItem value="free">무료</SelectItem>
                    <SelectItem value="paid">유료</SelectItem>
                    <SelectItem value="trial">체험</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 구독 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>구독 목록</CardTitle>
          <CardDescription>총 {subscriptions.length}개의 구독</CardDescription>
        </CardHeader>
        <CardContent>
          {subscriptions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              등록된 구독이 없습니다
            </div>
          ) : (
            <div className="space-y-4">
              {subscriptions.map((sub) => (
                <div key={sub.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold">{sub.user_identifier}</span>
                        <Badge className={statusColors[sub.status]}>
                          {statusLabels[sub.status]}
                        </Badge>
                        <Badge className={typeColors[sub.subscription_type]}>
                          {typeLabels[sub.subscription_type]}
                        </Badge>
                        {sub.apps && (
                          <Link href={`/apps/${sub.apps.id}`}>
                            <Badge variant="outline" className="hover:bg-gray-100">
                              {sub.apps.name}
                            </Badge>
                          </Link>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div>
                          시작일:{' '}
                          {sub.start_date
                            ? new Date(sub.start_date).toLocaleDateString('ko-KR')
                            : '-'}
                        </div>
                        {sub.end_date && (
                          <div>만료일: {new Date(sub.end_date).toLocaleDateString('ko-KR')}</div>
                        )}
                        {sub.user_sessions && sub.user_sessions.length > 0 && (
                          <div className="text-green-600">
                            🟢 로그인 중 (마지막 활동: {new Date(sub.user_sessions[0].last_active).toLocaleString('ko-KR')})
                          </div>
                        )}
                        {sub.notes && <div className="text-xs">메모: {sub.notes}</div>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {sub.user_sessions && sub.user_sessions.length > 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleForceLogout(sub.id)}
                        >
                          로그아웃
                        </Button>
                      )}
                      {sub.status === 'active' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateStatus(sub.id, 'suspended')}
                        >
                          정지
                        </Button>
                      )}
                      {sub.status === 'suspended' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateStatus(sub.id, 'active')}
                        >
                          활성화
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteSubscription(sub.id)}
                      >
                        삭제
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 안내 */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>구독 시스템 안내</CardTitle>
          <CardDescription>구독 관리 및 로그인 제어</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
            <li><strong>구독 추가:</strong> 사용자에게 앱 사용 권한을 부여합니다</li>
            <li><strong>중복 방지:</strong> 동일 앱 + 동일 사용자 조합은 하나만 등록 가능합니다</li>
            <li><strong>다중 로그인 방지:</strong> 한 계정은 하나의 기기에서만 로그인 가능합니다</li>
            <li><strong>무료 구독:</strong> 관리자가 무료로 제공하는 구독 (만료일 없음)</li>
            <li><strong>유료 구독:</strong> 실제 결제를 통한 구독 (향후 결제 시스템 연동)</li>
            <li><strong>체험 구독:</strong> 기간 제한이 있는 무료 체험</li>
            <li><strong>강제 로그아웃:</strong> 로그인 중인 사용자를 즉시 로그아웃시킵니다</li>
            <li><strong>앱 로그인 체크:</strong> 앱에서 <code className="bg-gray-100 px-1 rounded">/api/subscriptions/check</code> API로 구독 상태를 확인합니다</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
