-- API 로그 테이블 생성
CREATE TABLE api_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  level TEXT NOT NULL CHECK (level IN ('info', 'warning', 'error', 'success')),
  category TEXT NOT NULL CHECK (category IN ('api', 'database', 'auth', 'system')),
  app_id UUID REFERENCES apps(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  details TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성 (빠른 조회를 위해)
CREATE INDEX idx_api_logs_timestamp ON api_logs(timestamp DESC);
CREATE INDEX idx_api_logs_level ON api_logs(level);
CREATE INDEX idx_api_logs_category ON api_logs(category);
CREATE INDEX idx_api_logs_app_id ON api_logs(app_id);
CREATE INDEX idx_api_logs_created_at ON api_logs(created_at DESC);

-- 30일 이상 된 로그 자동 삭제 함수
CREATE OR REPLACE FUNCTION delete_old_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM api_logs WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- 매일 자동 실행을 위한 cron job (Supabase에서 수동 설정 필요)
-- pg_cron 확장이 활성화되어 있다면:
-- SELECT cron.schedule('delete-old-logs', '0 2 * * *', 'SELECT delete_old_logs();');
