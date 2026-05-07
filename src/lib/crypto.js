import crypto from 'crypto'

const IV_LENGTH = 12
const AUTH_TAG_LENGTH = 16
const KEY_BYTES = 32

function getEncryptionKey() {
  const key = process.env.TOTP_ENCRYPTION_KEY
  if (!key) throw new Error('TOTP_ENCRYPTION_KEY is not set')

  const buffer = Buffer.from(key, 'hex')
  if (buffer.length !== KEY_BYTES) {
    throw new Error('TOTP_ENCRYPTION_KEY must be 64 hex characters')
  }
  return buffer
}

export function encryptSecret(plaintext) {
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv('aes-256-gcm', getEncryptionKey(), iv)
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return Buffer.concat([iv, ciphertext, authTag]).toString('base64')
}

export function decryptSecret(blob) {
  const buffer = Buffer.from(blob, 'base64')
  const iv = buffer.subarray(0, IV_LENGTH)
  const authTag = buffer.subarray(buffer.length - AUTH_TAG_LENGTH)
  const ciphertext = buffer.subarray(IV_LENGTH, buffer.length - AUTH_TAG_LENGTH)
  const decipher = crypto.createDecipheriv('aes-256-gcm', getEncryptionKey(), iv)
  decipher.setAuthTag(authTag)
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8')
}

function base64Url(input) {
  return Buffer.from(input).toString('base64url')
}

function getUnlockSecret() {
  const secret = process.env.TOTP_UNLOCK_SECRET || process.env.NEXTAUTH_SECRET
  if (!secret) throw new Error('TOTP_UNLOCK_SECRET is not set')
  return secret
}

function timingSafeEqualString(a, b) {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  return left.length === right.length && crypto.timingSafeEqual(left, right)
}

export function signUnlockToken({ userId, dataType, expiresInSeconds = 900 }) {
  const payload = {
    userId,
    dataType,
    exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
  }
  const encodedPayload = base64Url(JSON.stringify(payload))
  const signature = crypto
    .createHmac('sha256', getUnlockSecret())
    .update(encodedPayload)
    .digest('base64url')
  return `${encodedPayload}.${signature}`
}

export function verifyUnlockToken(token, userId, dataType) {
  if (!token || !token.includes('.')) return false

  const [encodedPayload, signature] = token.split('.')
  const expectedSignature = crypto
    .createHmac('sha256', getUnlockSecret())
    .update(encodedPayload)
    .digest('base64url')

  if (!timingSafeEqualString(signature, expectedSignature)) return false

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'))
    return (
      payload.userId === userId &&
      payload.dataType === dataType &&
      typeof payload.exp === 'number' &&
      payload.exp > Math.floor(Date.now() / 1000)
    )
  } catch {
    return false
  }
}

export function hmacIdentifier(value) {
  const normalized = String(value || '').trim().toLowerCase()
  if (!normalized) return ''
  return crypto.createHmac('sha256', getUnlockSecret()).update(normalized).digest('base64url')
}
