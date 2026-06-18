import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(req) {
  const { pathname } = req.nextUrl

  const isLoginPage = pathname === '/login'
  const isTotpPage = pathname === '/verify-otp'
  const isChangePwdPage = pathname === '/change-password'
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

  if (token.mustChangePassword === true) {
    if (isChangePwdPage) return NextResponse.next()
    const url = req.nextUrl.clone()
    url.pathname = '/change-password'
    url.search = ''
    return NextResponse.redirect(url)
  }

  // mustChangePassword is false — kick out of /change-password so it never becomes a TOTP callbackUrl
  if (isChangePwdPage) {
    const url = req.nextUrl.clone()
    url.pathname = '/'
    url.search = ''
    return NextResponse.redirect(url)
  }

  if (token.totpVerified !== true) {
    if (isTotpPage) return NextResponse.next()

    const callbackUrl = `${pathname}${req.nextUrl.search || ''}`
    const url = req.nextUrl.clone()
    url.pathname = '/verify-otp'
    url.search = ''
    url.searchParams.set('callbackUrl', callbackUrl)
    return NextResponse.redirect(url)
  }

  if (pathname.startsWith('/admin') && token?.role !== 'admin') {
    const url = req.nextUrl.clone()
    url.pathname = '/'
    url.search = ''
    return NextResponse.redirect(url)
  }

  if (pathname.startsWith('/monitoring/business') && token?.accessScope !== 'national') {
    const url = req.nextUrl.clone()
    url.pathname = '/monitoring'
    url.search = ''
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|gif|ico|css|js|map)$).*)'],
}
