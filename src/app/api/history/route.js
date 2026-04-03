import { NextResponse } from 'next/server'
import { getStorage } from '../../../lib/storage/index.js'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const storage = getStorage()
    const historyIndex = await storage.get('history_index.json')

    if (!historyIndex) {
      return NextResponse.json({ history: [] })
    }

    const sortedHistory = (historyIndex.entries || [])
      .sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate))
      .slice(0, 20)

    return NextResponse.json({ history: sortedHistory })
  } catch {
    return NextResponse.json({ history: [] })
  }
}
