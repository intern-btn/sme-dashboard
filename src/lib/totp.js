import { generateSecret as createSecret, generateURI, verifySync } from 'otplib'
import { prisma } from './db.js'

const WINDOW_MS = 15 * 60 * 1000
const MAX_FAILURES = 10

export class TotpRateLimitError extends Error {
  constructor() {
    super('Too many TOTP attempts')
    this.name = 'TotpRateLimitError'
  }
}

export function generateTotpSecret() {
  return createSecret()
}

export function getTotpAuthUrl({ username, secret }) {
  return generateURI({
    issuer: 'BTN',
    label: `SME-Dashboard:${username}`,
    secret,
  })
}

export function verifyTotpCode({ code, secret }) {
  const result = verifySync({
    token: String(code || '').trim(),
    secret,
    epochTolerance: 1,
  })
  return result.valid === true
}

export async function assertTotpNotRateLimited(userId, context) {
  const since = new Date(Date.now() - WINDOW_MS)
  const failures = await prisma.totpAttempt.count({
    where: {
      userId,
      context,
      success: false,
      createdAt: { gte: since },
    },
  })

  if (failures >= MAX_FAILURES) throw new TotpRateLimitError()
}

export async function recordTotpAttempt({ userId, context, success, ip }) {
  await prisma.totpAttempt.create({
    data: {
      userId,
      context,
      success,
      ip: ip || '',
    },
  })
}

export async function verifyTotpWithRateLimit({ userId, context, code, secret, ip }) {
  await assertTotpNotRateLimited(userId, context)
  const success = !!verifyTotpCode({ code, secret })
  await recordTotpAttempt({ userId, context, success, ip })
  return success
}
