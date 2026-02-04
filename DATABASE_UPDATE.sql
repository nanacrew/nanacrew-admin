-- 앱별 연관 서비스 관리 테이블
CREATE TABLE app_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID REFERENCES apps(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL CHECK (service_type IN ('supabase', 'vercel', 'firebase', 'github', 'play_store', 'app_store', 'other')),
  service_name TEXT NOT NULL,
  account_email TEXT,
  project_id TEXT,
  project_url TEXT,
  api_keys JSONB DEFAULT '{}'::jsonb, -- 암호화된 API 키들
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(app_id, service_type, service_name)
);

-- 인덱스
CREATE INDEX idx_services_app ON app_services(app_id);
CREATE INDEX idx_services_type ON app_services(service_type);

-- 코멘트
COMMENT ON TABLE app_services IS '앱별 연관 서비스 관리 (Supabase, Vercel, Firebase 등)';
COMMENT ON COLUMN app_services.service_type IS '서비스 종류: supabase, vercel, firebase, github, play_store, app_store, other';
COMMENT ON COLUMN app_services.api_keys IS '암호화된 API 키들 (JSON 형태, 민감 정보는 암호화 필수)';
