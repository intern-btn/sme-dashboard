import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '../../../../lib/db.js'
import { verifyPassword } from '../../../../lib/auth.js'
import { signUnlockToken } from '../../../../lib/crypto.js'

export const runtime = 'nodejs'

export async function POST(request) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (token.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { password } = await request.json()
  if (!password) return NextResponse.json({ error: 'Password wajib diisi' }, { status: 400 })

  const user = await prisma.user.findUnique({ where: { id: token.sub } })
  if (!user || !user.isActive) return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 401 })

  const valid = await verifyPassword(password, user.passwordHash)
  if (!valid) return NextResponse.json({ error: 'Password salah' }, { status: 401 })

  const confirmToken = signUnlockToken({ userId: token.sub, dataType: 'admin_reset', expiresInSeconds: 300 })
  return NextResponse.json({ confirmToken })
}
