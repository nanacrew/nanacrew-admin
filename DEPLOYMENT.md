# NanaCrew Admin 배포 가이드

## 📋 사전 준비

### 1. Supabase 프로젝트 생성

1. https://supabase.com/ 접속 및 로그인
2. "New Project" 클릭
3. 프로젝트 정보 입력:
   - **Name**: `nanacrew-admin`
   - **Database Password**: 안전한 비밀번호 생성 (저장 필수!)
   - **Region**: `Northeast Asia (Seoul)`
4. "Create new project" 클릭 (약 2분 소요)

### 2. Supabase API 키 복사

프로젝트 생성 완료 후:

1. **Settings → API** 메뉴로 이동
2. 다음 값들을 복사:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGciOiJ...` (긴 JWT 토큰)
   - **service_role key**: `eyJhbGci...` (긴 JWT 토큰)

### 3. 환경 변수 설정

`.env.local` 파일에 복사한 값 입력:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

### 4. 데이터베이스 스키마 생성

Supabase Dashboard → **SQL Editor**로 이동 후 다음 SQL 실행:

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

"Run" 버튼 클릭하여 실행

## 🚀 Vercel 배포

### 1. Vercel 프로젝트 생성

```bash
cd /Users/ddoni/Documents/DAESIN/DAESIN/nanacrew-admin

# Vercel CLI 설치 (처음 한 번만)
npm install -g vercel

# 배포
vercel
```

### 2. 초기 배포 질문 답변

```
? Set up and deploy "~/Documents/DAESIN/DAESIN/nanacrew-admin"? [Y/n] Y
? Which scope do you want to deploy to? [your-account]
? Link to existing project? [y/N] N
? What's your project's name? nanacrew-admin
? In which directory is your code located? ./
? Want to override the settings? [y/N] N
```

### 3. 환경 변수 설정

Vercel Dashboard에서:

1. 프로젝트 → **Settings → Environment Variables**
2. 다음 변수들을 추가:
   - `NEXT_PUBLIC_SUPABASE_URL`: Supabase Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anon key
   - `SUPABASE_SERVICE_ROLE_KEY`: Supabase service_role key

3. 모든 환경(Production, Preview, Development)에 적용

### 4. 재배포

환경 변수 설정 후:

```bash
vercel --prod
```

## 📱 Flutter 앱 연동

### 1. 배포된 URL 확인

Vercel 배포 완료 후 받은 URL (예: `https://nanacrew-admin.vercel.app`)

### 2. Flutter 앱에서 사용

**개발 시:**

```bash
cd /Users/ddoni/Documents/DAESIN/DAESIN/airnote-app

flutter run \
  --dart-define=VERSION_CHECK_URL=https://nanacrew-admin.vercel.app
```

**빌드 시:**

```bash
flutter build apk \
  --dart-define=VERSION_CHECK_URL=https://nanacrew-admin.vercel.app
```

### 3. 환경별 설정

**build.yaml** 또는 **launch.json**에 추가하면 매번 입력할 필요 없음:

```json
{
  "configurations": [
    {
      "name": "airnote-app",
      "request": "launch",
      "type": "dart",
      "args": [
        "--dart-define=VERSION_CHECK_URL=https://nanacrew-admin.vercel.app"
      ]
    }
  ]
}
```

## 🧪 테스트

### 1. 로컬에서 개발 서버 실행

```bash
cd /Users/ddoni/Documents/DAESIN/DAESIN/nanacrew-admin
npm run dev
```

http://localhost:3000 접속

### 2. 첫 번째 앱 등록

1. "새 앱 등록" 버튼 클릭
2. 정보 입력:
   - **앱 이름**: 에어노트
   - **패키지명**: com.nanacrew.airnote
   - **플랫폼**: Android
3. "앱 등록하기" 클릭

### 3. 첫 번째 버전 등록

1. 등록한 앱 클릭
2. "새 버전 등록" 버튼 클릭
3. 정보 입력:
   - **버전**: 1.0.0
   - **최소 버전**: 1.0.0
   - **업데이트 메시지**: 첫 번째 릴리스
   - **다운로드 URL**: Play Store URL
   - **강제 업데이트**: 체크 해제
4. "등록하기" 클릭

### 4. API 테스트

터미널에서:

```bash
curl "https://nanacrew-admin.vercel.app/api/version-check?packageName=com.nanacrew.airnote&currentVersion=1.0.0&platform=android"
```

응답 예시:

```json
{
  "latest_version": "1.0.0",
  "minimum_version": "1.0.0",
  "needs_update": false,
  "force_update": false,
  "update_message": "첫 번째 릴리스",
  "download_url": "https://play.google.com/...",
  "features": [],
  "release_date": "2026-02-02T..."
}
```

### 5. Flutter 앱에서 테스트

1. Flutter 앱 실행 (VERSION_CHECK_URL 환경 변수 포함)
2. 앱 시작 시 자동으로 버전 체크
3. 로그 확인:

```
[VersionService] API 버전 정보 가져오기 완료
  latest_version: 1.0.0
  force_update: false
  source: api
```

## 🔒 보안 설정

### 1. Row Level Security (RLS) 활성화

Supabase Dashboard → **Authentication → Policies**

현재는 개발 편의를 위해 RLS 비활성화되어 있음.
프로덕션 배포 전에 반드시 활성화 필요!

```sql
-- apps 테이블 RLS 활성화
ALTER TABLE apps ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽기 가능
CREATE POLICY "Anyone can read apps" ON apps
  FOR SELECT USING (true);

-- 인증된 사용자만 쓰기 가능 (Admin만 허용하도록 수정 필요)
CREATE POLICY "Authenticated users can manage apps" ON apps
  FOR ALL USING (auth.role() = 'authenticated');

-- app_versions도 동일하게 설정
ALTER TABLE app_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read versions" ON app_versions
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage versions" ON app_versions
  FOR ALL USING (auth.role() = 'authenticated');
```

### 2. CORS 설정

Vercel에서 자동으로 처리됨. 필요 시 `next.config.js`에서 수정 가능.

## 📊 모니터링

### Vercel Analytics

- 배포 상태: https://vercel.com/dashboard
- 로그 확인: Vercel Dashboard → Logs
- 에러 추적: Vercel Dashboard → Analytics

### Supabase 모니터링

- 데이터베이스 상태: Supabase Dashboard → Database
- API 사용량: Supabase Dashboard → Settings → Usage

## 🔗 유용한 링크

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Supabase Dashboard**: https://supabase.com/dashboard
- **Next.js 문서**: https://nextjs.org/docs
- **Supabase 문서**: https://supabase.com/docs

## ❓ 문제 해결

### "No matching client found for package name"

**원인**: Supabase에 데이터가 없거나 패키지명이 일치하지 않음
**해결**: 어드민 사이트에서 앱과 버전을 먼저 등록

### Flutter 앱에서 API 호출 실패

**원인**: VERSION_CHECK_URL 미설정 또는 잘못된 URL
**해결**: `--dart-define=VERSION_CHECK_URL=...` 옵션 확인

### Vercel 빌드 실패

**원인**: 환경 변수 미설정
**해결**: Vercel Dashboard → Environment Variables에서 확인

## 🎉 완료!

이제 NanaCrew Admin 시스템이 준비되었습니다.

다음 단계:
1. ✅ Supabase 프로젝트 생성
2. ✅ 데이터베이스 스키마 생성
3. ✅ Vercel 배포
4. ✅ Flutter 앱 연동
5. 🚀 Play Store에 앱 배포
6. 📈 버전 관리 시작!
