import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Client for public/anon operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Admin client with service role (bypasses RLS) - only for server-side use
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Database types
export type Platform = 'android' | 'ios'

export type App = {
  id: string
  name: string
  package_name: string
  platform: Platform[] // 배열로 변경 (다중 플랫폼 지원)
  icon_url?: string
  description?: string
  created_at: string
  updated_at: string
}

export type AppVersion = {
  id: string
  app_id: string
  version: string
  minimum_version: string
  force_update: boolean
  update_message?: string
  release_date: string
  download_url?: string
  features: string[]
  created_at: string
}

export type AppAnalytics = {
  id: string
  app_id: string
  date: string
  active_users: number
  version_distribution: Record<string, number>
  created_at: string
}

export type ServiceType = 'supabase' | 'vercel' | 'firebase' | 'github' | 'play_store' | 'app_store' | 'other'

export type AppService = {
  id: string
  app_id: string
  service_type: ServiceType
  service_name: string
  account_email?: string
  project_id?: string
  project_url?: string
  api_keys: Record<string, string>
  notes?: string
  created_at: string
  updated_at: string
}

export type UserStatus = 'active' | 'inactive' | 'suspended'

export type User = {
  id: string
  app_id: string
  user_identifier: string
  name?: string
  email?: string
  phone?: string
  status: UserStatus
  password_hash?: string
  notes?: string
  created_at: string
  updated_at: string
  created_by?: string
}

export type Subscription = {
  id: string
  app_id: string
  user_id: string
  user_identifier: string // 하위 호환성을 위해 유지
  subscription_type: 'free' | 'basic' | 'premium' | 'enterprise'
  status: 'active' | 'expired' | 'cancelled'
  start_date?: string
  end_date?: string
  notes?: string
  created_at: string
  updated_at: string
  created_by?: string
}

export type UserSession = {
  id: string
  subscription_id: string
  user_id: string
  session_token: string
  device_info?: string
  last_active: string
  expires_at: string
  created_at: string
}
