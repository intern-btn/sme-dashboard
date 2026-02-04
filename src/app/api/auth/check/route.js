import { NextResponse } from 'next/server'
import { requireAuth } from '../../../../lib/auth.js'

export const runtime = 'edge'

export async function GET(request) {
  const authenticated = await requireAuth(request)
  if (authenticated) {
    return NextResponse.json({ authenticated: true })
  }
  return NextResponse.json({ authenticated: false }, { status: 401 })
}
