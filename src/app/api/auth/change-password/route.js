import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../auth.js'
import { prisma } from '../../../../lib/db.js'
import { hashPassword, verifyPassword } from '../../../../lib/auth.js'
import { getClientIp, getUserAgent } from '../../../../lib/request-meta.js'

export const runtime = 'nodejs'

export async function POST(request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { currentPassword, newPassword } = await request.json().catch(() => ({}))

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: 'currentPassword dan newPassword wajib diisi' }, { status: 400 })
  }
  if (newPassword.length < 10) {
    return NextResponse.json({ error: 'Password baru minimal 10 karakter' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user || !user.isActive) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const currentValid = await verifyPassword(currentPassword, user.passwordHash)
  if (!currentValid) {
    return NextResponse.json({ error: 'Password saat ini salah' }, { status: 400 })
  }

  const sameAsOld = await verifyPassword(newPassword, user.passwordHash)
  if (sameAsOld) {
    return NextResponse.json({ error: 'Password baru tidak boleh sama dengan password lama' }, { status: 400 })
  }

  const passwordHash = await hashPassword(newPassword)
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, mustChangePassword: false },
  })

  await prisma.securityAuditLog.create({
    data: {
      userId: user.id,
      actorUserId: user.id,
      action: 'user_password_change',
      ip: getClientIp(request),
      userAgent: getUserAgent(request),
    },
  })

  return NextResponse.json({ ok: true })
}
