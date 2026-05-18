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
  const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&'
  const buf = crypto.randomBytes(16)
  let out = ''
  for (let i = 0; i < 16; i++) out += charset[buf[i] % charset.length]
  return out
}

