'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useLayoutEffect, useRef, useState } from 'react'

function isActive(pathname, href) {
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(`${href}/`)
}

export default function AppHeader({
  user = null,
  memoNavLinks = null,
  showMenuButton = false,
  onMenuClick = null,
}) {
  const pathname = usePathname()
  const role = user?.role
  const headerRef = useRef(null)
  const [headerHeight, setHeaderHeight] = useState(56)

  const mainNav = [
    { href: '/', label: 'Beranda' },
    { href: '/monitoring', label: 'Monitoring' },
    { href: '/spbu', label: 'SPBU' },
    { href: '/memo', label: 'Memo' },
    ...(role === 'admin' ? [{ href: '/admin', label: 'Admin' }] : []),
  ]

  useLayoutEffect(() => {
    const el = headerRef.current
    if (!el) return

    const update = () => {
      const next = Math.ceil(el.getBoundingClientRect().height || 0)
      if (next > 0) setHeaderHeight(next)
    }

    update()

    let ro = null
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(update)
      ro.observe(el)
    }

    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('resize', update)
      if (ro) ro.disconnect()
    }
  }, [memoNavLinks?.length, role])

  return (
    <>
      <header
        ref={headerRef}
        className="fixed inset-x-0 top-0 z-50 text-white shadow-md"
        style={{ backgroundColor: '#003d7a' }}
      >
        <div className="max-w-screen-xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {showMenuButton && (
              <button
                type="button"
                onClick={onMenuClick || (() => {})}
                className="sm:hidden inline-flex items-center justify-center w-9 h-9 rounded-lg hover:bg-blue-700/60"
                aria-label="Open menu"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}
            <Link href="/" className="flex items-center gap-3 opacity-95 hover:opacity-100 whitespace-nowrap">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/c/ca/BTN_2024.svg"
                alt="BTN"
                className="h-6 sm:h-7 w-auto object-contain block shrink-0"
              />
              <div className="flex flex-col leading-tight">
                <span className="font-semibold text-[15px] sm:text-base leading-none tracking-tight">
                  SME Dashboard
                </span>
                <span className="text-[11px] text-blue-200/90 mt-0.5">
                  v{process.env.NEXT_PUBLIC_APP_VERSION || 'dev'}
                </span>
              </div>
            </Link>
          </div>

          <nav className="hidden sm:flex items-center gap-1">
            {mainNav.map(item => {
              const active = isActive(pathname, item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    active ? 'bg-white text-blue-900' : 'text-blue-100 hover:bg-blue-700'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="flex items-center gap-2">
            {user && (
              <>
                <span className="hidden sm:block text-sm text-blue-100">{user.name}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-700 capitalize">{user.role}</span>
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="text-xs text-blue-200 hover:text-white ml-1"
                  type="button"
                >
                  Keluar
                </button>
              </>
            )}
          </div>
        </div>

        {memoNavLinks && memoNavLinks.length > 0 && (
          <div className="border-t border-blue-700/60">
            <div className="max-w-screen-xl mx-auto px-4 py-2 flex items-center gap-2 overflow-x-auto">
              {memoNavLinks.map(link => {
                const active = link.exact ? pathname === link.href : pathname.startsWith(link.href)
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                      active ? 'bg-white text-blue-900' : 'text-blue-100 hover:bg-blue-700'
                    }`}
                  >
                    {link.label}
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </header>
      <div aria-hidden style={{ height: headerHeight }} />
    </>
  )
}
