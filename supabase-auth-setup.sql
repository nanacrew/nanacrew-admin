-- 관리자 계정 테이블 생성
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 기본 관리자 계정 생성 (비밀번호: admin123)
-- bcrypt hash for "admin123": $2a$10$rOE5YmVH5KH/YZzJGqFKy.ZRN9Y9pQHvFV1Y4hDZvKXjv7I1Qz7Uu
INSERT INTO admin_users (email, password_hash, name)
VALUES (
  'admin@nanacrew.com',
  '$2a$10$rOE5YmVH5KH/YZzJGqFKy.ZRN9Y9pQHvFV1Y4hDZvKXjv7I1Qz7Uu',
  'Admin'
);

-- 인덱스 생성
CREATE INDEX idx_admin_users_email ON admin_users(email);

-- RLS(Row Level Security) 비활성화 - API에서 인증 처리
ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;
