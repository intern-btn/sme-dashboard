import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../../../auth.js'
import { prisma } from '../../../../../../lib/db.js'
import { hashPassword, generateTempPassword } from '../../../../../../lib/auth.js'
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

  if (id === session.user.id) {
    return NextResponse.json({ error: 'Tidak dapat mereset password akun sendiri' }, { status: 403 })
  }

  const tempPassword = generateTempPassword()
  const passwordHash = await hashPassword(tempPassword)

  try {
    await prisma.user.update({
      where: { id },
      data: { passwordHash, mustChangePassword: true },
    })

    await prisma.securityAuditLog.create({
      data: {
        userId: id,
        actorUserId: session.user.id,
        action: 'user_password_reset',
        ip: getClientIp(request),
        userAgent: getUserAgent(request),
      },
    })
  } catch (err) {
    console.error('reset-password failed:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }

  return NextResponse.json({ tempPassword })
}
