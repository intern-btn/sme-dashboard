import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../../../auth.js'
import { prisma } from '../../../../../../lib/db.js'
import { getClientIp, getUserAgent } from '../../../../../../lib/request-meta.js'

export const runtime = 'nodejs'

export async function POST(request, { params }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || session.user.role !== 'admin' || session.user.totpVerified !== true) {
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
      actorUserId: session.user.id,
      action: 'totp_reset',
      ip: getClientIp(request),
      userAgent: getUserAgent(request),
    },
  })

  return NextResponse.json({ ok: true })
}
