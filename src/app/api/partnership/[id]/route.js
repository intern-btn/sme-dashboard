import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/db.js'
import { getToken } from 'next-auth/jwt'
import { serializeTasks } from '../../../../lib/partnership.js'

export const runtime = 'nodejs'

async function getUser(request) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return null
  return {
    id: token.sub,
    name: token.name,
    role: token.role,
    accessScope: token.accessScope || 'national',
    kanwil: token.kanwil || null,
    cabang: token.cabang || null,
  }
}

export async function GET(request, { params }) {
  const user = await getUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const p = await prisma.partnership.findUnique({ where: { id } })
  if (!p) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ partnership: { ...p, tasks: JSON.parse(p.tasks) } })
}

export async function PATCH(request, { params }) {
  const user = await getUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.accessScope !== 'national') {
    return NextResponse.json({ error: 'Forbidden: national access required' }, { status: 403 })
  }

  const { id } = await params
  const p = await prisma.partnership.findUnique({ where: { id } })
  if (!p) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await request.json()
  const { name, priority, startDate, endDate, comment, lastUpdateStatus, tasks } = body

  const updateData = { lastUpdateDate: new Date() }

  if (name !== undefined) updateData.name = name
  if (priority !== undefined) updateData.priority = priority
  if (startDate !== undefined) updateData.startDate = new Date(startDate)
  if (endDate !== undefined) updateData.endDate = new Date(endDate)
  if (comment !== undefined) updateData.comment = comment
  if (lastUpdateStatus !== undefined) updateData.lastUpdateStatus = lastUpdateStatus
  if (tasks !== undefined) {
    updateData.tasks = Array.isArray(tasks) ? serializeTasks(tasks) : tasks
  }

  const updated = await prisma.partnership.update({ where: { id }, data: updateData })
  return NextResponse.json({ partnership: { ...updated, tasks: JSON.parse(updated.tasks) } })
}

export async function DELETE(request, { params }) {
  const user = await getUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.accessScope !== 'national') {
    return NextResponse.json({ error: 'Forbidden: national access required' }, { status: 403 })
  }

  const { id } = await params
  const p = await prisma.partnership.findUnique({ where: { id } })
  if (!p) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.partnership.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
