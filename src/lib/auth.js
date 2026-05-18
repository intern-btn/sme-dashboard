import bcrypt from 'bcryptjs'
import crypto from 'crypto'

export async function hashPassword(password) {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash)
}

// 16 chars, mixed-case + digits + safe symbols, ~95 bits entropy
export function generateTempPassword() {
  const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%&'
  const fairBound = 256 - (256 % charset.length) // eliminate modulo bias
  let out = ''
  while (out.length < 16) {
    const buf = crypto.randomBytes(32)
    for (let i = 0; i < buf.length && out.length < 16; i++) {
      if (buf[i] < fairBound) out += charset[buf[i] % charset.length]
    }
  }
  return out
}
