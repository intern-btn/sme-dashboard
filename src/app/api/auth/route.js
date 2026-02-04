import { NextResponse } from 'next/server'
import { createSessionToken, getAdminPassword, checkRateLimit, recordLoginAttempt } from '../../../lib/auth.js'

export const runtime = 'edge'

export async function POST(request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1'

  // Rate limit check
  const { allowed, retryAfter } = checkRateLimit(ip)
  if (!allowed) {
    return NextResponse.json(
      { error: `Too many failed attempts. Try again in ${retryAfter}s` },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    )
  }

  try {
    const { password } = await request.json()

    if (!password || typeof password !== 'string') {
      recordLoginAttempt(ip, false)
      return NextResponse.json({ error: 'Password required' }, { status: 400 })
    }

    const adminPassword = getAdminPassword()

    if (password !== adminPassword) {
      recordLoginAttempt(ip, false)
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
    }

    // Success — issue signed session cookie
    recordLoginAttempt(ip, true)
    const token = await createSessionToken()

    const response = NextResponse.json({ success: true })
    response.cookies.set('admin_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/'
    })
    return response
  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 })
  }
}
