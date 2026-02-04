import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const session = request.cookies.get('session')
  const isLoginPage = request.nextUrl.pathname === '/login'
  const isApiRoute = request.nextUrl.pathname.startsWith('/api')

  // API 라우트는 인증 체크 안 함 (각 API에서 처리)
  if (isApiRoute) {
    return NextResponse.next()
  }

  // 로그인 페이지는 세션이 있으면 홈으로 리다이렉트
  if (isLoginPage) {
    if (session) {
      return NextResponse.redirect(new URL('/', request.url))
    }
    return NextResponse.next()
  }

  // 세션이 없으면 로그인 페이지로 리다이렉트
  if (!session) {
    const url = new URL('/login', request.url)
    return NextResponse.redirect(url)
  }

  // 세션 검증
  try {
    const sessionData = JSON.parse(
      Buffer.from(session.value, 'base64').toString('utf-8')
    )

    // 세션이 7일 이상 지났으면 만료
    const sessionAge = Date.now() - sessionData.timestamp
    const maxAge = 7 * 24 * 60 * 60 * 1000 // 7일

    if (sessionAge > maxAge) {
      const url = new URL('/login', request.url)
      const response = NextResponse.redirect(url)
      response.cookies.delete('session')
      return response
    }

    return NextResponse.next()
  } catch (error) {
    // 세션 파싱 실패 시 로그인 페이지로
    const url = new URL('/login', request.url)
    const response = NextResponse.redirect(url)
    response.cookies.delete('session')
    return response
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
