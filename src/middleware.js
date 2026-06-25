import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

function noStore(response) {
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
  return response
}

export async function middleware(req) {
  const { pathname } = req.nextUrl

  const isLoginPage = pathname === '/login'
  const isTotpPage = pathname === '/verify-otp'
  const isChangePwdPage = pathname === '/change-password'
  const isAuthRoute = pathname.startsWith('/api/auth')

  if (isAuthRoute) return NextResponse.next()

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const isLoggedIn = !!token

  if (isLoginPage) {
    // redirect partially-authenticated users to the TOTP page
    if (token && token.totpVerified !== true && token.mustChangePassword !== true) {
      const url = req.nextUrl.clone()
      url.pathname = '/verify-otp'
      url.search = ''
      return noStore(NextResponse.redirect(url))
    }
    return noStore(NextResponse.next())
  }

  if (!isLoggedIn) {
    const callbackUrl = `${pathname}${req.nextUrl.search || ''}`
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('callbackUrl', callbackUrl)
    return noStore(NextResponse.redirect(url))
  }

  if (token.mustChangePassword === true) {
    if (isChangePwdPage) return noStore(NextResponse.next())
    const url = req.nextUrl.clone()
    url.pathname = '/change-password'
    url.search = ''
    return noStore(NextResponse.redirect(url))
  }

  // mustChangePassword is false — kick out of /change-password so it never becomes a TOTP callbackUrl
  if (isChangePwdPage) {
    const url = req.nextUrl.clone()
    url.pathname = '/'
    url.search = ''
    return noStore(NextResponse.redirect(url))
  }

  if (token.totpVerified !== true) {
    if (isTotpPage) return noStore(NextResponse.next())

    const callbackUrl = `${pathname}${req.nextUrl.search || ''}`
    const url = req.nextUrl.clone()
    url.pathname = '/verify-otp'
    url.search = ''
    url.searchParams.set('callbackUrl', callbackUrl)
    return noStore(NextResponse.redirect(url))
  }

  if (pathname.startsWith('/admin') && token?.role !== 'admin') {
    const url = req.nextUrl.clone()
    url.pathname = '/'
    url.search = ''
    return noStore(NextResponse.redirect(url))
  }

  if (pathname.startsWith('/monitoring/partnership') && token?.accessScope !== 'national') {
    const url = req.nextUrl.clone()
    url.pathname = '/monitoring'
    url.search = ''
    return noStore(NextResponse.redirect(url))
  }

  return noStore(NextResponse.next())
}

export const config = {
  matcher: ['/((?!_next|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|gif|ico|css|js|map)$).*)'],
}
