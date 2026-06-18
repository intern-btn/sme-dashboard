import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '../../../../lib/db.js'
import { hashPassword, generateTempPassword } from '../../../../lib/auth.js'
import { getClientIp, getUserAgent } from '../../../../lib/request-meta.js'

export const runtime = 'nodejs'

async function requireAdmin(request) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token || token.role !== 'admin' || token.totpVerified !== true) return null
  return token
}

// GET /api/auth/users — list all users (admin only)
export async function GET(request) {
  const token = await requireAdmin(request)
  if (!token) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      displayName: true,
      role: true,
      accessScope: true,
      kanwil: true,
      cabang: true,
      isActive: true,
      mustChangePassword: true,
      totpEnabled: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  })
  return NextResponse.json({ users })
}

// POST /api/auth/users — create a new user (admin only), auto-generates password
export async function POST(request) {
  const token = await requireAdmin(request)
  if (!token) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json().catch(() => ({}))
  const { username, displayName, role, accessScope: rawScope, kanwil, cabang } = body
  if (!username || !displayName || !role) {
    return NextResponse.json({ error: 'username, displayName, role are required' }, { status: 400 })
  }

  const validRoles = ['staff', 'manager', 'admin']
  if (!validRoles.includes(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  }

  // Admin role always gets national scope
  const accessScope = role === 'admin' ? 'national' : (rawScope || 'national')
  const validScopes = ['national', 'kanwil', 'cabang']
  if (!validScopes.includes(accessScope)) {
    return NextResponse.json({ error: 'Invalid accessScope' }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { username } })
  if (existing) return NextResponse.json({ error: 'Username already exists' }, { status: 409 })

  const tempPassword = generateTempPassword()
  const passwordHash = await hashPassword(tempPassword)

  const newUser = await prisma.user.create({
    data: {
      username,
      passwordHash,
      displayName,
      role,
      accessScope,
      kanwil: accessScope !== 'national' ? (kanwil || null) : null,
      cabang: accessScope === 'cabang' ? (cabang || null) : null,
      mustChangePassword: true,
    },
    select: {
      id: true,
      username: true,
      displayName: true,
      role: true,
      accessScope: true,
      kanwil: true,
      cabang: true,
      isActive: true,
      mustChangePassword: true,
      totpEnabled: true,
      createdAt: true,
    },
  })

  await prisma.securityAuditLog.create({
    data: {
      userId: newUser.id,
      actorUserId: token.sub,
      action: 'user_create',
      ip: getClientIp(request),
      userAgent: getUserAgent(request),
    },
  })

  return NextResponse.json({ user: newUser, tempPassword }, { status: 201 })
}

// PATCH /api/auth/users — update a user (admin only)
export async function PATCH(request) {
  const token = await requireAdmin(request)
  if (!token) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json().catch(() => ({}))
  const { id, displayName, role, accessScope: rawScope, kanwil, cabang, isActive } = body
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  if (role !== undefined) {
    const validRoles = ['staff', 'manager', 'admin']
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }
  }

  if (rawScope !== undefined) {
    const validScopes = ['national', 'kanwil', 'cabang']
    if (!validScopes.includes(rawScope)) {
      return NextResponse.json({ error: 'Invalid accessScope' }, { status: 400 })
    }
  }

  // Derive effective scope (admin always national)
  const effectiveRole = role !== undefined ? role : undefined
  const effectiveScope = effectiveRole === 'admin'
    ? 'national'
    : (rawScope !== undefined ? rawScope : undefined)

  // Self-demote guard
  if (id === token.sub && role !== undefined && role !== token.role) {
    return NextResponse.json({ error: 'Tidak dapat mengubah role akun sendiri' }, { status: 403 })
  }

  // Self-deactivate guard
  if (id === token.sub && isActive === false) {
    return NextResponse.json({ error: 'Tidak dapat menonaktifkan akun sendiri' }, { status: 403 })
  }

  // Last-admin protection: fetch target to know their current role/state
  const targetUser = await prisma.user.findUnique({ where: { id } })
  if (!targetUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const isDemotingAdmin = targetUser.role === 'admin' && role !== undefined && role !== 'admin'
  const isDeactivatingAdmin = targetUser.role === 'admin' && targetUser.isActive === true && isActive === false

  if (isDemotingAdmin || isDeactivatingAdmin) {
    // Note: TOCTOU race possible on concurrent requests (safe for SQLite which serialises writes,
    // but should use prisma.$transaction() if migrated to Postgres)
    const remaining = await prisma.user.count({
      where: { role: 'admin', isActive: true, id: { not: id } },
    })
    if (remaining === 0) {
      return NextResponse.json(
        { error: 'Tidak dapat menonaktifkan atau mendemosi admin terakhir' },
        { status: 409 }
      )
    }
  }

  const updateData = {}
  if (displayName !== undefined) updateData.displayName = displayName
  if (role !== undefined) updateData.role = role
  if (effectiveScope !== undefined) {
    updateData.accessScope = effectiveScope
    if (effectiveScope === 'national') {
      updateData.kanwil = null
      updateData.cabang = null
    }
  }
  if (kanwil !== undefined && effectiveScope !== 'national') updateData.kanwil = kanwil || null
  if (cabang !== undefined) updateData.cabang = (effectiveScope === 'cabang' ? (cabang || null) : null)
  if (isActive !== undefined) updateData.isActive = isActive

  const updated = await prisma.user.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      username: true,
      displayName: true,
      role: true,
      accessScope: true,
      kanwil: true,
      cabang: true,
      isActive: true,
      mustChangePassword: true,
      totpEnabled: true,
    },
  })

  let action = 'user_update'
  if (isActive === false) action = 'user_deactivate'
  else if (isActive === true) action = 'user_activate'

  await prisma.securityAuditLog.create({
    data: {
      userId: id,
      actorUserId: token.sub,
      action,
      ip: getClientIp(request),
      userAgent: getUserAgent(request),
    },
  })

  return NextResponse.json({ user: updated })
}

// DELETE /api/auth/users — delete a user (admin only)
export async function DELETE(request) {
  const token = await requireAdmin(request)
  if (!token) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json().catch(() => ({}))
  const { id, confirmUsername } = body
  if (!id || !confirmUsername) {
    return NextResponse.json({ error: 'id and confirmUsername are required' }, { status: 400 })
  }

  // Self-delete guard
  if (id === token.sub) {
    return NextResponse.json({ error: 'Tidak dapat menghapus akun sendiri' }, { status: 403 })
  }

  const targetUser = await prisma.user.findUnique({ where: { id } })
  if (!targetUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  if (confirmUsername.trim() !== targetUser.username.trim()) {
    return NextResponse.json({ error: 'Username konfirmasi tidak cocok' }, { status: 400 })
  }

  // Last-admin protection
  if (targetUser.role === 'admin' && targetUser.isActive === true) {
    const remaining = await prisma.user.count({
      where: { role: 'admin', isActive: true, id: { not: id } },
    })
    if (remaining === 0) {
      return NextResponse.json(
        { error: 'Tidak dapat menghapus admin terakhir yang aktif' },
        { status: 409 }
      )
    }
  }

  // FK cleanup in correct order
  await prisma.totpAttempt.deleteMany({ where: { userId: id } })
  await prisma.securityAuditLog.updateMany({
    where: { actorUserId: id },
    data: { actorUserId: null },
  })
  await prisma.securityAuditLog.deleteMany({ where: { userId: id } })
  await prisma.user.delete({ where: { id } })

  await prisma.securityAuditLog.create({
    data: {
      userId: token.sub,
      actorUserId: token.sub,
      action: 'user_delete',
      dataType: 'deleted:' + targetUser.username,
      ip: getClientIp(request),
      userAgent: getUserAgent(request),
    },
  })

  return NextResponse.json({ ok: true })
}
