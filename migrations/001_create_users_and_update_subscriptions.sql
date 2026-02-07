-- ================================================
-- Migration: Create users table and update subscriptions
-- Description: 회원 관리 시스템 추가 및 구독 테이블 구조 변경
-- ================================================

-- 1. users 테이블 생성
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  user_identifier TEXT NOT NULL, -- 이메일, 전화번호 등 사용자 식별자
  name TEXT, -- 사용자 이름
  email TEXT, -- 이메일 (선택)
  phone TEXT, -- 전화번호 (선택)
  status TEXT NOT NULL DEFAULT 'active', -- active, inactive, suspended
  password_hash TEXT, -- 비밀번호 해시 (선택, 앱에서 자체 인증 시)
  notes TEXT, -- 관리자 메모
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES admin_users(id), -- 등록한 관리자

  -- 앱별로 user_identifier는 유일해야 함
  UNIQUE(app_id, user_identifier)
);

-- 2. users 테이블 인덱스 생성
CREATE INDEX idx_users_app_id ON users(app_id);
CREATE INDEX idx_users_user_identifier ON users(user_identifier);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- 3. subscriptions 테이블에 user_id 컬럼 추가
-- 기존 subscriptions 데이터를 users로 마이그레이션
DO $$
BEGIN
  -- user_id 컬럼이 없으면 추가
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'user_id'
  ) THEN
    -- user_id 컬럼 추가 (nullable로 먼저 추가)
    ALTER TABLE subscriptions ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE CASCADE;

    -- 기존 subscriptions 데이터를 users 테이블로 마이그레이션
    INSERT INTO users (app_id, user_identifier, status, created_at, created_by)
    SELECT DISTINCT
      app_id,
      user_identifier,
      CASE WHEN status = 'active' THEN 'active' ELSE 'inactive' END,
      created_at,
      created_by
    FROM subscriptions
    ON CONFLICT (app_id, user_identifier) DO NOTHING;

    -- subscriptions 테이블의 user_id 업데이트
    UPDATE subscriptions s
    SET user_id = u.id
    FROM users u
    WHERE s.app_id = u.app_id
      AND s.user_identifier = u.user_identifier;

    -- user_id를 NOT NULL로 변경
    ALTER TABLE subscriptions ALTER COLUMN user_id SET NOT NULL;

    -- user_identifier 컬럼은 유지 (하위 호환성)
    -- 나중에 제거할 수 있음: ALTER TABLE subscriptions DROP COLUMN user_identifier;
  END IF;
END $$;

-- 4. subscriptions 테이블 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);

-- 5. updated_at 자동 업데이트 트리거 (users)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 6. RLS (Row Level Security) 정책 설정
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Service role은 모든 권한
CREATE POLICY "Service role can do everything on users"
  ON users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 7. TypeScript 타입을 위한 주석
COMMENT ON TABLE users IS '앱 사용자 관리 테이블';
COMMENT ON COLUMN users.id IS '사용자 고유 ID';
COMMENT ON COLUMN users.app_id IS '앱 ID (apps 테이블 참조)';
COMMENT ON COLUMN users.user_identifier IS '사용자 식별자 (이메일, 전화번호 등)';
COMMENT ON COLUMN users.name IS '사용자 이름';
COMMENT ON COLUMN users.status IS '사용자 상태 (active, inactive, suspended)';
COMMENT ON COLUMN users.notes IS '관리자 메모';
COMMENT ON COLUMN users.created_by IS '등록한 관리자 ID';

COMMENT ON COLUMN subscriptions.user_id IS '사용자 ID (users 테이블 참조)';
