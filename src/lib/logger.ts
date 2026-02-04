import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type LogLevel = 'info' | 'warning' | 'error' | 'success'
type LogCategory = 'api' | 'database' | 'auth' | 'system'

interface LogOptions {
  level: LogLevel
  category: LogCategory
  appId?: string
  message: string
  details?: string
  ipAddress?: string
  userAgent?: string
}

export async function logEvent(options: LogOptions) {
  try {
    const { error } = await supabase
      .from('api_logs')
      .insert({
        level: options.level,
        category: options.category,
        app_id: options.appId || null,
        message: options.message,
        details: options.details || null,
        ip_address: options.ipAddress || null,
        user_agent: options.userAgent || null
      })

    if (error) {
      console.error('Failed to log event:', error)
    }
  } catch (error) {
    // 로그 실패는 앱 동작에 영향을 주지 않도록 조용히 처리
    console.error('Logger error:', error)
  }
}

// 편의 함수들
export const logger = {
  info: (message: string, options?: Partial<LogOptions>) =>
    logEvent({ level: 'info', category: 'api', message, ...options }),

  warning: (message: string, options?: Partial<LogOptions>) =>
    logEvent({ level: 'warning', category: 'api', message, ...options }),

  error: (message: string, options?: Partial<LogOptions>) =>
    logEvent({ level: 'error', category: 'api', message, ...options }),

  success: (message: string, options?: Partial<LogOptions>) =>
    logEvent({ level: 'success', category: 'api', message, ...options }),

  api: (message: string, options?: Partial<Omit<LogOptions, 'category'>>) =>
    logEvent({ level: 'info', category: 'api', message, ...options }),

  database: (message: string, options?: Partial<Omit<LogOptions, 'category'>>) =>
    logEvent({ level: 'info', category: 'database', message, ...options }),

  system: (message: string, options?: Partial<Omit<LogOptions, 'category'>>) =>
    logEvent({ level: 'info', category: 'system', message, ...options })
}
