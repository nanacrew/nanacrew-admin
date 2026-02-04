# NanaCrew Admin - 앱 버전 관리 시스템

## 🚀 프로젝트 개요

여러 모바일 앱의 버전을 관리하는 어드민 시스템

**주요 기능:**
- 앱 등록 및 관리
- 버전 관리 (강제 업데이트 설정)
- 사용자 통계 대시보드
- 버전 체크 API 제공

## 📋 기술 스택

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui
- **Backend**: Vercel API Routes
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Hosting**: Vercel

## 🔧 Supabase 프로젝트 생성 단계

### 1. Supabase 프로젝트 생성

1. https://supabase.com/ 접속 및 로그인
2. "New Project" 클릭
3. 프로젝트 정보 입력:
   - **Name**: nanacrew-admin
   - **Database Password**: 안전한 비밀번호 생성 (저장 필수!)
   - **Region**: Northeast Asia (Seoul)
4. "Create new project" 클릭 (약 2분 소요)

### 2. API 키 복사

프로젝트 생성 완료 후:

1. Settings → API 메뉴 이동
2. 다음 값들을 복사:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGciOiJ...` (긴 문자열)
   - **service_role key**: `eyJhbGciOiJ...` (긴 문자열)

### 3. 환경 변수 설정

`.env.local` 파일에 복사한 값 입력:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

### 4. 데이터베이스 스키마 생성

Supabase SQL Editor에서 다음 SQL 실행 예정:

```sql
-- apps 테이블
CREATE TABLE apps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  package_name TEXT UNIQUE NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('android', 'ios')),
  icon_url TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- app_versions 테이블
CREATE TABLE app_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID REFERENCES apps(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  minimum_version TEXT NOT NULL,
  force_update BOOLEAN DEFAULT FALSE,
  update_message TEXT,
  release_date TIMESTAMPTZ DEFAULT NOW(),
  download_url TEXT,
  features JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- app_analytics 테이블
CREATE TABLE app_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID REFERENCES apps(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  active_users INTEGER DEFAULT 0,
  version_distribution JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(app_id, date)
);

-- 인덱스
CREATE INDEX idx_apps_package ON apps(package_name);
CREATE INDEX idx_versions_app ON app_versions(app_id);
CREATE INDEX idx_analytics_app_date ON app_analytics(app_id, date DESC);
```

## 📦 설치 및 실행

```bash
# 의존성 설치 (이미 완료됨)
npm install

# 개발 서버 실행
npm run dev

# 빌드
npm run build

# 프로덕션 실행
npm start
```

## 🔐 개발 상태

1. ✅ Next.js 프로젝트 생성
2. ✅ Supabase 클라이언트 설치
3. ✅ shadcn/ui 컴포넌트 설치
4. ✅ API Routes 개발
5. ✅ 어드민 UI 개발
6. ✅ Flutter 앱 VersionService 수정
7. ⏳ **Supabase 프로젝트 생성 및 배포** ← 다음 단계

## 📝 구현된 기능

### 🎯 완성된 API Routes

```
✅ GET  /api/apps                            # 앱 목록 조회
✅ POST /api/apps                            # 새 앱 등록

✅ GET  /api/apps/[id]/versions              # 버전 목록 조회
✅ POST /api/apps/[id]/versions              # 새 버전 등록

✅ GET  /api/version-check                   # 버전 체크 (Flutter 앱에서 호출)
     ?packageName=com.nanacrew.airnote
     &currentVersion=1.0.0
     &platform=android
```

### 🎨 완성된 UI 페이지

- ✅ **메인 페이지** (`/`): 등록된 앱 목록 테이블
- ✅ **앱 등록 페이지** (`/apps/new`): 새 앱 등록 폼
- ✅ **앱 상세 페이지** (`/apps/[id]`): 버전 관리 및 API 정보

### 📱 Flutter 앱 연동

- ✅ `VersionService` 수정: NanaCrew Admin API 호출
- ✅ 환경 변수 `VERSION_CHECK_URL`로 API 엔드포인트 설정
- ✅ API 실패 시 더미 데이터 fallback 유지

## 🔗 링크

- Supabase Dashboard: https://supabase.com/dashboard
- Vercel Dashboard: https://vercel.com/dashboard
- 로컬 개발: http://localhost:3000
