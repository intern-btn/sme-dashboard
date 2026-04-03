import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/db.js'
import { getToken } from 'next-auth/jwt'

export const runtime = 'nodejs'

async function getUser(request) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return null
  return { id: token.sub, name: token.name, role: token.role }
}

const ROLE_HIERARCHY = ['viewer', 'editor', 'approver', 'admin']
function hasRole(userRole, minRole) {
  return ROLE_HIERARCHY.indexOf(userRole) >= ROLE_HIERARCHY.indexOf(minRole)
}

export async function GET(request, { params }) {
  const user = await getUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const memo = await prisma.memo.findUnique({ where: { id } })
  if (!memo) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ memo })
}

export async function PATCH(request, { params }) {
  const user = await getUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json()
  const { action, ...fields } = body

  const memo = await prisma.memo.findUnique({ where: { id } })
  if (!memo) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const updateData = {}

  if (action) {
    switch (action) {
      case 'submit':
        if (!hasRole(user.role, 'editor')) return NextResponse.json({ error: 'Requires editor role' }, { status: 403 })
        if (memo.status !== 'draft') return NextResponse.json({ error: 'Only drafts can be submitted' }, { status: 400 })
        updateData.status = 'review'
        break

      case 'approve':
        if (!hasRole(user.role, 'approver')) return NextResponse.json({ error: 'Requires approver role' }, { status: 403 })
        if (memo.status !== 'review') return NextResponse.json({ error: 'Only review memos can be approved' }, { status: 400 })
        updateData.status = 'approved'
        updateData.approvedBy = user.name
        updateData.approvedAt = new Date()
        break

      case 'reject':
        if (!hasRole(user.role, 'approver')) return NextResponse.json({ error: 'Requires approver role' }, { status: 403 })
        if (memo.status !== 'review') return NextResponse.json({ error: 'Only review memos can be rejected' }, { status: 400 })
        updateData.status = 'draft'
        updateData.reviewedBy = user.name
        updateData.reviewedAt = new Date()
        updateData.notes = fields.notes || null
        break

      case 'distribute':
        if (!hasRole(user.role, 'approver')) return NextResponse.json({ error: 'Requires approver role' }, { status: 403 })
        if (memo.status !== 'approved') return NextResponse.json({ error: 'Only approved memos can be distributed' }, { status: 400 })
        updateData.status = 'distributed'
        updateData.distributedBy = user.name
        updateData.distributedAt = new Date()
        updateData.distributedTo = JSON.stringify(fields.distributedTo || [])
        break

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }
  } else {
    // Field update — draft only (or admin)
    if (memo.status !== 'draft' && !hasRole(user.role, 'admin')) {
      return NextResponse.json({ error: 'Can only edit draft memos' }, { status: 400 })
    }
    const editableFields = [
      'nomorMemo', 'category', 'perihal', 'dari', 'tanggalMemo',
      'konten', 'lampiranList', 'tembusan', 'metadata', 'kepada'
    ]
    for (const field of editableFields) {
      if (field in fields) {
        if (['kepada', 'lampiranList', 'tembusan', 'metadata'].includes(field)) {
          updateData[field] = JSON.stringify(fields[field])
        } else if (field === 'tanggalMemo') {
          updateData[field] = fields[field] ? new Date(fields[field]) : new Date()
        } else {
          updateData[field] = fields[field]
        }
      }
    }
  }

  const updated = await prisma.memo.update({ where: { id }, data: updateData })
  return NextResponse.json({ memo: updated })
}

export async function DELETE(request, { params }) {
  const user = await getUser(request)
  if (!user || !hasRole(user.role, 'admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  await prisma.memo.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
