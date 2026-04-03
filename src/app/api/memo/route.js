import { NextResponse } from 'next/server'
import { prisma } from '../../../lib/db.js'
import { getToken } from 'next-auth/jwt'

export const runtime = 'nodejs'

async function getUser(request) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return null
  return { id: token.sub, name: token.name, role: token.role }
}

export async function GET(request) {
  const user = await getUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const category = searchParams.get('category')
  const search = searchParams.get('search')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = 20

  const where = {}
  if (status) where.status = status
  if (category) where.category = category
  if (search) {
    where.OR = [
      { perihal: { contains: search } },
      { nomorMemo: { contains: search } },
      { dari: { contains: search } },
      { createdBy: { contains: search } },
    ]
  }

  const [memos, total] = await Promise.all([
    prisma.memo.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true, nomorMemo: true, category: true, perihal: true,
        dari: true, status: true, createdBy: true,
        tanggalMemo: true, createdAt: true, updatedAt: true,
      }
    }),
    prisma.memo.count({ where }),
  ])

  return NextResponse.json({ memos, total, page, totalPages: Math.ceil(total / limit) })
}

export async function POST(request) {
  const user = await getUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const {
    nomorMemo, category, perihal, kepada, dari,
    tanggalMemo, konten, lampiranList, tembusan, metadata
  } = body

  const memo = await prisma.memo.create({
    data: {
      nomorMemo: nomorMemo || '',
      category: category || 'general',
      perihal: perihal || '',
      kepada: JSON.stringify(kepada || []),
      dari: dari || '',
      tanggalMemo: tanggalMemo ? new Date(tanggalMemo) : new Date(),
      konten: konten || '',
      lampiranList: JSON.stringify(lampiranList || []),
      tembusan: JSON.stringify(tembusan || []),
      metadata: JSON.stringify(metadata || {}),
      createdBy: user.name,
      status: 'draft',
    }
  })

  return NextResponse.json({ memo }, { status: 201 })
}
