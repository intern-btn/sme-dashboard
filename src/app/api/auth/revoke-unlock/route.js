import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../auth.js'
import { prisma } from '../../../../lib/db.js'
import { getClientIp, getUserAgent } from '../../../../lib/request-meta.js'
import { normalizeBusinessDataType } from '../../../../lib/mask.js'

export const runtime = 'nodejs'

export async function POST(request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || session.user.totpVerified !== true) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const dataType = normalizeBusinessDataType(String(body.dataType || ''))
  if (!dataType) {
    return NextResponse.json({ error: 'Invalid data type' }, { status: 400 })
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set(`unlock_${dataType}`, '', {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 0,
    path: '/',
  })

  await prisma.securityAuditLog.create({
    data: {
      userId: session.user.id,
      action: 'revoke',
      dataType,
      ip: getClientIp(request),
      userAgent: getUserAgent(request),
    },
  })

  return response
}
