import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export const runtime = 'edge'

export async function GET(request) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }

  return NextResponse.json({
    authenticated: true,
    user: { name: token.name, username: token.name, role: token.role },
  })
}
