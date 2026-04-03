import { NextResponse } from 'next/server'
import { getStorage } from '../../../lib/storage/index.js'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const storage = getStorage()

    const [npl, kol2, realisasi, realisasi_kredit, posisi_kredit, prk_spbu] = await Promise.all([
      storage.get('npl_metadata.json'),
      storage.get('kol2_metadata.json'),
      storage.get('realisasi_metadata.json'),
      storage.get('realisasi_kredit_metadata.json'),
      storage.get('posisi_kredit_metadata.json'),
      storage.get('prk_spbu_metadata.json'),
    ])

    return NextResponse.json({ npl, kol2, realisasi, realisasi_kredit, posisi_kredit, prk_spbu })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
