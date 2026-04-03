import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/db.js'
import bcrypt from 'bcryptjs'
import { getToken } from 'next-auth/jwt'

export const runtime = 'nodejs'

async function requireAdmin(request) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token || token.role !== 'admin') return null
  return token
}

// GET /api/auth/users — list all users (admin only)
export async function GET(request) {
  const admin = await requireAdmin(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const users = await prisma.user.findMany({
    select: { id: true, username: true, displayName: true, role: true, kanwil: true, isActive: true, createdAt: true },
    orderBy: { createdAt: 'asc' }
  })
  return NextResponse.json({ users })
}

// POST /api/auth/users — create a new user (admin only)
export async function POST(request) {
  const admin = await requireAdmin(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { username, password, displayName, role, kanwil } = await request.json()
  if (!username || !password || !displayName || !role) {
    return NextResponse.json({ error: 'username, password, displayName, role are required' }, { status: 400 })
  }

  const validRoles = ['viewer', 'editor', 'approver', 'admin']
  if (!validRoles.includes(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { username } })
  if (existing) return NextResponse.json({ error: 'Username already exists' }, { status: 409 })

  const passwordHash = await bcrypt.hash(password, 12)
  const newUser = await prisma.user.create({
    data: { username, passwordHash, displayName, role, kanwil: kanwil || null },
    select: { id: true, username: true, displayName: true, role: true, kanwil: true, isActive: true, createdAt: true }
  })
  return NextResponse.json({ user: newUser }, { status: 201 })
}

// PATCH /api/auth/users — update a user (admin only)
export async function PATCH(request) {
  const admin = await requireAdmin(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, displayName, role, kanwil, isActive, password } = await request.json()
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const updateData = {}
  if (displayName !== undefined) updateData.displayName = displayName
  if (role !== undefined) updateData.role = role
  if (kanwil !== undefined) updateData.kanwil = kanwil
  if (isActive !== undefined) updateData.isActive = isActive
  if (password) updateData.passwordHash = await bcrypt.hash(password, 12)

  const updated = await prisma.user.update({
    where: { id },
    data: updateData,
    select: { id: true, username: true, displayName: true, role: true, kanwil: true, isActive: true }
  })
  return NextResponse.json({ user: updated })
}
