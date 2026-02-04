import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
