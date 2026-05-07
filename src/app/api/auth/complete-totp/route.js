import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../auth.js'
import { prisma } from '../../../../lib/db.js'
import { encryptSecret, decryptSecret } from '../../../../lib/crypto.js'
import { getClientIp, getUserAgent } from '../../../../lib/request-meta.js'
import { TotpRateLimitError, verifyTotpWithRateLimit } from '../../../../lib/totp.js'

export const runtime = 'nodejs'

export async function POST(request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const code = String(body.code || '').trim()
  const enrollmentSecret = typeof body.secret === 'string' ? body.secret.trim() : ''
  const ip = getClientIp(request)
  const userAgent = getUserAgent(request)

  if (!/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: 'Invalid code' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user || !user.isActive) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const secret = enrollmentSecret || (user.totpSecret ? decryptSecret(user.totpSecret) : '')
    if (enrollmentSecret && user.totpEnabled && user.totpSecret) {
      return NextResponse.json({ error: 'TOTP is already enrolled' }, { status: 400 })
    }
    if (!secret) {
      return NextResponse.json({ error: 'TOTP is not enrolled' }, { status: 400 })
    }

    const success = await verifyTotpWithRateLimit({
      userId: user.id,
      context: 'login',
      code,
      secret,
      ip,
    })

    if (!success) {
      return NextResponse.json({ error: 'Incorrect code' }, { status: 401 })
    }

    if (enrollmentSecret) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          totpSecret: encryptSecret(enrollmentSecret),
          totpEnabled: true,
        },
      })
      await prisma.securityAuditLog.create({
        data: {
          userId: user.id,
          action: 'totp_enroll',
          ip,
          userAgent,
        },
      })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof TotpRateLimitError) {
      return NextResponse.json({ error: 'Too many attempts' }, { status: 429 })
    }

    console.error('complete-totp failed:', error)
    return NextResponse.json({ error: 'TOTP verification failed' }, { status: 500 })
  }
}
