'use client'

import { useCallback, useEffect, useState } from 'react'
import { SessionProvider } from 'next-auth/react'
import { usePathname, useRouter } from 'next/navigation'

const PUBLIC_PATHS = new Set(['/login'])

function isPublicPath(pathname) {
  return PUBLIC_PATHS.has(pathname)
}

function AuthRevalidator({ children }) {
  const pathname = usePathname()
  const router = useRouter()
  const protectedRoute = !isPublicPath(pathname)
  const [status, setStatus] = useState(protectedRoute ? 'checking' : 'authorized')

  const getCurrentPath = useCallback(() => {
    if (typeof window === 'undefined') return pathname || '/'
    return `${window.location.pathname}${window.location.search || ''}`
  }, [pathname])

  const redirectTo = useCallback((href) => {
    setStatus('checking')
    router.replace(href)
    router.refresh()
  }, [router])

  const redirectToLogin = useCallback(() => {
    const callbackUrl = getCurrentPath()
    router.replace(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`)
    router.refresh()
  }, [getCurrentPath, router])

  const enforceSessionState = useCallback((user) => {
    if (user?.mustChangePassword === true) {
      if (pathname !== '/change-password') redirectTo('/change-password')
      return pathname === '/change-password'
    }

    if (pathname === '/change-password') {
      redirectTo('/')
      return false
    }

    if (user?.totpVerified !== true) {
      if (pathname !== '/verify-otp') {
        redirectTo(`/verify-otp?callbackUrl=${encodeURIComponent(getCurrentPath())}`)
        return false
      }
      return true
    }

    if (pathname.startsWith('/admin') && user?.role !== 'admin') {
      redirectTo('/')
      return false
    }

    if (pathname.startsWith('/monitoring/partnership') && user?.accessScope !== 'national') {
      redirectTo('/monitoring')
      return false
    }

    return true
  }, [getCurrentPath, pathname, redirectTo])

  const verifyAuth = useCallback(async ({ hideWhileChecking = false } = {}) => {
    if (!protectedRoute) {
      setStatus('authorized')
      return true
    }

    if (hideWhileChecking) setStatus('checking')

    try {
      const res = await fetch('/api/auth/check', {
        cache: 'no-store',
        credentials: 'same-origin',
      })

      if (!res.ok) {
        setStatus('checking')
        redirectToLogin()
        return false
      }

      const data = await res.json()
      if (!enforceSessionState(data?.user)) return false

      setStatus('authorized')
      return true
    } catch {
      setStatus('checking')
      redirectToLogin()
      return false
    }
  }, [protectedRoute, redirectToLogin])

  useEffect(() => {
    verifyAuth({ hideWhileChecking: true })
  }, [verifyAuth])

  useEffect(() => {
    if (!protectedRoute) return

    const handlePageShow = () => {
      verifyAuth({ hideWhileChecking: true })
    }

    const handleFocus = () => {
      verifyAuth()
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') verifyAuth()
    }

    window.addEventListener('pageshow', handlePageShow)
    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('pageshow', handlePageShow)
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [protectedRoute, verifyAuth])

  if (protectedRoute && status !== 'authorized') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-700 rounded-full animate-spin" />
      </div>
    )
  }

  return children
}

export default function AuthProvider({ children }) {
  return (
    <SessionProvider>
      <AuthRevalidator>{children}</AuthRevalidator>
    </SessionProvider>
  )
}
