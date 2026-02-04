const SESSION_DURATION_MS = 24 * 60 * 60 * 1000 // 24 hours
const MAX_LOGIN_ATTEMPTS = 5
const LOCKOUT_DURATION_MS = 15 * 60 * 1000 // 15 minutes

// In-memory rate limiter — resets on cold start.
// Sufficient for an internal tool; swap to KV/Redis for high-traffic deployments.
const loginAttempts = new Map()

function getSecret() {
  const secret = process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD
  if (!secret) {
    throw new Error('SESSION_SECRET or ADMIN_PASSWORD must be set in .env.local')
  }
  return secret
}

export function getAdminPassword() {
  const pw = process.env.ADMIN_PASSWORD
  if (!pw) {
    throw new Error('ADMIN_PASSWORD must be set in .env.local')
  }
  return pw
}

// HMAC-SHA256 via Web Crypto API (works in both edge and node runtimes)
async function hmacSign(data) {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(getSecret()),
    { name: 'HMAC', hash: { name: 'SHA-256' } },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data))
  return Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

// Create a signed session token: base64(payload).hmac(payload)
export async function createSessionToken() {
  const payload = btoa(JSON.stringify({
    exp: Date.now() + SESSION_DURATION_MS,
    iat: Date.now()
  }))
  const signature = await hmacSign(payload)
  return `${payload}.${signature}`
}

// Verify token signature and expiry
export async function verifySessionToken(token) {
  if (!token || typeof token !== 'string') return false
  try {
    const parts = token.split('.')
    if (parts.length !== 2) return false

    const [payload, signature] = parts
    const expectedSig = await hmacSign(payload)
    if (signature !== expectedSig) return false

    const { exp } = JSON.parse(atob(payload))
    return Date.now() < exp
  } catch {
    return false
  }
}

// Extract session cookie from request and verify
export async function requireAuth(request) {
  const cookie = request.cookies?.get?.('admin_session')
  return verifySessionToken(cookie?.value)
}

// --- Rate limiting helpers ---

export function checkRateLimit(ip) {
  const now = Date.now()
  const record = loginAttempts.get(ip)
  if (!record) return { allowed: true }

  if (now < record.lockedUntil) {
    return {
      allowed: false,
      retryAfter: Math.ceil((record.lockedUntil - now) / 1000)
    }
  }

  // Auto-clear stale records after lockout window passes
  if (now - record.lastAttempt > LOCKOUT_DURATION_MS) {
    loginAttempts.delete(ip)
  }
  return { allowed: true }
}

export function recordLoginAttempt(ip, success) {
  if (success) {
    loginAttempts.delete(ip)
    return
  }
  const now = Date.now()
  const record = loginAttempts.get(ip) || { count: 0, lastAttempt: 0, lockedUntil: 0 }
  record.count++
  record.lastAttempt = now
  if (record.count >= MAX_LOGIN_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_DURATION_MS
  }
  loginAttempts.set(ip, record)
}
