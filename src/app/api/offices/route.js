import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { getStorage } from '../../../lib/storage/index.js'
import { KANWIL_LIST } from '../../../lib/offices.js'

export const runtime = 'nodejs'

// GET /api/offices — returns kanwil list and cabang-kanwil map (admin only)
export async function GET(request) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token || token.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const storage = getStorage()

  // Try to build cabang list from parsed data files (best-available fallback chain)
  const dataSources = ['posisi_kredit_parsed.json', 'npl_parsed.json', 'kol2_parsed.json', 'realisasi_kredit_parsed.json']
  let cabangMap = {}

  for (const key of dataSources) {
    try {
      const parsed = await storage.get(key)
      if (parsed?.cabangData?.length) {
        for (const c of parsed.cabangData) {
          if (c.name && c.kanwil && !cabangMap[c.name]) {
            cabangMap[c.name] = c.kanwil
          }
        }
        break // one good source is enough
      }
    } catch {
      // continue to next source
    }
  }

  const cabangs = Object.entries(cabangMap)
    .map(([name, kanwil]) => ({ name, kanwil }))
    .sort((a, b) => a.kanwil.localeCompare(b.kanwil) || a.name.localeCompare(b.name))

  return NextResponse.json({ kanwils: KANWIL_LIST, cabangs })
}
