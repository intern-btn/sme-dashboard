import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/db.js'
import { getToken } from 'next-auth/jwt'

export const runtime = 'nodejs'

// GET /api/memo/tracking — lightweight list of all memos with tracking fields
// (used by Dashboard & Monitor SLA pages)
export async function GET(request) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const memos = await prisma.memo.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, nomorMemo: true, category: true, perihal: true,
      dari: true, status: true, createdBy: true,
      tanggalMemo: true, createdAt: true,
      trackingStep: true, stepHistory: true, slaHours: true,
      trackingRoles: true, trackingStartedAt: true, trackingCompletedAt: true,
    },
  })

  return NextResponse.json({ memos })
}
