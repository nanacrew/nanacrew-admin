import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

  await logger.info('Logout', {
    category: 'auth',
    details: 'User logged out',
    ipAddress
  })

  const response = NextResponse.json({ success: true })

  // 쿠키 삭제
  response.cookies.delete('session')

  return response
}
