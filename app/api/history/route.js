import { NextResponse } from 'next/server'

export const runtime = 'edge'

export async function GET() {
  try {
    const blobBaseUrl = process.env.BLOB_BASE_URL || 'https://pgrnuw5fcdcfjo0d.public.blob.vercel-storage.com'

    // Fetch history index
    const response = await fetch(`${blobBaseUrl}/history_index.json`, {
      cache: 'no-store'
    })

    if (!response.ok) {
      return NextResponse.json({ history: [] })
    }

    const historyIndex = await response.json()

    // Get the last 20 entries, sorted by date descending
    const sortedHistory = (historyIndex.entries || [])
      .sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate))
      .slice(0, 20)

    return NextResponse.json({ history: sortedHistory })
  } catch (error) {
    return NextResponse.json({ history: [] })
  }
}
