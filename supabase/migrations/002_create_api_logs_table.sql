-- Create api_logs table for tracking system logs
CREATE TABLE IF NOT EXISTS api_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  level TEXT NOT NULL CHECK (level IN ('info', 'warning', 'error', 'success')),
  category TEXT NOT NULL CHECK (category IN ('api', 'database', 'auth', 'system')),
  message TEXT NOT NULL,
  details TEXT,
  ip_address TEXT,
  user_agent TEXT,
  app_id UUID REFERENCES apps(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_api_logs_timestamp ON api_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_api_logs_level ON api_logs(level);
CREATE INDEX IF NOT EXISTS idx_api_logs_category ON api_logs(category);
CREATE INDEX IF NOT EXISTS idx_api_logs_app_id ON api_logs(app_id);
CREATE INDEX IF NOT EXISTS idx_api_logs_created_at ON api_logs(created_at);

-- Enable RLS
ALTER TABLE api_logs ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (admin dashboard)
CREATE POLICY "Allow all operations for authenticated users"
  ON api_logs
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow insert for anon users (for app logging)
CREATE POLICY "Allow insert for anon users"
  ON api_logs
  FOR INSERT
  TO anon
  WITH CHECK (true);
