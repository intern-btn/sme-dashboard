'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useLayoutEffect, useRef, useState, useEffect } from 'react'

function isActive(pathname, href) {
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(`${href}/`)
}

function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

function UserMenu({ user }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-blue-700/60 transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-[#e84e0f] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
          {getInitials(user.name)}
        </div>
        <div className="hidden sm:flex flex-col items-start leading-tight">
          <span className="text-sm text-white font-medium leading-none">{user.name}</span>
          <span className="text-[11px] text-blue-200 capitalize leading-none mt-0.5">{user.role}</span>
        </div>
        <svg className="w-3.5 h-3.5 text-blue-200 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#e84e0f] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                {getInitials(user.name)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 capitalize font-medium">
                  {user.role}
                </span>
              </div>
            </div>
          </div>
          <div className="p-2">
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors text-left"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Keluar
            </button>
          </div>
        </div>
      )}
    </div>
  )
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
            {user ? (
              <UserMenu user={user} />
            ) : (
              <Link
                href="/login"
                className="text-sm text-blue-200 hover:text-white"
              >
                Login
              </Link>
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
