'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type User = {
  id: string
  app_id: string
  user_identifier: string
  name?: string
  email?: string
  phone?: string
  status: 'active' | 'inactive' | 'suspended'
  notes?: string
  created_at: string
  updated_at: string
  apps?: {
    id: string
    name: string
    package_name: string
  }
  subscriptions?: {
    id: string
    subscription_type: 'free' | 'basic' | 'premium' | 'enterprise'
    status: 'active' | 'expired' | 'cancelled'
    start_date: string
    end_date?: string
    notes?: string
  }[]
}

type App = {
  id: string
  name: string
  package_name: string
}

const statusColors = {
  active: 'bg-green-100 text-green-700 border-green-300',
  inactive: 'bg-gray-100 text-gray-700 border-gray-300',
  suspended: 'bg-red-100 text-red-700 border-red-300'
}

const statusLabels = {
  active: '활성',
  inactive: '비활성',
  suspended: '정지'
}

const subStatusColors = {
  free: 'bg-blue-100 text-blue-700',
  active: 'bg-green-100 text-green-700',
  expired: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-700'
}

const subStatusLabels = {
  free: '무료',
  active: '구독',
  expired: '만료',
  cancelled: '취소'
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [apps, setApps] = useState<App[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedApp, setSelectedApp] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Checkbox selection state
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])

  // Add user dialog state
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newUser, setNewUser] = useState({
    app_id: '',
    user_identifier: '',
    name: '',
    email: '',
    phone: '',
    status: 'inactive',
    subscription_type: 'cancelled',
    subscription_end_date: ''
  })
  const [isDuplicateChecked, setIsDuplicateChecked] = useState(false)
  const [isDuplicateAvailable, setIsDuplicateAvailable] = useState(false)

  // Detail dialog state
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  // Edit subscription dialog state (for badges in list)
  const [isEditSubDialogOpen, setIsEditSubDialogOpen] = useState(false)
  const [editingSubscription, setEditingSubscription] = useState<{
    id: string
    subscription_type: string
    status: string
    end_date: string
  } | null>(null)

  // Inline editing state for detail view
  const [subEditData, setSubEditData] = useState<Map<string, {
    status: string
    end_date: string
    original_status: string
    original_end_date: string
  }>>(new Map())

  useEffect(() => {
    fetchApps()
    fetchUsers()
  }, [selectedApp, selectedStatus, searchQuery])

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

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams()
      if (selectedApp !== 'all') params.append('appId', selectedApp)
      if (selectedStatus !== 'all') params.append('status', selectedStatus)
      if (searchQuery) params.append('search', searchQuery)

      const response = await fetch(`/api/users?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCheckDuplicate = async () => {
    if (!newUser.app_id || !newUser.user_identifier) {
      alert('앱과 사용자 ID를 입력해주세요')
      return
    }

    try {
      const response = await fetch('/api/users/check-duplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          app_id: newUser.app_id,
          user_identifier: newUser.user_identifier
        })
      })

      if (response.ok) {
        const data = await response.json()
        setIsDuplicateChecked(true)
        setIsDuplicateAvailable(data.available)
      }
    } catch (error) {
      console.error('Error checking duplicate:', error)
      alert('중복 확인 중 오류가 발생했습니다')
    }
  }

  const handleAddUser = async () => {
    if (!newUser.app_id || !newUser.user_identifier) {
      alert('앱과 사용자 식별자는 필수입니다')
      return
    }

    if (!isDuplicateChecked) {
      alert('ID 중복 확인을 먼저 진행해주세요')
      return
    }

    if (!isDuplicateAvailable) {
      alert('사용 가능한 ID로 변경해주세요')
      return
    }

    try {
      // 1. Create user
      const userResponse = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          app_id: newUser.app_id,
          user_identifier: newUser.user_identifier,
          name: newUser.name,
          email: newUser.email,
          phone: newUser.phone,
          status: newUser.status
        })
      })

      if (!userResponse.ok) {
        const error = await userResponse.json()
        alert(error.error || '회원 추가에 실패했습니다')
        return
      }

      const userData = await userResponse.json()

      // 2. Always add subscription (default: free)
      const subResponse = await fetch(`/api/users/${userData.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription_type: newUser.subscription_type || 'free',
          status: newUser.subscription_type || 'free',
          end_date: newUser.subscription_end_date || null
        })
      })

      if (!subResponse.ok) {
        alert('회원은 추가되었으나 구독 추가에 실패했습니다')
      }

      alert('회원이 추가되었습니다')
      setIsAddDialogOpen(false)
      setNewUser({
        app_id: '',
        user_identifier: '',
        name: '',
        email: '',
        phone: '',
        status: 'inactive',
        subscription_type: 'cancelled',
        subscription_end_date: ''
      })
      setIsDuplicateChecked(false)
      setIsDuplicateAvailable(false)
      fetchUsers()
    } catch (error) {
      console.error('Error adding user:', error)
      alert('회원 추가 중 오류가 발생했습니다')
    }
  }

  const handleDeleteSelected = async () => {
    if (selectedUserIds.length === 0) {
      alert('삭제할 회원을 선택해주세요')
      return
    }

    if (!confirm(`선택한 ${selectedUserIds.length}명의 회원을 삭제하시겠습니까?`)) {
      return
    }

    try {
      const deletePromises = selectedUserIds.map(id =>
        fetch(`/api/users/${id}`, { method: 'DELETE' })
      )

      await Promise.all(deletePromises)

      alert(`${selectedUserIds.length}명의 회원이 삭제되었습니다`)
      setSelectedUserIds([])
      fetchUsers()
    } catch (error) {
      console.error('Error deleting users:', error)
      alert('회원 삭제 중 오류가 발생했습니다')
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUserIds(users.map(u => u.id))
    } else {
      setSelectedUserIds([])
    }
  }

  const handleSelectUser = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUserIds([...selectedUserIds, userId])
    } else {
      setSelectedUserIds(selectedUserIds.filter(id => id !== userId))
    }
  }

  const openDetailDialog = (user: User) => {
    setSelectedUser(user)
    setIsDetailDialogOpen(true)

    // Initialize edit data for all subscriptions
    const newEditData = new Map()
    if (user.subscriptions) {
      user.subscriptions.forEach(sub => {
        newEditData.set(sub.id, {
          status: sub.status,
          end_date: sub.end_date || '',
          original_status: sub.status,
          original_end_date: sub.end_date || ''
        })
      })
    }
    setSubEditData(newEditData)
  }

  const openEditSubDialog = (subscription: any) => {
    setEditingSubscription({
      id: subscription.id,
      subscription_type: subscription.subscription_type,
      status: subscription.status,
      end_date: subscription.end_date || ''
    })
    setIsEditSubDialogOpen(true)
  }

  const handleUpdateSubscription = async () => {
    if (!editingSubscription) return

    try {
      const response = await fetch(`/api/subscriptions/${editingSubscription.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription_type: editingSubscription.subscription_type,
          status: editingSubscription.status,
          end_date: editingSubscription.end_date || null
        })
      })

      if (response.ok) {
        alert('구독 정보가 수정되었습니다')
        setIsEditSubDialogOpen(false)
        setEditingSubscription(null)
        fetchUsers()
        // Refresh detail dialog if open
        if (selectedUser) {
          const updatedUser = users.find(u => u.id === selectedUser.id)
          if (updatedUser) setSelectedUser(updatedUser)
        }
      } else {
        const error = await response.json()
        alert(error.error || '구독 수정에 실패했습니다')
      }
    } catch (error) {
      console.error('Error updating subscription:', error)
      alert('구독 수정 중 오류가 발생했습니다')
    }
  }

  const handleDeleteSubscription = async (subId: string) => {
    if (!confirm('정말 이 구독을 삭제하시겠습니까?')) return

    try {
      const response = await fetch(`/api/subscriptions/${subId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        alert('구독이 삭제되었습니다')
        fetchUsers()
        // Refresh detail dialog if open
        if (selectedUser) {
          const response = await fetch(`/api/users?search=${selectedUser.user_identifier}`)
          if (response.ok) {
            const data = await response.json()
            const updatedUser = data.find((u: User) => u.id === selectedUser.id)
            if (updatedUser) setSelectedUser(updatedUser)
          }
        }
      } else {
        const error = await response.json()
        alert(error.error || '구독 삭제에 실패했습니다')
      }
    } catch (error) {
      console.error('Error deleting subscription:', error)
      alert('구독 삭제 중 오류가 발생했습니다')
    }
  }

  const updateSubEditData = (subId: string, field: 'status' | 'end_date', value: string) => {
    const newEditData = new Map(subEditData)
    const current = newEditData.get(subId)
    if (current) {
      newEditData.set(subId, { ...current, [field]: value })
      setSubEditData(newEditData)
    }
  }

  const hasSubChanges = (subId: string) => {
    const data = subEditData.get(subId)
    if (!data) return false
    return data.status !== data.original_status || data.end_date !== data.original_end_date
  }

  const saveSubscription = async (subId: string) => {
    const data = subEditData.get(subId)
    if (!data) return

    try {
      const response = await fetch(`/api/subscriptions/${subId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription_type: data.status === 'free' ? 'free' : 'basic',
          status: data.status,
          end_date: data.end_date || null
        })
      })

      if (response.ok) {
        alert('구독 정보가 수정되었습니다')

        // Update original values
        const newEditData = new Map(subEditData)
        newEditData.set(subId, {
          ...data,
          original_status: data.status,
          original_end_date: data.end_date
        })
        setSubEditData(newEditData)

        fetchUsers()
        // Refresh detail dialog
        if (selectedUser) {
          const response = await fetch(`/api/users?search=${selectedUser.user_identifier}`)
          if (response.ok) {
            const users = await response.json()
            const updatedUser = users.find((u: User) => u.id === selectedUser.id)
            if (updatedUser) {
              setSelectedUser(updatedUser)
              // Re-initialize edit data
              openDetailDialog(updatedUser)
            }
          }
        }
      } else {
        const error = await response.json()
        alert(error.error || '구독 수정에 실패했습니다')
      }
    } catch (error) {
      console.error('Error updating subscription:', error)
      alert('구독 수정 중 오류가 발생했습니다')
    }
  }

  const getStats = () => {
    return {
      total: users.length,
      active: users.filter(u => u.status === 'active').length,
      withSub: users.filter(u => u.subscriptions && u.subscriptions.length > 0).length
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
          <h1 className="text-3xl font-bold mb-2">회원 관리</h1>
          <p className="text-muted-foreground">앱별 사용자 계정을 관리합니다</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="destructive"
            onClick={handleDeleteSelected}
            disabled={selectedUserIds.length === 0}
          >
            선택 삭제 {selectedUserIds.length > 0 ? `(${selectedUserIds.length})` : ''}
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>+ 회원 추가</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>새 회원 추가</DialogTitle>
                <DialogDescription>앱에 새로운 사용자 계정을 생성합니다</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4 max-h-[70vh] overflow-y-auto">
                <div>
                  <Label>앱 선택 *</Label>
                  <Select value={newUser.app_id} onValueChange={(value) => setNewUser({...newUser, app_id: value})}>
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
                  <Label>사용자 ID *</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="아이디 (영문, 숫자)"
                      value={newUser.user_identifier}
                      onChange={(e) => {
                        setNewUser({...newUser, user_identifier: e.target.value})
                        setIsDuplicateChecked(false)
                        setIsDuplicateAvailable(false)
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCheckDuplicate}
                      className="whitespace-nowrap"
                    >
                      중복 확인
                    </Button>
                  </div>
                  {isDuplicateChecked && (
                    <p className={`text-xs mt-1 ${isDuplicateAvailable ? 'text-green-600' : 'text-red-600'}`}>
                      {isDuplicateAvailable ? '✓ 사용 가능한 ID입니다' : '✗ 이미 사용 중인 ID입니다'}
                    </p>
                  )}
                </div>

                <div>
                  <Label>이름</Label>
                  <Input
                    placeholder="사용자 이름"
                    value={newUser.name}
                    onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  />
                </div>

                <div>
                  <Label>이메일</Label>
                  <Input
                    type="email"
                    placeholder="email@example.com"
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  />
                </div>

                <div>
                  <Label>전화번호</Label>
                  <Input
                    placeholder="010-1234-5678"
                    value={newUser.phone}
                    onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                  />
                </div>

                <div className="border-t pt-4 mt-4">
                  <h3 className="font-semibold mb-3">구독 정보</h3>
                  <div className="space-y-4">
                    <div>
                      <Label>구독 상태</Label>
                      <Select
                        value={newUser.subscription_type}
                        onValueChange={(value: any) => setNewUser({...newUser, subscription_type: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cancelled">비활성</SelectItem>
                          <SelectItem value="free">무료</SelectItem>
                          <SelectItem value="active">구독</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>만료일 (선택)</Label>
                      <Input
                        type="date"
                        value={newUser.subscription_end_date}
                        onChange={(e) => setNewUser({...newUser, subscription_end_date: e.target.value})}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        비워두면 무제한입니다
                      </p>
                    </div>
                  </div>
                </div>

                <Button onClick={handleAddUser} className="w-full">추가</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>전체 회원</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>활성 회원</CardDescription>
            <CardTitle className="text-3xl text-green-600">{stats.active}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>구독 중</CardDescription>
            <CardTitle className="text-3xl text-blue-600">{stats.withSub}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* 필터 */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            <div>
              <Input
                placeholder="사용자 ID, 이름, 이메일, 전화번호 검색..."
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
                    <SelectItem value="inactive">비활성</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 회원 목록 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle>회원 목록</CardTitle>
          <CardDescription>총 {users.length}명의 회원</CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              등록된 회원이 없습니다
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={selectedUserIds.length === users.length}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead className="w-[80px]">No.</TableHead>
                    <TableHead>앱</TableHead>
                    <TableHead>사용자 ID</TableHead>
                    <TableHead>이름</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>구독 정보</TableHead>
                    <TableHead>구독 기간</TableHead>
                    <TableHead>가입일</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user, index) => (
                    <TableRow
                      key={user.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => openDetailDialog(user)}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedUserIds.includes(user.id)}
                          onCheckedChange={(checked) => handleSelectUser(user.id, !!checked)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>
                        {user.apps && (
                          <Badge variant="outline">{user.apps.name}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-sm">{user.user_identifier}</TableCell>
                      <TableCell>{user.name || '-'}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[user.status]}>
                          {statusLabels[user.status]}
                        </Badge>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        {user.subscriptions && user.subscriptions.length > 0 ? (
                          <div className="flex flex-col gap-1">
                            {user.subscriptions.map((sub) => (
                              <div key={sub.id} className="flex gap-1 items-center">
                                <Badge
                                  className={`${subStatusColors[sub.status]} cursor-pointer hover:opacity-80`}
                                  variant="outline"
                                  onClick={() => openEditSubDialog(sub)}
                                >
                                  {subStatusLabels[sub.status]}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">구독 없음</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {user.subscriptions && user.subscriptions.length > 0 ? (
                          <div className="flex flex-col gap-1">
                            {user.subscriptions.map((sub) => (
                              <div key={sub.id} className="text-xs">
                                {new Date(sub.start_date).toLocaleDateString('ko-KR')} ~{' '}
                                {sub.end_date ? new Date(sub.end_date).toLocaleDateString('ko-KR') : '무제한'}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(user.created_at).toLocaleDateString('ko-KR')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>회원 상세 정보</DialogTitle>
            <DialogDescription>회원의 전체 정보를 확인합니다</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6 mt-4">
              {/* 기본 정보 */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-4">기본 정보</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">앱</Label>
                    <p className="mt-1">{selectedUser.apps?.name || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">사용자 ID</Label>
                    <p className="mt-1 font-mono">{selectedUser.user_identifier}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">이름</Label>
                    <p className="mt-1">{selectedUser.name || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">상태</Label>
                    <div className="mt-1">
                      <Badge className={statusColors[selectedUser.status]}>
                        {statusLabels[selectedUser.status]}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">이메일</Label>
                    <p className="mt-1">{selectedUser.email || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">전화번호</Label>
                    <p className="mt-1">{selectedUser.phone || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">가입일</Label>
                    <p className="mt-1">{new Date(selectedUser.created_at).toLocaleString('ko-KR')}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">최종 수정일</Label>
                    <p className="mt-1">{new Date(selectedUser.updated_at).toLocaleString('ko-KR')}</p>
                  </div>
                  {selectedUser.notes && (
                    <div className="col-span-2">
                      <Label className="text-sm text-muted-foreground">메모</Label>
                      <p className="mt-1">{selectedUser.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* 구독 정보 */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-4">구독 정보</h3>
                {selectedUser.subscriptions && selectedUser.subscriptions.length > 0 ? (
                  <div className="space-y-3">
                    {selectedUser.subscriptions.map((sub) => {
                      const editData = subEditData.get(sub.id)
                      if (!editData) return null

                      const hasChanges = hasSubChanges(sub.id)

                      return (
                        <div key={sub.id} className="space-y-3">
                          <div>
                            <Label className="text-sm mb-1 block">구독 상태</Label>
                            <Select
                              value={editData.status}
                              onValueChange={(value) => updateSubEditData(sub.id, 'status', value)}
                            >
                              <SelectTrigger className="h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="free">무료</SelectItem>
                                <SelectItem value="active">구독</SelectItem>
                                <SelectItem value="expired">만료</SelectItem>
                                <SelectItem value="cancelled">취소</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label className="text-sm mb-1 block">시작일</Label>
                            <Input
                              type="text"
                              value={new Date(sub.start_date).toLocaleDateString('ko-KR')}
                              disabled
                              className="h-9 bg-gray-100"
                            />
                          </div>

                          <div>
                            <Label className="text-sm mb-1 block">만료일</Label>
                            <Input
                              type="date"
                              value={editData.end_date}
                              onChange={(e) => updateSubEditData(sub.id, 'end_date', e.target.value)}
                              className="h-9"
                            />
                            <p className="text-xs text-muted-foreground mt-1">비워두면 무제한</p>
                          </div>

                          {sub.notes && (
                            <div>
                              <Label className="text-sm text-muted-foreground mb-1 block">메모</Label>
                              <p className="text-sm">{sub.notes}</p>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground">구독 정보가 없습니다</p>
                )}
              </div>

              {/* 회원 관리 버튼 */}
              <div className="flex gap-2 justify-end pt-4 border-t">
                {selectedUser.subscriptions && selectedUser.subscriptions.length > 0 && (
                  <Button
                    onClick={() => {
                      const sub = selectedUser.subscriptions[0]
                      saveSubscription(sub.id)
                    }}
                    disabled={!selectedUser.subscriptions.some(sub => hasSubChanges(sub.id))}
                  >
                    저장
                  </Button>
                )}
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (selectedUser && confirm(`${selectedUser.user_identifier} 회원을 삭제하시겠습니까?`)) {
                      handleDeleteSelected()
                      setIsDetailDialogOpen(false)
                    }
                  }}
                >
                  회원 삭제
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Subscription Dialog */}
      <Dialog open={isEditSubDialogOpen} onOpenChange={setIsEditSubDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>구독 정보 수정</DialogTitle>
            <DialogDescription>구독 유형, 상태, 만료일을 변경할 수 있습니다</DialogDescription>
          </DialogHeader>
          {editingSubscription && (
            <div className="space-y-4 mt-4">
              <div>
                <Label>구독 상태</Label>
                <Select
                  value={editingSubscription.status}
                  onValueChange={(value: any) => setEditingSubscription({...editingSubscription, status: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">무료</SelectItem>
                    <SelectItem value="active">구독</SelectItem>
                    <SelectItem value="expired">만료</SelectItem>
                    <SelectItem value="cancelled">취소</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>만료일</Label>
                <Input
                  type="date"
                  value={editingSubscription.end_date}
                  onChange={(e) => setEditingSubscription({...editingSubscription, end_date: e.target.value})}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  비워두면 무제한입니다
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleUpdateSubscription} className="flex-1">저장</Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditSubDialogOpen(false)
                    setEditingSubscription(null)
                  }}
                  className="flex-1"
                >
                  취소
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
