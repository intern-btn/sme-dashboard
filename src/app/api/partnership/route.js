import { NextResponse } from 'next/server'
import { prisma } from '../../../lib/db.js'
import { getToken } from 'next-auth/jwt'
import { defaultTasks, serializeTasks } from '../../../lib/partnership.js'

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

export async function GET(request) {
  const user = await getUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const results = await prisma.partnership.findMany({
    orderBy: { endDate: 'asc' },
  })

  const partnerships = results.map((p) => ({
    ...p,
    tasks: JSON.parse(p.tasks),
  }))

  return NextResponse.json({ partnerships })
}

export async function POST(request) {
  const user = await getUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.accessScope !== 'national') {
    return NextResponse.json({ error: 'Forbidden: national access required' }, { status: 403 })
  }

  const body = await request.json()
  const { name, priority, startDate, endDate, comment, lastUpdateStatus, tasks } = body

  const partnership = await prisma.partnership.create({
    data: {
      name: name || '',
      priority: priority || 'Medium',
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : new Date(),
      lastUpdateStatus: lastUpdateStatus || '',
      comment: comment || '',
      tasks: Array.isArray(tasks) && tasks.length > 0
        ? serializeTasks(tasks)
        : serializeTasks(defaultTasks(startDate || new Date())),
      lastUpdateDate: new Date(),
      createdBy: user.name,
    },
  })

  return NextResponse.json({ partnership }, { status: 201 })
}
