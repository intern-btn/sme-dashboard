import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { getStorage } from '../../../../../lib/storage/index.js'
import { verifyUnlockToken } from '../../../../../lib/crypto.js'

export const runtime = 'nodejs'

const MODULE = {
  spbu: {
    prefixes: ['prk_spbu'],
    hasTrend: true,
    historyFlag: 'spbu',
    historySuffixes: ['prk_spbu'],
    label: 'PRK SPBU',
  },
  bpjs: {
    prefixes: ['bpjs'],
    hasTrend: true,
    historyFlag: 'bpjs',
    historySuffixes: ['bpjs'],
    label: 'BPJS',
  },
  indomaret: {
    prefixes: ['indomaret'],
    hasTrend: true,
    historyFlag: 'indomaret',
    historySuffixes: ['indomaret'],
    label: 'Indomaret',
  },
  credit: {
    prefixes: ['kol2', 'npl', 'realisasi', 'realisasi_kredit', 'posisi_kredit'],
    hasTrend: false,
    historyFlag: null,
    historySuffixes: ['kol2', 'npl', 'realisasi', 'realisasi_kredit', 'posisi_kredit', 'meta'],
    label: 'Credit Monitoring',
  },
}

export async function POST(request, { params }) {
  const { type } = await params

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (token.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const confirmToken = request.headers.get('x-confirm-token')
  if (!verifyUnlockToken(confirmToken, token.sub, 'admin_reset')) {
    return NextResponse.json({ error: 'Token konfirmasi tidak valid atau kadaluarsa' }, { status: 401 })
  }

  const mod = MODULE[type]
  if (!mod) return NextResponse.json({ error: `Modul tidak dikenal: ${type}` }, { status: 400 })

  const storage = getStorage()

  for (const prefix of mod.prefixes) {
    await storage.delete(`${prefix}_parsed.json`)
    await storage.delete(`${prefix}_metadata.json`)
    if (mod.hasTrend) {
      await storage.delete(`${prefix}_trend_parsed.json`)
      await storage.delete(`${prefix}_trend_metadata.json`)
    }
  }

  const index = (await storage.get('history_index.json')) || { entries: [] }
  const isTarget = mod.historyFlag
    ? (e) => e[mod.historyFlag] === true
    : (e) => Array.isArray(e.parsedSheets)

  const toRemove = index.entries.filter(isTarget)
  const kept = index.entries.filter((e) => !isTarget(e))

  for (const entry of toRemove) {
    for (const suffix of mod.historySuffixes) {
      await storage.delete(`history/${entry.uploadId}_${suffix}.json`)
    }
  }
  await storage.put('history_index.json', { entries: kept })

  const auditLog = (await storage.get('admin_audit_log.json')) || { entries: [] }
  auditLog.entries.unshift({
    timestamp: new Date().toISOString(),
    adminEmail: token.email || token.name,
    action: 'reset_idas',
    module: mod.label,
    detail: `${toRemove.length} history snapshot dihapus`,
  })
  auditLog.entries = auditLog.entries.slice(0, 200)
  await storage.put('admin_audit_log.json', auditLog)

  return NextResponse.json({ success: true, removed: toRemove.length })
}
