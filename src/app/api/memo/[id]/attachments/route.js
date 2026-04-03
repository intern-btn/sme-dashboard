import { NextResponse } from 'next/server'
import { prisma } from '../../../../../lib/db.js'
import { getStorage } from '../../../../../lib/storage/index.js'
import { getToken } from 'next-auth/jwt'

export const runtime = 'nodejs'

async function getUser(request) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return null
  return { id: token.sub, name: token.name, role: token.role }
}

const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
]

export async function POST(request, { params }) {
  const user = await getUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const memo = await prisma.memo.findUnique({ where: { id } })
  if (!memo) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const formData = await request.formData()
  const file = formData.get('file')
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Only PDF, Word, JPG, PNG files are allowed' }, { status: 400 })
  }
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'File size must be under 10MB' }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const storageKey = `memo/${id}/${file.name}`
  const storage = getStorage()

  await storage.put(storageKey, buffer, { allowOverwrite: true })

  const attachments = JSON.parse(memo.attachments || '[]')
  if (!attachments.includes(storageKey)) attachments.push(storageKey)

  const updated = await prisma.memo.update({
    where: { id },
    data: { attachments: JSON.stringify(attachments) }
  })

  return NextResponse.json({
    key: storageKey,
    url: storage.getUrl(storageKey),
    attachments: JSON.parse(updated.attachments)
  })
}

export async function DELETE(request, { params }) {
  const user = await getUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { searchParams } = new URL(request.url)
  const key = searchParams.get('key')
  if (!key) return NextResponse.json({ error: 'key is required' }, { status: 400 })

  const memo = await prisma.memo.findUnique({ where: { id } })
  if (!memo) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await getStorage().delete(key)
  const attachments = JSON.parse(memo.attachments || '[]').filter(k => k !== key)
  await prisma.memo.update({ where: { id }, data: { attachments: JSON.stringify(attachments) } })

  return NextResponse.json({ success: true })
}
