'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

type MenuItem = {
  title: string
  href: string
  icon: string
  badge?: string
}

type MenuSection = {
  title: string
  items: MenuItem[]
}

const menuSections: MenuSection[] = [
  {
    title: '메인',
    items: [
      { title: '대시보드', href: '/', icon: '📊' },
    ]
  },
  {
    title: '관리',
    items: [
      { title: '앱 관리', href: '/apps', icon: '📱' },
      { title: '구독 관리', href: '/subscriptions', icon: '💳' },
      { title: '통계', href: '/analytics', icon: '📈' },
      { title: '연관 서비스', href: '/services', icon: '🔗' },
    ]
  },
  {
    title: '개발',
    items: [
      { title: 'API 문서', href: '/docs', icon: '📚' },
    ]
  },
  {
    title: '시스템',
    items: [
      { title: '로그', href: '/logs', icon: '🔍' },
      { title: '설정', href: '/settings', icon: '⚙️' },
    ]
  }
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(href)
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <aside className="w-64 h-screen bg-white border-r border-gray-200 flex flex-col fixed left-0 top-0">
      {/* 헤더 */}
      <div className="p-6 border-b border-gray-200 flex-shrink-0">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-xl font-bold">N</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">NanaCrew</h1>
            <p className="text-xs text-gray-500">Admin System</p>
          </div>
        </Link>
      </div>

      {/* 네비게이션 */}
      <nav className="flex-1 overflow-y-auto p-4">
        {menuSections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="mb-6">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-3">
              {section.title}
            </h2>
            <ul className="space-y-1">
              {section.items.map((item, itemIndex) => {
                const active = isActive(item.href)
                return (
                  <li key={itemIndex}>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                        active
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      )}
                    >
                      <span className="text-lg">{item.icon}</span>
                      <span className="flex-1">{item.title}</span>
                      {item.badge && (
                        <span className="px-2 py-0.5 text-xs font-semibold bg-red-100 text-red-600 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* 푸터 */}
      <div className="p-4 border-t border-gray-200 space-y-3 flex-shrink-0">
        <Button
          variant="outline"
          className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700"
          onClick={handleLogout}
        >
          <span className="mr-2">🚪</span> 로그아웃
        </Button>
        <div className="px-3 py-2 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500">Version 1.0.0</p>
          <p className="text-xs text-gray-400 mt-1">© 2026 NanaCrew</p>
        </div>
      </div>
    </aside>
  )
}
