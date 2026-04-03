import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(req) {
  const { pathname } = req.nextUrl

  const isLoginPage = pathname === '/login'
  const isAuthRoute = pathname.startsWith('/api/auth')

  if (isLoginPage || isAuthRoute) return NextResponse.next()

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const isLoggedIn = !!token

  if (!isLoggedIn) {
    const callbackUrl = `${pathname}${req.nextUrl.search || ''}`
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('callbackUrl', callbackUrl)
    return NextResponse.redirect(url)
  }

  if (pathname.startsWith('/admin') && token?.role !== 'admin') {
    const url = req.nextUrl.clone()
    url.pathname = '/'
    url.search = ''
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|gif|ico|css|js|map)$).*)'],
}

