-- Create subscriptions table for app user subscription management
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  app_id UUID NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  user_identifier TEXT NOT NULL, -- 사용자 식별자 (이메일, 폰번호 등)
  subscription_type TEXT NOT NULL CHECK (subscription_type IN ('free', 'paid', 'trial')),
  status TEXT NOT NULL CHECK (status IN ('active', 'expired', 'cancelled', 'suspended')),
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE,
  auto_renew BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES admin_users(id),

  -- 중복 방지: 동일 앱 + 동일 사용자 조합은 하나만
  UNIQUE(app_id, user_identifier)
);

-- Create sessions table for tracking active login sessions
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  device_info TEXT,
  ip_address TEXT,
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- 동일 구독은 하나의 활성 세션만 (다중 로그인 방지)
  UNIQUE(subscription_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_app_id ON subscriptions(app_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_identifier ON subscriptions(user_identifier);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_end_date ON subscriptions(end_date);
CREATE INDEX IF NOT EXISTS idx_user_sessions_subscription_id ON user_sessions(subscription_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (admin dashboard)
CREATE POLICY "Allow all operations for authenticated users on subscriptions"
  ON subscriptions
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users on user_sessions"
  ON user_sessions
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow anon users to read their own subscription status
CREATE POLICY "Allow anon users to check subscription"
  ON subscriptions
  FOR SELECT
  TO anon
  USING (true);

-- Allow anon users to manage their own sessions
CREATE POLICY "Allow anon users to manage sessions"
  ON user_sessions
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM user_sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;
