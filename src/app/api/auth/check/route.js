import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export const runtime = 'nodejs'

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
}

export async function GET(request) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token) {
    return NextResponse.json(
      { authenticated: false },
      { status: 401, headers: NO_STORE_HEADERS }
    )
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      name: token.name,
      username: token.name,
      role: token.role,
      accessScope: token.accessScope || 'national',
      kanwil: token.kanwil || null,
      cabang: token.cabang || null,
      totpVerified: token.totpVerified === true,
      mustChangePassword: token.mustChangePassword === true,
    },
  }, { headers: NO_STORE_HEADERS })
}
