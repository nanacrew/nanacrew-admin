# 🎯 NanaCrew Admin

**여러 모바일 앱의 버전을 중앙에서 관리하는 어드민 시스템**

Flutter/React Native 등 여러 모바일 앱의 버전 정보를 한 곳에서 관리하고, 각 앱에서 실시간으로 버전 체크 및 강제 업데이트를 수행할 수 있는 시스템입니다.

## ✨ 주요 기능

- 📱 **멀티 앱 관리**: 여러 앱(Android/iOS)을 하나의 대시보드에서 관리
- 🔄 **버전 관리**: 각 앱의 버전 히스토리 관리 및 최신 버전 배포
- ⚠️ **강제 업데이트**: 특정 버전 이하 사용자에게 강제 업데이트 요청
- 🌐 **REST API**: 모바일 앱에서 호출할 수 있는 버전 체크 API 제공
- 📊 **대시보드**: 등록된 앱 및 버전 목록을 한눈에 확인

## 🛠 기술 스택

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI + Tailwind)
- **Backend**: Next.js API Routes (Serverless)
- **Database**: Supabase (PostgreSQL)
- **Hosting**: Vercel

## 🚀 빠른 시작

### 개발 환경 실행

```bash
# 프로젝트 디렉토리로 이동
cd nanacrew-admin

# 환경 변수 설정 (.env.local 파일 생성 필요)
# .env.local 파일에 Supabase 정보 입력

# 개발 서버 실행
npm run dev
```

http://localhost:3000 접속

### 배포

상세한 배포 가이드는 [DEPLOYMENT.md](./DEPLOYMENT.md) 참고

```bash
# Vercel 배포
vercel --prod
```

## 📖 문서

- **[SETUP.md](./SETUP.md)**: 프로젝트 개요 및 기술 스펙
- **[DEPLOYMENT.md](./DEPLOYMENT.md)**: Supabase 설정 및 Vercel 배포 가이드

## 🎨 화면 구성

### 1. 메인 페이지 (`/`)
- 등록된 모든 앱 목록
- 앱 이름, 패키지명, 플랫폼, 등록일 표시
- 새 앱 등록 버튼

### 2. 앱 등록 페이지 (`/apps/new`)
- 새로운 앱 등록 폼
- 필수 정보: 앱 이름, 패키지명, 플랫폼
- 선택 정보: 아이콘 URL, 설명

### 3. 앱 상세 페이지 (`/apps/[id]`)
- 등록된 버전 목록
- 새 버전 등록 폼
- 버전별 강제 업데이트 설정
- API 엔드포인트 정보

## 🔌 API 엔드포인트

### 버전 체크 API (모바일 앱용)

```
GET /api/version-check
  ?packageName=com.nanacrew.airnote
  &currentVersion=1.0.0
  &platform=android
```

**응답 예시:**

```json
{
  "latest_version": "1.2.0",
  "minimum_version": "1.0.0",
  "needs_update": true,
  "force_update": false,
  "update_message": "새로운 기능이 추가되었습니다",
  "download_url": "https://play.google.com/store/apps/details?id=com.nanacrew.airnote",
  "features": ["버그 수정", "성능 개선"],
  "release_date": "2026-02-02T10:00:00Z"
}
```

### 관리 API (어드민용)

```
GET  /api/apps                  # 앱 목록
POST /api/apps                  # 앱 생성

GET  /api/apps/[id]/versions    # 버전 목록
POST /api/apps/[id]/versions    # 버전 생성
```

## 📱 Flutter 앱 연동 예시

### 1. VersionService 설정

```dart
// lib/services/version_service.dart
static const String _versionCheckBaseUrl = String.fromEnvironment(
  'VERSION_CHECK_URL',
  defaultValue: '',
);
```

### 2. 앱 실행 시 환경 변수 전달

```bash
flutter run --dart-define=VERSION_CHECK_URL=https://nanacrew-admin.vercel.app
```

### 3. 빌드 시 환경 변수 전달

```bash
flutter build apk --dart-define=VERSION_CHECK_URL=https://nanacrew-admin.vercel.app
```

## 🗄️ 데이터베이스 스키마

### apps 테이블
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | 기본 키 |
| name | TEXT | 앱 이름 |
| package_name | TEXT | 패키지명 (고유값) |
| platform | TEXT | 플랫폼 (android/ios) |
| icon_url | TEXT | 아이콘 URL (선택) |
| description | TEXT | 설명 (선택) |
| created_at | TIMESTAMPTZ | 생성일 |
| updated_at | TIMESTAMPTZ | 수정일 |

### app_versions 테이블
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | 기본 키 |
| app_id | UUID | 앱 ID (외래 키) |
| version | TEXT | 버전 번호 |
| minimum_version | TEXT | 최소 버전 |
| force_update | BOOLEAN | 강제 업데이트 여부 |
| update_message | TEXT | 업데이트 메시지 |
| release_date | TIMESTAMPTZ | 출시일 |
| download_url | TEXT | 다운로드 URL |
| features | JSONB | 주요 기능 목록 |
| created_at | TIMESTAMPTZ | 생성일 |

## 🎯 사용 시나리오

### 1. 새 앱 등록

1. 어드민 사이트에서 "새 앱 등록" 클릭
2. 앱 정보 입력 (이름, 패키지명, 플랫폼)
3. 등록 완료

### 2. 새 버전 배포

1. 앱 상세 페이지에서 "새 버전 등록" 클릭
2. 버전 정보 입력:
   - 버전 번호 (예: 1.2.0)
   - 최소 버전 (예: 1.0.0)
   - 강제 업데이트 여부 체크
   - 업데이트 메시지 및 주요 기능
3. 등록 완료

### 3. 모바일 앱에서 버전 체크

모바일 앱이 시작될 때 자동으로:

1. `/api/version-check` API 호출
2. 현재 버전과 비교
3. 업데이트 필요 시 다이얼로그 표시
4. 강제 업데이트일 경우 앱 사용 차단

## 🔐 보안 고려사항

- **API 인증**: 현재는 public API로 누구나 읽기 가능
- **RLS (Row Level Security)**: 프로덕션 배포 전 Supabase RLS 활성화 필요
- **관리자 인증**: Supabase Auth 연동 권장 (추후 구현)

## 🚧 향후 개발 계획

- [ ] 어드민 로그인 기능 (Supabase Auth)
- [ ] 앱별 사용자 통계 (app_analytics 활용)
- [ ] 버전별 다운로드 횟수 추적
- [ ] 이메일 알림 (새 버전 배포 시)
- [ ] A/B 테스트 지원
- [ ] iOS 앱 지원

## 📝 라이선스

MIT License

## 👥 개발

NanaCrew Team

---

**문의사항이나 버그 리포트는 Issues를 통해 알려주세요!**
