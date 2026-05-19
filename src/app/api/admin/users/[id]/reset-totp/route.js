import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '../../../../../../lib/db.js'
import { getClientIp, getUserAgent } from '../../../../../../lib/request-meta.js'

export const runtime = 'nodejs'

export async function POST(request, { params }) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token || token.role !== 'admin' || token.totpVerified !== true) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const target = await prisma.user.findUnique({ where: { id } })
  if (!target) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  await prisma.user.update({
    where: { id },
    data: {
      totpSecret: null,
      totpEnabled: false,
    },
  })

  await prisma.securityAuditLog.create({
    data: {
      userId: id,
      actorUserId: token.sub,
      action: 'totp_reset',
      ip: getClientIp(request),
      userAgent: getUserAgent(request),
    },
  })

  return NextResponse.json({ ok: true })
}
