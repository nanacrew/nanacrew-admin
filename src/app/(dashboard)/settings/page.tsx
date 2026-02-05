'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

export default function SettingsPage() {
  const [adminEmail, setAdminEmail] = useState('admin@nanacrew.com')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [errorAlerts, setErrorAlerts] = useState(true)
  const [weeklyReport, setWeeklyReport] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    // 비밀번호 확인
    if (password && password !== passwordConfirm) {
      alert('비밀번호가 일치하지 않습니다')
      return
    }

    // 비밀번호 길이 확인
    if (password && password.length < 6) {
      alert('비밀번호는 최소 6자 이상이어야 합니다')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/admin/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: adminEmail,
          password: password || undefined
        })
      })

      const data = await response.json()

      if (response.ok) {
        alert('관리자 정보가 저장되었습니다')
        setPassword('')
        setPasswordConfirm('')
      } else {
        alert(data.error || '저장에 실패했습니다')
      }
    } catch (error) {
      console.error('Save error:', error)
      alert('저장 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">설정</h1>
        <p className="text-muted-foreground">시스템 설정 및 관리자 계정 정보</p>
      </div>

      <div className="space-y-6">
        {/* 관리자 계정 */}
        <Card>
          <CardHeader>
            <CardTitle>관리자 계정</CardTitle>
            <CardDescription>어드민 시스템 접근 계정 정보</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호 변경</Label>
              <Input
                id="password"
                type="password"
                placeholder="새 비밀번호 입력"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password-confirm">비밀번호 확인</Label>
              <Input
                id="password-confirm"
                type="password"
                placeholder="새 비밀번호 재입력"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
              />
            </div>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? '저장 중...' : '계정 정보 저장'}
            </Button>
          </CardContent>
        </Card>

        {/* 알림 설정 */}
        <Card>
          <CardHeader>
            <CardTitle>알림 설정</CardTitle>
            <CardDescription>시스템 알림 및 리포트 수신 설정</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">알림 활성화</p>
                <p className="text-sm text-muted-foreground">시스템 알림 수신 여부</p>
              </div>
              <input
                type="checkbox"
                checked={notificationsEnabled}
                onChange={(e) => setNotificationsEnabled(e.target.checked)}
                className="w-4 h-4"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">이메일 알림</p>
                <p className="text-sm text-muted-foreground">중요 이벤트를 이메일로 수신</p>
              </div>
              <input
                type="checkbox"
                checked={emailNotifications}
                onChange={(e) => setEmailNotifications(e.target.checked)}
                className="w-4 h-4"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">에러 알림</p>
                <p className="text-sm text-muted-foreground">시스템 에러 발생 시 즉시 알림</p>
              </div>
              <input
                type="checkbox"
                checked={errorAlerts}
                onChange={(e) => setErrorAlerts(e.target.checked)}
                className="w-4 h-4"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">주간 리포트</p>
                <p className="text-sm text-muted-foreground">매주 월요일 통계 리포트 수신</p>
              </div>
              <input
                type="checkbox"
                checked={weeklyReport}
                onChange={(e) => setWeeklyReport(e.target.checked)}
                className="w-4 h-4"
              />
            </div>
            <Button onClick={handleSave}>알림 설정 저장</Button>
          </CardContent>
        </Card>

        {/* API 키 관리 */}
        <Card>
          <CardHeader>
            <CardTitle>API 키 관리</CardTitle>
            <CardDescription>외부 서비스 연동을 위한 API 키</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Supabase URL</Label>
              <Input
                readOnly
                value={process.env.NEXT_PUBLIC_SUPABASE_URL || '설정되지 않음'}
                className="font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label>Supabase Anon Key</Label>
              <Input
                readOnly
                type="password"
                value={process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '설정되지 않음'}
                className="font-mono text-sm"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              API 키는 .env.local 파일에서 관리됩니다
            </p>
          </CardContent>
        </Card>

        {/* 시스템 정보 */}
        <Card>
          <CardHeader>
            <CardTitle>시스템 정보</CardTitle>
            <CardDescription>현재 시스템 상태 및 버전 정보</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">버전</span>
              <Badge>1.0.0</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">배포 환경</span>
              <Badge variant="outline">Vercel</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">데이터베이스</span>
              <Badge variant="outline">Supabase PostgreSQL</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">프레임워크</span>
              <Badge variant="outline">Next.js 15</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">마지막 배포</span>
              <span className="text-sm">{new Date().toLocaleDateString('ko-KR')}</span>
            </div>
          </CardContent>
        </Card>

        {/* 데이터 관리 */}
        <Card>
          <CardHeader>
            <CardTitle>데이터 관리</CardTitle>
            <CardDescription>데이터 백업 및 초기화</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">데이터 백업</p>
                <p className="text-sm text-muted-foreground">전체 데이터베이스를 JSON으로 내보내기</p>
              </div>
              <Button variant="outline">백업</Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">통계 초기화</p>
                <p className="text-sm text-muted-foreground">모든 통계 데이터 삭제 (앱 정보는 유지)</p>
              </div>
              <Button variant="outline">초기화</Button>
            </div>
            <div className="flex items-center justify-between border-t pt-4">
              <div>
                <p className="font-medium text-red-600">전체 데이터 삭제</p>
                <p className="text-sm text-muted-foreground">⚠️ 모든 앱, 버전, 통계 데이터를 영구 삭제합니다</p>
              </div>
              <Button variant="destructive">전체 삭제</Button>
            </div>
          </CardContent>
        </Card>

        {/* 보안 설정 */}
        <Card>
          <CardHeader>
            <CardTitle>보안 설정</CardTitle>
            <CardDescription>시스템 보안 및 접근 제어</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">2단계 인증</p>
                <p className="text-sm text-muted-foreground">로그인 시 추가 인증 요구</p>
              </div>
              <Badge variant="secondary">준비 중</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">IP 화이트리스트</p>
                <p className="text-sm text-muted-foreground">특정 IP에서만 접근 허용</p>
              </div>
              <Badge variant="secondary">준비 중</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">API 레이트 리밋</p>
                <p className="text-sm text-muted-foreground">과도한 API 요청 방지</p>
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700">활성화</Badge>
            </div>
          </CardContent>
        </Card>

        {/* 캐시 관리 */}
        <Card>
          <CardHeader>
            <CardTitle>캐시 관리</CardTitle>
            <CardDescription>시스템 성능 최적화</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">앱 목록 캐시 삭제</p>
                <p className="text-sm text-muted-foreground">앱 목록이 업데이트되지 않을 때 시도</p>
              </div>
              <Button variant="outline">삭제</Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">통계 캐시 삭제</p>
                <p className="text-sm text-muted-foreground">통계가 실시간으로 반영되지 않을 때 시도</p>
              </div>
              <Button variant="outline">삭제</Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">전체 캐시 삭제</p>
                <p className="text-sm text-muted-foreground">모든 캐시를 삭제하고 재구축</p>
              </div>
              <Button variant="outline">전체 삭제</Button>
            </div>
          </CardContent>
        </Card>

        {/* 개발 정보 */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-800">개발 안내</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-blue-700 mb-3">
              설정 페이지의 많은 기능들이 아직 구현 중입니다. 현재 작동하는 기능:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-blue-700">
              <li>시스템 정보 표시</li>
              <li>API 키 확인 (읽기 전용)</li>
            </ul>
            <p className="text-sm text-blue-700 mt-3">
              추후 업데이트에서 계정 관리, 알림, 백업 등의 기능이 추가될 예정입니다.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
