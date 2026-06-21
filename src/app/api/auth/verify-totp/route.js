import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../auth.js'
import { prisma } from '../../../../lib/db.js'
import { decryptSecret, signUnlockToken } from '../../../../lib/crypto.js'
import { getClientIp, getUserAgent } from '../../../../lib/request-meta.js'
import { normalizeBusinessDataType } from '../../../../lib/mask.js'
import { TotpRateLimitError, verifyTotpWithRateLimit } from '../../../../lib/totp.js'

export const runtime = 'nodejs'

export async function POST(request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || session.user.totpVerified !== true) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const code = String(body.code || '').trim()
  const dataType = normalizeBusinessDataType(String(body.dataType || ''))
  const ip = getClientIp(request)
  const userAgent = getUserAgent(request)

  if (!dataType) {
    return NextResponse.json({ error: 'Invalid data type' }, { status: 400 })
  }
  if (!/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: 'Invalid code' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user?.totpEnabled || !user.totpSecret) {
    return NextResponse.json({ error: 'TOTP is not enrolled' }, { status: 400 })
  }

  const context = `unlock_${dataType}`

  try {
    const success = await verifyTotpWithRateLimit({
      userId: user.id,
      context,
      code,
      secret: decryptSecret(user.totpSecret),
      ip,
    })

    if (!success) {
      return NextResponse.json({ error: 'Incorrect code' }, { status: 401 })
    }

    const response = NextResponse.json({ ok: true })
    response.cookies.set(`unlock_${dataType}`, signUnlockToken({ userId: user.id, dataType }), {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NEXTAUTH_URL?.startsWith('https://') ?? false,
      maxAge: 15 * 60,
      path: '/',
    })

    await prisma.securityAuditLog.create({
      data: {
        userId: user.id,
        action: 'unlock',
        dataType,
        ip,
        userAgent,
      },
    })

    return response
  } catch (error) {
    if (error instanceof TotpRateLimitError) {
      return NextResponse.json({ error: 'Too many attempts' }, { status: 429 })
    }

    console.error('verify-totp failed:', error)
    return NextResponse.json({ error: 'TOTP verification failed' }, { status: 500 })
  }
}
