import { NextResponse } from 'next/server'

export const runtime = 'edge'

export async function GET() {
  try {
    const blobBaseUrl = process.env.BLOB_BASE_URL || 'https://srcabmhmmkl5ishw.public.blob.vercel-storage.com'

    const fetchMeta = async (type) => {
      try {
        const response = await fetch(`${blobBaseUrl}/${type}_metadata.json`, {
          cache: 'no-store'
        })
        if (response.ok) {
          return await response.json()
        }
      } catch {
        // Ignore errors
      }
      return null
    }

    const [npl, kol2, realisasi, realisasi_kredit, posisi_kredit] = await Promise.all([
      fetchMeta('npl'),
      fetchMeta('kol2'),
      fetchMeta('realisasi'),
      fetchMeta('realisasi_kredit'),
      fetchMeta('posisi_kredit')
    ])

    return NextResponse.json({ npl, kol2, realisasi, realisasi_kredit, posisi_kredit })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
